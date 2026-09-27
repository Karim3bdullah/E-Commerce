import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, storage } from '../firebase/config'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import Swal from 'sweetalert2'

export const useSettingsStore = defineStore('settingsStore', () => {
  const storeNameAr = ref('متجري')
  const storeNameEn = ref('MyStore')
  const logoType = ref('text') // 'text' | 'image'
  const logoUrl = ref('')
  const faviconUrl = ref('')
  const contactPhone = ref('+20 100 000 0000')
  const contactEmail = ref('support@mystore.com')
  const whatsappNumber = ref('+201000000000')
  const socials = ref({
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    twitter: 'https://x.com'
  })
  const maintenanceMode = ref(false)
  const maintenanceMessage = ref('المتجر يخضع حالياً لبعض التحديثات المجدولة لتحسين تجربة التسوق. سنعود قريباً جداً!')

  const isLoaded = ref(false)
  const isSaving = ref(false)
  let unsubscribeSnapshot = null

  const getStoreName = (locale = 'ar') => {
    return locale === 'en' ? storeNameEn.value : storeNameAr.value
  }

  const applyFavicon = (url) => {
    if (!url) return
    let link = document.querySelector("link[rel~='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.getElementsByTagName('head')[0].appendChild(link)
    }
    link.href = url
  }

  const updateDocumentTitle = (locale = 'ar') => {
    const name = getStoreName(locale)
    const suffix = locale === 'en' ? 'Premium Store & SaaS Experience' : 'متجر إلكتروني متكامل'
    document.title = `${name} | ${suffix}`
  }

  const fetchSettings = () => {
    if (unsubscribeSnapshot) return

    try {
      const docRef = doc(db, 'settings', 'general')
      unsubscribeSnapshot = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          storeNameAr.value = data.storeNameAr ?? storeNameAr.value
          storeNameEn.value = data.storeNameEn ?? storeNameEn.value
          logoType.value = data.logoType ?? logoType.value
          logoUrl.value = data.logoUrl ?? logoUrl.value
          faviconUrl.value = data.faviconUrl ?? faviconUrl.value
          contactPhone.value = data.contactPhone ?? contactPhone.value
          contactEmail.value = data.contactEmail ?? contactEmail.value
          whatsappNumber.value = data.whatsappNumber ?? whatsappNumber.value
          if (data.socials) {
            socials.value = { ...socials.value, ...data.socials }
          }
          maintenanceMode.value = Boolean(data.maintenanceMode)
          maintenanceMessage.value = data.maintenanceMessage ?? maintenanceMessage.value

          if (faviconUrl.value) {
            applyFavicon(faviconUrl.value)
          }
        }
        isLoaded.value = true
      }, (err) => {
        console.warn("Settings realtime sync fallback:", err)
        isLoaded.value = true
      })
    } catch (e) {
      console.warn("Could not setup settings listener:", e)
      isLoaded.value = true
    }
  }

  const saveSettings = async (newSettings) => {
    isSaving.value = true
    try {
      const docRef = doc(db, 'settings', 'general')
      const payload = {
        storeNameAr: newSettings.storeNameAr ?? storeNameAr.value,
        storeNameEn: newSettings.storeNameEn ?? storeNameEn.value,
        logoType: newSettings.logoType ?? logoType.value,
        logoUrl: newSettings.logoUrl ?? logoUrl.value,
        faviconUrl: newSettings.faviconUrl ?? faviconUrl.value,
        contactPhone: newSettings.contactPhone ?? contactPhone.value,
        contactEmail: newSettings.contactEmail ?? contactEmail.value,
        whatsappNumber: newSettings.whatsappNumber ?? whatsappNumber.value,
        socials: newSettings.socials ?? socials.value,
        maintenanceMode: Boolean(newSettings.maintenanceMode),
        maintenanceMessage: newSettings.maintenanceMessage ?? maintenanceMessage.value,
        updatedAt: new Date()
      }

      await setDoc(docRef, payload, { merge: true })

      // Local state update
      storeNameAr.value = payload.storeNameAr
      storeNameEn.value = payload.storeNameEn
      logoType.value = payload.logoType
      logoUrl.value = payload.logoUrl
      faviconUrl.value = payload.faviconUrl
      contactPhone.value = payload.contactPhone
      contactEmail.value = payload.contactEmail
      whatsappNumber.value = payload.whatsappNumber
      socials.value = payload.socials
      maintenanceMode.value = payload.maintenanceMode
      maintenanceMessage.value = payload.maintenanceMessage

      if (faviconUrl.value) {
        applyFavicon(faviconUrl.value)
      }

      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      })
      Toast.fire({
        icon: 'success',
        title: 'تم حفظ إعدادات المتجر بنجاح ✨'
      })
      return true
    } catch (error) {
      console.error("Save settings error:", error)
      Swal.fire({
        icon: 'error',
        title: 'خطأ في الحفظ',
        text: 'تعذر حفظ إعدادات المتجر حالياً.'
      })
      return false
    } finally {
      isSaving.value = false
    }
  }

  const uploadBrandingAsset = async (file, assetType = 'logo') => {
    try {
      const ext = file.name.split('.').pop() || 'png'
      const filePath = `branding/${assetType}_${Date.now()}.${ext}`
      const fileRef = storageRef(storage, filePath)

      await uploadBytes(fileRef, file, { contentType: file.type })
      const downloadURL = await getDownloadURL(fileRef)
      return downloadURL
    } catch (error) {
      console.error(`Upload ${assetType} error:`, error)
      // Fallback to data URL for seamless local experience
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.readAsDataURL(file)
      })
    }
  }

  return {
    storeNameAr,
    storeNameEn,
    logoType,
    logoUrl,
    faviconUrl,
    contactPhone,
    contactEmail,
    whatsappNumber,
    socials,
    maintenanceMode,
    maintenanceMessage,
    isLoaded,
    isSaving,
    getStoreName,
    fetchSettings,
    saveSettings,
    uploadBrandingAsset,
    updateDocumentTitle
  }
})
