const BASE_URL = 'http://localhost:3000/api/users'

export type UserRole = 'admin' | 'user' | 'storeManager'
export interface ManagedUser {
  uid: string
  email: string
  name?: string
  role: UserRole
  courierOptIn?: boolean
  storeId?: string
  shopName?: string
  shopAddress?: string
  shopCity?: string
  createdAt?: string
}

/**
 * קבלת כל המשתמשים מהשרת (ללא סיסמאות)
 */
export async function fetchUsers(): Promise<ManagedUser[]> {
  const res = await fetch(BASE_URL)
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.message || 'טעינת המשתמשים נכשלה')
  }
  const data = await res.json()
  const users = (data.users || []) as ManagedUser[]

  // טען פרטי חנויות למשתמשים עם storeId
  const { doc, getDoc } = await import('firebase/firestore')
  const { db } = await import('./firebase')

  for (const user of users) {
    if (user.storeId && user.role === 'storeManager') {
      try {
        const storeRef = doc(db, 'stores', user.storeId)
        const storeSnap = await getDoc(storeRef)
        if (storeSnap.exists()) {
          const storeData = storeSnap.data()
          user.shopName = storeData.name || storeData.shopName
          user.shopAddress = storeData.address || storeData.shopAddress
          user.shopCity = storeData.city || storeData.shopCity
        }
      } catch (error) {
        console.error(`Error loading store ${user.storeId}:`, error)
      }
    }
  }

  return users
}

/**
 * יצירת משתמש חדש ע"י אדמין
 */
export async function createUser(user: {
  email: string
  password: string
  name?: string
  role?: UserRole
  courierOptIn?: boolean
  storeId?: string
}): Promise<ManagedUser> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.message || 'יצירת המשתמש נכשלה')
  }

  const data = await res.json()
  return data.user as ManagedUser
}

/**
 * מחיקת משתמש מהשרת – גם מ־Firestore וגם מ־Authentication
 */
export async function deleteUserByUid(uid: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${uid}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.message || 'מחיקת המשתמש נכשלה')
  }
}

/**
 * עדכון תפקיד משתמש (admin/user/storeManager) דרך השרת
 */
export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  const res = await fetch(`${BASE_URL}/${uid}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.message || 'עדכון התפקיד נכשל')
  }
}

/**
 * עדכון סטטוס משלוחן של משתמש
 */
export async function updateUserCourierStatus(uid: string, courierOptIn: boolean): Promise<void> {
  const res = await fetch(`${BASE_URL}/${uid}/courier`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courierOptIn }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.message || 'עדכון סטטוס משלוחן נכשל')
  }
}
