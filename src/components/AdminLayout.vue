<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { auth } from '../firebase/config'
import { signOut } from 'firebase/auth'
import { useRouter, useRoute } from 'vue-router'
import Swal from 'sweetalert2'
import { useProductStore } from '../stores/productstore' 
import { useSettingsStore } from '../stores/settingsStore'
import { useI18n } from 'vue-i18n'
import AdminNotifications from '../components/AdminNotifications.vue' 

const router = useRouter()
const route = useRoute()
const productStore = useProductStore() 
const settingsStore = useSettingsStore()
const { t, locale } = useI18n()

const isRtl = computed(() => locale.value === 'ar')
const isMobileSidebarOpen = ref(false)

watch(isMobileSidebarOpen, (isOpen) => {
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('drawer-open', isOpen)
  }
})

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.classList.remove('drawer-open')
  }
})

const toggleLanguage = () => {
  locale.value = locale.value === 'ar' ? 'en' : 'ar'
  document.documentElement.dir = locale.value === 'ar' ? 'rtl' : 'ltr'
  localStorage.setItem('lang', locale.value)
  settingsStore.updateDocumentTitle(locale.value)
}

const handleLogout = async () => {
  const result = await Swal.fire({
    title: t('admin.logout'),
    text: t('nav.logoutConfirmText'),
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#94a3b8',
    confirmButtonText: t('nav.logoutYes'),
    cancelButtonText: t('nav.logoutCancel')
  })

  if (result.isConfirmed) {
    await signOut(auth)
    router.push('/login')
  }
}
</script>

<template>
  <div class="admin-layout" :class="isRtl ? 'rtl-layout' : 'ltr-layout'">
    
    <!-- Mobile Sidebar Backdrop Overlay -->
    <Transition name="fade">
      <div 
        v-if="isMobileSidebarOpen" 
        class="admin-overlay" 
        @click="isMobileSidebarOpen = false"
      ></div>
    </Transition>

    <!-- Admin Sidebar Navigation -->
    <aside 
      class="sidebar" 
      :class="[
        isRtl ? 'rtl-sidebar' : 'ltr-sidebar',
        { 'mobile-open': isMobileSidebarOpen }
      ]"
    >
      <div class="sidebar-brand">
        <div class="brand-title-box">
          <i class="fa-solid fa-shield-halved"></i>
          <span>{{ t('nav.dashboard') }}</span>
        </div>
        <button 
          type="button" 
          class="sidebar-close-btn" 
          @click="isMobileSidebarOpen = false"
          :aria-label="t('common.close')"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <ul class="sidebar-menu">
        <li>
          <RouterLink to="/admin/dashboard" class="menu-link" :class="{ active: route.path === '/admin/dashboard' }" @click="isMobileSidebarOpen = false">
            <i class="fa-solid fa-chart-line"></i>
            <span>{{ t('admin.dashboard') }}</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/admin/orders" class="menu-link" :class="{ active: route.path === '/admin/orders' }" @click="isMobileSidebarOpen = false">
            <i class="fa-solid fa-box-open"></i>
            <span>{{ t('admin.ordersManage') }}</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/admin/products" class="menu-link" :class="{ active: route.path === '/admin/products' }" @click="isMobileSidebarOpen = false">
            <i class="fa-solid fa-boxes-stacked"></i>
            <span>{{ t('admin.productsManage') }}</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/admin/users" class="menu-link" :class="{ active: route.path === '/admin/users' }" @click="isMobileSidebarOpen = false">
            <i class="fa-solid fa-users"></i>
            <span>{{ t('admin.usersManage') }}</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/admin/settings" class="menu-link" :class="{ active: route.path === '/admin/settings' }" @click="isMobileSidebarOpen = false">
            <i class="fa-solid fa-sliders"></i>
            <span>{{ t('admin.settingsManage') }}</span>
          </RouterLink>
        </li>
        
        <hr class="divider">
        <li>
          <RouterLink to="/" class="menu-link back-store">
            <i class="fa-solid fa-store"></i>
            <span>{{ t('admin.backToStore') }}</span>
          </RouterLink>
        </li>
      </ul>

      <!-- Sticky Bottom Safe Footer -->
      <div class="sidebar-footer">
        <button type="button" @click="handleLogout" class="logout-btn">
          <i class="fa-solid fa-arrow-right-from-bracket"></i>
          <span>{{ t('admin.logout') }}</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Container -->
    <main class="main-content">
      
      <!-- Topbar Header -->
      <header class="topbar">
        <div class="topbar-left">
          <!-- Hamburger Menu for Screens < 1024px -->
          <button 
            type="button" 
            class="admin-burger-btn" 
            @click="isMobileSidebarOpen = true"
            :aria-label="t('common.details')"
          >
            <i class="fa-solid fa-bars"></i>
          </button>

          <!-- Search Bar for Products view -->
          <div class="admin-search-bar" :class="{ 'hidden-search': route.path !== '/admin/products' }">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input 
              type="text" 
              v-model="productStore.searchQuery" 
              :placeholder="t('admin.searchPlaceholder')" 
              class="search-input"
            >
          </div>
        </div>

        <div class="topbar-actions">
          <!-- Language Toggle in Admin -->
          <button @click="toggleLanguage" class="admin-lang-btn" :title="locale === 'ar' ? 'English' : 'العربية'">
            <i class="fa-solid fa-globe"></i>
            <span>{{ locale === 'ar' ? 'EN' : 'AR' }}</span>
          </button>

          <AdminNotifications />
          
          <div class="admin-profile-wrapper">
            <div class="welcome-text">{{ t('admin.welcomeAdmin') }}</div>
            <div class="admin-profile">
              <img src="https://ui-avatars.com/api/?name=Admin&background=1e293b&color=fff" alt="Admin">
            </div>
          </div>
        </div>
      </header>

      <!-- Scroll-safe Content Wrapper -->
      <div class="content-wrapper">
        <slot></slot>
      </div>
      
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  background-color: #f1f5f9;
  width: 100%;
  max-width: 100vw;
  overflow-x: clip;
}

.rtl-layout {
  direction: rtl;
  text-align: right;
}

.ltr-layout {
  direction: ltr;
  text-align: left;
}

/* Sidebar */
.sidebar {
  width: 260px;
  background-color: #1e293b;
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  bottom: 0;
  height: 100vh;
  height: 100dvh;
  z-index: 1000;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow-y: auto;
}

.rtl-sidebar {
  right: 0;
  box-shadow: -4px 0 15px rgba(0,0,0,0.1);
}

.ltr-sidebar {
  left: 0;
  box-shadow: 4px 0 15px rgba(0,0,0,0.1);
}

.sidebar-brand {
  padding: 22px 20px;
  font-size: 1.3rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #334155;
  color: #38bdf8;
  flex-shrink: 0;
}

.brand-title-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar-close-btn {
  display: none;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.3rem;
  cursor: pointer;
  padding: 4px;
}

.sidebar-close-btn:hover {
  color: white;
}

.sidebar-menu {
  list-style: none;
  padding: 20px 14px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.menu-link {
  display: flex;
  align-items: center;
  gap: 14px;
  color: #94a3b8;
  text-decoration: none;
  padding: 12px 16px;
  min-height: 44px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.menu-link:hover {
  background-color: #334155;
  color: white;
}

.menu-link.active {
  background-color: #2563eb;
  color: white;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.menu-link i {
  font-size: 1.15rem;
  width: 22px;
  text-align: center;
}

.divider {
  border: 0;
  height: 1px;
  background-color: #334155;
  margin: 12px 6px;
}

.back-store {
  color: #10b981;
}

.back-store:hover {
  background-color: rgba(16, 185, 129, 0.15);
  color: #34d399;
}

.sidebar-footer {
  padding: 18px 20px;
  border-top: 1px solid #334155;
  flex-shrink: 0;
  padding-bottom: calc(18px + env(safe-area-inset-bottom));
}

.logout-btn {
  width: 100%;
  padding: 12px;
  min-height: 44px;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  transition: background 0.2s ease;
  font-family: inherit;
}

.logout-btn:hover { 
  background-color: #dc2626; 
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  min-width: 0;
  overflow-x: clip;
  width: 100%;
}

.rtl-layout .main-content {
  margin-right: 260px;
  width: calc(100% - 260px);
}

.ltr-layout .main-content {
  margin-left: 260px;
  width: calc(100% - 260px);
}

/* Topbar */
.topbar {
  background-color: white;
  padding: 14px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  position: sticky;
  top: 0;
  z-index: 99;
  border-bottom: 1px solid #e2e8f0;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
}

.admin-burger-btn {
  display: none;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #1e293b;
  font-size: 1.25rem;
  cursor: pointer;
  align-items: center;
  justify-content: center;
}

.admin-burger-btn:hover {
  background: #f1f5f9;
}

.admin-search-bar {
  position: relative;
  flex: 1;
  max-width: 380px;
}

.admin-search-bar.hidden-search {
  visibility: hidden;
  pointer-events: none;
}

.admin-search-bar .search-icon {
  position: absolute;
  inset-inline-start: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.admin-search-bar .search-input {
  width: 100%;
  padding-block: 10px;
  padding-inline-start: 38px;
  padding-inline-end: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background-color: #f8fafc;
  font-family: inherit;
  font-size: 0.92rem;
  outline: none;
  transition: all 0.2s;
}

.admin-search-bar .search-input:focus {
  border-color: #2563eb;
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.admin-lang-btn {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 8px 14px;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 700;
  color: #334155;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 42px;
  transition: all 0.2s ease;
}

.admin-lang-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.admin-profile-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  border-inline-start: 1px solid #e2e8f0;
  padding-inline-start: 16px;
}

.welcome-text {
  font-size: 0.95rem;
  font-weight: 700;
  color: #334155;
}

.admin-profile img {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 2px solid #e2e8f0;
}

.content-wrapper {
  padding: 28px;
  flex: 1;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: clip;
}

.admin-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  z-index: 999;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive Collapsing for Screens < 1024px */
@media (max-width: 1023px) {
  .sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    z-index: 1002;
  }

  .rtl-sidebar {
    transform: translateX(100%);
  }

  .ltr-sidebar {
    transform: translateX(-100%);
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .sidebar-close-btn {
    display: block;
  }

  .main-content,
  .rtl-layout .main-content,
  .ltr-layout .main-content {
    margin-right: 0 !important;
    margin-left: 0 !important;
    width: 100% !important;
  }

  .admin-burger-btn {
    display: flex;
  }
}

@media (max-width: 768px) {
  .topbar {
    padding: 12px 16px;
  }

  .admin-search-bar { 
    display: none; 
  }

  .welcome-text { 
    display: none; 
  }

  .content-wrapper {
    padding: 16px;
  }
}
</style>