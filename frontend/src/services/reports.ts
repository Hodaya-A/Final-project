import api from './api'

export async function fetchSalesReport() {
  const res = await api.get('/reports/sales')
  return res.data
}

export async function fetchExpiringProducts() {
  const res = await api.get('/reports/expiring')
  return res.data
}

export async function fetchUnsoldProducts() {
  const res = await api.get('/reports/unsold')
  return res.data
}
