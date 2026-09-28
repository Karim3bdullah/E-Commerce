<template>
  <div class="checkout-container">
    <h1 class="page-title">{{ t('checkout.title') }}</h1>

    <!-- Order Completed Success State with Animated Checkmark -->
    <div v-if="orderCompleted" class="success-screen">
      <div class="success-card">
        <svg class="checkmark-svg" viewBox="0 0 52 52">
          <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
          <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
        </svg>

        <h2>{{ t('feedback.orderSuccessTitle') }}</h2>
        <p class="order-id-badge">{{ t('admin.orderId') }}: #{{ completedOrderId }}</p>

        <p class="payment-note-badge" :class="paymentMethod === 'card' ? 'paid-note' : 'cod-note'">
          <i :class="paymentMethod === 'card' ? 'fa-solid fa-credit-card' : 'fa-solid fa-truck-ramp-box'"></i>
          {{ paymentMethod === 'card' ? t('payment.paidBadge') : t('payment.codBadge') }}
        </p>

        <div class="success-actions">
          <router-link to="/my-orders" class="primary-success-btn">
            <i class="fa-solid fa-list-check"></i>
            <span>{{ t('nav.myOrders') }}</span>
          </router-link>
          <router-link to="/" class="secondary-success-btn">
            <i class="fa-solid fa-store"></i>
            <span>{{ t('cart.shopNow') }}</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Empty Cart Notice -->
    <div v-else-if="cartStore.cart.length === 0" class="empty-notice">
      <div class="empty-icon"><i class="fa-solid fa-cart-shopping"></i></div>
      <h2>{{ t('checkout.emptyNotice') }}</h2>
      <router-link to="/" class="back-home">{{ t('checkout.backHome') }}</router-link>
    </div>

    <!-- Active Checkout Grid -->
    <div v-else class="checkout-grid">
      
      <!-- Customer Information & Payment Method Form -->
      <div class="form-card">
        <h2><i class="fa-solid fa-truck-fast"></i> {{ t('checkout.shippingData') }}</h2>
        
        <form @submit.prevent="handleCheckout">
          
          <div class="form-group">
            <label>{{ t('checkout.fullName') }}</label>
            <div class="input-wrapper">
              <i class="fa-regular fa-user field-icon"></i>
              <input 
                v-model="name" 
                type="text" 
                :placeholder="t('checkout.fullNamePlaceholder')"
                :class="{ 'input-error': errors.name }"
              >
            </div>
            <span class="error-msg" v-if="errors.name">{{ errors.name }}</span>
          </div>

          <div class="form-group">
            <label>{{ t('checkout.phone') }}</label>
            <div class="input-wrapper">
              <i class="fa-solid fa-phone field-icon"></i>
              <input 
                v-model="phone" 
                type="tel" 
                :placeholder="t('checkout.phonePlaceholder')"
                :class="{ 'input-error': errors.phone }"
              >
            </div>
            <span class="error-msg" v-if="errors.phone">{{ errors.phone }}</span>
          </div>

          <div class="form-group">
            <label>{{ t('checkout.address') }}</label>
            <div class="textarea-wrapper">
              <i class="fa-solid fa-location-dot field-icon textarea-icon"></i>
              <textarea 
                v-model="address" 
                rows="3" 
                :placeholder="t('checkout.addressPlaceholder')"
                :class="{ 'input-error': errors.address }"
              ></textarea>
            </div>
            <span class="error-msg" v-if="errors.address">{{ errors.address }}</span>
          </div>

          <div class="form-group">
            <label>{{ t('checkout.notes') }}</label>
            <div class="input-wrapper">
              <i class="fa-regular fa-note-sticky field-icon"></i>
              <input 
                v-model="notes" 
                type="text" 
                :placeholder="t('checkout.notesPlaceholder')"
              >
            </div>
          </div>

          <!-- Dual Payment Selector: COD vs Online Card -->
          <div class="payment-method-section">
            <label class="section-title"><i class="fa-solid fa-wallet"></i> {{ t('payment.methodTitle') }}</label>
            
            <div class="payment-options-grid">
              <!-- COD Option -->
              <div 
                class="payment-option-card"
                :class="{ 'selected': paymentMethod === 'cod' }"
                @click="paymentMethod = 'cod'"
              >
                <div class="option-header">
                  <div class="radio-circle">
                    <div v-if="paymentMethod === 'cod'" class="radio-dot"></div>
                  </div>
                  <div class="option-title-wrap">
                    <span class="option-title">{{ t('payment.cod') }}</span>
                    <span class="option-desc">{{ t('payment.codDesc') }}</span>
                  </div>
                </div>
                <div class="option-icon">
                  <i class="fa-solid fa-money-bill-wave"></i>
                </div>
              </div>

              <!-- Online Card Option -->
              <div 
                class="payment-option-card"
                :class="{ 'selected': paymentMethod === 'card' }"
                @click="paymentMethod = 'card'"
              >
                <div class="option-header">
                  <div class="radio-circle">
                    <div v-if="paymentMethod === 'card'" class="radio-dot"></div>
                  </div>
                  <div class="option-title-wrap">
                    <span class="option-title">{{ t('payment.onlineCard') }}</span>
                    <span class="option-desc">{{ t('payment.onlineCardDesc') }}</span>
                  </div>
                </div>
                <div class="card-brand-icons">
                  <i class="fa-brands fa-cc-visa"></i>
                  <i class="fa-brands fa-cc-mastercard"></i>
                </div>
              </div>
            </div>

            <!-- Card Payment Fields (Only shown when card option is active) -->
            <div v-if="paymentMethod === 'card'" class="card-input-box">
              <div class="card-form-header">
                <span class="live-card-badge">
                  <i v-if="cardBrand === 'visa'" class="fa-brands fa-cc-visa visa-color"></i>
                  <i v-else-if="cardBrand === 'mastercard'" class="fa-brands fa-cc-mastercard mc-color"></i>
                  <i v-else class="fa-solid fa-credit-card"></i>
                  {{ cardBrand === 'visa' ? 'Visa' : (cardBrand === 'mastercard' ? 'Mastercard' : 'Credit / Debit Card') }}
                </span>
                <span class="secure-badge"><i class="fa-solid fa-lock"></i> 256-bit Secure TLS</span>
              </div>

              <div class="form-group">
                <label>{{ t('payment.cardHolder') }}</label>
                <div class="input-wrapper">
                  <i class="fa-regular fa-id-card field-icon"></i>
                  <input 
                    v-model="cardHolder" 
                    type="text" 
                    :placeholder="t('payment.cardHolderPlaceholder')"
                    :class="{ 'input-error': cardErrors.cardHolder }"
                    @input="cardErrors.cardHolder = ''"
                  >
                </div>
                <span class="error-msg" v-if="cardErrors.cardHolder">{{ cardErrors.cardHolder }}</span>
              </div>

              <div class="form-group">
                <label>{{ t('payment.cardNumber') }}</label>
                <div class="input-wrapper">
                  <i class="fa-regular fa-credit-card field-icon"></i>
                  <input 
                    :value="cardNumber" 
                    type="text" 
                    maxlength="19"
                    :placeholder="t('payment.cardNumberPlaceholder')"
                    :class="{ 'input-error': cardErrors.cardNumber }"
                    @input="onCardNumberInput"
                  >
                </div>
                <span class="error-msg" v-if="cardErrors.cardNumber">{{ cardErrors.cardNumber }}</span>
              </div>

              <div class="card-grid-row">
                <div class="form-group">
                  <label>{{ t('payment.expiry') }}</label>
                  <div class="input-wrapper">
                    <i class="fa-regular fa-calendar field-icon"></i>
                    <input 
                      :value="cardExpiry" 
                      type="text" 
                      maxlength="5"
                      :placeholder="t('payment.expiryPlaceholder')"
                      :class="{ 'input-error': cardErrors.cardExpiry }"
                      @input="onExpiryInput"
                    >
                  </div>
                  <span class="error-msg" v-if="cardErrors.cardExpiry">{{ cardErrors.cardExpiry }}</span>
                </div>

                <div class="form-group">
                  <label>{{ t('payment.cvv') }}</label>
                  <div class="input-wrapper">
                    <i class="fa-solid fa-shield-halved field-icon"></i>
                    <input 
                      v-model="cardCvv" 
                      type="password" 
                      maxlength="4"
                      :placeholder="t('payment.cvvPlaceholder')"
                      :class="{ 'input-error': cardErrors.cardCvv }"
                      @input="cardErrors.cardCvv = ''"
                    >
                  </div>
                  <span class="error-msg" v-if="cardErrors.cardCvv">{{ cardErrors.cardCvv }}</span>
                </div>
              </div>
            </div>
          </div>

          <button type="submit" class="submit-btn pulse-cta" :disabled="isSubmitting || isProcessingPayment">
            <span v-if="isSubmitting || isProcessingPayment" class="loading-btn-content">
              <div class="btn-spinner"></div> {{ isProcessingPayment ? 'جاري التحقق من بيانات البطاقة...' : t('checkout.submittingOrder') }}
            </span>
            <span v-else class="submit-content">
              <span>{{ t('checkout.confirmOrderWithTotal', { total: '$' + cartStore.finalPrice.toFixed(2) }) }}</span>
              <i :class="isRtl ? 'fa-solid fa-arrow-left' : 'fa-solid fa-arrow-right'"></i>
            </span>
          </button>
        </form>
      </div>

      <!-- Order Summary Card -->
      <div class="summary-card">
        <h2><i class="fa-solid fa-bag-shopping"></i> {{ t('checkout.itemsSummary', { count: cartStore.totalItemsCount }) }}</h2>
        
        <div class="items-preview">
          <div v-for="item in cartStore.cart" :key="item.cartItemId || item.id" class="preview-item">
            <img :src="item.image" :alt="item.title">
            <div class="item-details">
              <h4>{{ item.title }}</h4>
              
              <!-- Variant tags preview -->
              <div v-if="item.selectedSize || item.selectedColor || item.unitType === 'weight'" class="preview-variant-tags">
                <span v-if="item.unitType === 'weight'" class="prev-tag weight-tag">
                  <i class="fa-solid fa-weight-scale"></i> {{ item.quantity }} {{ t('variants.kg') }}
                </span>
                <span v-if="item.selectedSize" class="prev-tag">
                  {{ item.selectedSize }}
                </span>
                <span v-if="item.selectedColor" class="prev-tag color-prev-tag">
                  <span class="color-dot-sm" :style="{ backgroundColor: item.selectedColor?.hex || item.selectedColor }"></span>
                  {{ item.selectedColor?.name || item.selectedColor }}
                </span>
              </div>

              <p>{{ item.unitType === 'weight' ? `$${Number(item.price).toFixed(2)} / ${t('variants.kg')}` : t('checkout.quantity', { qty: item.quantity, price: '$' + item.price }) }}</p>
            </div>
            <div class="item-total-price">
              ${{ (item.price * item.quantity).toFixed(2) }}
            </div>
          </div>
        </div>

        <!-- Promo Code Box in Summary -->
        <div class="checkout-promo-box">
          <div v-if="!cartStore.appliedCoupon" class="promo-input-wrap">
            <input 
              v-model="promoInput" 
              type="text" 
              :placeholder="t('promo.inputPlaceholder')"
              class="promo-input-field"
              @keyup.enter="applyPromo"
            />
            <button type="button" class="promo-btn" @click="applyPromo">
              {{ t('promo.applyBtn') }}
            </button>
          </div>
          <div v-else class="promo-active-wrap">
            <div class="promo-active-info">
              <i class="fa-solid fa-tag"></i>
              <span>{{ cartStore.appliedCoupon.code }} (-{{ cartStore.appliedCoupon.discountPercent }}%)</span>
            </div>
            <button type="button" class="promo-del-btn" @click="cartStore.removeCoupon">
              {{ t('promo.removeBtn') }}
            </button>
          </div>
        </div>

        <div class="summary-breakdown">
          <div class="breakdown-row">
            <span>{{ t('checkout.subtotal') }}</span>
            <span>${{ cartStore.totalPrice.toFixed(2) }}</span>
          </div>

          <div v-if="cartStore.appliedCoupon" class="breakdown-row discount-highlight">
            <span>{{ t('promo.discountRow', { code: cartStore.appliedCoupon.code }) }}</span>
            <span>-${{ cartStore.discountAmount.toFixed(2) }}</span>
          </div>

          <div class="breakdown-row">
            <span>{{ t('checkout.shippingCost') }}</span>
            <span class="free-shipping">{{ t('checkout.free') }}</span>
          </div>
        </div>

        <div class="total-box">
          <span>{{ t('checkout.finalTotal') }}</span>
          <span class="total-price-num">${{ cartStore.finalPrice.toFixed(2) }}</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useCartStore } from '../stores/cartStore'
import { db, auth } from '../firebase/config'
import { collection, serverTimestamp, doc, getDoc, runTransaction } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'
import { notifySuccess, notifyError, handleFirebaseError } from '../services/feedback'

const { t, locale } = useI18n()
const isRtl = computed(() => locale.value === 'ar')

const cartStore = useCartStore()
const router = useRouter()
const currentUserId = ref(null)

// Payment State
const paymentMethod = ref('cod')
const isProcessingPayment = ref(false)
const orderCompleted = ref(false)
const completedOrderId = ref('')

// Card Details
const cardHolder = ref('')
const cardNumber = ref('')
const cardExpiry = ref('')
const cardCvv = ref('')
const cardErrors = ref({})

// Promo Code
const promoInput = ref('')
const applyPromo = () => {
  if (promoInput.value.trim()) {
    const res = cartStore.applyCoupon(promoInput.value.trim())
    if (res) promoInput.value = ''
  }
}

// Card Brand Detection
const cardBrand = computed(() => {
  const digits = cardNumber.value.replace(/\s+/g, '')
  if (/^4/.test(digits)) return 'visa'
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard'
  return 'generic'
})

const onCardNumberInput = (e) => {
  cardErrors.value.cardNumber = ''
  const val = e.target.value.replace(/\D/g, '').substring(0, 16)
  cardNumber.value = val.replace(/(\d{4})(?=\d)/g, '$1 ')
}

const onExpiryInput = (e) => {
  cardErrors.value.cardExpiry = ''
  let val = e.target.value.replace(/\D/g, '').substring(0, 4)
  if (val.length >= 2) {
    cardExpiry.value = val.substring(0, 2) + '/' + val.substring(2, 4)
  } else {
    cardExpiry.value = val
  }
}

const validateCardForm = () => {
  const errs = {}
  if (!cardHolder.value.trim()) {
    errs.cardHolder = t('payment.cardHolderRequired')
  }
  const digits = cardNumber.value.replace(/\s+/g, '')
  if (digits.length !== 16) {
    errs.cardNumber = t('payment.cardNumberInvalid')
  }
  if (!/^\d{2}\/\d{2}$/.test(cardExpiry.value)) {
    errs.cardExpiry = t('payment.expiryInvalid')
  }
  if (cardCvv.value.length < 3) {
    errs.cardCvv = t('payment.cvvInvalid')
  }
  cardErrors.value = errs
  return Object.keys(errs).length === 0
}

const schema = computed(() => yup.object({
  name: yup.string().required(t('checkout.nameRequired')).min(3, t('checkout.nameMin')),
  phone: yup.string().required(t('checkout.phoneRequired')).matches(/^01[0125][0-9]{8}$/, t('checkout.phoneInvalid')),
  address: yup.string().required(t('checkout.addressRequired')).min(10, t('checkout.addressMin')),
  notes: yup.string().nullable()
}))

const { handleSubmit, errors, isSubmitting, setFieldValue } = useForm({
  validationSchema: schema,
})

const { value: name } = useField('name')
const { value: phone } = useField('phone')
const { value: address } = useField('address')
const { value: notes } = useField('notes')

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUserId.value = user.uid
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          if (data.name) setFieldValue('name', data.name)
          else if (data.fullName) setFieldValue('name', data.fullName)
          else if (data.firstName && data.lastName) setFieldValue('name', `${data.firstName} ${data.lastName}`)
          
          if (data.phone) setFieldValue('phone', data.phone)
          if (data.address) setFieldValue('address', data.address)
        }
      } catch (err) {
        console.warn("Could not prefill user profile:", err)
      }
    }
  })
})

const handleCheckout = handleSubmit(async (values) => {
  if (cartStore.cart.length === 0) return

  // Validate Card if paymentMethod is card
  if (paymentMethod.value === 'card') {
    const isCardValid = validateCardForm()
    if (!isCardValid) return

    // Simulate secure card tokenization and authorization
    isProcessingPayment.value = true
    await new Promise(resolve => setTimeout(resolve, 1200))
    isProcessingPayment.value = false
  }

  try {
    const ordersColRef = collection(db, 'orders')
    const newOrderRef = doc(ordersColRef)

    await runTransaction(db, async (transaction) => {
      let authoritativeTotalPrice = 0
      const orderItems = []

      for (const cartItem of cartStore.cart) {
        const productRef = doc(db, 'products', cartItem.id)
        const productDoc = await transaction.get(productRef)

        if (!productDoc.exists()) {
          throw new Error(t('product.notFound'))
        }

        const productData = productDoc.data()
        const currentStock = Number(productData.stock ?? 0)
        const currentPrice = Number(productData.price ?? 0)

        // Decrement stock if stock is tracked
        if (productData.unitType !== 'weight' && currentStock < cartItem.quantity) {
          throw new Error(
            isRtl.value 
              ? `عفواً، الكمية المطلوبة من "${productData.title || cartItem.title}" غير متوفرة! المتبقي: ${currentStock}`
              : `Sorry, requested quantity for "${productData.title || cartItem.title}" is out of stock! Available: ${currentStock}`
          )
        }

        const remainingStock = Math.max(0, currentStock - (productData.unitType === 'weight' ? Math.ceil(cartItem.quantity) : cartItem.quantity))
        transaction.update(productRef, { stock: remainingStock })

        const itemSubtotal = currentPrice * cartItem.quantity
        authoritativeTotalPrice += itemSubtotal

        orderItems.push({
          id: cartItem.id,
          cartItemId: cartItem.cartItemId || `${cartItem.id}_none_none_${cartItem.unitType || 'piece'}`,
          title: productData.title || cartItem.title,
          price: currentPrice,
          image: productData.image || cartItem.image,
          quantity: cartItem.quantity,
          unitType: cartItem.unitType || 'piece',
          selectedSize: cartItem.selectedSize || null,
          selectedColor: cartItem.selectedColor || null,
          subtotal: Number(itemSubtotal.toFixed(2))
        })
      }

      // Calculate final price with discount
      const calculatedDiscount = cartStore.appliedCoupon 
        ? Number(((authoritativeTotalPrice * cartStore.appliedCoupon.discountPercent) / 100).toFixed(2))
        : 0
      const calculatedFinalTotal = Math.max(0, Number((authoritativeTotalPrice - calculatedDiscount).toFixed(2)))

      const orderData = {
        userId: currentUserId.value || 'guest',
        customer: {
          name: values.name,
          phone: values.phone,
          address: values.address,
          notes: values.notes || ''
        },
        items: orderItems,
        paymentMethod: paymentMethod.value,
        paymentStatus: paymentMethod.value === 'card' ? 'paid' : 'pending',
        subtotal: Number(authoritativeTotalPrice.toFixed(2)),
        discount: calculatedDiscount,
        couponCode: cartStore.appliedCoupon?.code || null,
        totalPrice: calculatedFinalTotal,
        totalItems: cartStore.totalItemsCount,
        status: 'pending',
        createdAt: serverTimestamp()
      }

      transaction.set(newOrderRef, orderData)
    })

    const shortId = newOrderRef.id.slice(0, 8).toUpperCase()
    completedOrderId.value = shortId
    orderCompleted.value = true

    cartStore.clearCart()
    notifySuccess(t('feedback.orderSuccessTitle'))

  } catch (err) {
    console.error("Checkout Transaction Failed:", err)
    handleFirebaseError(err)
  }
})
</script>

<style scoped>
.checkout-container {
  max-width: 1200px;
  margin: 36px auto;
  padding: 0 24px;
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

.checkout-grid {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.form-card {
  flex: 1.3;
  background: #ffffff;
  padding: 32px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  border: 1px solid #e2e8f0;
}

.summary-card {
  flex: 1;
  background: #ffffff;
  padding: 32px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  border: 1px solid #e2e8f0;
  position: sticky;
  top: 90px;
}

h2 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 24px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 16px;
}

h2 i {
  color: #059669;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 8px;
}

.input-wrapper, .textarea-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.field-icon {
  position: absolute;
  inset-inline-start: 16px;
  color: #94a3b8;
  font-size: 1rem;
}

.textarea-icon {
  top: 16px;
}

input, textarea {
  width: 100%;
  padding-block: 12px;
  padding-inline-start: 46px;
  padding-inline-end: 16px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  font-size: 0.95rem;
  background-color: #f8fafc;
  outline: none;
  transition: all 0.2s ease;
  font-family: inherit;
  min-height: 48px;
}

textarea {
  min-height: 100px;
  resize: vertical;
}

input:focus, textarea:focus {
  border-color: #059669;
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
}

.input-error {
  border-color: #ef4444 !important;
  background-color: #fef2f2 !important;
}

.error-msg {
  color: #ef4444;
  font-size: 0.8rem;
  margin-top: 6px;
  display: block;
  font-weight: 600;
}

/* Payment Method Styles */
.payment-method-section {
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px dashed #e2e8f0;
}

.section-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title i {
  color: #059669;
}

.payment-options-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.payment-option-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.payment-option-card:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
}

.payment-option-card.selected {
  border-color: #059669;
  background: #ecfdf5;
  box-shadow: 0 4px 14px rgba(5, 150, 105, 0.12);
}

.option-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.radio-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  transition: all 0.2s;
}

.payment-option-card.selected .radio-circle {
  border-color: #059669;
}

.radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #059669;
}

.option-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-title {
  font-weight: 800;
  font-size: 0.95rem;
  color: #0f172a;
}

.option-desc {
  font-size: 0.8rem;
  color: #64748b;
}

.option-icon {
  font-size: 1.4rem;
  color: #059669;
}

.card-brand-icons {
  display: flex;
  gap: 8px;
  font-size: 1.5rem;
  color: #475569;
}

/* Card Input Box */
.card-input-box {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 24px;
  animation: fadeIn 0.3s ease;
}

.card-form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.live-card-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  color: #0f172a;
  font-size: 0.95rem;
}

.visa-color { color: #1a1f71; font-size: 1.6rem; }
.mc-color { color: #eb001b; font-size: 1.6rem; }

.secure-badge {
  font-size: 0.78rem;
  color: #059669;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-grid-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

.submit-btn {
  width: 100%;
  padding: 16px;
  min-height: 52px;
  background-color: #059669;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.05rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);
  font-family: inherit;
}

.submit-btn:hover:not(:disabled) {
  background-color: #047857;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(5, 150, 105, 0.35);
}

.submit-btn:disabled {
  background-color: #cbd5e1;
  cursor: not-allowed;
  box-shadow: none;
}

.submit-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.loading-btn-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Items Preview in Summary */
.items-preview {
  max-height: 280px;
  overflow-y: auto;
  margin-bottom: 20px;
  padding-inline-end: 4px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.preview-item img {
  width: 52px;
  height: 52px;
  object-fit: contain;
  background: #f8fafc;
  padding: 4px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.item-details { flex: 1; min-width: 0; }

.item-details h4 {
  font-size: 0.9rem;
  margin: 0 0 4px 0;
  color: #0f172a;
  font-weight: 700;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.preview-variant-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
}

.prev-tag {
  font-size: 0.72rem;
  font-weight: 700;
  background: #f1f5f9;
  color: #334155;
  padding: 1px 6px;
  border-radius: 6px;
}

.weight-tag {
  background: #ecfdf5;
  color: #059669;
}

.color-prev-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.color-dot-sm {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  border: 1px solid rgba(0,0,0,0.15);
}

.item-details p {
  margin: 0;
  font-size: 0.82rem;
  color: #64748b;
}

.item-total-price {
  font-weight: 800;
  color: #0f172a;
  font-size: 0.95rem;
}

/* Checkout Promo Box */
.checkout-promo-box {
  margin: 16px 0;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.promo-input-wrap {
  display: flex;
  gap: 8px;
}

.promo-input-field {
  flex: 1;
  padding: 8px 12px;
  min-height: 40px;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  outline: none;
  font-family: inherit;
}

.promo-input-field:focus {
  border-color: #059669;
}

.promo-btn {
  padding: 8px 16px;
  background: #0f172a;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}

.promo-btn:hover {
  background: #059669;
}

.promo-active-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  padding: 6px 12px;
  border-radius: 8px;
}

.promo-active-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #059669;
  font-weight: 700;
  font-size: 0.85rem;
}

.promo-del-btn {
  background: transparent;
  border: none;
  color: #ef4444;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
}

.summary-breakdown {
  border-top: 1px solid #f1f5f9;
  padding-top: 16px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
  color: #64748b;
}

.discount-highlight {
  color: #059669 !important;
  font-weight: 700;
}

.free-shipping {
  color: #059669;
  font-weight: 800;
}

.total-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  padding-top: 16px;
  border-top: 2px dashed #e2e8f0;
}

.total-price-num {
  color: #059669;
  font-size: 1.5rem;
}

/* Success Card Screen */
.success-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
}

.success-card {
  max-width: 520px;
  width: 100%;
  background: white;
  border-radius: 24px;
  padding: 48px 36px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.checkmark-svg {
  width: 72px;
  height: 72px;
  margin: 0 auto 20px;
  display: block;
}

.success-card h2 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 12px;
  justify-content: center;
  border: none;
  padding: 0;
}

.order-id-badge {
  font-size: 1.1rem;
  font-weight: 800;
  color: #059669;
  background: #ecfdf5;
  display: inline-block;
  padding: 6px 18px;
  border-radius: 999px;
  margin-bottom: 16px;
}

.payment-note-badge {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 28px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.paid-note {
  color: #059669;
}

.cod-note {
  color: #3b82f6;
}

.success-actions {
  display: flex;
  gap: 14px;
  justify-content: center;
}

.primary-success-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: #059669;
  color: white;
  border-radius: 12px;
  font-weight: 800;
  text-decoration: none;
  transition: all 0.2s ease;
}

.primary-success-btn:hover {
  background: #047857;
  transform: translateY(-2px);
}

.secondary-success-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  background: #f1f5f9;
  color: #334155;
  border-radius: 12px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;
}

.secondary-success-btn:hover {
  background: #e2e8f0;
}

.empty-notice {
  text-align: center;
  padding: 80px 24px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
  border: 1px solid #e2e8f0;
}

.empty-icon {
  font-size: 3.5rem;
  color: #cbd5e1;
  margin-bottom: 20px;
}

.empty-notice h2 {
  color: #0f172a;
  margin-bottom: 14px;
  border: none;
  justify-content: center;
}

.back-home {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 30px;
  min-height: 44px;
  background-color: #059669;
  color: white;
  text-decoration: none;
  border-radius: 12px;
  font-weight: 700;
  transition: all 0.2s ease;
  margin-top: 16px;
}

.back-home:hover {
  background-color: #047857;
  transform: translateY(-2px);
}

@media (max-width: 900px) {
  .checkout-grid {
    flex-direction: column-reverse; 
    gap: 24px;
  }
  .form-card, .summary-card {
    width: 100%;
    padding: 24px; 
  }
  .summary-card {
    position: static;
  }
}

@media (max-width: 480px) {
  .checkout-container {
    padding: 0 16px;
  }
  .page-title {
    font-size: 1.6rem;
    margin-bottom: 20px;
  }
  .form-card, .summary-card {
    padding: 18px 16px;
  }
  h2 {
    font-size: 1.15rem;
  }
  .card-grid-row {
    grid-template-columns: 1fr;
  }
  .success-actions {
    flex-direction: column;
  }
}
</style>