<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cartStore'
import { useWishlistStore } from '../stores/wishlistStore'
import { auth } from '../firebase/config'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t, locale } = useI18n()
const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const cartStore = useCartStore()
const wishlistStore = useWishlistStore()

const toggleFav = () => {
  wishlistStore.toggleWishlist(props.product, auth.currentUser?.uid)
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

const isFav = computed(() => wishlistStore.isInWishlist(props.product.id))

const isWeightBased = computed(() => props.product.unitType === 'weight')
const hasVariants = computed(() => {
  return (props.product.sizes && props.product.sizes.length > 0) ||
         (props.product.colors && props.product.colors.length > 0)
})

const handleAddToCart = () => {
  if (hasVariants.value) {
    router.push(`/product/${props.product.id}`)
  } else if (isWeightBased.value) {
    cartStore.addCart(props.product, { selectedWeight: 1.0 })
  } else {
    cartStore.addCart(props.product)
  }
}
</script>

<template>
  <div class="product-card">
   
    <!-- Top Image Container -->
    <div class="image-container">
      <span v-if="product.stock === 0" class="badge out-of-stock">
        {{ t('product.outOfStock') }}
      </span>
      <span class="badge category-badge">
        {{ translateCategory(product.category) }}
      </span>

      <!-- Variant / Weight Type Badge -->
      <span v-if="isWeightBased" class="badge weight-badge">
        <i class="fa-solid fa-weight-scale"></i> {{ t('variants.soldByWeight') }}
      </span>
      <span v-else-if="hasVariants" class="badge variant-options-badge">
        <i class="fa-solid fa-layer-group"></i> {{ t('variants.hasVariantsBadge') }}
      </span>
      
      <button 
        type="button" 
        class="favorite-btn" 
        :class="{ 'is-fav': isFav }"
        :title="isFav ? t('wishlist.removeFromWishlist') : t('wishlist.addToWishlist')"
        :aria-label="isFav ? t('wishlist.removeFromWishlist') : t('wishlist.addToWishlist')"
        @click.prevent.stop="toggleFav"
      >
        <i :class="isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i>
      </button>

      <router-link :to="`/product/${product.id}`" class="img-link">
        <img :src="product.image" :alt="product.title" class="product-img" loading="lazy">
      </router-link>
    </div>
    
    <!-- Middle Content Area -->
    <div class="card-content">
      <div class="rating">
        <div class="stars">
          <i class="fa-solid fa-star"></i>
          <span>{{ product.rating?.rate || product.averageRating || 0 }}</span>
        </div>
        <span class="reviews">({{ product.rating?.count || product.reviewCount || 0 }})</span>
      </div>

      <h3 class="title" :title="product.title">
        <router-link :to="`/product/${product.id}`" class="title-link">
          {{ product.title }}
        </router-link>
      </h3>
    </div>

    <!-- Sticky Bottom Card Footer -->
    <div class="card-footer">
      <div class="price-container">
        <span class="currency">$</span>
        <span class="price">{{ Number(product.price).toFixed(2) }}</span>
        <span v-if="isWeightBased" class="unit-sub-label">{{ t('variants.perKg') }}</span>
      </div>
      
      <div class="actions">
        <router-link 
          class="icon-btn details-btn" 
          :to="`/product/${product.id}`" 
          :title="t('product.viewDetails')"
          :aria-label="t('product.viewDetails')"
        >
          <i class="fa-regular fa-eye"></i>
        </router-link>
        
        <button 
          type="button"
          class="primary-btn add-to-cart" 
          :disabled="product.stock === 0"
          :title="product.stock === 0 ? t('product.unavailable') : (hasVariants ? t('variants.hasVariantsBadge') : t('product.addToCart'))"
          @click="handleAddToCart"
        >
          <i :class="hasVariants ? 'fa-solid fa-sliders' : 'fa-solid fa-cart-shopping'"></i>
          <span class="btn-text">
            {{ product.stock === 0 ? t('product.unavailable') : (hasVariants ? t('variants.hasVariantsBadge') : t('common.add')) }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(226, 232, 240, 0.9);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.product-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.08);
  border-color: #cbd5e1;
}

.image-container {
  position: relative;
  aspect-ratio: 1 / 1;
  width: 100%;
  background: #f8fafc;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  mix-blend-mode: multiply;
  transition: transform 0.4s ease;
}

.img-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.product-card:hover .product-img {
  transform: scale(1.08);
}

.badge {
  position: absolute;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  z-index: 2;
  letter-spacing: 0.3px;
}

.category-badge {
  top: 12px;
  inset-inline-end: 12px;
  background: rgba(255, 255, 255, 0.92);
  color: #475569;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
}

.favorite-btn {
  position: absolute;
  top: 12px;
  inset-inline-start: 12px;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(226, 232, 240, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  cursor: pointer;
  z-index: 5;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.favorite-btn:hover {
  transform: scale(1.1);
  color: #ef4444;
  background: #ffffff;
}

.favorite-btn.is-fav {
  color: #ef4444;
  background: #fef2f2;
  border-color: #fee2e2;
}

.out-of-stock {
  top: 60px;
  inset-inline-start: 12px;
  background: #ef4444;
  color: white;
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
}

.weight-badge {
  top: 48px;
  inset-inline-end: 12px;
  background: rgba(16, 185, 129, 0.95);
  color: white;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.25);
}

.variant-options-badge {
  top: 48px;
  inset-inline-end: 12px;
  background: rgba(79, 70, 229, 0.92);
  color: white;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.25);
}

.card-content {
  padding: 16px 18px 10px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.stars {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #f59e0b;
  font-size: 0.88rem;
  font-weight: 700;
}

.reviews {
  font-size: 0.78rem;
  color: #94a3b8;
}

.title {
  font-size: 0.98rem;
  line-height: 1.45;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-weight: 700;
}

.title-link {
  color: #0f172a;
  text-decoration: none;
  transition: color 0.2s ease;
}

.title-link:hover {
  color: #059669;
}

.card-footer {
  padding: 14px 18px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(241, 245, 249, 0.9);
  margin-top: auto;
  gap: 8px;
}

.price-container {
  display: flex;
  align-items: baseline;
  gap: 2px;
  color: #0f172a;
}

.currency {
  font-size: 0.85rem;
  font-weight: 700;
}

.price {
  font-size: 1.3rem;
  font-weight: 800;
  color: #0f172a;
}

.unit-sub-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 700;
  margin-inline-start: 2px;
}

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.icon-btn {
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: 12px;
  background: #f1f5f9;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-size: 1.05rem;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.primary-btn {
  height: 44px;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  background: #059669;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.2);
}

.primary-btn:hover:not(:disabled) {
  background: #047857;
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(5, 150, 105, 0.3);
}

.primary-btn:active:not(:disabled) {
  transform: translateY(0);
}

.primary-btn:disabled {
  background: #cbd5e1;
  color: #94a3b8;
  cursor: not-allowed;
  box-shadow: none;
}

@media (max-width: 480px) {
  .card-content {
    padding: 12px 12px 8px;
  }
  
  .card-footer {
    padding: 10px 12px 12px;
  }

  .price {
    font-size: 1.15rem;
  }

  .primary-btn {
    padding: 0 12px;
  }
  
  .btn-text {
    display: none;
  }
}
</style>