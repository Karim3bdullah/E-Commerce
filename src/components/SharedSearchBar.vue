<template>
  <nav class="premium-navbar">
    <div class="nav-container">
      
      
      <RouterLink to="/" class="brand-logo">
        <div class="logo-icon"><i class="fa-solid fa-bag-shopping"></i></div>
        <span class="brand-text">متجري</span>
      </RouterLink>

  
      <ul class="nav-menu">
        <li><RouterLink to="/" exact-active-class="active-route" class="nav-link">الرئيسية</RouterLink></li>
        <li><RouterLink to="/my-orders" active-class="active-route" class="nav-link">طلباتي</RouterLink></li>
        
        <li v-if="isAdmin">
          <RouterLink to="/admin/orders" class="nav-link admin-badge">
            <i class="fa-solid fa-gauge-high"></i> لوحة التحكم
          </RouterLink>
        </li>
      </ul>

      <div class="nav-actions">
        
       
        <div class="navbar-search">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input 
            type="text" 
            v-model="productStore.searchQuery" 
            placeholder="ابحث عن منتج..." 
            class="search-input"
          >
        </div>

    
        <RouterLink to="/cart" class="action-wrapper">
          <button class="icon-button">
            <i class="fa-solid fa-cart-shopping"></i>
            <span v-if="cartStore.totalItemsCount > 0" class="count-badge">{{ cartStore.totalItemsCount }}</span>
          </button>
        </RouterLink>

        <!-- ملف المستخدم -->
        <div class="action-wrapper">
          <div v-if="!isAuthReady" class="auth-skeleton"></div>

          <template v-else>
            <template v-if="currentUser">
              <div @click.stop="isDropdownOpen = !isDropdownOpen" class="profile-trigger">
                <div class="avatar-initials">{{ userInitials }}</div>
              </div>

              <Transition name="fade-slide">
                <div v-if="isDropdownOpen" class="pro-dropdown profile-dropdown">
                  <div class="profile-header">
                    <p class="user-name">مرحباً بك!</p>
                    <p class="user-email">{{ currentUser.email }}</p>
                  </div>
                  <div class="dropdown-links">
                    <RouterLink to="/profile" class="drop-item" @click="isDropdownOpen = false">
                      <i class="fa-regular fa-user"></i> حسابي
                    </RouterLink>
                    <button class="dropdown-btn"><i class="fa-solid fa-box"></i> طلباتي</button>
                    <hr>
                    <button @click="handleLogout" class="dropdown-btn logout"><i class="fa-solid fa-arrow-right-from-bracket"></i> تسجيل الخروج</button>
                  </div>
                </div>
              </Transition>
            </template>

            <template v-else>
              <RouterLink to="/login" class="login-btn">
                تسجيل الدخول <i class="fa-solid fa-arrow-left"></i>
              </RouterLink>
            </template>
          </template>
        </div>
      </div>
      
    </div>
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

const cartStore = useCartStore()
const productStore = useProductStore()
const router = useRouter()

const currentUser = ref(null)
const userData = ref(null)
const isAdmin = ref(false)
const isDropdownOpen = ref(false)
const isAuthReady = ref(false)

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser.value = user
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          userData.value = userDoc.data()
          if (userData.value.role === 'admin') isAdmin.value = true
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
  if (userData.value && userData.value.firstName && userData.value.lastName) {
    return (userData.value.firstName[0] + userData.value.lastName[0]).toUpperCase()
  }
  return 'US'
})

const handleLogout = async () => {
  await signOut(auth)
  isDropdownOpen.value = false
  router.push('/login')
}

const closeDropdowns = (e) => {
  if (!e.target.closest('.action-wrapper')) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', closeDropdowns)
})

onUnmounted(() => window.removeEventListener('click', closeDropdowns))
</script>

<style scoped>
.premium-navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 12px 0;
  backdrop-filter: blur(10px);
}

.nav-container {
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  flex-shrink: 0;
}

.logo-icon {
  background: #2563eb;
  color: white;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 1.2rem;
}

.brand-text {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1e293b;
}

.nav-menu {
  display: flex;
  list-style: none;
  gap: 25px;
  margin: 0;
  padding: 0;
  flex: 1;
  justify-content: flex-start;
}

.nav-link {
  color: #64748b;
  font-weight: 600;
  position: relative;
  padding-bottom: 5px;
  text-decoration: none;
  white-space: nowrap;
}

.nav-link:hover, .active-route {
  color: #2563eb;
}

.admin-badge {
  color: #ea580c;
  background: #fff7ed;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}


.navbar-search {
  position: relative;
  width: 250px;
  margin-left: 15px; 
  transition: width 0.3s ease;
}

.search-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 8px 40px 8px 15px;
  border: 1px solid #cbd5e1;
  border-radius: 20px;
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
  background: #f8fafc;
  transition: all 0.3s;
}

.search-input:focus {
  border-color: #2563eb;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  width: 300px; 
}

.action-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-button {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  text-decoration: none;
  transition: background 0.2s;
}

.icon-button:hover { background: #f1f5f9; }

.count-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.profile-trigger {
  cursor: pointer;
  transition: transform 0.2s;
}

.avatar-initials {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: #e0e7ff;
  color: #3730a3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
  border: 2px solid white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.login-btn {
  background: #1e293b;
  color: white;
  padding: 8px 18px;
  border-radius: 30px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  white-space: nowrap;
}

.pro-dropdown {
  position: absolute;
  top: calc(100% + 15px);
  right: 0;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  min-width: 250px;
  z-index: 1100;
  text-align: right;
}

.profile-header {
  padding: 20px;
  background: #f8fafc;
  border-bottom: 1px solid #eee;
  border-radius: 12px 12px 0 0;
}

.user-name { margin: 0 0 5px 0; font-weight: 700; color: #1e293b; }
.user-email { margin: 0; font-size: 0.85rem; color: #64748b; }

.dropdown-links { padding: 10px; }

.dropdown-btn {
  width: 100%;
  text-align: right;
  padding: 12px 15px;
  background: none;
  border: none;
  font-size: 0.95rem;
  color: #475569;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
}

.dropdown-btn:hover { background: #f1f5f9; color: #1e293b; }
.dropdown-btn.logout { color: #ef4444; }

.fade-slide-enter-active,
 .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from,
 .fade-slide-leave-to { opacity: 0; transform: translateY(-10px); }

@media (max-width: 900px) {
  .navbar-search { width: 180px; }
  .search-input:focus { width: 200px; }
}

@media (max-width: 768px) {
  .nav-menu, .navbar-search,
   .brand-text { display: none; }
}
</style>