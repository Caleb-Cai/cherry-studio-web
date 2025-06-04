<template>
  <div class="assistants-view">
    <div class="assistants-header">
      <div class="header-content">
        <h1>🤖 AI Assistants</h1>
        <p>Create and manage your custom AI assistants</p>
      </div>
      
      <div class="header-actions">
        <el-input
          v-model="searchQuery"
          placeholder="Search assistants..."
          style="width: 300px; margin-right: 16px"
          :prefix-icon="Search"
          @input="handleSearch"
        />
        
        <el-select
          v-model="selectedCategory"
          placeholder="Category"
          style="width: 150px; margin-right: 16px"
          @change="handleCategoryFilter"
        >
          <el-option value="" label="All Categories" />
          <el-option
            v-for="category in categories"
            :key="category"
            :label="category"
            :value="category"
          />
        </el-select>
        
        <el-button
          type="primary"
          :icon="Plus"
          @click="showCreateDialog = true"
        >
          New Assistant
        </el-button>
      </div>
    </div>

    <div class="assistants-content">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-container">
        <el-skeleton :rows="3" animated />
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredAssistants.length === 0" class="empty-state">
        <div class="empty-state-icon">🤖</div>
        <h3>{{ searchQuery ? 'No assistants found' : 'No assistants yet' }}</h3>
        <p>
          {{ searchQuery ? 'Try adjusting your search criteria' : 'Create your first AI assistant to get started' }}
        </p>
        <el-button
          v-if="!searchQuery"
          type="primary"
          @click="showCreateDialog = true"
        >
          Create Assistant
        </el-button>
      </div>

      <!-- Assistants Grid -->
      <div v-else class="assistants-grid">
        <div
          v-for="assistant in filteredAssistants"
          :key="assistant.id"
          class="assistant-card"
        >
          <div class="assistant-header">
            <div class="assistant-avatar">
              {{ assistant.emoji || '🤖' }}
            </div>
            <div class="assistant-info">
              <h3>{{ assistant.name }}</h3>
              <el-tag
                v-if="assistant.category"
                size="small"
                type="info"
              >
                {{ assistant.category }}
              </el-tag>
            </div>
            <el-dropdown @command="(cmd) => handleAssistantAction(cmd, assistant)">
              <el-button text :icon="MoreFilled" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">Edit</el-dropdown-item>
                  <el-dropdown-item command="clone">Clone</el-dropdown-item>
                  <el-dropdown-item command="chat">Start Chat</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>Delete</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <div class="assistant-description">
            <p>{{ assistant.description || 'No description provided' }}</p>
          </div>

          <div class="assistant-footer">
            <div class="assistant-model">
              <el-tag size="small">{{ assistant.modelName || assistant.modelId }}</el-tag>
            </div>
            <div class="assistant-actions">
              <el-button
                size="small"
                @click="startChatWithAssistant(assistant)"
              >
                Chat
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Assistant Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingAssistant ? 'Edit Assistant' : 'Create New Assistant'"
      width="600px"
    >
      <el-form
        ref="assistantFormRef"
        :model="assistantForm"
        :rules="assistantRules"
        label-width="120px"
      >
        <el-form-item label="Name" prop="name">
          <el-input
            v-model="assistantForm.name"
            placeholder="Enter assistant name"
          />
        </el-form-item>

        <el-form-item label="Emoji" prop="emoji">
          <el-input
            v-model="assistantForm.emoji"
            placeholder="🤖"
            style="width: 100px"
          />
        </el-form-item>

        <el-form-item label="Category" prop="category">
          <el-select
            v-model="assistantForm.category"
            placeholder="Select category"
            allow-create
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="category in categories"
              :key="category"
              :label="category"
              :value="category"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Description" prop="description">
          <el-input
            v-model="assistantForm.description"
            type="textarea"
            :rows="3"
            placeholder="Describe what this assistant does..."
          />
        </el-form-item>

        <el-form-item label="Model" prop="modelId">
          <ModelSelector
            v-model:provider="assistantForm.provider"
            v-model:model="assistantForm.modelId"
            @update:model-name="assistantForm.modelName = $event"
          />
        </el-form-item>

        <el-form-item label="System Prompt" prop="systemPrompt">
          <el-input
            v-model="assistantForm.systemPrompt"
            type="textarea"
            :rows="6"
            placeholder="Enter the system prompt that defines the assistant's behavior..."
          />
        </el-form-item>

        <el-form-item label="Temperature">
          <el-slider
            v-model="assistantForm.temperature"
            :min="0"
            :max="1"
            :step="0.1"
            show-input
            :input-size="'small'"
          />
          <small class="form-help">Controls randomness: 0 = focused, 1 = creative</small>
        </el-form-item>

        <el-form-item label="Max Tokens">
          <el-input-number
            v-model="assistantForm.maxTokens"
            :min="1"
            :max="4000"
            :step="100"
            style="width: 150px"
          />
          <small class="form-help">Maximum response length</small>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleCancelCreate">Cancel</el-button>
        <el-button
          type="primary"
          :loading="isSaving"
          @click="handleSaveAssistant"
        >
          {{ editingAssistant ? 'Update' : 'Create' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus, MoreFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { ApiService } from '@/services/api'
import { useChatStore } from '@/stores/chat'
import ModelSelector from '@/components/ModelSelector.vue'

interface Assistant {
  id: string
  name: string
  emoji?: string
  description?: string
  category?: string
  modelId: string
  modelName?: string
  provider: string
  systemPrompt: string
  temperature: number
  maxTokens: number
  userId: string
  createdAt: string
  updatedAt: string
}

const router = useRouter()
const chatStore = useChatStore()

const assistants = ref<Assistant[]>([])
const categories = ref<string[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('')
const showCreateDialog = ref(false)
const editingAssistant = ref<Assistant | null>(null)
const assistantFormRef = ref<FormInstance>()

const assistantForm = reactive({
  name: '',
  emoji: '🤖',
  description: '',
  category: '',
  modelId: '',
  modelName: '',
  provider: '',
  systemPrompt: '',
  temperature: 0.7,
  maxTokens: 2000
})

const assistantRules: FormRules = {
  name: [
    { required: true, message: 'Please enter assistant name', trigger: 'blur' },
    { min: 2, message: 'Name must be at least 2 characters', trigger: 'blur' }
  ],
  modelId: [
    { required: true, message: 'Please select a model', trigger: 'change' }
  ],
  systemPrompt: [
    { required: true, message: 'Please enter system prompt', trigger: 'blur' },
    { min: 10, message: 'System prompt must be at least 10 characters', trigger: 'blur' }
  ]
}

const filteredAssistants = computed(() => {
  let filtered = assistants.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(assistant =>
      assistant.name.toLowerCase().includes(query) ||
      assistant.description?.toLowerCase().includes(query) ||
      assistant.category?.toLowerCase().includes(query)
    )
  }

  if (selectedCategory.value) {
    filtered = filtered.filter(assistant => assistant.category === selectedCategory.value)
  }

  return filtered
})

onMounted(async () => {
  await loadAssistants()
  await loadCategories()
})

async function loadAssistants() {
  isLoading.value = true
  try {
    const response = await ApiService.assistant.list()
    assistants.value = response.assistants || []
  } catch (error: any) {
    console.error('Error loading assistants:', error)
    ElMessage.error('Failed to load assistants')
  } finally {
    isLoading.value = false
  }
}

async function loadCategories() {
  try {
    const response = await ApiService.assistant.getCategories()
    categories.value = response.categories || []
  } catch (error: any) {
    console.error('Error loading categories:', error)
  }
}

function handleSearch() {
  // Search is reactive through computed property
}

function handleCategoryFilter() {
  // Filter is reactive through computed property
}

function handleAssistantAction(command: string, assistant: Assistant) {
  switch (command) {
    case 'edit':
      editAssistant(assistant)
      break
    case 'clone':
      cloneAssistant(assistant)
      break
    case 'chat':
      startChatWithAssistant(assistant)
      break
    case 'delete':
      deleteAssistant(assistant)
      break
  }
}

function editAssistant(assistant: Assistant) {
  editingAssistant.value = assistant
  Object.assign(assistantForm, {
    name: assistant.name,
    emoji: assistant.emoji || '🤖',
    description: assistant.description || '',
    category: assistant.category || '',
    modelId: assistant.modelId,
    modelName: assistant.modelName || '',
    provider: assistant.provider,
    systemPrompt: assistant.systemPrompt,
    temperature: assistant.temperature,
    maxTokens: assistant.maxTokens
  })
  showCreateDialog.value = true
}

async function cloneAssistant(assistant: Assistant) {
  try {
    const response = await ApiService.assistant.clone(assistant.id)
    assistants.value.unshift(response.assistant)
    ElMessage.success('Assistant cloned successfully')
  } catch (error: any) {
    console.error('Error cloning assistant:', error)
    ElMessage.error('Failed to clone assistant')
  }
}

async function startChatWithAssistant(assistant: Assistant) {
  try {
    const chat = await chatStore.createChat({
      title: `Chat with ${assistant.name}`,
      modelId: assistant.modelId,
      modelName: assistant.modelName || assistant.modelId,
      provider: assistant.provider
    })
    
    router.push(`/chat/${chat.id}`)
  } catch (error: any) {
    console.error('Error starting chat:', error)
    ElMessage.error('Failed to start chat')
  }
}

async function deleteAssistant(assistant: Assistant) {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete "${assistant.name}"?`,
      'Delete Assistant',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )
    
    await ApiService.assistant.delete(assistant.id)
    assistants.value = assistants.value.filter(a => a.id !== assistant.id)
    ElMessage.success('Assistant deleted successfully')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Error deleting assistant:', error)
      ElMessage.error('Failed to delete assistant')
    }
  }
}

async function handleSaveAssistant() {
  if (!assistantFormRef.value) return

  try {
    const valid = await assistantFormRef.value.validate()
    if (!valid) return

    isSaving.value = true

    if (editingAssistant.value) {
      // Update existing assistant
      const response = await ApiService.assistant.update(editingAssistant.value.id, assistantForm)
      const index = assistants.value.findIndex(a => a.id === editingAssistant.value!.id)
      if (index !== -1) {
        assistants.value[index] = response.assistant
      }
      ElMessage.success('Assistant updated successfully')
    } else {
      // Create new assistant
      const response = await ApiService.assistant.create(assistantForm)
      assistants.value.unshift(response.assistant)
      ElMessage.success('Assistant created successfully')
    }

    handleCancelCreate()
    await loadCategories() // Refresh categories in case a new one was added
  } catch (error: any) {
    console.error('Error saving assistant:', error)
    ElMessage.error('Failed to save assistant')
  } finally {
    isSaving.value = false
  }
}

function handleCancelCreate() {
  showCreateDialog.value = false
  editingAssistant.value = null
  Object.assign(assistantForm, {
    name: '',
    emoji: '🤖',
    description: '',
    category: '',
    modelId: '',
    modelName: '',
    provider: '',
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 2000
  })
  assistantFormRef.value?.resetFields()
}
</script>

<style scoped>
.assistants-view {
  padding: 24px;
  background-color: var(--el-bg-color-page);
  min-height: 100vh;
}

.assistants-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color);
}

.header-content h1 {
  font-size: 28px;
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
}

.header-content p {
  margin: 0;
  color: var(--el-text-color-secondary);
}

.header-actions {
  display: flex;
  align-items: center;
}

.assistants-content {
  max-width: 1200px;
}

.loading-container {
  padding: 40px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-state-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
}

.empty-state p {
  margin: 0 0 24px 0;
  color: var(--el-text-color-secondary);
}

.assistants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.assistant-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 20px;
  transition: all 0.2s;
}

.assistant-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.assistant-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
}

.assistant-avatar {
  font-size: 32px;
  margin-right: 12px;
  line-height: 1;
}

.assistant-info {
  flex: 1;
}

.assistant-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.assistant-description {
  margin-bottom: 16px;
}

.assistant-description p {
  margin: 0;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.assistant-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-help {
  color: var(--el-text-color-secondary);
  margin-left: 8px;
}
</style>