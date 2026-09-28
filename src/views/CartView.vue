<template>
  <div class="cart-page">
    <h1 class="page-title">{{ t('cart.title') }}</h1>

    <!-- Empty Cart State -->
    <div v-if="cartStore.cart.length === 0" class="empty-cart">
      <div class="empty-icon-wrapper">
        <i class="fa-solid fa-cart-shopping"></i>
      </div>
      <h2>{{ t('cart.empty') }}</h2>
      <p>{{ t('cart.emptyDesc') }}</p>
      <router-link to="/" class="shop-btn">{{ t('cart.shopNow') }}</router-link>
    </div>

    <!-- Active Cart Content -->
    <div v-else class="cart-content">
      
      <!-- Cart Items Section -->
      <div class="cart-items-section">
        <div v-for="item in cartStore.cart" :key="item.cartItemId || item.id" class="cart-item-card">
          
          <div class="item-img-wrapper">
            <img :src="item.image" :alt="item.title">
          </div>

          <div class="item-info">
            <h3 class="item-title">{{ item.title }}</h3>
            
            <!-- Variants display -->
            <div v-if="item.selectedSize || item.selectedColor || item.unitType === 'weight'" class="cart-variant-badges">
              <span v-if="item.unitType === 'weight'" class="variant-tag weight-tag">
                <i class="fa-solid fa-weight-scale"></i> {{ item.quantity }} {{ t('variants.kg') }}
              </span>
              <span v-if="item.selectedSize" class="variant-tag">
                <i class="fa-solid fa-ruler-horizontal"></i> {{ item.selectedSize }}
              </span>
              <span v-if="item.selectedColor" class="variant-tag color-tag">
                <span class="color-dot" :style="{ backgroundColor: item.selectedColor?.hex || item.selectedColor }"></span>
                {{ item.selectedColor?.name || item.selectedColor }}
              </span>
            </div>

            <p class="item-price">
              ${{ Number(item.price).toFixed(2) }}
              <span v-if="item.unitType === 'weight'" class="unit-note">({{ t('variants.perKg') }})</span>
            </p>
          </div>

          <div class="quantity-controls">
            <button 
              type="button"
              class="qty-btn" 
              @click="cartStore.decreaseQuantity(item.cartItemId || item.id)"
              :aria-label="t('miniCart.decreaseQty')"
            >
              <i class="fa-solid fa-minus"></i>
            </button>
            
            <span class="qty-amount">
              {{ item.unitType === 'weight' ? `${item.quantity} ${t('variants.kg')}` : item.quantity }}
            </span>
            
            <button 
              type="button"
              class="qty-btn" 
              :disabled="item.unitType !== 'weight' && item.quantity >= item.stock"
              @click="cartStore.increaseQuantity(item.cartItemId || item.id)"
              :aria-label="t('miniCart.increaseQty')"
            >
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>

          <div class="item-actions">
            <p class="item-total-price">${{ (item.price * item.quantity).toFixed(2) }}</p>
            <button 
              type="button"
              class="remove-btn" 
              @click="cartStore.removeFromCart(item.cartItemId || item.id)"
              :title="t('cart.removeFromCart')"
              :aria-label="t('cart.removeFromCart')"
            >
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>

        </div>
      </div>

      <!-- Order Summary Card -->
      <div class="cart-summary-section">
        <div class="summary-card">
          <h2>{{ t('cart.summary') }}</h2>
          
          <div class="summary-row">
            <span>{{ t('cart.itemsCount') }}</span>
            <span>{{ t('cart.itemsCountBadge', { count: cartStore.totalItemsCount }) }}</span>
          </div>

          <div class="summary-row">
            <span>{{ t('cart.subtotal') || 'المجموع الفرعي' }}</span>
            <span>${{ cartStore.totalPrice.toFixed(2) }}</span>
          </div>

          <!-- Coupon Input & Applied Display -->
          <div class="coupon-box">
            <div v-if="!cartStore.appliedCoupon" class="coupon-input-group">
              <input 
                v-model="couponCode" 
                type="text" 
                :placeholder="t('promo.inputPlaceholder')" 
                class="coupon-input"
                @keyup.enter="handleApplyCoupon"
              />
              <button type="button" class="coupon-apply-btn" @click="handleApplyCoupon">
                {{ t('promo.applyBtn') }}
              </button>
            </div>
            <div v-else class="coupon-applied-badge">
              <div class="coupon-applied-left">
                <i class="fa-solid fa-tag"></i>
                <span class="coupon-name">{{ cartStore.appliedCoupon.code }} (-{{ cartStore.appliedCoupon.discountPercent }}%)</span>
              </div>
              <button type="button" class="coupon-remove-btn" @click="cartStore.removeCoupon">
                {{ t('promo.removeBtn') }}
              </button>
            </div>
          </div>

          <!-- Discount Row if Applied -->
          <div v-if="cartStore.appliedCoupon" class="summary-row discount-row">
            <span>{{ t('promo.discountRow', { code: cartStore.appliedCoupon.code }) }}</span>
            <span class="discount-val">-${{ cartStore.discountAmount.toFixed(2) }}</span>
          </div>
          
          <div class="summary-row total-row">
            <span>{{ t('cart.total') }}</span>
            <span class="final-price">${{ cartStore.finalPrice.toFixed(2) }}</span>
          </div>

          <router-link to="/checkout" class="checkout-btn pulse-cta">
            <span>{{ t('cart.proceedToCheckout') }}</span>
            <i :class="isRtl ? 'fa-solid fa-arrow-left' : 'fa-solid fa-arrow-right'"></i>
          </router-link>
          
          <router-link to="/" class="continue-shopping">
            {{ t('cart.continueShopping') }}
          </router-link>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCartStore } from '../stores/cartStore'
import { useI18n } from 'vue-i18n'

const cartStore = useCartStore()
const { t, locale } = useI18n()
const isRtl = computed(() => locale.value === 'ar')
const couponCode = ref('')

const handleApplyCoupon = () => {
  if (couponCode.value.trim()) {
    const success = cartStore.applyCoupon(couponCode.value.trim())
    if (success) {
      couponCode.value = ''
    }
  }
}

onMounted(() => {
  cartStore.syncCartWithFirestore()
})
</script>

<style scoped>
.cart-page {
  max-width: 1280px;
  margin: 36px auto;
  padding: 0 24px;
  min-height: 60vh;
  width: 100%;
}

.page-title {
  color: #0f172a;
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 28px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 16px;
}

/* Empty Cart State */
.empty-cart {
  text-align: center;
  padding: 60px 24px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
  border: 1px solid #e2e8f0;
}

.empty-icon-wrapper {
  width: 90px;
  height: 90px;
  background: #f1f5f9;
  color: #94a3b8;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin: 0 auto 20px;
}

.empty-cart h2 {
  color: #0f172a;
  margin-bottom: 10px;
  font-weight: 800;
}

.empty-cart p {
  color: #64748b;
  margin-bottom: 24px;
  font-size: 1rem;
}

.shop-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 30px;
  min-height: 44px;
  background-color: #059669;
  color: white;
  border-radius: 12px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);
}

.shop-btn:hover {
  background-color: #047857;
  transform: translateY(-2px);
}

/* Active Cart Grid */
.cart-content {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.cart-items-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.cart-item-card {
  display: flex;
  align-items: center;
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.02);
  border: 1px solid #e2e8f0;
  gap: 20px;
  transition: all 0.2s ease;
}

.cart-item-card:hover {
  box-shadow: 0 6px 20px rgba(0,0,0,0.04);
  border-color: #cbd5e1;
}

.item-img-wrapper {
  width: 84px;
  height: 84px;
  background: #f8fafc;
  border-radius: 12px;
  padding: 8px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-img-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  mix-blend-mode: multiply;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-title {
  margin: 0 0 8px 0;
  font-size: 1.05rem;
  color: #0f172a;
  font-weight: 700;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-price {
  margin: 0;
  color: #64748b;
  font-weight: 600;
  font-size: 0.95rem;
}

.unit-note {
  font-size: 0.8rem;
  color: #94a3b8;
}

.cart-variant-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 6px 0 10px;
}

.variant-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.weight-tag {
  background: #ecfdf5;
  color: #059669;
  border-color: #a7f3d0;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.2);
  display: inline-block;
}

/* Stepper */
.quantity-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  padding: 4px 8px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.qty-btn {
  background: none;
  border: none;
  color: #475569;
  font-size: 0.9rem;
  cursor: pointer;
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background 0.15s ease;
}

.qty-btn:hover:not(:disabled) {
  background: #059669;
  color: white;
}

.qty-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.qty-amount {
  font-weight: 800;
  color: #0f172a;
  min-width: 24px;
  text-align: center;
  font-size: 0.95rem;
}

/* Actions & Total Price */
.item-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  min-width: 100px;
}

.item-total-price {
  margin: 0;
  font-weight: 800;
  color: #059669;
  font-size: 1.25rem;
}

.remove-btn {
  background: #fee2e2;
  color: #ef4444;
  border: none;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.remove-btn:hover {
  background: #ef4444;
  color: white;
}

/* Summary Section */
.cart-summary-section {
  width: 380px;
  flex-shrink: 0;
}

.summary-card {
  background: white;
  padding: 28px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
  border: 1px solid #e2e8f0;
}

.summary-card h2 {
  color: #0f172a;
  font-size: 1.35rem;
  font-weight: 800;
  margin: 0 0 20px 0;
  padding-bottom: 14px;
  border-bottom: 1px solid #f1f5f9;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 14px;
  color: #64748b;
  font-size: 0.95rem;
}

/* Coupon Styles */
.coupon-box {
  margin: 18px 0;
  padding: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.coupon-input-group {
  display: flex;
  gap: 8px;
}

.coupon-input {
  flex: 1;
  padding: 10px 14px;
  border: 1.5px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 600;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;
}

.coupon-input:focus {
  border-color: #059669;
}

.coupon-apply-btn {
  padding: 10px 18px;
  background: #0f172a;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  font-family: inherit;
}

.coupon-apply-btn:hover {
  background: #059669;
}

.coupon-applied-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  padding: 8px 12px;
  border-radius: 8px;
}

.coupon-applied-left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #059669;
  font-weight: 700;
  font-size: 0.9rem;
}

.coupon-remove-btn {
  background: transparent;
  border: none;
  color: #ef4444;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  padding: 4px;
}

.coupon-remove-btn:hover {
  text-decoration: underline;
}

.discount-row {
  color: #059669 !important;
  font-weight: 700;
}

.discount-val {
  color: #059669;
  font-weight: 800;
}

.total-row {
  border-top: 1px dashed #e2e8f0;
  padding-top: 16px;
  margin-top: 16px;
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
}

.final-price {
  color: #059669;
  font-size: 1.5rem;
}

.checkout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 16px;
  min-height: 48px;
  background: #059669;
  color: white;
  border-radius: 12px;
  font-weight: 800;
  margin-top: 24px;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);
  font-size: 1rem;
}

.checkout-btn:hover {
  background: #047857;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(5, 150, 105, 0.35);
}

.continue-shopping {
  display: block;
  text-align: center;
  margin-top: 16px;
  color: #64748b;
  font-weight: 700;
  text-decoration: none;
  transition: color 0.2s;
  padding: 8px;
}

.continue-shopping:hover {
  color: #059669;
}

@media (max-width: 960px) {
  .cart-content {
    flex-direction: column;
  }
  
  .cart-summary-section {
    width: 100%;
  }
}

@media (max-width: 580px) {
  .cart-page {
    padding: 0 16px;
  }

  .cart-item-card {
    flex-wrap: wrap;
    padding: 16px;
  }
  
  .item-actions {
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #f1f5f9;
    padding-top: 14px;
    margin-top: 6px;
  }
}
</style>