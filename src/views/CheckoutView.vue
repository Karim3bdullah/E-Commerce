<template>
  <div class="checkout-container">
    <h1 class="page-title">إتمام الشراء</h1>

    <div v-if="cartStore.cart.length === 0" class="empty-notice">
      <div class="empty-icon"><i class="fa-solid fa-cart-shopping"></i></div>
      <h2>السلة فارغة! لا توجد منتجات لإتمام الطلب.</h2>
      <router-link to="/" class="back-home">العودة للتسوق</router-link>
    </div>

    <div v-else class="checkout-grid">
      
      <!-- نموذج البيانات الشخصية والشحن -->
      <div class="form-card">
        <h2><i class="fa-solid fa-truck-fast"></i> بيانات الشحن والتوصيل</h2>
        
        <form @submit.prevent="handleCheckout">
          
          <div class="form-group">
            <label>الاسم بالكامل *</label>
            <div class="input-wrapper">
              <i class="fa-regular fa-user field-icon"></i>
              <input 
                v-model="name" 
                type="text" 
                placeholder="أدخل اسمك الثلاثي"
                :class="{ 'input-error': errors.name }"
              >
            </div>
            <span class="error-msg" v-if="errors.name">{{ errors.name }}</span>
          </div>

          <div class="form-group">
            <label>رقم الهاتف *</label>
            <div class="input-wrapper">
              <i class="fa-solid fa-phone field-icon"></i>
              <input 
                v-model="phone" 
                type="tel" 
                placeholder="01XXXXXXXXX"
                :class="{ 'input-error': errors.phone }"
              >
            </div>
            <span class="error-msg" v-if="errors.phone">{{ errors.phone }}</span>
          </div>

          <div class="form-group">
            <label>عنوان التوصيل التفصيلي *</label>
            <div class="textarea-wrapper">
              <i class="fa-solid fa-location-dot field-icon textarea-icon"></i>
              <textarea 
                v-model="address" 
                rows="3" 
                placeholder="المحافظة - المدينة - اسم الشارع - رقم المبنى"
                :class="{ 'input-error': errors.address }"
              ></textarea>
            </div>
            <span class="error-msg" v-if="errors.address">{{ errors.address }}</span>
          </div>

          <div class="form-group">
            <label>ملاحظات إضافية (اختياري)</label>
            <div class="input-wrapper">
              <i class="fa-regular fa-note-sticky field-icon"></i>
              <input 
                v-model="notes" 
                type="text" 
                placeholder="أي تفاصيل خاصة بالتسليم"
              >
            </div>
          </div>

          <button type="submit" class="submit-btn" :disabled="isSubmitting">
            <span v-if="isSubmitting" class="loading-btn-content">
              <div class="btn-spinner"></div> جاري إرسال الطلب...
            </span>
            <span v-else>
              تأكيد الطلب (${{ cartStore.totalPrice.toFixed(2) }}) <i class="fa-solid fa-arrow-left"></i>
            </span>
          </button>
        </form>
      </div>

      <!-- كارت ملخص المنتجات -->
      <div class="summary-card">
        <h2><i class="fa-solid fa-bag-shopping"></i> ملخص المنتجات ({{ cartStore.totalItemsCount }})</h2>
        
        <div class="items-preview">
          <div v-for="item in cartStore.cart" :key="item.id" class="preview-item">
            <img :src="item.image" :alt="item.title">
            <div class="item-details">
              <h4>{{ item.title }}</h4>
              <p>الكمية: {{ item.quantity }} × ${{ item.price }}</p>
            </div>
            <div class="item-total-price">
              ${{ (item.price * item.quantity).toFixed(2) }}
            </div>
          </div>
        </div>

        <div class="summary-breakdown">
          <div class="breakdown-row">
            <span>مجموع المنتجات</span>
            <span>${{ cartStore.totalPrice.toFixed(2) }}</span>
          </div>
          <div class="breakdown-row">
            <span>مصاريف الشحن</span>
            <span class="free-shipping">مجاناً</span>
          </div>
        </div>

        <div class="total-box">
          <span>الإجمالي النهائي:</span>
          <span class="total-price-num">${{ cartStore.totalPrice.toFixed(2) }}</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCartStore } from '../stores/cartStore'
import { db, auth } from '../firebase/config'
import { collection, addDoc, serverTimestamp, doc, getDoc, writeBatch, increment } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'

const cartStore = useCartStore()
const router = useRouter()
const currentUserId = ref(null)

const schema = yup.object({
  name: yup.string().required('الاسم بالكامل مطلوب').min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل'),
  phone: yup.string().required('رقم الهاتف مطلوب').matches(/^01[0125][0-9]{8}$/, 'يجب إدخال رقم هاتف مصري صحيح'),
  address: yup.string().required('عنوان التوصيل مطلوب').min(10, 'يرجى إدخال تفاصيل أكثر للعنوان ليتم التوصيل بدقة'),
  notes: yup.string().nullable()
})

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
          const userData = userDoc.data()
          if (userData.name) setFieldValue('name', userData.name)
          if (userData.phone) setFieldValue('phone', userData.phone)
        }
      } catch (error) {
        console.error("خطأ في جلب بيانات العميل:", error)
      }
    }
  })
})

const handleCheckout = handleSubmit(async (values) => {
  if (cartStore.cart.length === 0) return

  try {
   const orderData = {
      userId: currentUserId.value || 'guest', 
      customer: {
        ...values,
        notes: values.notes || '' 
      },
      items: cartStore.cart,
      totalPrice: cartStore.totalPrice,
      totalItems: cartStore.totalItemsCount,
      status: 'pending',
      createdAt: serverTimestamp()
    }

    await addDoc(collection(db, 'orders'), orderData)
    const batch = writeBatch(db)

      cartStore.cart.forEach((item) => {
        const productRef = doc(db, 'products', item.id)
        batch.update(productRef, {
          stock: increment(-item.quantity)
        })
      })

      await batch.commit()
    cartStore.clearCart()

    Swal.fire({
      icon: 'success',
      title: 'تم إرسال طلبك بنجاح! 🎉',
      text: 'سنقوم بالتواصل معك قريباً لتأكيد الشحن.',
      confirmButtonText: 'العودة للرئيسية',
      confirmButtonColor: '#2563eb'
    }).then(() => router.push('/'))

  } catch (error) {
    console.error("Firebase Error Details: ", error);
    Swal.fire({ icon: 'error', title: 'حدث خطأ!', text: 'تعذر إرسال الطلب.' })
  }
})
</script>

<style scoped>
.checkout-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.page-title {
  text-align: center;
  margin-bottom: 40px;
  color: #1e293b;
  font-size: 2.2rem;
  font-weight: 800;
}

.checkout-grid {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

.form-card, .summary-card {
  background: #ffffff;
  padding: 35px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.03);
  box-sizing: border-box; 
}

.form-card { flex: 1.4; }
.summary-card { 
  flex: 1; 
  position: sticky;
  top: 25px;
}

h2 {
  font-size: 1.25rem;
  margin-bottom: 25px;
  color: #1e293b;
  border-bottom: 2px solid #f1f5f9;
  padding-bottom: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}

h2 i {
  color: #2563eb;
}

.form-group {
  margin-bottom: 22px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #475569;
  font-size: 0.9rem;
}

.input-wrapper, .textarea-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.field-icon {
  position: absolute;
  right: 15px;
  color: #94a3b8;
  pointer-events: none;
  font-size: 1rem;
}

.textarea-icon {
  top: 15px;
}

.form-group input, .form-group textarea {
  width: 100%;
  padding: 14px 45px 14px 15px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  background-color: #f8fafc;
  color: #1e293b;
  font-family: inherit;
  transition: all 0.3s ease;
}

.form-group input:hover, .form-group textarea:hover {
  background-color: #f1f5f9;
}

.form-group input:focus, .form-group textarea:focus {
  outline: none;
  border-color: #2563eb;
  background-color: #fff;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
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

.submit-btn {
  width: 100%;
  padding: 16px;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
  box-shadow: 0 4px 15px rgba(37, 99, 235, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.submit-btn:hover:not(:disabled) {
  background-color: #1d4ed8;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
}

.submit-btn:disabled {
  background-color: #cbd5e1;
  cursor: not-allowed;
  box-shadow: none;
}

.loading-btn-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.items-preview {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 320px;
  overflow-y: auto;
  margin-bottom: 20px;
  padding-left: 5px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f1f5f9;
}

.preview-item img {
  width: 55px;
  height: 55px;
  object-fit: contain;
  background: #f8fafc;
  padding: 5px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.item-details { flex: 1; }

.item-details h4 {
  font-size: 0.9rem;
  margin: 0 0 5px 0;
  color: #1e293b;
  font-weight: 600;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-details p {
  margin: 0;
  font-size: 0.8rem;
  color: #64748b;
}

.item-total-price {
  font-weight: 700;
  color: #1e293b;
  font-size: 0.95rem;
}

.summary-breakdown {
  border-top: 1px solid #f1f5f9;
  padding-top: 15px;
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
  color: #64748b;
}

.free-shipping {
  color: #10b981;
  font-weight: 700;
}

.total-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.2rem;
  font-weight: 800;
  color: #1e293b;
  padding-top: 15px;
  border-top: 2px dashed #e2e8f0;
}

.total-price-num {
  color: #2563eb;
  font-size: 1.4rem;
}

.empty-notice {
  text-align: center;
  padding: 80px 20px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.04);
}

.empty-icon {
  font-size: 4rem;
  color: #cbd5e1;
  margin-bottom: 20px;
}

.empty-notice h2 {
  color: #1e293b;
  margin-bottom: 10px;
  border: none;
}

.back-home {
  display: inline-block;
  padding: 12px 30px;
  background-color: #2563eb;
  color: white;
  text-decoration: none;
  border-radius: 12px;
  font-weight: 700;
  transition: background 0.3s;
  margin-top: 15px;
}

.back-home:hover {
  background-color: #1d4ed8;
}

@media (max-width: 900px) {
  .checkout-grid {
    flex-direction: column-reverse; 
  }
  .form-card, .summary-card {
    width: 100%;
    padding: 20px; 
  }
  .summary-card {
    position: static;
  }
}
</style>