<script setup>
import { computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cartStore'
import { useI18n } from 'vue-i18n'

const cartStore = useCartStore()
const router = useRouter()
const { t, locale } = useI18n()

const isRtl = computed(() => locale.value === 'ar')

// Viewport & Body Scroll Locking
watch(() => cartStore.isMiniCartOpen, (isOpen) => {
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('drawer-open', isOpen)
  }
}, { immediate: true })

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.classList.remove('drawer-open')
  }
})

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
        :class="isRtl ? 'rtl-overlay' : 'ltr-overlay'"
        @click="handleClose"
      >
        <div 
          class="mini-cart-panel" 
          :class="isRtl ? 'rtl-mode' : 'ltr-mode'"
          @click.stop
        >
          <!-- Drawer Header -->
          <div class="panel-header">
            <div class="header-title-box">
              <div class="cart-icon-bubble">
                <i class="fa-solid fa-bag-shopping"></i>
              </div>
              <div class="title-meta">
                <h3>{{ t('miniCart.title') }}</h3>
                <span class="items-count-tag">{{ t('miniCart.itemsCount', { count: cartStore.totalItemsCount }) }}</span>
              </div>
            </div>
            <button 
              type="button" 
              class="close-btn" 
              :aria-label="t('miniCart.closeCart')" 
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
                  {{ t('miniCart.congratsFreeShipping') }}
                </span>
              </template>
              <template v-else>
                <span>
                  {{ t('miniCart.addMoreFor') }}<strong>${{ cartStore.freeShippingRemaining.toFixed(2) }}</strong>{{ t('miniCart.moreToGet') }}<strong>{{ t('miniCart.freeShippingTag') }}</strong>!
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
                  :key="item.cartItemId || item.id" 
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
                        :title="t('cart.removeFromCart')"
                        :aria-label="t('cart.removeFromCart')"
                        @click="cartStore.removeFromCart(item.cartItemId || item.id)"
                      >
                        <i class="fa-regular fa-trash-can"></i>
                      </button>
                    </div>

                    <!-- Selected Variants / Weight Chips -->
                    <div v-if="item.selectedSize || item.selectedColor || item.unitType === 'weight'" class="item-variants-pills">
                      <span v-if="item.unitType === 'weight'" class="variant-mini-chip weight-mini-chip">
                        <i class="fa-solid fa-weight-scale"></i> {{ item.quantity }} {{ t('variants.kg') }}
                      </span>
                      <span v-if="item.selectedSize" class="variant-mini-chip">
                        <i class="fa-solid fa-ruler-horizontal"></i> {{ item.selectedSize }}
                      </span>
                      <span v-if="item.selectedColor" class="variant-mini-chip color-mini-chip">
                        <span class="color-mini-dot" :style="{ backgroundColor: item.selectedColor?.hex || item.selectedColor }"></span>
                        {{ item.selectedColor?.name || item.selectedColor }}
                      </span>
                    </div>

                    <div class="item-price-row">
                      <span class="unit-price">
                        ${{ Number(item.price).toFixed(2) }} 
                        <span v-if="item.unitType === 'weight'">{{ t('variants.perKg') }}</span>
                      </span>
                      <span class="line-total">${{ (item.price * item.quantity).toFixed(2) }}</span>
                    </div>
                    <div class="item-controls">
                      <div class="qty-stepper">
                        <button 
                          type="button" 
                          class="stepper-btn" 
                          :aria-label="t('miniCart.decreaseQty')"
                          @click="cartStore.decreaseQuantity(item.cartItemId || item.id)"
                        >
                          <i class="fa-solid fa-minus"></i>
                        </button>
                        <span class="qty-value">
                          {{ item.unitType === 'weight' ? `${item.quantity} ${t('variants.kg')}` : item.quantity }}
                        </span>
                        <button 
                          type="button" 
                          class="stepper-btn" 
                          :disabled="item.unitType !== 'weight' && item.quantity >= item.stock"
                          :aria-label="t('miniCart.increaseQty')"
                          @click="cartStore.increaseQuantity(item.cartItemId || item.id)"
                        >
                          <i class="fa-solid fa-plus"></i>
                        </button>
                      </div>
                      <span v-if="item.stock <= 5 && item.unitType !== 'weight'" class="stock-badge-low">
                        {{ t('miniCart.onlyLeft', { count: item.stock }) }}
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
              <h4>{{ t('miniCart.emptyTitle') }}</h4>
              <p>{{ t('miniCart.emptyDesc') }}</p>
              <button type="button" class="explore-btn" @click="continueShopping">
                <i class="fa-solid fa-bag-shopping"></i>
                <span>{{ t('miniCart.browseNow') }}</span>
              </button>
            </div>
          </div>

          <!-- Drawer Footer -->
          <div v-if="cartStore.cart.length > 0" class="panel-footer">
            <div class="summary-breakdown">
              <div class="summary-line">
                <span class="label">{{ t('miniCart.subtotal') }}</span>
                <span class="value">${{ cartStore.totalPrice.toFixed(2) }}</span>
              </div>
              <div class="summary-line highlight">
                <span class="label">{{ t('miniCart.shipping') }}</span>
                <span class="value">
                  {{ cartStore.hasFreeShipping ? t('miniCart.free') : '$15.00' }}
                </span>
              </div>
              <div class="summary-line grand-total">
                <span class="label">{{ t('miniCart.estimatedTotal') }}</span>
                <span class="value">
                  ${{ (cartStore.totalPrice + (cartStore.hasFreeShipping ? 0 : 15)).toFixed(2) }}
                </span>
              </div>
            </div>

            <div class="footer-actions">
              <button type="button" class="checkout-btn" @click="goToCheckout">
                <span>{{ t('miniCart.instantCheckout') }}</span>
                <i :class="isRtl ? 'fa-solid fa-arrow-left' : 'fa-solid fa-arrow-right'"></i>
              </button>
              <button type="button" class="view-cart-btn" @click="goToCart">
                {{ t('miniCart.viewCartDetails') }}
              </button>
            </div>
            
            <div class="trust-badge">
              <i class="fa-solid fa-shield-halved"></i>
              <span>{{ t('miniCart.secureCheckout') }}</span>
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
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  max-height: 100dvh;
  background-color: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
}

/* RTL: Drawer panel aligns to the RIGHT */
.mini-cart-overlay.rtl-overlay {
  justify-content: flex-end;
}

/* LTR: Drawer panel aligns to the LEFT */
.mini-cart-overlay.ltr-overlay {
  justify-content: flex-start;
}

.mini-cart-panel {
  width: 100%;
  max-width: 440px;
  height: 100vh;
  height: 100dvh;
  max-height: 100dvh;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  position: relative;
  font-family: inherit;
  overflow: hidden;
}

.mini-cart-panel.rtl-mode {
  direction: rtl;
  text-align: right;
  box-shadow: -10px 0 35px rgba(0, 0, 0, 0.15);
}

.mini-cart-panel.ltr-mode {
  direction: ltr;
  text-align: left;
  box-shadow: 10px 0 35px rgba(0, 0, 0, 0.15);
}

/* Header */
.panel-header {
  padding: 18px 24px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  flex-shrink: 0;
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
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.15rem;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

/* Shipping Progress Banner */
.shipping-progress-banner {
  padding: 14px 24px;
  background: #f8fafc;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  flex-shrink: 0;
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
  padding: 14px;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.9);
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
  padding: 8px;
  min-width: 36px;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
  font-size: 0.95rem;
}

.delete-item-btn:hover {
  color: #ef4444;
}

.item-variants-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 4px 0 2px;
}

.variant-mini-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f1f5f9;
  color: #334155;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}

.weight-mini-chip {
  background: #ecfdf5;
  color: #059669;
}

.color-mini-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.15);
  display: inline-block;
}

.item-price-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 6px 0;
}

.unit-price {
  font-size: 0.8rem;
  color: #64748b;
}

.line-total {
  font-size: 0.92rem;
  font-weight: 800;
  color: #059669;
}

.item-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.qty-stepper {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 2px;
  gap: 4px;
}

.stepper-btn {
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
  background: transparent;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 0.75rem;
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
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
  min-width: 22px;
  text-align: center;
}

.stock-badge-low {
  font-size: 0.72rem;
  color: #d97706;
  font-weight: 700;
  background: #fef3c7;
  padding: 2px 8px;
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
  min-height: 44px;
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

/* Footer with shrink-0 and Safe Area */
.panel-footer {
  padding: 20px 24px;
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  background: #ffffff;
  flex-shrink: 0;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
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

.summary-line .value {
  font-weight: 700;
  color: #1e293b;
}

.summary-line.highlight .value {
  color: #059669;
}

.summary-line.grand-total {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  padding-top: 8px;
  border-top: 1px dashed #e2e8f0;
}

.summary-line.grand-total .value {
  font-size: 1.25rem;
  color: #059669;
}

.footer-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checkout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 14px;
  min-height: 48px;
  background: #059669;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);
  font-family: inherit;
}

.checkout-btn:hover {
  background: #047857;
  transform: translateY(-1px);
}

.view-cart-btn {
  width: 100%;
  padding: 12px;
  min-height: 44px;
  background: #f8fafc;
  color: #334155;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.view-cart-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.trust-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
  font-size: 0.76rem;
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

/* RTL: Drawer slides smoothly from Right */
.rtl-overlay.drawer-fade-enter-active .mini-cart-panel {
  animation: slideInRight 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}

.rtl-overlay.drawer-fade-leave-active .mini-cart-panel {
  animation: slideOutRight 0.25s ease-in;
}

/* LTR: Drawer slides smoothly from Left */
.ltr-overlay.drawer-fade-enter-active .mini-cart-panel {
  animation: slideInLeft 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}

.ltr-overlay.drawer-fade-leave-active .mini-cart-panel {
  animation: slideOutLeft 0.25s ease-in;
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes slideOutRight {
  from { transform: translateX(0); }
  to { transform: translateX(100%); }
}

@keyframes slideInLeft {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

@keyframes slideOutLeft {
  from { transform: translateX(0); }
  to { transform: translateX(-100%); }
}

/* Mobile Responsiveness */
@media (max-width: 480px) {
  .mini-cart-panel {
    max-width: 100vw;
    width: 100%;
  }

  .panel-header {
    padding: 14px 16px;
  }

  .panel-body {
    padding: 14px 16px;
  }

  .shipping-progress-banner {
    padding: 12px 16px;
  }

  .panel-footer {
    padding: 16px;
  }
}
</style>
