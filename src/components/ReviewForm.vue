<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db, auth } from '../firebase/config'
import { doc, collection, runTransaction, serverTimestamp } from 'firebase/firestore'
import Swal from 'sweetalert2'

const props = defineProps({
  productId: {
    type: String,
    default: ''
  }
})

const route = useRoute()
const router = useRouter()
const emit = defineEmits(['reviewAdded'])

const rating = ref(5)
const comment = ref('')
const loading = ref(false)

const sendReview = async () => {
  if (!auth.currentUser) {
    router.push('/login')
    return
  }

  if (!comment.value.trim()) {
    Swal.fire({ icon: 'warning', title: 'اكتب تعليق الأول' })
    return
  }

  const prodId = props.productId || route.params.id
  if (!prodId) {
    Swal.fire({ icon: 'error', title: 'خطأ', text: 'معرف المنتج غير محدد' })
    return
  }

  loading.value = true

  try {
    const itemRef = doc(db, 'products', prodId)
    const reviewsColRef = collection(db, 'products', prodId, 'reviews')
    const newReviewRef = doc(reviewsColRef)

    const currentDateStr = new Date().toLocaleDateString('ar-EG')
    const reviewData = {
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || 'مستخدم',
      userPhoto: auth.currentUser.photoURL || null,
      rating: Number(rating.value),
      comment: comment.value.trim(),
      date: currentDateStr,
      createdAt: serverTimestamp()
    }

    let updatedCount = 1
    let updatedAverage = Number(rating.value)

    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(itemRef)
      if (!docSnap.exists()) {
        throw new Error("المنتج غير موجود")
      }
      
      const prodData = docSnap.data()
      const currentCount = Number(prodData.reviewCount ?? prodData.rating?.count ?? 0)
      const currentRate = Number(prodData.averageRating ?? prodData.rating?.rate ?? 0)

      updatedCount = currentCount + 1
      const totalOldScore = currentRate * currentCount
      updatedAverage = Number(((totalOldScore + Number(rating.value)) / updatedCount).toFixed(1))

      // Write to subcollection: products/{productId}/reviews/{reviewId}
      transaction.set(newReviewRef, reviewData)

      // Atomically update parent product document aggregated rating
      transaction.update(itemRef, {
        averageRating: updatedAverage,
        reviewCount: updatedCount,
        rating: {
          count: updatedCount,
          rate: updatedAverage
        }
      })
    })

    const emittedReview = {
      id: newReviewRef.id,
      ...reviewData
    }

    comment.value = ''
    rating.value = 5
    emit('reviewAdded', emittedReview)

    Swal.fire({ 
      icon: 'success', 
      title: 'تم إرسال تقييمك بنجاح', 
      timer: 1500, 
      showConfirmButton: false 
    })
  } catch (err) {
    console.error("مشكلة في حفظ التقييم:", err)
    Swal.fire({ icon: 'error', title: 'حدث خطأ أثناء الإرسال', text: err.message || 'حاول مجدداً لاحقاً.' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="review-form-card">
    <h3>أضف تقييمك للمنتج</h3>
    <form @submit.prevent="sendReview">
      <div class="input-group">
        <label>التقييم:</label>
        <select v-model.number="rating" class="select-rate">
          <option value="5">⭐⭐⭐⭐⭐ (ممتاز)</option>
          <option value="4">⭐⭐⭐⭐ (جيد جداً)</option>
          <option value="3">⭐⭐⭐ (متوسط)</option>
          <option value="2">⭐⭐ (ضعيف)</option>
          <option value="1">⭐ (سيء)</option>
        </select>
      </div>

      <div class="input-group">
        <label>التعليق:</label>
        <textarea v-model="comment" rows="3" placeholder="شاركنا رأيك بصراحة..."></textarea>
      </div>

      <button type="submit" class="send-btn" :disabled="loading">
        {{ loading ? 'جاري الإرسال...' : 'إرسال التقييم' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.review-form-card {
  background: #f8fafc;
  padding: 25px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  margin-top: 30px;
}

.review-form-card h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #1e293b;
  font-size: 1.2rem;
}

.input-group {
  margin-bottom: 15px;
}

.input-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #475569;
  font-size: 0.9rem;
}

.select-rate, textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.95rem;
  background: #fff;
  outline: none;
}

.select-rate:focus, textarea:focus {
  border-color: #2563eb;
}

.send-btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.send-btn:hover {
  background: #1d4ed8;
}

.send-btn:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}
</style>