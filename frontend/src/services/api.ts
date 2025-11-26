// frontend/src/services/api.ts
import axios from 'axios'
import type { AxiosInstance } from 'axios'

const api: AxiosInstance = axios.create({
  baseURL: '/api', // עובד עם ה-proxy שהגדרנו ב-vite.config.ts
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
})

export default api
