<template>
  <footer class="footer">
    <div class="footer-container">
      
      <!-- Column 1: Store Brand & Socials -->
      <div class="footer-col">
        <div class="footer-brand">
          <template v-if="settingsStore.logoType === 'image' && settingsStore.logoUrl">
            <img :src="settingsStore.logoUrl" :alt="currentBrandName" class="footer-logo-img" />
          </template>
          <template v-else>
            <i class="fa-solid fa-bag-shopping brand-icon"></i>
            <h2>{{ currentBrandName }}</h2>
          </template>
        </div>
        <p class="brand-desc">
          {{ t('footer.desc') }}
        </p>
        <div class="social-icons">
          <a v-if="settingsStore.socials?.facebook" :href="settingsStore.socials.facebook" target="_blank" rel="noopener noreferrer" class="social-icon" title="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
          <a v-if="settingsStore.socials?.instagram" :href="settingsStore.socials.instagram" target="_blank" rel="noopener noreferrer" class="social-icon" title="Instagram"><i class="fa-brands fa-instagram"></i></a>
          <a v-if="settingsStore.socials?.twitter" :href="settingsStore.socials.twitter" target="_blank" rel="noopener noreferrer" class="social-icon" title="X / Twitter"><i class="fa-brands fa-x-twitter"></i></a>
          <a v-if="settingsStore.whatsappNumber" :href="`https://wa.me/${settingsStore.whatsappNumber.replace(/[^\\d+]/g, '')}`" target="_blank" rel="noopener noreferrer" class="social-icon" title="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
        </div>
      </div>

      <!-- Column 2: Quick Links -->
      <div class="footer-col">
        <h3>{{ t('footer.quickLinks') }}</h3>
        <ul class="footer-links">
          <li><router-link to="/">{{ t('nav.home') }}</router-link></li>
          <li><router-link to="/cart">{{ t('footer.cart') }}</router-link></li>
          <li><router-link to="/checkout">{{ t('footer.checkout') }}</router-link></li>
          <li><a href="javascript:void(0)" @click="openModal('about')">{{ t('footer.about') }}</a></li>
        </ul>
      </div>

      <!-- Column 3: Customer Service -->
      <div class="footer-col">
        <h3>{{ t('footer.customerService') }}</h3>
        <ul class="footer-links">
          <li><a href="javascript:void(0)" @click="openModal('contact')">{{ t('footer.contactUs') }}</a></li>
          <li><a href="javascript:void(0)" @click="openModal('returnPolicy')">{{ t('footer.returnPolicy') }}</a></li>
          <li><a href="javascript:void(0)" @click="openModal('faq')">{{ t('footer.faq') }}</a></li>
          <li><router-link to="/my-orders">{{ t('footer.trackOrder') }}</router-link></li>
        </ul>
      </div>

      <!-- Column 4: Payment Methods -->
      <div class="footer-col">
        <h3>{{ t('footer.securePayment') }}</h3>
        <p class="payment-desc">{{ t('footer.paymentDesc') }}</p>
        <div class="payment-methods">
          <i class="fa-brands fa-cc-visa pay-icon" title="Visa"></i>
          <i class="fa-brands fa-cc-mastercard pay-icon" title="Mastercard"></i>
          <i class="fa-brands fa-cc-apple-pay pay-icon" title="Apple Pay"></i>
          <i class="fa-solid fa-money-bill-wave pay-icon" title="Cash on Delivery"></i>
        </div>
      </div>

    </div>

    <!-- Footer Bottom -->
    <div class="footer-bottom">
      <p>{{ t('footer.rights') }}</p>
    </div>

    <!-- Disclosure Modals with Viewport Boundary & Direction Safety -->
    <div v-if="activeModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content" :class="isRtl ? 'rtl-modal' : 'ltr-modal'">
        <div class="modal-header">
          <h3>{{ modalTitle }}</h3>
          <button type="button" class="close-btn" @click="closeModal" :aria-label="t('common.close')">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="modal-body">
          <p v-html="modalContent" class="disclosure-text"></p>
        </div>
        <div class="modal-footer">
          <button type="button" class="close-action-btn" @click="closeModal">{{ t('common.close') }}</button>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '../stores/settingsStore'

const { t, locale } = useI18n()
const settingsStore = useSettingsStore()

const isRtl = computed(() => locale.value === 'ar')
const currentBrandName = computed(() => settingsStore.getStoreName(locale.value))

const activeModal = ref(null)

const modalTitle = computed(() => {
  if (!activeModal.value) return ''
  return t(`footer.${activeModal.value}Title`)
})

const modalContent = computed(() => {
  if (!activeModal.value) return ''
  return t(`footer.${activeModal.value}Content`)
})

const openModal = (type) => {
  activeModal.value = type
}

const closeModal = () => {
  activeModal.value = null
}
</script>

<style scoped>
.footer {
  background-color: #0f172a;
  color: #f8fafc;
  padding-top: 50px;
  margin-top: 60px;
  border-top: 1px solid #1e293b;
  position: relative;
  width: 100%;
}

.footer-container {
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 24px 50px;
  display: grid;
  grid-template-columns: 2fr 1fr 1.2fr 1.2fr;
  gap: 40px;
}

.footer-col {
  display: flex;
  flex-direction: column;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.brand-icon {
  font-size: 1.8rem;
  color: #10b981;
}

.footer-brand h2 {
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0;
  color: white;
}

.footer-logo-img {
  max-height: 48px;
  max-width: 180px;
  object-fit: contain;
}

.brand-desc {
  color: #94a3b8;
  font-size: 0.92rem;
  line-height: 1.7;
  margin-bottom: 24px;
}

.social-icons {
  display: flex;
  gap: 12px;
}

.social-icon {
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  background-color: #1e293b;
  color: #cbd5e1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-size: 1.1rem;
  transition: all 0.3s;
}

.social-icon:hover {
  background-color: #10b981;
  color: white;
  transform: translateY(-3px);
}

.footer-col h3 {
  color: white;
  font-size: 1.15rem;
  margin-bottom: 20px;
  font-weight: 700;
  position: relative;
  padding-bottom: 10px;
}

.footer-col h3::after {
  content: '';
  position: absolute;
  bottom: 0;
  inset-inline-start: 0;
  width: 35px;
  height: 2px;
  background-color: #10b981;
  border-radius: 2px;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-links a {
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.92rem;
  transition: all 0.2s;
  display: inline-block;
}

.footer-links a:hover {
  color: #10b981;
  transform: translateX(4px);
}

.payment-desc {
  color: #94a3b8;
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: 16px;
}

.payment-methods {
  display: flex;
  gap: 15px;
  font-size: 2.2rem;
  color: #cbd5e1;
}

.pay-icon {
  transition: color 0.2s;
}

.pay-icon:hover {
  color: #10b981;
}

.footer-bottom {
  background-color: #090d16;
  padding: 20px;
  text-align: center;
  border-top: 1px solid #1e293b;
  font-size: 0.9rem;
  color: #64748b;
}

/* Modal Disclosures Styling */
.modal-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-content {
  background: #ffffff;
  color: #1e293b;
  border-radius: 18px;
  max-width: 550px;
  width: 100%;
  max-height: 85dvh;
  overflow-y: auto;
  padding: 28px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  position: relative;
  animation: modalFadeIn 0.25s ease-out;
}

.modal-content.rtl-modal {
  direction: rtl;
  text-align: right;
}

.modal-content.ltr-modal {
  direction: ltr;
  text-align: left;
}

@keyframes modalFadeIn {
  from { opacity: 0; transform: translateY(-15px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 14px;
  margin-bottom: 18px;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
}

.close-btn {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: 12px;
  font-size: 1.15rem;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.modal-body {
  margin-bottom: 20px;
  line-height: 1.8;
  color: #475569;
  font-size: 0.95rem;
}

.disclosure-text {
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
}

.close-action-btn {
  padding: 10px 22px;
  min-height: 44px;
  background-color: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.close-action-btn:hover {
  background-color: #e2e8f0;
  color: #0f172a;
}

@media (max-width: 1024px) {
  .footer-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
  }
}

@media (max-width: 640px) {
  .footer-container {
    grid-template-columns: 1fr;
    gap: 30px;
  }
}
</style>