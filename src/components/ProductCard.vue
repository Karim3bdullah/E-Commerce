<script setup>
import { useCartStore } from '../stores/cartStore'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
defineProps(['product'])
const cartStore = useCartStore()

const translateCategory = (cat) => {
  if (!cat) return ''
  const cleanKey = cat.replace(/'/g, '')
  const translation = t(`categories['${cleanKey}']`)
  if (translation.includes('categories[')) return cat 
  return translation
}
</script>

<template>
  <div class="product-card">
   
    <div class="image-container">
      <span v-if="product.stock === 0" class="badge out-of-stock">نفذت الكمية</span>
      <span class="badge category-badge">{{ translateCategory(product.category) }}</span>
      
      <router-link :to="`/product/${product.id}`" class="img-link">
        <img :src="product.image" :alt="product.title" class="product-img">
      </router-link>
    </div>
    
    <div class="card-content">
      
      <div class="rating">
        <div class="stars">
          <i class="fa-solid fa-star"></i>
          <span>{{ product.rating?.rate || 0 }}</span>
        </div>
        <span class="reviews">({{ product.rating?.count || 0 }})</span>
      </div>

      <h3 class="title" :title="product.title">
        <router-link :to="`/product/${product.id}`" class="title-link">
          {{ product.title }}
        </router-link>
      </h3>
    </div>

    <div class="card-footer">
      <div class="price-container">
        <span class="currency">$</span><span class="price">{{ product.price }}</span>
      </div>
      
      <div class="actions">
      
        <router-link class="icon-btn details-btn" :to="`/product/${product.id}`" title="التفاصيل">
          <i class="fa-regular fa-eye"></i>
        </router-link>
        
        <button 
          class="primary-btn add-to-cart" 
          :disabled="product.stock === 0"
          @click="cartStore.addCart(product)"
        >
          <i class="fa-solid fa-cart-shopping"></i>
          <span class="btn-text">إضافة</span>
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
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.product-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.08);
}

.image-container {
  position: relative;
  aspect-ratio: 1 / 1;
  width: 100%;
  background: #f8fafc;
  padding: 25px;
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
  transition: transform 0.5s ease;
}

.img-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.product-card:hover .product-img {
  transform: scale(1.1);
}

.badge {
  position: absolute;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  z-index: 2;
  letter-spacing: 0.5px;
}

.category-badge {
  top: 15px;
  right: 15px;
  background: rgba(255, 255, 255, 0.85);
  color: #475569;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.out-of-stock {
  top: 15px;
  left: 15px;
  background: #ef4444;
  color: white;
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
}

.card-content {
  padding: 20px 20px 10px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.stars {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #f59e0b;
  font-size: 0.9rem;
  font-weight: 700;
}

.reviews {
  font-size: 0.8rem;
  color: #94a3b8;
}

.title {
  font-size: 1.05rem;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.title-link {
  color: #1e293b;
  text-decoration: none;
  transition: color 0.2s ease;
}

.title-link:hover {
  color: #2563eb;
}

.card-footer {
  padding: 15px 20px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(0,0,0,0.03);
}

.price-container {
  display: flex;
  align-items: flex-start;
  gap: 2px;
  color: #0f172a;
}

.currency {
  font-size: 0.9rem;
  font-weight: 600;
  margin-top: 2px;
}

.price {
  font-size: 1.4rem;
  font-weight: 800;
}

.actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.icon-btn {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #f1f5f9;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-size: 1.1rem;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.primary-btn {
  height: 42px;
  padding: 0 16px;
  border-radius: 12px;
  background: #2563eb;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.primary-btn:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(37, 99, 235, 0.25);
}

.primary-btn:active:not(:disabled) {
  transform: translateY(0);
}

.primary-btn:disabled {
  background: #cbd5e1;
  color: #94a3b8;
  cursor: not-allowed;
}

@media (max-width: 400px) {
  .btn-text {
    display: none; 
  }
}
</style>