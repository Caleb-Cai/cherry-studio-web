import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

export interface SocketMessage {
  id: string
  chatId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
  metadata?: any
}

export interface StreamChunk {
  chatId: string
  chunk: string
  isComplete: boolean
  message?: SocketMessage
}

class SocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      const authStore = useAuthStore()
      
      if (!authStore.token) {
        reject(new Error('No authentication token'))
        return
      }

      this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
        auth: {
          token: authStore.token
        },
        transports: ['websocket', 'polling']
      })

      this.socket.on('connect', () => {
        console.log('Socket connected')
        this.reconnectAttempts = 0
        resolve(this.socket!)
      })

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        if (error.message === 'Authentication error') {
          authStore.logout()
          ElMessage.error('Authentication failed. Please login again.')
        }
        reject(error)
      })

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason)
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, try to reconnect
          this.attemptReconnect()
        }
      })

      this.socket.on('error', (error) => {
        console.error('Socket error:', error)
        ElMessage.error('Connection error occurred')
      })
    })
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        this.connect().catch(() => {
          this.attemptReconnect()
        })
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      ElMessage.error('Failed to reconnect to server. Please refresh the page.')
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  // Chat related methods
  joinChat(chatId: string) {
    this.socket?.emit('join-chat', chatId)
  }

  leaveChat(chatId: string) {
    this.socket?.emit('leave-chat', chatId)
  }

  sendMessage(data: {
    chatId: string
    content: string
    temperature?: number
    maxTokens?: number
  }) {
    this.socket?.emit('send-message', data)
  }

  // Event listeners
  onMessage(callback: (message: SocketMessage) => void) {
    this.socket?.on('message', callback)
  }

  onStreamStart(callback: (data: { chatId: string }) => void) {
    this.socket?.on('stream-start', callback)
  }

  onStreamChunk(callback: (data: StreamChunk) => void) {
    this.socket?.on('stream-chunk', callback)
  }

  onStreamComplete(callback: (data: { chatId: string; message: SocketMessage }) => void) {
    this.socket?.on('stream-complete', callback)
  }

  onStreamError(callback: (data: { chatId: string; error: string }) => void) {
    this.socket?.on('stream-error', callback)
  }

  onUserTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
    this.socket?.on('user-typing', callback)
  }

  onFileProcessing(callback: (data: { fileId: string; status: string }) => void) {
    this.socket?.on('file-processing', callback)
  }

  // Utility methods
  setTyping(chatId: string, isTyping: boolean) {
    this.socket?.emit('typing', { chatId, isTyping })
  }

  notifyFileUploaded(fileId: string) {
    this.socket?.emit('file-uploaded', { fileId })
  }

  // Remove event listeners
  removeAllListeners() {
    this.socket?.removeAllListeners()
  }

  removeListener(event: string, callback?: Function) {
    if (callback) {
      this.socket?.off(event, callback)
    } else {
      this.socket?.removeAllListeners(event)
    }
  }

  // Check connection status
  get isConnected(): boolean {
    return this.socket?.connected || false
  }

  get id(): string | undefined {
    return this.socket?.id
  }
}

export const socketService = new SocketService()
export default socketService
