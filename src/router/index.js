import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/Homeview.vue'
import { auth, db } from '../firebase/config.js'
import { doc, getDoc } from 'firebase/firestore'
import Swal from 'sweetalert2' 
import { useSettingsStore } from '../stores/settingsStore' 

let cachedAdminStatus = null
let cachedUserUid = null

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/cart', name: 'cart', component: () => import('../views/CartView.vue') },
    { path: '/checkout', name: 'checkout', component: () => import('../views/CheckoutView.vue') },
    { path: '/product/:id', name: 'product-details', component: () => import('../views/ProductDetails.vue') },
    { path: '/my-orders', name: 'my-orders', component: () => import('../views/OrdersView.vue'), meta: { requiresAuth: true } },
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { hideNavFooter: true, requiresGuest: true } },
    { path: '/admin/dashboard', name: 'admin-dashboard', component: () => import('../views/AdminDashboardView.vue'), meta: { hideNavFooter: true, requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/users', name: 'admin-users', component: () => import('../views/AdminUsersView.vue'), meta: { hideNavFooter: true, requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/orders', name: 'admin-orders', component: () => import('../views/AdminOrdersView.vue'), meta: { hideNavFooter: true, requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/products', name: 'admin-products', component: () => import('../views/AdminProductsView.vue'), meta: { hideNavFooter: true, requiresAuth: true, requiresAdmin: true } },
    { path: '/admin/settings', name: 'admin-settings', component: () => import('../views/AdminSettingsView.vue'), meta: { hideNavFooter: true, requiresAuth: true, requiresAdmin: true } },
    { path: '/profile', name: 'profile', component: () => import('../views/ProfileView.vue'), meta: { requiresAuth: true } },
    { path: '/wishlist', name: 'wishlist', component: () => import('../views/WishlistView.vue') },
    { path: '/maintenance', name: 'maintenance', component: () => import('../views/MaintenanceView.vue'), meta: { hideNavFooter: true } },
  ]
})

router.beforeEach(async (to, from) => {
  const settingsStore = useSettingsStore()
  if (!settingsStore.isLoaded) {
    settingsStore.fetchSettings()
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest)

  const getCurrentUser = () => {
    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged(user => {
        unsubscribe()
        resolve(user)
      })
    })
  }

  const currentUser = await getCurrentUser()
  let isAdminUser = false

  if (currentUser) {
    if (cachedUserUid !== currentUser.uid) {
      cachedAdminStatus = null
      cachedUserUid = currentUser.uid
    }

    if (cachedAdminStatus === null) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid)
        const userDoc = await getDoc(userDocRef)
        cachedAdminStatus = userDoc.exists() && userDoc.data().role === 'admin'
      } catch (error) {
        console.error("خطأ في التحقق من الصلاحيات:", error)
        cachedAdminStatus = false
      }
    }
    isAdminUser = Boolean(cachedAdminStatus)
  }

  // Global Maintenance Mode check
  if (settingsStore.maintenanceMode && !isAdminUser) {
    if (to.path !== '/maintenance' && to.path !== '/login') {
      return '/maintenance'
    }
  } else if (!settingsStore.maintenanceMode && to.path === '/maintenance') {
    return '/'
  }

  if (requiresGuest && currentUser) return '/'
  if (requiresAuth && !currentUser) return '/login'

  if (requiresAdmin && currentUser) {
    if (isAdminUser) {
      return true
    } else {
      Swal.fire({
        icon: 'error',
        title: 'صلاحيات غير كافية',
        text: 'عفواً، لا تملك صلاحية الدخول للوحة التحكم.',
        confirmButtonColor: '#2563eb'
      })
      return '/'
    }
  }

  return true
})

export default router