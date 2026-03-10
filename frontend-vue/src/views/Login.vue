<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { authApi } from '../services/api'
import { useAuthStore } from '../stores/auth'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const loginForm = ref({
  username: '',
  password: ''
})

const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    ElMessage.warning(t('login.usernamePlaceholder'))
    return
  }

  try {
    loading.value = true

    // Call backend login API
    const response = await authApi.login(loginForm.value.username, loginForm.value.password)
    console.log('登录响应:', response)

    // Save login state and token
    authStore.setAuth(response.access_token, response.user)

    console.log('Token已设置:', authStore.token)
    console.log('认证状态 (setAuth后):', authStore.isAuthenticated)

    ElMessage.success(t('login.loginSuccess'))

    // Wait for reactive state to update before navigation
    await nextTick()

    console.log('认证状态 (nextTick后):', authStore.isAuthenticated)

    // Redirect to dashboard
    await router.push('/dashboard')
  } catch (error) {
    console.error('登录失败:', error)
    const errorMessage = error instanceof Error ? error.message : t('login.loginFailed')
    ElMessage.error(errorMessage)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <el-card class="login-card">
      <div class="login-header">
        <h1>{{ t('login.title') }}</h1>
        <p>{{ t('login.subtitle') }}</p>
      </div>

      <el-form :model="loginForm" @submit.prevent="handleLogin">
        <el-form-item>
          <el-input
            v-model="loginForm.username"
            :placeholder="t('login.usernamePlaceholder')"
            :prefix-icon="User"
            autocomplete="username"
            size="large"
          />
        </el-form-item>

        <el-form-item>
          <el-input
            v-model="loginForm.password"
            type="password"
            :placeholder="t('login.passwordPlaceholder')"
            :prefix-icon="Lock"
            autocomplete="current-password"
            size="large"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            size="large"
            style="width: 100%"
            @click="handleLogin"
          >
            {{ loading ? t('login.loggingIn') : t('login.loginButton') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F9FAFB;
}

.login-card {
  width: 400px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.login-header p {
  font-size: 14px;
  color: #6B7280;
  margin: 0;
}

@media (max-width: 480px) {
  .login-card {
    width: 90%;
    margin: 0 16px;
  }

  .login-header h1 {
    font-size: 24px;
  }
}
</style>
