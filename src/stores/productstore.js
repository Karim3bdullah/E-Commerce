import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { collection, getDocs, doc, getDoc, updateDoc, addDoc, deleteDoc, query, orderBy, limit, startAfter, getCountFromServer, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import { handleFirebaseError } from '../services/feedback'

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

  // Polymorphic Variant & Unit Type Enrichment Engine
  function enrichProductWithVariants(product) {
    const cat = (product.category || '').toLowerCase()
    const title = (product.title || '').toLowerCase()

    let unitType = product.unitType
    let sizes = product.sizes ? [...product.sizes] : null
    let colors = product.colors ? [...product.colors] : null

    if (!unitType) {
      if (cat.includes('grocer') || cat.includes('fruit') || cat.includes('vegetable') || cat.includes('produce') || title.includes('apple') || title.includes('tomato')) {
        unitType = 'weight'
      } else {
        unitType = 'piece'
      }
    }

    if (unitType === 'piece') {
      if (!sizes) {
        if (cat.includes('shoe') || cat.includes('footwear')) {
          sizes = ['40', '41', '42', '43', '44', '45']
        } else if (cat.includes('clothing') || cat.includes('shirt') || cat.includes('apparel') || cat.includes('dress')) {
          sizes = ['S', 'M', 'L', 'XL', 'XXL']
        }
      }

      if (!colors) {
        if (cat.includes('shoe') || cat.includes('footwear')) {
          colors = [
            { name: 'Grey', hex: '#6b7280' },
            { name: 'Black', hex: '#000000' },
            { name: 'White', hex: '#ffffff' }
          ]
        } else if (cat.includes('clothing') || cat.includes('shirt') || cat.includes('apparel')) {
          colors = [
            { name: 'Black', hex: '#111827' },
            { name: 'White', hex: '#ffffff' },
            { name: 'Navy', hex: '#1e3a8a' },
            { name: 'Burgundy', hex: '#831843' }
          ]
        } else if (cat.includes('electronic') || cat.includes('laptop') || cat.includes('watch')) {
          colors = [
            { name: 'Space Grey', hex: '#374151' },
            { name: 'Silver', hex: '#e5e7eb' },
            { name: 'Midnight', hex: '#0f172a' }
          ]
        }
      }
    }

    return {
      ...product,
      unitType,
      sizes,
      colors,
      lowStockThreshold: product.lowStockThreshold || 5
    }
  }

  const sampleProduceFallback = [
    {
      id: 'prod-apple-red',
      title: 'Fresh Red Apples (تفاح أحمر سكري)',
      price: 35.00,
      category: 'groceries',
      description: 'تفاح أحمر سكري طازج منتقى بعناية. يباع بالوزن بالكيلوجرام وكسوره (0.25 كجم، 0.5 كجم، 1 كجم...).',
      image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
      stock: 120,
      lowStockThreshold: 15,
      unitType: 'weight',
      averageRating: 4.8,
      reviewCount: 22
    },
    {
      id: 'prod-tomato-organic',
      title: 'Organic Fresh Tomatoes (طماطم بلدية عضوية)',
      price: 25.50,
      category: 'groceries',
      description: 'طماطم عضوية طازجة غنية بالفيتامينات. تباع بالوزن بالكسور.',
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
      stock: 180,
      lowStockThreshold: 20,
      unitType: 'weight',
      averageRating: 4.7,
      reviewCount: 16
    }
  ]

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
      
      let fetchedProducts = snapshots.docs.map((docSnap) => enrichProductWithVariants({
        id: docSnap.id,
        ...docSnap.data()
      }))

      // If produce category is queried or on page 1 without produce, merge sample produce
      const hasProduce = fetchedProducts.some(p => p.unitType === 'weight')
      if (!hasProduce && (!category || category === 'groceries')) {
        fetchedProducts = [...sampleProduceFallback, ...fetchedProducts]
      }

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
        let fallbackProducts = fallbackSnap.docs.map(docSnap => enrichProductWithVariants({ id: docSnap.id, ...docSnap.data() }))
        if (!fallbackProducts.some(p => p.unitType === 'weight')) {
          fallbackProducts = [...sampleProduceFallback, ...fallbackProducts]
        }
        products.value = fallbackProducts
        hasMore.value = fallbackSnap.docs.length === itemsPerPage.value
        currentPage.value = targetPage
      } catch (err) {
        console.error("Fallback error:", err)
        products.value = sampleProduceFallback
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

    const fallbackMatch = sampleProduceFallback.find(p => p.id === id)
    if (fallbackMatch) {
      products.value.push(fallbackMatch)
      return fallbackMatch
    }

    try {
      const docref = doc(db, "products", id)
      const docsnap = await getDoc(docref)

      if (docsnap.exists()) {
        const fetchedProduct = enrichProductWithVariants({ id: docsnap.id, ...docsnap.data() })
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
    const { id: _, ...dataToUpdate } = updatedData
    
    // Always update local reactive state immediately
    const index = products.value.findIndex(p => p.id === id)
    if (index !== -1) {
      products.value[index] = enrichProductWithVariants({ id, ...products.value[index], ...dataToUpdate })
    }

    try {
      const productRef = doc(db, 'products', id)
      await updateDoc(productRef, dataToUpdate)
    } catch (error) {
      console.warn("Firestore updateDoc notice:", error.code, error.message)
      handleFirebaseError(error, 'feedback.genericError')
      // Even if Firestore update errors with permission-denied, local in-memory change remains active
    }
  }

  async function addProduct(productData) {
    const enriched = enrichProductWithVariants({
      id: 'prod_' + Date.now(),
      ...productData
    })

    try {
      const docRef = await addDoc(collection(db, 'products'), productData)
      enriched.id = docRef.id
      products.value.unshift(enriched)
    } catch (error) {
      console.warn("Firestore addDoc notice:", error.code, error.message)
      products.value.unshift(enriched)
      handleFirebaseError(error, 'feedback.genericError')
    }
  }

  async function deleteProduct(id) {
    products.value = products.value.filter(p => p.id !== id)
    try {
      await deleteDoc(doc(db, 'products', id))
    } catch (error) {
      console.warn("Firestore deleteDoc notice:", error.code, error.message)
      handleFirebaseError(error, 'feedback.genericError')
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
    deleteProduct,
    enrichProductWithVariants
  }
})