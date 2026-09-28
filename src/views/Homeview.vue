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

      <!-- Empty State -->
      <div v-else-if="displayedProducts.length === 0" class="empty-state">
        <i class="fa-solid fa-box-open empty-icon"></i>
        <p>{{ t('home.noProducts') }}</p>
      </div>

      <!-- Real Products List -->
      <template v-else>
        <ProductCard 
          v-for="product in paginatedProducts" 
          :key="product.id" 
          :product="product" 
        />
      </template>
    </div>
    
    <!-- Responsive Pagination Controls -->
    <div class="pagination-nav" v-if="productStore.totalPages > 1 || productStore.hasMore || productStore.currentPage > 1">
      <button 
        type="button"
        class="page-btn" 
        :disabled="productStore.currentPage === 1 || productStore.isloading"
        @click="changePage(productStore.currentPage - 1)"
      >
        <i :class="isRtl ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left'"></i>
        <span>{{ t('pagination.prev') }}</span>
      </button>

      <span class="pagination-info">
        {{ t('pagination.pageOf', { current: productStore.currentPage, total: productStore.totalPages }) }}
        <span class="total-items-badge" v-if="productStore.totalProductsCount">
          {{ t('pagination.totalItemsBadge', { count: productStore.totalProductsCount }) }}
        </span>
      </span>

      <button 
        type="button"
        class="page-btn" 
        :disabled="!productStore.hasMore || productStore.isloading"
        @click="changePage(productStore.currentPage + 1)"
      >
        <span>{{ t('pagination.next') }}</span>
        <i :class="isRtl ? 'fa-solid fa-chevron-left' : 'fa-solid fa-chevron-right'"></i>
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '../stores/productstore'
import ProductCard from '../components/ProductCard.vue'
import SharedFilter from '../components/SharedFilter.vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const isRtl = computed(() => locale.value === 'ar')

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
  max-width: 1360px;
  margin: 32px auto;
  padding: 0 24px;
  width: 100%;
}

.filters-section {
  margin-bottom: 28px;
}

/* Standardized responsive grid: 4 cols on desktop (>1024px) */
.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  width: 100%;
}

/* Skeletons */
.product-card-skeleton {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.skeleton-thumb {
  width: 100%;
  aspect-ratio: 1 / 1;
}

.skeleton-card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-rate {
  width: 80px;
  height: 16px;
  border-radius: 4px;
}

.skeleton-title-row {
  width: 100%;
  height: 16px;
  border-radius: 4px;
}

.skeleton-title-row.short {
  width: 60%;
}

.skeleton-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}

.skeleton-price-tag {
  width: 60px;
  height: 24px;
  border-radius: 4px;
}

.skeleton-cart-btn {
  width: 80px;
  height: 38px;
  border-radius: 10px;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 16px;
  border: 1px dashed #cbd5e1;
  color: #64748b;
}

.empty-icon {
  font-size: 3rem;
  color: #cbd5e1;
  margin-bottom: 16px;
  display: block;
}

.empty-state p {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

/* Pagination */
.pagination-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 48px;
  padding: 16px 0;
}

.page-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  min-height: 44px;
  background-color: white;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  color: #1e293b;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.page-btn:hover:not(:disabled) {
  background-color: #059669;
  color: white;
  border-color: #059669;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2);
}

.page-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.pagination-info {
  font-size: 0.95rem;
  font-weight: 700;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 8px;
}

.total-items-badge {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}

/* Tablet (768px - 1024px): 3 columns */
@media (max-width: 1024px) {
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
}

/* Tablet Small (640px - 768px): 2 columns */
@media (max-width: 768px) {
  .home-container {
    margin: 20px auto;
    padding: 0 16px;
  }

  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .pagination-nav {
    flex-wrap: wrap;
    gap: 12px;
  }

  .pagination-info {
    order: -1;
    width: 100%;
    justify-content: center;
  }

  .page-btn {
    flex: 1;
    justify-content: center;
  }
}

/* Mobile (< 400px): 1 column clean flow */
@media (max-width: 400px) {
  .products-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>