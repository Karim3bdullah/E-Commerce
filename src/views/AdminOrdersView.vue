<script setup>
import { ref, onMounted } from 'vue'
import { db } from '../firebase/config'
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore'
import AdminLayout from '../components/AdminLayout.vue'
import Swal from 'sweetalert2'

const list = ref([])
const loading = ref(true)

const selectedOrder = ref(null)
const isModalOpen = ref(false)

const loadOrders = async () => {
  try {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    const res = await getDocs(q)
    
    list.value = res.docs.map(item => ({
      id: item.id,
      ...item.data()
    }))
  } catch (err) {
    console.log("مشكلة في جلب الطلبات:", err)
  } finally {
    loading.value = false
  }
}

const updateStatus = async (orderId, newStatus) => {
  try {
    const orderRef = doc(db, 'orders', orderId)
    await updateDoc(orderRef, { status: newStatus })
    
    const target = list.value.find(item => item.id === orderId)
    if (target) target.status = newStatus

    Swal.fire({
      icon: 'success',
      title: 'تم التحديث بنجاح',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000
    })
  } catch (err) {
    console.log("خطأ في التحديث:", err)
  }
}

const openOrderDetails = (order) => {
  selectedOrder.value = order
  isModalOpen.value = true
}

const closeOrderDetails = () => {
  selectedOrder.value = null
  isModalOpen.value = false
}

onMounted(() => {
  loadOrders()
})

const formatDate = (val) => {
  if (!val) return 'قيد التجهيز'
  return val.toDate().toLocaleDateString('ar-EG')
}
</script>

<template>
  <AdminLayout>
    <div class="admin-container">
      <div class="header">
        <h1>إدارة الطلبات</h1>
        <div class="stats">العدد: {{ list.length }}</div>
      </div>

      <div v-if="loading" class="loading">
        ثواني بنحمل الداتا...
      </div>

      <div v-else-if="list.length === 0" class="empty-state">
        مفيش أي طلبات لحد دلوقتي.
      </div>

      <div v-else class="table-responsive">
        <table class="orders-table">
          <thead>
            <tr>
              <th>رقم الطلب</th>
              <th>التاريخ</th>
              <th>اسم العميل</th>
              <th>التليفون</th>
              <th>العنوان</th>
              <th>القطع</th>
              <th>الإجمالي</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in list" :key="order.id">
              <td class="order-id">#{{ order.id.substring(0, 6).toUpperCase() }}</td>
              <td>{{ formatDate(order.createdAt) }}</td>
              <td>{{ order.customer.name }}</td>
              <td><a :href="`tel:${order.customer.phone}`">{{ order.customer.phone }}</a></td>
              <td>
                <span class="address-tooltip" :title="order.customer.address + ' | ' + order.customer.notes">
                  {{ order.customer.address.substring(0, 20) }}...
                </span>
              </td>
              <td>{{ order.totalItems }} قطع</td>
              <td class="price">${{ order.totalPrice.toFixed(2) }}</td>
              <td>
                <span class="status-badge" :class="order.status">
                  {{ order.status === 'pending' ? 'قيد الانتظار' : order.status === 'shipped' ? 'تم الشحن' : 'مكتمل' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="details-btn" @click="openOrderDetails(order)">تفاصيل</button>
                  <select 
                    class="status-select" 
                    :value="order.status" 
                    @change="updateStatus(order.id, $event.target.value)"
                  >
                    <option value="pending">قيد الانتظار</option>
                    <option value="shipped">تم الشحن</option>
                    <option value="completed">مكتمل</option>
                  </select>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- نافذة تفاصيل الطلب المنبثقة (Modal) -->
      <div v-if="isModalOpen" class="modal-overlay" @click.self="closeOrderDetails">
        <div class="modal-content">
          <div class="modal-header">
            <h2>تفاصيل الطلب #{{ selectedOrder.id.substring(0, 6).toUpperCase() }}</h2>
            <button class="close-btn" @click="closeOrderDetails">&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="customer-info-box">
              <h3>بيانات العميل والشحن</h3>
              <p><strong>الاسم:</strong> {{ selectedOrder.customer.name }}</p>
              <p><strong>الهاتف:</strong> {{ selectedOrder.customer.phone }}</p>
              <p><strong>العنوان:</strong> {{ selectedOrder.customer.address }}</p>
              <p v-if="selectedOrder.customer.notes"><strong>ملاحظات:</strong> {{ selectedOrder.customer.notes }}</p>
            </div>

            <h3>المنتجات المطلوبة</h3>
            <div class="modal-items-list">
              <div v-for="item in selectedOrder.items" :key="item.id" class="modal-item-row">
                <img :src="item.image" :alt="item.title">
                <div class="modal-item-info">
                  <h4>{{ item.title }}</h4>
                  <p>الكمية: {{ item.quantity }} × ${{ item.price }}</p>
                </div>
                <div class="modal-item-total">
                  ${{ (item.price * item.quantity).toFixed(2) }}
                </div>
              </div>
            </div>

            <div class="modal-footer-total">
              <span>الإجمالي الكلي:</span>
              <span class="price-num">${{ selectedOrder.totalPrice.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </AdminLayout>
</template>

<style scoped>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  direction: rtl;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h1 {
  color: #1e293b;
  margin: 0;
  font-size: 1.8rem;
  font-weight: 800;
}

.stats {
  background: #2563eb;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.9rem;
}

.loading, .empty-state {
  text-align: center;
  padding: 60px;
  font-size: 1.1rem;
  color: #64748b;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
}

.table-responsive {
  overflow-x: auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.04);
  border: 1px solid rgba(0,0,0,0.03);
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
}

.orders-table th, .orders-table td {
  padding: 16px 20px;
  text-align: right;
  border-bottom: 1px solid #f1f5f9;
}

.orders-table th {
  background-color: #f8fafc;
  color: #475569;
  font-weight: 700;
  font-size: 0.9rem;
}

.orders-table tbody tr:hover {
  background-color: #f8fafc;
}

.order-id {
  font-family: monospace;
  font-weight: bold;
  color: #64748b;
}

.price {
  font-weight: 800;
  color: #10b981;
}

.address-tooltip {
  cursor: help;
  border-bottom: 1px dashed #cbd5e1;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
}

.status-badge.pending {
  background-color: #fef3c7;
  color: #d97706;
}

.status-badge.shipped {
  background-color: #e0f2fe;
  color: #0284c7;
}

.status-badge.completed {
  background-color: #dcfce7;
  color: #16a34a;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.details-btn {
  padding: 6px 12px;
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: background 0.2s;
}

.details-btn:hover {
  background-color: #e2e8f0;
}

.status-select {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background-color: #f8fafc;
  font-family: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}

/* Modal Styling */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  width: 100%;
  max-width: 600px;
  border-radius: 16px;
  padding: 30px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 15px;
  margin-bottom: 20px;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: #64748b;
}

.customer-info-box {
  background: #f8fafc;
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 20px;
  font-size: 0.95rem;
  color: #334155;
}

.customer-info-box h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1rem;
  color: #1e293b;
}

.customer-info-box p {
  margin: 6px 0;
}

.modal-items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 10px;
  max-height: 250px;
  overflow-y: auto;
}

.modal-item-row {
  display: flex;
  align-items: center;
  gap: 15px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.modal-item-row img {
  width: 50px;
  height: 50px;
  object-fit: contain;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 4px;
}

.modal-item-info {
  flex: 1;
}

.modal-item-info h4 {
  margin: 0 0 4px 0;
  font-size: 0.9rem;
  color: #1e293b;
}

.modal-item-info p {
  margin: 0;
  font-size: 0.8rem;
  color: #64748b;
}

.modal-item-total {
  font-weight: 700;
  color: #1e293b;
  font-size: 0.95rem;
}

.modal-footer-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 2px dashed #e2e8f0;
  font-size: 1.1rem;
  font-weight: 800;
  color: #1e293b;
}

.price-num {
  color: #10b981;
  font-size: 1.3rem;
}

a {
  color: #2563eb;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>