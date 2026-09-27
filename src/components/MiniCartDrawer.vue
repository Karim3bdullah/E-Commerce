<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cartStore'
import { useI18n } from 'vue-i18n'

const cartStore = useCartStore()
const router = useRouter()
const { locale } = useI18n()

const isRtl = computed(() => locale.value === 'ar')

const handleClose = () => {
  cartStore.closeMiniCart()
}

const goToCart = () => {
  cartStore.closeMiniCart()
  router.push('/cart')
}

const goToCheckout = () => {
  cartStore.closeMiniCart()
  router.push('/checkout')
}

const continueShopping = () => {
  cartStore.closeMiniCart()
  router.push('/')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div 
        v-if="cartStore.isMiniCartOpen" 
        class="mini-cart-overlay" 
        @click="handleClose"
      >
        <div 
          class="mini-cart-panel" 
          :class="{ 'rtl-mode': isRtl }"
          @click.stop
        >
          <!-- Drawer Header -->
          <div class="panel-header">
            <div class="header-title-box">
              <div class="cart-icon-bubble">
                <i class="fa-solid fa-bag-shopping"></i>
              </div>
              <div class="title-meta">
                <h3>سلة المشتريات</h3>
                <span class="items-count-tag">{{ cartStore.totalItemsCount }} منتجات</span>
              </div>
            </div>
            <button 
              type="button" 
              class="close-btn" 
              aria-label="Close cart" 
              @click="handleClose"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Free Shipping Progress Bar -->
          <div class="shipping-progress-banner">
            <div class="shipping-text">
              <template v-if="cartStore.hasFreeShipping">
                <span class="free-unlocked">
                  <i class="fa-solid fa-circle-check"></i>
                  تهانينا! مؤهل للشحن المجاني السريع 🚀
                </span>
              </template>
              <template v-else>
                <span>
                  أضف <strong>${{ cartStore.freeShippingRemaining.toFixed(2) }}</strong> أخرى للحصول على <strong>شحن مجاني</strong>!
                </span>
              </template>
            </div>
            <div class="progress-track">
              <div 
                class="progress-fill" 
                :class="{ 'completed': cartStore.hasFreeShipping }"
                :style="{ width: `${cartStore.freeShippingProgress}%` }"
              ></div>
            </div>
          </div>

          <!-- Drawer Body (Items List or Empty State) -->
          <div class="panel-body">
            <template v-if="cartStore.cart.length > 0">
              <div class="items-list">
                <div 
                  v-for="item in cartStore.cart" 
                  :key="item.id" 
                  class="cart-item-card"
                >
                  <div class="item-img-wrapper">
                    <img :src="item.image" :alt="item.title" loading="lazy" />
                  </div>
                  <div class="item-info">
                    <div class="item-title-row">
                      <h4 class="item-title" :title="item.title">{{ item.title }}</h4>
                      <button 
                        type="button" 
                        class="delete-item-btn" 
                        title="إزالة من السلة"
                        @click="cartStore.removeFromCart(item.id)"
                      >
                        <i class="fa-regular fa-trash-can"></i>
                      </button>
                    </div>
                    <div class="item-price-row">
                      <span class="unit-price">${{ Number(item.price).toFixed(2) }}</span>
                      <span class="line-total">${{ (item.price * item.quantity).toFixed(2) }}</span>
                    </div>
                    <div class="item-controls">
                      <div class="qty-stepper">
                        <button 
                          type="button" 
                          class="stepper-btn" 
                          @click="cartStore.decreaseQuantity(item.id)"
                        >
                          <i class="fa-solid fa-minus"></i>
                        </button>
                        <span class="qty-value">{{ item.quantity }}</span>
                        <button 
                          type="button" 
                          class="stepper-btn" 
                          :disabled="item.quantity >= item.stock"
                          @click="cartStore.increaseQuantity(item.id)"
                        >
                          <i class="fa-solid fa-plus"></i>
                        </button>
                      </div>
                      <span v-if="item.stock <= 5" class="stock-badge-low">
                        متبقي {{ item.stock }} فقط!
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- Empty State -->
            <div v-else class="empty-state">
              <div class="empty-icon-wrap">
                <i class="fa-solid fa-basket-shopping"></i>
              </div>
              <h4>السلة فارغة حالياً</h4>
              <p>استكشف أحدث المنتجات والعروض الحصرية وأضف ما يعجبك!</p>
              <button type="button" class="explore-btn" @click="continueShopping">
                <i class="fa-solid fa-bag-shopping"></i>
                تصفح المنتجات الآن
              </button>
            </div>
          </div>

          <!-- Drawer Footer -->
          <div v-if="cartStore.cart.length > 0" class="panel-footer">
            <div class="summary-breakdown">
              <div class="summary-line">
                <span class="label">المجموع الفرعي:</span>
                <span class="value">${{ cartStore.totalPrice.toFixed(2) }}</span>
              </div>
              <div class="summary-line highlight">
                <span class="label">الشحن:</span>
                <span class="value">
                  {{ cartStore.hasFreeShipping ? 'مجاني' : '$15.00' }}
                </span>
              </div>
              <div class="summary-line grand-total">
                <span class="label">الإجمالي النهائي:</span>
                <span class="value">
                  ${{ (cartStore.totalPrice + (cartStore.hasFreeShipping ? 0 : 15)).toFixed(2) }}
                </span>
              </div>
            </div>

            <div class="footer-actions">
              <button type="button" class="checkout-btn" @click="goToCheckout">
                <span>الدفع الفوري</span>
                <i class="fa-solid fa-arrow-left"></i>
              </button>
              <button type="button" class="view-cart-btn" @click="goToCart">
                عرض تفاصيل السلة
              </button>
            </div>
            
            <div class="trust-badge">
              <i class="fa-solid fa-shield-halved"></i>
              <span>دفع آمن ومحمي 100% بتشفير SSL</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.mini-cart-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  justify-content: flex-end;
}

.mini-cart-panel {
  width: 100%;
  max-width: 440px;
  height: 100%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  box-shadow: -10px 0 35px rgba(0, 0, 0, 0.15);
  position: relative;
  font-family: inherit;
}

.mini-cart-panel.rtl-mode {
  direction: rtl;
  text-align: right;
}

/* Header */
.panel-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
}

.header-title-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cart-icon-bubble {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #ecfdf5;
  color: #059669;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.title-meta h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
}

.items-count-tag {
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 600;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
  transform: rotate(90deg);
}

/* Shipping Progress Banner */
.shipping-progress-banner {
  padding: 14px 24px;
  background: #f8fafc;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
}

.shipping-text {
  font-size: 0.82rem;
  color: #334155;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.free-unlocked {
  color: #059669;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}

.progress-track {
  height: 6px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 999px;
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.progress-fill.completed {
  background: #059669;
}

/* Body / List */
.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cart-item-card {
  display: flex;
  gap: 14px;
  padding: 12px;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 14px;
  transition: all 0.2s ease;
}

.cart-item-card:hover {
  box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.05);
  border-color: #cbd5e1;
}

.item-img-wrapper {
  width: 72px;
  height: 72px;
  border-radius: 10px;
  background: #f8fafc;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-img-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 4px;
}

.item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.item-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.item-title {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.delete-item-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s ease;
  font-size: 0.85rem;
}

.delete-item-btn:hover {
  color: #ef4444;
}

.item-price-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0;
}

.unit-price {
  font-size: 0.8rem;
  color: #64748b;
}

.line-total {
  font-size: 0.95rem;
  font-weight: 800;
  color: #059669;
}

.item-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qty-stepper {
  display: inline-flex;
  align-items: center;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 2px 4px;
  gap: 8px;
}

.stepper-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: #ffffff;
  color: #1e293b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.15s ease;
}

.stepper-btn:hover:not(:disabled) {
  background: #059669;
  color: #ffffff;
}

.stepper-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.qty-value {
  font-size: 0.82rem;
  font-weight: 700;
  color: #0f172a;
  min-width: 18px;
  text-align: center;
}

.stock-badge-low {
  font-size: 0.7rem;
  color: #d97706;
  font-weight: 600;
  background: #fef3c7;
  padding: 2px 6px;
  border-radius: 6px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  padding: 40px 20px;
}

.empty-icon-wrap {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #94a3b8;
  margin-bottom: 20px;
}

.empty-state h4 {
  margin: 0 0 8px 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
}

.empty-state p {
  margin: 0 0 24px 0;
  font-size: 0.88rem;
  color: #64748b;
  line-height: 1.5;
}

.explore-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #059669;
  color: #ffffff;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);
}

.explore-btn:hover {
  background: #047857;
  transform: translateY(-2px);
}

/* Footer */
.panel-footer {
  padding: 20px 24px;
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  background: #ffffff;
}

.summary-breakdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.88rem;
  color: #64748b;
}

.summary-line.highlight {
  color: #059669;
  font-weight: 600;
}

.summary-line.grand-total {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  border-top: 1px dashed #e2e8f0;
  padding-top: 8px;
  margin-top: 4px;
}

.footer-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checkout-btn {
  width: 100%;
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: #ffffff;
  border: none;
  padding: 14px;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 16px rgba(5, 150, 105, 0.3);
  transition: all 0.2s ease;
}

.checkout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(5, 150, 105, 0.35);
}

.view-cart-btn {
  width: 100%;
  background: #f8fafc;
  color: #334155;
  border: 1px solid #e2e8f0;
  padding: 12px;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-cart-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.trust-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 14px;
  font-size: 0.74rem;
  color: #94a3b8;
}

/* Transitions */
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.3s ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-fade-enter-active .mini-cart-panel {
  animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-fade-leave-active .mini-cart-panel {
  animation: slideOut 0.25s ease-in;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(100%);
  }
}

.rtl-mode.mini-cart-panel {
  /* Handles left vs right slide for RTL */
}
</style>
