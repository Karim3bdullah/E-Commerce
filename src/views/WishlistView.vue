<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWishlistStore } from '../stores/wishlistStore'
import { useCartStore } from '../stores/cartStore'
import { auth } from '../firebase/config'

const wishlistStore = useWishlistStore()
const cartStore = useCartStore()
const router = useRouter()

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
            <h1>قائمة أمنياتي (المفضلة)</h1>
            <p>جميع المنتجات التي حفظتها للشراء لاحقاً في مكان واحد</p>
          </div>
        </div>

        <div v-if="wishlistStore.count > 0" class="header-actions">
          <button type="button" class="move-all-btn" @click="handleMoveAllToCart">
            <i class="fa-solid fa-cart-arrow-down"></i>
            نقل الكل إلى السلة ({{ wishlistStore.count }})
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="wishlistStore.count === 0" class="empty-wishlist-card">
        <div class="empty-heart-bubble">
          <i class="fa-regular fa-heart"></i>
        </div>
        <h2>قائمة أمنياتك فارغة</h2>
        <p>لم تقم بإضافة أي منتجات إلى قائمة المفضلة بعد. تصفح أحدث المنتجات وأضف ما يعجبك بنقرة واحدة!</p>
        <button type="button" class="explore-btn" @click="router.push('/')">
          <i class="fa-solid fa-bag-shopping"></i>
          استكشف المنتجات الآن
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
            <span class="category-tag">{{ item.category }}</span>
            <button 
              type="button" 
              class="remove-favorite-btn" 
              title="إزالة من المفضلة"
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
                <i class="fa-solid fa-circle-check"></i> متوفر
              </span>
              <span v-else class="stock-status out-stock">
                <i class="fa-solid fa-circle-xmark"></i> نفذت الكمية
              </span>
            </div>

            <!-- Actions -->
            <div class="card-actions">
              <button 
                type="button" 
                class="move-cart-btn"
                :disabled="item.stock <= 0"
                @click="handleMoveSingle(item)"
              >
                <i class="fa-solid fa-cart-plus"></i>
                نقل إلى السلة
              </button>
              
              <button 
                type="button" 
                class="view-btn"
                @click="router.push(`/product/${item.id}`)"
                title="عرض التفاصيل"
              >
                <i class="fa-solid fa-arrow-left"></i>
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
  min-height: 80vh;
  padding: 40px 20px 80px;
  direction: rtl;
  background-color: #f8fafc;
}

.wishlist-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #fef2f2;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}

.header-left h1 {
  margin: 0 0 4px 0;
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
}

.header-left p {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
}

.move-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #059669;
  color: #ffffff;
  border: none;
  padding: 12px 22px;
  border-radius: 12px;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);
  transition: all 0.2s ease;
}

.move-all-btn:hover {
  background: #047857;
  transform: translateY(-2px);
}

/* Empty State */
.empty-wishlist-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 60px 24px;
  text-align: center;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(226, 232, 240, 0.8);
  max-width: 550px;
  margin: 40px auto;
}

.empty-heart-bubble {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: #fef2f2;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin: 0 auto 20px;
}

.empty-wishlist-card h2 {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 10px 0;
}

.empty-wishlist-card p {
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0 0 28px 0;
}

.explore-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #059669;
  color: #ffffff;
  border: none;
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(5, 150, 105, 0.3);
}

.explore-btn:hover {
  background: #047857;
  transform: translateY(-2px);
}

/* Wishlist Grid */
.wishlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}

.wishlist-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.8);
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
  right: 12px;
  background: rgba(255, 255, 255, 0.9);
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
  left: 12px;
  width: 36px;
  height: 36px;
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
}

.remove-favorite-btn:hover {
  transform: scale(1.15);
  background: #fef2f2;
}

.card-content {
  padding: 18px;
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: space-between;
}

.product-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 10px 0;
  cursor: pointer;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  height: 2.8em;
  transition: color 0.2s;
}

.product-title:hover {
  color: #059669;
}

.price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.product-price {
  font-size: 1.15rem;
  font-weight: 800;
  color: #059669;
}

.stock-status {
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stock-status.in-stock {
  color: #059669;
}

.stock-status.out-stock {
  color: #ef4444;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.move-cart-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #0f172a;
  color: #ffffff;
  border: none;
  padding: 10px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.move-cart-btn:hover:not(:disabled) {
  background: #059669;
}

.move-cart-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.view-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}
</style>
