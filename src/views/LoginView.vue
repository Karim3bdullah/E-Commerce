<script setup>
import { ref } from 'vue'
import { auth, db } from '../firebase/config'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword , signOut} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

const router = useRouter()

const email = ref('')
const password = ref('')
const firstName = ref('')
const lastName = ref('')
const phone = ref('')

const isLoading = ref(false)
const isLoginMode = ref(true) 

const emailError = ref('')
const passwordError = ref('')
const firstNameError = ref('')
const lastNameError = ref('')
const phoneError = ref('')

const getArabicErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
    case 'auth/email-already-in-use':
      return 'هذا البريد الإلكتروني مسجل لدينا بالفعل.'
    case 'auth/weak-password':
      return 'كلمة المرور ضعيفة، يجب أن تكون 6 أحرف على الأقل.'
    case 'auth/invalid-email':
      return 'صيغة البريد الإلكتروني غير صحيحة.'
    default:
      return 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.'
  }
}

const clearErrors = () => {
  emailError.value = ''
  passwordError.value = ''
  firstNameError.value = ''
  lastNameError.value = ''
  phoneError.value = ''
}

const handleSubmit = async () => {
  clearErrors()
  
  let hasError = false

  if (!email.value) {
    emailError.value = 'يرجى إدخال البريد الإلكتروني'
    hasError = true
  }

  if (!password.value) {
    passwordError.value = 'يرجى إدخال كلمة المرور'
    hasError = true
  } else if (password.value.length < 6) {
    passwordError.value = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
    hasError = true
  }

  if (isLoginMode.value) {
      const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))
      
      
      if (userDoc.exists() && userDoc.data().status === 'banned') {
        await signOut(auth) 
        Swal.fire({
          icon: 'error',
          title: 'حساب موقوف',
          text: 'عفواً، تم إيقاف حسابك من قبل الإدارة لمخالفة الشروط.',
          confirmButtonColor: '#ef4444'
        })
        isLoading.value = false
        return 
      }

      Swal.fire({
        icon: 'success',
        title: 'أهلاً بك!',
        timer: 1500,
        showConfirmButton: false
      })

      if (userDoc.exists() && userDoc.data().role === 'admin') {
        router.push('/admin/orders')
      } else {
        router.push('/')
      }
    } else {
     

  if (hasError) return

  isLoading.value = true
  try {
    if (isLoginMode.value) {
      const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))
      
      Swal.fire({
        icon: 'success',
        title: 'أهلاً بك!',
        timer: 1500,
        showConfirmButton: false
      })

      if (userDoc.exists() && userDoc.data().role === 'admin') {
        router.push('/admin/orders')
      } else {
        router.push('/')
      }
    } else {
      const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        firstName: firstName.value,
        lastName: lastName.value,
        name: `${firstName.value} ${lastName.value}`, 
        phone: phone.value,
        email: userCredential.user.email,
        role: 'customer',
        createdAt: new Date()
      })

      Swal.fire({
        icon: 'success',
        title: 'تم إنشاء الحساب بنجاح!',
        timer: 1500,
        showConfirmButton: false
      })
      router.push('/')
    }
  } catch (error) {
    console.error(error)
    const errText = getArabicErrorMessage(error.code)
    if (error.code.includes('email') || error.code.includes('credential') || error.code.includes('user') || error.code.includes('password')) {
      if (error.code.includes('password')) {
        passwordError.value = errText
      } else {
        emailError.value = errText
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: errText
      })
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">

      <router-link to="/" class="auth-brand">
        <div class="brand-icon">
          <i class="fa-solid fa-bag-shopping"></i>
        </div>
        <h1>متجري</h1>
      </router-link>

      <h2>{{ isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب جديد' }}</h2>
      
      <form @submit.prevent="handleSubmit" novalidate>
        
        <template v-if="!isLoginMode">
          <div class="name-row">
            <div class="form-group half-width">
              <label>الاسم الأول</label>
              <input v-model="firstName" type="text" placeholder="أحمد" :class="{ 'input-error': firstNameError }">
              <span v-if="firstNameError" class="error-text">{{ firstNameError }}</span>
            </div>
            <div class="form-group half-width">
              <label>اسم العائلة</label>
              <input v-model="lastName" type="text" placeholder="محمد" :class="{ 'input-error': lastNameError }">
              <span v-if="lastNameError" class="error-text">{{ lastNameError }}</span>
            </div>
          </div>

          <div class="form-group">
            <label>رقم الهاتف</label>
            <input v-model="phone" type="tel" placeholder="01XXXXXXXXX" :class="{ 'input-error': phoneError }">
            <span v-if="phoneError" class="error-text">{{ phoneError }}</span>
          </div>
        </template>

        <div class="form-group">
          <label>البريد الإلكتروني</label>
          <input v-model="email" type="email" placeholder="name@example.com" :class="{ 'input-error': emailError }">
          <span v-if="emailError" class="error-text">{{ emailError }}</span>
        </div>

        <div class="form-group">
          <label>كلمة المرور</label>
          <input v-model="password" type="password" placeholder="••••••••" :class="{ 'input-error': passwordError }">
          <span v-if="passwordError" class="error-text">{{ passwordError }}</span>
        </div>

        <button type="submit" class="submit-btn" :disabled="isLoading">
          <div v-if="isLoading" class="loading-content">
            <div class="btn-spinner"></div> جاري المعالجة...
          </div>
          <span v-else>{{ isLoginMode ? 'دخول' : 'إنشاء الحساب' }}</span>
        </button>
        
        <div v-if="isLoginMode" class="test-credentials">
          <p class="test-title"><i class="fa-solid fa-circle-info"></i> بيانات للتجربة السريعة:</p>
          <div class="test-boxes">
            <div class="test-box" @click="email='admin@test.com'; password='password123'">
              <span class="role">المدير (Admin)</span>
              <span>admin@gmail.com</span>
              <span>password</span>
            </div>
            <div class="test-box" @click="email='user@test.com'; password='password123'">
              <span class="role">العميل (User)</span>
              <span>test@gmail.com</span>
              <span>password</span>
            </div>
          </div>
          <p class="hint-text">اضغط على أي صندوق لملء البيانات تلقائياً</p>
        </div>
      </form>

      <div class="toggle-mode">
        <p v-if="isLoginMode">ليس لديك حساب؟ <a href="#" @click.prevent="isLoginMode = false; clearErrors()">انشئ حساباً جديداً</a></p>
        <p v-else>لديك حساب بالفعل؟ <a href="#" @click.prevent="isLoginMode = true; clearErrors()">سجل الدخول من هنا</a></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container { 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  min-height: 85vh; 
  padding: 20px; 
  direction: rtl;
}

.auth-card { 
  background: #ffffff; 
  padding: 35px; 
  border-radius: 20px; 
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04); 
  width: 100%; 
  max-width: 440px; 
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.auth-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 25px;
  text-decoration: none;
}

.brand-icon {
  background-color: #2563eb;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.auth-brand h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #1e293b;
  font-weight: 800;
}

h2 { 
  text-align: center; 
  margin-bottom: 25px; 
  color: #1e293b; 
  font-weight: 800; 
  font-size: 1.6rem;
}

.name-row { 
  display: flex; 
  gap: 15px; 
}

.half-width { 
  flex: 1; 
}

.form-group { 
  margin-bottom: 16px; 
}

.form-group label { 
  display: block; 
  margin-bottom: 6px; 
  font-weight: 600; 
  color: #475569; 
  font-size: 0.9rem; 
}

.form-group input { 
  width: 100%; 
  padding: 12px 16px; 
  border: 1px solid #cbd5e1; 
  border-radius: 12px; 
  font-size: 0.95rem; 
  font-family: inherit;
  transition: all 0.2s ease; 
  background-color: #f8fafc; 
  box-sizing: border-box;
}

.form-group input:focus { 
  outline: none; 
  border-color: #2563eb; 
  background-color: #ffffff; 
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); 
}

.input-error { 
  border-color: #ef4444 !important; 
  background-color: #fef2f2 !important; 
}

.error-text { 
  color: #ef4444; 
  font-size: 0.8rem; 
  margin-top: 6px; 
  display: block; 
  font-weight: 500;
}

.submit-btn { 
  width: 100%; 
  padding: 14px; 
  background-color: #2563eb; 
  color: white; 
  border: none; 
  border-radius: 12px; 
  font-size: 1rem; 
  font-weight: 700; 
  cursor: pointer; 
  transition: background 0.2s ease; 
  margin-top: 10px; 
  font-family: inherit;
}

.submit-btn:hover:not(:disabled) { 
  background-color: #1d4ed8; 
}

.submit-btn:disabled { 
  background-color: #94a3b8; 
  cursor: not-allowed; 
}

.toggle-mode { 
  text-align: center; 
  margin-top: 25px; 
  font-size: 0.9rem; 
  color: #64748b; 
}

.toggle-mode a { 
  color: #2563eb; 
  text-decoration: none; 
  font-weight: 700; 
}

.toggle-mode a:hover {
  text-decoration: underline;
}
.loading-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>