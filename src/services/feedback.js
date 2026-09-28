import Swal from 'sweetalert2'
import i18n from '../i18n'

const t = (key, params) => i18n.global.t(key, params)

const BaseToast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#ffffff',
  color: '#0f172a',
  customClass: {
    popup: 'premium-toast-popup',
    title: 'premium-toast-title',
    timerProgressBar: 'premium-toast-progress'
  },
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer
    toast.onmouseleave = Swal.resumeTimer
  }
})

export const notifySuccess = (title, message = '') => {
  return BaseToast.fire({
    icon: 'success',
    title,
    text: message,
    iconColor: '#10b981'
  })
}

export const notifyError = (title, message = '') => {
  return BaseToast.fire({
    icon: 'error',
    title,
    text: message,
    iconColor: '#ef4444'
  })
}

export const notifyWarning = (title, message = '') => {
  return BaseToast.fire({
    icon: 'warning',
    title,
    text: message,
    iconColor: '#f59e0b'
  })
}

export const notifyInfo = (title, message = '') => {
  return BaseToast.fire({
    icon: 'info',
    title,
    text: message,
    iconColor: '#3b82f6'
  })
}

export const handleFirebaseError = (error, fallbackKey = 'feedback.genericError') => {
  console.warn("Caught Firebase Error:", error?.code, error?.message)
  
  if (error?.code === 'permission-denied') {
    return notifyError(t('feedback.permissionDenied'))
  }
  
  if (error?.code === 'not-found') {
    return notifyWarning(t('product.notFound'))
  }

  const customMessage = error?.message && !error.message.includes('PERMISSION_DENIED') 
    ? error.message 
    : t(fallbackKey)
    
  return notifyError(t('common.error'), customMessage)
}

export default {
  notifySuccess,
  notifyError,
  notifyWarning,
  notifyInfo,
  handleFirebaseError
}
