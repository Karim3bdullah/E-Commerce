<template>
  <nav class="navbar">
    
    <div v-if="isMobileMenuOpen" class="overlay" @click="isMobileMenuOpen = false"></div>

    <div class="nav-container">
      
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

      <div class="desktop-actions">
        <button @click="toggleLanguage" class="lang-btn" title="تغيير اللغة">
          <i class="fa-solid fa-globe"></i> {{ locale === 'ar' ? 'EN' : 'AR' }}
        </button>

        <div class="search-wrapper">
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
          
          <Transition name="fade">
            <ul v-if="showSuggestions && localSearchQuery.trim() !== ''" class="suggestions-list">
              <li v-for="item in suggestedProducts" :key="item.id" @click="selectSuggestion(item.title)">
                <img :src="item.image" alt="" class="sugg-img">
                <span class="sugg-title">{{ item.title }}</span>
              </li>
            </ul>
          </Transition>
        </div>

        <!-- Wishlist Link -->
        <RouterLink to="/wishlist" class="action-btn" title="المفضلة">
          <i class="fa-regular fa-heart"></i>
          <span v-if="wishlistStore.count > 0" class="badge wishlist-badge">
            {{ wishlistStore.count }}
          </span>
        </RouterLink>

        <!-- Cart Button (Opens Mini-Cart Drawer) -->
        <button type="button" class="action-btn" title="سلة التسوق" @click="cartStore.openMiniCart">
          <i class="fa-solid fa-cart-shopping"></i>
          <span v-if="cartStore.totalItemsCount > 0" class="badge">
            {{ cartStore.totalItemsCount }}
          </span>
        </button>

        <!-- Actionable Notification Bell -->
        <div class="notification-wrapper">
          <button 
            type="button" 
            class="action-btn noti-btn" 
            :class="{ 'has-unread': notificationStore.unreadCount > 0 }"
            title="الإشعارات"
            @click.stop="isNotificationOpen = !isNotificationOpen"
          >
            <i class="fa-regular fa-bell"></i>
            <span v-if="notificationStore.unreadCount > 0" class="badge pulsating-badge">
              {{ notificationStore.unreadCount }}
            </span>
          </button>

          <Transition name="fade">
            <div v-if="isNotificationOpen" class="notification-popover" @click.stop>
              <div class="noti-header">
                <div class="noti-header-title">
                  <h4>الإشعارات</h4>
                  <span v-if="notificationStore.unreadCount > 0" class="noti-pill">
                    {{ notificationStore.unreadCount }} جديد
                  </span>
                </div>
                <button 
                  v-if="notificationStore.unreadCount > 0" 
                  type="button" 
                  class="mark-all-btn"
                  @click="handleMarkAllRead"
                >
                  تحديد الكل كمقروء
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
                  <p>لا توجد إشعارات حالياً</p>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <div class="user-menu">
          <div v-if="!isAuthReady" class="skeleton"></div>
          
          <template v-else>
            <template v-if="currentUser">
              <div class="avatar" @click.stop="isDropdownOpen = !isDropdownOpen">
                <img v-if="userAvatar" :src="userAvatar" alt="Avatar" class="avatar-img" />
                <span v-else>{{ userInitials }}</span>
              </div>
              
              <Transition name="fade">
                <div v-if="isDropdownOpen" class="dropdown">
                  <RouterLink to="/profile" class="drop-item" @click="isDropdownOpen = false">
                      <i class="fa-regular fa-user"></i> {{ t('nav.account') }}
                  </RouterLink>
                  <RouterLink to="/wishlist" class="drop-item" @click="isDropdownOpen = false">
                      <i class="fa-regular fa-heart"></i> المفضلة
                  </RouterLink>
                  <button @click="handleLogout" class="drop-item logout-text">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i> {{ t('nav.logout') }}
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

      <div class="mobile-actions">
        <button @click="toggleLanguage" class="lang-btn">
          <i class="fa-solid fa-globe"></i> {{ locale === 'ar' ? 'EN' : 'AR' }}
        </button>

        <RouterLink to="/wishlist" class="action-btn" title="المفضلة">
          <i class="fa-regular fa-heart"></i>
          <span v-if="wishlistStore.count > 0" class="badge wishlist-badge">
            {{ wishlistStore.count }}
          </span>
        </RouterLink>

        <button type="button" class="action-btn" @click="cartStore.openMiniCart" title="السلة">
          <i class="fa-solid fa-cart-shopping"></i>
          <span v-if="cartStore.totalItemsCount > 0" class="badge">
            {{ cartStore.totalItemsCount }}
          </span>
        </button>

        <button class="burger-btn" @click="isMobileMenuOpen = true">
          <i class="fa-solid fa-bars"></i>
        </button>
      </div>

    </div>

    <Transition name="slide-left">
      <aside v-if="isMobileMenuOpen" class="mobile-sidebar">
        
        <div class="sidebar-header">
          <button class="close-btn" @click="isMobileMenuOpen = false">
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

        <div class="sidebar-search">
          <input 
            type="text" 
            v-model="localSearchQuery" 
            :placeholder="t('nav.searchPlaceholder')" 
            class="mobile-search-input"
            @keyup.enter="submitSearch"
          >
          <button @click="submitSearch" class="mobile-search-btn">
            <i class="fa-solid fa-magnifying-glass"></i>
          </button>
        </div>

        <ul class="sidebar-links">
          <li>
            <RouterLink to="/" @click="isMobileMenuOpen = false">{{ t('nav.home') }}</RouterLink>
          </li>
          <li>
            <RouterLink to="/my-orders" @click="isMobileMenuOpen = false">{{ t('nav.myOrders') }}</RouterLink>
          </li>
          <li>
            <RouterLink to="/wishlist" @click="isMobileMenuOpen = false">
              المفضلة ({{ wishlistStore.count }})
            </RouterLink>
          </li>
          <li v-if="currentUser">
             <RouterLink to="/profile" @click="isMobileMenuOpen = false">{{ t('nav.account') }}</RouterLink>
          </li>
          <li v-if="isAdmin">
            <RouterLink to="/admin/dashboard" @click="isMobileMenuOpen = false">{{ t('nav.dashboard') }}</RouterLink>
          </li>
          <li v-if="!currentUser">
            <RouterLink to="/login" @click="isMobileMenuOpen = false">{{ t('nav.login') }}</RouterLink>
          </li>
        </ul>

        <div class="sidebar-footer" v-if="currentUser">
          <button @click="handleLogout" class="sidebar-logout">
            <i class="fa-solid fa-arrow-right-from-bracket"></i> {{ t('nav.logout') }}
          </button>
        </div>

      </aside>
    </Transition>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useCartStore } from '../stores/cartStore'
import { useProductStore } from '../stores/productstore'
import { useWishlistStore } from '../stores/wishlistStore'
import { useNotificationStore } from '../stores/notificationStore'
import { useSettingsStore } from '../stores/settingsStore'
import { auth, db } from '../firebase/config'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Swal from 'sweetalert2'

const { t, locale } = useI18n()
const cartStore = useCartStore()
const productStore = useProductStore()
const wishlistStore = useWishlistStore()
const notificationStore = useNotificationStore()
const settingsStore = useSettingsStore()
const router = useRouter()

const currentBrandName = computed(() => settingsStore.getStoreName(locale.value))

const currentUser = ref(null)
const userData = ref(null)
const isAdmin = ref(false)
const isDropdownOpen = ref(false)
const isMobileMenuOpen = ref(false)
const isNotificationOpen = ref(false)
const isAuthReady = ref(false)

const localSearchQuery = ref('')
const showSuggestions = ref(false)

const toggleLanguage = () => {
  locale.value = locale.value === 'ar' ? 'en' : 'ar'
  document.documentElement.dir = locale.value === 'ar' ? 'rtl' : 'ltr'
  localStorage.setItem('lang', locale.value)
  settingsStore.updateDocumentTitle(locale.value)
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

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser.value = user
      notificationStore.initUserNotifications(user.uid)
      wishlistStore.syncWishlistWithUser(user.uid)
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          userData.value = userDoc.data()
          isAdmin.value = userData.value.role === 'admin'
        }
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
    title: t('nav.logout'),
    text: 'هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#94a3b8',
    confirmButtonText: 'نعم، خروج',
    cancelButtonText: 'إلغاء'
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
  if (!e.target.closest('.search-wrapper')) {
    showSuggestions.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', closeDropdowns)
})

onUnmounted(() => {
  window.removeEventListener('click', closeDropdowns)
})
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid #e2e8f0;
  backdrop-filter: blur(10px);
}

.nav-container {
  max-width: 1300px;
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.logo-box {
  background: #2563eb;
  color: white;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 1.2rem;
}

.brand-name {
  font-size: 1.4rem;
  font-weight: 800;
  color: #1e293b;
}

.brand-logo-img {
  max-height: 42px;
  max-width: 170px;
  object-fit: contain;
}

.desktop-links {
  display: flex;
  list-style: none;
  gap: 20px;
  margin: 0;
  padding: 0;
  flex: 1;
  justify-content: center;
}

.desktop-links a {
  color: #64748b;
  font-weight: 600;
  text-decoration: none;
}

.desktop-links a:hover,
.active-route {
  color: #2563eb !important;
}

.admin-badge {
  background: #fff7ed;
  color: #ea580c !important;
  padding: 5px 12px;
  border-radius: 6px;
}

.desktop-actions {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-shrink: 0; 
}

.lang-btn {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 700;
  color: #475569;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s;
}
.lang-btn:hover {
  background: #f1f5f9;
}

.search-wrapper {
  position: relative;
  width: 280px;
  flex-shrink: 0; 
}

.search-icon {
  position: absolute;
  left: 15px; 
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 10px 15px 10px 40px;
  border: 1px solid #cbd5e1;
  border-radius: 25px;
  background: #f8fafc;
  outline: none;
  font-family: inherit;
  box-sizing: border-box; 
}
.search-input:focus {
  border-color: #2563eb;
  background: white;
}

.suggestions-list {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 100%;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  list-style: none;
  padding: 8px 0;
  margin: 0;
}

.suggestions-list li {
  padding: 10px 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  border-bottom: 1px solid #f8fafc;
}

.suggestions-list li:hover {
  background: #f1f5f9;
}

.sugg-img {
  width: 35px;
  height: 35px;
  object-fit: contain;
}

.sugg-title {
  font-size: 0.9rem;
  color: #1e293b;
  font-weight: 600;
}

.action-btn {
  position: relative;
  width: 45px;
  height: 45px;
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
}

.action-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
  transform: translateY(-2px);
}

.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ef4444;
  color: white;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  border: 2px solid #ffffff;
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
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(5, 150, 105, 0.7);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 8px rgba(5, 150, 105, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(5, 150, 105, 0);
  }
}

/* Notification Popover */
.notification-wrapper {
  position: relative;
}

.notification-popover {
  position: absolute;
  top: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%);
  width: 360px;
  max-width: 90vw;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 12px 36px -4px rgba(15, 23, 42, 0.15);
  z-index: 1050;
  overflow: hidden;
  direction: rtl;
  text-align: right;
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
  transition: background 0.2s ease;
}

.noti-item:hover {
  background: #f8fafc;
}

.noti-item.unread {
  background: #f0fdf4;
}

.noti-item-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 0.95rem;
}

.noti-item-icon.order {
  background: #eff6ff;
  color: #2563eb;
}

.noti-item-icon.promo {
  background: #fef3c7;
  color: #d97706;
}

.noti-item-icon.system {
  background: #ecfdf5;
  color: #059669;
}

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
  font-size: 0.85rem;
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
  font-size: 0.78rem;
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
}

.noti-empty p {
  margin: 0;
  font-size: 0.85rem;
}

.user-menu {
  position: relative;
}

.avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: #e0e7ff;
  color: #3730a3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  cursor: pointer;
  border: 2px solid white;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.login-btn {
  background: #1e293b;
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
  text-decoration: none;
  font-weight: 600;
}

.dropdown {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  min-width: 180px;
  padding: 10px;
}

.drop-item {
  width: 100%;
  text-align: right;
  padding: 10px 15px;
  background: none;
  border: none;
  font-size: 0.95rem;
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 8px;
  text-decoration: none;
}

.drop-item:hover {
  background: #f1f5f9;
}

.logout-text {
  color: #ef4444;
}

.mobile-actions {
  display: none;
}

.burger-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #1e293b;
  cursor: pointer;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1001;
}

.mobile-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  background: white;
  z-index: 1002;
  display: flex;
  flex-direction: column;
  box-shadow: 5px 0 25px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  padding: 20px;
  display: flex;
  justify-content: flex-end;
  border-bottom: 1px solid #f1f5f9;
}

.close-btn {
  background: #f8fafc;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.2rem;
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-profile {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}

.sidebar-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #e0e7ff;
  color: #3730a3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
}

.user-greeting {
  margin: 0 0 5px 0;
  font-size: 0.9rem;
  color: #64748b;
}

.user-email {
  margin: 0;
  font-weight: 700;
  color: #1e293b;
  font-size: 0.95rem;
}

.sidebar-search {
  padding: 20px;
  display: flex;
  gap: 10px;
}

.mobile-search-input {
  flex: 1;
  padding: 12px 15px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  outline: none;
  background: #f8fafc;
}

.mobile-search-btn {
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-links {
  list-style: none;
  padding: 0 20px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.sidebar-links a {
  display: block;
  padding: 12px 15px;
  text-decoration: none;
  color: #1e293b;
  font-weight: 600;
  border-radius: 8px;
  transition: background 0.2s;
}

.sidebar-links a:hover {
  background: #f1f5f9;
  color: #2563eb;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid #f1f5f9;
}

.sidebar-logout {
  width: 100%;
  padding: 12px;
  background: #fee2e2;
  color: #ef4444;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease;
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-100%);
}

@media (max-width: 900px) {
  .desktop-links,
  .desktop-actions {
    display: none !important;
  }
  
  .mobile-actions {
    display: flex;
    align-items: center;
    gap: 15px;
  }
}
</style>