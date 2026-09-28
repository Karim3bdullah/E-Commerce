import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { db } from '../firebase/config'
import { doc, getDoc } from 'firebase/firestore'
import { notifySuccess, notifyWarning, notifyInfo, notifyError } from '../services/feedback'
import i18n from '../i18n'

const t = (key, params) => i18n.global.t(key, params)

export const useCartStore = defineStore('cartStore', () => {
  const cart = ref(JSON.parse(localStorage.getItem('myCart')) || [])
  const isSyncing = ref(false)
  const isMiniCartOpen = ref(false)
  const FREE_SHIPPING_THRESHOLD = 150

  // Promo Code State
  const appliedCoupon = ref(JSON.parse(localStorage.getItem('myCoupon')) || null)
  const availableCoupons = {
    'SAVE10': 10,
    'WELCOME20': 20
  }

  const openMiniCart = () => { isMiniCartOpen.value = true }
  const closeMiniCart = () => { isMiniCartOpen.value = false }
  const toggleMiniCart = () => { isMiniCartOpen.value = !isMiniCartOpen.value }

  // Composite Key Generator for polymorphic variants & units
  function generateCartKey(product, options = {}) {
    const size = options.selectedSize || product.selectedSize || 'none'
    const color = options.selectedColor?.name || options.selectedColor || product.selectedColor?.name || product.selectedColor || 'none'
    const unit = options.unitType || product.unitType || 'piece'
    return `${product.id}_${color}_${size}_${unit}`
  }

  function addCart(product, options = {}) {
    const unitType = options.unitType || product.unitType || 'piece'
    const selectedSize = options.selectedSize || product.selectedSize || null
    const selectedColor = options.selectedColor || product.selectedColor || null
    
    // Weight default is 0.25kg, Piece default is 1
    const qtyToAdd = unitType === 'weight' 
      ? Number(options.selectedWeight || options.quantity || 0.25)
      : Number(options.quantity || 1)

    const cartItemId = generateCartKey(product, { selectedSize, selectedColor, unitType })
    const existingItem = cart.value.find(item => item.cartItemId === cartItemId || (item.id === product.id && !item.cartItemId && !item.selectedSize && !item.selectedColor))

    if (existingItem) {
      if (unitType === 'weight') {
        existingItem.quantity = Number((existingItem.quantity + qtyToAdd).toFixed(2))
        notifySuccess(t('feedback.itemAdded'))
        openMiniCart()
      } else {
        if (existingItem.quantity + qtyToAdd <= product.stock) {
          existingItem.quantity += qtyToAdd
          notifySuccess(t('feedback.itemAdded'))
          openMiniCart()
        } else {
          notifyWarning(t('cart.limitReached'))
        }
      }
    } else {
      if (product.stock > 0 || unitType === 'weight') {
        cart.value.push({
          ...product,
          cartItemId,
          unitType,
          selectedSize,
          selectedColor,
          quantity: qtyToAdd
        })
        notifySuccess(t('feedback.itemAdded'))
        openMiniCart()
      }
    }
  }

  const increaseQuantity = (cartItemId) => {
    const item = cart.value.find(i => (i.cartItemId === cartItemId || i.id === cartItemId))
    if (item) {
      if (item.unitType === 'weight') {
        item.quantity = Number((item.quantity + 0.25).toFixed(2))
      } else {
        if (item.quantity < item.stock) {
          item.quantity++
        } else {
          notifyWarning(t('cart.limitReached'))
        }
      }
    }
  }

  const decreaseQuantity = (cartItemId) => {
    const item = cart.value.find(i => (i.cartItemId === cartItemId || i.id === cartItemId))
    if (item) {
      if (item.unitType === 'weight') {
        if (item.quantity > 0.25) {
          item.quantity = Number((item.quantity - 0.25).toFixed(2))
        } else {
          removeFromCart(cartItemId)
        }
      } else {
        if (item.quantity > 1) {
          item.quantity--
        } else {
          removeFromCart(cartItemId)
        }
      }
    }
  }

  const removeFromCart = (cartItemId) => {
    cart.value = cart.value.filter(i => (i.cartItemId !== cartItemId && i.id !== cartItemId))
  }

  watch(cart, (newCart) => {
    localStorage.setItem('myCart', JSON.stringify(newCart))
  }, { deep: true })

  // Total count: integer count for piece, 1 per distinct weight item
  const totalItemsCount = computed(() => {
    return cart.value.reduce((total, item) => total + (item.unitType === 'weight' ? 1 : item.quantity), 0)
  })

  // Subtotal
  const totalPrice = computed(() => {
    return cart.value.reduce((total, item) => total + (item.price * item.quantity), 0)
  })

  // Coupon Engine
  const applyCoupon = (rawCode) => {
    if (!rawCode) return false
    const clean = rawCode.trim().toUpperCase()
    if (availableCoupons[clean]) {
      appliedCoupon.value = {
        code: clean,
        discountPercent: availableCoupons[clean]
      }
      localStorage.setItem('myCoupon', JSON.stringify(appliedCoupon.value))
      notifySuccess(t('promo.appliedSuccess', { percent: availableCoupons[clean] }))
      return true
    } else {
      notifyError(t('promo.invalidCode'))
      return false
    }
  }

  const removeCoupon = () => {
    appliedCoupon.value = null
    localStorage.removeItem('myCoupon')
  }

  const discountAmount = computed(() => {
    if (!appliedCoupon.value) return 0
    return Number(((totalPrice.value * appliedCoupon.value.discountPercent) / 100).toFixed(2))
  })

  const finalPrice = computed(() => {
    return Math.max(0, Number((totalPrice.value - discountAmount.value).toFixed(2)))
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
          notifyInfo(`تمت إزالة "${item.title}" من السلة لعدم توفره بالمتجر.`)
          continue
        }

        const freshData = snap.data()
        const livePrice = Number(freshData.price ?? item.price)
        const liveStock = Number(freshData.stock ?? 0)

        if (liveStock <= 0 && item.unitType !== 'weight') {
          notifyWarning(`نفذت كمية "${item.title}" وتمت إزالته من السلة.`)
          continue
        }

        let adjustedQuantity = item.quantity
        if (item.unitType !== 'weight' && item.quantity > liveStock) {
          adjustedQuantity = liveStock
          notifyWarning(`تم تعديل كمية "${item.title}" إلى ${liveStock} قطع حسب المتاح.`)
        }

        updatedCart.push({
          ...item,
          title: freshData.title || item.title,
          image: freshData.image || item.image,
          category: freshData.category || item.category,
          price: livePrice,
          stock: liveStock,
          quantity: adjustedQuantity,
          unitType: freshData.unitType || item.unitType || 'piece',
          cartItemId: item.cartItemId || generateCartKey(item, { selectedSize: item.selectedSize, selectedColor: item.selectedColor, unitType: item.unitType })
        })
      }

      cart.value = updatedCart
      localStorage.setItem('myCart', JSON.stringify(updatedCart))
    } catch (error) {
      console.warn("Cart sync notice:", error)
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
    syncCartWithFirestore,
    generateCartKey,
    // Coupon
    appliedCoupon,
    availableCoupons,
    applyCoupon,
    removeCoupon,
    discountAmount,
    finalPrice
  }
})