import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { collection, getDocs, doc, getDoc, updateDoc, addDoc, deleteDoc, query, orderBy, limit, startAfter, getCountFromServer, where } from 'firebase/firestore'
import { db } from '../firebase/config'

export const useProductStore = defineStore('productstore', () => {
  const products = ref([])
  const isloading = ref(false)
  
  const searchQuery = ref('')
  const currentPage = ref(1)
  const itemsPerPage = ref(8)
  const totalProductsCount = ref(0)
  const pageCursors = ref([])
  const hasMore = ref(false)
  const currentCategory = ref('')

  const totalPages = computed(() => {
    return Math.ceil(totalProductsCount.value / itemsPerPage.value) || 1
  })

  // جلب إجمالي عدد المنتجات المحسوب من السيرفر
  async function fetchTotalCount(category = '') {
    try {
      let q = collection(db, 'products')
      if (category && category !== 'الكل') {
        q = query(q, where('category', '==', category))
      }
      const countSnap = await getCountFromServer(q)
      totalProductsCount.value = countSnap.data().count
    } catch (e) {
      console.warn("Could not fetch total products count:", e)
    }
  }

  // جلب صفحة محددة بواسطة Firestore Cursor Pagination
  async function fetchProductsPage(targetPage = 1, options = {}) {
    const category = options.category !== undefined ? options.category : currentCategory.value
    const isCategoryChanged = category !== currentCategory.value
    if (isCategoryChanged || options.reset) {
      pageCursors.value = []
      currentCategory.value = category
      targetPage = 1
    }

    isloading.value = true
    try {
      if (totalProductsCount.value === 0 || isCategoryChanged || options.reset) {
        await fetchTotalCount(category)
      }

      let q
      const cursor = pageCursors.value[targetPage - 1]
      const constraints = []

      if (category && category !== 'الكل') {
        constraints.push(where('category', '==', category))
      }
      constraints.push(orderBy('title'))
      if (targetPage > 1 && cursor) {
        constraints.push(startAfter(cursor))
      }
      constraints.push(limit(itemsPerPage.value))

      q = query(collection(db, 'products'), ...constraints)
      const snapshots = await getDocs(q)
      
      const fetchedProducts = snapshots.docs.map((doc) => ({
        id: doc.id,
        lowStockThreshold: 5,
        ...doc.data()
      }))

      products.value = fetchedProducts
      
      if (snapshots.docs.length > 0) {
        pageCursors.value[targetPage] = snapshots.docs[snapshots.docs.length - 1]
      }

      hasMore.value = snapshots.docs.length === itemsPerPage.value
      currentPage.value = targetPage
    } catch (error) {
      console.error("Error in fetchProductsPage:", error)
      try {
        const fallbackConstraints = []
        if (category && category !== 'الكل') {
          fallbackConstraints.push(where('category', '==', category))
        }
        fallbackConstraints.push(limit(itemsPerPage.value))
        const fallbackSnap = await getDocs(query(collection(db, 'products'), ...fallbackConstraints))
        products.value = fallbackSnap.docs.map(doc => ({ id: doc.id, lowStockThreshold: 5, ...doc.data() }))
        hasMore.value = fallbackSnap.docs.length === itemsPerPage.value
        currentPage.value = targetPage
      } catch (err) {
        console.error("Fallback error:", err)
      }
    } finally {
      isloading.value = false
    }
  }

  async function fetchdata(force = false) {
    if (products.value.length > 0 && !force) return
    return fetchProductsPage(1, { reset: force })
  }

  async function nextPage() {
    if (hasMore.value && !isloading.value) {
      await fetchProductsPage(currentPage.value + 1)
    }
  }

  async function prevPage() {
    if (currentPage.value > 1 && !isloading.value) {
      await fetchProductsPage(currentPage.value - 1)
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

      const currentCount = Number(target.reviewCount ?? target.rating?.count ?? 0)
      const currentRate = Number(target.averageRating ?? target.rating?.rate ?? 0)
      const newCount = currentCount + 1
      const totalScore = currentRate * currentCount + Number(newRev.rating)
      const newAverage = Number((totalScore / newCount).toFixed(1))

      target.reviewCount = newCount
      target.averageRating = newAverage
      target.rating = { count: newCount, rate: newAverage }
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
    totalPages,
    hasMore,
    totalProductsCount,
    fetchProductsPage,
    nextPage,
    prevPage,
    fetchdata, 
    getProductById, 
    categoraise, 
    updateReview, 
    updateProduct, 
    addProduct, 
    deleteProduct 
  }
})