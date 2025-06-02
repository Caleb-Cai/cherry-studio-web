<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>🍒 Cherry Studio</h1>
        <p>Welcome back! Please sign in to your account.</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="email">
          <el-input
            v-model="form.email"
            type="email"
            placeholder="Email address"
            size="large"
            :prefix-icon="User"
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
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="isLoading"
            style="width: 100%"
            @click="handleLogin"
          >
            Sign In
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <el-divider>Or</el-divider>
        
        <p>
          Don't have an account?
          <router-link to="/register">Sign up here</router-link>
        </p>
        
        <p>
          <el-link type="primary" @click="showForgotPassword = true">
            Forgot your password?
          </el-link>
        </p>
      </div>
    </div>

    <!-- Forgot Password Dialog -->
    <el-dialog
      v-model="showForgotPassword"
      title="Reset Password"
      width="400px"
    >
      <el-form @submit.prevent="handleForgotPassword">
        <el-form-item label="Email">
          <el-input
            v-model="forgotEmail"
            type="email"
            placeholder="Enter your email address"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showForgotPassword = false">Cancel</el-button>
        <el-button
          type="primary"
          :loading="isLoading"
          @click="handleForgotPassword"
        >
          Send Reset Link
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const isLoading = computed(() => authStore.isLoading)
const showForgotPassword = ref(false)
const forgotEmail = ref('')

const form = reactive({
  email: '',
  password: ''
})

const rules: FormRules = {
  email: [
    { required: true, message: 'Please enter your email', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Please enter your password', trigger: 'blur' },
    { min: 6, message: 'Password must be at least 6 characters', trigger: 'blur' }
  ]
}

async function handleLogin() {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    await authStore.login(form)
  } catch (error: any) {
    console.error('Login failed:', error)
  }
}

async function handleForgotPassword() {
  if (!forgotEmail.value) {
    ElMessage.warning('Please enter your email address')
    return
  }

  try {
    await authStore.forgotPassword(forgotEmail.value)
    showForgotPassword.value = false
    forgotEmail.value = ''
  } catch (error: any) {
    console.error('Forgot password failed:', error)
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  font-size: 32px;
  margin-bottom: 8px;
  color: #333;
}

.login-header p {
  color: #666;
  font-size: 14px;
}

.login-form {
  margin-bottom: 24px;
}

.login-footer {
  text-align: center;
}

.login-footer p {
  margin: 8px 0;
  font-size: 14px;
  color: #666;
}

.login-footer a {
  color: var(--el-color-primary);
  text-decoration: none;
}

.login-footer a:hover {
  text-decoration: underline;
}
</style>
