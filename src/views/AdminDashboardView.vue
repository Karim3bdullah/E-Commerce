<template>
  <AdminLayout>
    <div class="dashboard-container">
      
      <div class="dashboard-header">
        <h1>{{ t('admin.dashboard') }}</h1>
        <p>{{ t('admin.dashboardSub') }}</p>
      </div>

      <div v-if="loading" class="loading-state">
        <i class="fa-solid fa-spinner fa-spin"></i> {{ t('admin.calculatingStats') }}
      </div>

      <template v-else>
        <!-- Top Stats Cards Grid -->
        <div class="stats-grid">
          
          <div class="stat-card green">
            <div class="stat-icon"><i class="fa-solid fa-dollar-sign"></i></div>
            <div class="stat-info">
              <span>{{ t('admin.totalRevenue') }}</span>
              <h3>${{ stats.totalRevenue.toFixed(2) }}</h3>
            </div>
          </div>

          <div class="stat-card blue">
            <div class="stat-icon"><i class="fa-solid fa-cart-flatbed"></i></div>
            <div class="stat-info">
              <span>{{ t('admin.totalOrders') }}</span>
              <h3>{{ stats.totalOrders }}</h3>
            </div>
          </div>

          <div class="stat-card purple">
            <div class="stat-icon"><i class="fa-solid fa-boxes-stacked"></i></div>
            <div class="stat-info">
              <span>{{ t('admin.totalProducts') }}</span>
              <h3>{{ stats.totalProducts }}</h3>
            </div>
          </div>

          <div class="stat-card orange">
            <div class="stat-icon"><i class="fa-solid fa-users"></i></div>
            <div class="stat-info">
              <span>{{ t('admin.totalUsers') }}</span>
              <h3>{{ stats.totalUsers }}</h3>
            </div>
          </div>

        </div>

        <!-- Details Grid: Recent Orders & Stock Alerts -->
        <div class="dashboard-details-grid">
          
          <!-- Recent Orders Card -->
          <div class="details-card">
            <div class="card-title">
              <h3><i class="fa-solid fa-clock-rotate-left"></i> {{ t('admin.recentOrders') }}</h3>
              <RouterLink to="/admin/orders" class="view-all">{{ t('admin.viewAll') }}</RouterLink>
            </div>

            <div v-if="recentOrders.length === 0" class="empty-text">{{ t('admin.noOrdersYet') }}</div>

            <ul v-else class="recent-orders-list">
              <li v-for="order in recentOrders" :key="order.id">
                <div class="order-main-info">
                  <strong>#{{ order.id.substring(0, 6).toUpperCase() }}</strong>
                  <span>{{ order.customer?.name || t('admin.userRole') }}</span>
                </div>
                <div class="order-price-status">
                  <span class="price">${{ Number(order.totalPrice || 0).toFixed(2) }}</span>
                  <span :class="['status-pill', order.status]">
                    {{ getStatusText(order.status) }}
                  </span>
                </div>
              </li>
            </ul>
          </div>

          <!-- Stock Alerts Card -->
          <div class="details-card">
            <div class="card-title">
              <h3><i class="fa-solid fa-triangle-exclamation"></i> {{ t('admin.stockAlerts') }}</h3>
              <RouterLink to="/admin/products" class="view-all">{{ t('admin.productsManage') }}</RouterLink>
            </div>

            <div v-if="lowStockProducts.length === 0" class="empty-text green-text">
              <i class="fa-solid fa-circle-check"></i> {{ t('admin.safeStock') }}
            </div>

            <ul v-else class="low-stock-list">
              <li v-for="product in lowStockProducts" :key="product.id">
                <div class="prod-info">
                  <img :src="product.image" :alt="product.title">
                  <span>{{ product.title }}</span>
                </div>
                <span class="stock-badge">{{ t('admin.stockWarning', { count: product.stock }) }}</span>
              </li>
            </ul>
          </div>

        </div>
      </template>

    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '../firebase/config'
import { collection, getDocs, query, orderBy, limit, getCountFromServer, getAggregateFromServer, sum, where } from 'firebase/firestore'
import { useI18n } from 'vue-i18n'
import AdminLayout from '../components/AdminLayout.vue'

const { t } = useI18n()
const loading = ref(true)

const stats = ref({
  totalRevenue: 0,
  totalOrders: 0,
  totalProducts: 0,
  totalUsers: 0
})

const recentOrders = ref([])
const lowStockProducts = ref([])

const getStatusText = (status) => {
  switch (status) {
    case 'pending': return t('orders.statusPending')
    case 'processing': return t('orders.statusProcessing')
    case 'shipped': return t('orders.statusShipped')
    case 'delivered': return t('orders.statusDelivered')
    case 'completed': return t('orders.statusCompleted')
    case 'cancelled': return t('orders.statusCancelled')
    default: return status
  }
}

onMounted(async () => {
  try {
    const ordersCol = collection(db, 'orders')
    const ordersCountSnap = await getCountFromServer(ordersCol)
    stats.value.totalOrders = ordersCountSnap.data().count

    const revenueSnap = await getAggregateFromServer(ordersCol, {
      totalRevenue: sum('totalPrice')
    })
    stats.value.totalRevenue = revenueSnap.data().totalRevenue || 0

    const qRecentOrders = query(ordersCol, orderBy('createdAt', 'desc'), limit(5))
    const recentOrdersSnap = await getDocs(qRecentOrders)
    recentOrders.value = recentOrdersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    const productsCol = collection(db, 'products')
    const productsCountSnap = await getCountFromServer(productsCol)
    stats.value.totalProducts = productsCountSnap.data().count

    const qLowStock = query(productsCol, where('stock', '<=', 5), limit(5))
    const lowStockSnap = await getDocs(qLowStock)
    lowStockProducts.value = lowStockSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    const usersCol = collection(db, 'users')
    const usersCountSnap = await getCountFromServer(usersCol)
    stats.value.totalUsers = usersCountSnap.data().count

  } catch (error) {
    console.error("Dashboard metrics loading error:", error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.dashboard-container {
  max-width: 1300px;
  margin: 0 auto;
  width: 100%;
}

.dashboard-header {
  margin-bottom: 28px;
}

.dashboard-header h1 {
  font-size: 1.8rem;
  color: #0f172a;
  margin: 0 0 6px 0;
  font-weight: 800;
}

.dashboard-header p {
  color: #64748b;
  margin: 0;
  font-size: 0.95rem;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
  font-size: 1.1rem;
}

/* Stats Cards Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 18px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(226, 232, 240, 0.9);
  display: flex;
  align-items: center;
  gap: 18px;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}

.stat-info span {
  display: block;
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 4px;
  font-weight: 600;
}

.stat-info h3 {
  margin: 0;
  font-size: 1.55rem;
  color: #0f172a;
  font-weight: 800;
}

.stat-card.green .stat-icon { background: #dcfce7; color: #16a34a; }
.stat-card.blue .stat-icon { background: #dbeafe; color: #2563eb; }
.stat-card.purple .stat-icon { background: #f3e8ff; color: #9333ea; }
.stat-card.orange .stat-icon { background: #ffedd5; color: #ea580c; }

/* Details Grid: Recent Orders & Alerts */
.dashboard-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.details-card {
  background: white;
  padding: 24px;
  border-radius: 18px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.card-title h3 {
  margin: 0;
  font-size: 1.05rem;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
}

.view-all {
  color: #2563eb;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  padding: 4px 8px;
}

.view-all:hover {
  text-decoration: underline;
}

.empty-text {
  text-align: center;
  padding: 36px 0;
  color: #94a3b8;
  font-size: 0.9rem;
}

.green-text {
  color: #16a34a;
  font-weight: 600;
}

.recent-orders-list, .low-stock-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-orders-list li, .low-stock-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
}

.order-main-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.order-main-info strong {
  color: #0f172a;
  font-size: 0.9rem;
}

.order-main-info span {
  font-size: 0.8rem;
  color: #64748b;
}

.order-price-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.price {
  font-weight: 800;
  color: #059669;
  font-size: 0.95rem;
}

.status-pill {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.status-pill.pending { background: #fef3c7; color: #d97706; }
.status-pill.shipped { background: #e0f2fe; color: #0284c7; }
.status-pill.completed, .status-pill.delivered { background: #dcfce7; color: #16a34a; }
.status-pill.cancelled { background: #fee2e2; color: #dc2626; }

.prod-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.prod-info img {
  width: 38px;
  height: 38px;
  object-fit: contain;
  background: white;
  border-radius: 8px;
  padding: 2px;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.prod-info span {
  font-size: 0.88rem;
  font-weight: 600;
  color: #0f172a;
  max-width: 160px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stock-badge {
  background: #fee2e2;
  color: #dc2626;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .dashboard-header h1 {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .dashboard-details-grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }
}
</style>