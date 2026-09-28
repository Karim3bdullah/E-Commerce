<template>
  <AdminLayout>
    <div class="admin-container">
      <div class="header">
        <h1>{{ t('admin.usersManage') }}</h1>
        <div class="stats">
          {{ t('admin.totalUsers') }}: {{ totalUsersCount || usersList.length }}
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <i class="fa-solid fa-spinner fa-spin"></i> {{ t('admin.loadingData') }}
      </div>

      <div v-else class="table-responsive">
        <table class="users-table">
          <thead>
            <tr>
              <th>{{ t('admin.customerName') }}</th>
              <th>{{ t('auth.email') }}</th>
              <th>{{ t('admin.customerPhone') }}</th>
              <th>{{ t('admin.date') }}</th>
              <th>{{ t('admin.role') }}</th>
              <th>{{ t('admin.status') }}</th>
              <th>{{ t('admin.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in usersList" :key="user.id" :class="{ 'banned-row': user.status === 'banned' }">
              <td>
                <div class="user-info">
                  <div class="avatar">{{ user.firstName?.charAt(0) || user.name?.charAt(0) || 'U' }}</div>
                  <span class="user-name">{{ user.name || (user.firstName + ' ' + (user.lastName || '')) }}</span>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td dir="ltr" class="phone-cell">{{ user.phone || t('admin.unregisteredPhone') }}</td>
              <td>{{ formatDate(user.createdAt) }}</td>
              
              <!-- Role Badge -->
              <td>
                <span :class="['role-badge', user.role === 'admin' ? 'admin' : 'customer']">
                  {{ user.role === 'admin' ? t('admin.adminRole') : t('admin.userRole') }}
                </span>
              </td>

              <!-- Status Badge -->
              <td>
                <span :class="['status-badge', user.status === 'banned' ? 'banned' : 'active']">
                  {{ user.status === 'banned' ? t('admin.banned') : t('admin.active') }}
                </span>
              </td>

              <!-- Control Actions -->
              <td class="actions">
                <button 
                  v-if="user.id !== auth.currentUser?.uid"
                  @click="toggleRole(user)" 
                  class="action-btn toggle-role"
                  :title="user.role === 'admin' ? t('admin.convertToCustomer') : t('admin.promoteToAdmin')"
                  :aria-label="user.role === 'admin' ? t('admin.convertToCustomer') : t('admin.promoteToAdmin')"
                >
                  <i :class="user.role === 'admin' ? 'fa-solid fa-user-minus' : 'fa-solid fa-user-shield'"></i>
                </button>

                <button 
                  v-if="user.id !== auth.currentUser?.uid"
                  @click="toggleBan(user)" 
                  :class="['action-btn', user.status === 'banned' ? 'unban' : 'ban']"
                  :title="user.status === 'banned' ? t('admin.unbanAccount') : t('admin.banAccount')"
                  :aria-label="user.status === 'banned' ? t('admin.unbanAccount') : t('admin.banAccount')"
                >
                  <i :class="user.status === 'banned' ? 'fa-solid fa-unlock' : 'fa-solid fa-ban'"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      <div class="pagination-controls" v-if="totalPages > 1 || hasMore || currentPage > 1">
        <button 
          class="pagination-btn" 
          :disabled="currentPage === 1 || loading" 
          @click="prevPage"
        >
          <i :class="isRtl ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left'"></i>
          {{ t('pagination.prev') }}
        </button>

        <span class="pagination-info">
          {{ t('pagination.pageOf', { current: currentPage, total: totalPages }) }}
          <span class="total-users-badge" v-if="totalUsersCount">({{ totalUsersCount }} {{ t('admin.usersCountSuffix') }})</span>
        </span>

        <button 
          class="pagination-btn" 
          :disabled="!hasMore || loading" 
          @click="nextPage"
        >
          {{ t('pagination.next') }}
          <i :class="isRtl ? 'fa-solid fa-chevron-left' : 'fa-solid fa-chevron-right'"></i>
        </button>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { db, auth } from '../firebase/config'
import { collection, getDocs, doc, updateDoc, orderBy, query, limit, startAfter, getCountFromServer } from 'firebase/firestore'
import AdminLayout from '../components/AdminLayout.vue'
import Swal from 'sweetalert2'

const { t, locale } = useI18n()
const isRtl = computed(() => locale.value === 'ar')

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
    console.error("Error fetching users:", error)
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

const formatDate = (val) => {
  if (!val) return '...'
  const date = val.toDate ? val.toDate() : new Date(val)
  return date.toLocaleDateString(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const toggleBan = async (user) => {
  const isBanned = user.status === 'banned'
  const actionText = isBanned ? t('admin.unbanAccount') : t('admin.banAccount')
  
  const result = await Swal.fire({
    title: t('common.confirm'),
    text: isBanned 
      ? (isRtl.value ? `هل تريد حقاً فك الحظر عن ${user.name || 'المستخدم'}؟` : `Do you really want to unban ${user.name || 'this user'}?`)
      : (isRtl.value ? `هل تريد حقاً حظر حساب ${user.name || 'المستخدم'}؟` : `Do you really want to ban ${user.name || 'this user'}?`),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: isBanned ? '#10b981' : '#ef4444',
    cancelButtonColor: '#94a3b8',
    confirmButtonText: actionText,
    cancelButtonText: t('common.cancel')
  })

  if (result.isConfirmed) {
    try {
      const userRef = doc(db, 'users', user.id)
      const newStatus = isBanned ? 'active' : 'banned'
      
      await updateDoc(userRef, { status: newStatus })
      user.status = newStatus

      Swal.fire({
        icon: 'success',
        title: t('common.success'),
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
      })
    } catch (error) {
      console.error(error)
      Swal.fire(t('common.error'), error.message || 'Failed to update user status.', 'error')
    }
  }
}

const toggleRole = async (user) => {
  const isAdmin = user.role === 'admin'
  const newRole = isAdmin ? 'customer' : 'admin'
  const roleText = isAdmin ? t('admin.userRole') : t('admin.adminRole')

  const result = await Swal.fire({
    title: t('admin.role'),
    text: isAdmin
      ? (isRtl.value ? `تحويل ${user.name || 'المستخدم'} إلى ${roleText}؟` : `Demote ${user.name || 'this user'} to ${roleText}?`)
      : (isRtl.value ? `ترقية ${user.name || 'المستخدم'} إلى ${roleText}؟` : `Promote ${user.name || 'this user'} to ${roleText}?`),
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#94a3b8',
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel')
  })

  if (result.isConfirmed) {
    try {
      const userRef = doc(db, 'users', user.id)
      await updateDoc(userRef, { role: newRole })
      user.role = newRole 

      Swal.fire({
        icon: 'success',
        title: t('common.success'),
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
      })
    } catch (error) {
      console.error(error)
      Swal.fire(t('common.error'), error.message || 'Failed to update role.', 'error')
    }
  }
}
</script>

<style scoped>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 16px;
}

.header h1 {
  color: #1e293b;
  margin: 0;
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.stats {
  background: var(--primary-color, #2563eb);
  color: white;
  padding: 8px 18px;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.9rem;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
  font-size: 1.15rem;
  color: #64748b;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
}

.table-responsive {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.04);
  border: 1px solid rgba(0,0,0,0.05);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
  min-width: 750px;
}

.users-table th, .users-table td {
  padding: 16px 20px;
  text-align: start;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.users-table th {
  background-color: #f8fafc;
  color: #64748b;
  font-weight: 700;
  font-size: 0.875rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
  color: #1e293b;
}

.user-name {
  font-weight: 600;
  color: #1e293b;
}

.avatar {
  width: 38px;
  height: 38px;
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  flex-shrink: 0;
}

.role-badge, .status-badge {
  padding: 5px 12px;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 700;
  display: inline-block;
}

.role-badge.admin { background: #fef3c7; color: #d97706; }
.role-badge.customer { background: #f1f5f9; color: #64748b; }

.status-badge.active { background: #dcfce7; color: #16a34a; }
.status-badge.banned { background: #fee2e2; color: #dc2626; }

.banned-row td {
  opacity: 0.75;
  background-color: #fffafb;
}

.phone-cell {
  color: #475569;
}

.actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.action-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05rem;
  transition: all 0.2s;
  min-height: 44px;
  min-width: 44px;
}

.toggle-role { background: #f1f5f9; color: #3b82f6; }
.toggle-role:hover { background: #dbeafe; }

.ban { background: #fee2e2; color: #ef4444; }
.ban:hover { background: #fecaca; }

.unban { background: #dcfce7; color: #10b981; }
.unban:hover { background: #bbf7d0; }

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 28px;
  padding: 10px 0;
  flex-wrap: wrap;
}

.pagination-btn {
  padding: 8px 20px;
  background-color: white;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  color: #334155;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
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