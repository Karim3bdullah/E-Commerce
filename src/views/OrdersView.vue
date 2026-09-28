<script setup>
import { ref, onMounted, computed } from 'vue'
import { db, auth } from '../firebase/config'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t, locale } = useI18n()
const isRtl = computed(() => locale.value === 'ar')

const orders = ref([])
const loading = ref(true)
const currentUser = ref(null)
const expandedOrderId = ref(null)

const toggleOrderDetails = (orderId) => {
  expandedOrderId.value = expandedOrderId.value === orderId ? null : orderId
}

const loadOrdersForUser = async (uid) => {
  try {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    )
    
    const res = await getDocs(q)
    orders.value = res.docs.map(item => ({
      id: item.id,
      ...item.data()
    }))
  } catch (err) {
    console.error("Error loading user orders:", err)
  }
}

const waitForAuthState = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

onMounted(async () => {
  loading.value = true
  try {
    const user = await waitForAuthState()
    if (!user) {
      router.push('/login')
      return
    }
    currentUser.value = user
    await loadOrdersForUser(user.uid)
  } catch (err) {
    console.error("Error checking auth state:", err)
    router.push('/login')
  } finally {
    loading.value = false
  }
})

const formatDate = (val) => {
  if (!val) return t('orders.statusProcessing')
  const dateObj = val.toDate ? val.toDate() : new Date(val)
  return dateObj.toLocaleDateString(locale.value === 'ar' ? 'ar-EG' : 'en-US')
}

const getStatusLabel = (status) => {
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

const selectedOrderForPrint = ref(null)

const getOrderStep = (status) => {
  switch (status) {
    case 'pending': return 1
    case 'processing': return 2
    case 'shipped': return 3
    case 'completed':
    case 'delivered': return 4
    case 'cancelled': return -1
    default: return 1
  }
}

const printInvoice = (order) => {
  selectedOrderForPrint.value = order
  setTimeout(() => {
    window.print()
  }, 150)
}
</script>

<template>
  <div class="orders-container">
    <div class="orders-header-title no-print">
      <h1><i class="fa-solid fa-clock-rotate-left"></i> {{ t('orders.myOrdersTitle') }}</h1>
      <span class="orders-count-badge" v-if="orders.length > 0">
        {{ t('orders.ordersCount', { count: orders.length }) }}
      </span>
    </div>

    <!-- Shimmer Skeleton Loaders -->
    <div v-if="loading" class="orders-skeleton-list no-print">
      <div v-for="i in 3" :key="i" class="order-skeleton-card">
        <div class="skeleton-header">
          <div class="skeleton-shimmer skeleton-id"></div>
          <div class="skeleton-shimmer skeleton-status"></div>
        </div>
        <div class="skeleton-shimmer skeleton-stepper"></div>
        <div class="skeleton-footer">
          <div class="skeleton-shimmer skeleton-line"></div>
          <div class="skeleton-shimmer skeleton-btn"></div>
        </div>
      </div>
    </div>

    <!-- Login Required -->
    <div v-else-if="!currentUser" class="empty-state no-print">
      <i class="fa-solid fa-user-lock empty-icon"></i>
      <p>{{ t('orders.loginRequired') }}</p>
      <router-link to="/login" class="action-btn-link">{{ t('orders.loginBtn') }}</router-link>
    </div>

    <!-- Empty State -->
    <div v-else-if="orders.length === 0" class="empty-state no-print">
      <i class="fa-solid fa-bag-shopping empty-icon"></i>
      <p>{{ t('orders.noOrders') }}</p>
      <router-link to="/" class="action-btn-link">{{ t('orders.browseStore') }}</router-link>
    </div>

    <!-- Orders List -->
    <div v-else class="orders-list no-print">
      <div v-for="order in orders" :key="order.id" class="order-card">
        <!-- Order Header -->
        <div class="order-header">
          <div class="order-header-main">
            <span class="order-id">{{ t('orders.orderNum', { id: order.id.substring(0, 6).toUpperCase() }) }}</span>
            <span class="order-date"><i class="fa-regular fa-calendar"></i> {{ formatDate(order.createdAt) }}</span>
          </div>
          <div class="order-status" :class="order.status">
            {{ getStatusLabel(order.status) }}
          </div>
        </div>

        <!-- Visual Order Tracking Stepper -->
        <div class="order-stepper-wrapper">
          <div v-if="order.status === 'cancelled'" class="cancelled-stepper-alert">
            <i class="fa-solid fa-ban"></i>
            <span>{{ t('orders.cancelledAlert') }}</span>
          </div>
          <div v-else class="order-stepper">
            <div class="step-item" :class="{ 'step-completed': getOrderStep(order.status) >= 1, 'step-active': getOrderStep(order.status) === 1 }">
              <div class="step-circle">
                <i class="fa-solid fa-receipt"></i>
              </div>
              <span class="step-title">{{ t('orders.stepReceived') }}</span>
            </div>
            
            <div class="step-line" :class="{ 'line-completed': getOrderStep(order.status) >= 2 }"></div>
            
            <div class="step-item" :class="{ 'step-completed': getOrderStep(order.status) >= 2, 'step-active': getOrderStep(order.status) === 2 }">
              <div class="step-circle">
                <i class="fa-solid fa-boxes-packing"></i>
              </div>
              <span class="step-title">{{ t('orders.stepProcessing') }}</span>
            </div>
            
            <div class="step-line" :class="{ 'line-completed': getOrderStep(order.status) >= 3 }"></div>
            
            <div class="step-item" :class="{ 'step-completed': getOrderStep(order.status) >= 3, 'step-active': getOrderStep(order.status) === 3 }">
              <div class="step-circle">
                <i class="fa-solid fa-truck-fast"></i>
              </div>
              <span class="step-title">{{ t('orders.stepShipped') }}</span>
            </div>
            
            <div class="step-line" :class="{ 'line-completed': getOrderStep(order.status) >= 4 }"></div>
            
            <div class="step-item" :class="{ 'step-completed': getOrderStep(order.status) >= 4, 'step-active': getOrderStep(order.status) === 4 }">
              <div class="step-circle">
                <i class="fa-solid fa-circle-check"></i>
              </div>
              <span class="step-title">{{ t('orders.stepDelivered') }}</span>
            </div>
          </div>
        </div>

        <!-- Order Body Summary -->
        <div class="order-body">
          <div class="items-summary">
            <p><strong>{{ t('orders.itemsCount') }}</strong> {{ t('orders.itemsCountNum', { count: order.totalItems }) }}</p>
            <p><strong>{{ t('orders.total') }}</strong> <span class="order-price">${{ Number(order.totalPrice).toFixed(2) }}</span></p>
            <span v-if="order.paymentMethod" class="payment-badge-inline" :class="order.paymentMethod === 'card' ? 'paid-badge' : 'cod-badge'">
              <i :class="order.paymentMethod === 'card' ? 'fa-solid fa-credit-card' : 'fa-solid fa-truck-ramp-box'"></i>
              {{ order.paymentMethod === 'card' ? t('payment.paidBadge') : t('payment.codBadge') }}
            </span>
            <span v-if="order.couponCode" class="coupon-badge-inline">
              <i class="fa-solid fa-tag"></i> {{ order.couponCode }} (-${{ Number(order.discount || 0).toFixed(2) }})
            </span>
          </div>
          
          <div class="order-actions-row">
            <button type="button" class="print-invoice-btn" @click="printInvoice(order)" :title="t('orders.printInvoice')">
              <i class="fa-solid fa-print"></i>
              <span>{{ t('orders.printInvoice') }}</span>
            </button>
            
            <button class="details-toggle-btn" @click="toggleOrderDetails(order.id)">
              <span>{{ expandedOrderId === order.id ? t('orders.hideDetails') : t('orders.showDetails') }}</span>
              <i class="fa-solid fa-chevron-down toggle-icon" :class="{ 'icon-rotated': expandedOrderId === order.id }"></i>
            </button>
          </div>
        </div>

        <!-- Expandable Details Section -->
        <Transition name="fade-expand">
          <div v-if="expandedOrderId === order.id" class="order-expanded-details">
            
            <!-- Shipping Details -->
            <div class="shipping-snapshot-card" v-if="order.customer">
              <h4><i class="fa-solid fa-truck-fast"></i> {{ t('orders.shippingDetailsTitle') }}</h4>
              <div class="shipping-grid">
                <p><strong>{{ t('orders.customerName') }}</strong> {{ order.customer.name }}</p>
                <p><strong>{{ t('orders.customerPhone') }}</strong> <a :href="`tel:${order.customer.phone}`">{{ order.customer.phone }}</a></p>
                <p class="full-address"><strong>{{ t('orders.customerAddress') }}</strong> {{ order.customer.address }}</p>
                <p v-if="order.customer.notes" class="notes-field"><strong>{{ t('orders.customerNotes') }}</strong> {{ order.customer.notes }}</p>
              </div>
            </div>

            <!-- Ordered Items List -->
            <div class="order-items-list" v-if="order.items && order.items.length > 0">
              <h4><i class="fa-solid fa-boxes-stacked"></i> {{ t('orders.orderedProducts', { count: order.items.length }) }}</h4>
              <div class="items-grid">
                <div v-for="item in order.items" :key="item.cartItemId || item.id" class="item-detail-card">
                  <div class="item-thumb-wrapper">
                    <img :src="item.image" :alt="item.title" class="item-thumb">
                  </div>
                  <div class="item-text-info">
                    <router-link :to="`/product/${item.id}`" class="item-title-link">{{ item.title }}</router-link>
                    
                    <!-- Variant Options Display -->
                    <div v-if="item.selectedSize || item.selectedColor || item.unitType === 'weight'" class="order-variant-pills">
                      <span v-if="item.unitType === 'weight'" class="order-var-pill weight">
                        <i class="fa-solid fa-weight-scale"></i> {{ item.quantity }} {{ t('variants.kg') }}
                      </span>
                      <span v-if="item.selectedSize" class="order-var-pill">
                        <i class="fa-solid fa-ruler-horizontal"></i> {{ item.selectedSize }}
                      </span>
                      <span v-if="item.selectedColor" class="order-var-pill">
                        <span class="color-dot-xs" :style="{ backgroundColor: item.selectedColor?.hex || item.selectedColor }"></span>
                        {{ item.selectedColor?.name || item.selectedColor }}
                      </span>
                    </div>

                    <div class="item-meta">
                      <span class="unit-price">
                        {{ t('orders.priceLabel') }} ${{ item.price }}
                        <span v-if="item.unitType === 'weight'">/ {{ t('variants.kg') }}</span>
                      </span>
                      <span class="item-qty">
                        {{ t('orders.qtyLabel') }} {{ item.unitType === 'weight' ? `${item.quantity} ${t('variants.kg')}` : item.quantity }}
                      </span>
                    </div>
                  </div>
                  <div class="item-subtotal">
                    ${{ (item.subtotal ?? (item.price * item.quantity)).toFixed(2) }}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </Transition>
      </div>
    </div>

    <!-- Print-Ready Invoice Structure (Shown during window.print()) -->
    <div v-if="selectedOrderForPrint" id="printable-invoice" class="print-only" :class="isRtl ? 'rtl-invoice' : 'ltr-invoice'">
      <div class="invoice-container">
        <!-- Invoice Header -->
        <div class="invoice-header">
          <div class="invoice-brand">
            <h2>{{ t('orders.invoiceBrandTitle') }}</h2>
            <p>{{ t('orders.invoiceType') }}</p>
          </div>
          <div class="invoice-meta">
            <p><strong>{{ t('orders.orderNum', { id: selectedOrderForPrint.id.toUpperCase() }) }}</strong></p>
            <p>{{ t('orders.invoiceDate') }} {{ formatDate(selectedOrderForPrint.createdAt) }}</p>
            <p>{{ t('common.status') }}: {{ getStatusLabel(selectedOrderForPrint.status) }}</p>
          </div>
        </div>

        <!-- Customer Snapshot -->
        <div class="invoice-section" v-if="selectedOrderForPrint.customer">
          <h4>{{ t('orders.invoiceCustomer') }}</h4>
          <p><strong>{{ t('orders.customerName') }}</strong> {{ selectedOrderForPrint.customer.name }}</p>
          <p><strong>{{ t('orders.customerPhone') }}</strong> {{ selectedOrderForPrint.customer.phone }}</p>
          <p><strong>{{ t('orders.customerAddress') }}</strong> {{ selectedOrderForPrint.customer.address }}</p>
        </div>

        <!-- Invoice Table -->
        <table class="invoice-table">
          <thead>
            <tr>
              <th>{{ t('orders.invoiceItemName') }}</th>
              <th>{{ t('orders.invoiceItemPrice') }}</th>
              <th>{{ t('orders.invoiceItemQty') }}</th>
              <th>{{ t('orders.invoiceItemSubtotal') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in selectedOrderForPrint.items" :key="item.id">
              <td>{{ item.title }}</td>
              <td>${{ Number(item.price).toFixed(2) }}</td>
              <td>{{ item.quantity }}</td>
              <td>${{ (item.subtotal ?? (item.price * item.quantity)).toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Invoice Totals -->
        <div class="invoice-total-box">
          <div class="total-row">
            <span>{{ t('orders.invoiceSubtotal') }}</span>
            <span>${{ selectedOrderForPrint.totalPrice.toFixed(2) }}</span>
          </div>
          <div class="total-row">
            <span>{{ t('orders.invoiceShipping') }}</span>
            <span>{{ t('checkout.free') }}</span>
          </div>
          <div class="total-row grand">
            <span>{{ t('orders.invoiceTotal') }}</span>
            <span>${{ selectedOrderForPrint.totalPrice.toFixed(2) }}</span>
          </div>
        </div>

        <div class="invoice-footer">
          <p>{{ t('orders.invoiceFooter') }}</p>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.orders-container {
  max-width: 1100px;
  margin: 36px auto;
  padding: 0 24px;
  width: 100%;
}

.orders-header-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 16px;
}

.orders-header-title h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 12px;
}

.orders-header-title h1 i {
  color: #059669;
}

.orders-count-badge {
  background: #ecfdf5;
  color: #059669;
  padding: 6px 14px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.88rem;
}

/* Skeletons */
.orders-skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-skeleton-card {
  background: white;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
}

.skeleton-id { width: 140px; height: 24px; border-radius: 6px; }
.skeleton-status { width: 80px; height: 24px; border-radius: 6px; }
.skeleton-stepper { width: 100%; height: 50px; border-radius: 8px; }
.skeleton-footer { display: flex; justify-content: space-between; }
.skeleton-line { width: 180px; height: 20px; border-radius: 6px; }
.skeleton-btn { width: 120px; height: 38px; border-radius: 8px; }

/* Empty State */
.empty-state {
  text-align: center;
  padding: 70px 24px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
  border: 1px solid #e2e8f0;
}

.empty-icon {
  font-size: 3.5rem;
  color: #cbd5e1;
  margin-bottom: 16px;
  display: block;
}

.empty-state p {
  color: #64748b;
  font-size: 1.05rem;
  margin-bottom: 24px;
  font-weight: 600;
}

.action-btn-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 28px;
  min-height: 44px;
  background-color: #059669;
  color: white;
  border-radius: 12px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);
}

.action-btn-link:hover {
  background-color: #047857;
  transform: translateY(-2px);
}

/* Orders List */
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.order-card {
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid rgba(226, 232, 240, 0.85);
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.03);
  overflow: hidden;
  transition: all 0.2s ease;
}

.order-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 8px 25px -4px rgba(0, 0, 0, 0.06);
}

.order-header {
  padding: 18px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.order-header-main {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.order-id {
  font-weight: 800;
  color: #0f172a;
  font-size: 1.05rem;
}

.order-date {
  color: #64748b;
  font-size: 0.88rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.order-status {
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 800;
}

.order-status.pending { background: #fef3c7; color: #d97706; }
.order-status.processing { background: #eff6ff; color: #2563eb; }
.order-status.shipped { background: #e0f2fe; color: #0284c7; }
.order-status.delivered, .order-status.completed { background: #dcfce7; color: #16a34a; }
.order-status.cancelled { background: #fee2e2; color: #dc2626; }

/* Stepper */
.order-stepper-wrapper {
  padding: 24px;
  border-bottom: 1px solid #f1f5f9;
}

.order-stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  width: 100%;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
  z-index: 2;
  flex: 0 0 auto;
}

.step-circle {
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: 50%;
  background: #f8fafc;
  border: 2px solid #cbd5e1;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.step-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: #64748b;
  text-align: center;
}

.step-line {
  height: 3px;
  background: #e2e8f0;
  flex: 1;
  margin: 0 -8px 24px;
  position: relative;
  z-index: 1;
  transition: background 0.3s ease;
}

.step-completed .step-circle {
  background: #059669;
  border-color: #059669;
  color: #ffffff;
  box-shadow: 0 4px 10px rgba(5, 150, 105, 0.25);
}

.step-completed .step-title {
  color: #059669;
}

.step-active .step-circle {
  border-color: #059669;
  color: #059669;
  background: #ecfdf5;
  transform: scale(1.08);
}

.line-completed {
  background: #059669;
}

.cancelled-stepper-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #dc2626;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 10px 16px;
  background: #fee2e2;
  border-radius: 12px;
}

/* Order Body */
.order-body {
  padding: 18px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.items-summary {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 0.95rem;
  color: #475569;
}

.items-summary p {
  margin: 0;
}

.order-price {
  font-weight: 800;
  color: #059669;
  font-size: 1.25rem;
}

.payment-badge-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
}

.paid-badge {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.cod-badge {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.coupon-badge-inline {
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
}

.order-actions-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.print-invoice-btn, .details-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  min-height: 44px;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
  cursor: pointer;
  transition: all 0.2s ease;
}

.print-invoice-btn:hover, .details-toggle-btn:hover {
  background-color: #f1f5f9;
  border-color: #94a3b8;
}

.toggle-icon {
  transition: transform 0.2s ease;
}

.icon-rotated {
  transform: rotate(180deg);
}

/* Expanded Details */
.order-expanded-details {
  padding: 24px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.shipping-snapshot-card, .order-items-list {
  background: white;
  padding: 20px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
}

.shipping-snapshot-card h4, .order-items-list h4 {
  margin: 0 0 14px 0;
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.shipping-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
  font-size: 0.9rem;
  color: #475569;
}

.shipping-grid p {
  margin: 0;
}

.shipping-grid a {
  color: #059669;
  text-decoration: none;
  font-weight: 600;
}

.items-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-detail-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #f1f5f9;
}

.item-thumb-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: white;
  padding: 2px;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-thumb {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.item-text-info {
  flex: 1;
  min-width: 0;
}

.item-title-link {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-title-link:hover {
  color: #059669;
}

.item-meta {
  display: flex;
  gap: 12px;
  font-size: 0.78rem;
  color: #64748b;
  margin-top: 3px;
}

.order-variant-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 4px 0 2px;
}

.order-var-pill {
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

.order-var-pill.weight {
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

.item-subtotal {
  font-weight: 800;
  color: #059669;
  font-size: 0.95rem;
}

/* Transitions */
.fade-expand-enter-active, .fade-expand-leave-active {
  transition: all 0.25s ease;
}

.fade-expand-enter-from, .fade-expand-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Print Invoice Styles */
.print-only {
  display: none;
}

@media print {
  body * {
    visibility: hidden;
  }

  .no-print, .navbar, footer, .mini-cart-overlay {
    display: none !important;
  }

  #printable-invoice, #printable-invoice * {
    visibility: visible;
  }

  #printable-invoice {
    display: block !important;
    position: absolute;
    inset: 0;
    width: 100%;
    margin: 0;
    padding: 30px;
    background: #ffffff;
    color: #000000;
  }

  .rtl-invoice {
    direction: rtl;
    text-align: right;
  }

  .ltr-invoice {
    direction: ltr;
    text-align: left;
  }

  .invoice-container {
    max-width: 800px;
    margin: 0 auto;
  }

  .invoice-header {
    display: flex;
    justify-content: space-between;
    border-bottom: 2px solid #000;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }

  .invoice-table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
  }

  .invoice-table th, .invoice-table td {
    border: 1px solid #ddd;
    padding: 8px 12px;
  }

  .invoice-total-box {
    width: 260px;
    margin-inline-start: auto;
    border: 1px solid #ddd;
    padding: 12px;
    margin-bottom: 20px;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    margin: 4px 0;
  }

  .total-row.grand {
    font-weight: bold;
    border-top: 1px solid #000;
    padding-top: 6px;
  }
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .orders-container {
    padding: 0 16px;
  }

  .order-header {
    padding: 14px 16px;
  }

  .order-stepper-wrapper {
    padding: 18px 12px;
  }

  .step-circle {
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
    font-size: 0.85rem;
  }

  .step-title {
    font-size: 0.7rem;
    max-width: 60px;
  }

  .step-line {
    margin: 0 -4px 18px;
  }

  .order-body {
    padding: 14px 16px;
    flex-direction: column;
    align-items: flex-start;
  }

  .order-actions-row {
    width: 100%;
    justify-content: space-between;
  }

  .print-invoice-btn, .details-toggle-btn {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .order-actions-row {
    flex-direction: column;
  }

  .print-invoice-btn, .details-toggle-btn {
    width: 100%;
  }

  .step-title {
    display: none;
  }

  .step-line {
    margin-bottom: 0;
  }
}
</style>