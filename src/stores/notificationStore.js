import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '../firebase/config'
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  writeBatch,
  setDoc,
  serverTimestamp,
  getDocs
} from 'firebase/firestore'

export const useNotificationStore = defineStore('notificationStore', () => {
  const notifications = ref([])
  const isListening = ref(false)
  let unsubscribeSnapshot = null

  const defaultNotifications = [
    {
      id: 'noti-welcome',
      title: 'مرحباً بك في متجرنا! 🎉',
      message: 'استمتع بتجربة تسوق فريدة وشحن مجاني للطلبات فوق $150.',
      type: 'promo',
      targetRoute: '/',
      read: false,
      createdAt: new Date()
    },
    {
      id: 'noti-order-status',
      title: 'تحديث حالة طلبك الأخير 📦',
      message: 'طلبك قيد التجهيز وسيتم تسليمه لشركة الشحن قريباً.',
      type: 'order',
      targetRoute: '/my-orders',
      read: false,
      createdAt: new Date(Date.now() - 3600000 * 2)
    },
    {
      id: 'noti-flash-sale',
      title: 'عروض حصرية لفترة محدودة ⚡',
      message: 'تخفيضات تصل إلى 30% على الأجهزة والملابس المختارة.',
      type: 'promo',
      targetRoute: '/',
      read: true,
      createdAt: new Date(Date.now() - 3600000 * 24)
    }
  ]

  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.read).length
  })

  const initUserNotifications = async (userId) => {
    if (!userId) {
      notifications.value = defaultNotifications
      return
    }

    if (unsubscribeSnapshot) {
      unsubscribeSnapshot()
    }

    try {
      const notiCol = collection(db, 'users', userId, 'notifications')
      const q = query(notiCol, orderBy('createdAt', 'desc'))

      unsubscribeSnapshot = onSnapshot(q, async (snapshot) => {
        if (snapshot.empty) {
          notifications.value = defaultNotifications
          try {
            for (const item of defaultNotifications) {
              const notiDocRef = doc(db, 'users', userId, 'notifications', item.id)
              await setDoc(notiDocRef, {
                title: item.title,
                message: item.message,
                type: item.type,
                targetRoute: item.targetRoute,
                read: item.read,
                createdAt: serverTimestamp()
              }, { merge: true })
            }
          } catch (seedErr) {
            // Seed failed due to permissions or offline, keep in-memory defaults
          }
        } else {
          notifications.value = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          }))
        }
      }, (err) => {
        notifications.value = defaultNotifications
      })

      isListening.value = true
    } catch (e) {
      notifications.value = defaultNotifications
    }
  }

  const stopListening = () => {
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot()
      unsubscribeSnapshot = null
    }
    isListening.value = false
    notifications.value = defaultNotifications
  }

  const markAsRead = async (id, userId) => {
    const item = notifications.value.find(n => n.id === id)
    if (item) {
      item.read = true
    }

    if (userId) {
      try {
        const notiRef = doc(db, 'users', userId, 'notifications', id)
        await updateDoc(notiRef, { read: true })
      } catch (err) {
        console.warn("Error marking notification read in Firestore:", err)
      }
    }
  }

  const markAllAsRead = async (userId) => {
    notifications.value.forEach(n => { n.read = true })

    if (userId) {
      try {
        const notiCol = collection(db, 'users', userId, 'notifications')
        const snap = await getDocs(notiCol)
        const batch = writeBatch(db)
        snap.forEach(docSnap => {
          if (!docSnap.data().read) {
            batch.update(docSnap.ref, { read: true })
          }
        })
        await batch.commit()
      } catch (err) {
        console.warn("Error marking all read:", err)
      }
    }
  }

  return {
    notifications,
    unreadCount,
    initUserNotifications,
    stopListening,
    markAsRead,
    markAllAsRead
  }
})
