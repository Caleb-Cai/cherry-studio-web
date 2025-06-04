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
    createdAt?: string
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
  models?: Model[]
}

export interface Assistant {
  id: string
  name: string
  description?: string
  emoji?: string
  category?: string
  modelId: string
  modelName?: string
  provider: string
  systemPrompt: string
  temperature: number
  maxTokens: number
  avatar?: string
  prompt?: string
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

// For API responses that return a single assistant
export interface AssistantCreateResponse {
  assistant: Assistant
}

export interface AssistantUpdateResponse {
  assistant: Assistant
}
