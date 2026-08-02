<template>
  <nav class="navbar">
    
    <div v-if="isMobileMenuOpen" class="overlay" @click="isMobileMenuOpen = false"></div>

    <div class="nav-container">
      
      <RouterLink to="/" class="brand">
        <div class="logo-box">
          <i class="fa-solid fa-bag-shopping"></i>
        </div>
        <span class="brand-name">{{ t('nav.brand') }}</span>
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

        <RouterLink to="/cart" class="action-btn">
          <i class="fa-solid fa-cart-shopping"></i>
          <span v-if="cartStore.totalItemsCount > 0" class="badge">
            {{ cartStore.totalItemsCount }}
          </span>
        </RouterLink>

        <div class="user-menu">
          <div v-if="!isAuthReady" class="skeleton"></div>
          
          <template v-else>
            <template v-if="currentUser">
              <div class="avatar" @click.stop="isDropdownOpen = !isDropdownOpen">
                {{ userInitials }}
              </div>
              
              <Transition name="fade">
                <div v-if="isDropdownOpen" class="dropdown">
                  <RouterLink to="/profile" class="drop-item" @click="isDropdownOpen = false">
                      <i class="fa-regular fa-user"></i> {{ t('nav.account') }}
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

        <RouterLink to="/cart" class="action-btn">
          <i class="fa-solid fa-cart-shopping"></i>
          <span v-if="cartStore.totalItemsCount > 0" class="badge">
            {{ cartStore.totalItemsCount }}
          </span>
        </RouterLink>

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
          <div class="sidebar-avatar">{{ userInitials }}</div>
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
import { auth, db } from '../firebase/config'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Swal from 'sweetalert2'

const { t, locale } = useI18n()
const cartStore = useCartStore()
const productStore = useProductStore()
const router = useRouter()

const currentUser = ref(null)
const userData = ref(null)
const isAdmin = ref(false)
const isDropdownOpen = ref(false)
const isMobileMenuOpen = ref(false)
const isAuthReady = ref(false)

const localSearchQuery = ref('')
const showSuggestions = ref(false)

const toggleLanguage = () => {
  locale.value = locale.value === 'ar' ? 'en' : 'ar'
  document.documentElement.dir = locale.value === 'ar' ? 'rtl' : 'ltr'
  localStorage.setItem('lang', locale.value)
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

onMounted(() => {
  const savedLang = localStorage.getItem('lang')
  if (savedLang) {
    locale.value = savedLang
    document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr'
  } else {
    document.documentElement.dir = locale.value === 'ar' ? 'rtl' : 'ltr'
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser.value = user
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
    }
    isAuthReady.value = true
  })
})

const userInitials = computed(() => {
  if (userData.value?.firstName && userData.value?.lastName) {
    return (userData.value.firstName[0] + userData.value.lastName[0]).toUpperCase()
  }
  return 'US'
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