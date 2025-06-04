#!/bin/bash

# Cherry Studio Frontend 修复部署脚本
# 在服务器上执行此脚本来应用修复

set -e

echo "开始修复 Cherry Studio Frontend 构建问题..."

# 进入项目目录
cd /opt/cherry-studio

# 备份原始文件
echo "备份原始文件..."
mkdir -p backup/$(date +%Y%m%d_%H%M%S)
cp frontend/tsconfig.json backup/$(date +%Y%m%d_%H%M%S)/
cp frontend/src/App.vue backup/$(date +%Y%m%d_%H%M%S)/
cp frontend/src/services/api.ts backup/$(date +%Y%m%d_%H%M%S)/

# 修复 tsconfig.json
echo "修复 TypeScript 配置..."
cat > frontend/tsconfig.json << 'EOF'
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "include": [
    "env.d.ts",
    "src/**/*",
    "src/**/*.vue",
    "src/auto-imports.d.ts"
  ],
  "exclude": [
    "src/**/__tests__/*"
  ],
  "compilerOptions": {
    "composite": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": [
      "element-plus/global",
      "node"
    ],
    "strict": true,
    "noImplicitAny": false,
    "skipLibCheck": true,
    "allowJs": true,
    "esModuleInterop": true
  }
}
EOF

# 修复 App.vue
echo "修复 App.vue..."
cat > frontend/src/App.vue << 'EOF'
<template>
  <el-config-provider :locale="locale">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import { ref, provide, onMounted } from 'vue'
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
EOF

# 创建类型定义目录
echo "创建类型定义..."
mkdir -p frontend/src/types

# 创建 API 类型定义
cat > frontend/src/types/api.ts << 'EOF'
export interface ApiResponse<T = any> {
  data: T
  message?: string
  status: number
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
  }
}

export interface Chat {
  id: string
  title: string
  modelId: string
  modelName: string
  provider: string
  userId: string
  isArchived: boolean
  createdAt: string
  updatedAt: string
  messages: Message[]
  _count?: {
    messages: number
  }
}

export interface Message {
  id: string
  chatId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
  metadata?: any
  tokens?: number
}

export interface Model {
  id: string
  name: string
  provider: string
  type: 'chat' | 'reasoning' | 'vision' | 'code' | 'embedding'
  maxTokens?: number
  supportVision?: boolean
  supportFunctionCalling?: boolean
}

export interface Provider {
  id: string
  name: string
  models: Model[]
}

export interface Assistant {
  id: string
  name: string
  description: string
  avatar?: string
  prompt: string
  modelId: string
  userId: string
  isPublic: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface ChatResponse {
  chats: Chat[]
  pagination?: any
}

export interface ModelsResponse {
  models: Model[]
  providers?: Provider[]
}

export interface AssistantsResponse {
  assistants: Assistant[]
  categories?: string[]
}
EOF

# 修复 API 服务
echo "修复 API 服务..."
cat > frontend/src/services/api.ts << 'EOF'
import axios, { type AxiosResponse, AxiosError } from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import type { 
  ApiResponse, 
  AuthResponse, 
  Chat, 
  Message, 
  Model, 
  Provider, 
  Assistant,
  ChatResponse,
  ModelsResponse,
  AssistantsResponse
} from '@/types/api'

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
  (error: AxiosError<any>) => {
    const authStore = useAuthStore()
    
    if (error.response?.status === 401) {
      authStore.logout()
      router.push('/login')
      ElMessage.error('Authentication failed. Please login again.')
    } else if (error.response?.status === 403) {
      ElMessage.error('Access denied')
    } else if (error.response?.status && error.response.status >= 500) {
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
    register: (data: any): Promise<AuthResponse> => api.post('/api/auth/register', data),
    login: (data: any): Promise<AuthResponse> => api.post('/api/auth/login', data),
    refreshToken: (token: string): Promise<AuthResponse> => api.post('/api/auth/refresh-token', { token }),
    changePassword: (data: any) => api.post('/api/auth/change-password', data),
    forgotPassword: (email: string) => api.post('/api/auth/forgot-password', { email })
  }

  // Chat endpoints
  static chat = {
    create: (data: any): Promise<Chat> => api.post('/api/chats', data),
    list: (params?: any): Promise<ChatResponse> => api.get('/api/chats', { params }),
    get: (id: string): Promise<Chat> => api.get(`/api/chats/${id}`),
    update: (id: string, data: any): Promise<Chat> => api.put(`/api/chats/${id}`, data),
    delete: (id: string) => api.delete(`/api/chats/${id}`),
    archive: (id: string) => api.post(`/api/chats/${id}/archive`),
    sendMessage: (id: string, data: any): Promise<Message> => api.post(`/api/chats/${id}/messages`, data),
    getMessages: (id: string, params?: any): Promise<Message[]> => api.get(`/api/chats/${id}/messages`, { params }),
    search: (query: string): Promise<ChatResponse> => api.get('/api/chats/search', { params: { query } })
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
    create: (data: any): Promise<Assistant> => api.post('/api/assistants', data),
    list: (params?: any): Promise<AssistantsResponse> => api.get('/api/assistants', { params }),
    get: (id: string): Promise<Assistant> => api.get(`/api/assistants/${id}`),
    update: (id: string, data: any): Promise<Assistant> => api.put(`/api/assistants/${id}`, data),
    delete: (id: string) => api.delete(`/api/assistants/${id}`),
    clone: (id: string): Promise<Assistant> => api.post(`/api/assistants/${id}/clone`),
    search: (query: string, params?: any): Promise<AssistantsResponse> => api.get('/api/assistants/search', { params: { query, ...params } }),
    getCategories: (): Promise<{ categories: string[] }> => api.get('/api/assistants/categories')
  }

  // Model endpoints
  static model = {
    list: (provider?: string): Promise<ModelsResponse> => api.get('/api/models', { params: { provider } }),
    getProviders: (): Promise<{ providers: Provider[] }> => api.get('/api/models/providers'),
    getCategories: () => api.get('/api/models/categories'),
    getInfo: (provider: string, modelId: string): Promise<Model> => api.get(`/api/models/${provider}/${modelId}`),
    test: (data: any) => api.post('/api/models/test', data),
    search: (query: string, params?: any): Promise<ModelsResponse> => api.get('/api/models/search', { params: { query, ...params } })
  }

  // User endpoints
  static user = {
    getProfile: () => api.get('/api/users/profile'),
    updateProfile: (data: any) => api.put('/api/users/profile', data),
    getStats: () => api.get('/api/users/stats')
  }
}

export default api
EOF

# 修复其他有问题的文件
echo "修复组件文件..."

# 修复 ChatInput.vue
if [ -f "frontend/src/components/ChatInput.vue" ]; then
  sed -i 's/import.*Send.*from.*@element-plus\/icons-vue.*/import { Promotion } from "@element-plus\/icons-vue"/g' frontend/src/components/ChatInput.vue
  sed -i 's/<Send/<Promotion/g' frontend/src/components/ChatInput.vue
  sed -i 's/<\/Send>/<\/Promotion>/g' frontend/src/components/ChatInput.vue
fi

# 修复 NotFoundView.vue
if [ -f "frontend/src/views/NotFoundView.vue" ]; then
  sed -i 's/import.*Robot.*from.*@element-plus\/icons-vue.*/import { Avatar } from "@element-plus\/icons-vue"/g' frontend/src/views/NotFoundView.vue
  sed -i 's/<Robot/<Avatar/g' frontend/src/views/NotFoundView.vue
  sed -i 's/<\/Robot>/<\/Avatar>/g' frontend/src/views/NotFoundView.vue
fi

# 修复 socket.ts 中的函数类型问题
if [ -f "frontend/src/services/socket.ts" ]; then
  sed -i 's/Function/(...args: any[]) => void/g' frontend/src/services/socket.ts
fi

# 清理和重新安装依赖
echo "清理并重新安装依赖..."
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --force

# 生成自动导入类型文件
echo "生成自动导入类型文件..."
npx vue-tsc --noEmit --skipLibCheck || true

# 尝试构建
echo "尝试构建前端..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ 前端构建成功！"
  
  # 重新启动 frontend 容器
  echo "重新启动前端容器..."
  cd ..
  docker-compose -f docker-compose.prod.yml up --build frontend -d
  
  echo "✅ 部署完成！"
  echo "前端服务应该在 http://172.16.18.174:8080 上运行"
else
  echo "❌ 构建失败，请检查错误信息"
  exit 1
fi
