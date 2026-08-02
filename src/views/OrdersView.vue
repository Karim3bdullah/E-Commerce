<script setup>
import { ref, onMounted } from 'vue'
import { db, auth } from '../firebase/config'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { useRouter } from 'vue-router'


const router = useRouter()
const orders = ref([])
const loading = ref(true)

const loadMyOrders = async () => {
  if (!auth.currentUser) {
   router.push('/login')
    return
  }

  try {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    )
    
    const res = await getDocs(q)
    orders.value = res.docs.map(item => ({
      id: item.id,
      ...item.data()
    }))
  } catch (err) {
    console.log("خطأ في جلب طلبات العميل:", err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMyOrders()
})

const formatDate = (val) => {
  if (!val) return 'قيد التجهيز'
  return val.toDate().toLocaleDateString('ar-EG')
}
</script>

<template>
  <div class="orders-container">
    <h1>طلباتي السابقة</h1>

    <div v-if="loading" class="loading">
      جاري تحميل طلباتك...
    </div>

    <div v-else-if="!auth.currentUser" class="empty-state">
      يجب تسجيل الدخول لعرض طلباتك.
    </div>

    <div v-else-if="orders.length === 0" class="empty-state">
      ليس لديك أي طلبات سابقة حتى الآن.
    </div>

    <div v-else class="orders-list">
      <div v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-header">
          <span class="order-id">طلب #{{ order.id.substring(0, 6).toUpperCase() }}</span>
          <span class="order-date">{{ formatDate(order.createdAt) }}</span>
        </div>

        <div class="order-body">
          <div class="items-summary">
            <p><strong>عدد القطع:</strong> {{ order.totalItems }}</p>
            <p><strong>الإجمالي:</strong> ${{ order.totalPrice.toFixed(2) }}</p>
          </div>
          <div class="order-status" :class="order.status">
            {{ order.status === 'pending' ? 'قيد الانتظار' : order.status === 'shipped' ? 'تم الشحن' : 'مكتمل' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orders-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
  direction: rtl;
}

h1 {
  font-size: 1.8rem;
  color: #1e293b;
  margin-bottom: 25px;
  font-weight: 800;
}

.loading, .empty-state {
  text-align: center;
  padding: 50px;
  background: white;
  border-radius: 16px;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-card {
  background: white;
  border-radius: 16px;
  padding: 20px 25px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 15px rgba(0,0,0,0.02);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 12px;
  margin-bottom: 15px;
}

.order-id {
  font-family: monospace;
  font-weight: bold;
  color: #2563eb;
}

.order-date {
  color: #64748b;
  font-size: 0.9rem;
}

.order-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.items-summary p {
  margin: 5px 0;
  color: #334155;
}

.order-status {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
}

.order-status.pending {
  background-color: #fef3c7;
  color: #d97706;
}

.order-status.shipped {
  background-color: #e0f2fe;
  color: #0284c7;
}

.order-status.completed {
  background-color: #dcfce7;
  color: #16a34a;
}
</style>