<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '../components/AdminLayout.vue'
import { useSettingsStore } from '../stores/settingsStore'
import Swal from 'sweetalert2'

const { t, locale } = useI18n()
const isRtl = computed(() => locale.value === 'ar')

const settingsStore = useSettingsStore()

const formData = ref({
  storeNameAr: '',
  storeNameEn: '',
  logoType: 'text',
  logoUrl: '',
  faviconUrl: '',
  contactPhone: '',
  contactEmail: '',
  whatsappNumber: '',
  socials: {
    facebook: '',
    instagram: '',
    twitter: ''
  },
  maintenanceMode: false,
  maintenanceMessage: ''
})

const logoFileInput = ref(null)
const faviconFileInput = ref(null)
const isUploadingLogo = ref(false)
const isUploadingFavicon = ref(false)

onMounted(() => {
  settingsStore.fetchSettings()
  // Populate local form when loaded
  formData.value = {
    storeNameAr: settingsStore.storeNameAr,
    storeNameEn: settingsStore.storeNameEn,
    logoType: settingsStore.logoType,
    logoUrl: settingsStore.logoUrl,
    faviconUrl: settingsStore.faviconUrl,
    contactPhone: settingsStore.contactPhone,
    contactEmail: settingsStore.contactEmail,
    whatsappNumber: settingsStore.whatsappNumber,
    socials: { ...settingsStore.socials },
    maintenanceMode: settingsStore.maintenanceMode,
    maintenanceMessage: settingsStore.maintenanceMessage
  }
})

const handleLogoUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    Swal.fire({
      icon: 'error',
      title: t('common.error'),
      text: isRtl.value ? 'الحد الأقصى لحجم الشعار هو 2 ميجابايت.' : 'Maximum logo file size is 2MB.'
    })
    return
  }

  isUploadingLogo.value = true
  try {
    const url = await settingsStore.uploadBrandingAsset(file, 'logo')
    formData.value.logoUrl = url
    formData.value.logoType = 'image'
    Swal.fire({
      icon: 'success',
      title: t('common.success'),
      timer: 1500,
      showConfirmButton: false
    })
  } catch (err) {
    console.error(err)
  } finally {
    isUploadingLogo.value = false
  }
}

const handleFaviconUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  if (file.size > 1 * 1024 * 1024) {
    Swal.fire({
      icon: 'error',
      title: t('common.error'),
      text: isRtl.value ? 'الحد الأقصى لحجم الأيقونة هو 1 ميجابايت.' : 'Maximum favicon file size is 1MB.'
    })
    return
  }

  isUploadingFavicon.value = true
  try {
    const url = await settingsStore.uploadBrandingAsset(file, 'favicon')
    formData.value.faviconUrl = url
    Swal.fire({
      icon: 'success',
      title: t('common.success'),
      timer: 1500,
      showConfirmButton: false
    })
  } catch (err) {
    console.error(err)
  } finally {
    isUploadingFavicon.value = false
  }
}

const handleSave = async () => {
  const success = await settingsStore.saveSettings(formData.value)
  if (success) {
    settingsStore.updateDocumentTitle(locale.value)
    Swal.fire({
      icon: 'success',
      title: t('common.success'),
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000
    })
  }
}
</script>

<template>
  <AdminLayout>
    <div class="settings-view">
      
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-text">
          <h1><i class="fa-solid fa-sliders"></i> {{ t('admin.settingsManage') }}</h1>
          <p>{{ t('admin.brandingSub') }}</p>
        </div>

        <button 
          type="button" 
          class="save-btn header-save" 
          :disabled="settingsStore.isSaving"
          @click="handleSave"
        >
          <i v-if="settingsStore.isSaving" class="fa-solid fa-circle-notch fa-spin"></i>
          <i v-else class="fa-solid fa-floppy-disk"></i>
          <span>{{ settingsStore.isSaving ? t('admin.savingSettings') : t('common.save') }}</span>
        </button>
      </div>

      <div class="settings-sections-grid">
        
        <!-- Section 1: Maintenance Mode -->
        <div class="settings-card maintenance-card">
          <div class="card-title-row">
            <div class="card-icon warning-icon">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
              <h3>{{ t('admin.maintenanceSectionTitle') }}</h3>
              <p>{{ t('admin.maintenanceSectionSub') }}</p>
            </div>
          </div>

          <div class="maintenance-toggle-box">
            <label class="switch-control" :aria-label="t('admin.maintenanceToggleLabel')">
              <input 
                type="checkbox" 
                v-model="formData.maintenanceMode" 
              />
              <span class="slider-round"></span>
            </label>
            <div class="switch-status-text">
              <span v-if="formData.maintenanceMode" class="status-badge active-maintenance">
                <i class="fa-solid fa-circle-dot"></i> {{ t('admin.maintenanceToggleLabel') }}
              </span>
              <span v-else class="status-badge normal-mode">
                <i class="fa-solid fa-circle-check"></i> {{ isRtl ? 'المتجر متاح ويعمل بصورة طبيعية' : 'Store is active and open to customers' }}
              </span>
            </div>
          </div>

          <div class="form-group mt-3" v-if="formData.maintenanceMode">
            <label>{{ t('admin.maintenanceMessageLabel') }}</label>
            <textarea 
              v-model="formData.maintenanceMessage" 
              rows="3" 
              :placeholder="isRtl ? 'اكتب رسالة توضيحية لسبب التوقف وموعد العودة المتوقع...' : 'Enter maintenance notice message for visitors...'"
            ></textarea>
          </div>
        </div>

        <!-- Section 2: Store Identity & Branding -->
        <div class="settings-card">
          <div class="card-title-row">
            <div class="card-icon brand-icon">
              <i class="fa-solid fa-paint-roller"></i>
            </div>
            <div>
              <h3>{{ t('admin.brandingTitle') }}</h3>
              <p>{{ t('admin.brandingSub') }}</p>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label>{{ t('admin.storeNameArLabel') }}</label>
              <input type="text" v-model="formData.storeNameAr" placeholder="متجري">
            </div>

            <div class="form-group">
              <label>{{ t('admin.storeNameEnLabel') }}</label>
              <input type="text" v-model="formData.storeNameEn" placeholder="MyStore">
            </div>
          </div>

          <!-- Logo Type Selection -->
          <div class="form-group mt-3">
            <label>{{ t('admin.logoTypeLabel') }}</label>
            <div class="logo-type-selector">
              <label class="type-pill" :class="{ selected: formData.logoType === 'text' }">
                <input type="radio" value="text" v-model="formData.logoType" />
                <i class="fa-solid fa-font"></i>
                <span>{{ t('admin.textLogoPill') }}</span>
              </label>

              <label class="type-pill" :class="{ selected: formData.logoType === 'image' }">
                <input type="radio" value="image" v-model="formData.logoType" />
                <i class="fa-solid fa-image"></i>
                <span>{{ t('admin.imageLogoPill') }}</span>
              </label>
            </div>
          </div>

          <!-- Image Logo Uploader -->
          <div v-if="formData.logoType === 'image'" class="logo-uploader-box">
            <div class="logo-preview-area">
              <img v-if="formData.logoUrl" :src="formData.logoUrl" alt="Logo Preview" class="current-logo-img" />
              <div v-else class="no-logo-placeholder">
                <i class="fa-regular fa-image"></i>
                <span>{{ t('admin.noLogoYet') }}</span>
              </div>
            </div>

            <div class="logo-upload-controls">
              <button 
                type="button" 
                class="upload-btn" 
                :disabled="isUploadingLogo"
                @click="logoFileInput.click()"
              >
                <i v-if="isUploadingLogo" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-cloud-arrow-up"></i>
                <span>{{ isUploadingLogo ? t('profile.uploadingPhoto') : t('admin.uploadNewLogoBtn') }}</span>
              </button>
              <span class="upload-hint">{{ t('admin.uploadLogoHint') }}</span>
              <input 
                type="file" 
                ref="logoFileInput" 
                accept="image/*" 
                class="hidden-input" 
                @change="handleLogoUpload" 
              />
            </div>
          </div>

          <!-- Favicon Uploader -->
          <div class="favicon-row mt-3">
            <div class="favicon-meta">
              <label>{{ t('admin.faviconLabel') }}</label>
              <span class="upload-hint">{{ t('admin.faviconHint') }}</span>
            </div>
            
            <div class="favicon-controls">
              <img v-if="formData.faviconUrl" :src="formData.faviconUrl" class="favicon-preview" alt="Favicon" />
              <button 
                type="button" 
                class="upload-btn sm" 
                :disabled="isUploadingFavicon"
                @click="faviconFileInput.click()"
              >
                <i v-if="isUploadingFavicon" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-upload"></i>
                <span>{{ t('admin.updateFaviconBtn') }}</span>
              </button>
              <input 
                type="file" 
                ref="faviconFileInput" 
                accept="image/*" 
                class="hidden-input" 
                @change="handleFaviconUpload" 
              />
            </div>
          </div>
        </div>

        <!-- Section 3: Contact & Communication -->
        <div class="settings-card">
          <div class="card-title-row">
            <div class="card-icon contact-icon">
              <i class="fa-solid fa-headset"></i>
            </div>
            <div>
              <h3>{{ t('admin.contactSettingsTitle') }}</h3>
              <p>{{ t('admin.contactSettingsSub') }}</p>
            </div>
          </div>

          <div class="form-grid-3">
            <div class="form-group">
              <label>{{ t('admin.hotlineLabel') }}</label>
              <input type="tel" v-model="formData.contactPhone" placeholder="+20 100 000 0000">
            </div>

            <div class="form-group">
              <label>{{ t('admin.supportEmailLabel') }}</label>
              <input type="email" v-model="formData.contactEmail" placeholder="support@mystore.com">
            </div>

            <div class="form-group">
              <label>{{ t('admin.whatsappLabel') }}</label>
              <input type="tel" v-model="formData.whatsappNumber" placeholder="+201000000000">
            </div>
          </div>
        </div>

        <!-- Section 4: Social Media Links -->
        <div class="settings-card">
          <div class="card-title-row">
            <div class="card-icon social-icon">
              <i class="fa-solid fa-share-nodes"></i>
            </div>
            <div>
              <h3>{{ t('admin.socialMediaTitle') }}</h3>
              <p>{{ t('admin.socialMediaSub') }}</p>
            </div>
          </div>

          <div class="form-grid-3">
            <div class="form-group">
              <label><i class="fa-brands fa-facebook text-blue"></i> Facebook</label>
              <input type="url" v-model="formData.socials.facebook" placeholder="https://facebook.com/yourstore">
            </div>

            <div class="form-group">
              <label><i class="fa-brands fa-instagram text-pink"></i> Instagram</label>
              <input type="url" v-model="formData.socials.instagram" placeholder="https://instagram.com/yourstore">
            </div>

            <div class="form-group">
              <label><i class="fa-brands fa-x-twitter"></i> X / Twitter</label>
              <input type="url" v-model="formData.socials.twitter" placeholder="https://x.com/yourstore">
            </div>
          </div>
        </div>

      </div>

      <!-- Bottom Sticky Save Bar -->
      <div class="bottom-actions-bar">
        <button 
          type="button" 
          class="save-btn" 
          :disabled="settingsStore.isSaving"
          @click="handleSave"
        >
          <i v-if="settingsStore.isSaving" class="fa-solid fa-circle-notch fa-spin"></i>
          <i v-else class="fa-solid fa-floppy-disk"></i>
          <span>{{ settingsStore.isSaving ? t('admin.savingSettings') : t('admin.saveAllSettings') }}</span>
        </button>
      </div>

    </div>
  </AdminLayout>
</template>

<style scoped>
.settings-view {
  padding-bottom: 60px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 30px;
}

.header-text h1 {
  margin: 0 0 6px 0;
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-text h1 i {
  color: #059669;
}

.header-text p {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
}

.settings-sections-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-card {
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04);
  padding: 28px;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.warning-icon {
  background: #fef3c7;
  color: #d97706;
}

.brand-icon {
  background: #ecfdf5;
  color: #059669;
}

.contact-icon {
  background: #eff6ff;
  color: #2563eb;
}

.social-icon {
  background: #f5f3ff;
  color: #7c3aed;
}

.card-title-row h3 {
  margin: 0 0 4px 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
}

.card-title-row p {
  margin: 0;
  font-size: 0.84rem;
  color: #64748b;
}

/* Maintenance Toggle Switch */
.maintenance-toggle-box {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.switch-control {
  position: relative;
  display: inline-block;
  width: 56px;
  height: 32px;
  flex-shrink: 0;
}

.switch-control input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider-round {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #cbd5e1;
  transition: 0.3s;
  border-radius: 34px;
}

.slider-round:before {
  position: absolute;
  content: "";
  height: 24px;
  width: 24px;
  inset-inline-start: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

input:checked + .slider-round {
  background-color: #d97706;
}

input:checked + .slider-round:before {
  transform: translateX(24px);
}

[dir="rtl"] input:checked + .slider-round:before {
  transform: translateX(-24px);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
}

.status-badge.active-maintenance {
  background: #fef3c7;
  color: #b45309;
}

.status-badge.normal-mode {
  background: #ecfdf5;
  color: #059669;
}

/* Forms */
.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.form-grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 0.88rem;
  font-weight: 700;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 6px;
}

.form-group input, .form-group textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.95rem;
  background: #f8fafc;
  outline: none;
  box-sizing: border-box;
  min-height: 44px;
  transition: all 0.2s;
}

.form-group input:focus, .form-group textarea:focus {
  border-color: #059669;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15);
}

.mt-3 {
  margin-top: 18px;
}

/* Logo Type Selector */
.logo-type-selector {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.type-pill {
  flex: 1;
  min-width: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  background: #f8fafc;
  font-size: 0.9rem;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  min-height: 44px;
  transition: all 0.2s;
}

.type-pill input {
  display: none;
}

.type-pill.selected {
  border-color: #059669;
  background: #ecfdf5;
  color: #059669;
  box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.2);
}

/* Logo Uploader Box */
.logo-uploader-box {
  margin-top: 16px;
  padding: 18px;
  background: #f8fafc;
  border-radius: 14px;
  border: 1px dashed #cbd5e1;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.logo-preview-area {
  width: 160px;
  height: 70px;
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 8px;
}

.current-logo-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.no-logo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #94a3b8;
  font-size: 0.75rem;
}

.logo-upload-controls {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #0f172a;
  color: #ffffff;
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  min-height: 44px;
  transition: all 0.2s;
  width: fit-content;
}

.upload-btn:hover:not(:disabled) {
  background: #059669;
}

.upload-btn.sm {
  padding: 8px 16px;
  font-size: 0.85rem;
  min-height: 44px;
}

.upload-hint {
  font-size: 0.75rem;
  color: #64748b;
}

.hidden-input {
  display: none;
}

/* Favicon */
.favicon-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #f8fafc;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 14px;
}

.favicon-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.favicon-preview {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
}

/* Save Buttons */
.save-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #059669;
  color: #ffffff;
  border: none;
  padding: 12px 28px;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  min-height: 44px;
  box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);
  transition: all 0.2s ease;
}

.save-btn:hover:not(:disabled) {
  background: #047857;
  transform: translateY(-2px);
}

.bottom-actions-bar {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .form-grid-2 {
    grid-template-columns: 1fr;
  }
  .settings-card {
    padding: 20px;
  }
  .logo-uploader-box {
    flex-direction: column;
    align-items: flex-start;
  }
  .favicon-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
