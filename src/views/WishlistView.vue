<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWishlistStore } from '../stores/wishlistStore'
import { useCartStore } from '../stores/cartStore'
import { auth } from '../firebase/config'
import { useI18n } from 'vue-i18n'

const wishlistStore = useWishlistStore()
const cartStore = useCartStore()
const router = useRouter()
const { t, locale } = useI18n()

const isRtl = computed(() => locale.value === 'ar')

const handleMoveAllToCart = async () => {
  const items = [...wishlistStore.wishlist]
  for (const item of items) {
    await wishlistStore.moveToCart(item, auth.currentUser?.uid)
  }
  cartStore.openMiniCart()
}

const handleMoveSingle = async (item) => {
  await wishlistStore.moveToCart(item, auth.currentUser?.uid)
  cartStore.openMiniCart()
}

const handleRemove = async (productId) => {
  await wishlistStore.removeFromWishlist(productId, auth.currentUser?.uid)
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
</script>

<template>
  <div class="wishlist-page">
    <div class="wishlist-container">
      
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="icon-wrap">
            <i class="fa-solid fa-heart"></i>
          </div>
          <div>
            <h1>{{ t('wishlist.title') }}</h1>
            <p>{{ t('wishlist.subtitle') }}</p>
          </div>
        </div>

        <div v-if="wishlistStore.count > 0" class="header-actions">
          <button type="button" class="move-all-btn" @click="handleMoveAllToCart">
            <i class="fa-solid fa-cart-arrow-down"></i>
            <span>{{ t('wishlist.moveAllToCart', { count: wishlistStore.count }) }}</span>
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="wishlistStore.count === 0" class="empty-wishlist-card">
        <div class="empty-heart-bubble">
          <i class="fa-regular fa-heart"></i>
        </div>
        <h2>{{ t('wishlist.emptyTitle') }}</h2>
        <p>{{ t('wishlist.emptyDesc') }}</p>
        <button type="button" class="explore-btn" @click="router.push('/')">
          <i class="fa-solid fa-bag-shopping"></i>
          <span>{{ t('wishlist.exploreNow') }}</span>
        </button>
      </div>

      <!-- Wishlist Grid -->
      <div v-else class="wishlist-grid">
        <div 
          v-for="item in wishlistStore.wishlist" 
          :key="item.id" 
          class="wishlist-card"
        >
          <!-- Card Image & Remove Badge -->
          <div class="card-image-wrap" @click="router.push(`/product/${item.id}`)">
            <img :src="item.image" :alt="item.title" loading="lazy" />
            <span class="category-tag">{{ translateCategory(item.category) }}</span>
            <button 
              type="button" 
              class="remove-favorite-btn" 
              :title="t('wishlist.removeFromWishlist')"
              :aria-label="t('wishlist.removeFromWishlist')"
              @click.stop="handleRemove(item.id)"
            >
              <i class="fa-solid fa-heart"></i>
            </button>
          </div>

          <!-- Card Content -->
          <div class="card-content">
            <h3 class="product-title" :title="item.title" @click="router.push(`/product/${item.id}`)">
              {{ item.title }}
            </h3>

            <div class="price-row">
              <span class="product-price">${{ Number(item.price).toFixed(2) }}</span>
              <span v-if="item.stock > 0" class="stock-status in-stock">
                <i class="fa-solid fa-circle-check"></i> {{ t('wishlist.inStock') }}
              </span>
              <span v-else class="stock-status out-stock">
                <i class="fa-solid fa-circle-xmark"></i> {{ t('wishlist.outOfStock') }}
              </span>
            </div>

            <!-- Card Actions -->
            <div class="card-actions">
              <button 
                type="button" 
                class="move-to-cart-btn" 
                :disabled="item.stock === 0"
                @click.stop="handleMoveSingle(item)"
              >
                <i class="fa-solid fa-cart-shopping"></i>
                <span>{{ t('wishlist.moveToCart') }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.wishlist-page {
  padding: 36px 0;
  width: 100%;
}

.wishlist-container {
  max-width: 1360px;
  margin: 0 auto;
  padding: 0 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 18px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #fef2f2;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  border: 1px solid #fee2e2;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
  flex-shrink: 0;
}

.page-header h1 {
  margin: 0 0 4px 0;
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
}

.page-header p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.move-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #059669;
  color: #ffffff;
  border: none;
  padding: 12px 22px;
  min-height: 44px;
  border-radius: 12px;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);
}

.move-all-btn:hover {
  background: #047857;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(5, 150, 105, 0.35);
}

/* Empty State */
.empty-wishlist-card {
  text-align: center;
  padding: 70px 24px;
  background: #ffffff;
  border-radius: 20px;
  border: 1px dashed #cbd5e1;
  max-width: 600px;
  margin: 40px auto;
}

.empty-heart-bubble {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: #fef2f2;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  margin: 0 auto 20px;
  border: 1px solid #fee2e2;
}

.empty-wishlist-card h2 {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 10px 0;
}

.empty-wishlist-card p {
  color: #64748b;
  font-size: 0.92rem;
  line-height: 1.6;
  margin: 0 0 24px 0;
}

.explore-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #059669;
  color: #ffffff;
  border: none;
  padding: 12px 28px;
  min-height: 44px;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(5, 150, 105, 0.3);
}

.explore-btn:hover {
  background: #047857;
  transform: translateY(-2px);
}

/* Standardized responsive grid: 4 columns on desktop */
.wishlist-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.wishlist-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  overflow: hidden;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.wishlist-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px -4px rgba(0, 0, 0, 0.08);
  border-color: #cbd5e1;
}

.card-image-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 16px;
}

.card-image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.wishlist-card:hover .card-image-wrap img {
  transform: scale(1.05);
}

.category-tag {
  position: absolute;
  top: 12px;
  inset-inline-end: 12px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(4px);
  border: 1px solid #e2e8f0;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #475569;
}

.remove-favorite-btn {
  position: absolute;
  top: 12px;
  inset-inline-start: 12px;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid #fee2e2;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
  transition: all 0.2s ease;
  font-size: 1.1rem;
}

.remove-favorite-btn:hover {
  transform: scale(1.15);
  background: #fef2f2;
}

.card-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.product-title {
  margin: 0 0 10px 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.45;
  cursor: pointer;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-title:hover {
  color: #059669;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.product-price {
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
}

.stock-status {
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stock-status.in-stock { color: #059669; }
.stock-status.out-stock { color: #ef4444; }

.card-actions {
  margin-top: auto;
}

.move-to-cart-btn {
  width: 100%;
  padding: 11px 16px;
  min-height: 44px;
  background: #059669;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  font-family: inherit;
}

.move-to-cart-btn:hover:not(:disabled) {
  background: #047857;
  transform: translateY(-1px);
}

.move-to-cart-btn:disabled {
  background: #cbd5e1;
  color: #94a3b8;
  cursor: not-allowed;
}

/* Tablet (768px - 1024px): 3 columns */
@media (max-width: 1024px) {
  .wishlist-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
}

/* Tablet Small (640px - 768px): 2 columns */
@media (max-width: 768px) {
  .wishlist-container {
    padding: 0 16px;
  }
  
  .wishlist-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .move-all-btn {
    width: 100%;
    justify-content: center;
  }
}

/* Mobile (< 400px): 1 column */
@media (max-width: 400px) {
  .wishlist-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
