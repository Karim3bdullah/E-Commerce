<script setup>
import { ref, onMounted } from 'vue'
import { db, auth } from '../firebase/config'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
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
    console.error("خطأ في جلب طلبات العميل:", err)
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
    console.error("خطأ أثناء التحقق من حالة المستخدم:", err)
    router.push('/login')
  } finally {
    loading.value = false
  }
})

const formatDate = (val) => {
  if (!val) return 'قيد التجهيز'
  return val.toDate ? val.toDate().toLocaleDateString('ar-EG') : new Date(val).toLocaleDateString('ar-EG')
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
      <h1><i class="fa-solid fa-clock-rotate-left"></i> طلباتي السابقة</h1>
      <span class="orders-count-badge" v-if="orders.length > 0">{{ orders.length }} طلب</span>
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

    <div v-else-if="!currentUser" class="empty-state no-print">
      <i class="fa-solid fa-user-lock empty-icon"></i>
      <p>يجب تسجيل الدخول لعرض طلباتك.</p>
      <router-link to="/login" class="action-btn-link">تسجيل الدخول</router-link>
    </div>

    <div v-else-if="orders.length === 0" class="empty-state no-print">
      <i class="fa-solid fa-bag-shopping empty-icon"></i>
      <p>ليس لديك أي طلبات سابقة حتى الآن.</p>
      <router-link to="/" class="action-btn-link">تصفح المتجر الآن</router-link>
    </div>

    <div v-else class="orders-list no-print">
      <div v-for="order in orders" :key="order.id" class="order-card">
        <!-- Order Header -->
        <div class="order-header">
          <div class="order-header-main">
            <span class="order-id">طلب #{{ order.id.substring(0, 6).toUpperCase() }}</span>
            <span class="order-date"><i class="fa-regular fa-calendar"></i> {{ formatDate(order.createdAt) }}</span>
          </div>
          <div class="order-status" :class="order.status">
            {{ order.status === 'pending' ? 'قيد الانتظار' : order.status === 'processing' ? 'قيد التجهيز' : order.status === 'shipped' ? 'تم الشحن' : order.status === 'completed' || order.status === 'delivered' ? 'تم التوصيل' : order.status === 'cancelled' ? 'ملغي' : order.status }}
          </div>
        </div>

        <!-- Visual Order Tracking Stepper -->
        <div class="order-stepper-wrapper">
          <div v-if="order.status === 'cancelled'" class="cancelled-stepper-alert">
            <i class="fa-solid fa-ban"></i>
            <span>تم إلغاء هذا الطلب وإعادة المنتجات للمخزون.</span>
          </div>
          <div v-else class="order-stepper">
            <div class="step-item" :class="{ 'step-completed': getOrderStep(order.status) >= 1, 'step-active': getOrderStep(order.status) === 1 }">
              <div class="step-circle">
                <i class="fa-solid fa-receipt"></i>
              </div>
              <span class="step-title">تم استلام الطلب</span>
            </div>
            
            <div class="step-line" :class="{ 'line-completed': getOrderStep(order.status) >= 2 }"></div>
            
            <div class="step-item" :class="{ 'step-completed': getOrderStep(order.status) >= 2, 'step-active': getOrderStep(order.status) === 2 }">
              <div class="step-circle">
                <i class="fa-solid fa-boxes-packing"></i>
              </div>
              <span class="step-title">قيد التجهيز</span>
            </div>
            
            <div class="step-line" :class="{ 'line-completed': getOrderStep(order.status) >= 3 }"></div>
            
            <div class="step-item" :class="{ 'step-completed': getOrderStep(order.status) >= 3, 'step-active': getOrderStep(order.status) === 3 }">
              <div class="step-circle">
                <i class="fa-solid fa-truck-fast"></i>
              </div>
              <span class="step-title">تم الشحن</span>
            </div>
            
            <div class="step-line" :class="{ 'line-completed': getOrderStep(order.status) >= 4 }"></div>
            
            <div class="step-item" :class="{ 'step-completed': getOrderStep(order.status) >= 4, 'step-active': getOrderStep(order.status) === 4 }">
              <div class="step-circle">
                <i class="fa-solid fa-circle-check"></i>
              </div>
              <span class="step-title">تم التوصيل</span>
            </div>
          </div>
        </div>

        <div class="order-body">
          <div class="items-summary">
            <p><strong>عدد القطع:</strong> {{ order.totalItems }} قطعة</p>
            <p><strong>الإجمالي:</strong> <span class="order-price">${{ order.totalPrice.toFixed(2) }}</span></p>
          </div>
          
          <div class="order-actions-row">
            <button type="button" class="print-invoice-btn" @click="printInvoice(order)" title="طباعة الفاتورة">
              <i class="fa-solid fa-print"></i>
              <span>طباعة الفاتورة</span>
            </button>
            
            <button class="details-toggle-btn" @click="toggleOrderDetails(order.id)">
              <span>{{ expandedOrderId === order.id ? 'إخفاء التفاصيل' : 'تفاصيل المنتجات والشحن' }}</span>
              <i class="fa-solid fa-chevron-down toggle-icon" :class="{ 'icon-rotated': expandedOrderId === order.id }"></i>
            </button>
          </div>
        </div>

        <!-- تفاصيل المنتجات وبيانات التوصيل القابلة للتوسيع -->
        <Transition name="fade-expand">
          <div v-if="expandedOrderId === order.id" class="order-expanded-details">
            
            <!-- عنوان وبيانات الشحن -->
            <div class="shipping-snapshot-card" v-if="order.customer">
              <h4><i class="fa-solid fa-truck-fast"></i> بيانات الشحن والتوصيل</h4>
              <div class="shipping-grid">
                <p><strong>الاسم:</strong> {{ order.customer.name }}</p>
                <p><strong>الهاتف:</strong> <a :href="`tel:${order.customer.phone}`">{{ order.customer.phone }}</a></p>
                <p class="full-address"><strong>العنوان:</strong> {{ order.customer.address }}</p>
                <p v-if="order.customer.notes" class="notes-field"><strong>ملاحظات:</strong> {{ order.customer.notes }}</p>
              </div>
            </div>

            <!-- قائمة المنتجات -->
            <div class="order-items-list" v-if="order.items && order.items.length > 0">
              <h4><i class="fa-solid fa-boxes-stacked"></i> المنتجات المطلوبة ({{ order.items.length }})</h4>
              <div class="items-grid">
                <div v-for="item in order.items" :key="item.id" class="item-detail-card">
                  <div class="item-thumb-wrapper">
                    <img :src="item.image" :alt="item.title" class="item-thumb">
                  </div>
                  <div class="item-text-info">
                    <router-link :to="`/product/${item.id}`" class="item-title-link">{{ item.title }}</router-link>
                    <div class="item-meta">
                      <span class="unit-price">السعر: ${{ item.price }}</span>
                      <span class="item-qty">الكمية: × {{ item.quantity }}</span>
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
    <div v-if="selectedOrderForPrint" id="printable-invoice" class="print-only">
      <div class="invoice-container">
        <!-- Invoice Header -->
        <div class="invoice-header">
          <div class="invoice-brand">
            <h2>متجري | E-Commerce Store</h2>
            <p>فاتورة شراء ضريبية رسمية</p>
          </div>
          <div class="invoice-meta">
            <p><strong>رقم الفاتورة:</strong> #INV-{{ selectedOrderForPrint.id.substring(0, 8).toUpperCase() }}</p>
            <p><strong>التاريخ:</strong> {{ formatDate(selectedOrderForPrint.createdAt) }}</p>
            <p><strong>حالة الدفع:</strong> مدفوع بنجاح (SSL Secured)</p>
          </div>
        </div>

        <!-- Customer Snapshot -->
        <div class="invoice-section customer-details" v-if="selectedOrderForPrint.customer">
          <h4>بيانات العميل والتوصيل</h4>
          <p><strong>الاسم:</strong> {{ selectedOrderForPrint.customer.name }}</p>
          <p><strong>الهاتف:</strong> {{ selectedOrderForPrint.customer.phone }}</p>
          <p><strong>العنوان:</strong> {{ selectedOrderForPrint.customer.address }}</p>
        </div>

        <!-- Items Table -->
        <table class="invoice-table">
          <thead>
            <tr>
              <th>#</th>
              <th>المنتج</th>
              <th>سعر الوحدة</th>
              <th>الكمية</th>
              <th>المجموع</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in selectedOrderForPrint.items" :key="idx">
              <td>{{ idx + 1 }}</td>
              <td>{{ item.title }}</td>
              <td>${{ Number(item.price).toFixed(2) }}</td>
              <td>{{ item.quantity }}</td>
              <td>${{ (item.price * item.quantity).toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Invoice Total -->
        <div class="invoice-total-box">
          <div class="total-row">
            <span>المجموع الفرعي:</span>
            <span>${{ selectedOrderForPrint.totalPrice.toFixed(2) }}</span>
          </div>
          <div class="total-row">
            <span>الشحن:</span>
            <span>مجاني</span>
          </div>
          <div class="total-row grand">
            <span>الإجمالي المستحق:</span>
            <span>${{ selectedOrderForPrint.totalPrice.toFixed(2) }}</span>
          </div>
        </div>

        <div class="invoice-footer">
          <p>شكراً لتسوقكم معنا! لأي استفسارات أو طلبات إرجاع، يرجى التواصل مع الدعم الفني.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orders-container {
  max-width: 950px;
  margin: 0 auto;
  padding: 40px 20px;
  direction: rtl;
}

.orders-header-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
}

.orders-header-title h1 {
  font-size: 1.8rem;
  color: #1e293b;
  margin: 0;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 12px;
}

.orders-header-title h1 i {
  color: #2563eb;
}

.orders-count-badge {
  background: #e0f2fe;
  color: #0284c7;
  padding: 6px 14px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.9rem;
}

.loading, .empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 16px;
  color: #64748b;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.empty-icon {
  font-size: 3.5rem;
  color: #cbd5e1;
}

.action-btn-link {
  display: inline-block;
  padding: 10px 24px;
  background: #2563eb;
  color: white;
  border-radius: 8px;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.2s;
}

.action-btn-link:hover {
  background: #1d4ed8;
}

.loader-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f1f5f9;
  border-top: 3px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-card {
  background: white;
  border-radius: 16px;
  padding: 22px 26px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 15px rgba(0,0,0,0.02);
  transition: box-shadow 0.2s;
}

.order-card:hover {
  box-shadow: 0 6px 20px rgba(0,0,0,0.05);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 14px;
  margin-bottom: 16px;
}

.order-header-main {
  display: flex;
  align-items: center;
  gap: 15px;
}

.order-id {
  font-family: monospace;
  font-weight: 800;
  color: #2563eb;
  font-size: 1.05rem;
}

.order-date {
  color: #64748b;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.order-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.items-summary {
  display: flex;
  align-items: center;
  gap: 20px;
}

.items-summary p {
  margin: 0;
  color: #334155;
  font-size: 0.95rem;
}

.order-price {
  font-weight: 800;
  color: #10b981;
  font-size: 1.15rem;
}

.order-status {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
}

.order-status.pending { background-color: #fef3c7; color: #d97706; }
.order-status.shipped { background-color: #e0f2fe; color: #0284c7; }
.order-status.completed { background-color: #dcfce7; color: #16a34a; }
.order-status.cancelled { background-color: #fee2e2; color: #dc2626; }

.details-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s;
}

.details-toggle-btn:hover {
  background-color: #e2e8f0;
  color: #1e293b;
}

.toggle-icon {
  font-size: 0.8rem;
  transition: transform 0.3s ease;
}

.icon-rotated {
  transform: rotate(180deg);
}

/* التوسيع */
.order-expanded-details {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.shipping-snapshot-card {
  background: #f8fafc;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
}

.shipping-snapshot-card h4, .order-items-list h4 {
  margin: 0 0 12px 0;
  font-size: 0.95rem;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
}

.shipping-snapshot-card h4 i, .order-items-list h4 i {
  color: #2563eb;
}

.shipping-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  font-size: 0.9rem;
  color: #475569;
}

.shipping-grid p {
  margin: 0;
}

.shipping-grid a {
  color: #2563eb;
  text-decoration: none;
}

.shipping-grid a:hover {
  text-decoration: underline;
}

.full-address {
  grid-column: 1 / -1;
}

.notes-field {
  grid-column: 1 / -1;
  color: #64748b;
  font-style: italic;
}

.items-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-detail-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 15px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
}

.item-thumb-wrapper {
  width: 50px;
  height: 50px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-thumb {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.item-text-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-title-link {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s;
}

.item-title-link:hover {
  color: #2563eb;
}

.item-meta {
  display: flex;
  gap: 15px;
  font-size: 0.85rem;
  color: #64748b;
}

.item-subtotal {
  font-weight: 800;
  color: #10b981;
  font-size: 1rem;
}

.fade-expand-enter-active, .fade-expand-leave-active {
  transition: all 0.3s ease;
}

.fade-expand-enter-from, .fade-expand-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Skeletons */
.orders-skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-skeleton-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skeleton-id {
  width: 140px;
  height: 20px;
  border-radius: 6px;
}

.skeleton-status {
  width: 90px;
  height: 28px;
  border-radius: 999px;
}

.skeleton-stepper {
  width: 100%;
  height: 48px;
  border-radius: 12px;
}

.skeleton-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
}

.skeleton-line {
  width: 180px;
  height: 22px;
  border-radius: 6px;
}

.skeleton-btn {
  width: 120px;
  height: 36px;
  border-radius: 8px;
}

/* Order Stepper */
.order-stepper-wrapper {
  margin: 18px 0 16px;
  padding: 16px 20px;
  background: #f8fafc;
  border-radius: 14px;
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.order-stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  position: relative;
  z-index: 2;
  flex: 1;
}

.step-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid #cbd5e1;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.step-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: #64748b;
  text-align: center;
  white-space: nowrap;
}

.step-line {
  height: 3px;
  background: #e2e8f0;
  flex: 1;
  margin: 0 -8px 20px;
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
  padding: 8px 12px;
  background: #fee2e2;
  border-radius: 10px;
}

/* Actions Row & Print Invoice Button */
.order-actions-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.print-invoice-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
  cursor: pointer;
  transition: all 0.2s;
}

.print-invoice-btn:hover {
  background-color: #f1f5f9;
  border-color: #94a3b8;
  transform: translateY(-1px);
}

/* Print Invoice & Media Print */
.print-only {
  display: none;
}

@media print {
  body * {
    visibility: hidden;
  }

  .no-print,
  .navbar,
  footer,
  .orders-header-title,
  .orders-list,
  .mini-cart-overlay {
    display: none !important;
  }

  #printable-invoice,
  #printable-invoice * {
    visibility: visible;
  }

  #printable-invoice {
    display: block !important;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 24px 32px;
    background: #ffffff;
    color: #000000;
    direction: rtl;
    font-family: 'Cairo', sans-serif;
  }

  .invoice-container {
    max-width: 800px;
    margin: 0 auto;
  }

  .invoice-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #000;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }

  .invoice-brand h2 {
    margin: 0 0 6px 0;
    font-size: 1.6rem;
  }

  .invoice-brand p {
    margin: 0;
    color: #555;
    font-size: 0.95rem;
  }

  .invoice-meta p {
    margin: 2px 0;
    font-size: 0.9rem;
  }

  .invoice-section {
    margin-bottom: 24px;
    padding: 12px;
    background: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 6px;
  }

  .invoice-section h4 {
    margin: 0 0 8px 0;
    font-size: 1rem;
    border-bottom: 1px solid #ccc;
    padding-bottom: 4px;
  }

  .invoice-section p {
    margin: 4px 0;
    font-size: 0.9rem;
  }

  .invoice-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
  }

  .invoice-table th,
  .invoice-table td {
    border: 1px solid #ddd;
    padding: 10px 12px;
    text-align: right;
    font-size: 0.9rem;
  }

  .invoice-table th {
    background-color: #f2f2f2;
    font-weight: bold;
  }

  .invoice-total-box {
    width: 280px;
    margin-right: auto;
    border: 1px solid #ddd;
    padding: 12px 16px;
    border-radius: 6px;
    background: #fafafa;
    margin-bottom: 30px;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    margin: 6px 0;
    font-size: 0.92rem;
  }

  .total-row.grand {
    font-weight: bold;
    font-size: 1.1rem;
    border-top: 1px solid #000;
    padding-top: 6px;
  }

  .invoice-footer {
    text-align: center;
    border-top: 1px dashed #ccc;
    padding-top: 16px;
    color: #666;
    font-size: 0.85rem;
  }
}
</style>