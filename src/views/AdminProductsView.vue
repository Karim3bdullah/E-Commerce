<template>
  <AdminLayout>
    <div class="admin-container">
      <div class="table-header">
        <h2>{{ t('admin.productsManage') }}</h2>
        
        <div class="filters-wrapper">
          <SharedFilter :categories="translatedCategories" @filter="handleCategoryFilter" />
        </div>

        <button class="btn btn-add" @click="openAddProductModal" :disabled="isSubmitting">
          <span>{{ t('admin.addProduct') }}</span>
          <i class="fa-solid fa-plus"></i>
        </button>
      </div>

      <div class="table-responsive">
        <table class="product-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{{ t('admin.productImage') }}</th>
              <th>{{ t('admin.productName') }}</th>
              <th>{{ t('admin.category') }}</th>
              <th>{{ t('admin.price') }}</th>
              <th>{{ t('admin.stock') }}</th> 
              <th>{{ t('admin.alertLimit') }}</th>
              <th>{{ t('admin.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="productStore.isloading">
              <td colspan="8" class="loading-state">
                <i class="fa-solid fa-spinner fa-spin"></i> {{ t('home.loadingProducts') }}
              </td>
            </tr>

            <template v-else>
              <tr v-for="(product, index) in paginatedProducts" :key="product.id">
                <td class="index-col">{{ ((productStore.currentPage - 1) * productStore.itemsPerPage) + index + 1 }}</td>
                
                <td>
                  <img :src="product.image" :alt="product.title" class="product-img" @error="handleImageError">
                </td>
                
                <td class="title-col">
                  <div class="title-cell-wrap">
                    <span class="product-main-title">{{ product.title }}</span>
                    <div class="variant-tags-row">
                      <span v-if="product.unitType === 'weight'" class="tag-pill weight-tag">
                        <i class="fa-solid fa-scale-balanced"></i> {{ t('variants.soldByWeight') }}
                      </span>
                      <span v-if="product.sizes && product.sizes.length > 0" class="tag-pill size-tag">
                        {{ product.sizes.length }} {{ t('variants.size') }}
                      </span>
                      <span v-if="product.colors && product.colors.length > 0" class="tag-pill color-tag">
                        {{ product.colors.length }} {{ t('variants.color') }}
                      </span>
                    </div>
                  </div>
                </td>
                <td><span class="category-badge">{{ translateCategory(product.category) }}</span></td>
                <td class="price-col">
                  ${{ Number(product.price).toFixed(2) }}
                  <span class="unit-subscript">{{ product.unitType === 'weight' ? t('variants.perKg') : '' }}</span>
                </td>
                
                <td>
                  <span class="stock-badge">
                    {{ product.stock }} {{ product.unitType === 'weight' ? t('variants.kg') : '' }}
                  </span>
                </td>

                <td>
                  <span :class="['alert-badge', product.stock <= (product.lowStockThreshold || 5) ? 'alert-active' : '']">
                    {{ product.stock <= (product.lowStockThreshold || 5) ? t('admin.stockWarning', { count: (product.lowStockThreshold || 5) }) : t('admin.stockSafe') }}
                  </span>
                </td>
                
                <td class="action-buttons">
                  <button type="button" class="btn btn-edit" @click="openEditProductModal(product)" :disabled="isSubmitting" :title="t('common.edit')">
                    <i class="fa-solid fa-pen"></i> {{ t('common.edit') }}
                  </button>
                  <button type="button" class="btn btn-delete" @click="confirmProductDeletion(product.id)" :disabled="isSubmitting" :title="t('common.delete')">
                    <i class="fa-solid fa-trash"></i> {{ t('common.delete') }}
                  </button>
                </td>
              </tr>
              
              <tr v-if="paginatedProducts.length === 0">
                <td colspan="8" class="empty-state">
                  <i class="fa-solid fa-box-open empty-icon"></i>
                  <p>{{ t('home.noProducts') }}</p>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      <div class="pagination-nav" v-if="totalPages > 1">
        <button 
          type="button"
          class="page-btn" 
          :disabled="productStore.currentPage === 1 || productStore.isloading"
          @click.prevent="changePage(productStore.currentPage - 1)"
        >
          <i :class="isRtl ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left'"></i>
          {{ t('pagination.prev') }}
        </button>

        <button 
          type="button"
          v-for="page in totalPages" 
          :key="page"
          :class="['page-btn', { active: productStore.currentPage === page }]"
          @click.prevent="changePage(page)"
          :disabled="productStore.isloading"
        >
          {{ page }}
        </button>

        <button 
          type="button"
          class="page-btn" 
          :disabled="productStore.currentPage === totalPages || productStore.isloading"
          @click.prevent="changePage(productStore.currentPage + 1)"
        >
          {{ t('pagination.next') }}
          <i :class="isRtl ? 'fa-solid fa-chevron-left' : 'fa-solid fa-chevron-right'"></i>
        </button>
      </div>
      
      <!-- Add / Edit Modal -->
      <div v-if="isModalVisible" class="modal-overlay" @click.self="closeProductModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ isEditModeActive ? t('admin.editProduct') : t('admin.addProduct') }}</h3>
            <button type="button" class="close-btn" @click="closeProductModal" :disabled="isSubmitting" :aria-label="t('common.close')">&times;</button>
          </div>
          
          <form @submit.prevent="handleFormSubmission" class="modal-form">
            <div class="form-row">
              <div class="form-group">
                <label>{{ t('admin.productName') }}</label>
                <input type="text" v-model="productFormState.title" required>
              </div>
              <div class="form-group">
                <label>{{ t('admin.category') }}</label>
                <input type="text" v-model="productFormState.category" required>
              </div>
            </div>
            
            <!-- Selling Unit Type Selector -->
            <div class="form-row">
              <div class="form-group">
                <label>{{ t('variants.unitType') }}</label>
                <select v-model="productFormState.unitType" class="form-select">
                  <option value="piece">{{ t('variants.piece') }}</option>
                  <option value="weight">{{ t('variants.weight') }}</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>{{ productFormState.unitType === 'weight' ? t('variants.pricePerKg') : t('variants.pricePerPiece') }}</label>
                <input type="number" step="0.01" v-model="productFormState.price" required min="0.01">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>{{ productFormState.unitType === 'weight' ? t('variants.stockKg') : t('variants.stockPiece') }}</label>
                <input type="number" step="0.25" v-model="productFormState.stock" required min="0">
              </div>
              <div class="form-group">
                <label>{{ t('admin.productAlertLimit') }}</label>
                <input type="number" v-model="productFormState.lowStockThreshold" required min="0">
              </div>
            </div>

            <!-- Dynamic Variants Section (For Piece items) -->
            <div v-if="productFormState.unitType === 'piece'" class="variants-config-card">
              <h4 class="variants-config-title"><i class="fa-solid fa-shapes"></i> إعداد الخيارات والمقاسات (Variants)</h4>

              <!-- Sizes Configuration -->
              <div class="variant-toggle-row">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="enableSizes">
                  <span>{{ t('variants.enableSizes') }}</span>
                </label>
              </div>

              <div v-if="enableSizes" class="variant-inputs-box">
                <div class="presets-row">
                  <span class="preset-label">اختيار سريع:</span>
                  <button type="button" class="preset-pill" @click="applySizePreset('clothing')">الملابس (S, M, L, XL, XXL)</button>
                  <button type="button" class="preset-pill" @click="applySizePreset('shoes')">الأحذية (40, 41, 42, 43, 44)</button>
                </div>
                
                <div class="custom-size-add">
                  <input 
                    type="text" 
                    v-model="newSizeInput" 
                    placeholder="أدخل مقاساً (مثال: 46 أو 3XL)" 
                    @keyup.enter.prevent="addCustomSize"
                  >
                  <button type="button" class="add-sub-btn" @click="addCustomSize">إضافة</button>
                </div>

                <div class="active-tags-list" v-if="productFormState.sizes && productFormState.sizes.length > 0">
                  <span v-for="s in productFormState.sizes" :key="s" class="size-chip">
                    {{ s }}
                    <i class="fa-solid fa-xmark remove-tag-icon" @click="removeSize(s)"></i>
                  </span>
                </div>
              </div>

              <!-- Colors Configuration -->
              <div class="variant-toggle-row mt-3">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="enableColors">
                  <span>{{ t('variants.enableColors') }}</span>
                </label>
              </div>

              <div v-if="enableColors" class="variant-inputs-box">
                <div class="custom-color-add">
                  <input type="text" v-model="newColorName" placeholder="اسم اللون (مثال: أسود، أزرق داكن)">
                  <input type="color" v-model="newColorHex" class="color-picker-input" title="اختر اللون">
                  <button type="button" class="add-sub-btn" @click="addCustomColor">إضافة لون</button>
                </div>

                <div class="active-tags-list" v-if="productFormState.colors && productFormState.colors.length > 0">
                  <span v-for="c in productFormState.colors" :key="c.name" class="color-chip">
                    <span class="color-dot" :style="{ backgroundColor: c.hex }"></span>
                    <span>{{ c.name }}</span>
                    <i class="fa-solid fa-xmark remove-tag-icon" @click="removeColor(c.name)"></i>
                  </span>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>{{ t('admin.desc') }}</label>
              <textarea v-model="productFormState.description" rows="3" required></textarea>
            </div>

            <div class="form-group">
              <label>{{ t('admin.imageLink') }}</label>
              <input type="url" v-model="productFormState.image" required>
              <div v-if="productFormState.image" class="image-preview">
                <img :src="productFormState.image" alt="preview" @error="handleImageError">
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-cancel" @click="closeProductModal" :disabled="isSubmitting">
                {{ t('common.cancel') }}
              </button>
              <button type="submit" class="btn-save" :disabled="isSubmitting">
                {{ isSubmitting ? t('common.processing') : (isEditModeActive ? t('common.save') : t('admin.addProduct')) }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { useProductStore } from '../stores/productstore'
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import SharedFilter from '../components/SharedFilter.vue'
import AdminLayout from '../components/AdminLayout.vue' 
import { useI18n } from 'vue-i18n'
import { notifySuccess, notifyError } from '../services/feedback'

const route = useRoute()
const { t, locale } = useI18n()
const isRtl = computed(() => locale.value === 'ar')
const productStore = useProductStore()

const isModalVisible = ref(false)
const isEditModeActive = ref(false)
const isSubmitting = ref(false)
const selectedCategoryFilter = ref('')

const enableSizes = ref(false)
const enableColors = ref(false)
const newSizeInput = ref('')
const newColorName = ref('')
const newColorHex = ref('#000000')

const productFormState = ref({
  id: '',
  title: '',
  category: '',
  price: 0,
  stock: 0,
  lowStockThreshold: 5,
  unitType: 'piece',
  sizes: [],
  colors: [],
  image: '',
  description: '' 
})

onMounted(async () => {
  await productStore.fetchdata()
  checkDeepLinkEdit()
})

watch(() => route.query.editProduct, () => {
  checkDeepLinkEdit()
})

const checkDeepLinkEdit = async () => {
  const targetId = route.query.editProduct
  if (targetId) {
    const prod = await productStore.getProductById(targetId)
    if (prod) {
      openEditProductModal(prod)
    }
  }
}

const translateCategory = (cat) => {
  if (!cat) return ''
  const cleanKey = cat.replace(/'/g, '')
  const translation = t(`categories['${cleanKey}']`)
  if (translation.includes('categories[')) return cat 
  return translation
}

const uniqueCategories = computed(() => {
  const categoriesList = productStore.products.map(item => item.category)
  return [...new Set(categoriesList)]
})

const translatedCategories = computed(() => {
  return uniqueCategories.value.map(cat => ({
    original: cat,
    translated: translateCategory(cat)
  }))
})

const filteredProductsList = computed(() => {
  const queryText = (productStore.searchQuery || '').toLowerCase()
  
  return productStore.products.filter(item => {
    const itemTitle = (item.title || '').toLowerCase()
    const matchesSearchText = itemTitle.includes(queryText)
    const matchesSelectedCategory = !selectedCategoryFilter.value || item.category === selectedCategoryFilter.value
    
    return matchesSearchText && matchesSelectedCategory
  })
})

const totalPages = computed(() => {
  return Math.ceil(filteredProductsList.value.length / productStore.itemsPerPage) || 1
})

const paginatedProducts = computed(() => {
  const start = (productStore.currentPage - 1) * productStore.itemsPerPage
  const end = start + productStore.itemsPerPage
  return filteredProductsList.value.slice(start, end)
})

const changePage = (pageNumber) => {
  if (pageNumber >= 1 && pageNumber <= totalPages.value) {
    productStore.currentPage = pageNumber
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
}

const handleCategoryFilter = (category) => {
  selectedCategoryFilter.value = category
  productStore.currentPage = 1 
}

const handleImageError = (event) => {
  event.target.src = 'https://placehold.co/150x150?text=No+Image'
}

const openAddProductModal = () => {
  isEditModeActive.value = false
  enableSizes.value = false
  enableColors.value = false
  productFormState.value = { 
    id: '', 
    title: '', 
    category: '', 
    price: 0, 
    stock: 0, 
    lowStockThreshold: 5, 
    unitType: 'piece',
    sizes: [],
    colors: [],
    image: '', 
    description: '' 
  }
  isModalVisible.value = true
}

const openEditProductModal = (productData) => {
  isEditModeActive.value = true
  enableSizes.value = Array.isArray(productData.sizes) && productData.sizes.length > 0
  enableColors.value = Array.isArray(productData.colors) && productData.colors.length > 0
  productFormState.value = { 
    ...productData, 
    unitType: productData.unitType || 'piece',
    sizes: productData.sizes ? [...productData.sizes] : [],
    colors: productData.colors ? [...productData.colors] : [],
    lowStockThreshold: productData.lowStockThreshold || 5 
  }
  isModalVisible.value = true
}

const closeProductModal = () => {
  if (isSubmitting.value) return
  isModalVisible.value = false
}

const applySizePreset = (type) => {
  if (type === 'clothing') {
    productFormState.value.sizes = ['S', 'M', 'L', 'XL', 'XXL']
  } else if (type === 'shoes') {
    productFormState.value.sizes = ['40', '41', '42', '43', '44', '45']
  }
}

const addCustomSize = () => {
  const val = newSizeInput.value.trim().toUpperCase()
  if (val && !productFormState.value.sizes.includes(val)) {
    productFormState.value.sizes.push(val)
    newSizeInput.value = ''
  }
}

const removeSize = (s) => {
  productFormState.value.sizes = productFormState.value.sizes.filter(item => item !== s)
}

const addCustomColor = () => {
  const name = newColorName.value.trim()
  if (name && !productFormState.value.colors.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    productFormState.value.colors.push({
      name,
      hex: newColorHex.value || '#000000'
    })
    newColorName.value = ''
  }
}

const removeColor = (colorName) => {
  productFormState.value.colors = productFormState.value.colors.filter(c => c.name !== colorName)
}

const confirmProductDeletion = async (productId) => {
  if (confirm(t('admin.confirmDeleteProductText'))) {
    isSubmitting.value = true
    try {
      await productStore.deleteProduct(productId)
      notifySuccess(t('admin.deleteProductSuccess'))
    } catch (err) {
      notifyError(t('common.error'))
    } finally {
      isSubmitting.value = false
    }
  }
}

const handleFormSubmission = async () => {
  if (isSubmitting.value) return
  
  try {
    isSubmitting.value = true

    const standardizedPayload = {
      ...productFormState.value,
      title: productFormState.value.title.trim(),
      category: productFormState.value.category.trim(),
      description: productFormState.value.description.trim(),
      image: productFormState.value.image.trim(),
      price: Number(productFormState.value.price),
      stock: Number(productFormState.value.stock),
      lowStockThreshold: Number(productFormState.value.lowStockThreshold),
      unitType: productFormState.value.unitType,
      sizes: enableSizes.value ? productFormState.value.sizes : null,
      colors: enableColors.value ? productFormState.value.colors : null
    }

    if (isEditModeActive.value) {
      await productStore.updateProduct(standardizedPayload.id, standardizedPayload)
    } else {
      const { id: _, ...dataPayloadWithoutId } = standardizedPayload
      await productStore.addProduct(dataPayloadWithoutId)
    }

    closeProductModal()
    notifySuccess(t('feedback.productUpdated'))

  } catch (error) {
    console.error(error)
    notifyError(t('common.error'), error.message)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.admin-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: #ffffff;
  padding: 20px 24px;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  gap: 16px;
  flex-wrap: wrap;
}

.table-header h2 {
  margin: 0;
  color: #1e293b;
  font-weight: 800;
  font-size: 1.5rem;
}

.filters-wrapper {
  display: flex;
  gap: 12px;
  flex: 1;
  max-width: 320px;
  min-width: 220px;
}

.btn {
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  font-family: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-add {
  background-color: var(--primary-color, #2563eb);
  color: #ffffff;
  font-size: 0.95rem;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.btn-add:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.btn-edit {
  background-color: #f59e0b;
  color: white;
  font-size: 0.85rem;
}
.btn-edit:hover:not(:disabled) {
  background-color: #d97706;
}

.btn-delete {
  background-color: #ef4444;
  color: white;
  font-size: 0.85rem;
}
.btn-delete:hover:not(:disabled) {
  background-color: #dc2626;
}

.table-responsive {
  width: 100%;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0,0,0,0.05);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.product-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 850px;
}

.product-table th, .product-table td {
  padding: 16px 18px;
  text-align: start;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  white-space: nowrap; 
}

.title-col {
  white-space: normal;
  min-width: 220px;
  max-width: 280px;
}

.title-cell-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.product-main-title {
  font-weight: 700;
  color: #1e293b;
  line-height: 1.4;
}

.variant-tags-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag-pill {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}

.weight-tag {
  background: #ecfdf5;
  color: #059669;
}

.size-tag {
  background: #eff6ff;
  color: #2563eb;
}

.color-tag {
  background: #fdf2f8;
  color: #db2777;
}

.product-table th {
  background-color: #f8fafc;
  color: #475569;
  font-weight: 700;
  font-size: 0.875rem;
}

.product-table tbody tr:hover {
  background-color: #f8fafc;
}

.index-col {
  font-weight: 800;
  color: #94a3b8;
}

.product-img {
  width: 56px;
  height: 56px;
  object-fit: contain;
  border-radius: 10px;
  background-color: #f8fafc;
  padding: 4px;
  border: 1px solid #e2e8f0;
}

.category-badge { 
  background-color: #e0e7ff; 
  color: #4338ca; 
  padding: 6px 12px; 
  border-radius: 9999px; 
  font-size: 0.8rem; 
  font-weight: 700; 
  display: inline-block;
}

.price-col {
  font-weight: 800;
  color: #10b981;
  font-size: 1.05rem;
}

.unit-subscript {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}

.stock-badge {
  font-weight: 700;
  color: #334155;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 8px;
}

.action-buttons { 
  display: flex; 
  gap: 8px; 
  align-items: center;
}

.alert-badge {
  padding: 5px 12px;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 700;
  background-color: #f1f5f9;
  color: #64748b;
  display: inline-block;
}

.alert-active {
  background-color: #fee2e2;
  color: #dc2626;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 50px 20px !important;
  color: #94a3b8;
  font-weight: 600;
  font-size: 1.05rem;
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 12px;
  color: #cbd5e1;
}

.pagination-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 28px;
  flex-wrap: wrap;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid #cbd5e1;
  background-color: #ffffff;
  color: #334155;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100dvh;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  background: #ffffff;
  padding: 28px;
  border-radius: 20px;
  width: 100%;
  max-width: 680px;
  max-height: 90dvh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 16px;
}

.modal-header h3 {
  margin: 0;
  color: #1e293b;
  font-weight: 800;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.8rem;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}

.close-btn:hover:not(:disabled) {
  background-color: #f1f5f9;
  color: #ef4444;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 700;
  font-size: 0.9rem;
  color: #475569;
}

.form-group input, 
.form-group textarea,
.form-select {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.95rem;
  outline: none;
  min-height: 44px;
  transition: border-color 0.2s;
  box-sizing: border-box;
  background: #ffffff;
}

.form-group input:focus,
.form-group textarea:focus,
.form-select:focus {
  border-color: #2563eb;
}

/* Variants Configuration Card */
.variants-config-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.variants-config-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 0.9rem;
  color: #334155;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.variant-inputs-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.presets-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.preset-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
}

.preset-pill {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.preset-pill:hover {
  background: #dbeafe;
}

.custom-size-add, .custom-color-add {
  display: flex;
  gap: 10px;
  align-items: center;
}

.custom-size-add input, .custom-color-add input[type="text"] {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.88rem;
}

.color-picker-input {
  width: 44px;
  height: 40px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 2px;
  cursor: pointer;
}

.add-sub-btn {
  padding: 8px 16px;
  background: #0f172a;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
}

.active-tags-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.size-chip {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.color-chip {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.color-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.15);
}

.remove-tag-icon {
  font-size: 0.75rem;
  color: #94a3b8;
  cursor: pointer;
}

.remove-tag-icon:hover {
  color: #ef4444;
}

.image-preview {
  margin-top: 10px;
  text-align: center;
  background: #f8fafc;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.image-preview img {
  max-width: 120px;
  max-height: 120px;
  border-radius: 8px;
  object-fit: contain;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 10px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}

.btn-cancel, .btn-save {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  min-height: 44px;
  font-family: inherit;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f1f5f9;
  color: #475569;
}
.btn-cancel:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-save {
  background: #2563eb;
  color: white;
}
.btn-save:hover:not(:disabled) {
  background: #1d4ed8;
}

@media (max-width: 900px) {
  .table-header {
    flex-direction: column;
    align-items: stretch;
  }
  .filters-wrapper {
    max-width: 100%;
  }
}

@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 14px;
  }
  .modal-content {
    padding: 20px;
  }
}
</style>