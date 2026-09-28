<script setup>
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settingsStore'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const settingsStore = useSettingsStore()
const { t, locale } = useI18n()

const isRtl = computed(() => locale.value === 'ar')
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
  <div class="maintenance-screen" :class="isRtl ? 'rtl-screen' : 'ltr-screen'">
    <div class="maintenance-card">
      
      <!-- Live Status Badge -->
      <div class="status-indicator-badge">
        <span class="pulsing-amber-dot"></span>
        <span>{{ t('maintenance.liveStatus') }}</span>
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
      <h2 class="maintenance-title">{{ t('maintenance.title') }}</h2>
      <p class="maintenance-message">
        {{ settingsStore.maintenanceMessage || t('maintenance.defaultMessage') }}
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
          <span>{{ t('maintenance.whatsappContact') }}</span>
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
      <div class="admin-access-link">
        <RouterLink to="/login" class="admin-login-link">
          <i class="fa-solid fa-lock"></i>
          <span>{{ t('maintenance.adminAccess') }}</span>
        </RouterLink>
      </div>

    </div>
  </div>
</template>

<style scoped>
.maintenance-screen {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 10%, #1e293b 0%, #0f172a 100%);
  padding: 24px;
  color: #ffffff;
}

.maintenance-screen.rtl-screen {
  direction: rtl;
  text-align: right;
}

.maintenance-screen.ltr-screen {
  direction: ltr;
  text-align: left;
}

.maintenance-card {
  max-width: 600px;
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 28px;
  padding: 44px 32px;
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
  animation: amberPulse 1.8s infinite cubic-bezier(0.66, 0, 0, 1);
}

@keyframes amberPulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
}

.brand-display {
  margin-bottom: 24px;
}

.maintenance-logo {
  max-height: 52px;
  max-width: 220px;
  object-fit: contain;
}

.text-logo-box {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #ffffff;
}

.text-logo-box i {
  font-size: 1.8rem;
  color: #059669;
}

.text-logo-box h1 {
  font-size: 1.6rem;
  margin: 0;
  font-weight: 800;
}

.maintenance-graphic {
  margin-bottom: 24px;
}

.icon-orb {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  color: #38bdf8;
  box-shadow: inset 0 2px 10px rgba(255, 255, 255, 0.1);
}

.maintenance-title {
  font-size: 1.6rem;
  font-weight: 800;
  margin: 0 0 12px 0;
  color: #ffffff;
}

.maintenance-message {
  font-size: 0.95rem;
  line-height: 1.7;
  color: #94a3b8;
  margin: 0 0 28px 0;
  max-width: 480px;
}

.contact-strip {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 24px;
}

.contact-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  min-height: 44px;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;
}

.whatsapp-pill {
  background: #25d366;
  color: #ffffff;
}

.whatsapp-pill:hover {
  background: #1eb757;
  transform: translateY(-2px);
}

.email-pill {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.email-pill:hover {
  background: rgba(255, 255, 255, 0.18);
  transform: translateY(-2px);
}

.social-links-row {
  display: flex;
  gap: 12px;
  margin-bottom: 28px;
}

.social-btn {
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  text-decoration: none;
  transition: all 0.2s ease;
}

.social-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  transform: translateY(-2px);
}

.admin-access-link {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 20px;
  width: 100%;
}

.admin-login-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease;
  min-height: 44px;
}

.admin-login-link:hover {
  color: #38bdf8;
}

@media (max-width: 480px) {
  .maintenance-card {
    padding: 32px 18px;
  }

  .maintenance-title {
    font-size: 1.35rem;
  }

  .contact-strip {
    flex-direction: column;
    width: 100%;
  }

  .contact-pill {
    width: 100%;
    justify-content: center;
  }
}
</style>
