<template>
  <div class="cart-page">
    <h1 class="page-title">سلة المشتريات</h1>


    <div v-if="cartStore.cart.length === 0" class="empty-cart">
      <div class="empty-icon-wrapper">
        <i class="fa-solid fa-cart-shopping"></i>
      </div>
      <h2>سلتك فارغة تماماً!</h2>
      <p>يبدو أنك لم تضف أي منتجات إلى السلة حتى الآن.</p>
      <router-link to="/" class="shop-btn">تصفح المنتجات</router-link>
    </div>


    <div v-else class="cart-content">
      
     
      <div class="cart-items-section">
        <div v-for="item in cartStore.cart" :key="item.id" class="cart-item-card">
          
          
          <div class="item-img-wrapper">
            <img :src="item.image" :alt="item.title">
          </div>

         
          <div class="item-info">
            <h3 class="item-title">{{ item.title }}</h3>
            <p class="item-price">${{ item.price }}</p>
          </div>

         
          <div class="quantity-controls">
            <button 
              class="qty-btn" 
              @click="cartStore.decreaseQuantity(item.id)"
            >
              <i class="fa-solid fa-minus"></i>
            </button>
            
            <span class="qty-amount">{{ item.quantity }}</span>
            
            <button 
              class="qty-btn" 
              :disabled="item.quantity >= item.stock"
              @click="cartStore.increaseQuantity(item.id)"
            >
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>

          
          <div class="item-actions">
            <p class="item-total-price">${{ (item.price * item.quantity).toFixed(2) }}</p>
            <button class="remove-btn" @click="cartStore.removeFromCart(item.id)">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>

        </div>
      </div>

      
      <div class="cart-summary-section">
        <div class="summary-card">
          <h2>ملخص الطلب</h2>
          
          <div class="summary-row">
            <span>عدد المنتجات:</span>
            <span>{{ cartStore.totalItemsCount }} منتج</span>
          </div>
          
          <div class="summary-row total-row">
            <span>الإجمالي:</span>
            <span class="final-price">${{ cartStore.totalPrice.toFixed(2) }}</span>
          </div>

          <router-link to="/checkout" class="checkout-btn">
            متابعة لعملية الدفع <i class="fa-solid fa-arrow-left"></i>
          </router-link>
          
          <router-link to="/" class="continue-shopping">
            العودة للتسوق
          </router-link>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useCartStore } from '../stores/cartStore'

const cartStore = useCartStore()

onMounted(() => {
  cartStore.syncCartWithFirestore()
})
</script>

<style scoped>
.cart-page {
  max-width: 1200px;
  margin: 40px auto;
  padding: 0 20px;
  min-height: 60vh; /* عشان نمنع الفوتر يلزق فوق لو الصفحة فاضية */
  direction: rtl;
}

.page-title {
  color: #1e293b;
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 30px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 15px;
}

/* تنسيقات السلة الفارغة */
.empty-cart {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
}

.empty-icon-wrapper {
  width: 100px;
  height: 100px;
  background: #f1f5f9;
  color: #94a3b8;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  margin: 0 auto 20px;
}

.empty-cart h2 {
  color: #1e293b;
  margin-bottom: 10px;
}

.empty-cart p {
  color: #64748b;
  margin-bottom: 25px;
}

.shop-btn {
  display: inline-block;
  padding: 12px 30px;
  background: #2563eb;
  color: white;
  border-radius: 8px;
  font-weight: 700;
  transition: background 0.3s;
}

.shop-btn:hover {
  background: #1d4ed8;
}

/* تخطيط السلة (شبكة من عمودين) */
.cart-content {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

.cart-items-section {
  flex: 1.5; /* بياخد مساحة أكبر من الملخص */
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* كارت المنتج في السلة */
.cart-item-card {
  display: flex;
  align-items: center;
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.02);
  border: 1px solid #f1f5f9;
  gap: 20px;
}

.item-img-wrapper {
  width: 90px;
  height: 90px;
  background: #f8fafc;
  border-radius: 12px;
  padding: 10px;
  flex-shrink: 0;
}

.item-img-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  mix-blend-mode: multiply;
}

.item-info {
  flex: 1;
}

.item-title {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  color: #1e293b;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-price {
  margin: 0;
  color: #64748b;
  font-weight: 600;
}

/* أزرار الكمية */
.quantity-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  background: #f8fafc;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.qty-btn {
  background: none;
  border: none;
  color: #475569;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-btn:hover:not(:disabled) {
  color: #2563eb;
}

.qty-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.qty-amount {
  font-weight: 700;
  color: #1e293b;
  min-width: 20px;
  text-align: center;
}

/* الإجمالي الفرعي والحذف */
.item-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 15px;
  min-width: 100px;
}

.item-total-price {
  margin: 0;
  font-weight: 800;
  color: #10b981;
  font-size: 1.2rem;
}

.remove-btn {
  background: #fee2e2;
  color: #ef4444;
  border: none;
  width: 35px;
  height: 35px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: #ef4444;
  color: white;
}

/* قسم ملخص الطلب */
.cart-summary-section {
  flex: 1;
  position: sticky;
  top: 90px; /* بيخلي الفاتورة تلزق في الشاشة وأنت بتنزل */
}

.summary-card {
  background: white;
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
  border: 1px solid #f1f5f9;
}

.summary-card h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #1e293b;
  font-size: 1.3rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 15px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  color: #64748b;
  font-weight: 600;
}

.total-row {
  border-top: 2px dashed #e2e8f0;
  padding-top: 15px;
  margin-top: 15px;
  color: #1e293b;
  font-size: 1.2rem;
}

.final-price {
  color: #2563eb;
  font-size: 1.5rem;
  font-weight: 800;
}

.checkout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 15px;
  background: #2563eb;
  color: white;
  border-radius: 10px;
  font-weight: 700;
  margin-top: 25px;
  transition: background 0.3s;
  box-sizing: border-box;
}

.checkout-btn:hover {
  background: #1d4ed8;
}

.continue-shopping {
  display: block;
  text-align: center;
  margin-top: 15px;
  color: #64748b;
  font-weight: 600;
  transition: color 0.2s;
}

.continue-shopping:hover {
  color: #1e293b;
}

/* التجاوب مع شاشات الموبايل */
@media (max-width: 900px) {
  .cart-content {
    flex-direction: column;
  }
  
  .cart-summary-section {
    width: 100%;
    position: static;
  }
  
  .cart-item-card {
    flex-wrap: wrap;
  }
  
  .item-actions {
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #f1f5f9;
    padding-top: 15px;
  }
}
</style>