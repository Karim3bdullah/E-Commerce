<template>
  <div class="container">
    
    <RouterLink to="/" class="back-btn">
      <i class="fa-solid fa-arrow-right"></i> العودة للمتجر
    </RouterLink>

    
    <div v-if="isloading" class="loading-state">
      <div class="loader-spinner"></div>
      <p>جاري تحميل تفاصيل المنتج...</p>
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
              <span class="rate-num">{{ product.rating?.rate || 0 }}</span>
            </div>
            <span class="reviews-count">({{ product.rating?.count || 0 }} تقييم عميل)</span>
          </div>

          <p class="desc">{{ product.description }}</p>
          
          <div class="price-stock-row">
            <h2 class="price">${{ product.price }}</h2>
            <span class="stock-status" :class="{ 'red': product.stock === 0 }">
              <i class="fa-solid fa-box"></i> 
              {{ product.stock > 0 ? `المخزون المتاح: ${product.stock} قطعة` : 'المنتج غير متوفر حالياً' }}
            </span>
          </div>

          
          <button 
            class="add-to-cart" 
            :disabled="product.stock === 0"
            :class="{ 'disabled-btn': product.stock === 0 }"
            @click="cartStore.addCart(product)"
          >
            <i class="fa-solid fa-cart-shopping"></i>
            {{ product.stock === 0 ? 'غير متاح حالياً' : 'أضف إلى السلة' }}
          </button>
        </div>
      </div>

    
      <div class="reviews-section">
        <h3>آراء العملاء ({{ product.reviews?.length || 0 }})</h3>
        
        <div v-if="product.reviews && product.reviews.length > 0" class="reviews-grid">
          <div v-for="rev in product.reviews" :key="rev.id" class="review-card">
            <div class="review-header">
              <span class="reviewer-name"><i class="fa-regular fa-user-circle"></i> {{ rev.userName }}</span>
              <div class="review-stars">
                <i v-for="n in rev.rating" :key="n" class="fa-solid fa-star gold"></i>
              </div>
            </div>
            <p class="review-comment">"{{ rev.comment }}"</p>
            <span class="review-date">{{ rev.date }}</span>
          </div>
        </div>

        <div v-else class="no-reviews">
          <p>لا توجد تعليقات حتى الآن على هذا المنتج. كن أول من يتقييمه!</p>
        </div>
      </div>

    </div>
    
   
    <div v-else class="error-msg">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <h2>عفواً، هذا المنتج غير موجود أو تم حذفه.</h2>
      <RouterLink to="/" class="back-home-btn">الذهاب للرئيسية</RouterLink>
    </div>
    <ReviewForm @reviewAdded="(newRev) => { 
  if(!product.reviews) product.reviews = [];
  product.reviews.push(newRev); 
  

  if(!product.rating) product.rating = { count: 0, rate: 0 };
  
  const totalOldRate = product.rating.rate * product.rating.count;
  product.rating.count += 1;
  product.rating.rate = Number(((totalOldRate + newRev.rating) / product.rating.count).toFixed(1));
}" />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProductStore } from '../stores/productstore'
import { useCartStore } from '../stores/cartStore'
import ReviewForm from '../components/ReviewForm.vue'

const route = useRoute() 
const product = ref(null)
const isloading = ref(true)
const store = useProductStore()
const cartStore = useCartStore()

onMounted(async () => {
  const id = route.params.id
  product.value = await store.getProductById(id)
  isloading.value = false
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
  box-shadow: 0 4px 15px rgba(37, 99, 235, 0.25);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: fit-content;
}

.add-to-cart:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
}

.disabled-btn {
  background: #cbd5e1 !important;
  color: #64748b !important;
  cursor: not-allowed !important;
  box-shadow: none !important;
}


.reviews-section {
  margin-top: 50px;
  background: #fff;
  padding: 35px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.04);
  border: 1px solid rgba(0,0,0,0.03);
}

.reviews-section h3 {
  font-size: 1.4rem;
  color: #1e293b;
  margin-bottom: 25px;
  font-weight: 700;
}

.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.review-card {
  background: #f8fafc;
  padding: 20px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reviewer-name {
  font-weight: 700;
  color: #334155;
  font-size: 0.95rem;
}

.review-stars .gold {
  color: #f59e0b;
  font-size: 0.8rem;
}

.review-comment {
  color: #475569;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0;
}

.review-date {
  font-size: 0.75rem;
  color: #94a3b8;
  align-self: flex-end;
}

.no-reviews {
  color: #94a3b8;
  text-align: center;
  padding: 20px;
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