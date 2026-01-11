// frontend/src/services/notifications.ts
const BASE_URL = 'http://localhost:3000/api/notifications'

export interface NotificationData {
  _id: string
  userId: string
  type: 'newProduct' | 'discount' | 'expiringSoon' | 'priceAlert'
  title: string
  message: string
  productId?: string
  productData?: {
    name: string
    price: number
    imageUrl?: string
    location?: {
      city?: string
      address?: string
    }
    distance?: number
  }
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export interface NotificationsResponse {
  notifications: NotificationData[]
  unreadCount: number
  total: number
}

export interface NotificationPreferences {
  enabled: boolean
  location?: {
    lat: number
    lng: number
    city?: string
    address?: string
  }
  maxDistance: number // בק"מ
  categories: string[]
  priceRange?: {
    min: number
    max: number
  }
  onNewProducts: boolean
  onDiscounts: boolean
  onExpiringSoon: boolean
}

/**
 * קבלת כל ההתראות של משתמש
 */
export async function fetchNotifications(
  userId: string,
  options?: {
    limit?: number
    skip?: number
    unreadOnly?: boolean
  },
): Promise<NotificationsResponse> {
  const params = new URLSearchParams()
  if (options?.limit) params.append('limit', options.limit.toString())
  if (options?.skip) params.append('skip', options.skip.toString())
  if (options?.unreadOnly) params.append('unreadOnly', 'true')

  const res = await fetch(`${BASE_URL}/${userId}?${params}`)
  if (!res.ok) {
    throw new Error('טעינת ההתראות נכשלה')
  }
  return res.json()
}

/**
 * סימון התראה כנקראה
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${notificationId}/read`, {
    method: 'PUT',
  })
  if (!res.ok) {
    throw new Error('עדכון ההתראה נכשל')
  }
}

/**
 * סימון כל ההתראות כנקראו
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${userId}/read-all`, {
    method: 'PUT',
  })
  if (!res.ok) {
    throw new Error('עדכון ההתראות נכשל')
  }
}

/**
 * מחיקת התראה
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${notificationId}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    throw new Error('מחיקת ההתראה נכשלה')
  }
}

/**
 * מחיקת כל ההתראות
 */
export async function deleteAllNotifications(userId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${userId}/delete-all`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    throw new Error('מחיקת ההתראות נכשלה')
  }
}

/**
 * בדיקת מוצרים קרובים ויצירת התראות
 */
export async function checkNearbyProducts(
  userId: string,
  location: { lat: number; lng: number },
  maxDistance: number = 10000,
  categories: string[] = [],
): Promise<{ success: boolean; foundProducts: number; notificationsCreated: number }> {
  console.log('🔍 checkNearbyProducts called with:', { userId, location, maxDistance, categories })

  const res = await fetch(`${BASE_URL}/check-nearby-products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      location: {
        lat: location.lat,
        lng: location.lng,
      },
      maxDistance,
      categories,
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error('❌ Error from server:', errorText)
    throw new Error('חיפוש מוצרים קרובים נכשל')
  }

  const result = await res.json()
  console.log('✅ Server response:', result)
  return result
}

/**
 * שמירת העדפות התראות ב-Firestore
 */
export async function saveNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences,
): Promise<void> {
  const { doc, setDoc } = await import('firebase/firestore')
  const { db } = await import('./firebase')

  const userRef = doc(db, 'users', userId)
  await setDoc(
    userRef,
    {
      notificationPreferences: preferences,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  )
}

/**
 * טעינת העדפות התראות מ-Firestore
 */
export async function loadNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences | null> {
  const { doc, getDoc } = await import('firebase/firestore')
  const { db } = await import('./firebase')

  const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)

  if (userSnap.exists()) {
    const data = userSnap.data()
    return data.notificationPreferences || null
  }

  return null
}
