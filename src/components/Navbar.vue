<template>
  <nav class="navbar">
    
    <!-- Top Promo Announcement Banner -->
    <div class="promo-announcement-banner">
      <div class="promo-banner-inner">
        <i class="fa-solid fa-sparkles"></i>
        <span>{{ t('promo.bannerText') }}</span>
        <button type="button" class="promo-code-badge" @click="copyPromoCode" title="Copy code">
          <span>SAVE10</span>
          <i class="fa-regular fa-copy"></i>
        </button>
      </div>
    </div>

    <!-- Mobile Drawer Overlay -->
    <Transition name="fade">
      <div v-if="isMobileMenuOpen" class="overlay" @click="isMobileMenuOpen = false"></div>
    </Transition>

    <div class="nav-container">
      
      <!-- Brand Logo -->
      <RouterLink to="/" class="brand">
        <template v-if="settingsStore.logoType === 'image' && settingsStore.logoUrl">
          <img :src="settingsStore.logoUrl" :alt="currentBrandName" class="brand-logo-img" />
        </template>
        <template v-else>
          <div class="logo-box">
            <i class="fa-solid fa-bag-shopping"></i>
          </div>
          <span class="brand-name">{{ currentBrandName }}</span>
        </template>
      </RouterLink>

      <!-- Desktop Nav Links (Hidden < 1024px) -->
      <ul class="desktop-links">
        <li>
          <RouterLink to="/" exact-active-class="active-route">{{ t('nav.home') }}</RouterLink>
        </li>
        <li>
          <RouterLink to="/my-orders" active-class="active-route">{{ t('nav.myOrders') }}</RouterLink>
        </li>
        <li v-if="isAdmin">
          <RouterLink to="/admin/dashboard" class="admin-badge">{{ t('nav.dashboard') }}</RouterLink>
        </li>
      </ul>

      <!-- Desktop Search Bar (Responsive flex-1 max-w-md, hidden < 1024px) -->
      <div class="desktop-search-wrapper">
        <div class="search-input-box">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input 
            type="text" 
            v-model="localSearchQuery" 
            @focus="showSuggestions = true"
            @input="showSuggestions = true"
            :placeholder="t('nav.searchPlaceholder')" 
            class="search-input"
            @keyup.enter="submitSearch"
          >
          <button 
            v-if="localSearchQuery.trim() !== ''" 
            type="button" 
            class="clear-search-btn" 
            @click="clearSearch"
            :aria-label="t('common.close')"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        
        <Transition name="fade">
          <ul v-if="showSuggestions && localSearchQuery.trim() !== ''" class="suggestions-list">
            <li v-for="item in suggestedProducts" :key="item.id" @click="selectSuggestion(item.title)">
              <img :src="item.image" alt="" class="sugg-img">
              <span class="sugg-title">{{ item.title }}</span>
            </li>
          </ul>
        </Transition>
      </div>

      <!-- Desktop Actions (Hidden < 1024px) -->
      <div class="desktop-actions">
        <!-- Language Switcher Button -->
        <button @click="toggleLanguage" class="lang-btn" :title="locale === 'ar' ? 'English' : 'العربية'">
          <i class="fa-solid fa-globe"></i>
          <span>{{ locale === 'ar' ? 'EN' : 'AR' }}</span>
        </button>

        <!-- Wishlist Link -->
        <RouterLink to="/wishlist" class="action-btn" :title="t('nav.wishlist')">
          <i class="fa-regular fa-heart"></i>
          <span v-if="wishlistStore.count > 0" class="badge wishlist-badge">
            {{ wishlistStore.count }}
          </span>
        </RouterLink>

        <!-- Cart Button (Opens Mini-Cart Drawer) -->
        <button type="button" class="action-btn" :title="t('nav.cart')" @click="cartStore.openMiniCart">
          <i class="fa-solid fa-cart-shopping"></i>
          <span v-if="cartStore.totalItemsCount > 0" class="badge">
            {{ cartStore.totalItemsCount }}
          </span>
        </button>

        <!-- Notifications Popover Wrapper -->
        <div class="notification-wrapper">
          <button 
            type="button" 
            class="action-btn noti-btn" 
            :class="{ 'has-unread': notificationStore.unreadCount > 0 }"
            :title="t('nav.notifications')"
            @click.stop="isNotificationOpen = !isNotificationOpen"
          >
            <i class="fa-regular fa-bell"></i>
            <span v-if="notificationStore.unreadCount > 0" class="badge pulsating-badge">
              {{ notificationStore.unreadCount }}
            </span>
          </button>

          <Transition name="fade">
            <div v-if="isNotificationOpen" class="notification-popover" :class="isRtl ? 'rtl-popover' : 'ltr-popover'" @click.stop>
              <div class="noti-header">
                <div class="noti-header-title">
                  <h4>{{ t('nav.notifications') }}</h4>
                  <span v-if="notificationStore.unreadCount > 0" class="noti-pill">
                    {{ notificationStore.unreadCount }} {{ t('nav.newPill') }}
                  </span>
                </div>
                <button 
                  v-if="notificationStore.unreadCount > 0" 
                  type="button" 
                  class="mark-all-btn"
                  @click="handleMarkAllRead"
                >
                  {{ t('nav.markAllRead') }}
                </button>
              </div>

              <div class="noti-body">
                <template v-if="notificationStore.notifications.length > 0">
                  <div 
                    v-for="item in notificationStore.notifications" 
                    :key="item.id" 
                    class="noti-item"
                    :class="{ 'unread': !item.read }"
                    @click="handleNotificationClick(item)"
                  >
                    <div class="noti-item-icon" :class="item.type">
                      <i v-if="item.type === 'order'" class="fa-solid fa-box"></i>
                      <i v-else-if="item.type === 'promo'" class="fa-solid fa-bolt"></i>
                      <i v-else class="fa-solid fa-bell"></i>
                    </div>
                    <div class="noti-item-content">
                      <div class="noti-item-title-row">
                        <span class="noti-item-title">{{ item.title }}</span>
                        <span v-if="!item.read" class="unread-dot"></span>
                      </div>
                      <p class="noti-item-msg">{{ item.message }}</p>
                    </div>
                  </div>
                </template>
                <div v-else class="noti-empty">
                  <i class="fa-regular fa-bell-slash"></i>
                  <p>{{ t('nav.noNotifications') }}</p>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- User Profile Dropdown Menu -->
        <div class="user-menu">
          <div v-if="!isAuthReady" class="skeleton"></div>
          
          <template v-else>
            <template v-if="currentUser">
              <div class="avatar" @click.stop="isDropdownOpen = !isDropdownOpen" :title="t('nav.account')">
                <img v-if="userAvatar" :src="userAvatar" alt="Avatar" class="avatar-img" />
                <span v-else>{{ userInitials }}</span>
              </div>
              
              <Transition name="fade">
                <div v-if="isDropdownOpen" class="dropdown" :class="isRtl ? 'rtl-dropdown' : 'ltr-dropdown'">
                  <RouterLink to="/profile" class="drop-item" @click="isDropdownOpen = false">
                    <i class="fa-regular fa-user"></i>
                    <span>{{ t('nav.account') }}</span>
                  </RouterLink>
                  <RouterLink to="/wishlist" class="drop-item" @click="isDropdownOpen = false">
                    <i class="fa-regular fa-heart"></i>
                    <span>{{ t('nav.wishlist') }}</span>
                  </RouterLink>
                  <button @click="handleLogout" class="drop-item logout-text">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i>
                    <span>{{ t('nav.logout') }}</span>
                  </button>
                </div>
              </Transition>
            </template>
            
            <template v-else>
              <RouterLink to="/login" class="login-btn">{{ t('nav.login') }}</RouterLink>
            </template>
          </template>
        </div>
      </div>

      <!-- Mobile Actions (Shown on < 1024px) -->
      <div class="mobile-actions">
        <button @click="toggleLanguage" class="lang-btn" :title="locale === 'ar' ? 'English' : 'العربية'">
          <i class="fa-solid fa-globe"></i>
          <span>{{ locale === 'ar' ? 'EN' : 'AR' }}</span>
        </button>

        <RouterLink to="/wishlist" class="action-btn" :title="t('nav.wishlist')">
          <i class="fa-regular fa-heart"></i>
          <span v-if="wishlistStore.count > 0" class="badge wishlist-badge">
            {{ wishlistStore.count }}
          </span>
        </RouterLink>

        <button type="button" class="action-btn" @click="cartStore.openMiniCart" :title="t('nav.cart')">
          <i class="fa-solid fa-cart-shopping"></i>
          <span v-if="cartStore.totalItemsCount > 0" class="badge">
            {{ cartStore.totalItemsCount }}
          </span>
        </button>

        <button 
          type="button" 
          class="burger-btn" 
          :aria-label="t('common.details')" 
          @click="isMobileMenuOpen = true"
        >
          <i class="fa-solid fa-bars"></i>
        </button>
      </div>

    </div>

    <!-- Responsive Drawer Transition (RTL from Left, LTR from Right) -->
    <Transition :name="isRtl ? 'slide-from-left' : 'slide-from-right'">
      <aside v-if="isMobileMenuOpen" class="mobile-sidebar" :class="isRtl ? 'rtl-sidebar' : 'ltr-sidebar'">
        
        <div class="sidebar-header">
          <button 
            type="button" 
            class="close-btn" 
            :aria-label="t('common.close')" 
            @click="isMobileMenuOpen = false"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="sidebar-profile" v-if="currentUser">
          <div class="sidebar-avatar">
            <img v-if="userAvatar" :src="userAvatar" alt="Avatar" class="avatar-img" />
            <span v-else>{{ userInitials }}</span>
          </div>
          <div class="sidebar-user-info">
            <p class="user-greeting">{{ t('nav.welcome') }}</p>
            <p class="user-email">{{ currentUser.email }}</p>
          </div>
        </div>

        <!-- Integrated Search Inside Drawer with Clean In-Field Icon -->
        <div class="sidebar-search">
          <div class="mobile-search-box">
            <i class="fa-solid fa-magnifying-glass mobile-search-icon"></i>
            <input 
              type="text" 
              v-model="localSearchQuery" 
              :placeholder="t('nav.searchPlaceholder')" 
              class="mobile-search-input"
              @keyup.enter="submitSearch"
            >
            <button 
              v-if="localSearchQuery.trim() !== ''" 
              type="button" 
              class="mobile-clear-btn"
              @click="localSearchQuery = ''"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <ul class="sidebar-links">
          <li>
            <RouterLink to="/" @click="isMobileMenuOpen = false">
              <i class="fa-solid fa-house"></i>
              <span>{{ t('nav.home') }}</span>
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/my-orders" @click="isMobileMenuOpen = false">
              <i class="fa-solid fa-clock-rotate-left"></i>
              <span>{{ t('nav.myOrders') }}</span>
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/wishlist" @click="isMobileMenuOpen = false">
              <i class="fa-regular fa-heart"></i>
              <span>{{ t('nav.wishlist') }} ({{ wishlistStore.count }})</span>
            </RouterLink>
          </li>
          <li v-if="currentUser">
            <RouterLink to="/profile" @click="isMobileMenuOpen = false">
              <i class="fa-regular fa-user"></i>
              <span>{{ t('nav.account') }}</span>
            </RouterLink>
          </li>
          <li v-if="isAdmin">
            <RouterLink to="/admin/dashboard" @click="isMobileMenuOpen = false" class="admin-drawer-link">
              <i class="fa-solid fa-shield-halved"></i>
              <span>{{ t('nav.dashboard') }}</span>
            </RouterLink>
          </li>
          <li v-if="!currentUser">
            <RouterLink to="/login" @click="isMobileMenuOpen = false">
              <i class="fa-solid fa-arrow-right-to-bracket"></i>
              <span>{{ t('nav.login') }}</span>
            </RouterLink>
          </li>
        </ul>

        <div class="sidebar-footer" v-if="currentUser">
          <button @click="handleLogout" class="sidebar-logout">
            <i class="fa-solid fa-arrow-right-from-bracket"></i>
            <span>{{ t('nav.logout') }}</span>
          </button>
        </div>

      </aside>
    </Transition>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useCartStore } from '../stores/cartStore'
import { useProductStore } from '../stores/productstore'
import { useWishlistStore } from '../stores/wishlistStore'
import { useNotificationStore } from '../stores/notificationStore'
import { useSettingsStore } from '../stores/settingsStore'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Swal from 'sweetalert2'
import { notifySuccess } from '../services/feedback'

const { t, locale } = useI18n()
const cartStore = useCartStore()
const productStore = useProductStore()
const wishlistStore = useWishlistStore()
const notificationStore = useNotificationStore()
const settingsStore = useSettingsStore()
const router = useRouter()

const isRtl = computed(() => locale.value === 'ar')
const currentBrandName = computed(() => settingsStore.getStoreName(locale.value))

const copyPromoCode = () => {
  navigator.clipboard?.writeText('SAVE10')
  notifySuccess(t('promo.appliedSuccess', { percent: 10 }), 'كود الخصم SAVE10 منسوخ للحافظة!')
}

const currentUser = ref(null)
const userData = ref(null)
const isAdmin = ref(false)
const isDropdownOpen = ref(false)
const isMobileMenuOpen = ref(false)
const isNotificationOpen = ref(false)
const isAuthReady = ref(false)
let unsubscribeUserDoc = null

watch(isMobileMenuOpen, (isOpen) => {
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('drawer-open', isOpen)
  }
})

const localSearchQuery = ref('')
const showSuggestions = ref(false)

const toggleLanguage = () => {
  locale.value = locale.value === 'ar' ? 'en' : 'ar'
  document.documentElement.dir = locale.value === 'ar' ? 'rtl' : 'ltr'
  localStorage.setItem('lang', locale.value)
  settingsStore.updateDocumentTitle(locale.value)
}

const clearSearch = () => {
  localSearchQuery.value = ''
  productStore.searchQuery = ''
  showSuggestions.value = false
}

const suggestedProducts = computed(() => {
  const query = localSearchQuery.value.trim().toLowerCase()
  if (!query) return []
  return productStore.products
    .filter(p => (p.title || '').toLowerCase().includes(query))
    .slice(0, 5)
})

const selectSuggestion = (title) => {
  localSearchQuery.value = title
  productStore.searchQuery = title
  showSuggestions.value = false
  isMobileMenuOpen.value = false
}

const submitSearch = () => {
  productStore.searchQuery = localSearchQuery.value
  showSuggestions.value = false
  isMobileMenuOpen.value = false
  if (router.currentRoute.value.path !== '/') {
    router.push('/')
  }
}

const userAvatar = computed(() => {
  return currentUser.value?.photoURL || userData.value?.photoURL || null
})

const userInitials = computed(() => {
  if (userData.value?.firstName && userData.value?.lastName) {
    return (userData.value.firstName[0] + userData.value.lastName[0]).toUpperCase()
  }
  return 'US'
})

const handleNotificationClick = async (item) => {
  await notificationStore.markAsRead(item.id, currentUser.value?.uid)
  isNotificationOpen.value = false
  if (item.targetRoute) {
    router.push(item.targetRoute)
  }
}

const handleMarkAllRead = async () => {
  await notificationStore.markAllAsRead(currentUser.value?.uid)
}

onMounted(() => {
  settingsStore.fetchSettings()
  const savedLang = localStorage.getItem('lang')
  if (savedLang) {
    locale.value = savedLang
    document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr'
  } else {
    document.documentElement.dir = locale.value === 'ar' ? 'rtl' : 'ltr'
  }
  settingsStore.updateDocumentTitle(locale.value)

  onAuthStateChanged(auth, (user) => {
    if (unsubscribeUserDoc) {
      unsubscribeUserDoc()
      unsubscribeUserDoc = null
    }

    if (user) {
      currentUser.value = user
      notificationStore.initUserNotifications(user.uid)
      wishlistStore.syncWishlistWithUser(user.uid)
      
      try {
        unsubscribeUserDoc = onSnapshot(doc(db, 'users', user.uid), (userDoc) => {
          if (userDoc.exists()) {
            userData.value = userDoc.data()
            isAdmin.value = userData.value.role === 'admin'
          }
        }, (err) => {
          console.warn('User document listener warning:', err?.message || err)
        })
      } catch (e) {
        console.error(e)
      }
    } else {
      currentUser.value = null
      userData.value = null
      isAdmin.value = false
      notificationStore.stopListening()
    }
    isAuthReady.value = true
  })
})

const handleLogout = async () => {
  const result = await Swal.fire({
    title: t('nav.logoutConfirmTitle'),
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
    isDropdownOpen.value = false
    isMobileMenuOpen.value = false
    router.push('/login')
  }
}

const closeDropdowns = (e) => {
  if (!e.target.closest('.user-menu')) {
    isDropdownOpen.value = false
  }
  if (!e.target.closest('.notification-wrapper')) {
    isNotificationOpen.value = false
  }
  if (!e.target.closest('.desktop-search-wrapper')) {
    showSuggestions.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', closeDropdowns)
})

onUnmounted(() => {
  window.removeEventListener('click', closeDropdowns)
  if (unsubscribeUserDoc) {
    unsubscribeUserDoc()
    unsubscribeUserDoc = null
  }
  if (typeof document !== 'undefined') {
    document.body.classList.remove('drawer-open')
  }
})
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid rgba(226, 232, 240, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* Top Promo Announcement Banner */
.promo-announcement-banner {
  background: linear-gradient(90deg, #0f172a, #1e293b, #0f172a);
  color: #f8fafc;
  padding: 8px 16px;
  font-size: 0.84rem;
  font-weight: 700;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.promo-banner-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  max-width: 1360px;
  margin: 0 auto;
}

.promo-banner-inner i {
  color: #f59e0b;
}

.promo-code-badge {
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid rgba(16, 185, 129, 0.5);
  color: #34d399;
  font-weight: 800;
  font-size: 0.78rem;
  padding: 2px 8px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  font-family: inherit;
}

.promo-code-badge:hover {
  background: rgba(16, 185, 129, 0.35);
  transform: scale(1.05);
}

.nav-container {
  max-width: 1360px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  flex-shrink: 0;
}

.logo-box {
  background: linear-gradient(135deg, #059669, #047857);
  color: white;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 1.25rem;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
}

.brand-name {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.brand-logo-img {
  max-height: 42px;
  max-width: 170px;
  object-fit: contain;
}

.desktop-links {
  display: flex;
  list-style: none;
  gap: 24px;
  margin: 0;
  padding: 0;
  align-items: center;
  flex-shrink: 0;
}

.desktop-links a {
  color: #64748b;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  transition: color 0.2s ease;
  padding: 6px 4px;
}

.desktop-links a:hover,
.active-route {
  color: #059669 !important;
}

.admin-badge {
  background: #fff7ed;
  color: #ea580c !important;
  padding: 6px 14px !important;
  border-radius: 8px;
  font-weight: 700 !important;
}

/* Responsive Search Bar Container */
.desktop-search-wrapper {
  position: relative;
  flex: 1;
  max-width: 440px;
  min-width: 160px;
}

.search-input-box {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  inset-inline-start: 14px;
  color: #94a3b8;
  pointer-events: none;
  font-size: 0.9rem;
}

.search-input {
  width: 100%;
  padding-block: 10px;
  padding-inline-start: 38px;
  padding-inline-end: 36px;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #f8fafc;
  outline: none;
  font-family: inherit;
  font-size: 0.9rem;
  color: #0f172a;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: #059669;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
}

.clear-search-btn {
  position: absolute;
  inset-inline-end: 12px;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-search-btn:hover {
  color: #0f172a;
}

.suggestions-list {
  position: absolute;
  top: calc(100% + 8px);
  inset-inline-start: 0;
  width: 100%;
  max-width: calc(100vw - 2rem);
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
  list-style: none;
  padding: 8px 0;
  margin: 0;
  z-index: 1050;
}

.suggestions-list li {
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  border-bottom: 1px solid #f8fafc;
  transition: background 0.15s ease;
}

.suggestions-list li:hover {
  background: #f1f5f9;
}

.sugg-img {
  width: 36px;
  height: 36px;
  object-fit: contain;
  border-radius: 6px;
  background: #f8fafc;
  padding: 2px;
}

.sugg-title {
  font-size: 0.88rem;
  color: #1e293b;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.desktop-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.lang-btn {
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

.lang-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.action-btn {
  position: relative;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  font-size: 1.05rem;
}

.action-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
  transform: translateY(-2px);
}

.badge {
  position: absolute;
  top: -4px;
  inset-inline-end: -4px;
  background: #ef4444;
  color: white;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 999px;
  font-size: 0.72rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  border: 2px solid #ffffff;
  pointer-events: none;
}

.wishlist-badge {
  background: #e11d48;
}

.pulsating-badge {
  background: #059669;
  box-shadow: 0 0 0 0 rgba(5, 150, 105, 0.7);
  animation: pulseBadge 1.8s infinite cubic-bezier(0.66, 0, 0, 1);
}

@keyframes pulseBadge {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(5, 150, 105, 0.7); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(5, 150, 105, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(5, 150, 105, 0); }
}

/* Notification Popover & Boundary Safety */
.notification-wrapper {
  position: relative;
}

.notification-popover {
  position: absolute;
  top: calc(100% + 12px);
  width: 360px;
  max-width: calc(100vw - 2rem);
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 16px 40px -6px rgba(15, 23, 42, 0.16);
  z-index: 1050;
  overflow: hidden;
}

.notification-popover.rtl-popover {
  inset-inline-end: 0;
  direction: rtl;
  text-align: right;
}

.notification-popover.ltr-popover {
  inset-inline-end: 0;
  direction: ltr;
  text-align: left;
}

.noti-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}

.noti-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.noti-header-title h4 {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 800;
  color: #0f172a;
}

.noti-pill {
  font-size: 0.72rem;
  font-weight: 700;
  background: #ecfdf5;
  color: #059669;
  padding: 2px 8px;
  border-radius: 999px;
}

.mark-all-btn {
  background: transparent;
  border: none;
  font-size: 0.76rem;
  color: #059669;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  transition: opacity 0.2s;
}

.mark-all-btn:hover {
  opacity: 0.75;
}

.noti-body {
  max-height: 380px;
  overflow-y: auto;
}

.noti-item {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #f8fafc;
  cursor: pointer;
  transition: background 0.15s ease;
}

.noti-item:hover {
  background: #f8fafc;
}

.noti-item.unread {
  background: #f0fdf4;
}

.noti-item-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1rem;
}

.noti-item-icon.order { background: #eff6ff; color: #2563eb; }
.noti-item-icon.promo { background: #fef3c7; color: #d97706; }
.noti-item-icon.system { background: #ecfdf5; color: #059669; }

.noti-item-content {
  flex: 1;
  min-width: 0;
}

.noti-item-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.noti-item-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #059669;
  flex-shrink: 0;
}

.noti-item-msg {
  margin: 0;
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.4;
}

.noti-empty {
  padding: 36px 20px;
  text-align: center;
  color: #94a3b8;
}

.noti-empty i {
  font-size: 2rem;
  margin-bottom: 8px;
  display: block;
}

.noti-empty p {
  margin: 0;
  font-size: 0.88rem;
}

/* User Menu & Dropdown */
.user-menu {
  position: relative;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #e0e7ff;
  color: #4338ca;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.login-btn {
  background: #0f172a;
  color: white;
  padding: 9px 22px;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-btn:hover {
  background: #1e293b;
  transform: translateY(-1px);
}

.dropdown {
  position: absolute;
  top: calc(100% + 10px);
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.14);
  border: 1px solid #e2e8f0;
  min-width: 200px;
  max-width: calc(100vw - 2rem);
  padding: 8px 8px 16px;
  z-index: 1050;
  max-height: calc(100vh - 80px);
  overflow-y: auto;
}

.dropdown.rtl-dropdown {
  inset-inline-end: 0;
  text-align: right;
}

.dropdown.ltr-dropdown {
  inset-inline-end: 0;
  text-align: left;
}

.drop-item {
  width: 100%;
  padding: 10px 14px;
  min-height: 44px;
  background: none;
  border: none;
  font-size: 0.92rem;
  color: #334155;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 10px;
  text-decoration: none;
  font-family: inherit;
  font-weight: 600;
  transition: background 0.15s ease;
}

.drop-item:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.logout-text {
  color: #ef4444 !important;
}

.logout-text:hover {
  background: #fef2f2 !important;
}

/* Mobile Actions & Burger Button */
.mobile-actions {
  display: none;
}

.burger-btn {
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1.35rem;
  color: #0f172a;
  cursor: pointer;
  transition: all 0.2s ease;
}

.burger-btn:hover {
  background: #f1f5f9;
}

/* Overlay */
.overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1001;
}

/* Mobile Sidebar Drawer: RTL from Right, LTR from Left */
.mobile-sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  width: 310px;
  max-width: 85vw;
  height: 100vh;
  height: 100dvh;
  background: #ffffff;
  z-index: 1002;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}

.mobile-sidebar.rtl-sidebar {
  left: 0;
  right: auto;
  box-shadow: 8px 0 30px rgba(0, 0, 0, 0.15);
  direction: rtl;
  text-align: right;
}

.mobile-sidebar.ltr-sidebar {
  right: 0;
  left: auto;
  box-shadow: -8px 0 30px rgba(0, 0, 0, 0.15);
  direction: ltr;
  text-align: left;
}

.sidebar-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
}

.rtl-sidebar .sidebar-header {
  justify-content: flex-start;
}

.ltr-sidebar .sidebar-header {
  justify-content: flex-end;
}

.close-btn {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: 12px;
  font-size: 1.2rem;
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.sidebar-profile {
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
  flex-shrink: 0;
}

.sidebar-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e0e7ff;
  color: #4338ca;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.15rem;
  flex-shrink: 0;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.user-greeting {
  margin: 0 0 3px 0;
  font-size: 0.82rem;
  color: #64748b;
}

.user-email {
  margin: 0;
  font-weight: 700;
  color: #0f172a;
  font-size: 0.88rem;
  word-break: break-all;
}

.sidebar-search {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
}

.mobile-search-box {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.mobile-search-icon {
  position: absolute;
  inset-inline-start: 14px;
  color: #94a3b8;
  font-size: 0.9rem;
  pointer-events: none;
}

.mobile-search-input {
  width: 100%;
  padding-block: 10px;
  padding-inline-start: 38px;
  padding-inline-end: 36px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  outline: none;
  background: #f8fafc;
  font-family: inherit;
  font-size: 0.9rem;
}

.mobile-search-input:focus {
  border-color: #059669;
  background: #ffffff;
}

.mobile-clear-btn {
  position: absolute;
  inset-inline-end: 12px;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
}

.sidebar-links {
  list-style: none;
  padding: 14px 16px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.sidebar-links a {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  min-height: 44px;
  text-decoration: none;
  color: #1e293b;
  font-weight: 600;
  font-size: 0.95rem;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.sidebar-links a:hover {
  background: #f1f5f9;
  color: #059669;
}

.admin-drawer-link {
  background: #fff7ed !important;
  color: #ea580c !important;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid #f1f5f9;
  background: #ffffff;
  flex-shrink: 0;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}

.sidebar-logout {
  width: 100%;
  padding: 12px;
  min-height: 44px;
  background: #fee2e2;
  color: #ef4444;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-family: inherit;
  transition: background 0.2s ease;
}

.sidebar-logout:hover {
  background: #fecaca;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* LTR Slide (Anchor on Right -> Opens from Right) */
.slide-from-right-enter-active,
.slide-from-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-from-right-enter-from,
.slide-from-right-leave-to {
  transform: translateX(100%);
}

/* RTL Slide (Anchor on Left -> Opens from Left) */
.slide-from-left-enter-active,
.slide-from-left-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-from-left-enter-from,
.slide-from-left-leave-to {
  transform: translateX(-100%);
}

/* Tablet & Mobile Collapsing (< 1024px) */
@media (max-width: 1023px) {
  .desktop-links,
  .desktop-search-wrapper,
  .desktop-actions {
    display: none !important;
  }
  
  .mobile-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .nav-container {
    padding: 10px 14px;
    gap: 8px;
  }

  .brand {
    gap: 8px;
    min-width: 0;
    flex-shrink: 1;
  }

  .logo-box {
    width: 36px;
    height: 36px;
    font-size: 1.1rem;
    border-radius: 10px;
    flex-shrink: 0;
  }

  .brand-name {
    font-size: 1.1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
  }

  .brand-logo-img {
    max-height: 32px;
    max-width: 110px;
  }

  .mobile-actions {
    gap: 6px;
    flex-shrink: 0;
  }

  .action-btn {
    width: 42px;
    height: 42px;
    min-width: 42px;
    min-height: 42px;
    font-size: 0.95rem;
  }

  .lang-btn {
    padding: 6px 10px;
    font-size: 0.78rem;
    min-height: 42px;
  }

  .burger-btn {
    width: 42px;
    height: 42px;
    min-width: 42px;
    min-height: 42px;
  }
}
</style>