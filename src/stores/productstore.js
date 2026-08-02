import { ref } from 'vue'
import { defineStore } from 'pinia'
import { collection, getDocs, doc, getDoc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

export const useProductStore = defineStore('productstore', () => {
  const products = ref([])
  const isloading = ref(false)
  
  const searchQuery = ref('')
  const currentPage = ref(1)
  const itemsPerPage = ref(8)

 async function fetchdata(force = false) {
  if (products.value.length > 0 && !force) return
  isloading.value = true
  try {
    const snapshots = await getDocs(collection(db, 'products'))
    const fetchedProducts = []
    snapshots.forEach((doc) => {
      fetchedProducts.push({ 
        id: doc.id, 
        lowStockThreshold: 5, 
        ...doc.data() 
      })
    })
    products.value = fetchedProducts
  } catch (error) {
    console.error(error)
  } finally {
    isloading.value = false
  }
}

  async function getProductById(id) {
    const existingProduct = products.value.find(p => p.id === id)
    if (existingProduct) return existingProduct

    try {
      const docref = doc(db, "products", id)
      const docsnap = await getDoc(docref)

      if (docsnap.exists()) {
        const fetchedProduct = { id: docsnap.id, lowStockThreshold: 5, ...docsnap.data() }
        products.value.push(fetchedProduct)
        return fetchedProduct
      }
      return null
    } catch (error) {
      console.error(error)
      return null
    }
  }

  function categoraise(category) {
    if (category === "الكل" || !category) return products.value
    return products.value.filter(p => p.category === category)
  }

  function updateReview(productId, newRev) {
    const target = products.value.find(p => p.id === productId)
    if (target) {
      if (!target.reviews) target.reviews = []
      target.reviews.push(newRev)
    }
  }

  async function updateProduct(id, updatedData) {
    try {
      const productRef = doc(db, 'products', id)
      const { id: _, ...dataToUpdate } = updatedData
      
      await updateDoc(productRef, dataToUpdate)
      
      const index = products.value.findIndex(p => p.id === id)
      if (index !== -1) {
        products.value[index] = { id, ...dataToUpdate }
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async function addProduct(productData) {
    try {
      const docRef = await addDoc(collection(db, 'products'), productData)
      products.value.unshift({ id: docRef.id, ...productData })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async function deleteProduct(id) {
    try {
      await deleteDoc(doc(db, 'products', id))
      products.value = products.value.filter(p => p.id !== id)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  return { 
    isloading, 
    products, 
    searchQuery,
    currentPage,
    itemsPerPage,
    fetchdata, 
    getProductById, 
    categoraise, 
    updateReview, 
    updateProduct, 
    addProduct, 
    deleteProduct 
  }
})