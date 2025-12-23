const BASE_URL = 'http://localhost:3000/api/users'

export type UserRole = 'admin' | 'user' | 'storeManager'
export interface ManagedUser {
  uid: string
  email: string
  name?: string
  role: UserRole
  storeId?: string
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
  return (data.users || []) as ManagedUser[]
}

/**
 * יצירת משתמש חדש ע"י אדמין
 */
export async function createUser(user: {
  email: string
  password: string
  name?: string
  role?: UserRole
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
