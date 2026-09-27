<template>
  <AdminLayout>
    <div class="dashboard-container">
      
      <div class="dashboard-header">
        <h1>لوحة الإحصائيات والتقارير</h1>
        <p>نظرة عامة على أداء المتجر والمبيعات</p>
      </div>

      <div v-if="loading" class="loading-state">
        <i class="fa-solid fa-spinner fa-spin"></i> جاري حرق الأرقام وحساب الإحصائيات...
      </div>

      <template v-else>
        <div class="stats-grid">
          
          <div class="stat-card green">
            <div class="stat-icon"><i class="fa-solid fa-dollar-sign"></i></div>
            <div class="stat-info">
              <span>إجمالي المبيعات</span>
              <h3>${{ stats.totalRevenue.toFixed(2) }}</h3>
            </div>
          </div>

          <div class="stat-card blue">
            <div class="stat-icon"><i class="fa-solid fa-cart-flatbed"></i></div>
            <div class="stat-info">
              <span>إجمالي الطلبات</span>
              <h3>{{ stats.totalOrders }}</h3>
            </div>
          </div>

          <div class="stat-card purple">
            <div class="stat-icon"><i class="fa-solid fa-boxes-stacked"></i></div>
            <div class="stat-info">
              <span>عدد المنتجات</span>
              <h3>{{ stats.totalProducts }}</h3>
            </div>
          </div>

          <div class="stat-card orange">
            <div class="stat-icon"><i class="fa-solid fa-users"></i></div>
            <div class="stat-info">
              <span>العملاء المسجلون</span>
              <h3>{{ stats.totalUsers }}</h3>
            </div>
          </div>

        </div>

        <div class="dashboard-details-grid">
          
          <div class="details-card">
            <div class="card-title">
              <h3><i class="fa-solid fa-clock-rotate-left"></i> أحدث الطلبات</h3>
              <RouterLink to="/admin/orders" class="view-all">عرض الكل</RouterLink>
            </div>

            <div v-if="recentOrders.length === 0" class="empty-text">لا توجد طلبات حتى الآن.</div>

            <ul v-else class="recent-orders-list">
              <li v-for="order in recentOrders" :key="order.id">
                <div class="order-main-info">
                  <strong>#{{ order.id.substring(0, 6).toUpperCase() }}</strong>
                  <span>{{ order.customer?.name || 'عميل' }}</span>
                </div>
                <div class="order-price-status">
                  <span class="price">${{ order.totalPrice?.toFixed(2) }}</span>
                  <span :class="['status-pill', order.status]">
                    {{ order.status === 'pending' ? 'انتظار' : order.status === 'shipped' ? 'مشحون' : order.status === 'cancelled' ? 'ملغي' : 'مكتمل' }}
                  </span>
                </div>
              </li>
            </ul>
          </div>

          <div class="details-card">
            <div class="card-title">
              <h3><i class="fa-solid fa-triangle-exclamation"></i> تنبيهات المخزون</h3>
              <RouterLink to="/admin/products" class="view-all">إدارة المنتجات</RouterLink>
            </div>

            <div v-if="lowStockProducts.length === 0" class="empty-text green-text">
              <i class="fa-solid fa-circle-check"></i> جميع المنتجات بمخزون آمن!
            </div>

            <ul v-else class="low-stock-list">
              <li v-for="product in lowStockProducts" :key="product.id">
                <div class="prod-info">
                  <img :src="product.image" :alt="product.title">
                  <span>{{ product.title }}</span>
                </div>
                <span class="stock-badge">متبقي {{ product.stock }} قطع</span>
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
import AdminLayout from '../components/AdminLayout.vue'

const loading = ref(true)

const stats = ref({
  totalRevenue: 0,
  totalOrders: 0,
  totalProducts: 0,
  totalUsers: 0
})

const recentOrders = ref([])
const lowStockProducts = ref([])

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
    console.error("خطأ في جلب الإحصائيات:", error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
  direction: rtl;
}

.dashboard-header {
  margin-bottom: 30px;
}

.dashboard-header h1 {
  margin: 0 0 8px 0;
  color: #1e293b;
  font-size: 1.8rem;
  font-weight: 800;
}

.dashboard-header p {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
}

.loading-state {
  text-align: center;
  padding: 80px 0;
  color: #64748b;
  font-size: 1.2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 35px;
}

.stat-card {
  background: white;
  padding: 22px;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  border: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 55px;
  height: 55px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-info span {
  display: block;
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 5px;
  font-weight: 600;
}

.stat-info h3 {
  margin: 0;
  font-size: 1.6rem;
  color: #1e293b;
  font-weight: 800;
}

.stat-card.green .stat-icon { background: #dcfce7; color: #16a34a; }
.stat-card.blue .stat-icon { background: #dbeafe; color: #2563eb; }
.stat-card.purple .stat-icon { background: #f3e8ff; color: #9333ea; }
.stat-card.orange .stat-icon { background: #ffedd5; color: #ea580c; }

.dashboard-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 25px;
}

.details-card {
  background: white;
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  border: 1px solid #f1f5f9;
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.card-title h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 10px;
}

.view-all {
  color: #2563eb;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
}

.empty-text {
  text-align: center;
  padding: 30px 0;
  color: #94a3b8;
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
  padding: 12px 15px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #f1f5f9;
}

.order-main-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.order-main-info strong {
  color: #1e293b;
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
  color: #10b981;
}

.status-pill {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
}

.status-pill.pending { background: #fef3c7; color: #d97706; }
.status-pill.shipped { background: #e0f2fe; color: #0284c7; }
.status-pill.completed { background: #dcfce7; color: #16a34a; }
.status-pill.cancelled { background: #fee2e2; color: #dc2626; }

.prod-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.prod-info img {
  width: 35px;
  height: 35px;
  object-fit: contain;
  background: white;
  border-radius: 6px;
  padding: 2px;
  border: 1px solid #e2e8f0;
}

.prod-info span {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stock-badge {
  background: #fee2e2;
  color: #dc2626;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
}
</style>