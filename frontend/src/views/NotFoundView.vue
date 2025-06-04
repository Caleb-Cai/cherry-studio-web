<template>
  <div class="not-found-view">
    <div class="not-found-content">
      <div class="error-illustration">
        <div class="error-code">404</div>
        <div class="error-icon">🍒</div>
      </div>
      
      <div class="error-message">
        <h1>Page Not Found</h1>
        <p>
          Oops! The page you're looking for doesn't exist. 
          It might have been moved, deleted, or you entered the wrong URL.
        </p>
      </div>
      
      <div class="error-actions">
        <el-button type="primary" size="large" @click="goHome">
          <el-icon><HouseIcon /></el-icon>
          Go Home
        </el-button>
        
        <el-button size="large" @click="goBack">
          <el-icon><ArrowLeftIcon /></el-icon>
          Go Back
        </el-button>
      </div>
      
      <div class="helpful-links">
        <h3>Maybe try one of these?</h3>
        <div class="links-grid">
          <router-link to="/" class="helpful-link">
            <el-icon><ChatDotSquareIcon /></el-icon>
            <span>Start a New Chat</span>
          </router-link>
          
          <router-link to="/assistants" class="helpful-link">
            <el-icon><AvatarIcon /></el-icon>
            <span>Browse Assistants</span>
          </router-link>
          
          <router-link to="/files" class="helpful-link">
            <el-icon><FolderIcon /></el-icon>
            <span>Manage Files</span>
          </router-link>
          
          <router-link to="/settings" class="helpful-link">
            <el-icon><SettingIcon /></el-icon>
            <span>Settings</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { 
  House as HouseIcon, 
  ArrowLeft as ArrowLeftIcon, 
  ChatDotSquare as ChatDotSquareIcon, 
  Avatar as AvatarIcon, 
  Folder as FolderIcon, 
  Setting as SettingIcon 
} from '@element-plus/icons-vue'

const router = useRouter()

function goHome() {
  router.push('/')
}

function goBack() {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
.not-found-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.not-found-content {
  text-align: center;
  background: white;
  border-radius: 16px;
  padding: 60px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
}

.error-illustration {
  position: relative;
  margin-bottom: 40px;
}

.error-code {
  font-size: 120px;
  font-weight: bold;
  color: #e0e6ed;
  line-height: 1;
  margin-bottom: -20px;
}

.error-icon {
  font-size: 80px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translate(-50%, -50%);
  }
  50% {
    transform: translate(-50%, -60%);
  }
}

.error-message {
  margin-bottom: 40px;
}

.error-message h1 {
  font-size: 32px;
  margin: 0 0 16px 0;
  color: #2c3e50;
}

.error-message p {
  font-size: 16px;
  color: #7f8c8d;
  line-height: 1.6;
  margin: 0;
  max-width: 400px;
  margin: 0 auto;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.helpful-links {
  border-top: 1px solid #ecf0f1;
  padding-top: 32px;
}

.helpful-links h3 {
  font-size: 18px;
  margin: 0 0 24px 0;
  color: #2c3e50;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  max-width: 400px;
  margin: 0 auto;
}

.helpful-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  text-decoration: none;
  color: #495057;
  transition: all 0.2s;
}

.helpful-link:hover {
  background: #e9ecef;
  color: #495057;
  transform: translateY(-2px);
}

.helpful-link .el-icon {
  font-size: 24px;
  color: var(--el-color-primary);
}

.helpful-link span {
  font-size: 14px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .not-found-content {
    padding: 40px 20px;
  }
  
  .error-code {
    font-size: 80px;
  }
  
  .error-icon {
    font-size: 60px;
  }
  
  .error-message h1 {
    font-size: 24px;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .links-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
