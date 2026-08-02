<template>
  <div class="notifications-wrapper">
    <button class="icon-button notification-btn" @click="toggleDropdown">
      <i class="fa-solid fa-bell"></i>
      <span v-if="notificationsCount > 0" class="count-badge">{{ notificationsCount }}</span>
    </button>

    <!-- قائمة الإشعارات المنسدلة -->
    <Transition name="fade-slide">
      <div v-if="isDropdownOpen" class="notifications-dropdown">
        <div class="dropdown-header">
          <h4>الإشعارات</h4>
          <span class="badge-pill">{{ notificationsCount }} جديد</span>
        </div>
        
        <div class="dropdown-body">
          <template v-if="lowStockProducts.length > 0">
            <div v-for="product in lowStockProducts" :key="product.id" class="notification-item warning">
              <div class="noti-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
              <div class="noti-content">
                <p class="noti-title">تحذير نفاذ مخزون</p>
                <p class="noti-desc">المنتج "<strong>{{ product.title }}</strong>" تبقى منه {{ product.stock }} فقط!</p>
              </div>
            </div>
          </template>

          <div v-if="notificationsCount === 0" class="empty-noti">
            <i class="fa-regular fa-bell-slash"></i>
            <p>لا توجد إشعارات جديدة</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useProductStore } from '../stores/productstore'

const productStore = useProductStore()
const isDropdownOpen = ref(false)

// حساب المنتجات التي وصلت لحد النفاذ
const lowStockProducts = computed(() => {
  return productStore.products.filter(p => p.stock <= (p.lowStockThreshold || 5))
})

// إجمالي الإشعارات (يمكنك إضافة إشعارات الطلبات هنا مستقبلاً)
const notificationsCount = computed(() => {
  return lowStockProducts.value.length
})

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

// إغلاق القائمة عند الضغط في أي مكان خارجها
const closeDropdown = (e) => {
  if (!e.target.closest('.notifications-wrapper')) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', closeDropdown)
})
onUnmounted(() => {
  window.removeEventListener('click', closeDropdown)
})
</script>

<style scoped>
.notifications-wrapper {
  position: relative;
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
  transition: background 0.2s;
  font-size: 1.2rem;
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
  font-weight: bold;
}

.notifications-dropdown {
  position: absolute;
  top: calc(100% + 15px);
  left: 0; /* يفتح جهة اليسار */
  width: 320px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  z-index: 1100;
  overflow: hidden;
  border: 1px solid #f1f5f9;
}

.dropdown-header {
  padding: 15px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dropdown-header h4 { margin: 0; font-weight: 700; color: #1e293b; }
.badge-pill { background: #2563eb; color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; }

.dropdown-body {
  max-height: 350px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  gap: 15px;
  padding: 15px 20px;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.2s;
}

.notification-item:hover { background: #f8fafc; }

.notification-item.warning .noti-icon {
  color: #f59e0b;
  background: #fef3c7;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.noti-title { margin: 0 0 5px 0; font-weight: 700; font-size: 0.95rem; color: #1e293b; }
.noti-desc { margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.4; }

.empty-noti {
  padding: 40px 20px;
  text-align: center;
  color: #94a3b8;
}
.empty-noti i { font-size: 2rem; margin-bottom: 10px; }

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-10px); }
</style>