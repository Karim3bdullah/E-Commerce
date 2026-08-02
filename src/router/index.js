import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/Homeview.vue'
import { auth, db } from '../firebase/config.js'
import { doc, getDoc } from 'firebase/firestore'
import Swal from 'sweetalert2' 

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/cart',
      name: 'cart',
      component: () => import('../views/CartView.vue')
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: () => import('../views/CheckoutView.vue')
    },
    {
      path: '/product/:id',
      name: 'product-details',
      component: () => import('../views/ProductDetails.vue')
    },
    {
      path: '/my-orders',
      name: 'my-orders',
      component: () => import('../views/OrdersView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { 
        hideNavFooter: true, 
        requiresGuest: true 
      }
    },
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: () => import('../views/AdminDashboardView.vue'),
      meta: { 
        hideNavFooter: true,
        requiresAuth: true, 
        requiresAdmin: true 
      }
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('../views/AdminUsersView.vue'),
      meta: { 
        hideNavFooter: true,
        requiresAuth: true, 
        requiresAdmin: true 
      }
    },
    {
      path: '/admin/orders',
      name: 'admin-orders',
      component: () => import('../views/AdminOrdersView.vue'),
      meta: { 
        hideNavFooter: true,
        requiresAuth: true, 
        requiresAdmin: true 
      }
    },
    {
      path: '/admin/products',
      name: 'admin-products',
      component: () => import('../views/AdminProductsView.vue'),
      meta: { hideNavFooter: true, requiresAuth: true, requiresAdmin: true }
  },
  {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
  ]
})


router.beforeEach(async (to, from) => {
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


  if (requiresGuest && currentUser) {
    return '/'
  }

  
  if (requiresAuth && !currentUser) {
    return '/login'
  }

  
  if (requiresAdmin && currentUser) {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists() && userDoc.data().role === 'admin') {
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
    } catch (error) {
      console.error("خطأ في التحقق من الصلاحيات:", error)
      return '/'
    }
  }

  return true
})

export default router