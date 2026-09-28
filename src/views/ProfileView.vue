<template>
  <div class="profile-page">
    <div class="profile-card">
      
      <div class="card-header">
        <div class="icon-box"><i class="fa-solid fa-user-gear"></i></div>
        <div>
          <h2>{{ t('profile.title') }}</h2>
          <p class="header-subtitle">{{ t('profile.subtitle') }}</p>
        </div>
      </div>

      <div v-if="pageLoading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ t('profile.fetchingData') }}</p>
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
              <span>{{ t('profile.changeAvatar') }}</span>
            </div>
          </div>

          <div class="avatar-info-meta">
            <h4>{{ t('profile.avatarSectionTitle') }}</h4>
            <p>{{ t('profile.avatarHint') }}</p>
            <div class="avatar-actions-row">
              <button type="button" class="upload-badge-btn" @click="triggerFileInput" :disabled="isUploadingPhoto">
                <i class="fa-solid fa-arrow-up-from-bracket"></i>
                <span>{{ isUploadingPhoto ? t('profile.uploadingPhoto') : t('profile.uploadNewPhoto') }}</span>
              </button>
              <button v-if="formData.photoURL || photoPreview" type="button" class="remove-photo-btn" @click="removeAvatar" :disabled="isUploadingPhoto">
                {{ t('profile.removePhoto') }}
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
              <label>{{ t('profile.firstName') }}</label>
              <input type="text" v-model="formData.firstName" required placeholder="Ahmed">
            </div>
            <div class="form-group">
              <label>{{ t('profile.lastName') }}</label>
              <input type="text" v-model="formData.lastName" required placeholder="Mohamed">
            </div>
          </div>

          <div class="form-group">
            <label>{{ t('profile.uneditableEmail') }}</label>
            <input type="email" :value="currentUserEmail" disabled class="disabled-input">
          </div>

          <div class="form-group">
            <label>{{ t('profile.phone') }}</label>
            <input type="tel" v-model="formData.phone" placeholder="01XXXXXXXXX" required>
          </div>

          <div class="form-group">
            <label>{{ t('profile.defaultAddress') }}</label>
            <textarea 
              v-model="formData.address" 
              rows="3" 
              :placeholder="t('profile.addressPlaceholder')"
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="submit" class="save-btn" :disabled="isSubmitting || isUploadingPhoto">
              <span v-if="isSubmitting"><i class="fa-solid fa-spinner fa-spin"></i> {{ t('profile.saving') }}</span>
              <span v-else><i class="fa-solid fa-floppy-disk"></i> {{ t('profile.saveChanges') }}</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { auth, db, storage } from '../firebase/config'
import { onAuthStateChanged, updateProfile } from 'firebase/auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { notifySuccess, notifyError } from '../services/feedback'
import Swal from 'sweetalert2'

const router = useRouter()
const { t, locale } = useI18n()

const pageLoading = ref(true)
const isSubmitting = ref(false)
const isUploadingPhoto = ref(false)
const fileInputRef = ref(null)

const currentUserEmail = ref('')
const currentUserId = ref(null)
const photoPreview = ref(null)
const selectedPhotoFile = ref(null)

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

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      router.push('/login')
      return
    }

    currentUserId.value = user.uid
    currentUserEmail.value = user.email

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const data = userDoc.data()
        formData.value = {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
          address: data.address || '',
          photoURL: data.photoURL || user.photoURL || ''
        }
      } else {
        const displayNameParts = (user.displayName || '').split(' ')
        formData.value.firstName = displayNameParts[0] || ''
        formData.value.lastName = displayNameParts.slice(1).join(' ') || ''
        formData.value.photoURL = user.photoURL || ''
      }
    } catch (err) {
      console.error("Error loading user profile:", err)
    } finally {
      pageLoading.value = false
    }
  })
})

const triggerFileInput = () => {
  if (!isUploadingPhoto.value && fileInputRef.value) {
    fileInputRef.value.click()
  }
}

// Helper to downscale avatar image for database fallback when CORS/Storage is unavailable
function compressAvatar(file, maxWidth = 120, maxHeight = 120, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = (e) => {
      img.src = e.target.result
    }
    reader.onerror = reject
    img.onload = () => {
      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    reader.readAsDataURL(file)
  })
}

const handleAvatarSelected = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    notifyError(t('common.error'), t('profile.avatarHint'))
    if (event.target) event.target.value = ''
    return
  }

  const previousPhotoURL = formData.value.photoURL
  selectedPhotoFile.value = file
  photoPreview.value = URL.createObjectURL(file)

  if (!auth.currentUser) return
  isUploadingPhoto.value = true

  try {
    // 1. Upload binary file directly to Firebase Storage with proper metadata
    const fileExt = file.name.split('.').pop() || 'jpg'
    const avatarRef = storageRef(storage, `users/${auth.currentUser.uid}/avatar.${fileExt}`)
    const metadata = {
      contentType: file.type || 'image/jpeg',
      customMetadata: { userId: auth.currentUser.uid }
    }
    await uploadBytes(avatarRef, file, metadata)

    // 2. Obtain clean HTTPS URL
    const downloadURL = await getDownloadURL(avatarRef)

    // 3. Update Auth and Firestore user doc
    await updateProfile(auth.currentUser, {
      photoURL: downloadURL
    })

    await updateDoc(doc(db, 'users', currentUserId.value || auth.currentUser.uid), {
      photoURL: downloadURL
    })

    formData.value.photoURL = downloadURL
    photoPreview.value = downloadURL
    notifySuccess(t('profile.updateSuccess'))
  } catch (err) {
    console.warn("Storage uploadBytes failed (CORS/Network policy), attempting resilient Firestore thumbnail fallback:", err?.message || err)

    try {
      // Automated Fallback: Compress to lightweight thumbnail and store directly in user document
      const compressedThumb = await compressAvatar(file, 120, 120, 0.75)
      
      await updateDoc(doc(db, 'users', currentUserId.value || auth.currentUser.uid), {
        photoURL: compressedThumb
      })

      formData.value.photoURL = compressedThumb
      photoPreview.value = compressedThumb

      notifySuccess(
        locale.value === 'ar' ? 'تم حفظ الصورة الشخصية بنجاح!' : 'Profile photo updated successfully!',
        locale.value === 'ar'
          ? 'تم الحفظ محلياً عبر قاعدة البيانات لتجاوز قيود CORS للمتصفح.'
          : 'Saved directly to profile to bypass browser CORS policy.'
      )
    } catch (fallbackErr) {
      console.error("Avatar fallback error:", fallbackErr)
      notifyError(
        t('common.error'),
        locale.value === 'ar'
          ? 'تعذر رفع الصورة بسبب قيود CORS أو اتصال الشبكة. يرجى مراجعة إعدادات Firebase Storage.'
          : 'Failed to upload photo due to Firebase Storage CORS or network restrictions.'
      )
      photoPreview.value = previousPhotoURL || null
    }
  } finally {
    isUploadingPhoto.value = false
    selectedPhotoFile.value = null
    if (event.target) event.target.value = ''
  }
}

const removeAvatar = async () => {
  formData.value.photoURL = ''
  photoPreview.value = null
  selectedPhotoFile.value = null

  try {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { photoURL: '' })
    }
    await updateDoc(doc(db, 'users', currentUserId.value || auth.currentUser?.uid), {
      photoURL: ''
    })
    notifySuccess(t('profile.updateSuccess'))
  } catch (err) {
    console.error("Failed to remove avatar:", err)
  }
}

const updateUserProfile = async () => {
  isSubmitting.value = true

  try {
    const fullName = `${formData.value.firstName.trim()} ${formData.value.lastName.trim()}`
    
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: fullName
      })
    }

    await updateDoc(doc(db, 'users', currentUserId.value), {
      firstName: formData.value.firstName.trim(),
      lastName: formData.value.lastName.trim(),
      name: fullName,
      phone: formData.value.phone.trim(),
      address: formData.value.address.trim(),
      photoURL: formData.value.photoURL || ''
    })

    Swal.fire({
      icon: 'success',
      title: t('profile.updateSuccess'),
      timer: 2000,
      showConfirmButton: false
    })

  } catch (err) {
    console.error("Profile update error:", err)
    Swal.fire({
      icon: 'error',
      title: t('common.error'),
      text: err.message || '',
      confirmButtonColor: '#ef4444'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.profile-page {
  max-width: 900px;
  margin: 36px auto;
  padding: 0 24px;
  width: 100%;
}

.profile-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 36px;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
}

.icon-box {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #ecfdf5;
  color: #059669;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
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
  border-radius: 18px;
  border: 1px solid rgba(226, 232, 240, 0.85);
  margin-bottom: 30px;
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
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.upload-badge-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #059669;
  color: white;
  border: none;
  padding: 8px 16px;
  min-height: 44px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.upload-badge-btn:hover:not(:disabled) {
  background: #047857;
}

.remove-photo-btn {
  background: transparent;
  color: #ef4444;
  border: 1px solid #fee2e2;
  padding: 8px 16px;
  min-height: 44px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.remove-photo-btn:hover {
  background: #fee2e2;
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

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-size: 0.9rem;
  font-weight: 700;
  color: #334155;
}

input, textarea {
  padding: 12px 16px;
  min-height: 48px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  font-family: inherit;
  font-size: 0.95rem;
  color: #0f172a;
  background: #f8fafc;
  outline: none;
  transition: all 0.2s ease;
}

input:focus, textarea:focus {
  border-color: #059669;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
}

.disabled-input {
  background: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
}

textarea {
  min-height: 100px;
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.save-btn {
  background: #059669;
  color: white;
  border: none;
  padding: 14px 32px;
  min-height: 48px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);
  transition: all 0.2s ease;
  font-family: inherit;
}

.save-btn:hover:not(:disabled) {
  background: #047857;
  transform: translateY(-2px);
}

.save-btn:disabled {
  opacity: 0.6;
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

@media (max-width: 640px) {
  .profile-page {
    padding: 0 16px;
  }

  .profile-card {
    padding: 24px 18px;
  }

  .avatar-customizer-section {
    flex-direction: column;
    text-align: center;
  }

  .avatar-actions-row {
    justify-content: center;
  }

  .form-row {
    flex-direction: column;
  }

  .save-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>