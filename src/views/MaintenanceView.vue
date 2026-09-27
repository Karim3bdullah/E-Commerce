<script setup>
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settingsStore'
import { useI18n } from 'vue-i18n'
import { auth } from '../firebase/config'

const router = useRouter()
const settingsStore = useSettingsStore()
const { locale } = useI18n()

const currentStoreName = computed(() => settingsStore.getStoreName(locale.value))

// Automatically redirect back to storefront if admin turns off maintenance mode
watch(() => settingsStore.maintenanceMode, (isMaintenance) => {
  if (!isMaintenance) {
    router.push('/')
  }
})

const whatsappLink = computed(() => {
  const num = settingsStore.whatsappNumber?.replace(/[^\d+]/g, '') || ''
  return `https://wa.me/${num}`
})
</script>

<template>
  <div class="maintenance-screen">
    <div class="maintenance-card">
      
      <!-- Live Status Badge -->
      <div class="status-indicator-badge">
        <span class="pulsing-amber-dot"></span>
        <span>وضع الصيانة المجدولة قيد التنفيذ</span>
      </div>

      <!-- Store Brand / Logo -->
      <div class="brand-display">
        <img 
          v-if="settingsStore.logoType === 'image' && settingsStore.logoUrl" 
          :src="settingsStore.logoUrl" 
          alt="Logo" 
          class="maintenance-logo" 
        />
        <div v-else class="text-logo-box">
          <i class="fa-solid fa-bag-shopping"></i>
          <h1>{{ currentStoreName }}</h1>
        </div>
      </div>

      <!-- Central Icon Graphic -->
      <div class="maintenance-graphic">
        <div class="icon-orb">
          <i class="fa-solid fa-screwdriver-wrench"></i>
        </div>
      </div>

      <!-- Heading & Dynamic Message -->
      <h2 class="maintenance-title">نعمل على تحسين تجربة تسوقك</h2>
      <p class="maintenance-message">
        {{ settingsStore.maintenanceMessage }}
      </p>

      <!-- Communication & Direct Assistance -->
      <div class="contact-strip">
        <a 
          v-if="settingsStore.whatsappNumber" 
          :href="whatsappLink" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="contact-pill whatsapp-pill"
        >
          <i class="fa-brands fa-whatsapp"></i>
          <span>تواصل عبر واتساب</span>
        </a>

        <a 
          v-if="settingsStore.contactEmail" 
          :href="`mailto:${settingsStore.contactEmail}`" 
          class="contact-pill email-pill"
        >
          <i class="fa-regular fa-envelope"></i>
          <span>{{ settingsStore.contactEmail }}</span>
        </a>
      </div>

      <!-- Social Links -->
      <div class="social-links-row" v-if="settingsStore.socials">
        <a v-if="settingsStore.socials.facebook" :href="settingsStore.socials.facebook" target="_blank" rel="noopener noreferrer" class="social-btn">
          <i class="fa-brands fa-facebook-f"></i>
        </a>
        <a v-if="settingsStore.socials.instagram" :href="settingsStore.socials.instagram" target="_blank" rel="noopener noreferrer" class="social-btn">
          <i class="fa-brands fa-instagram"></i>
        </a>
        <a v-if="settingsStore.socials.twitter" :href="settingsStore.socials.twitter" target="_blank" rel="noopener noreferrer" class="social-btn">
          <i class="fa-brands fa-x-twitter"></i>
        </a>
      </div>

      <!-- Admin Access Link -->
      <div class="admin-access-box">
        <router-link to="/login" class="admin-link">
          <i class="fa-solid fa-lock"></i>
          <span>دخول المسؤولين (Store Admin)</span>
        </router-link>
      </div>

    </div>
  </div>
</template>

<style scoped>
.maintenance-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 10%, #1e293b 0%, #0f172a 100%);
  padding: 24px;
  direction: rtl;
  color: #ffffff;
  font-family: 'Cairo', sans-serif;
}

.maintenance-card {
  max-width: 600px;
  width: 100%;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 28px;
  padding: 48px 36px;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.status-indicator-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: rgba(217, 119, 6, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #fbbf24;
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 0.84rem;
  font-weight: 700;
  margin-bottom: 24px;
}

.pulsing-amber-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f59e0b;
  box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7);
  animation: pulseDot 1.6s infinite;
}

@keyframes pulseDot {
  0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
  70% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
  100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
}

.brand-display {
  margin-bottom: 28px;
}

.maintenance-logo {
  max-height: 54px;
  max-width: 200px;
  object-fit: contain;
}

.text-logo-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.text-logo-box i {
  font-size: 1.8rem;
  color: #10b981;
}

.text-logo-box h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 900;
  letter-spacing: -0.5px;
  color: #ffffff;
}

.maintenance-graphic {
  margin-bottom: 24px;
}

.icon-orb {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.05) 100%);
  border: 1px solid rgba(16, 185, 129, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.4rem;
  color: #10b981;
  box-shadow: 0 0 30px rgba(16, 185, 129, 0.2);
}

.maintenance-title {
  margin: 0 0 12px 0;
  font-size: 1.7rem;
  font-weight: 800;
  color: #ffffff;
}

.maintenance-message {
  margin: 0 0 32px 0;
  font-size: 1.05rem;
  line-height: 1.7;
  color: #94a3b8;
  max-width: 480px;
}

.contact-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-bottom: 28px;
}

.contact-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;
}

.whatsapp-pill {
  background: #10b981;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
}

.whatsapp-pill:hover {
  background: #059669;
  transform: translateY(-2px);
}

.email-pill {
  background: rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.email-pill:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.social-links-row {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
}

.social-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.social-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  transform: translateY(-2px);
}

.admin-access-box {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 20px;
  width: 100%;
}

.admin-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 0.85rem;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.admin-link:hover {
  color: #94a3b8;
}
</style>
