<script setup>
import { ref, computed, onMounted } from 'vue'
import { db } from '../firebase/config'
import { collection, getDocs, orderBy, query, doc, updateDoc, writeBatch, increment, limit, startAfter, getCountFromServer } from 'firebase/firestore'
import AdminLayout from '../components/AdminLayout.vue'
import Swal from 'sweetalert2'

const list = ref([])
const loading = ref(true)

const selectedOrder = ref(null)
const isModalOpen = ref(false)

const pageSize = 10
const currentPage = ref(1)
const totalOrdersCount = ref(0)
const pageCursors = ref([])
const hasMore = ref(false)

const totalPages = computed(() => {
  return Math.ceil(totalOrdersCount.value / pageSize) || 1
})

const fetchTotalCount = async () => {
  try {
    const countSnap = await getCountFromServer(collection(db, 'orders'))
    totalOrdersCount.value = countSnap.data().count
  } catch (e) {
    console.warn("Could not fetch total orders count:", e)
  }
}

const loadOrders = async (targetPage = 1) => {
  loading.value = true
  try {
    if (totalOrdersCount.value === 0) {
      await fetchTotalCount()
    }

    let q
    const cursor = pageCursors.value[targetPage - 1]
    if (targetPage > 1 && cursor) {
      q = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc'),
        startAfter(cursor),
        limit(pageSize)
      )
    } else {
      q = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      )
    }

    const res = await getDocs(q)
    list.value = res.docs.map(item => ({
      id: item.id,
      ...item.data()
    }))

    if (res.docs.length > 0) {
      pageCursors.value[targetPage] = res.docs[res.docs.length - 1]
    }

    hasMore.value = res.docs.length === pageSize
    currentPage.value = targetPage
  } catch (err) {
    console.error("مشكلة في جلب الطلبات:", err)
  } finally {
    loading.value = false
  }
}

const nextPage = () => {
  if (hasMore.value && !loading.value) {
    loadOrders(currentPage.value + 1)
  }
}

const prevPage = () => {
  if (currentPage.value > 1 && !loading.value) {
    loadOrders(currentPage.value - 1)
  }
}

const updateStatus = async (orderId, newStatus) => {
  const target = list.value.find(item => item.id === orderId)
  if (!target || target.status === newStatus) return

  const oldStatus = target.status

  try {
    // Scenario 1: Order is transitioning to 'cancelled' -> Automatically restock inventory
    if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
      const confirmCancel = await Swal.fire({
        title: 'تأكيد إلغاء الطلب؟',
        text: 'سيتم إلغاء هذا الطلب وإرجاع كميات جميع المنتجات إلى المخزون تلقائياً.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'نعم، ألغ الطلب واسترجع المخزون',
        cancelButtonText: 'تراجع'
      })

      if (!confirmCancel.isConfirmed) return

      const batch = writeBatch(db)
      const orderRef = doc(db, 'orders', orderId)
      batch.update(orderRef, { status: 'cancelled' })

      if (Array.isArray(target.items)) {
        for (const item of target.items) {
          if (item.id && item.quantity > 0) {
            const productRef = doc(db, 'products', item.id)
            batch.update(productRef, {
              stock: increment(item.quantity)
            })
          }
        }
      }

      await batch.commit()
      target.status = 'cancelled'
      if (selectedOrder.value && selectedOrder.value.id === orderId) {
        selectedOrder.value.status = 'cancelled'
      }

      Swal.fire({
        icon: 'success',
        title: 'تم الإلغاء واسترجاع المخزون',
        text: 'تم تحديث حالة الطلب وإعادة الكميات للمخزون بنجاح.',
        timer: 2500,
        showConfirmButton: false
      })
      return
    }

    // Scenario 2: Re-opening a previously cancelled order -> Re-decrement stock
    if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
      const confirmReopen = await Swal.fire({
        title: 'إعادة تفعيل الطلب؟',
        text: 'هذا الطلب كان ملغياً وتم استرجاع مخزونه مسبقاً. هل تريد إعادة تفعيله وخصم كمياته من المخزون مجدداً؟',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'نعم، أعد التفعيل',
        cancelButtonText: 'تراجع'
      })

      if (!confirmReopen.isConfirmed) return

      const batch = writeBatch(db)
      const orderRef = doc(db, 'orders', orderId)
      batch.update(orderRef, { status: newStatus })

      if (Array.isArray(target.items)) {
        for (const item of target.items) {
          if (item.id && item.quantity > 0) {
            const productRef = doc(db, 'products', item.id)
            batch.update(productRef, {
              stock: increment(-item.quantity)
            })
          }
        }
      }

      await batch.commit()
      target.status = newStatus
      if (selectedOrder.value && selectedOrder.value.id === orderId) {
        selectedOrder.value.status = newStatus
      }

      Swal.fire({
        icon: 'success',
        title: 'تم التفعيل',
        text: 'تمت إعادة تفعيل الطلب وتحديث المخزون بنجاح.',
        timer: 2000,
        showConfirmButton: false
      })
      return
    }

    // Scenario 3: Standard status transition (pending -> shipped -> completed)
    const orderRef = doc(db, 'orders', orderId)
    await updateDoc(orderRef, { status: newStatus })
    target.status = newStatus
    if (selectedOrder.value && selectedOrder.value.id === orderId) {
      selectedOrder.value.status = newStatus
    }

    Swal.fire({
      icon: 'success',
      title: 'تم التحديث بنجاح',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000
    })
  } catch (err) {
    console.error("خطأ في تحديث حالة الطلب:", err)
    Swal.fire({
      icon: 'error',
      title: 'فشل التحديث',
      text: 'تعذر تعديل حالة الطلب في قاعدة البيانات.'
    })
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
        <div class="stats">إجمالي الطلبات: {{ totalOrdersCount || list.length }}</div>
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
                  {{ order.status === 'pending' ? 'قيد الانتظار' : order.status === 'shipped' ? 'تم الشحن' : order.status === 'completed' ? 'مكتمل' : order.status === 'cancelled' ? 'ملغي' : order.status }}
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
                    <option value="cancelled">ملغي (استرجاع المخزون)</option>
                  </select>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- أزرار التنقل بين الصفحات السيرفرية -->
      <div class="pagination-controls" v-if="totalPages > 1 || hasMore || currentPage > 1">
        <button 
          class="pagination-btn" 
          :disabled="currentPage === 1 || loading" 
          @click="prevPage"
        >
          <i class="fa-solid fa-chevron-right"></i> السابق
        </button>

        <span class="pagination-info">
          الصفحة {{ currentPage }} من {{ totalPages }}
          <span class="total-orders-badge" v-if="totalOrdersCount">({{ totalOrdersCount }} طلب إجمالاً)</span>
        </span>

        <button 
          class="pagination-btn" 
          :disabled="!hasMore || loading" 
          @click="nextPage"
        >
          التالي <i class="fa-solid fa-chevron-left"></i>
        </button>
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
              <div class="modal-status-row">
                <h3>بيانات العميل والشحن</h3>
                <div class="modal-status-controls">
                  <span class="status-badge" :class="selectedOrder.status">
                    {{ selectedOrder.status === 'pending' ? 'قيد الانتظار' : selectedOrder.status === 'shipped' ? 'تم الشحن' : selectedOrder.status === 'completed' ? 'مكتمل' : selectedOrder.status === 'cancelled' ? 'ملغي' : selectedOrder.status }}
                  </span>
                  <select 
                    class="status-select" 
                    :value="selectedOrder.status" 
                    @change="updateStatus(selectedOrder.id, $event.target.value)"
                  >
                    <option value="pending">قيد الانتظار</option>
                    <option value="shipped">تم الشحن</option>
                    <option value="completed">مكتمل</option>
                    <option value="cancelled">ملغي (استرجاع المخزون)</option>
                  </select>
                </div>
              </div>
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

.status-badge.cancelled {
  background-color: #fee2e2;
  color: #dc2626;
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

.modal-status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 10px;
}

.modal-status-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.customer-info-box h3 {
  margin: 0;
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

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 25px;
  padding: 10px 0;
}

.pagination-btn {
  padding: 8px 18px;
  background-color: white;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  color: #334155;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #2563eb;
  color: white;
  border-color: #2563eb;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.95rem;
  font-weight: 700;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 8px;
}

.total-orders-badge {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}
</style>