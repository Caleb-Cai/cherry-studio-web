import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ApiService } from '@/services/api'
import { socketService, type SocketMessage } from '@/services/socket'
import { ElMessage } from 'element-plus'

export interface Message {
  id: string
  chatId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
  metadata?: any
  tokens?: number
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

export const useChatStore = defineStore('chat', () => {
  const chats = ref<Chat[]>([])
  const currentChat = ref<Chat | null>(null)
  const messages = ref<Message[]>([])
  const isLoading = ref(false)
  const isStreaming = ref(false)
  const streamingContent = ref('')
  const currentPage = ref(1)
  const hasMore = ref(true)

  const currentMessages = computed(() => 
    currentChat.value ? messages.value : []
  )

  const sortedChats = computed(() =>
    chats.value.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  )

  async function loadChats(page = 1, limit = 20) {
    isLoading.value = true
    try {
      const response = await ApiService.chat.list({ page, limit })
      
      if (page === 1) {
        chats.value = response.chats
      } else {
        chats.value.push(...response.chats)
      }
      
      currentPage.value = page
      hasMore.value = response.pagination.hasMore
      
      return response
    } catch (error: any) {
      console.error('Error loading chats:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function createChat(data: {
    title: string
    modelId: string
    modelName: string
    provider: string
  }) {
    try {
      const chat = await ApiService.chat.create(data)
      chats.value.unshift(chat)
      currentChat.value = chat
      messages.value = chat.messages || []
      
      // Join the chat room for real-time updates
      socketService.joinChat(chat.id)
      
      return chat
    } catch (error: any) {
      console.error('Error creating chat:', error)
      throw error
    }
  }

  async function loadChat(chatId: string) {
    isLoading.value = true
    try {
      const chat = await ApiService.chat.get(chatId)
      currentChat.value = chat
      messages.value = chat.messages || []
      
      // Join the chat room for real-time updates
      socketService.joinChat(chatId)
      
      return chat
    } catch (error: any) {
      console.error('Error loading chat:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function updateChat(chatId: string, data: { title: string }) {
    try {
      const updatedChat = await ApiService.chat.update(chatId, data)
      
      // Update in local state
      const index = chats.value.findIndex(c => c.id === chatId)
      if (index !== -1) {
        chats.value[index] = { ...chats.value[index], ...updatedChat }
      }
      
      if (currentChat.value?.id === chatId) {
        currentChat.value = { ...currentChat.value, ...updatedChat }
      }
      
      return updatedChat
    } catch (error: any) {
      console.error('Error updating chat:', error)
      throw error
    }
  }

  async function deleteChat(chatId: string) {
    try {
      await ApiService.chat.delete(chatId)
      
      // Remove from local state
      chats.value = chats.value.filter(c => c.id !== chatId)
      
      if (currentChat.value?.id === chatId) {
        currentChat.value = null
        messages.value = []
      }
      
      // Leave the chat room
      socketService.leaveChat(chatId)
      
      ElMessage.success('Chat deleted successfully')
    } catch (error: any) {
      console.error('Error deleting chat:', error)
      throw error
    }
  }

  async function archiveChat(chatId: string) {
    try {
      await ApiService.chat.archive(chatId)
      
      // Remove from local state (archived chats are not shown)
      chats.value = chats.value.filter(c => c.id !== chatId)
      
      if (currentChat.value?.id === chatId) {
        currentChat.value = null
        messages.value = []
      }
      
      ElMessage.success('Chat archived successfully')
    } catch (error: any) {
      console.error('Error archiving chat:', error)
      throw error
    }
  }

  function sendMessage(content: string, options?: {
    temperature?: number
    maxTokens?: number
  }) {
    if (!currentChat.value) {
      throw new Error('No active chat')
    }

    // Add user message immediately to UI
    const userMessage: Message = {
      id: Date.now().toString(),
      chatId: currentChat.value.id,
      role: 'user',
      content,
      createdAt: new Date().toISOString()
    }
    
    messages.value.push(userMessage)
    
    // Send via socket for streaming response
    socketService.sendMessage({
      chatId: currentChat.value.id,
      content,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens
    })
  }

  function handleSocketMessage(message: SocketMessage) {
    // Add received message to current chat if it matches
    if (currentChat.value?.id === message.chatId) {
      const existingIndex = messages.value.findIndex(m => m.id === message.id)
      if (existingIndex === -1) {
        messages.value.push(message)
      }
    }
    
    // Update chat's updatedAt timestamp
    const chatIndex = chats.value.findIndex(c => c.id === message.chatId)
    if (chatIndex !== -1) {
      chats.value[chatIndex].updatedAt = message.createdAt
    }
  }

  function handleStreamStart(data: { chatId: string }) {
    if (currentChat.value?.id === data.chatId) {
      isStreaming.value = true
      streamingContent.value = ''
    }
  }

  function handleStreamChunk(data: { chatId: string; chunk: string; isComplete: boolean }) {
    if (currentChat.value?.id === data.chatId && isStreaming.value) {
      streamingContent.value += data.chunk
    }
  }

  function handleStreamComplete(data: { chatId: string; message: SocketMessage }) {
    if (currentChat.value?.id === data.chatId) {
      isStreaming.value = false
      streamingContent.value = ''
      
      // Add the complete message
      messages.value.push(data.message)
      
      // Update chat timestamp
      const chatIndex = chats.value.findIndex(c => c.id === data.chatId)
      if (chatIndex !== -1) {
        chats.value[chatIndex].updatedAt = data.message.createdAt
      }
    }
  }

  function handleStreamError(data: { chatId: string; error: string }) {
    if (currentChat.value?.id === data.chatId) {
      isStreaming.value = false
      streamingContent.value = ''
      ElMessage.error(`Chat error: ${data.error}`)
    }
  }

  async function searchChats(query: string) {
    try {
      const response = await ApiService.chat.search(query)
      return response.chats
    } catch (error: any) {
      console.error('Error searching chats:', error)
      throw error
    }
  }

  function clearCurrentChat() {
    if (currentChat.value) {
      socketService.leaveChat(currentChat.value.id)
    }
    currentChat.value = null
    messages.value = []
    isStreaming.value = false
    streamingContent.value = ''
  }

  // Initialize socket event listeners
  function initializeSocketListeners() {
    socketService.onMessage(handleSocketMessage)
    socketService.onStreamStart(handleStreamStart)
    socketService.onStreamChunk(handleStreamChunk)
    socketService.onStreamComplete(handleStreamComplete)
    socketService.onStreamError(handleStreamError)
  }

  return {
    chats: readonly(chats),
    currentChat: readonly(currentChat),
    messages: readonly(messages),
    currentMessages,
    sortedChats,
    isLoading: readonly(isLoading),
    isStreaming: readonly(isStreaming),
    streamingContent: readonly(streamingContent),
    hasMore: readonly(hasMore),
    loadChats,
    createChat,
    loadChat,
    updateChat,
    deleteChat,
    archiveChat,
    sendMessage,
    searchChats,
    clearCurrentChat,
    initializeSocketListeners
  }
})
