<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db, auth } from '../firebase/config'
import { doc, collection, runTransaction, serverTimestamp } from 'firebase/firestore'
import { useI18n } from 'vue-i18n'
import Swal from 'sweetalert2'

const props = defineProps({
  productId: {
    type: String,
    default: ''
  }
})

const { t, locale } = useI18n()
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
    Swal.fire({ 
      icon: 'warning', 
      title: t('product.commentRequired'),
      confirmButtonColor: '#059669'
    })
    return
  }

  const prodId = props.productId || route.params.id
  if (!prodId) {
    Swal.fire({ 
      icon: 'error', 
      title: t('common.error'), 
      confirmButtonColor: '#ef4444'
    })
    return
  }

  loading.value = true

  try {
    const itemRef = doc(db, 'products', prodId)
    const reviewsColRef = collection(db, 'products', prodId, 'reviews')
    const newReviewRef = doc(reviewsColRef)

    const currentDateStr = new Date().toLocaleDateString(locale.value === 'ar' ? 'ar-EG' : 'en-US')
    let userPhoto = auth.currentUser.photoURL || null
    if (!userPhoto) {
      try {
        const uSnap = await getDoc(doc(db, 'users', auth.currentUser.uid))
        if (uSnap.exists() && uSnap.data().photoURL) {
          userPhoto = uSnap.data().photoURL
        }
      } catch (_) {}
    }

    const reviewData = {
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || (locale.value === 'ar' ? 'مستخدم' : 'Customer'),
      userPhoto: userPhoto,
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
        throw new Error(t('product.notFound'))
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
      title: t('product.reviewSuccess'), 
      timer: 1800, 
      showConfirmButton: false 
    })
  } catch (err) {
    console.error("Error saving review:", err)
    Swal.fire({ 
      icon: 'error', 
      title: t('product.reviewError'), 
      text: err.message || '',
      confirmButtonColor: '#ef4444'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="review-form-card">
    <h3>{{ t('product.addReview') }}</h3>
    <form @submit.prevent="sendReview">
      <div class="input-group">
        <label>{{ t('product.rate') }}</label>
        <select v-model.number="rating" class="select-rate">
          <option value="5">{{ t('product.rate5') }}</option>
          <option value="4">{{ t('product.rate4') }}</option>
          <option value="3">{{ t('product.rate3') }}</option>
          <option value="2">{{ t('product.rate2') }}</option>
          <option value="1">{{ t('product.rate1') }}</option>
        </select>
      </div>

      <div class="input-group">
        <label>{{ t('product.comment') }}</label>
        <textarea 
          v-model="comment" 
          rows="3" 
          :placeholder="t('product.reviewPlaceholder')"
          class="review-textarea"
        ></textarea>
      </div>

      <button type="submit" class="send-btn" :disabled="loading">
        <i v-if="loading" class="fa-solid fa-spinner fa-spin"></i>
        <span>{{ loading ? t('product.sendingReview') : t('product.sendReview') }}</span>
      </button>
    </form>
  </div>
</template>

<style scoped>
.review-form-card {
  background: #f8fafc;
  padding: 28px;
  border-radius: 18px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  margin-top: 32px;
}

.review-form-card h3 {
  margin: 0 0 20px 0;
  color: #0f172a;
  font-size: 1.15rem;
  font-weight: 800;
}

.input-group {
  margin-bottom: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-size: 0.9rem;
  font-weight: 700;
  color: #334155;
}

.select-rate {
  padding: 10px 14px;
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background-color: white;
  font-family: inherit;
  font-size: 0.95rem;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s ease;
}

.select-rate:focus {
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
}

.review-textarea {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  font-family: inherit;
  font-size: 0.95rem;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s ease;
}

.review-textarea:focus {
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
}

.send-btn {
  background: #059669;
  color: white;
  border: none;
  padding: 12px 28px;
  min-height: 44px;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  font-family: inherit;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
}

.send-btn:hover:not(:disabled) {
  background: #047857;
  transform: translateY(-2px);
}

.send-btn:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
  box-shadow: none;
}

@media (max-width: 480px) {
  .review-form-card {
    padding: 20px 16px;
  }
  
  .send-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>