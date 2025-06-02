<template>
  <div class="chat-input-container">
    <div class="input-wrapper">
      <el-input
        ref="inputRef"
        v-model="message"
        type="textarea"
        :placeholder="placeholder"
        :disabled="disabled"
        :autosize="{ minRows: 1, maxRows: 6 }"
        resize="none"
        class="message-input"
        @keydown="handleKeydown"
      />
      
      <div class="input-actions">
        <el-button
          type="text"
          :icon="Paperclip"
          @click="$emit('attach-file')"
          title="Attach file"
        />
        
        <el-button
          type="primary"
          :icon="Send"
          :disabled="!canSend"
          :loading="disabled"
          @click="handleSend"
          title="Send message (Ctrl+Enter)"
        />
      </div>
    </div>
    
    <div v-if="showOptions" class="input-options">
      <div class="option-group">
        <label>Temperature:</label>
        <el-slider
          v-model="temperature"
          :min="0"
          :max="2"
          :step="0.1"
          style="width: 120px"
        />
        <span class="option-value">{{ temperature }}</span>
      </div>
      
      <div class="option-group">
        <label>Max Tokens:</label>
        <el-input-number
          v-model="maxTokens"
          :min="1"
          :max="8192"
          :step="100"
          size="small"
          style="width: 120px"
        />
      </div>
      
      <el-button
        type="text"
        size="small"
        @click="showOptions = false"
      >
        Hide Options
      </el-button>
    </div>
    
    <div v-else class="show-options">
      <el-button
        type="text"
        size="small"
        @click="showOptions = true"
      >
        Advanced Options
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Send, Paperclip } from '@element-plus/icons-vue'
import type { ElInput } from 'element-plus'

interface Props {
  disabled?: boolean
  placeholder?: string
}

interface Emits {
  (e: 'send', content: string, options: { temperature: number; maxTokens: number }): void
  (e: 'attach-file'): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  placeholder: 'Type your message... (Ctrl+Enter to send)'
})

const emit = defineEmits<Emits>()

const inputRef = ref<InstanceType<typeof ElInput>>()
const message = ref('')
const showOptions = ref(false)
const temperature = ref(0.7)
const maxTokens = ref(4096)

const canSend = computed(() => {
  return message.value.trim().length > 0 && !props.disabled
})

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault()
      handleSend()
    } else if (!event.shiftKey) {
      // Allow normal Enter for new lines when Shift is not pressed
      // This behavior can be customized based on user preferences
    }
  }
}

function handleSend() {
  if (!canSend.value) return
  
  const content = message.value.trim()
  const options = {
    temperature: temperature.value,
    maxTokens: maxTokens.value
  }
  
  emit('send', content, options)
  message.value = ''
  
  // Focus back to input
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// Expose focus method
defineExpose({
  focus: () => inputRef.value?.focus()
})
</script>

<style scoped>
.chat-input-container {
  width: 100%;
}

.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
}

.input-actions {
  display: flex;
  gap: 4px;
  align-items: flex-end;
  padding-bottom: 5px;
}

.input-options {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
  padding: 12px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 8px;
  font-size: 14px;
}

.option-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-group label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  min-width: 80px;
}

.option-value {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  min-width: 30px;
}

.show-options {
  margin-top: 8px;
  text-align: right;
}

.message-input :deep(.el-textarea__inner) {
  resize: none !important;
  font-family: inherit;
  line-height: 1.5;
}

.message-input :deep(.el-input__wrapper) {
  border-radius: 12px;
}
</style>
