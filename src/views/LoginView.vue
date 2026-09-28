<script setup>
import { ref } from 'vue'
import { auth, db } from '../firebase/config'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Swal from 'sweetalert2'

const router = useRouter()
const { t } = useI18n()

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
        title: t('auth.bannedTitle'),
        text: t('auth.bannedMsg'),
        confirmButtonColor: '#ef4444'
      })
      demoLoadingRole.value = null
      return
    }

    const toastMsg = role === 'admin' 
      ? t('auth.demoAdminSuccess') 
      : t('auth.demoCustomerSuccess')

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
      title: t('common.error'),
      text: t('auth.demoError'),
      confirmButtonColor: '#ef4444'
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

const getErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return t('auth.invalidCredential')
    case 'auth/email-already-in-use':
      return t('auth.emailInUse')
    case 'auth/weak-password':
      return t('auth.weakPassword')
    case 'auth/invalid-email':
      return t('auth.invalidEmail')
    default:
      return t('auth.unknownError')
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
    emailError.value = t('auth.invalidEmail')
    hasError = true
  }
  if (!password.value) {
    passwordError.value = t('auth.weakPassword')
    hasError = true
  }

  if (!isLoginMode.value) {
    if (!firstName.value.trim()) {
      firstNameError.value = t('checkout.nameRequired')
      hasError = true
    }
    if (!lastName.value.trim()) {
      lastNameError.value = t('checkout.nameRequired')
      hasError = true
    }
    const phoneRegex = /^01[0125][0-9]{8}$/
    if (!phone.value || !phoneRegex.test(phone.value)) {
      phoneError.value = t('checkout.phoneInvalid')
      hasError = true
    }
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
          title: t('auth.bannedTitle'),
          text: t('auth.bannedMsg'),
          confirmButtonColor: '#ef4444'
        })
        return
      }

      if (userDoc.exists() && userDoc.data().role === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/')
      }
    } else {
      const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
      const user = userCredential.user

      const fullName = `${firstName.value.trim()} ${lastName.value.trim()}`

      await setDoc(doc(db, 'users', user.uid), {
        firstName: firstName.value.trim(),
        lastName: lastName.value.trim(),
        name: fullName,
        email: email.value.trim(),
        phone: phone.value.trim(),
        role: 'customer',
        status: 'active',
        createdAt: new Date().toISOString()
      })

      router.push('/')
    }
  } catch (error) {
    const errText = getErrorMessage(error.code)
    
    if (error.code === 'auth/email-already-in-use') {
      emailError.value = errText
    } else if (error.code === 'auth/weak-password') {
      passwordError.value = errText
    } else if (error.code === 'auth/invalid-email') {
      emailError.value = errText
    } else {
      generalAuthError.value = errText
      Swal.fire({
        icon: 'error',
        title: t('common.error'),
        text: errText,
        confirmButtonColor: '#ef4444'
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
        <h1>{{ t('nav.brand') }}</h1>
      </router-link>

      <h2>{{ isLoginMode ? t('auth.loginTitle') : t('auth.registerTitle') }}</h2>
      
      <form @submit.prevent="handleSubmit" novalidate>
        
        <div v-if="generalAuthError" class="general-error-alert">
          <i class="fa-solid fa-triangle-exclamation"></i> {{ generalAuthError }}
        </div>

        <template v-if="!isLoginMode">
          <div class="name-row">
            <div class="form-group half-width">
              <label>{{ t('auth.firstName') }}</label>
              <input v-model="firstName" type="text" placeholder="Ahmed" :class="{ 'input-error': firstNameError }">
              <span v-if="firstNameError" class="error-text">{{ firstNameError }}</span>
            </div>
            <div class="form-group half-width">
              <label>{{ t('auth.lastName') }}</label>
              <input v-model="lastName" type="text" placeholder="Mohamed" :class="{ 'input-error': lastNameError }">
              <span v-if="lastNameError" class="error-text">{{ lastNameError }}</span>
            </div>
          </div>

          <div class="form-group">
            <label>{{ t('auth.phone') }}</label>
            <input v-model="phone" type="tel" placeholder="01XXXXXXXXX" :class="{ 'input-error': phoneError }">
            <span v-if="phoneError" class="error-text">{{ phoneError }}</span>
          </div>
        </template>

        <div class="form-group">
          <label>{{ t('auth.email') }}</label>
          <input 
            v-model="email" 
            type="email" 
            placeholder="name@example.com" 
            :class="{ 'input-error': emailError || generalAuthError }"
          >
          <span v-if="emailError" class="error-text">{{ emailError }}</span>
        </div>

        <div class="form-group">
          <label>{{ t('auth.password') }}</label>
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
            <div class="btn-spinner"></div> {{ t('auth.processing') }}
          </div>
          <span v-else>{{ isLoginMode ? t('auth.loginBtn') : t('auth.registerBtn') }}</span>
        </button>
        
        <!-- Quick Demo Access -->
        <div v-if="isLoginMode" class="portfolio-demo-card">
          <div class="demo-card-header">
            <div class="header-left">
              <span class="live-status-dot"></span>
              <span class="demo-badge-text">{{ t('auth.demoAccessTitle') }}</span>
            </div>
            <span class="demo-pill-sub">{{ t('auth.demoAccessSub') }}</span>
          </div>
          
          <div class="demo-pills-grid">
            <button 
              type="button" 
              class="demo-pill-btn admin-theme"
              :disabled="demoLoadingRole !== null || isLoading"
              @click="directDemoLogin('admin')"
            >
              <div class="pill-icon-box">
                <i v-if="demoLoadingRole === 'admin'" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-user-shield"></i>
              </div>
              <div class="pill-text-meta">
                <span class="pill-role">{{ t('auth.adminRole') }}</span>
                <span class="pill-desc">karim@gmail.com</span>
              </div>
            </button>

            <button 
              type="button" 
              class="demo-pill-btn customer-theme"
              :disabled="demoLoadingRole !== null || isLoading"
              @click="directDemoLogin('customer')"
            >
              <div class="pill-icon-box">
                <i v-if="demoLoadingRole === 'customer'" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-cart-shopping"></i>
              </div>
              <div class="pill-text-meta">
                <span class="pill-role">{{ t('auth.userRole') }}</span>
                <span class="pill-desc">admin@gmail.com</span>
              </div>
            </button>
          </div>
        </div>

      </form>

      <div class="toggle-mode">
        <p v-if="isLoginMode">
          {{ t('auth.noAccount') }}
          <a href="#" @click.prevent="isLoginMode = false; clearErrors()">{{ t('auth.createAccountTxt') }}</a>
        </p>
        <p v-else>
          {{ t('auth.hasAccount') }}
          <a href="#" @click.prevent="isLoginMode = true; clearErrors()">{{ t('auth.loginTxt') }}</a>
        </p>
      </div>

    </div>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 120px);
  min-height: calc(100dvh - 120px);
  padding: 36px 20px;
  background-color: #f8fafc;
}

.auth-card {
  background: white;
  padding: 40px;
  border-radius: 24px;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(226, 232, 240, 0.9);
  width: 100%;
  max-width: 480px;
}

.auth-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
  text-decoration: none;
}

.brand-icon {
  background: #059669;
  color: white;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 1.25rem;
}

.auth-brand h1 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

h2 {
  text-align: center;
  color: #0f172a;
  margin-bottom: 28px;
  font-size: 1.35rem;
  font-weight: 800;
}

.general-error-alert {
  background: #fef2f2;
  border: 1px solid #fee2e2;
  color: #ef4444;
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 20px;
  font-size: 0.88rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.form-group {
  margin-bottom: 20px;
}

.name-row {
  display: flex;
  gap: 14px;
}

.half-width {
  flex: 1;
}

label {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 8px;
}

input {
  width: 100%;
  padding: 12px 16px;
  min-height: 48px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  font-size: 0.95rem;
  background-color: #f8fafc;
  outline: none;
  transition: all 0.2s ease;
  font-family: inherit;
}

input:focus {
  border-color: #059669;
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
}

.input-error {
  border-color: #ef4444 !important;
  background-color: #fef2f2 !important;
}

.error-text {
  color: #ef4444;
  font-size: 0.8rem;
  font-weight: 600;
  margin-top: 6px;
  display: block;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  min-height: 48px;
  background-color: #059669;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
  font-family: inherit;
  box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);
}

.submit-btn:hover:not(:disabled) {
  background-color: #047857;
  transform: translateY(-2px);
}

.submit-btn:disabled {
  background-color: #cbd5e1;
  cursor: not-allowed;
  box-shadow: none;
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

/* Demo Card */
.portfolio-demo-card {
  margin-top: 24px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
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
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.demo-badge-text {
  font-size: 0.8rem;
  font-weight: 800;
  color: #0f172a;
}

.demo-pill-sub {
  font-size: 0.72rem;
  color: #64748b;
  font-weight: 600;
}

.demo-pills-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.demo-pill-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  min-height: 44px;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.demo-pill-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

.demo-pill-btn.admin-theme {
  border-color: #fed7aa;
  background: #fff7ed;
}

.demo-pill-btn.admin-theme .pill-icon-box {
  background: #ea580c;
  color: white;
}

.demo-pill-btn.customer-theme {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.demo-pill-btn.customer-theme .pill-icon-box {
  background: #059669;
  color: white;
}

.pill-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.pill-text-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}

.pill-role {
  font-size: 0.8rem;
  font-weight: 800;
  color: #0f172a;
}

.pill-desc {
  font-size: 0.7rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 110px;
}

.toggle-mode {
  text-align: center;
  margin-top: 24px;
  color: #64748b;
  font-size: 0.92rem;
}

.toggle-mode a {
  color: #059669;
  font-weight: 700;
  text-decoration: none;
  margin-inline-start: 6px;
}

.toggle-mode a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .auth-card {
    padding: 24px 18px;
    border-radius: 18px;
  }

  .name-row {
    flex-direction: column;
    gap: 0;
  }

  .demo-pills-grid {
    grid-template-columns: 1fr;
  }
}
</style>