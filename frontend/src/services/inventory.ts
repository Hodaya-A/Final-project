// frontend/src/services/inventory.ts
import api from './api'
import type { AxiosResponse } from 'axios'

export interface InventoryItem {
  _id?: string
  barcode: string
  name: string
  price: number
  quantity: number
  category?: string
  salePrice?: number
  expiryDate?: string // ISO
  imageUrl?: string | null
}

export interface UploadResult {
  ok: boolean
  detectedHeaders?: string[]
  usedMapping?: Record<string, string | null>
  totalRows: number
  processed: number
  errors: Array<{ row: number; reason: string }>
}

export interface ImportProfile {
  mapping: {
    barcode: string
    name: string
    price: string
    quantity: string
    category?: string
    salePrice?: string
    expiryDate?: string
  }
  fileOptions: {
    type: 'csv' | 'xlsx' | 'xls'
    encoding: 'utf8' | 'win1255'
    delimiter: string
    headerRowIndex: number
    dataStartRow: number
    dateFormat: string
    priceInAgorot: boolean
  }
}

/** שליפה עם פרמטרים (דפדוף/חיפוש/קטגוריה) */
export async function getInventory(
  params: Record<string, string | number> = {},
): Promise<InventoryItem[]> {
  const { data }: AxiosResponse<InventoryItem[]> = await api.get('/inventory', { params })
  return data
}

/** העלאת קובץ מלאי. mode: "update" | "renew" (ברירת מחדל: update) */
export async function uploadInventory(
  file: File,
  mode: 'update' | 'renew' = 'update',
): Promise<UploadResult> {
  console.log('🚀 uploadInventory called')
  console.log('📁 File:', file.name, 'Size:', file.size, 'Type:', file.type)
  console.log('🔄 Mode:', mode)

  const formData = new FormData()
  formData.append('file', file)
  formData.append('mode', mode)

  console.log('📦 FormData created, entries:')
  for (const [key, value] of formData.entries()) {
    console.log(`  ${key}:`, value)
  }

  try {
    console.log('📤 Sending POST request to /inventory/upload')
    const { data }: AxiosResponse<UploadResult> = await api.post('/inventory/upload', formData, {
      headers: {
        'Content-Type': undefined, // זה אומר ל-axios לא לדרוס ולתת לדפדפן לקבוע
      },
    })
    console.log('✅ Upload successful:', data)
    return data
  } catch (error: any) {
    console.error('❌ Upload failed:', error)
    console.error('Error response:', error.response?.data)
    console.error('Error status:', error.response?.status)
    throw error
  }
}

/** שמירת פרופיל ייבוא (המסלול בשרת הוא /api/importProfiles) */
export async function saveImportProfile(profile: ImportProfile): Promise<{ ok: boolean }> {
  const { data }: AxiosResponse<{ ok: boolean }> = await api.post('/importProfiles', profile)
  return data
}
