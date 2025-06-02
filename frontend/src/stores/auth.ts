import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ApiService } from '@/services/api'
import { ElMessage } from 'element-plus'
import router from '@/router'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  async function login(credentials: { email: string; password: string }) {
    isLoading.value = true
    try {
      const response = await ApiService.auth.login(credentials)
      
      token.value = response.token
      user.value = response.user
      
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      ElMessage.success('Login successful')
      
      // Redirect to home or intended route
      const redirect = router.currentRoute.value.query.redirect as string
      router.push(redirect || '/')
      
      return response
    } catch (error: any) {
      console.error('Login error:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function register(userData: {
    email: string
    password: string
    name: string
  }) {
    isLoading.value = true
    try {
      const response = await ApiService.auth.register(userData)
      
      token.value = response.token
      user.value = response.user
      
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      ElMessage.success('Registration successful')
      router.push('/')
      
      return response
    } catch (error: any) {
      console.error('Registration error:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    token.value = null
    user.value = null
    
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    router.push('/login')
    ElMessage.info('Logged out successfully')
  }

  async function refreshToken() {
    if (!token.value) return false

    try {
      const response = await ApiService.auth.refreshToken(token.value)
      
      token.value = response.token
      user.value = response.user
      
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      logout()
      return false
    }
  }

  async function changePassword(data: {
    currentPassword: string
    newPassword: string
  }) {
    try {
      await ApiService.auth.changePassword(data)
      ElMessage.success('Password changed successfully')
    } catch (error: any) {
      console.error('Change password error:', error)
      throw error
    }
  }

  async function forgotPassword(email: string) {
    try {
      await ApiService.auth.forgotPassword(email)
      ElMessage.success('Password reset instructions sent to your email')
    } catch (error: any) {
      console.error('Forgot password error:', error)
      throw error
    }
  }

  function initializeAuth() {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken && savedUser) {
      token.value = savedToken
      try {
        user.value = JSON.parse(savedUser)
      } catch (error) {
        console.error('Error parsing saved user data:', error)
        logout()
      }
    }
  }

  return {
    user: readonly(user),
    token: readonly(token),
    isLoading: readonly(isLoading),
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
    changePassword,
    forgotPassword,
    initializeAuth
  }
})
