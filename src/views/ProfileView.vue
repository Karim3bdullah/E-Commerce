<template>
  <div class="profile-page">
    <div class="profile-card">
      
      <div class="card-header">
        <div class="icon-box"><i class="fa-solid fa-user-gear"></i></div>
        <div>
          <h2>الملف الشخصي وإعدادات الحساب</h2>
          <p class="header-subtitle">قم بتخصيص صورتك الرمزية ومعلومات التوصيل الخاصة بك</p>
        </div>
      </div>

      <div v-if="pageLoading" class="loading-state">
        <div class="spinner"></div>
        <p>جاري جلب بياناتك...</p>
      </div>

      <div v-else class="profile-content">
        <!-- Avatar Customizer Section -->
        <div class="avatar-customizer-section">
          <div class="avatar-preview-wrapper" @click="triggerFileInput">
            <img v-if="photoPreview || formData.photoURL" :src="photoPreview || formData.photoURL" alt="User Avatar" class="avatar-photo" />
            <div v-else class="avatar-initials-fallback">
              {{ userInitials }}
            </div>
            
            <div class="avatar-overlay">
              <i v-if="isUploadingPhoto" class="fa-solid fa-circle-notch fa-spin"></i>
              <i v-else class="fa-solid fa-camera"></i>
              <span>تغيير الصورة</span>
            </div>
          </div>

          <div class="avatar-info-meta">
            <h4>الصورة الشخصية</h4>
            <p>صيغة JPG أو PNG بحجم أقصاه 2 ميجابايت. تظهر صورتك في المراجعات ورأس الموقع.</p>
            <div class="avatar-actions-row">
              <button type="button" class="upload-badge-btn" @click="triggerFileInput" :disabled="isUploadingPhoto">
                <i class="fa-solid fa-arrow-up-from-bracket"></i>
                {{ isUploadingPhoto ? 'جاري الرفع...' : 'رفع صورة جديدة' }}
              </button>
              <button v-if="formData.photoURL || photoPreview" type="button" class="remove-photo-btn" @click="removeAvatar" :disabled="isUploadingPhoto">
                حذف الصورة
              </button>
            </div>
          </div>

          <input 
            type="file" 
            ref="fileInputRef" 
            accept="image/*" 
            class="hidden-file-input" 
            @change="handleAvatarSelected" 
          />
        </div>

        <form @submit.prevent="updateUserProfile" class="profile-form">
          <div class="form-row">
            <div class="form-group">
              <label>الاسم الأول</label>
              <input type="text" v-model="formData.firstName" required placeholder="أحمد">
            </div>
            <div class="form-group">
              <label>اسم العائلة</label>
              <input type="text" v-model="formData.lastName" required placeholder="محمد">
            </div>
          </div>

          <div class="form-group">
            <label>البريد الإلكتروني (غير قابل للتعديل)</label>
            <input type="email" :value="currentUserEmail" disabled class="disabled-input">
          </div>

          <div class="form-group">
            <label>رقم الهاتف</label>
            <input type="tel" v-model="formData.phone" placeholder="01XXXXXXXXX" required>
          </div>

          <div class="form-group">
            <label>عنوان الشحن الافتراضي</label>
            <textarea 
              v-model="formData.address" 
              rows="3" 
              placeholder="المحافظة - المدينة - الشارع - رقم المبنى (لتسهيل الطلب لاحقاً)"
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="submit" class="save-btn" :disabled="isSubmitting || isUploadingPhoto">
              <span v-if="isSubmitting"><i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...</span>
              <span v-else><i class="fa-solid fa-floppy-disk"></i> حفظ التعديلات</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { auth, db, storage } from '../firebase/config'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { updateProfile as updateAuthProfile } from 'firebase/auth'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import Swal from 'sweetalert2'

const pageLoading = ref(true)
const isSubmitting = ref(false)
const isUploadingPhoto = ref(false)
const fileInputRef = ref(null)
const photoPreview = ref(null)
const selectedFile = ref(null)

const currentUserEmail = computed(() => auth.currentUser?.email || '')

const formData = ref({
  firstName: '',
  lastName: '',
  phone: '',
  address: '',
  photoURL: ''
})

const userInitials = computed(() => {
  if (formData.value.firstName && formData.value.lastName) {
    return (formData.value.firstName[0] + formData.value.lastName[0]).toUpperCase()
  }
  return 'US'
})

const triggerFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

const handleAvatarSelected = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  // Validate type
  if (!file.type.startsWith('image/')) {
    Swal.fire({
      icon: 'warning',
      title: 'صيغة غير مدعومة',
      text: 'يرجى اختيار ملف صورة صالح (JPG, PNG, WebP).'
    })
    return
  }

  // Validate size (< 2MB)
  const maxSize = 2 * 1024 * 1024
  if (file.size > maxSize) {
    Swal.fire({
      icon: 'error',
      title: 'حجم الصورة كبير جداً',
      text: 'عفواً، الحد الأقصى لحجم الصورة هو 2 ميجابايت.'
    })
    return
  }

  selectedFile.value = file
  photoPreview.value = URL.createObjectURL(file)

  // Direct background upload to Firebase Storage
  await uploadAvatarFile(file)
}

const uploadAvatarFile = async (file) => {
  if (!auth.currentUser) return
  isUploadingPhoto.value = true

  try {
    const fileExt = file.name.split('.').pop() || 'jpg'
    const userAvatarRef = storageRef(storage, `users/${auth.currentUser.uid}/avatar.${fileExt}`)
    
    await uploadBytes(userAvatarRef, file, { contentType: file.type })
    const downloadURL = await getDownloadURL(userAvatarRef)

    // Update Firebase Auth current user photoURL
    await updateAuthProfile(auth.currentUser, {
      photoURL: downloadURL
    })

    // Update Firestore User document
    const userDocRef = doc(db, 'users', auth.currentUser.uid)
    await updateDoc(userDocRef, {
      photoURL: downloadURL
    })

    formData.value.photoURL = downloadURL
    photoPreview.value = null

    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    })
    Toast.fire({
      icon: 'success',
      title: 'تم تحديث الصورة الشخصية بنجاح ✨'
    })
  } catch (err) {
    console.error("Storage upload error:", err)
    // Fallback: If storage bucket has cors or strict permissions, store as high quality data URL
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const dataUrl = e.target.result
        formData.value.photoURL = dataUrl
        const userDocRef = doc(db, 'users', auth.currentUser.uid)
        await updateDoc(userDocRef, { photoURL: dataUrl })
        await updateAuthProfile(auth.currentUser, { photoURL: dataUrl })
      }
      reader.readAsDataURL(file)
    } catch (fallbackErr) {
      console.warn("Fallback avatar failed:", fallbackErr)
    }
  } finally {
    isUploadingPhoto.value = false
  }
}

const removeAvatar = async () => {
  const result = await Swal.fire({
    title: 'حذف الصورة الشخصية؟',
    text: 'هل تريد حقاً استعادة الأحرف الأولى كصورة رمزية؟',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'نعم، حذف',
    cancelButtonText: 'إلغاء'
  })

  if (result.isConfirmed) {
    formData.value.photoURL = ''
    photoPreview.value = null
    if (auth.currentUser) {
      try {
        await updateAuthProfile(auth.currentUser, { photoURL: '' })
        const userDocRef = doc(db, 'users', auth.currentUser.uid)
        await updateDoc(userDocRef, { photoURL: '' })
      } catch (err) {
        console.warn("Error clearing photoURL:", err)
      }
    }
  }
}

onMounted(async () => {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        const docRef = doc(db, 'users', user.uid)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const data = docSnap.data()
          formData.value = {
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            phone: data.phone || '',
            address: data.address || '',
            photoURL: data.photoURL || user.photoURL || ''
          }
        } else {
          formData.value.photoURL = user.photoURL || ''
        }
      } catch (error) {
        console.error("خطأ في جلب البيانات:", error)
      } finally {
        pageLoading.value = false
      }
    }
  })
})

const updateUserProfile = async () => {
  if (!auth.currentUser) return
  isSubmitting.value = true
  try {
    const docRef = doc(db, 'users', auth.currentUser.uid)
    const fullName = `${formData.value.firstName} ${formData.value.lastName}`.trim()
    
    await updateDoc(docRef, {
      firstName: formData.value.firstName,
      lastName: formData.value.lastName,
      name: fullName,
      phone: formData.value.phone,
      address: formData.value.address,
      photoURL: formData.value.photoURL
    })

    await updateAuthProfile(auth.currentUser, {
      displayName: fullName,
      photoURL: formData.value.photoURL
    })

    Swal.fire({
      icon: 'success',
      title: 'تم التحديث بنجاح!',
      text: 'تم حفظ كافة بياناتك وملفك الشخصي.',
      timer: 2000,
      showConfirmButton: false
    })
  } catch (error) {
    console.error(error)
    Swal.fire({ icon: 'error', title: 'خطأ', text: 'تعذر حفظ البيانات، حاول مجدداً.' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.profile-page {
  max-width: 800px;
  margin: 50px auto 80px;
  padding: 0 20px;
  direction: rtl;
}

.profile-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
}

.icon-box {
  background: #ecfdf5;
  color: #059669;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.card-header h2 {
  margin: 0 0 4px 0;
  color: #0f172a;
  font-weight: 800;
  font-size: 1.4rem;
}

.header-subtitle {
  margin: 0;
  font-size: 0.88rem;
  color: #64748b;
}

/* Avatar Customizer */
.avatar-customizer-section {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  margin-bottom: 28px;
}

.avatar-preview-wrapper {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #ffffff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  background: #e0e7ff;
  flex-shrink: 0;
}

.avatar-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4338ca;
  font-size: 2rem;
  font-weight: 900;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.avatar-preview-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-info-meta {
  flex: 1;
}

.avatar-info-meta h4 {
  margin: 0 0 4px 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
}

.avatar-info-meta p {
  margin: 0 0 12px 0;
  font-size: 0.82rem;
  color: #64748b;
  line-height: 1.5;
}

.avatar-actions-row {
  display: flex;
  gap: 10px;
}

.upload-badge-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #059669;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.upload-badge-btn:hover:not(:disabled) {
  background: #047857;
}

.remove-photo-btn {
  background: transparent;
  color: #ef4444;
  border: 1px solid #fee2e2;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-photo-btn:hover {
  background: #fef2f2;
}

.hidden-file-input {
  display: none;
}

/* Form */
.profile-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: flex;
  gap: 20px;
}

.form-row .form-group {
  flex: 1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 700;
  color: #334155;
  font-size: 0.9rem;
}

.form-group input, .form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  font-family: inherit;
  font-size: 0.95rem;
  background: #f8fafc;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-group input:focus, .form-group textarea:focus {
  border-color: #059669;
  background: white;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15);
}

.disabled-input {
  background: #f1f5f9 !important;
  color: #94a3b8 !important;
  cursor: not-allowed;
}

.form-actions {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.save-btn {
  background: #059669;
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);
  transition: all 0.2s ease;
}

.save-btn:hover:not(:disabled) {
  background: #047857;
  transform: translateY(-2px);
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px 0;
  color: #64748b;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f1f5f9;
  border-top: 3px solid #059669;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

@media (max-width: 600px) {
  .avatar-customizer-section {
    flex-direction: column;
    text-align: center;
  }
  .avatar-actions-row {
    justify-content: center;
  }
  .form-row { flex-direction: column; }
  .profile-card { padding: 25px; }
}
</style>