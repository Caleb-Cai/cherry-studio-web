import { defineStore } from 'pinia'
import { ref, computed, readonly, watch } from 'vue'
import { ApiService } from '@/services/api'
import type { Model, Provider as ApiProvider, ModelsResponse } from '@/types/api'

// Export Model type for external use
export type { Model } from '@/types/api'

export interface Provider {
  id: string
  name: string
  supportStreaming: boolean
  supportVision: boolean
  supportFunctionCalling: boolean
}

export const useModelStore = defineStore('model', () => {
  const models = ref<Model[]>([])
  const providers = ref<Provider[]>([])
  const isLoading = ref(false)
  const selectedProvider = ref<string>('')
  const selectedModel = ref<string>('')

  const availableModels = computed(() => {
    if (selectedProvider.value) {
      return models.value.filter(m => m.provider === selectedProvider.value)
    }
    return models.value
  })

  const currentModel = computed(() => 
    models.value.find(m => m.id === selectedModel.value)
  )

  const modelsByProvider = computed(() => {
    const grouped: Record<string, Model[]> = {}
    models.value.forEach(model => {
      if (!grouped[model.provider]) {
        grouped[model.provider] = []
      }
      grouped[model.provider].push(model)
    })
    return grouped
  })

  const modelsByType = computed(() => {
    const grouped: Record<string, Model[]> = {}
    models.value.forEach(model => {
      if (!grouped[model.type]) {
        grouped[model.type] = []
      }
      grouped[model.type].push(model)
    })
    return grouped
  })

  async function loadProviders() {
    isLoading.value = true
    try {
      const response = await ApiService.model.getProviders()
      // Map API providers to internal provider format
      providers.value = (response.providers || []).map((apiProvider: ApiProvider) => ({
        id: apiProvider.id,
        name: apiProvider.name,
        supportStreaming: true,
        supportVision: false,
        supportFunctionCalling: false
      }))
      return response
    } catch (error: any) {
      console.error('Error loading providers:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function loadModels(provider?: string) {
    isLoading.value = true
    try {
      const response: ModelsResponse = await ApiService.model.list(provider)
      
      if (provider) {
        // Replace models for specific provider
        models.value = models.value.filter(m => m.provider !== provider)
        models.value.push(...(response.models || []))
      } else {
        models.value = response.models || []
        if (response.providers) {
          providers.value = response.providers.map((apiProvider: ApiProvider) => ({
            id: apiProvider.id,
            name: apiProvider.name,
            supportStreaming: true,
            supportVision: false,
            supportFunctionCalling: false
          }))
        }
      }
      
      return response
    } catch (error: any) {
      console.error('Error loading models:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function loadModelInfo(provider: string, modelId: string) {
    try {
      const model: Model = await ApiService.model.getInfo(provider, modelId)
      
      // Update model in local state
      const index = models.value.findIndex(m => 
        m.id === modelId && m.provider === provider
      )
      if (index !== -1) {
        models.value[index] = { ...models.value[index], ...model }
      } else {
        models.value.push(model)
      }
      
      return model
    } catch (error: any) {
      console.error('Error loading model info:', error)
      throw error
    }
  }

  async function testModel(provider: string, modelId: string, message?: string) {
    try {
      const response = await ApiService.model.test({
        provider,
        modelId,
        message: message || 'Hello, this is a test message. Please respond briefly.'
      })
      return response
    } catch (error: any) {
      console.error('Error testing model:', error)
      throw error
    }
  }

  async function searchModels(query: string, filters?: {
    type?: string
    provider?: string
  }) {
    try {
      const response: ModelsResponse = await ApiService.model.search(query, filters)
      return response.models || []
    } catch (error: any) {
      console.error('Error searching models:', error)
      throw error
    }
  }

  function setSelectedProvider(providerId: string) {
    selectedProvider.value = providerId
    // Reset selected model when provider changes
    if (selectedModel.value && currentModel.value?.provider !== providerId) {
      selectedModel.value = ''
    }
  }

  function setSelectedModel(modelId: string) {
    selectedModel.value = modelId
    // Update selected provider if model belongs to different provider
    const model = models.value.find(m => m.id === modelId)
    if (model && model.provider !== selectedProvider.value) {
      selectedProvider.value = model.provider
    }
  }

  function getModelsByProvider(providerId: string) {
    return models.value.filter(m => m.provider === providerId)
  }

  function getModelsByType(type: string) {
    return models.value.filter(m => m.type === type)
  }

  function getProviderById(providerId: string) {
    return providers.value.find(p => p.id === providerId)
  }

  function isModelSupported(modelId: string, feature: 'vision' | 'streaming' | 'functionCalling') {
    const model = models.value.find(m => m.id === modelId)
    if (!model) return false

    const provider = getProviderById(model.provider)
    if (!provider) return false

    switch (feature) {
      case 'vision':
        return model.supportVision || false
      case 'streaming':
        return provider.supportStreaming
      case 'functionCalling':
        return model.supportFunctionCalling || false
      default:
        return false
    }
  }

  // Initialize with saved selections
  function initializeSelections() {
    const savedProvider = localStorage.getItem('selectedProvider')
    const savedModel = localStorage.getItem('selectedModel')
    
    if (savedProvider) {
      selectedProvider.value = savedProvider
    }
    
    if (savedModel) {
      selectedModel.value = savedModel
    }
  }

  // Watch for changes and save to localStorage
  watch(selectedProvider, (newProvider: any) => {
    if (newProvider) {
      localStorage.setItem('selectedProvider', newProvider)
    }
  })

  watch(selectedModel, (newModel: any) => {
    if (newModel) {
      localStorage.setItem('selectedModel', newModel)
    }
  })

  return {
    models: readonly(models),
    providers: readonly(providers),
    availableModels,
    currentModel,
    modelsByProvider,
    modelsByType,
    isLoading: readonly(isLoading),
    selectedProvider: readonly(selectedProvider),
    selectedModel: readonly(selectedModel),
    loadProviders,
    loadModels,
    loadModelInfo,
    testModel,
    searchModels,
    setSelectedProvider,
    setSelectedModel,
    getModelsByProvider,
    getModelsByType,
    getProviderById,
    isModelSupported,
    initializeSelections
  }
})