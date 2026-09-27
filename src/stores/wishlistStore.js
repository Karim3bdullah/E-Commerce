import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { db } from '../firebase/config'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import Swal from 'sweetalert2'
import { useCartStore } from './cartStore'

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
  background: '#ffffff',
  color: '#0f172a'
})

export const useWishlistStore = defineStore('wishlistStore', () => {
  const wishlist = ref(JSON.parse(localStorage.getItem('myWishlist') || '[]'))
  const currentUserId = ref(null)

  const count = computed(() => wishlist.value.length)

  const isInWishlist = (productId) => {
    return wishlist.value.some(item => item.id === productId)
  }

  const persistWishlist = async () => {
    localStorage.setItem('myWishlist', JSON.stringify(wishlist.value))
    if (currentUserId.value) {
      try {
        const userRef = doc(db, 'users', currentUserId.value)
        await updateDoc(userRef, { wishlist: wishlist.value })
      } catch (err) {
        console.warn("Could not save wishlist to Firestore:", err)
      }
    }
  }

  const toggleWishlist = async (product, userId = null) => {
    if (userId) currentUserId.value = userId

    const index = wishlist.value.findIndex(item => item.id === product.id)
    if (index > -1) {
      wishlist.value.splice(index, 1)
      Toast.fire({
        icon: 'info',
        title: `تمت إزالة "${product.title}" من المفضلة`
      })
    } else {
      wishlist.value.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        category: product.category,
        stock: product.stock
      })
      Toast.fire({
        icon: 'success',
        title: `تمت إضافة "${product.title}" إلى المفضلة ❤️`
      })
    }
    await persistWishlist()
  }

  const removeFromWishlist = async (productId, userId = null) => {
    if (userId) currentUserId.value = userId
    wishlist.value = wishlist.value.filter(item => item.id !== productId)
    await persistWishlist()
  }

  const moveToCart = async (product, userId = null) => {
    const cartStore = useCartStore()
    cartStore.addCart(product)
    await removeFromWishlist(product.id, userId)
  }

  const syncWishlistWithUser = async (userId) => {
    currentUserId.value = userId
    if (!userId) return

    try {
      const userRef = doc(db, 'users', userId)
      const snap = await getDoc(userRef)
      if (snap.exists() && Array.isArray(snap.data().wishlist)) {
        // Merge with local wishlist
        const remoteList = snap.data().wishlist
        const localList = wishlist.value

        const map = new Map()
        for (const item of [...remoteList, ...localList]) {
          map.set(item.id, item)
        }
        wishlist.value = Array.from(map.values())
        localStorage.setItem('myWishlist', JSON.stringify(wishlist.value))
        await updateDoc(userRef, { wishlist: wishlist.value })
      } else {
        // Save local to firestore
        if (wishlist.value.length > 0) {
          await updateDoc(userRef, { wishlist: wishlist.value })
        }
      }
    } catch (e) {
      console.warn("Sync wishlist error:", e)
    }
  }

  return {
    wishlist,
    count,
    isInWishlist,
    toggleWishlist,
    removeFromWishlist,
    moveToCart,
    syncWishlistWithUser
  }
})
