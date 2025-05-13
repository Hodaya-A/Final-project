import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // כמו שהשרת מאזין
})

export default api
