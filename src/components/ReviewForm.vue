<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { db, auth } from '../firebase/config'
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore'
import Swal from 'sweetalert2'
import { useRouter } from 'vue-router'


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

  loading.value = true

  try {
    const itemRef = doc(db, 'products', route.params.id)
    
   
    const docSnap = await getDoc(itemRef)
    const prodData = docSnap.data()
    
    
    const oldRating = prodData.rating || { count: 0, rate: 0 }
    const newCount = oldRating.count + 1
    const totalOldScore = oldRating.rate * oldRating.count
  
    const newRate = Number(((totalOldScore + rating.value) / newCount).toFixed(1))

   
    const reviewData = {
      id: Date.now().toString(),
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || 'مستخدم',
      rating: rating.value,
      comment: comment.value,
      date: new Date().toLocaleDateString('ar-EG')
    }

  
    await updateDoc(itemRef, {
      reviews: arrayUnion(reviewData),
      rating: {
        count: newCount,
        rate: newRate
      }
    })

    comment.value = ''
    rating.value = 5
    emit('reviewAdded', reviewData)

    Swal.fire({ 
      icon: 'success', 
      title: 'تم إرسال تقييمك بنجاح', 
      timer: 1500, 
      showConfirmButton: false 
    })
  } catch (err) {
    console.log("مشكلة في حفظ التقييم:", err)
    Swal.fire({ icon: 'error', title: 'حدث خطأ أثناء الإرسال' })
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