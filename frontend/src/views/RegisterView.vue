<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <h1>项目管理知识库系统</h1>
        <h2>PMKS</h2>
        <p>Create your account to get started.</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="register-form"
        @submit.prevent="handleRegister"
      >
        <el-form-item prop="name">
          <el-input
            v-model="form.name"
            placeholder="Full name"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="email">
          <el-input
            v-model="form.email"
            type="email"
            placeholder="Email address"
            size="large"
            :prefix-icon="Message"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="Password"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="Confirm password"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleRegister"
          />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="form.acceptTerms" size="large">
            I agree to the 
            <el-link type="primary" @click="showTerms = true">
              Terms of Service
            </el-link>
            and 
            <el-link type="primary" @click="showPrivacy = true">
              Privacy Policy
            </el-link>
          </el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="isLoading"
            :disabled="!form.acceptTerms"
            style="width: 100%"
            @click="handleRegister"
          >
            Create Account
          </el-button>
        </el-form-item>
      </el-form>

      <div class="register-footer">
        <el-divider>Or</el-divider>
        
        <p>
          Already have an account?
          <router-link to="/login">Sign in here</router-link>
        </p>
      </div>
    </div>

    <!-- Terms of Service Dialog -->
    <el-dialog
      v-model="showTerms"
      title="Terms of Service"
      width="600px"
      :show-close="true"
    >
      <div class="terms-content">
        <h3>1. Acceptance of Terms</h3>
        <p>By using PMKS, you agree to be bound by these Terms of Service.</p>
        
        <h3>2. Description of Service</h3>
        <p>PMKS is a Project Management Knowledge System that provides project management capabilities.</p>
        
        <h3>3. User Responsibilities</h3>
        <p>You are responsible for maintaining the confidentiality of your account credentials.</p>
        
        <h3>4. Prohibited Uses</h3>
        <p>You may not use the service for any illegal or unauthorized purpose.</p>
        
        <h3>5. Privacy</h3>
        <p>Your privacy is important to us. Please review our Privacy Policy.</p>
      </div>
      
      <template #footer>
        <el-button @click="showTerms = false">Close</el-button>
      </template>
    </el-dialog>

    <!-- Privacy Policy Dialog -->
    <el-dialog
      v-model="showPrivacy"
      title="Privacy Policy"
      width="600px"
      :show-close="true"
    >
      <div class="privacy-content">
        <h3>Information We Collect</h3>
        <p>We collect information you provide directly to us, such as when you create an account.</p>
        
        <h3>How We Use Your Information</h3>
        <p>We use the information we collect to provide, maintain, and improve our services.</p>
        
        <h3>Information Sharing</h3>
        <p>We do not sell, trade, or otherwise transfer your personal information to third parties.</p>
        
        <h3>Data Security</h3>
        <p>We implement appropriate security measures to protect your personal information.</p>
      </div>
      
      <template #footer>
        <el-button @click="showPrivacy = false">Close</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { User, Message, Lock } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const isLoading = computed(() => authStore.isLoading)
const showTerms = ref(false)
const showPrivacy = ref(false)

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
})

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('Please confirm your password'))
  } else if (value !== form.password) {
    callback(new Error('Passwords do not match'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  name: [
    { required: true, message: 'Please enter your full name', trigger: 'blur' },
    { min: 2, message: 'Name must be at least 2 characters', trigger: 'blur' }
  ],
  email: [
    { required: true, message: 'Please enter your email', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Please enter your password', trigger: 'blur' },
    { min: 8, message: 'Password must be at least 8 characters', trigger: 'blur' },
    { 
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number', 
      trigger: 'blur' 
    }
  ],
  confirmPassword: [
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

async function handleRegister() {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    if (!form.acceptTerms) {
      ElMessage.warning('Please accept the Terms of Service and Privacy Policy')
      return
    }

    await authStore.register({
      name: form.name,
      email: form.email,
      password: form.password
    })
  } catch (error: any) {
    console.error('Registration failed:', error)
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #4a6741;
  padding: 20px;
}

.register-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 40px;
  width: 100%;
  max-width: 450px;
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.register-header h1 {
  font-size: 24px;
  margin-bottom: 8px;
  color: #333;
  font-weight: 600;
  line-height: 1.2;
}

.register-header h2 {
  font-size: 32px;
  margin-bottom: 16px;
  color: #4a6741;
  font-weight: bold;
  letter-spacing: 2px;
}

.register-header p {
  color: #666;
  font-size: 14px;
}

.register-form {
  margin-bottom: 24px;
}

.register-footer {
  text-align: center;
}

.register-footer p {
  margin: 8px 0;
  font-size: 14px;
  color: #666;
}

.register-footer a {
  color: var(--el-color-primary);
  text-decoration: none;
}

.register-footer a:hover {
  text-decoration: underline;
}

.terms-content,
.privacy-content {
  max-height: 400px;
  overflow-y: auto;
  padding: 16px 0;
}

.terms-content h3,
.privacy-content h3 {
  color: #333;
  margin: 16px 0 8px 0;
  font-size: 16px;
}

.terms-content p,
.privacy-content p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 12px;
}

:deep(.el-checkbox__label) {
  line-height: 1.5;
}
</style>