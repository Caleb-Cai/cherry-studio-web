<template>
  <div class="model-selector">
    <div class="selector-row">
      <div class="provider-selector">
        <label>Provider:</label>
        <el-select
          :model-value="provider"
          placeholder="Select Provider"
          @change="handleProviderChange"
          style="width: 150px"
        >
          <el-option
            v-for="p in modelStore.providers"
            :key="p.id"
            :label="p.name"
            :value="p.id"
          />
        </el-select>
      </div>
      
      <div class="model-selector-field">
        <label>Model:</label>
        <el-select
          :model-value="model"
          placeholder="Select Model"
          :disabled="!provider"
          @change="handleModelChange"
          style="width: 250px"
        >
          <el-option-group
            v-for="(models, type) in groupedModels"
            :key="type"
            :label="type"
          >
            <el-option
              v-for="m in models"
              :key="m.id"
              :label="m.name"
              :value="m.id"
            >
              <div class="model-option">
                <span class="model-name">{{ m.name }}</span>
                <div class="model-tags">
                  <el-tag v-if="m.supportVision" size="small" type="success">Vision</el-tag>
                  <el-tag v-if="m.type === 'reasoning'" size="small" type="warning">Reasoning</el-tag>
                </div>
              </div>
            </el-option>
          </el-option-group>
        </el-select>
      </div>
    </div>
    
    <div v-if="selectedModelInfo" class="model-info">
      <div class="model-details">
        <span class="model-type">{{ selectedModelInfo.type }}</span>
        <span v-if="selectedModelInfo.maxTokens" class="max-tokens">
          Max: {{ selectedModelInfo.maxTokens }} tokens
        </span>
      </div>
      
      <div class="model-capabilities">
        <el-tag v-if="selectedModelInfo.supportVision" size="small" effect="light">
          Vision Support
        </el-tag>
        <el-tag v-if="selectedModelInfo.supportFunctionCalling" size="small" effect="light">
          Function Calling
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { useModelStore } from '@/stores/model'
import type { Model } from '@/stores/model'

interface Props {
  provider: string
  model: string
}

interface Emits {
  (e: 'update:provider', value: string): void
  (e: 'update:model', value: string): void
  (e: 'update:model-name', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const modelStore = useModelStore()

const availableModels = computed(() => {
  if (!props.provider) return []
  return modelStore.getModelsByProvider(props.provider)
})

const groupedModels = computed(() => {
  const grouped: Record<string, Model[]> = {}
  availableModels.value.forEach(model => {
    const type = model.type || 'chat'
    if (!grouped[type]) {
      grouped[type] = []
    }
    grouped[type].push(model)
  })
  return grouped
})

const selectedModelInfo = computed(() => {
  if (!props.model) return null
  return modelStore.models.find(m => m.id === props.model)
})

function handleProviderChange(providerId: string) {
  emit('update:provider', providerId)
  emit('update:model', '') // Reset model when provider changes
  emit('update:model-name', '')
}

function handleModelChange(modelId: string) {
  emit('update:model', modelId)
  
  const model = modelStore.models.find(m => m.id === modelId)
  if (model) {
    emit('update:model-name', model.name)
  }
}

// Load providers and models on mount
onMounted(async () => {
  if (modelStore.providers.length === 0) {
    await modelStore.loadProviders()
  }
  
  if (modelStore.models.length === 0) {
    await modelStore.loadModels()
  }
})

// Watch for provider changes to load models
watch(() => props.provider, async (newProvider) => {
  if (newProvider && modelStore.getModelsByProvider(newProvider).length === 0) {
    await modelStore.loadModels(newProvider)
  }
})
</script>

<style scoped>
.model-selector {
  width: 100%;
}

.selector-row {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 8px;
}

.provider-selector,
.model-selector-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.provider-selector label,
.model-selector-field label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.model-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.model-name {
  flex: 1;
}

.model-tags {
  display: flex;
  gap: 4px;
}

.model-info {
  padding: 8px 12px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 6px;
  font-size: 12px;
}

.model-details {
  display: flex;
  gap: 12px;
  margin-bottom: 4px;
}

.model-type {
  color: var(--el-color-primary);
  font-weight: 500;
  text-transform: capitalize;
}

.max-tokens {
  color: var(--el-text-color-secondary);
}

.model-capabilities {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
</style>
