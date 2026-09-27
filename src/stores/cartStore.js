import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import Swal from 'sweetalert2'
import { db } from '../firebase/config'
import { doc, getDoc } from 'firebase/firestore'

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2500, 
  timerProgressBar: true,
  background: '#fff',
  color: '#2c3e50',
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

export const useCartStore = defineStore('cartStore', () => {
    const cart = ref(JSON.parse(localStorage.getItem('myCart')) || [])
    const isSyncing = ref(false)
    const isMiniCartOpen = ref(false)
    const FREE_SHIPPING_THRESHOLD = 150

    const openMiniCart = () => { isMiniCartOpen.value = true }
    const closeMiniCart = () => { isMiniCartOpen.value = false }
    const toggleMiniCart = () => { isMiniCartOpen.value = !isMiniCartOpen.value }
     
   function addCart(product) {
  const existingItem = cart.value.find(item => item.id === product.id)
  
  if (existingItem) {
    if (existingItem.quantity < product.stock) {
      existingItem.quantity++
      Toast.fire({
        icon: 'success',
        title: `تم زيادة كمية ${product.title} في السلة`
      })
      openMiniCart()
    } else {
      Toast.fire({
        icon: 'warning',
        title: 'عفواً، تم الوصول للحد الأقصى للمتاح من هذا المنتج!'
      })
    }
  } else {
    if (product.stock > 0) {
      cart.value.push({ ...product, quantity: 1 })
      Toast.fire({
        icon: 'success',
        title: 'تمت الإضافة للسلة بنجاح!'
      })
      openMiniCart()
    }
  }
}
  const increaseQuantity = (id) => {
      const item = cart.value.find(item => item.id === id)
      if (item) {
      
        if (item.quantity < item.stock) {
          item.quantity++
        } else {
          Toast.fire({
            icon: 'warning',
            title: 'عفواً، تم الوصول للحد الأقصى للمتاح من هذا المنتج!'
          })
        }
      }
  }

  const decreaseQuantity = (id) => {
    const item = cart.value.find(item => item.id === id)
    if (item) {
   
      if (item.quantity > 1) {
        item.quantity--
      } else {
     
        removeFromCart(id)
      }
    }
  }

  const removeFromCart = (id) => {
    cart.value = cart.value.filter(item => item.id !== id)
  }

  watch(cart, (newCart) => {
    localStorage.setItem('myCart', JSON.stringify(newCart))
  }, { deep: true })

  const totalItemsCount = computed(() => {
    return cart.value.reduce((total, item) => total + item.quantity, 0)
  })

  const totalPrice = computed(() => {
    return cart.value.reduce((total, item) => total + (item.price * item.quantity), 0)
  })

  const clearCart = () => {
    cart.value = []
    localStorage.removeItem('myCart')
  }

  async function syncCartWithFirestore() {
    if (cart.value.length === 0) return
    isSyncing.value = true
    const updatedCart = []

    try {
      for (const item of cart.value) {
        const productRef = doc(db, 'products', item.id)
        const snap = await getDoc(productRef)

        if (!snap.exists()) {
          Toast.fire({
            icon: 'info',
            title: `تمت إزالة "${item.title}" من السلة لعدم توفره بالمتجر.`
          })
          continue
        }

        const freshData = snap.data()
        const livePrice = Number(freshData.price ?? item.price)
        const liveStock = Number(freshData.stock ?? 0)

        if (liveStock <= 0) {
          Toast.fire({
            icon: 'warning',
            title: `نفذت كمية "${item.title}" وتمت إزالته من السلة.`
          })
          continue
        }

        let adjustedQuantity = item.quantity
        if (item.quantity > liveStock) {
          adjustedQuantity = liveStock
          Toast.fire({
            icon: 'warning',
            title: `تم تعديل كمية "${item.title}" إلى ${liveStock} قطع حسب المتاح.`
          })
        }

        updatedCart.push({
          ...item,
          title: freshData.title || item.title,
          image: freshData.image || item.image,
          category: freshData.category || item.category,
          price: livePrice,
          stock: liveStock,
          quantity: adjustedQuantity
        })
      }

      cart.value = updatedCart
      localStorage.setItem('myCart', JSON.stringify(updatedCart))
    } catch (error) {
      console.error("Error syncing cart with Firestore:", error)
    } finally {
      isSyncing.value = false
    }
  }

  const freeShippingRemaining = computed(() => Math.max(0, FREE_SHIPPING_THRESHOLD - totalPrice.value))
  const freeShippingProgress = computed(() => Math.min(100, (totalPrice.value / FREE_SHIPPING_THRESHOLD) * 100))
  const hasFreeShipping = computed(() => totalPrice.value >= FREE_SHIPPING_THRESHOLD)

  return {
    cart,
    isSyncing,
    isMiniCartOpen,
    openMiniCart,
    closeMiniCart,
    toggleMiniCart,
    FREE_SHIPPING_THRESHOLD,
    freeShippingRemaining,
    freeShippingProgress,
    hasFreeShipping,
    addCart,
    totalItemsCount,
    totalPrice,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    syncCartWithFirestore
  }
})