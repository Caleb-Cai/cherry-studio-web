<template>
  <el-config-provider :locale="locale">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import { provide, onMounted } from 'vue'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import { useAuthStore } from './stores/auth'
import { useChatStore } from './stores/chat'
import { useModelStore } from './stores/model'
import socketService from './services/socket'

const locale = ref(en) // Default to English, can be made configurable

const authStore = useAuthStore()
const chatStore = useChatStore()
const modelStore = useModelStore()

onMounted(async () => {
  // Initialize auth from localStorage
  authStore.initializeAuth()
  
  // Initialize model selections
  modelStore.initializeSelections()
  
  // If user is authenticated, initialize socket connection
  if (authStore.isAuthenticated) {
    try {
      await socketService.connect()
      chatStore.initializeSocketListeners()
    } catch (error) {
      console.error('Failed to connect to socket:', error)
    }
  }
})
</script>

<style>
#app {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
</style>
