<template>
  <div class="settings-view">
    <div class="settings-header">
      <h1>⚙️ Settings</h1>
      <p>Configure your Cherry Studio preferences</p>
    </div>

    <div class="settings-content">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- General Settings -->
        <el-tab-pane label="General" name="general">
          <div class="settings-section">
            <h3>Application Settings</h3>
            
            <el-form :model="generalSettings" label-width="180px">
              <el-form-item label="Language">
                <el-select v-model="generalSettings.language" style="width: 200px">
                  <el-option label="English" value="en" />
                  <el-option label="中文" value="zh" />
                  <el-option label="日本語" value="ja" />
                </el-select>
              </el-form-item>

              <el-form-item label="Theme">
                <el-radio-group v-model="generalSettings.theme">
                  <el-radio label="light">Light</el-radio>
                  <el-radio label="dark">Dark</el-radio>
                  <el-radio label="auto">Auto</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="Auto-save Chats">
                <el-switch v-model="generalSettings.autoSave" />
                <small class="form-help">Automatically save chat history</small>
              </el-form-item>

              <el-form-item label="Send with Enter">
                <el-switch v-model="generalSettings.sendWithEnter" />
                <small class="form-help">Press Enter to send messages</small>
              </el-form-item>

              <el-form-item label="Show Timestamps">
                <el-switch v-model="generalSettings.showTimestamps" />
                <small class="form-help">Display message timestamps</small>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- About -->
        <el-tab-pane label="About" name="about">
          <div class="settings-section">
            <div class="about-content">
              <div class="app-info">
                <h2>🍒 Cherry Studio</h2>
                <p class="version">Version {{ appVersion }}</p>
                <p class="description">
                  A modern AI chat application built with Vue.js and powered by multiple AI providers.
                </p>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- Save Actions -->
    <div class="settings-actions">
      <el-button @click="resetToDefaults">Reset to Defaults</el-button>
      <el-button type="primary" :loading="isSaving" @click="saveSettings">
        Save Settings
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('general')
const isSaving = ref(false)
const appVersion = ref('1.0.0')

const generalSettings = reactive({
  language: 'en',
  theme: 'light',
  autoSave: true,
  sendWithEnter: true,
  showTimestamps: false
})

onMounted(async () => {
  await loadSettings()
})

async function loadSettings() {
  try {
    const saved = localStorage.getItem('settings')
    if (saved) {
      const settings = JSON.parse(saved)
      Object.assign(generalSettings, settings.general || {})
    }
  } catch (error) {
    console.error('Error loading settings:', error)
  }
}

async function saveSettings() {
  isSaving.value = true
  try {
    const settings = {
      general: generalSettings
    }
    
    localStorage.setItem('settings', JSON.stringify(settings))
    document.documentElement.setAttribute('data-theme', generalSettings.theme)
    
    ElMessage.success('Settings saved successfully')
  } catch (error: any) {
    console.error('Error saving settings:', error)
    ElMessage.error('Failed to save settings')
  } finally {
    isSaving.value = false
  }
}

function resetToDefaults() {
  ElMessageBox.confirm(
    'This will reset all settings to their default values. Continue?',
    'Reset Settings',
    {
      confirmButtonText: 'Reset',
      cancelButtonText: 'Cancel',
      type: 'warning'
    }
  ).then(() => {
    Object.assign(generalSettings, {
      language: 'en',
      theme: 'light',
      autoSave: true,
      sendWithEnter: true,
      showTimestamps: false
    })
    
    ElMessage.success('Settings reset to defaults')
  }).catch(() => {
    // User cancelled
  })
}
</script>

<style scoped>
.settings-view {
  padding: 24px;
  background-color: var(--el-bg-color-page);
  min-height: 100vh;
}

.settings-header {
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color);
}

.settings-header h1 {
  font-size: 28px;
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
}

.settings-header p {
  margin: 0;
  color: var(--el-text-color-secondary);
}

.settings-content {
  max-width: 800px;
  margin-bottom: 32px;
}

.settings-section {
  padding: 24px;
}

.settings-section h3 {
  margin: 0 0 16px 0;
  color: var(--el-text-color-primary);
}

.form-help {
  color: var(--el-text-color-secondary);
  margin-left: 8px;
}

.settings-actions {
  max-width: 800px;
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  padding: 16px 0;
  border-top: 1px solid var(--el-border-color);
}

.about-content {
  text-align: center;
}

.app-info h2 {
  font-size: 32px;
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
}

.version {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  margin-bottom: 16px;
}

.description {
  max-width: 500px;
  margin: 0 auto 32px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}
</style>