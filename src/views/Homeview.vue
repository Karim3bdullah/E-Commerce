<template>
  <div class="home-container">
    
    <div class="filters-section">
      <SharedFilter :categories="translatedCategories" @filter="handleCategoryFilter" />
    </div>

    <div class="products-grid">
      <!-- Shimmer Skeleton Grid -->
      <template v-if="productStore.isloading">
        <div v-for="i in 8" :key="i" class="product-card-skeleton">
          <div class="skeleton-shimmer skeleton-thumb"></div>
          <div class="skeleton-card-body">
            <div class="skeleton-shimmer skeleton-rate"></div>
            <div class="skeleton-shimmer skeleton-title-row"></div>
            <div class="skeleton-shimmer skeleton-title-row short"></div>
            <div class="skeleton-card-footer">
              <div class="skeleton-shimmer skeleton-price-tag"></div>
              <div class="skeleton-shimmer skeleton-cart-btn"></div>
            </div>
          </div>
        </div>
      </template>

      <div v-else-if="displayedProducts.length === 0" class="empty-state">
        <i class="fa-solid fa-box-open empty-icon"></i>
        <p>لا توجد منتجات مطابقة للبحث أو القسم المختار.</p>
      </div>

      <template v-else>
        <ProductCard 
          v-for="product in paginatedProducts" 
          :key="product.id" 
          :product="product" 
        />
      </template>
    </div>
    
    <div class="pagination-nav" v-if="productStore.totalPages > 1 || productStore.hasMore || productStore.currentPage > 1">
      <button 
        class="page-btn" 
        :disabled="productStore.currentPage === 1 || productStore.isloading"
        @click="changePage(productStore.currentPage - 1)"
      >السابق</button>

      <span class="pagination-info">
        الصفحة {{ productStore.currentPage }} من {{ productStore.totalPages }}
        <span class="total-items-badge" v-if="productStore.totalProductsCount">({{ productStore.totalProductsCount }} منتج إجمالاً)</span>
      </span>

      <button 
        class="page-btn" 
        :disabled="!productStore.hasMore || productStore.isloading"
        @click="changePage(productStore.currentPage + 1)"
      >التالي</button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '../stores/productstore'
import ProductCard from '../components/ProductCard.vue'
import SharedFilter from '../components/SharedFilter.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const productStore = useProductStore()
const selectedCategory = ref('')

const displayedProducts = computed(() => {
  const query = (productStore.searchQuery || '').toLowerCase()
  
  return productStore.products.filter(item => {
    const titleMatch = (item.title || '').toLowerCase().includes(query)
    const categoryMatch = !selectedCategory.value || item.category === selectedCategory.value
    
    return titleMatch && categoryMatch
  })
})

const paginatedProducts = computed(() => {
  return displayedProducts.value
})

const changePage = async (pageNumber) => {
  if (pageNumber > productStore.currentPage) {
    await productStore.nextPage()
  } else if (pageNumber < productStore.currentPage) {
    await productStore.prevPage()
  }
  window.scrollTo({ top: 0, behavior: 'smooth' }) 
}

const translateCategory = (cat) => {
  if (!cat) return ''
  const cleanKey = cat.trim().toLowerCase().replace(/'/g, '')
  const translation = t(`categories['${cleanKey}']`)
  
  if (translation === `categories['${cleanKey}']` || translation.includes('categories')) {
    return cat 
  }
  return translation
}

const availableCategories = [
  'electronics', 'jewelery', 'mens clothing', 'womens clothing',
  'kitchen-accessories', 'fragrances', 'laptops', 'groceries',
  'home-decoration', 'furniture', 'mens-shoes', 'womens-shoes',
  'mens-shirts', 'beauty', 'mens-watches', 'mobile-accessories'
]

const translatedCategories = computed(() => {
  return availableCategories.map(cat => ({
    original: cat,
    translated: translateCategory(cat) 
  }))
})

const handleCategoryFilter = (category) => {
  selectedCategory.value = category
  productStore.fetchProductsPage(1, { category, reset: true })
}

onMounted(() => {
  productStore.fetchdata()
})
</script>

<style scoped>
.home-container {
  max-width: 1300px;
  margin: 40px auto;
  padding: 0 20px;
}

.filters-section {
  margin-bottom: 30px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
}

/* Skeletons */
.product-card-skeleton {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
}

.skeleton-thumb {
  width: 100%;
  aspect-ratio: 1 / 1;
}

.skeleton-card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-rate {
  width: 90px;
  height: 16px;
  border-radius: 4px;
}

.skeleton-title-row {
  width: 100%;
  height: 18px;
  border-radius: 4px;
}

.skeleton-title-row.short {
  width: 65%;
}

.skeleton-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  margin-top: 4px;
  border-top: 1px solid #f1f5f9;
}

.skeleton-price-tag {
  width: 70px;
  height: 24px;
  border-radius: 6px;
}

.skeleton-cart-btn {
  width: 80px;
  height: 36px;
  border-radius: 8px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 80px 20px;
  color: #64748b;
  font-size: 1.2rem;
  background: #f8fafc;
  border-radius: 16px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 15px;
  color: #cbd5e1;
}
.pagination-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 40px;
  padding-bottom: 20px;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid #cbd5e1;
  background-color: #ffffff;
  color: #334155;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.page-btn:hover:not(:disabled) {
  background-color: #f1f5f9;
  border-color: #94a3b8;
}

.page-btn.active {
  background-color: #2563eb;
  color: white;
  border-color: #2563eb;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.95rem;
  font-weight: 700;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 8px;
}

.total-items-badge {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}
</style>