<script setup>
import { ref } from 'vue'
import { auth, db } from '../firebase/config'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
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
const demoLoadingRole = ref(null)

const directDemoLogin = async (role) => {
  clearErrors()
  demoLoadingRole.value = role

  const credentials = {
    admin: { email: 'karim@gmail.com', pass: 'password' },
    customer: { email: 'admin@gmail.com', pass: 'password' }
  }

  const { email: demoEmail, pass: demoPass } = credentials[role]

  try {
    const userCredential = await signInWithEmailAndPassword(auth, demoEmail, demoPass)
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))

    if (userDoc.exists() && userDoc.data().status === 'banned') {
      await signOut(auth)
      Swal.fire({
        icon: 'error',
        title: 'حساب موقوف',
        text: 'عفواً، هذا الحساب موقوف.',
        confirmButtonColor: '#ef4444'
      })
      demoLoadingRole.value = null
      return
    }

    const toastMsg = role === 'admin' 
      ? 'تم تسجيل الدخول بنجاح كمدير للمتجر (Demo Admin) ✨' 
      : 'تم تسجيل الدخول بنجاح كعميل (Demo Customer) 🛍️'

    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      background: '#ffffff',
      color: '#0f172a'
    })

    Toast.fire({
      icon: 'success',
      title: toastMsg
    })

    if (role === 'admin' || (userDoc.exists() && userDoc.data().role === 'admin')) {
      router.push('/admin/dashboard')
    } else {
      router.push('/')
    }
  } catch (error) {
    console.error("Demo login error:", error)
    Swal.fire({
      icon: 'error',
      title: 'خطأ في الدخول التجريبي',
      text: 'تعذر تسجيل الدخول بالحساب التجريبي حالياً.'
    })
  } finally {
    demoLoadingRole.value = null
  }
}

const generalAuthError = ref('')
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
  generalAuthError.value = ''
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

  if (hasError) return

  isLoading.value = true

  try {
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
        router.push('/admin/dashboard')
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
        status: 'active',
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
    
    if (isLoginMode.value && (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password')) {
      generalAuthError.value = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
    } else {
      if (error.code.includes('password')) {
        passwordError.value = errText
      } else if (error.code.includes('email')) {
        emailError.value = errText
      } else {
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: errText
        })
      }
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
        
        <div v-if="generalAuthError" class="general-error-alert">
          <i class="fa-solid fa-triangle-exclamation"></i> {{ generalAuthError }}
        </div>

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
          <input 
            v-model="email" 
            type="email" 
            placeholder="name@example.com" 
            :class="{ 'input-error': emailError || generalAuthError }"
          >
          <span v-if="emailError" class="error-text">{{ emailError }}</span>
        </div>

        <div class="form-group">
          <label>كلمة المرور</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="••••••••" 
            :class="{ 'input-error': passwordError || generalAuthError }"
          >
          <span v-if="passwordError" class="error-text">{{ passwordError }}</span>
        </div>

        <button type="submit" class="submit-btn" :disabled="isLoading || demoLoadingRole !== null">
          <div v-if="isLoading" class="loading-content">
            <div class="btn-spinner"></div> جاري المعالجة...
          </div>
          <span v-else>{{ isLoginMode ? 'دخول' : 'إنشاء الحساب' }}</span>
        </button>
        
        <!-- Recruiter & Portfolio Quick Demo Access -->
        <div v-if="isLoginMode" class="portfolio-demo-card">
          <div class="demo-card-header">
            <div class="header-left">
              <span class="live-status-dot"></span>
              <span class="demo-badge-text">Recruiter & Demo Access</span>
            </div>
            <span class="demo-pill-sub">دخول مباشر بنقرة واحدة (بدون ملء يدوي)</span>
          </div>
          
          <div class="demo-pills-grid">
            <button 
              type="button" 
              class="demo-pill-btn admin-theme"
              :disabled="demoLoadingRole !== null || isLoading"
              @click="directDemoLogin('admin')"
            >
              <div class="pill-icon-box">
                <i v-if="demoLoadingRole === 'admin'" class="fa-solid fa-circle-notch fa-spin"></i>
                <i v-else class="fa-solid fa-shield-halved"></i>
              </div>
              <div class="pill-info">
                <span class="pill-title">Direct Preview: Store Admin</span>
                <span class="pill-tag">لوحة تحكم المدير والإحصائيات</span>
              </div>
              <i class="fa-solid fa-arrow-left auto-icon"></i>
            </button>

            <button 
              type="button" 
              class="demo-pill-btn customer-theme"
              :disabled="demoLoadingRole !== null || isLoading"
              @click="directDemoLogin('customer')"
            >
              <div class="pill-icon-box">
                <i v-if="demoLoadingRole === 'customer'" class="fa-solid fa-circle-notch fa-spin"></i>
                <i v-else class="fa-solid fa-bag-shopping"></i>
              </div>
              <div class="pill-info">
                <span class="pill-title">Direct Preview: Customer</span>
                <span class="pill-tag">واجهة العميل وتجربة الشراء</span>
              </div>
              <i class="fa-solid fa-arrow-left auto-icon"></i>
            </button>
          </div>
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

.general-error-alert {
  background-color: #fef2f2;
  color: #ef4444;
  padding: 12px 15px;
  border-radius: 12px;
  margin-bottom: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #fca5a5;
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

/* Micro-interaction visual pulse on input fields */
.field-pulse {
  animation: fieldGlow 0.9s cubic-bezier(0.2, 0.8, 0.2, 1);
  border-color: #2563eb !important;
}

@keyframes fieldGlow {
  0% {
    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4);
    background-color: #eff6ff;
  }
  50% {
    box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.2);
    background-color: #ffffff;
  }
  100% {
    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
  }
}

/* Handcrafted Portfolio Recruiter Demo Card */
.portfolio-demo-card {
  margin-top: 24px;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px 18px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
  position: relative;
  overflow: hidden;
}

.portfolio-demo-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #2563eb, #38bdf8);
}

.demo-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.live-status-dot {
  width: 8px;
  height: 8px;
  background-color: #10b981;
  border-radius: 50%;
  display: inline-block;
  animation: liveDotPulse 2s infinite;
}

@keyframes liveDotPulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

.demo-badge-text {
  font-size: 0.82rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.3px;
}

.demo-pill-sub {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.demo-pills-grid {
  display: flex;
  gap: 12px;
}

.demo-pill-btn {
  flex: 1;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  text-align: right;
  position: relative;
  font-family: inherit;
}

.demo-pill-btn:hover {
  transform: translateY(-2px);
  border-color: #cbd5e1;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
}

.pill-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.admin-theme .pill-icon-box {
  background-color: #f3e8ff;
  color: #7e22ce;
}

.customer-theme .pill-icon-box {
  background-color: #eff6ff;
  color: #2563eb;
}

.pill-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.pill-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
}

.pill-tag {
  font-size: 0.72rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.auto-icon {
  font-size: 0.75rem;
  color: #94a3b8;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.demo-pill-btn:hover .auto-icon {
  color: #2563eb;
  opacity: 1;
  transform: scale(1.1);
}

.demo-pill-btn.active-pill {
  border-color: #2563eb;
  background-color: #f8fafc;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.admin-theme.active-pill {
  border-color: #7e22ce;
  box-shadow: 0 0 0 2px rgba(126, 34, 206, 0.15);
}

.admin-theme.active-pill .auto-icon {
  color: #7e22ce;
  opacity: 1;
}

@media (max-width: 480px) {
  .demo-pills-grid {
    flex-direction: column;
  }
}
</style>