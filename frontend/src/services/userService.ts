/**
 * מחיקת משתמש מהשרת – גם מ־Firestore וגם מ־Authentication
 */
export async function deleteUserByUid(uid: string): Promise<void> {
  const res = await fetch(`http://localhost:3000/api/users/${uid}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.message || 'מחיקת המשתמש נכשלה')
  }
}

/**
 * עדכון תפקיד משתמש (admin/user) דרך השרת
 */
export async function updateUserRole(
  uid: string,
  role: 'admin' | 'user' | 'storeManager',
): Promise<void> {
  const res = await fetch(`http://localhost:3000/api/users/${uid}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.message || 'עדכון התפקיד נכשל')
  }
}
