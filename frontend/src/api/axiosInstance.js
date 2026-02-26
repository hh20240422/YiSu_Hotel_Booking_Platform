import axios from 'axios'

// All requests go through /api (proxied to localhost:3001 by Vite)
const instance = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Request interceptor: attach JWT token from localStorage
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('hotel_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: unwrap data, handle auth errors globally
instance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || '请求失败'
    if (error.response?.status === 401) {
      localStorage.removeItem('hotel_token')
      localStorage.removeItem('hotel_user')
      window.location.href = '/login'
    }
    return Promise.reject(new Error(message))
  }
)

export default instance
