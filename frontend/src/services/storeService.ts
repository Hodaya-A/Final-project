const BASE_URL = 'http://localhost:3000/api/stores'

export interface StoreDetails {
  storeId: string
  name?: string
  city?: string
  street?: string
  houseNumber?: string
  phone?: string
  email?: string
  description?: string
  logoUrl?: string
}

export async function fetchStore(storeId: string): Promise<StoreDetails> {
  const res = await fetch(`${BASE_URL}/${storeId}`)
  if (res.status === 404) {
    // חנות לא קיימת עדיין בבקאנד – נחזיר פרטי ברירת מחדל כדי לא לשבור את המסך
    return { storeId }
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'טעינת פרטי החנות נכשלה')
  }
  return (await res.json()) as StoreDetails
}

export async function updateStore(
  storeId: string,
  payload: Partial<StoreDetails>,
): Promise<StoreDetails> {
  const res = await fetch(`${BASE_URL}/${storeId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'שמירת פרטי החנות נכשלה')
  }

  const data = await res.json()
  return (data.store || data) as StoreDetails
}
