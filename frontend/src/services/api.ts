import axios, { AxiosResponse, AxiosError } from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  (error: AxiosError) => {
    const authStore = useAuthStore()
    
    if (error.response?.status === 401) {
      authStore.logout()
      router.push('/login')
      ElMessage.error('Authentication failed. Please login again.')
    } else if (error.response?.status === 403) {
      ElMessage.error('Access denied')
    } else if (error.response?.status >= 500) {
      ElMessage.error('Server error. Please try again later.')
    } else if (error.response?.data?.error?.message) {
      ElMessage.error(error.response.data.error.message)
    } else {
      ElMessage.error('An unexpected error occurred')
    }
    
    return Promise.reject(error)
  }
)

// API service class
export class ApiService {
  // Auth endpoints
  static auth = {
    register: (data: any) => api.post('/api/auth/register', data),
    login: (data: any) => api.post('/api/auth/login', data),
    refreshToken: (token: string) => api.post('/api/auth/refresh-token', { token }),
    changePassword: (data: any) => api.post('/api/auth/change-password', data),
    forgotPassword: (email: string) => api.post('/api/auth/forgot-password', { email })
  }

  // Chat endpoints
  static chat = {
    create: (data: any) => api.post('/api/chats', data),
    list: (params?: any) => api.get('/api/chats', { params }),
    get: (id: string) => api.get(`/api/chats/${id}`),
    update: (id: string, data: any) => api.put(`/api/chats/${id}`, data),
    delete: (id: string) => api.delete(`/api/chats/${id}`),
    archive: (id: string) => api.post(`/api/chats/${id}/archive`),
    sendMessage: (id: string, data: any) => api.post(`/api/chats/${id}/messages`, data),
    getMessages: (id: string, params?: any) => api.get(`/api/chats/${id}/messages`, { params }),
    search: (query: string) => api.get('/api/chats/search', { params: { query } })
  }

  // File endpoints
  static file = {
    upload: (formData: FormData) => api.post('/api/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    list: (params?: any) => api.get('/api/files', { params }),
    get: (id: string) => api.get(`/api/files/${id}`),
    getContent: (id: string) => api.get(`/api/files/${id}/content`),
    delete: (id: string) => api.delete(`/api/files/${id}`),
    search: (query: string) => api.get('/api/files/search', { params: { query } })
  }

  // Assistant endpoints
  static assistant = {
    create: (data: any) => api.post('/api/assistants', data),
    list: (params?: any) => api.get('/api/assistants', { params }),
    get: (id: string) => api.get(`/api/assistants/${id}`),
    update: (id: string, data: any) => api.put(`/api/assistants/${id}`, data),
    delete: (id: string) => api.delete(`/api/assistants/${id}`),
    clone: (id: string) => api.post(`/api/assistants/${id}/clone`),
    search: (query: string, params?: any) => api.get('/api/assistants/search', { params: { query, ...params } }),
    getCategories: () => api.get('/api/assistants/categories')
  }

  // Model endpoints
  static model = {
    list: (provider?: string) => api.get('/api/models', { params: { provider } }),
    getProviders: () => api.get('/api/models/providers'),
    getCategories: () => api.get('/api/models/categories'),
    getInfo: (provider: string, modelId: string) => api.get(`/api/models/${provider}/${modelId}`),
    test: (data: any) => api.post('/api/models/test', data),
    search: (query: string, params?: any) => api.get('/api/models/search', { params: { query, ...params } })
  }

  // User endpoints
  static user = {
    getProfile: () => api.get('/api/users/profile'),
    updateProfile: (data: any) => api.put('/api/users/profile', data),
    getStats: () => api.get('/api/users/stats')
  }
}

export default api
