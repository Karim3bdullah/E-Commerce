<template>
  <footer class="footer">
    <div class="footer-container">
      
      <!-- العمود الأول: نبذة عن المتجر -->
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

      <!-- العمود الثاني: روابط سريعة -->
      <div class="footer-col">
        <h3>{{ t('footer.quickLinks') }}</h3>
        <ul class="footer-links">
          <li><router-link to="/">{{ t('nav.home') }}</router-link></li>
          <li><router-link to="/cart">{{ t('footer.cart') }}</router-link></li>
          <li><router-link to="/checkout">{{ t('footer.checkout') }}</router-link></li>
          <li><a href="javascript:void(0)" @click="openModal('about')">{{ t('footer.about') }}</a></li>
        </ul>
      </div>

      <!-- العمود الثالث: خدمة العملاء -->
      <div class="footer-col">
        <h3>{{ t('footer.customerService') }}</h3>
        <ul class="footer-links">
          <li><a href="javascript:void(0)" @click="openModal('contact')">{{ t('footer.contactUs') }}</a></li>
          <li><a href="javascript:void(0)" @click="openModal('returnPolicy')">{{ t('footer.returnPolicy') }}</a></li>
          <li><a href="javascript:void(0)" @click="openModal('faq')">{{ t('footer.faq') }}</a></li>
          <li><router-link to="/my-orders">{{ t('footer.trackOrder') }}</router-link></li>
        </ul>
      </div>

      <!-- العمود الرابع: وسائل الدفع -->
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

    <!-- أسفل الفوتر -->
    <div class="footer-bottom">
      <p>{{ t('footer.rights') }}</p>
    </div>

    <!-- نافذة منبثقة للمعلومات والسياسات (Disclosures Modal) -->
    <div v-if="activeModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ modalTitle }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <p v-html="modalContent" class="disclosure-text"></p>
        </div>
        <div class="modal-footer">
          <button class="close-action-btn" @click="closeModal">{{ t('common.cancel') }}</button>
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
.footer-logo-img {
  max-height: 44px;
  max-width: 180px;
  object-fit: contain;
}

.footer {
  background-color: #0f172a;
  color: #94a3b8;
  padding-top: 60px;
  margin-top: 80px;
  border-top: 1px solid #1e293b;
}

.footer-container {
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 20px 40px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
}

.footer-col h3 {
  color: #ffffff;
  font-size: 1.1rem;
  margin-bottom: 20px;
  font-weight: 700;
  position: relative;
  padding-bottom: 8px;
}

.footer-col h3::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 35px;
  height: 3px;
  background-color: #2563eb;
  border-radius: 2px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.brand-icon {
  font-size: 1.8rem;
  color: #2563eb;
}

.footer-brand h2 {
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0;
}

.brand-desc {
  font-size: 0.9rem;
  line-height: 1.7;
  margin-bottom: 20px;
  color: #94a3b8;
}

.social-icons {
  display: flex;
  gap: 12px;
}

.social-icon {
  width: 38px;
  height: 38px;
  background: #1e293b;
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: all 0.3s ease;
}

.social-icon:hover {
  background: #2563eb;
  transform: translateY(-3px);
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-links li a {
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.95rem;
  transition: color 0.2s ease, padding 0.2s ease;
  cursor: pointer;
}

.footer-links li a:hover {
  color: #ffffff;
  padding-right: 5px;
}

.payment-desc {
  font-size: 0.9rem;
  margin-bottom: 15px;
}

.payment-methods {
  display: flex;
  gap: 15px;
  font-size: 2rem;
  color: #cbd5e1;
}

.pay-icon {
  transition: color 0.3s;
}

.pay-icon:hover {
  color: #2563eb;
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
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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
  border-radius: 16px;
  max-width: 550px;
  width: 100%;
  padding: 28px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  direction: rtl;
  position: relative;
  animation: modalFadeIn 0.25s ease-out;
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
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.6rem;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: #1e293b;
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
  background-color: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.close-action-btn:hover {
  background-color: #e2e8f0;
  color: #1e293b;
}

@media (max-width: 768px) {
  .footer-container {
    grid-template-columns: 1fr;
    gap: 30px;
  }
}
</style>