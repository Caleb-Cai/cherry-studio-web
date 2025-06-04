<template>
  <div class="profile-view">
    <div class="profile-header">
      <h1>👤 Profile</h1>
      <p>Manage your account information and preferences</p>
    </div>

    <div class="profile-content">
      <div class="profile-card">
        <!-- Avatar Section -->
        <div class="avatar-section">
          <div class="avatar-container">
            <el-avatar :size="120" :src="profileForm.avatar">
              {{ profileForm.name?.charAt(0).toUpperCase() }}
            </el-avatar>
          </div>
          <h2>{{ profileForm.name }}</h2>
          <p class="user-email">{{ profileForm.email }}</p>
        </div>

        <!-- Profile Form -->
        <div class="profile-form">
          <h3>Personal Information</h3>
          
          <el-form
            ref="profileFormRef"
            :model="profileForm"
            :rules="profileRules"
            label-width="120px"
          >
            <el-form-item label="Full Name" prop="name">
              <el-input
                v-model="profileForm.name"
                placeholder="Enter your full name"
                style="width: 300px"
              />
            </el-form-item>

            <el-form-item label="Email" prop="email">
              <el-input
                v-model="profileForm.email"
                type="email"
                placeholder="Enter your email"
                style="width: 300px"
                disabled
              />
              <small class="form-help">Email cannot be changed</small>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="isSaving" @click="saveProfile">
                Save Changes
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const profileFormRef = ref<FormInstance>()
const isSaving = ref(false)

const profileForm = reactive({
  name: '',
  email: '',
  avatar: ''
})

const profileRules: FormRules = {
  name: [
    { required: true, message: 'Please enter your name', trigger: 'blur' },
    { min: 2, message: 'Name must be at least 2 characters', trigger: 'blur' }
  ]
}

onMounted(async () => {
  await loadProfile()
})

async function loadProfile() {
  try {
    if (authStore.user) {
      Object.assign(profileForm, {
        name: authStore.user.name || '',
        email: authStore.user.email || '',
        avatar: authStore.user.avatar || ''
      })
    }
  } catch (error: any) {
    console.error('Error loading profile:', error)
    ElMessage.error('Failed to load profile')
  }
}

async function saveProfile() {
  if (!profileFormRef.value) return

  try {
    const valid = await profileFormRef.value.validate()
    if (!valid) return

    isSaving.value = true
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('Profile updated successfully')
  } catch (error: any) {
    console.error('Error saving profile:', error)
    ElMessage.error('Failed to save profile')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.profile-view {
  padding: 24px;
  background-color: var(--el-bg-color-page);
  min-height: 100vh;
}

.profile-header {
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color);
}

.profile-header h1 {
  font-size: 28px;
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
}

.profile-header p {
  margin: 0;
  color: var(--el-text-color-secondary);
}

.profile-content {
  max-width: 800px;
}

.profile-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 24px;
}

.avatar-section {
  text-align: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--el-border-color);
}

.avatar-container {
  margin-bottom: 16px;
}

.avatar-section h2 {
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
}

.user-email {
  margin: 0;
  color: var(--el-text-color-secondary);
}

.profile-form h3 {
  margin: 0 0 16px 0;
  color: var(--el-text-color-primary);
}

.form-help {
  color: var(--el-text-color-secondary);
  margin-left: 8px;
}
</style>