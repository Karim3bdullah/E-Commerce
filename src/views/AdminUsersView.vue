<template>
  <AdminLayout>
    <div class="admin-container">
      <div class="header">
        <h1>إدارة المستخدمين</h1>
        <div class="stats">إجمالي المستخدمين: {{ totalUsersCount || usersList.length }}</div>
      </div>

      <div v-if="loading" class="loading-state">
        <i class="fa-solid fa-spinner fa-spin"></i> جاري جلب المستخدمين...
      </div>

      <div v-else class="table-responsive">
        <table class="users-table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>البريد الإلكتروني</th>
              <th>رقم الهاتف</th>
              <th>تاريخ التسجيل</th>
              <th>الصلاحية</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in usersList" :key="user.id" :class="{ 'banned-row': user.status === 'banned' }">
              <td>
                <div class="user-info">
                  <div class="avatar">{{ user.firstName?.charAt(0) || 'U' }}</div>
                  <span>{{ user.name }}</span>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td dir="ltr">{{ user.phone || 'غير مسجل' }}</td>
              <td>{{ formatDate(user.createdAt) }}</td>
              
              <!-- الصلاحية (آدمن ولا عميل) -->
              <td>
                <span :class="['role-badge', user.role === 'admin' ? 'admin' : 'customer']">
                  {{ user.role === 'admin' ? 'مدير' : 'عميل' }}
                </span>
              </td>

              <!-- حالة الحساب (نشط ولا محظور) -->
              <td>
                <span :class="['status-badge', user.status === 'banned' ? 'banned' : 'active']">
                  {{ user.status === 'banned' ? 'محظور' : 'نشط' }}
                </span>
              </td>

              <!-- أزرار التحكم -->
              <td class="actions">
                <!-- زرار تغيير الصلاحية (مبيظهرش لو هو نفس الآدمن اللي فاتح عشان ميشيلش نفسه) -->
                <button 
                  v-if="user.id !== auth.currentUser?.uid"
                  @click="toggleRole(user)" 
                  class="action-btn toggle-role"
                  :title="user.role === 'admin' ? 'تحويل لعميل' : 'ترقية لمدير'"
                >
                  <i :class="user.role === 'admin' ? 'fa-solid fa-user-minus' : 'fa-solid fa-user-shield'"></i>
                </button>

                <!-- زرار الحظر -->
                <button 
                  v-if="user.id !== auth.currentUser?.uid"
                  @click="toggleBan(user)" 
                  :class="['action-btn', user.status === 'banned' ? 'unban' : 'ban']"
                  :title="user.status === 'banned' ? 'فك الحظر' : 'حظر الحساب'"
                >
                  <i :class="user.status === 'banned' ? 'fa-solid fa-unlock' : 'fa-solid fa-ban'"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- أزرار التنقل بين الصفحات السيرفرية -->
      <div class="pagination-controls" v-if="totalPages > 1 || hasMore || currentPage > 1">
        <button 
          class="pagination-btn" 
          :disabled="currentPage === 1 || loading" 
          @click="prevPage"
        >
          <i class="fa-solid fa-chevron-right"></i> السابق
        </button>

        <span class="pagination-info">
          الصفحة {{ currentPage }} من {{ totalPages }}
          <span class="total-users-badge" v-if="totalUsersCount">({{ totalUsersCount }} مستخدم إجمالاً)</span>
        </span>

        <button 
          class="pagination-btn" 
          :disabled="!hasMore || loading" 
          @click="nextPage"
        >
          التالي <i class="fa-solid fa-chevron-left"></i>
        </button>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { db, auth } from '../firebase/config'
import { collection, getDocs, doc, updateDoc, orderBy, query, limit, startAfter, getCountFromServer } from 'firebase/firestore'
import AdminLayout from '../components/AdminLayout.vue'
import Swal from 'sweetalert2'

const usersList = ref([])
const loading = ref(true)

const pageSize = 10
const currentPage = ref(1)
const totalUsersCount = ref(0)
const pageCursors = ref([])
const hasMore = ref(false)

const totalPages = computed(() => {
  return Math.ceil(totalUsersCount.value / pageSize) || 1
})

const fetchTotalCount = async () => {
  try {
    const countSnap = await getCountFromServer(collection(db, 'users'))
    totalUsersCount.value = countSnap.data().count
  } catch (e) {
    console.warn("Could not fetch total users count:", e)
  }
}

// جلب المستخدمين بـ Cursor Pagination
const fetchUsers = async (targetPage = 1) => {
  loading.value = true
  try {
    if (totalUsersCount.value === 0) {
      await fetchTotalCount()
    }

    let q
    const cursor = pageCursors.value[targetPage - 1]
    if (targetPage > 1 && cursor) {
      q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        startAfter(cursor),
        limit(pageSize)
      )
    } else {
      q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      )
    }

    const querySnapshot = await getDocs(q)
    usersList.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    if (querySnapshot.docs.length > 0) {
      pageCursors.value[targetPage] = querySnapshot.docs[querySnapshot.docs.length - 1]
    }

    hasMore.value = querySnapshot.docs.length === pageSize
    currentPage.value = targetPage
  } catch (error) {
    console.error("خطأ في جلب المستخدمين:", error)
  } finally {
    loading.value = false
  }
}

const nextPage = () => {
  if (hasMore.value && !loading.value) {
    fetchUsers(currentPage.value + 1)
  }
}

const prevPage = () => {
  if (currentPage.value > 1 && !loading.value) {
    fetchUsers(currentPage.value - 1)
  }
}

onMounted(() => {
  fetchUsers()
})

// تنسيق التاريخ
const formatDate = (val) => {
  if (!val) return 'غير متوفر'
  // التعامل مع كائنات Timestamp الخاصة بـ Firebase
  const date = val.toDate ? val.toDate() : new Date(val)
  return date.toLocaleDateString('ar-EG')
}

// دالة الحظر / فك الحظر
const toggleBan = async (user) => {
  const isBanned = user.status === 'banned'
  const actionText = isBanned ? 'فك الحظر عن' : 'حظر'
  
  const result = await Swal.fire({
    title: `هل أنت متأكد؟`,
    text: `هل تريد حقاً ${actionText} المستخدم ${user.name}؟`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: isBanned ? '#10b981' : '#ef4444',
    cancelButtonColor: '#94a3b8',
    confirmButtonText: `نعم، ${actionText}`,
    cancelButtonText: 'إلغاء'
  })

  if (result.isConfirmed) {
    try {
      const userRef = doc(db, 'users', user.id)
      const newStatus = isBanned ? 'active' : 'banned'
      
      await updateDoc(userRef, { status: newStatus })
      user.status = newStatus // تحديث الواجهة فوراً

      Swal.fire({
        icon: 'success',
        title: 'تم التحديث',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
      })
    } catch (error) {
      console.error(error)
      Swal.fire('خطأ!', 'لم يتم تحديث الحالة.', 'error')
    }
  }
}

// دالة تغيير الصلاحية
const toggleRole = async (user) => {
  const isAdmin = user.role === 'admin'
  const newRole = isAdmin ? 'customer' : 'admin'
  const roleText = isAdmin ? 'عميل عادي' : 'مدير'

  const result = await Swal.fire({
    title: 'تغيير الصلاحية',
    text: `تحويل ${user.name} إلى ${roleText}؟`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#94a3b8',
    confirmButtonText: 'نعم، تغيير',
    cancelButtonText: 'إلغاء'
  })

  if (result.isConfirmed) {
    try {
      const userRef = doc(db, 'users', user.id)
      await updateDoc(userRef, { role: newRole })
      user.role = newRole 

      Swal.fire({
        icon: 'success',
        title: 'تم تغيير الصلاحية',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
      })
    } catch (error) {
      console.error(error)
    }
  }
}
</script>

<style scoped>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
  direction: rtl;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h1 {
  color: #1e293b;
  margin: 0;
  font-size: 1.8rem;
  font-weight: 800;
}

.stats {
  background: #2563eb;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.95rem;
}

.loading-state {
  text-align: center;
  padding: 60px;
  font-size: 1.2rem;
  color: #64748b;
}

.table-responsive {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.04);
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
}

.users-table th, .users-table td {
  padding: 18px 20px;
  text-align: right;
  border-bottom: 1px solid #f1f5f9;
}

.users-table th {
  background-color: #f8fafc;
  color: #64748b;
  font-weight: 700;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
  color: #1e293b;
}

.avatar {
  width: 35px;
  height: 35px;
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.role-badge, .status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
}

.role-badge.admin { background: #fef3c7; color: #d97706; }
.role-badge.customer { background: #f1f5f9; color: #64748b; }

.status-badge.active { background: #dcfce7; color: #16a34a; }
.status-badge.banned { background: #fee2e2; color: #ef4444; }

.banned-row td {
  opacity: 0.7;
  background-color: #fffafb;
}

.actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  width: 35px;
  height: 35px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.2s;
}

.toggle-role { background: #f1f5f9; color: #3b82f6; }
.toggle-role:hover { background: #e0e7ff; }

.ban { background: #fee2e2; color: #ef4444; }
.ban:hover { background: #fecaca; }

.unban { background: #dcfce7; color: #10b981; }
.unban:hover { background: #bbf7d0; }

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 25px;
  padding: 10px 0;
}

.pagination-btn {
  padding: 8px 18px;
  background-color: white;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  color: #334155;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #2563eb;
  color: white;
  border-color: #2563eb;
}

.pagination-btn:disabled {
  opacity: 0.4;
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

.total-users-badge {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}
</style>