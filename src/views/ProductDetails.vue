<template>
  <div class="product-details-container">
    
    <!-- Direction-aware Back Button -->
    <RouterLink to="/" class="back-btn">
      <i :class="isRtl ? 'fa-solid fa-arrow-right' : 'fa-solid fa-arrow-left'"></i>
      <span>{{ t('product.backToStore') }}</span>
    </RouterLink>

    <!-- Shimmer Skeleton Loading -->
    <div v-if="isloading" class="skeleton-details-wrapper">
      <div class="skeleton-shimmer skeleton-img-box"></div>
      <div class="skeleton-info-box">
        <div class="skeleton-shimmer skeleton-cat"></div>
        <div class="skeleton-shimmer skeleton-title"></div>
        <div class="skeleton-shimmer skeleton-stars"></div>
        <div class="skeleton-shimmer skeleton-desc"></div>
        <div class="skeleton-shimmer skeleton-price"></div>
        <div class="skeleton-shimmer skeleton-actions"></div>
      </div>
    </div>
    
    <!-- Product Content Container -->
    <div v-else-if="product" class="product-container">
      
      <div class="details-wrapper">
        <!-- Image Section -->
        <div class="image-section">
          <span v-if="product.stock === 0" class="badge out-stock">
            {{ t('product.outOfStock') }}
          </span>
          <span v-else-if="product.stock < 10" class="badge low-stock">
            {{ t('product.lowStock') }}
          </span>
          
          <img :src="product.image" :alt="product.title" class="main-image">
        </div>
        
        <!-- Info Section -->
        <div class="info-section">
          <span class="category-pill">{{ translateCategory(product.category) }}</span>
          <h1 class="product-title">{{ product.title }}</h1>
          
          <!-- Rating Summary Box -->
          <div class="rating-box">
            <div class="stars">
              <i class="fa-solid fa-star"></i>
              <span class="rate-num">{{ product.averageRating ?? product.rating?.rate ?? 0 }}</span>
            </div>
            <span class="reviews-count">
              {{ t('product.customerReviews', { count: product.reviewCount ?? product.rating?.count ?? reviews.length }) }}
            </span>
          </div>

          <p class="desc">{{ product.description }}</p>
          
          <div class="price-stock-row">
            <div class="price-display-wrap">
              <h2 class="price">${{ calculatedPrice.toFixed(2) }}</h2>
              <span v-if="product.unitType === 'weight'" class="per-unit-hint">
                (${{ Number(product.price).toFixed(2) }} {{ t('variants.perKg') }})
              </span>
            </div>
            <span class="stock-status" :class="{ 'red': product.stock === 0 }">
              <i class="fa-solid fa-box"></i> 
              {{ product.stock > 0 ? (product.unitType === 'weight' ? `${product.stock} ${t('variants.kg')}` : t('product.stockAvailable', { count: product.stock })) : t('product.unavailable') }}
            </span>
          </div>

          <!-- Dynamic Variant Selector 1: Weight Selection (for weight-based produce) -->
          <div v-if="product.unitType === 'weight'" class="variant-selector-box weight-box">
            <div class="variant-label-row">
              <span class="variant-title"><i class="fa-solid fa-scale-balanced"></i> {{ t('variants.chooseWeight') }}:</span>
              <span class="selected-val-badge">{{ selectedWeight }} {{ t('variants.kg') }}</span>
            </div>

            <!-- Quick-Pick Weight Chips -->
            <div class="weight-chips-row">
              <button 
                type="button" 
                v-for="preset in [0.25, 0.5, 1.0, 2.0]" 
                :key="preset"
                class="weight-chip"
                :class="{ 'active': selectedWeight === preset }"
                @click="selectedWeight = preset"
              >
                {{ preset }} {{ t('variants.kg') }}
              </button>
            </div>

            <!-- Fractional Stepper (0.25 kg increments) -->
            <div class="fractional-stepper-row">
              <span class="stepper-label">تعديل دقيق:</span>
              <div class="weight-stepper">
                <button 
                  type="button" 
                  class="stepper-action-btn" 
                  :disabled="selectedWeight <= 0.25"
                  @click="adjustWeight(-0.25)"
                >
                  <i class="fa-solid fa-minus"></i>
                </button>
                <span class="stepper-display">{{ selectedWeight }} {{ t('variants.kg') }}</span>
                <button 
                  type="button" 
                  class="stepper-action-btn" 
                  @click="adjustWeight(0.25)"
                >
                  <i class="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Dynamic Variant Selector 2: Size Selector (for apparel/footwear) -->
          <div v-if="product.sizes && product.sizes.length > 0" class="variant-selector-box">
            <div class="variant-label-row">
              <span class="variant-title"><i class="fa-solid fa-ruler-horizontal"></i> {{ t('variants.size') }}:</span>
              <span class="selected-val-badge" v-if="selectedSize">{{ selectedSize }}</span>
            </div>
            <div class="sizes-pills-row">
              <button 
                type="button" 
                v-for="s in product.sizes" 
                :key="s"
                class="size-pill-btn"
                :class="{ 'active': selectedSize === s }"
                @click="selectedSize = s; variantValidationError = ''"
              >
                {{ s }}
              </button>
            </div>
          </div>

          <!-- Dynamic Variant Selector 3: Color Selector (circular swatches) -->
          <div v-if="product.colors && product.colors.length > 0" class="variant-selector-box">
            <div class="variant-label-row">
              <span class="variant-title"><i class="fa-solid fa-palette"></i> {{ t('variants.color') }}:</span>
              <span class="selected-val-badge" v-if="selectedColor">{{ selectedColor.name }}</span>
            </div>
            <div class="colors-swatches-row">
              <button 
                type="button" 
                v-for="c in product.colors" 
                :key="c.name"
                class="color-swatch-circle"
                :class="{ 'active': selectedColor?.name === c.name }"
                :style="{ backgroundColor: c.hex }"
                :title="c.name"
                @click="selectedColor = c; variantValidationError = ''"
              >
                <i v-if="selectedColor?.name === c.name" class="fa-solid fa-check check-indicator"></i>
              </button>
            </div>
          </div>

          <!-- Quantity Stepper for Piece Items -->
          <div v-if="product.unitType !== 'weight'" class="piece-quantity-row">
            <span class="variant-title">{{ t('variants.stockPiece') }}:</span>
            <div class="piece-stepper">
              <button type="button" class="stepper-action-btn" :disabled="selectedQuantity <= 1" @click="selectedQuantity--">
                <i class="fa-solid fa-minus"></i>
              </button>
              <span class="stepper-display">{{ selectedQuantity }}</span>
              <button type="button" class="stepper-action-btn" :disabled="selectedQuantity >= product.stock" @click="selectedQuantity++">
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
          </div>

          <!-- Validation Error Banner -->
          <div v-if="variantValidationError" class="variant-error-alert">
            <i class="fa-solid fa-circle-exclamation"></i>
            <span>{{ variantValidationError }}</span>
          </div>

          <!-- Actions Row with Wishlist Toggle -->
          <div class="details-actions-row">
            <button 
              type="button"
              class="add-to-cart-btn pulse-cta" 
              :disabled="product.stock === 0"
              :class="{ 'disabled-btn': product.stock === 0 }"
              @click="handleAddToCartWithVariants"
            >
              <i class="fa-solid fa-cart-shopping"></i>
              <span>{{ product.stock === 0 ? t('product.unavailable') : t('product.addToCart') }}</span>
            </button>

            <button 
              type="button" 
              class="details-fav-btn"
              :class="{ 'is-fav': wishlistStore.isInWishlist(product.id) }"
              :title="wishlistStore.isInWishlist(product.id) ? t('wishlist.removeFromWishlist') : t('wishlist.addToWishlist')"
              :aria-label="wishlistStore.isInWishlist(product.id) ? t('wishlist.removeFromWishlist') : t('wishlist.addToWishlist')"
              @click="toggleWishlist"
            >
              <i :class="wishlistStore.isInWishlist(product.id) ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Customer Reviews & Breakdown Section -->
      <div class="reviews-section">
        <div class="reviews-section-header">
          <h3>{{ t('product.ratingBreakdown') }} ({{ reviews.length }})</h3>
        </div>

        <!-- Rating Breakdown Card (Amazon/Shopify Style) -->
        <div class="rating-breakdown-card">
          <div class="rating-overview">
            <div class="score-number">{{ product.averageRating ?? product.rating?.rate ?? 0 }}</div>
            <div class="overview-stars">
              <i v-for="n in 5" :key="n" class="fa-solid fa-star" :class="{ 'gold': n <= Math.round(product.averageRating ?? product.rating?.rate ?? 0) }"></i>
            </div>
            <span class="total-reviews-label">
              {{ product.reviewCount ?? product.rating?.count ?? reviews.length }} {{ t('product.verifiedReviews') }}
            </span>
          </div>

          <div class="breakdown-bars">
            <div v-for="item in ratingBreakdown" :key="item.stars" class="bar-row">
              <span class="star-label">{{ item.stars }} <i class="fa-solid fa-star"></i></span>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: `${item.percent}%` }"></div>
              </div>
              <span class="percent-label">{{ item.percent }}%</span>
            </div>
          </div>
        </div>
        
        <div v-if="loadingReviews" class="loading-reviews">
          <div class="loader-spinner-sm"></div>
          <p>{{ t('product.loadingReviews') }}</p>
        </div>

        <!-- Reviews Grid -->
        <div v-else-if="reviews && reviews.length > 0" class="reviews-grid">
          <div v-for="rev in reviews" :key="rev.id" class="review-card">
            <div class="review-header">
              <div class="reviewer-profile">
                <div class="rev-avatar">
                  <img v-if="rev.userPhoto" :src="rev.userPhoto" alt="" class="rev-avatar-img" />
                  <span v-else>{{ getInitials(rev.userName) }}</span>
                </div>
                <div class="reviewer-meta">
                  <div class="name-badge-row">
                    <span class="reviewer-name">{{ rev.userName }}</span>
                    <span v-if="isVerifiedBuyer(rev)" class="verified-buyer-badge">
                      <i class="fa-solid fa-circle-check"></i> {{ t('product.verifiedBuyer') }}
                    </span>
                  </div>
                  <span class="review-date">{{ formatRelativeTime(rev) }}</span>
                </div>
              </div>

              <div class="review-stars">
                <i v-for="n in 5" :key="n" class="fa-solid fa-star" :class="{ 'gold': n <= rev.rating }"></i>
              </div>
            </div>

            <p class="review-comment">"{{ rev.comment }}"</p>
          </div>
        </div>

        <div v-else class="no-reviews">
          <p>{{ t('product.noReviews') }}</p>
        </div>
      </div>

      <!-- Add Review Form Component -->
      <ReviewForm :productId="product.id" @reviewAdded="handleReviewAdded" />
    </div>
    
    <!-- Product Not Found State -->
    <div v-else class="error-msg">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <h2>{{ t('product.notFound') }}</h2>
      <RouterLink to="/" class="back-home-btn">{{ t('product.goHome') }}</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProductStore } from '../stores/productstore'
import { useCartStore } from '../stores/cartStore'
import { useWishlistStore } from '../stores/wishlistStore'
import { db, auth } from '../firebase/config'
import { collection, getDocs } from 'firebase/firestore'
import { useI18n } from 'vue-i18n'
import ReviewForm from '../components/ReviewForm.vue'

const { t, locale } = useI18n()
const isRtl = computed(() => locale.value === 'ar')

const route = useRoute() 
const product = ref(null)
const reviews = ref([])
const isloading = ref(true)
const loadingReviews = ref(false)
const store = useProductStore()
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()
const verifiedUserIds = ref(new Set())

const selectedWeight = ref(1.0)
const selectedSize = ref(null)
const selectedColor = ref(null)
const selectedQuantity = ref(1)
const variantValidationError = ref('')

const calculatedPrice = computed(() => {
  if (!product.value) return 0
  if (product.value.unitType === 'weight') {
    return Number((Number(product.value.price) * selectedWeight.value).toFixed(2))
  }
  return Number((Number(product.value.price) * selectedQuantity.value).toFixed(2))
})

const adjustWeight = (delta) => {
  const next = Number((selectedWeight.value + delta).toFixed(2))
  if (next >= 0.25) {
    selectedWeight.value = next
  }
}

const handleAddToCartWithVariants = () => {
  variantValidationError.value = ''
  
  if (product.value.sizes && product.value.sizes.length > 0 && !selectedSize.value) {
    variantValidationError.value = t('variants.selectVariantRequired')
    return
  }
  if (product.value.colors && product.value.colors.length > 0 && !selectedColor.value) {
    variantValidationError.value = t('variants.selectVariantRequired')
    return
  }

  cartStore.addCart(product.value, {
    selectedSize: selectedSize.value,
    selectedColor: selectedColor.value,
    selectedWeight: selectedWeight.value,
    unitType: product.value.unitType || 'piece',
    quantity: product.value.unitType === 'weight' ? selectedWeight.value : selectedQuantity.value
  })
}

const initDefaultSelections = () => {
  if (!product.value) return
  if (product.value.sizes && product.value.sizes.length > 0) {
    selectedSize.value = product.value.sizes[0]
  } else {
    selectedSize.value = null
  }

  if (product.value.colors && product.value.colors.length > 0) {
    selectedColor.value = product.value.colors[0]
  } else {
    selectedColor.value = null
  }

  if (product.value.unitType === 'weight') {
    selectedWeight.value = 1.0
  } else {
    selectedQuantity.value = 1
  }
}

const toggleWishlist = () => {
  if (product.value) {
    wishlistStore.toggleWishlist(product.value, auth.currentUser?.uid)
  }
}

const translateCategory = (cat) => {
  if (!cat) return ''
  const cleanKey = cat.trim().toLowerCase().replace(/'/g, '')
  const translation = t(`categories['${cleanKey}']`)
  if (translation === `categories['${cleanKey}']` || translation.includes('categories')) {
    return cat 
  }
  return translation
}

const checkVerifiedBuyers = async (productId) => {
  try {
    const ordersSnap = await getDocs(collection(db, 'orders'))
    ordersSnap.forEach(orderDoc => {
      const data = orderDoc.data()
      if (data.userId && Array.isArray(data.items)) {
        if (data.items.some(item => item.id === productId)) {
          verifiedUserIds.value.add(data.userId)
        }
      }
    })
  } catch (err) {
    console.warn("Could not check verified buyers:", err)
  }
}

const isVerifiedBuyer = (rev) => {
  return rev.isVerified || rev.verifiedBuyer || (rev.userId && verifiedUserIds.value.has(rev.userId))
}

const getInitials = (name) => {
  if (!name) return 'U'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const formatRelativeTime = (rev) => {
  const dateVal = rev.createdAt?.toDate ? rev.createdAt.toDate() : (rev.date ? new Date(rev.date) : null)
  if (!dateVal || isNaN(dateVal.getTime())) return rev.date || t('product.timeJustNow')

  const diffMs = Date.now() - dateVal.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) {
    return t('product.timeJustNow')
  } else if (diffHours < 24) {
    return t('product.timeHoursAgo', { count: diffHours })
  } else if (diffDays <= 30) {
    return t('product.timeDaysAgo', { count: diffDays })
  }
  return dateVal.toLocaleDateString(locale.value === 'ar' ? 'ar-EG' : 'en-US')
}

const ratingBreakdown = computed(() => {
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  const total = reviews.value.length

  if (total === 0) {
    return [5, 4, 3, 2, 1].map(stars => ({ stars, count: 0, percent: 0 }))
  }

  reviews.value.forEach(r => {
    const rate = Math.round(Number(r.rating) || 5)
    if (counts[rate] !== undefined) counts[rate]++
  })

  return [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: counts[stars],
    percent: Math.round((counts[stars] / total) * 100)
  }))
})

const handleReviewAdded = (newReview) => {
  reviews.value.unshift(newReview)
  const currentCount = product.value.reviewCount ?? product.value.rating?.count ?? (reviews.value.length - 1)
  const currentRate = product.value.averageRating ?? product.value.rating?.rate ?? 5
  
  const updatedCount = currentCount + 1
  const updatedAverage = Number((((currentRate * currentCount) + Number(newReview.rating)) / updatedCount).toFixed(1))
  
  product.value.reviewCount = updatedCount
  product.value.averageRating = updatedAverage
  if (!product.value.rating) product.value.rating = {}
  product.value.rating.count = updatedCount
  product.value.rating.rate = updatedAverage
}

onMounted(async () => {
  const productId = route.params.id
  if (store.products.length === 0) {
    await store.fetchdata()
  }
  
  product.value = store.products.find(p => p.id == productId)
  if (!product.value) {
    product.value = await store.getProductById(productId)
  }
  isloading.value = false
  
  if (product.value) {
    initDefaultSelections()
    loadingReviews.value = true
    try {
      const revs = await store.fetchProductReviews(product.value.id)
      reviews.value = revs
      await checkVerifiedBuyers(product.value.id)
    } finally {
      loadingReviews.value = false
    }
  }
})
</script>

<style scoped>
.product-details-container {
  max-width: 1200px;
  margin: 32px auto;
  padding: 0 24px;
  width: 100%;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
  color: #475569;
  font-weight: 700;
  font-size: 0.95rem;
  padding: 8px 16px;
  min-height: 44px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  text-decoration: none;
  transition: all 0.2s ease;
}

.back-btn:hover {
  color: #059669;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.product-container {
  display: flex;
  flex-direction: column;
}

.details-wrapper {
  display: flex;
  gap: 48px;
  background: #ffffff;
  padding: 40px;
  border-radius: 24px;
  box-shadow: 0 4px 25px -2px rgba(0,0,0,0.04);
  border: 1px solid rgba(226, 232, 240, 0.85);
}

.image-section {
  flex: 1;
  position: relative;
  background: #f8fafc;
  border-radius: 20px;
  padding: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 420px;
  border: 1px solid #f1f5f9;
}

.main-image {
  max-width: 100%;
  max-height: 380px;
  object-fit: contain;
  mix-blend-mode: multiply;
  transition: transform 0.4s ease;
}

.main-image:hover {
  transform: scale(1.04);
}

.badge {
  position: absolute;
  top: 18px;
  inset-inline-start: 18px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 800;
  color: white;
  z-index: 2;
}

.out-stock {
  background: #ef4444;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.low-stock {
  background: #f59e0b;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.category-pill {
  display: inline-block;
  align-self: flex-start;
  padding: 4px 14px;
  background: #ecfdf5;
  color: #059669;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 800;
  margin-bottom: 14px;
}

.product-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.35;
  margin: 0 0 16px 0;
}

.rating-box {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.stars {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #f59e0b;
  font-size: 1rem;
}

.rate-num {
  font-weight: 800;
  color: #0f172a;
  font-size: 1.05rem;
}

.reviews-count {
  color: #64748b;
  font-size: 0.88rem;
}

.desc {
  font-size: 0.98rem;
  line-height: 1.8;
  color: #475569;
  margin: 0 0 28px 0;
}

.price-stock-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  margin-bottom: 28px;
}

.price {
  font-size: 2rem;
  font-weight: 900;
  color: #0f172a;
  margin: 0;
}

.stock-status {
  font-size: 0.9rem;
  font-weight: 700;
  color: #059669;
  display: flex;
  align-items: center;
  gap: 8px;
}

.stock-status.red {
  color: #ef4444;
}

/* Variant Selection Styles */
.variant-selector-box {
  margin-bottom: 22px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
}

.variant-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.variant-title {
  font-size: 0.92rem;
  font-weight: 700;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 8px;
}

.selected-val-badge {
  font-size: 0.8rem;
  font-weight: 700;
  background: #e2e8f0;
  color: #1e293b;
  padding: 2px 10px;
  border-radius: 999px;
}

.weight-chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.weight-chip-btn {
  padding: 8px 16px;
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 700;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.weight-chip-btn:hover {
  border-color: #059669;
  color: #059669;
}

.weight-chip-btn.active {
  background: #ecfdf5;
  border-color: #059669;
  color: #059669;
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.15);
}

.fractional-stepper-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px dashed #cbd5e1;
}

.stepper-label {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
}

.weight-stepper, .piece-stepper {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 10px;
  overflow: hidden;
}

.stepper-action-btn {
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #334155;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.stepper-action-btn:hover:not(:disabled) {
  background: #f1f5f9;
  color: #059669;
}

.stepper-action-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.stepper-display {
  padding: 0 14px;
  font-weight: 800;
  font-size: 0.92rem;
  color: #0f172a;
  min-width: 70px;
  text-align: center;
}

.sizes-pills-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.size-pill-btn {
  min-width: 44px;
  height: 42px;
  padding: 0 14px;
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.9rem;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.size-pill-btn:hover {
  border-color: #059669;
  color: #059669;
  transform: translateY(-1px);
}

.size-pill-btn.active {
  background: #0f172a;
  border-color: #0f172a;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
}

.colors-swatches-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.color-swatch-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 1.5px #cbd5e1;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.color-swatch-circle:hover {
  transform: scale(1.12);
  box-shadow: 0 0 0 2px #059669;
}

.color-swatch-circle.active {
  transform: scale(1.15);
  box-shadow: 0 0 0 3px #059669, 0 4px 10px rgba(5, 150, 105, 0.25);
}

.check-indicator {
  color: #ffffff;
  font-size: 0.75rem;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.8));
}

.piece-quantity-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.variant-error-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #ef4444;
  font-weight: 700;
  font-size: 0.88rem;
  border-radius: 12px;
  margin-bottom: 20px;
  animation: shake 0.3s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.details-actions-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.add-to-cart-btn {
  flex: 1;
  padding: 16px 28px;
  min-height: 52px;
  background: #059669;
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 1.05rem;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: all 0.2s ease;
  font-family: inherit;
  box-shadow: 0 4px 16px rgba(5, 150, 105, 0.25);
}

.add-to-cart-btn:hover:not(:disabled) {
  background: #047857;
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(5, 150, 105, 0.35);
}

.disabled-btn {
  background: #cbd5e1 !important;
  color: #64748b !important;
  cursor: not-allowed !important;
  box-shadow: none !important;
}

.details-fav-btn {
  width: 52px;
  height: 52px;
  min-width: 52px;
  min-height: 52px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.25rem;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.details-fav-btn:hover {
  transform: scale(1.08);
  color: #ef4444;
  border-color: #fecaca;
  background: #fef2f2;
}

.details-fav-btn.is-fav {
  color: #ef4444;
  background: #fef2f2;
  border-color: #fee2e2;
}

/* Skeletons */
.skeleton-details-wrapper {
  display: flex;
  gap: 40px;
  background: #ffffff;
  padding: 40px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
}

.skeleton-img-box {
  flex: 1;
  min-height: 420px;
  border-radius: 16px;
}

.skeleton-info-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-cat {
  width: 100px;
  height: 24px;
  border-radius: 6px;
}

.skeleton-title {
  width: 80%;
  height: 36px;
  border-radius: 8px;
}

.skeleton-stars {
  width: 140px;
  height: 22px;
  border-radius: 6px;
}

.skeleton-desc {
  width: 100%;
  height: 100px;
  border-radius: 8px;
}

.skeleton-price {
  width: 120px;
  height: 40px;
  border-radius: 8px;
}

.skeleton-actions {
  width: 220px;
  height: 50px;
  border-radius: 12px;
}

/* Reviews & Rating Breakdown */
.reviews-section {
  margin-top: 50px;
  background: #fff;
  padding: 36px;
  border-radius: 24px;
  box-shadow: 0 4px 20px -2px rgba(0,0,0,0.04);
  border: 1px solid rgba(226, 232, 240, 0.85);
}

.reviews-section-header h3 {
  font-size: 1.35rem;
  color: #0f172a;
  margin: 0 0 24px 0;
  font-weight: 800;
}

.rating-breakdown-card {
  display: flex;
  align-items: center;
  gap: 40px;
  background: #f8fafc;
  padding: 24px 30px;
  border-radius: 18px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  margin-bottom: 32px;
}

.rating-overview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 140px;
}

.score-number {
  font-size: 2.8rem;
  font-weight: 900;
  color: #0f172a;
  line-height: 1;
}

.overview-stars {
  display: flex;
  gap: 3px;
  color: #cbd5e1;
  font-size: 1.1rem;
}

.overview-stars .gold {
  color: #f59e0b;
}

.total-reviews-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
}

.breakdown-bars {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.star-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #334155;
  width: 44px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.star-label i {
  color: #f59e0b;
  font-size: 0.78rem;
}

.bar-track {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: #f59e0b;
  border-radius: 999px;
  transition: width 0.4s ease;
}

.percent-label {
  font-size: 0.82rem;
  color: #64748b;
  width: 40px;
  text-align: end;
  font-weight: 600;
}

.reviews-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-card {
  padding: 20px;
  background: #f8fafc;
  border-radius: 14px;
  border: 1px solid #f1f5f9;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.reviewer-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rev-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e0e7ff;
  color: #4338ca;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.95rem;
  flex-shrink: 0;
  overflow: hidden;
}

.rev-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.name-badge-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.reviewer-name {
  font-weight: 700;
  color: #0f172a;
  font-size: 0.95rem;
}

.verified-buyer-badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: #059669;
  background: #ecfdf5;
  padding: 2px 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.review-stars {
  display: flex;
  gap: 3px;
  color: #cbd5e1;
  font-size: 0.85rem;
}

.review-stars .gold {
  color: #f59e0b;
}

.review-comment {
  color: #334155;
  font-size: 0.92rem;
  line-height: 1.6;
  margin: 0;
}

.review-date {
  font-size: 0.75rem;
  color: #94a3b8;
}

.no-reviews {
  color: #94a3b8;
  text-align: center;
  padding: 24px;
  font-size: 0.95rem;
}

.loading-reviews {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 25px;
  color: #64748b;
  font-size: 0.95rem;
}

.loader-spinner-sm {
  width: 22px;
  height: 22px;
  border: 3px solid #f1f5f9;
  border-top: 3px solid #059669;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-msg {
  text-align: center;
  padding: 80px 20px;
  color: #64748b;
  font-size: 1.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.error-msg i {
  font-size: 3rem;
  color: #ef4444;
}

.back-home-btn {
  margin-top: 12px;
  padding: 12px 28px;
  min-height: 44px;
  background: #0f172a;
  color: white;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Tablet & Mobile Responsiveness */
@media (max-width: 900px) {
  .details-wrapper {
    flex-direction: column;
    padding: 24px;
    gap: 32px;
  }

  .skeleton-details-wrapper {
    flex-direction: column;
    padding: 24px;
    gap: 24px;
  }

  .image-section {
    min-height: 320px;
  }
}

@media (max-width: 640px) {
  .product-details-container {
    padding: 0 16px;
  }

  .rating-breakdown-card {
    flex-direction: column;
    gap: 24px;
    padding: 20px;
  }

  .rating-overview {
    min-width: 100%;
  }

  .breakdown-bars {
    width: 100%;
  }

  .reviews-section {
    padding: 20px 16px;
  }

  .price-stock-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .product-title {
    font-size: 1.4rem;
  }

  .price {
    font-size: 1.6rem;
  }

  .details-actions-row {
    flex-direction: column;
    width: 100%;
  }

  .add-to-cart-btn {
    width: 100%;
  }

  .details-fav-btn {
    width: 100%;
    border-radius: 12px;
  }
}
</style>