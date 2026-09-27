<template>
  <div class="container">
    
    <RouterLink to="/" class="back-btn">
      <i class="fa-solid fa-arrow-right"></i> العودة للمتجر
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
    
    <div v-else-if="product" class="product-container">
      
      <div class="details-wrapper">
        <!-- قسم الصورة -->
        <div class="image-section">
          <span v-if="product.stock === 0" class="badge out-stock">نفذت الكمية</span>
          <span v-else-if="product.stock < 10" class="badge low-stock">متبقي عدد محدود!</span>
          
          <img :src="product.image" :alt="product.title" class="main-image">
        </div>
        
        <div class="info">
          <span class="category">{{ product.category }}</span>
          <h1>{{ product.title }}</h1>
          
          <!-- التقييم -->
          <div class="rating-box">
            <div class="stars">
              <i class="fa-solid fa-star"></i>
              <span class="rate-num">{{ product.averageRating ?? product.rating?.rate ?? 0 }}</span>
            </div>
            <span class="reviews-count">({{ product.reviewCount ?? product.rating?.count ?? reviews.length }} تقييم عميل)</span>
          </div>

          <p class="desc">{{ product.description }}</p>
          
          <div class="price-stock-row">
            <h2 class="price">${{ product.price }}</h2>
            <span class="stock-status" :class="{ 'red': product.stock === 0 }">
              <i class="fa-solid fa-box"></i> 
              {{ product.stock > 0 ? `المخزون المتاح: ${product.stock} قطعة` : 'المنتج غير متوفر حالياً' }}
            </span>
          </div>

          <!-- Actions Row with Wishlist Toggle -->
          <div class="details-actions-row">
            <button 
              class="add-to-cart" 
              :disabled="product.stock === 0"
              :class="{ 'disabled-btn': product.stock === 0 }"
              @click="cartStore.addCart(product)"
            >
              <i class="fa-solid fa-cart-shopping"></i>
              {{ product.stock === 0 ? 'غير متاح حالياً' : 'أضف إلى السلة' }}
            </button>

            <button 
              type="button" 
              class="details-fav-btn"
              :class="{ 'is-fav': wishlistStore.isInWishlist(product.id) }"
              :title="wishlistStore.isInWishlist(product.id) ? 'إزالة من المفضلة' : 'إضافة للمفضلة'"
              @click="toggleWishlist"
            >
              <i :class="wishlistStore.isInWishlist(product.id) ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Reviews Section with Rating Breakdown -->
      <div class="reviews-section">
        <div class="reviews-section-header">
          <h3>تقييمات وآراء العملاء ({{ reviews.length }})</h3>
        </div>

        <!-- Rating Breakdown (Amazon/Shopify Style) -->
        <div class="rating-breakdown-card">
          <div class="rating-overview">
            <div class="score-number">{{ product.averageRating ?? product.rating?.rate ?? 0 }}</div>
            <div class="overview-stars">
              <i v-for="n in 5" :key="n" class="fa-solid fa-star" :class="{ 'gold': n <= Math.round(product.averageRating ?? product.rating?.rate ?? 0) }"></i>
            </div>
            <span class="total-reviews-label">{{ product.reviewCount ?? product.rating?.count ?? reviews.length }} تقييم موثق</span>
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
          <p>جاري تحميل التقييمات...</p>
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
                      <i class="fa-solid fa-circle-check"></i> مشتري موثق
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
          <p>لا توجد تعليقات حتى الآن على هذا المنتج. كن أول من يقيمه!</p>
        </div>
      </div>

      <!-- نموذج إضافة تقييم -->
      <ReviewForm :productId="product.id" @reviewAdded="handleReviewAdded" />
    </div>
    
    <div v-else class="error-msg">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <h2>عفواً، هذا المنتج غير موجود أو تم حذفه.</h2>
      <RouterLink to="/" class="back-home-btn">الذهاب للرئيسية</RouterLink>
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
import ReviewForm from '../components/ReviewForm.vue'

const route = useRoute() 
const product = ref(null)
const reviews = ref([])
const isloading = ref(true)
const loadingReviews = ref(false)
const store = useProductStore()
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()
const verifiedUserIds = ref(new Set())

const toggleWishlist = () => {
  if (product.value) {
    wishlistStore.toggleWishlist(product.value, auth.currentUser?.uid)
  }
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
  if (!dateVal || isNaN(dateVal.getTime())) return rev.date || 'مؤخراً'

  const diffMs = Date.now() - dateVal.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'الآن'
  if (diffHours < 24) return `منذ ${diffHours} ساعة`
  if (diffDays === 1) return 'أمس'
  if (diffDays < 7) return `منذ ${diffDays} أيام`
  if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`
  return dateVal.toLocaleDateString('ar-EG')
}

const ratingBreakdown = computed(() => {
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  const total = reviews.value.length

  reviews.value.forEach(r => {
    const star = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)))
    counts[star] = (counts[star] || 0) + 1
  })

  // If no reviews yet, use product rating fallback
  if (total === 0 && product.value?.rating) {
    const baseRate = Math.round(product.value.rating.rate || 5)
    counts[baseRate] = product.value.rating.count || 1
  }

  const effectiveTotal = total > 0 ? total : (product.value?.rating?.count || 1)

  return [5, 4, 3, 2, 1].map(stars => {
    const count = counts[stars] || 0
    const percent = Math.round((count / effectiveTotal) * 100)
    return { stars, count, percent }
  })
})

const loadReviews = async (productId) => {
  loadingReviews.value = true
  try {
    const reviewsColRef = collection(db, 'products', productId, 'reviews')
    const snap = await getDocs(reviewsColRef)
    const fetched = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Sort newest first
    fetched.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.date ? new Date(a.date).getTime() : 0)
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.date ? new Date(b.date).getTime() : 0)
      return timeB - timeA
    })

    if (fetched.length > 0) {
      reviews.value = fetched
    } else if (Array.isArray(product.value?.reviews) && product.value.reviews.length > 0) {
      reviews.value = [...product.value.reviews]
    } else {
      reviews.value = []
    }
  } catch (err) {
    console.error("خطأ في جلب تقييمات المنتج من الـ subcollection:", err)
    if (Array.isArray(product.value?.reviews)) {
      reviews.value = [...product.value.reviews]
    }
  } finally {
    loadingReviews.value = false
  }
}

const handleReviewAdded = (newRev) => {
  reviews.value.unshift(newRev)

  if (product.value) {
    const currentCount = Number(product.value.reviewCount ?? product.value.rating?.count ?? 0)
    const currentRate = Number(product.value.averageRating ?? product.value.rating?.rate ?? 0)
    const newCount = currentCount + 1
    const totalOldRate = currentRate * currentCount
    const newRate = Number(((totalOldRate + newRev.rating) / newCount).toFixed(1))

    product.value.reviewCount = newCount
    product.value.averageRating = newRate
    product.value.rating = {
      count: newCount,
      rate: newRate
    }
  }
}

onMounted(async () => {
  const id = route.params.id
  product.value = await store.getProductById(id)
  isloading.value = false
  if (product.value) {
    await Promise.all([
      loadReviews(id),
      checkVerifiedBuyers(id)
    ])
  }
})
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  direction: ltr; 
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 30px;
  color: #475569;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  transition: color 0.3s ease;
}

.back-btn:hover {
  color: #2563eb;
}

.details-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 40px;
  background: #fff;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0,0,0,0.03);
}

.image-section {
  flex: 1;
  min-width: 320px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px;
  background: #f8fafc;
  border-radius: 16px;
  position: relative;
  overflow: hidden;
}

.main-image {
  max-width: 100%;
  height: 380px;
  object-fit: contain;
  mix-blend-mode: multiply;
  transition: transform 0.4s ease;
}

.main-image:hover {
  transform: scale(1.08);
}

.badge {
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 6px 14px;
  border-radius: 30px;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
  z-index: 2;
}

.out-stock { background: #ef4444; }
.low-stock { background: #f59e0b; }

.info {
  flex: 1.4;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.category {
  color: #2563eb;
  text-transform: uppercase;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  margin-bottom: 12px;
}

h1 {
  font-size: 1.8rem;
  color: #1e293b;
  margin-bottom: 15px;
  line-height: 1.4;
  font-weight: 800;
}

.rating-box {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.stars {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #f59e0b;
  font-weight: 700;
}

.rate-num {
  color: #1e293b;
}

.reviews-count {
  color: #94a3b8;
  font-size: 0.9rem;
}

.desc {
  line-height: 1.8;
  color: #64748b;
  font-size: 1rem;
  margin-bottom: 25px;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 20px;
}

.price-stock-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
}

.price {
  color: #0f172a;
  font-size: 2.3rem;
  font-weight: 900;
}

.stock-status {
  font-size: 0.95rem;
  color: #10b981;
  font-weight: 600;
  background: #ecfdf5;
  padding: 8px 14px;
  border-radius: 8px;
}

.stock-status.red {
  color: #ef4444;
  background: #fef2f2;
}

.add-to-cart {
  padding: 16px 35px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(5, 150, 105, 0.25);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #059669;
}

.add-to-cart:hover:not(:disabled) {
  background: #047857;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(5, 150, 105, 0.35);
}

.disabled-btn {
  background: #cbd5e1 !important;
  color: #64748b !important;
  cursor: not-allowed !important;
  box-shadow: none !important;
}

/* Actions Row & Favorite Button */
.details-actions-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.details-fav-btn {
  width: 52px;
  height: 52px;
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
  border-color: #fecaca;
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
  padding: 35px;
  border-radius: 20px;
  box-shadow: 0 4px 20px -2px rgba(0,0,0,0.04);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.reviews-section-header h3 {
  font-size: 1.4rem;
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
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  margin-bottom: 30px;
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
  gap: 4px;
  color: #cbd5e1;
  font-size: 1rem;
}

.overview-stars .gold {
  color: #f59e0b;
}

.total-reviews-label {
  font-size: 0.82rem;
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
  font-size: 0.82rem;
  font-weight: 700;
  color: #475569;
  min-width: 45px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.star-label i {
  color: #f59e0b;
  font-size: 0.72rem;
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
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  min-width: 38px;
  text-align: left;
}

/* Reviews List */
.reviews-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-card {
  background: #ffffff;
  padding: 20px;
  border-radius: 14px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  font-weight: 800;
  font-size: 0.85rem;
  overflow: hidden;
  flex-shrink: 0;
}

.rev-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.reviewer-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.name-badge-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reviewer-name {
  font-weight: 700;
  color: #0f172a;
  font-size: 0.95rem;
}

.verified-buyer-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #059669;
  background: #ecfdf5;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid #a7f3d0;
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
  padding: 20px;
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
  border-top: 3px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}


.loading-state, .error-msg {
  text-align: center;
  padding: 80px 20px;
  color: #64748b;
  font-size: 1.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.loader-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f1f5f9;
  border-top: 4px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-msg i {
  font-size: 3rem;
  color: #ef4444;
  margin-bottom: 10px;
}

.back-home-btn {
  margin-top: 15px;
  padding: 10px 25px;
  background: #1e293b;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
}


@media (max-width: 768px) {
  .details-wrapper {
    flex-direction: column;
    padding: 20px;
  }
  
  .add-to-cart {
    width: 100%;
  }

  .price-stock-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>