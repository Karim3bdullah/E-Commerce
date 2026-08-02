<template>
  <AdminLayout>
    <div class="admin-container">
      <div class="table-header">
          <h2>إدارة المنتجات</h2>
          
          <div class="filters-wrapper">
              <SharedFilter :categories="translatedCategories" @filter="handleCategoryFilter" />
          </div>

          <button class="btn btn-add" @click="openAddProductModal" :disabled="isSubmitting">إضافة منتج جديد <i class="fa-solid fa-plus"></i></button>
      </div>

      <div class="table-responsive">
          <table class="product-table">
              <thead>
                  <tr>
                      <th>رقم</th>
                      <th>الصورة</th>
                      <th>اسم المنتج</th>
                      <th>القسم</th>
                      <th>السعر</th>
                      <th>المخزون</th> 
                      <th>تنبيه النفاذ</th>
                      <th>الإجراءات</th>
                  </tr>
              </thead>
              <tbody>
                  <tr v-if="productStore.isloading">
                      <td colspan="8" class="loading-state">
                          <i class="fa-solid fa-spinner fa-spin"></i> جاري جلب المنتجات...
                      </td>
                  </tr>

                  <template v-else>
                      <tr v-for="(product, index) in paginatedProducts" :key="product.id">
                          <td class="index-col">{{ ((productStore.currentPage - 1) * productStore.itemsPerPage) + index + 1 }}</td>
                          
                          <td>
                              <img :src="product.image" :alt="product.title" class="product-img" @error="handleImageError">
                          </td>
                          
                          <td class="title-col">{{ product.title }}</td>
                          <td><span class="category-badge">{{ t(`categories.${product.category}`) }}</span></td>
                          <td class="price-col">${{ product.price }}</td>
                          
                          <td>
                              <span class="badge">
                                  {{ product.stock }}
                              </span>
                          </td>

                          <td>
                              <span :class="['alert-badge', product.stock <= (product.lowStockThreshold || 5) ? 'alert-active' : '']">
                                  {{ product.stock <= (product.lowStockThreshold || 5) ? 'منخفض (' + (product.lowStockThreshold || 5) + ')' : 'آمن' }}
                              </span>
                          </td>
                          
                          <td class="action-buttons">
                              <button type="button" class="btn btn-edit" @click="openEditProductModal(product)" :disabled="isSubmitting">
                                    <i class="fa-solid fa-pen"></i> تعديل
                              </button>
                              <button type="button" class="btn btn-delete" @click="confirmProductDeletion(product.id)" :disabled="isSubmitting">
                                  <i class="fa-solid fa-trash"></i> حذف
                              </button>
                          </td>
                      </tr>
                      
                      <tr v-if="paginatedProducts.length === 0">
                          <td colspan="8" class="empty-state">
                              <i class="fa-solid fa-box-open empty-icon"></i>
                              <p>لا توجد منتجات مطابقة للبحث أو مضافة حتى الآن.</p>
                          </td>
                      </tr>
                  </template>
              </tbody>
          </table>
      </div>

    
      <div class="pagination-nav" v-if="totalPages > 1">
          <button 
              type="button"
              class="page-btn" 
              :disabled="productStore.currentPage === 1 || productStore.isloading"
              @click.prevent="changePage(productStore.currentPage - 1)"
          >
              السابق
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
              التالي
          </button>
      </div>
      
      
      <div v-if="isModalVisible" class="modal-overlay" @click.self="closeProductModal">
          <div class="modal-content">
              <div class="modal-header">
                  <h3>{{ isEditModeActive ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد' }}</h3>
                  <button type="button" class="close-btn" @click="closeProductModal" :disabled="isSubmitting">&times;</button>
              </div>
              
              <form @submit.prevent="handleFormSubmission" class="modal-form">
                  <div class="form-row">
                      <div class="form-group">
                          <label>اسم المنتج</label>
                          <input type="text" v-model="productFormState.title" required>
                      </div>
                      <div class="form-group">
                          <label>القسم</label>
                          <input type="text" v-model="productFormState.category" required>
                      </div>
                  </div>
                  
                  <div class="form-row">
                      <div class="form-group">
                          <label>السعر ($)</label>
                          <input type="number" step="0.01" v-model="productFormState.price" required>
                      </div>
                      <div class="form-group">
                          <label>الكمية (المخزون)</label>
                          <input type="number" v-model="productFormState.stock" required>
                      </div>
                  </div>

                  <div class="form-row">
                      <div class="form-group">
                          <label>حد تنبيه نفاذ الكمية</label>
                          <input type="number" v-model="productFormState.lowStockThreshold" required>
                      </div>
                  </div>

                  <div class="form-group">
                      <label>الوصف</label>
                      <textarea v-model="productFormState.description" rows="3" required></textarea>
                  </div>

                  <div class="form-group">
                      <label>رابط الصورة</label>
                      <input type="url" v-model="productFormState.image" required>
                      <div v-if="productFormState.image" class="image-preview">
                          <img :src="productFormState.image" alt="معاينة الصورة" @error="handleImageError">
                      </div>
                  </div>

                  <div class="modal-actions">
                      <button type="button" class="btn-cancel" @click="closeProductModal" :disabled="isSubmitting">إلغاء</button>
                      <button type="submit" class="btn-save" :disabled="isSubmitting">
                          {{ isSubmitting ? 'جاري المعالجة...' : (isEditModeActive ? 'حفظ التعديلات' : 'إضافة المنتج') }}
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
import { onMounted, ref, computed } from 'vue'
import Swal from 'sweetalert2'
import SharedFilter from '../components/SharedFilter.vue'
import AdminLayout from '../components/AdminLayout.vue' 
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const productStore = useProductStore()

const isModalVisible = ref(false)
const isEditModeActive = ref(false)
const isSubmitting = ref(false)
const selectedCategoryFilter = ref('')

const productFormState = ref({
    id: '',
    title: '',
    category: '',
    price: 0,
    stock: 0,
    lowStockThreshold: 5,
    image: '',
    description: '' 
})




const translateCategory = (categoryName) => {
    if (!categoryName) return ''
    const lowerName = categoryName.trim().toLowerCase()
    return categoryTranslations[lowerName] || categoryName
}

onMounted(() => {
    productStore.fetchdata()
})

const uniqueCategories = computed(() => {
    const categoriesList = productStore.products.map(item => item.category)
    return [...new Set(categoriesList)]
})

const translatedCategories = computed(() => {
    return uniqueCategories.value.map(cat => ({
        original: cat,
        translated: t(`categories.${cat}`) === `categories.${cat}` ? cat : t(`categories.${cat}`)
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

// حساب عدد الصفحات بعد الفلترة
const totalPages = computed(() => {
    return Math.ceil(filteredProductsList.value.length / productStore.itemsPerPage) || 1
})

// اقتطاع المنتجات الخاصة بالصفحة الحالية فقط
const paginatedProducts = computed(() => {
    const start = (productStore.currentPage - 1) * productStore.itemsPerPage
    const end = start + productStore.itemsPerPage
    return filteredProductsList.value.slice(start, end)
})

const changePage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages.value) {
        productStore.currentPage = pageNumber
        
        // إصلاح نطة الباجنيشن: سكرول ناعم لأعلى الصفحة عند التبديل
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
    productFormState.value = { id: '', title: '', category: '', price: 0, stock: 0, lowStockThreshold: 5, image: '', description: '' }
    isModalVisible.value = true
}

const openEditProductModal = (productData) => {
    isEditModeActive.value = true
    productFormState.value = { ...productData, lowStockThreshold: productData.lowStockThreshold || 5 }
    isModalVisible.value = true
}

const closeProductModal = () => {
    if (isSubmitting.value) return
    isModalVisible.value = false
}

const confirmProductDeletion = async (productId) => {
    const confirmationResult = await Swal.fire({
        title: 'هل أنت متأكد؟',
        text: "لن تتمكن من التراجع عن هذا!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'نعم، احذف',
        cancelButtonText: 'إلغاء'
    })

    if (confirmationResult.isConfirmed) {
        isSubmitting.value = true
        try {
            await productStore.deleteProduct(productId)
            
            // التحقق إذا كانت الصفحة الحالية أصبحت فارغة بعد الحذف، نرجع للصفحة السابقة
            if (paginatedProducts.value.length === 0 && productStore.currentPage > 1) {
                productStore.currentPage -= 1
            }

            Swal.fire({
                icon: 'success',
                title: 'تم الحذف',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000
            })
        } catch (error) {
            console.error("تفاصيل خطأ الحذف:", error)
            Swal.fire({
                icon: 'error',
                title: 'خطأ!',
                text: 'حدث خطأ أثناء الحذف.'
            })
        } finally {
            isSubmitting.value = false
        }
    }
}

const validateProductForm = (form) => {
    if (!form.title || form.title.trim().length < 2 || form.title.length > 100) {
        throw new Error('اسم المنتج يجب أن يكون بين 2 و 100 حرف.')
    }
    if (!form.category || form.category.trim().length === 0) {
        throw new Error('قسم المنتج مطلوب.')
    }
    const numericPrice = Number(form.price)
    if (isNaN(numericPrice) || numericPrice <= 0) {
        throw new Error('السعر يجب أن يكون رقماً موجباً أكبر من الصفر.')
    }
    const numericStock = Number(form.stock)
    if (isNaN(numericStock) || numericStock < 0) {
        throw new Error('المخزون يجب ألا يكون سالباً.')
    }
    const numericThreshold = Number(form.lowStockThreshold)
    if (isNaN(numericThreshold) || numericThreshold < 0) {
        throw new Error('حد التنبيه يجب ألا يكون سالباً.')
    }
    if (!form.description || form.description.trim().length < 5) {
        throw new Error('الوصف يجب ألا يقل عن 5 أحرف.')
    }
    if (!form.image || !form.image.startsWith('http')) {
        throw new Error('رابط الصورة غير صالح.')
    }
    return true
}

const handleFormSubmission = async () => {
    if (isSubmitting.value) return
    
    try {
        validateProductForm(productFormState.value)

        isSubmitting.value = true

        const standardizedPayload = {
            ...productFormState.value,
            title: productFormState.value.title.trim(),
            category: productFormState.value.category.trim(),
            description: productFormState.value.description.trim(),
            image: productFormState.value.image.trim(),
            price: Number(productFormState.value.price),
            stock: Number(productFormState.value.stock),
            lowStockThreshold: Number(productFormState.value.lowStockThreshold)
        }

        if (isEditModeActive.value) {
            await productStore.updateProduct(standardizedPayload.id, standardizedPayload)
        } else {
            const { id: _, ...dataPayloadWithoutId } = standardizedPayload
            await productStore.addProduct(dataPayloadWithoutId)
        }

        closeProductModal()

        Swal.fire({
            icon: 'success',
            title: 'تم',
            text: isEditModeActive.value ? 'تم التعديل بنجاح' : 'تمت الإضافة بنجاح',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
        })

    } catch (error) {
        console.error(error)
        Swal.fire({
            icon: 'error',
            title: 'خطأ في التحقق أو التنفيذ!',
            text: error.message || 'فشلت العملية، جرب مرة أخرى.'
        })
    } finally {
        isSubmitting.value = false
    }
}
</script>

<style scoped>
* {
    box-sizing: border-box;
}

.admin-container {
    width: 100%;
    max-width: 1200px;
    margin: 40px auto;
    padding: 0 20px;
    direction: rtl;
    font-family: 'Cairo', sans-serif;
    overflow-x: hidden;
}

.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    background: #ffffff;
    padding: 20px 25px;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
    gap: 15px;
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
    gap: 15px;
    flex: 1;
    max-width: 300px;
    justify-content: center;
}

.btn {
    padding: 10px 18px;
    border: none;
    border-radius: 8px;
    font-family: inherit;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-add {
    background-color: #2563eb;
    color: #ffffff;
    font-size: 1rem;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.btn-add:hover:not(:disabled) { background-color: #1d4ed8; }

.btn-edit { background-color: #f59e0b; color: white; font-size: 0.85rem; }
.btn-edit:hover:not(:disabled) { background-color: #d97706; }

.btn-delete { background-color: #ef4444; color: white; font-size: 0.85rem; }
.btn-delete:hover:not(:disabled) { background-color: #dc2626; }

.table-responsive {
    width: 100%;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    min-height: 650px; /* التعديل هنا: يمنع الجدول من الانكماش فجأة عند نهاية الباجنيشن */
}

.product-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 900px;
}

/* تحسين شكل الأعمدة لمنع تداخل النصوص */
.product-table th, .product-table td {
    padding: 16px 15px;
    text-align: right;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
    white-space: nowrap; 
}

/* السماح لاسم المنتج بالالتفاف إذا كان طويلاً */
.product-table td.title-col {
    white-space: normal;
    min-width: 200px;
    max-width: 250px;
    font-weight: 700; 
    color: #1e293b;
}

.product-table th {
    background-color: #f8fafc;
    color: #64748b;
    font-weight: 700;
}

.product-table tbody tr:hover { background-color: #f8fafc; }

.index-col { font-weight: 800; color: #94a3b8; }

.product-img {
    width: 60px;
    height: 60px;
    object-fit: contain;
    border-radius: 10px;
    background-color: #f1f5f9;
    padding: 5px;
    border: 1px solid #e2e8f0;
}

.category-badge { 
    background-color: #e0e7ff; 
    color: #4338ca; 
    padding: 6px 12px; 
    border-radius: 20px; 
    font-size: 0.85rem; 
    font-weight: 700; 
    display: inline-block;
    text-align: center;
}

.price-col { font-weight: 800; color: #10b981; font-size: 1.1rem; }

.action-buttons { 
    display: flex; 
    gap: 8px; 
    align-items: center;
}

.action-buttons .btn {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.8rem;
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

.alert-badge {
    padding: 4px 10px;
    border-radius: 6px;
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
    padding: 40px !important;
    color: #94a3b8;
    font-weight: 600;
    font-size: 1.1rem;
}

/* ترقيم الصفحات */
.pagination-nav {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 25px;
}

.page-btn {
    padding: 8px 14px;
    border: 1px solid #cbd5e1;
    background-color: #ffffff;
    color: #334155;
    font-weight: 700;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
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
    width: 100%;
    height: 100%;
    background: rgba(15, 23, 42, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: #ffffff;
    padding: 30px;
    border-radius: 16px;
    width: 90%;
    max-width: 650px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.modal-content::-webkit-scrollbar { width: 8px; }
.modal-content::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 4px; }

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 15px;
}

.modal-header h3 { margin: 0; color: #1e293b; font-weight: 800; }

.close-btn {
    background: none;
    border: none;
    font-size: 1.8rem;
    color: #94a3b8;
    cursor: pointer;
    line-height: 1;
}
.close-btn:hover:not(:disabled) { color: #ef4444; }

.modal-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-group label {
    font-weight: 600;
    font-size: 0.9rem;
    color: #475569;
}

.form-group input, 
.form-group textarea {
    width: 100%;
    padding: 12px 15px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
    border-color: #2563eb;
}

.image-preview {
    margin-top: 15px;
    text-align: center;
    background: #f8fafc;
    padding: 10px;
    border-radius: 8px;
}

.image-preview img {
    max-width: 120px;
    max-height: 120px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
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
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
}

.btn-cancel { background: #f1f5f9; color: #475569; }
.btn-cancel:hover:not(:disabled) { background: #e2e8f0; }
.btn-save { background: #2563eb; color: white; }
.btn-save:hover:not(:disabled) { background: #1d4ed8; }

@media (max-width: 900px) {
    .table-header {
        flex-direction: column;
        align-items: stretch;
    }
    .filters-wrapper {
        max-width: 100%;
        flex-direction: column;
    }
}

@media (max-width: 600px) {
    .form-row {
        grid-template-columns: 1fr;
        gap: 15px;
    }
    .modal-content {
        padding: 20px;
    }
}
</style>