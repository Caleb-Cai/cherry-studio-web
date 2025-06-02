<template>
  <div class="layout-container">
    <!-- Sidebar -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>🍒 Cherry Studio</h2>
        <el-button
          type="primary"
          size="small"
          @click="showNewChatDialog = true"
        >
          New Chat
        </el-button>
      </div>

      <!-- Chat List -->
      <div class="chat-list">
        <div v-if="chatStore.isLoading" class="loading-container">
          <el-loading />
        </div>
        
        <div v-else-if="chatStore.sortedChats.length === 0" class="empty-state">
          <div class="empty-state-icon">💬</div>
          <p>No conversations yet</p>
          <p>Start a new chat to begin</p>
        </div>

        <div
          v-for="chat in chatStore.sortedChats"
          :key="chat.id"
          class="chat-item"
          :class="{ active: currentChatId === chat.id }"
          @click="selectChat(chat.id)"
        >
          <div class="chat-title">{{ chat.title }}</div>
          <div class="chat-meta">
            <span>{{ chat.modelName }}</span>
            <span>{{ formatDate(chat.updatedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer">
        <el-dropdown @command="handleUserAction">
          <el-button text>
            <el-avatar :size="24" :src="authStore.user?.avatar">
              {{ authStore.user?.name?.charAt(0).toUpperCase() }}
            </el-avatar>
            <span class="ml-2">{{ authStore.user?.name }}</span>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">Profile</el-dropdown-item>
              <el-dropdown-item command="settings">Settings</el-dropdown-item>
              <el-dropdown-item command="logout" divided>Logout</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Chat Header -->
      <div class="chat-header">
        <div v-if="currentChat">
          <h3>{{ currentChat.title }}</h3>
          <span class="text-sm text-gray-500">{{ currentChat.modelName }}</span>
        </div>
        <div v-else>
          <h3>Cherry Studio</h3>
        </div>

        <div class="chat-actions">
          <el-button
            v-if="currentChat"
            size="small"
            @click="showModelSelector = true"
          >
            Switch Model
          </el-button>
        </div>
      </div>

      <!-- Messages Area -->
      <div class="chat-messages" ref="messagesContainer">
        <div v-if="!currentChat" class="empty-state">
          <div class="empty-state-icon">🍒</div>
          <h2>Welcome to Cherry Studio</h2>
          <p>Select a conversation or start a new chat to begin</p>
        </div>

        <div v-else>
          <div
            v-for="message in chatStore.currentMessages"
            :key="message.id"
            class="message-item"
            :class="message.role"
          >
            <div class="message-avatar" :class="message.role">
              {{ message.role === 'user' ? 'U' : 'A' }}
            </div>
            <div class="message-content">
              <MessageContent :content="message.content" />
            </div>
          </div>

          <!-- Streaming Message -->
          <div
            v-if="chatStore.isStreaming"
            class="message-item assistant streaming-message"
          >
            <div class="message-avatar assistant">A</div>
            <div class="message-content">
              <MessageContent :content="chatStore.streamingContent" />
              <div class="typing-indicator">
                <div class="typing-dots">
                  <div class="typing-dot"></div>
                  <div class="typing-dot"></div>
                  <div class="typing-dot"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div v-if="currentChat" class="chat-input">
        <ChatInput
          :disabled="chatStore.isStreaming"
          @send="handleSendMessage"
        />
      </div>
    </div>

    <!-- New Chat Dialog -->
    <el-dialog
      v-model="showNewChatDialog"
      title="Start New Chat"
      width="500px"
    >
      <el-form @submit.prevent="handleCreateChat">
        <el-form-item label="Chat Title">
          <el-input
            v-model="newChatForm.title"
            placeholder="Enter chat title"
          />
        </el-form-item>
        
        <el-form-item label="AI Model">
          <ModelSelector
            v-model:provider="newChatForm.provider"
            v-model:model="newChatForm.modelId"
            @update:model-name="newChatForm.modelName = $event"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showNewChatDialog = false">Cancel</el-button>
        <el-button
          type="primary"
          :disabled="!newChatForm.title || !newChatForm.modelId"
          @click="handleCreateChat"
        >
          Create Chat
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useModelStore } from '@/stores/model'
import MessageContent from '@/components/MessageContent.vue'
import ChatInput from '@/components/ChatInput.vue'
import ModelSelector from '@/components/ModelSelector.vue'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const chatStore = useChatStore()
const modelStore = useModelStore()

const messagesContainer = ref<HTMLElement>()
const showNewChatDialog = ref(false)
const showModelSelector = ref(false)

const currentChatId = computed(() => route.params.id as string)
const currentChat = computed(() => chatStore.currentChat)

const newChatForm = ref({
  title: '',
  provider: '',
  modelId: '',
  modelName: ''
})

// Load data on mount
onMounted(async () => {
  await Promise.all([
    chatStore.loadChats(),
    modelStore.loadProviders(),
    modelStore.loadModels()
  ])
  
  // Load specific chat if ID is provided
  if (currentChatId.value) {
    await chatStore.loadChat(currentChatId.value)
  }
})

// Watch for route changes
watch(currentChatId, async (newId) => {
  if (newId && newId !== currentChat.value?.id) {
    await chatStore.loadChat(newId)
  }
})

// Auto-scroll to bottom when new messages arrive
watch(
  () => chatStore.currentMessages.length,
  () => {
    nextTick(() => {
      scrollToBottom()
    })
  }
)

watch(
  () => chatStore.streamingContent,
  () => {
    nextTick(() => {
      scrollToBottom()
    })
  }
)

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

async function selectChat(chatId: string) {
  router.push(`/chat/${chatId}`)
}

async function handleCreateChat() {
  try {
    const chat = await chatStore.createChat({
      title: newChatForm.value.title,
      modelId: newChatForm.value.modelId,
      modelName: newChatForm.value.modelName,
      provider: newChatForm.value.provider
    })
    
    showNewChatDialog.value = false
    resetNewChatForm()
    
    // Navigate to new chat
    router.push(`/chat/${chat.id}`)
    
    ElMessage.success('Chat created successfully')
  } catch (error: any) {
    console.error('Failed to create chat:', error)
  }
}

function resetNewChatForm() {
  newChatForm.value = {
    title: '',
    provider: '',
    modelId: '',
    modelName: ''
  }
}

async function handleSendMessage(content: string) {
  if (!currentChat.value) return
  
  try {
    chatStore.sendMessage(content)
  } catch (error: any) {
    console.error('Failed to send message:', error)
    ElMessage.error('Failed to send message')
  }
}

function handleUserAction(command: string) {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      authStore.logout()
      break
  }
}

function formatDate(date: string) {
  return dayjs(date).format('MMM D')
}
</script>

<style scoped>
.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h2 {
  font-size: 18px;
  margin: 0;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--el-border-color);
}

.chat-actions {
  display: flex;
  gap: 8px;
}

.text-sm {
  font-size: 14px;
}

.text-gray-500 {
  color: var(--el-text-color-secondary);
}

.ml-2 {
  margin-left: 8px;
}
</style>
