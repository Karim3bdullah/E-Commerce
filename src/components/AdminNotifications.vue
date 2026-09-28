<template>
  <div class="notifications-wrapper">
    <button 
      type="button" 
      class="icon-button notification-btn" 
      @click="toggleDropdown"
      :title="t('nav.notifications')"
      :aria-label="t('nav.notifications')"
    >
      <i class="fa-solid fa-bell"></i>
      <span v-if="notificationsCount > 0" class="count-badge">{{ notificationsCount }}</span>
    </button>

    <!-- Notification Dropdown Popover -->
    <Transition name="fade-slide">
      <div 
        v-if="isDropdownOpen" 
        class="notifications-dropdown"
        :class="isRtl ? 'rtl-dropdown' : 'ltr-dropdown'"
      >
        <div class="dropdown-header">
          <div class="header-title-box">
            <h4>{{ t('nav.notifications') }}</h4>
            <span class="badge-pill">{{ notificationsCount }} {{ t('nav.newPill') }}</span>
          </div>
          <button 
            v-if="notificationsCount > 0" 
            type="button" 
            class="dismiss-all-btn"
            @click="dismissAll"
          >
            {{ t('nav.markAllRead') }}
          </button>
        </div>
        
        <div class="dropdown-body">
          <!-- Pending Orders Alerts -->
          <template v-if="pendingOrders.length > 0">
            <div 
              v-for="order in pendingOrders" 
              :key="'order-' + order.id" 
              class="notification-item order-alert clickable"
              @click="handleOrderClick(order.id)"
            >
              <div class="noti-icon order-icon"><i class="fa-solid fa-box"></i></div>
              <div class="noti-content">
                <div class="noti-top-row">
                  <p class="noti-title">{{ isRtl ? 'طلب جديد قيد الانتظار' : 'New Pending Order' }}</p>
                  <span class="noti-time">{{ formatOrderTime(order.createdAt) }}</span>
                </div>
                <p class="noti-desc">
                  {{ isRtl ? `طلب #${order.id.substring(0, 6).toUpperCase()} بقيمة $${order.totalPrice?.toFixed(2)} للعميل ${order.customer?.name || ''}` : `Order #${order.id.substring(0, 6).toUpperCase()} ($${order.totalPrice?.toFixed(2)}) for ${order.customer?.name || 'customer'}` }}
                </p>
              </div>
              <i class="fa-solid fa-chevron-right action-arrow" :class="{ 'rtl-arrow': isRtl }"></i>
            </div>
          </template>

          <!-- Low Stock Products Alerts -->
          <template v-if="activeLowStockProducts.length > 0">
            <div 
              v-for="product in activeLowStockProducts" 
              :key="'prod-' + product.id" 
              class="notification-item warning-alert clickable"
              @click="handleStockClick(product.id)"
            >
              <div class="noti-icon warning-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
              <div class="noti-content">
                <div class="noti-top-row">
                  <p class="noti-title">{{ t('admin.stockAlerts') }}</p>
                  <span class="stock-num-pill">{{ product.stock }} {{ product.unitType === 'weight' ? t('variants.kg') : t('admin.pieces') }}</span>
                </div>
                <p class="noti-desc">
                  {{ isRtl ? `المنتج "${product.title}" أوشك على النفاذ (${product.stock} فقط متبقية)` : `Product "${product.title}" is running low (${product.stock} remaining)` }}
                </p>
              </div>
              <i class="fa-solid fa-chevron-right action-arrow" :class="{ 'rtl-arrow': isRtl }"></i>
            </div>
          </template>

          <div v-if="notificationsCount === 0" class="empty-noti">
            <i class="fa-regular fa-bell-slash"></i>
            <p>{{ t('nav.noNotifications') }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '../stores/productstore'
import { useI18n } from 'vue-i18n'
import { collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'

const router = useRouter()
const productStore = useProductStore()
const { t, locale } = useI18n()
const isDropdownOpen = ref(false)
const dismissedIds = ref(new Set())
const pendingOrders = ref([])

const isRtl = computed(() => locale.value === 'ar')

const activeLowStockProducts = computed(() => {
  return productStore.products
    .filter(p => p.stock <= (p.lowStockThreshold || 5))
    .filter(p => !dismissedIds.value.has('prod-' + p.id))
})

const notificationsCount = computed(() => {
  return activeLowStockProducts.value.length + pendingOrders.value.length
})

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
  if (isDropdownOpen.value) {
    fetchRecentPendingOrders()
  }
}

const closeDropdown = (e) => {
  if (!e.target.closest('.notifications-wrapper')) {
    isDropdownOpen.value = false
  }
}

const fetchRecentPendingOrders = async () => {
  try {
    const q = query(
      collection(db, 'orders'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(5)
    )
    const snap = await getDocs(q)
    pendingOrders.value = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(o => !dismissedIds.value.has('order-' + o.id))
  } catch (err) {
    console.warn("Notice fetching pending orders for notifications:", err)
  }
}

const handleStockClick = (productId) => {
  dismissedIds.value.add('prod-' + productId)
  isDropdownOpen.value = false
  router.push({
    path: '/admin/products',
    query: { editProduct: productId, t: Date.now() }
  })
}

const handleOrderClick = (orderId) => {
  dismissedIds.value.add('order-' + orderId)
  isDropdownOpen.value = false
  router.push({
    path: '/admin/orders',
    query: { orderId: orderId, t: Date.now() }
  })
}

const dismissAll = () => {
  activeLowStockProducts.value.forEach(p => dismissedIds.value.add('prod-' + p.id))
  pendingOrders.value.forEach(o => dismissedIds.value.add('order-' + o.id))
  pendingOrders.value = []
}

const formatOrderTime = (timestamp) => {
  if (!timestamp) return ''
  try {
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return d.toLocaleTimeString(locale.value === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    return ''
  }
}

onMounted(() => {
  window.addEventListener('click', closeDropdown)
  fetchRecentPendingOrders()
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
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  transition: all 0.2s;
  font-size: 1.15rem;
}

.icon-button:hover { 
  background: #f1f5f9; 
  color: #0f172a;
}

.count-badge {
  position: absolute;
  top: -4px;
  inset-inline-end: -4px;
  background: #ef4444;
  color: white;
  font-size: 0.72rem;
  min-width: 20px;
  height: 20px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-weight: 800;
  border: 2px solid #ffffff;
}

.notifications-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  inset-inline-end: 0;
  width: 360px;
  max-width: calc(100vw - 2rem);
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 20px 45px -10px rgba(15, 23, 42, 0.18);
  z-index: 1100;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.notifications-dropdown.rtl-dropdown {
  direction: rtl;
  text-align: right;
}

.notifications-dropdown.ltr-dropdown {
  direction: ltr;
  text-align: left;
}

.dropdown-header {
  padding: 14px 18px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dropdown-header h4 { 
  margin: 0; 
  font-weight: 800; 
  color: #1e293b; 
  font-size: 0.95rem;
}

.badge-pill { 
  background: #2563eb; 
  color: white; 
  padding: 3px 10px; 
  border-radius: 20px; 
  font-size: 0.75rem; 
  font-weight: 700;
}

.dismiss-all-btn {
  background: none;
  border: none;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
  font-family: inherit;
}

.dismiss-all-btn:hover {
  color: #2563eb;
  background: #eff6ff;
}

.dropdown-body {
  max-height: 380px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s;
  align-items: center;
}

.notification-item.clickable {
  cursor: pointer;
}

.notification-item:hover { 
  background: #f8fafc; 
}

.noti-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.warning-icon {
  background: #fef3c7;
  color: #d97706;
}

.order-icon {
  background: #dbeafe;
  color: #2563eb;
}

.noti-content {
  flex: 1;
  min-width: 0;
}

.noti-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3px;
  gap: 8px;
}

.noti-title {
  margin: 0;
  font-weight: 700;
  color: #1e293b;
  font-size: 0.88rem;
}

.noti-time {
  font-size: 0.75rem;
  color: #94a3b8;
}

.stock-num-pill {
  font-size: 0.72rem;
  font-weight: 700;
  background: #fee2e2;
  color: #dc2626;
  padding: 2px 8px;
  border-radius: 999px;
}

.noti-desc {
  margin: 0;
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-arrow {
  font-size: 0.8rem;
  color: #cbd5e1;
  transition: transform 0.2s;
}

.notification-item:hover .action-arrow {
  color: #2563eb;
  transform: translateX(3px);
}

.action-arrow.rtl-arrow {
  transform: rotate(180deg);
}

.notification-item:hover .action-arrow.rtl-arrow {
  transform: rotate(180deg) translateX(3px);
}

.empty-noti {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.empty-noti i {
  font-size: 2rem;
  margin-bottom: 8px;
  display: block;
}

.empty-noti p {
  margin: 0;
  font-size: 0.88rem;
}

/* Animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>