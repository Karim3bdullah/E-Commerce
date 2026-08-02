import { defineStore } from 'pinia'
import {ref,computed ,watch} from'vue'
import Swal from 'sweetalert2'

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
     
   function addCart(product) {
  const existingItem = cart.value.find(item => item.id === product.id)
  
  if (existingItem) {
    if (existingItem.quantity < product.stock) {
      existingItem.quantity++
      Toast.fire({
        icon: 'success',
        title: `تم زيادة كمية ${product.title} في السلة`
      })
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
  }
  return{cart,addCart ,totalItemsCount ,totalPrice,increaseQuantity, decreaseQuantity, removeFromCart,clearCart }

})