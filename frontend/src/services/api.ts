// frontend/src/services/api.ts
import axios from 'axios'
import type { AxiosInstance } from 'axios'

const api: AxiosInstance = axios.create({
  baseURL: '/api', // עובד עם ה-proxy שהגדרנו ב-vite.config.ts
  timeout: 60000,
  withCredentials: false,
})

// נוסיף interceptor שיוסיף Content-Type רק לבקשות שאינן FormData
api.interceptors.request.use((config) => {
  // אם אין Content-Type (או הוא undefined) ואין FormData, נוסיף application/json
  if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json'
  }
  return config
})

export default api
