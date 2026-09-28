<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { db } from '../firebase/config'
import { collection, getDocs, orderBy, query, doc, getDoc, updateDoc, writeBatch, increment, limit, startAfter, getCountFromServer } from 'firebase/firestore'
import AdminLayout from '../components/AdminLayout.vue'
import Swal from 'sweetalert2'

const route = useRoute()
const { t, locale } = useI18n()
const isRtl = computed(() => locale.value === 'ar')

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
    console.error("Error fetching orders:", err)
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
        title: t('admin.confirmCancelTitle'),
        text: t('admin.confirmCancelText'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: t('admin.confirmCancelBtn'),
        cancelButtonText: t('common.cancel')
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
        title: t('admin.cancelSuccessTitle'),
        text: t('admin.cancelSuccessText'),
        timer: 2500,
        showConfirmButton: false
      })
      return
    }

    // Scenario 2: Re-opening a previously cancelled order -> Re-decrement stock
    if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
      const confirmReopen = await Swal.fire({
        title: t('admin.confirmReopenTitle'),
        text: t('admin.confirmReopenText'),
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: t('admin.yesReopen'),
        cancelButtonText: t('common.cancel')
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
        title: t('admin.reopenSuccessTitle'),
        text: t('admin.reopenSuccessText'),
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
      title: t('admin.updateStatusSuccess'),
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000
    })
  } catch (err) {
    console.error("Error updating order status:", err)
    Swal.fire({
      icon: 'error',
      title: t('admin.updateFailed'),
      text: t('admin.updateFailedText')
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

onMounted(async () => {
  await loadOrders()

  if (route.query.orderId) {
    const target = list.value.find(o => o.id === route.query.orderId)
    if (target) {
      openOrderDetails(target)
    } else {
      try {
        const orderSnap = await getDoc(doc(db, 'orders', route.query.orderId))
        if (orderSnap.exists()) {
          openOrderDetails({ id: orderSnap.id, ...orderSnap.data() })
        }
      } catch (err) {
        console.warn("Could not fetch order from query param:", err)
      }
    }
  }
})

const formatDate = (val) => {
  if (!val) return '...'
  return val.toDate().toLocaleDateString(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <AdminLayout>
    <div class="admin-container">
      <div class="header">
        <div>
          <h1>{{ t('admin.ordersManage') }}</h1>
        </div>
        <div class="stats">
          {{ t('admin.totalOrders') }}: {{ totalOrdersCount || list.length }}
        </div>
      </div>

      <div v-if="loading" class="loading">
        <i class="fa-solid fa-spinner fa-spin"></i> {{ t('admin.loadingData') }}
      </div>

      <div v-else-if="list.length === 0" class="empty-state">
        <i class="fa-solid fa-box-open empty-icon"></i>
        <p>{{ t('admin.noOrdersYet') }}</p>
      </div>

      <div v-else class="table-responsive">
        <table class="orders-table">
          <thead>
            <tr>
              <th>{{ t('admin.orderId') }}</th>
              <th>{{ t('admin.date') }}</th>
              <th>{{ t('admin.customerName') }}</th>
              <th>{{ t('admin.customerPhone') }}</th>
              <th>{{ t('admin.address') }}</th>
              <th>{{ t('admin.items') }}</th>
              <th>{{ t('admin.total') }}</th>
              <th>{{ t('admin.status') }}</th>
              <th>{{ t('admin.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in list" :key="order.id">
              <td class="order-id">#{{ order.id.substring(0, 6).toUpperCase() }}</td>
              <td>{{ formatDate(order.createdAt) }}</td>
              <td class="font-semibold">{{ order.customer?.name || '-' }}</td>
              <td><a :href="`tel:${order.customer?.phone}`">{{ order.customer?.phone || '-' }}</a></td>
              <td>
                <span class="address-tooltip" :title="(order.customer?.address || '') + (order.customer?.notes ? ' | ' + order.customer.notes : '')">
                  {{ (order.customer?.address || '').substring(0, 24) }}{{ (order.customer?.address || '').length > 24 ? '...' : '' }}
                </span>
              </td>
              <td>{{ order.totalItems }} {{ t('admin.pieces') }}</td>
              <td class="price">${{ order.totalPrice?.toFixed(2) }}</td>
              <td>
                <span class="status-badge" :class="order.status">
                  {{ order.status === 'pending' ? t('admin.statusPending') : order.status === 'shipped' ? t('admin.statusShipped') : order.status === 'completed' ? t('admin.statusCompleted') : order.status === 'cancelled' ? t('admin.statusCancelled') : order.status }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="details-btn" @click="openOrderDetails(order)" :title="t('common.details')">
                    {{ t('common.details') }}
                  </button>
                  <select 
                    class="status-select" 
                    :value="order.status" 
                    @change="updateStatus(order.id, $event.target.value)"
                    :aria-label="t('admin.status')"
                  >
                    <option value="pending">{{ t('admin.statusPending') }}</option>
                    <option value="shipped">{{ t('admin.statusShipped') }}</option>
                    <option value="completed">{{ t('admin.statusCompleted') }}</option>
                    <option value="cancelled">{{ t('admin.statusCancelledRestock') }}</option>
                  </select>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      <div class="pagination-controls" v-if="totalPages > 1 || hasMore || currentPage > 1">
        <button 
          class="pagination-btn" 
          :disabled="currentPage === 1 || loading" 
          @click="prevPage"
        >
          <i :class="isRtl ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left'"></i>
          {{ t('pagination.prev') }}
        </button>

        <span class="pagination-info">
          {{ t('pagination.pageOf', { current: currentPage, total: totalPages }) }}
          <span class="total-orders-badge" v-if="totalOrdersCount">({{ totalOrdersCount }} {{ t('admin.ordersCountSuffix') }})</span>
        </span>

        <button 
          class="pagination-btn" 
          :disabled="!hasMore || loading" 
          @click="nextPage"
        >
          {{ t('pagination.next') }}
          <i :class="isRtl ? 'fa-solid fa-chevron-left' : 'fa-solid fa-chevron-right'"></i>
        </button>
      </div>

      <!-- Order Details Modal -->
      <div v-if="isModalOpen" class="modal-overlay" @click.self="closeOrderDetails">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ t('admin.orderDetailsTitle', { id: selectedOrder.id.substring(0, 6).toUpperCase() }) }}</h2>
            <button class="close-btn" @click="closeOrderDetails" :aria-label="t('common.close')">&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="customer-info-box">
              <div class="modal-status-row">
                <h3>{{ t('admin.clientData') }}</h3>
                <div class="modal-status-controls">
                  <span class="status-badge" :class="selectedOrder.status">
                    {{ selectedOrder.status === 'pending' ? t('admin.statusPending') : selectedOrder.status === 'shipped' ? t('admin.statusShipped') : selectedOrder.status === 'completed' ? t('admin.statusCompleted') : selectedOrder.status === 'cancelled' ? t('admin.statusCancelled') : selectedOrder.status }}
                  </span>
                  <select 
                    class="status-select" 
                    :value="selectedOrder.status" 
                    @change="updateStatus(selectedOrder.id, $event.target.value)"
                    :aria-label="t('admin.status')"
                  >
                    <option value="pending">{{ t('admin.statusPending') }}</option>
                    <option value="shipped">{{ t('admin.statusShipped') }}</option>
                    <option value="completed">{{ t('admin.statusCompleted') }}</option>
                    <option value="cancelled">{{ t('admin.statusCancelledRestock') }}</option>
                  </select>
                </div>
              </div>
              <p><strong>{{ t('admin.nameLabel') }}</strong> {{ selectedOrder.customer?.name }}</p>
              <p><strong>{{ t('admin.phoneLabel') }}</strong> <a :href="`tel:${selectedOrder.customer?.phone}`">{{ selectedOrder.customer?.phone }}</a></p>
              <p><strong>{{ t('admin.addressLabel') }}</strong> {{ selectedOrder.customer?.address }}</p>
              <p v-if="selectedOrder.customer?.notes"><strong>{{ t('admin.customerNotes') }}</strong> {{ selectedOrder.customer?.notes }}</p>
              
              <!-- Payment & Promo Info -->
              <p v-if="selectedOrder.paymentMethod">
                <strong>{{ t('payment.methodTitle') }}:</strong>
                <span class="admin-payment-pill" :class="selectedOrder.paymentMethod === 'card' ? 'paid-pill' : 'cod-pill'">
                  <i :class="selectedOrder.paymentMethod === 'card' ? 'fa-solid fa-credit-card' : 'fa-solid fa-truck-ramp-box'"></i>
                  {{ selectedOrder.paymentMethod === 'card' ? t('payment.paidBadge') : t('payment.codBadge') }}
                </span>
              </p>
              <p v-if="selectedOrder.couponCode">
                <strong>{{ t('promo.promoCodeLabel') }}</strong>
                <span class="admin-coupon-pill">
                  <i class="fa-solid fa-tag"></i> {{ selectedOrder.couponCode }} (-${{ Number(selectedOrder.discount || 0).toFixed(2) }})
                </span>
              </p>
            </div>

            <h3 class="items-heading">{{ t('admin.productsOrdered') }}</h3>
            <div class="modal-items-list">
              <div v-for="item in selectedOrder.items" :key="item.cartItemId || item.id" class="modal-item-row">
                <img :src="item.image" :alt="item.title">
                <div class="modal-item-info">
                  <h4>{{ item.title }}</h4>

                  <!-- Variant pills -->
                  <div v-if="item.selectedSize || item.selectedColor || item.unitType === 'weight'" class="admin-variant-pills">
                    <span v-if="item.unitType === 'weight'" class="admin-var-pill weight">
                      <i class="fa-solid fa-weight-scale"></i> {{ item.quantity }} {{ t('variants.kg') }}
                    </span>
                    <span v-if="item.selectedSize" class="admin-var-pill">
                      <i class="fa-solid fa-ruler-horizontal"></i> {{ item.selectedSize }}
                    </span>
                    <span v-if="item.selectedColor" class="admin-var-pill">
                      <span class="color-dot-xs" :style="{ backgroundColor: item.selectedColor?.hex || item.selectedColor }"></span>
                      {{ item.selectedColor?.name || item.selectedColor }}
                    </span>
                  </div>

                  <p>
                    {{ t('admin.quantityLabel') }} 
                    {{ item.unitType === 'weight' ? `${item.quantity} ${t('variants.kg')}` : item.quantity }} 
                    × ${{ Number(item.price).toFixed(2) }}
                    <span v-if="item.unitType === 'weight'">/ {{ t('variants.kg') }}</span>
                  </p>
                </div>
                <div class="modal-item-total">
                  ${{ (item.subtotal ?? (item.price * item.quantity)).toFixed(2) }}
                </div>
              </div>
            </div>

            <div class="modal-footer-total">
              <span>{{ t('admin.grandTotal') }}</span>
              <span class="price-num">${{ Number(selectedOrder.totalPrice).toFixed(2) }}</span>
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
  padding: 32px 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 16px;
}

.header h1 {
  color: #1e293b;
  margin: 0;
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.stats {
  background: var(--primary-color, #2563eb);
  color: white;
  padding: 8px 18px;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
}

.loading, .empty-state {
  text-align: center;
  padding: 60px 20px;
  font-size: 1.1rem;
  color: #64748b;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
}

.empty-icon {
  font-size: 3rem;
  color: #94a3b8;
  margin-bottom: 12px;
  display: block;
}

.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.04);
  border: 1px solid rgba(0,0,0,0.05);
}

.orders-table {
  width: 100%;
  min-width: 800px;
  border-collapse: collapse;
  white-space: nowrap;
}

.orders-table th, .orders-table td {
  padding: 16px 20px;
  text-align: start;
  border-bottom: 1px solid #f1f5f9;
}

.orders-table th {
  background-color: #f8fafc;
  color: #475569;
  font-weight: 700;
  font-size: 0.875rem;
}

.orders-table tbody tr:hover {
  background-color: #f8fafc;
}

.order-id {
  font-family: monospace;
  font-weight: bold;
  color: #64748b;
}

.font-semibold {
  font-weight: 600;
  color: #1e293b;
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
  padding: 5px 12px;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 700;
  display: inline-block;
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
  padding: 8px 14px;
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.details-btn:hover {
  background-color: #e2e8f0;
  color: #1e293b;
}

.status-select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background-color: #f8fafc;
  font-family: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  min-height: 44px;
  color: #334155;
  font-weight: 600;
}

/* Modal Styling */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100dvh;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  background: white;
  width: 100%;
  max-width: 620px;
  max-height: 90dvh;
  border-radius: 20px;
  padding: 28px;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 16px;
  margin-bottom: 20px;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: #64748b;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: #f1f5f9;
  color: #0f172a;
}

.customer-info-box {
  background: #f8fafc;
  padding: 18px;
  border-radius: 14px;
  margin-bottom: 20px;
  font-size: 0.95rem;
  color: #334155;
  border: 1px solid #e2e8f0;
}

.modal-status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  flex-wrap: wrap;
  gap: 12px;
}

.modal-status-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.customer-info-box h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
}

.customer-info-box p {
  margin: 8px 0;
  line-height: 1.5;
}

.items-heading {
  margin: 20px 0 12px 0;
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
}

.modal-items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 10px;
  max-height: 240px;
  overflow-y: auto;
  padding-inline-end: 4px;
}

.modal-item-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.modal-item-row img {
  width: 52px;
  height: 52px;
  object-fit: contain;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 4px;
  flex-shrink: 0;
}

.modal-item-info {
  flex: 1;
  min-width: 0;
}

.modal-item-info h4 {
  margin: 0 0 4px 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.admin-payment-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  margin-inline-start: 6px;
}

.admin-payment-pill.paid-pill {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.admin-payment-pill.cod-pill {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.admin-coupon-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #059669;
  background: #f0fdf4;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px dashed #86efac;
  margin-inline-start: 6px;
}

.admin-variant-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 4px 0 2px;
}

.admin-var-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 700;
  background: #f1f5f9;
  color: #334155;
  padding: 1px 6px;
  border-radius: 4px;
}

.admin-var-pill.weight {
  background: #ecfdf5;
  color: #059669;
}

.color-dot-xs {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.modal-footer-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 2px dashed #e2e8f0;
  font-size: 1.1rem;
  font-weight: 800;
  color: #1e293b;
}

.price-num {
  color: #10b981;
  font-size: 1.35rem;
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
  gap: 16px;
  margin-top: 28px;
  padding: 10px 0;
  flex-wrap: wrap;
}

.pagination-btn {
  padding: 8px 20px;
  background-color: white;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  color: #334155;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
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