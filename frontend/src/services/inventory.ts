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
  const formData = new FormData()
  formData.append('file', file)
  formData.append('mode', mode)

  // אל תקבע Content-Type ידנית – ה־boundary צריך להיקבע אוטומטית
  const { data }: AxiosResponse<UploadResult> = await api.post('/inventory/upload', formData)
  return data
}

/** שמירת פרופיל ייבוא (המסלול בשרת הוא /api/importProfiles) */
export async function saveImportProfile(profile: ImportProfile): Promise<{ ok: boolean }> {
  const { data }: AxiosResponse<{ ok: boolean }> = await api.post('/importProfiles', profile)
  return data
}
