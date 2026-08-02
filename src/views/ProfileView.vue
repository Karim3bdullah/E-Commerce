<template>
  <div class="profile-page">
    <div class="profile-card">
      
      <div class="card-header">
        <div class="icon-box"><i class="fa-solid fa-user-gear"></i></div>
        <h2>إعدادات الحساب</h2>
      </div>

      <div v-if="pageLoading" class="loading-state">
        <div class="spinner"></div>
        <p>جاري جلب بياناتك...</p>
      </div>

      <form v-else @submit.prevent="updateProfile" class="profile-form">
        
        <div class="form-row">
          <div class="form-group">
            <label>الاسم الأول</label>
            <input type="text" v-model="formData.firstName" required>
          </div>
          <div class="form-group">
            <label>اسم العائلة</label>
            <input type="text" v-model="formData.lastName" required>
          </div>
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
          <button type="submit" class="save-btn" :disabled="isSubmitting">
            <span v-if="isSubmitting"><i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...</span>
            <span v-else><i class="fa-solid fa-floppy-disk"></i> حفظ التعديلات</span>
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { auth, db } from '../firebase/config'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import Swal from 'sweetalert2'

const pageLoading = ref(true)
const isSubmitting = ref(false)

// المتغير اللي هيشيل داتا الفورمة
const formData = ref({
  firstName: '',
  lastName: '',
  phone: '',
  address: ''
})

// 1. جلب بيانات المستخدم الحالية أول ما يفتح الصفحة
onMounted(async () => {
  // بنستنى نتأكد إن حالة الدخول جاهزة
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
            address: data.address || ''
          }
        }
      } catch (error) {
        console.error("خطأ في جلب البيانات:", error)
      } finally {
        pageLoading.value = false
      }
    }
  })
})

// 2. دالة حفظ التعديلات في الفايربيس
const updateProfile = async () => {
  isSubmitting.value = true
  try {
    const docRef = doc(db, 'users', auth.currentUser.uid)
    
    await updateDoc(docRef, {
      firstName: formData.value.firstName,
      lastName: formData.value.lastName,
      name: `${formData.value.firstName} ${formData.value.lastName}`, // بنحدث الاسم الكامل بالمرة
      phone: formData.value.phone,
      address: formData.value.address
    })

    Swal.fire({
      icon: 'success',
      title: 'تم التحديث!',
      text: 'تم حفظ بياناتك بنجاح.',
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
  margin: 50px auto;
  padding: 0 20px;
  direction: rtl;
}

.profile-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
}

.icon-box {
  background: #e0e7ff;
  color: #3730a3;
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.card-header h2 {
  margin: 0;
  color: #1e293b;
  font-weight: 800;
}

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
  font-weight: 600;
  color: #475569;
  font-size: 0.95rem;
}

.form-group input, .form-group textarea {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-family: inherit;
  font-size: 1rem;
  background: #f8fafc;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-group input:focus, .form-group textarea:focus {
  border-color: #2563eb;
  background: white;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-actions {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.save-btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 14px 30px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background 0.3s;
}

.save-btn:hover:not(:disabled) {
  background: #1d4ed8;
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
  border-top: 3px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

@media (max-width: 600px) {
  .form-row { flex-direction: column; }
  .profile-card { padding: 25px; }
}
</style>