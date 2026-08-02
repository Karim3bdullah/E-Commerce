<script setup>
import { auth } from '../firebase/config'
import { signOut } from 'firebase/auth'
import { useRouter, useRoute } from 'vue-router'
import Swal from 'sweetalert2'
import { useProductStore } from '../stores/productstore' 
import AdminNotifications from '../components/AdminNotifications.vue' 

const router = useRouter()
const route = useRoute()


const productStore = useProductStore() 

const handleLogout = async () => {
  const result = await Swal.fire({
    title: 'تسجيل الخروج',
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
</script>

<template>
  <div class="admin-layout">
    
    <aside class="sidebar">
      <div class="sidebar-brand">
        <i class="fa-solid fa-shield-halved"></i>
        <span>لوحة الإدارة</span>
      </div>

      <ul class="sidebar-menu">
       <li>
          <RouterLink to="/admin/dashboard" class="menu-link" :class="{ active: route.path === '/admin/dashboard' }">
            <i class="fa-solid fa-chart-line"></i> الإحصائيات والتقارير
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/admin/orders" class="menu-link" :class="{ active: route.path === '/admin/orders' }">
            <i class="fa-solid fa-box-open"></i> إدارة الطلبات
          </RouterLink>
        </li>
        <li>
        
          <RouterLink to="/admin/products" class="menu-link" :class="{ active: route.path === '/admin/products' }">
            <i class="fa-solid fa-boxes-stacked"></i> المنتجات
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/admin/users" class="menu-link" :class="{ active: route.path === '/admin/users' }">
            <i class="fa-solid fa-users"></i> إدارة المستخدمين
          </RouterLink>
        </li>
        
        <hr class="divider">
        <li>
          <RouterLink to="/" class="menu-link back-store">
            <i class="fa-solid fa-store"></i> العودة للمتجر
          </RouterLink>
        </li>
      </ul>

      <div class="sidebar-footer">
        <button type="button" @click="handleLogout" class="logout-btn">
          <i class="fa-solid fa-arrow-right-from-bracket"></i> تسجيل الخروج
        </button>
      </div>
    </aside>

    
    <main class="main-content">
      
     <header class="topbar">
       
        <div class="admin-search-bar" :class="{ 'hidden-search': route.path !== '/admin/products' }">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <!-- ربط البحث بمتغير Pinia سيجعل الجدول يتفلتر فوراً وبسلاسة! -->
          <input 
            type="text" 
            v-model="productStore.searchQuery" 
            placeholder="ابحث عن منتج..." 
            class="search-input"
          >
        </div>

        <div class="topbar-actions">
          <AdminNotifications />
          
          <div class="admin-profile-wrapper">
            <div class="welcome-text">أهلاً يا مدير</div>
            <div class="admin-profile">
              <img src="https://ui-avatars.com/api/?name=Admin&background=1e293b&color=fff" alt="Admin">
            </div>
          </div>
        </div>
      </header>

     
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
  background-color: #f1f5f9;
  direction: rtl; 
}

.sidebar {
  width: 260px;
  background-color: #1e293b;
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  box-shadow: -4px 0 15px rgba(0,0,0,0.1);
  z-index: 1000; 
}

.sidebar-brand {
  padding: 25px 20px;
  font-size: 1.4rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #334155;
  color: #38bdf8;
}

.sidebar-menu {
  list-style: none;
  padding: 20px 15px;
  margin: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.menu-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  color: #cbd5e1;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-size: 1.05rem;
}

.menu-link:hover, .menu-link.active {
  background-color: #334155;
  color: white;
}

.menu-link.active {
  border-right: 4px solid #38bdf8;
  background-color: #0f172a;
}

.menu-link.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.back-store {
  color: #10b981;
}
.back-store:hover { background-color: rgba(16, 185, 129, 0.1); }

.divider {
  border: none;
  border-top: 1px solid #334155;
  margin: 10px 0;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid #334155;
}

.logout-btn {
  width: 100%;
  padding: 12px;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  transition: background 0.3s;
}

.logout-btn:hover { background-color: #dc2626; }

.main-content {
  flex: 1;
  margin-right: 260px; 
  display: flex;
  flex-direction: column;
  width: calc(100% - 260px); 
  min-height: 100vh;
}

.topbar {
  background-color: white;
  padding: 15px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  position: sticky;
  top: 0;
  z-index: 99;
}

.admin-search-bar {
  position: relative;
  width: 100%;
  max-width: 400px;
}
.admin-search-bar.hidden-search {
  visibility: hidden;
  pointer-events: none;
}

.admin-search-bar .search-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.admin-search-bar .search-input {
  width: 100%;
  padding: 10px 40px 10px 15px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: #f8fafc;
  font-family: inherit;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.3s;
}

.admin-search-bar .search-input:focus {
  border-color: #2563eb;
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 25px;
}

.admin-profile-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  border-right: 1px solid #e2e8f0;
  padding-right: 25px;
}

@media (max-width: 768px) {
  .admin-search-bar { display: none; /* إخفاء البحث في الشاشات الصغيرة لتوفير المساحة */ }
  .welcome-text { display: none; }
}

.welcome-text {
  font-size: 1.1rem;
  font-weight: bold;
  color: #334155;
}

.admin-profile img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #e2e8f0;
}

.content-wrapper {
  padding: 30px;
  flex: 1;
  overflow-x: auto; 
}
</style>