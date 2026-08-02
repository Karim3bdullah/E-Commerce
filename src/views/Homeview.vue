<template>
  <div class="home-container">
    
    <div class="filters-section">
      <SharedFilter :categories="translatedCategories" @filter="handleCategoryFilter" />
    </div>

    <div class="products-grid">
      <div v-if="productStore.isloading" class="loading-state">
        <i class="fa-solid fa-spinner fa-spin"></i> جاري جلب المنتجات...
      </div>

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
    
    <div class="pagination-nav" v-if="totalPages > 1">
      <button 
        class="page-btn" 
        :disabled="productStore.currentPage === 1"
        @click="changePage(productStore.currentPage - 1)"
      >السابق</button>

      <template v-for="(page, index) in visiblePages" :key="index">
        <span v-if="page === '...'" class="dots">...</span>
        
        <button 
          v-else
          :class="['page-btn', { active: productStore.currentPage === page }]"
          @click="changePage(page)"
        >{{ page }}</button>
      </template>

      <button 
        class="page-btn" 
        :disabled="productStore.currentPage === totalPages"
        @click="changePage(productStore.currentPage + 1)"
      >التالي</button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
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

const totalPages = computed(() => {
  return Math.ceil(displayedProducts.value.length / productStore.itemsPerPage) || 1
})

const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = productStore.currentPage;

  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  
  const pages = [];
  pages.push(1);
  
  if (current > 3) pages.push('...'); 
  
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  if (current < total - 2) pages.push('...');
  
  pages.push(total); 
  
  return pages;
})

const paginatedProducts = computed(() => {
  const start = (productStore.currentPage - 1) * productStore.itemsPerPage
  const end = start + productStore.itemsPerPage
  return displayedProducts.value.slice(start, end)
})

const changePage = (pageNumber) => {
  if (pageNumber >= 1 && pageNumber <= totalPages.value) {
    productStore.currentPage = pageNumber
    window.scrollTo({ top: 0, behavior: 'smooth' }) 
  }
}

watch([() => productStore.searchQuery, selectedCategory], () => {
  productStore.currentPage = 1
})

const translateCategory = (cat) => {
  if (!cat) return ''
  const cleanKey = cat.trim().toLowerCase().replace(/'/g, '')
  const translation = t(`categories['${cleanKey}']`)
  
  if (translation === `categories['${cleanKey}']` || translation.includes('categories')) {
    return cat 
  }
  return translation
}

const translatedCategories = computed(() => {
  const uniqueCats = [...new Set(productStore.products.map(p => p.category))]
  return uniqueCats.map(cat => ({
    original: cat,
    translated: translateCategory(cat) 
  }))
})

const handleCategoryFilter = (category) => {
  selectedCategory.value = category
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

.loading-state, .empty-state {
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
</style>