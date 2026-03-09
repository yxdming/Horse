<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElDropdown, ElDropdownMenu, ElDropdownItem, ElAvatar, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import {
  Odometer,
  Document,
  Brush,
  QuestionFilled,
  User,
  Setting,
  SwitchButton
} from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { useLanguageStore } from '../stores/language'
import LanguageSwitcher from './LanguageSwitcher.vue'
import logoImage from '../assets/images/logo.png'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const languageStore = useLanguageStore()

const collapsed = ref(false)

const menuItems = computed(() => [
  {
    key: '/dashboard',
    icon: Odometer,
    label: t('sidebar.dashboard'),
  },
  {
    key: '/knowledge',
    icon: Document,
    label: t('sidebar.knowledge'),
  },
  {
    key: '/memory',
    icon: Brush,
    label: t('sidebar.memory'),
  },
  {
    key: '/questioning',
    icon: QuestionFilled,
    label: t('sidebar.questioning'),
  },
  {
    key: '/users',
    icon: User,
    label: t('sidebar.users'),
  },
  {
    key: '/strategy',
    icon: Setting,
    label: t('sidebar.strategy'),
  },
])

const currentLabel = computed(() => {
  const item = menuItems.value.find(item => item.key === route.path)
  return item?.label || 'AIDP Manager'
})

const handleMenuClick = (key: string) => {
  router.push(key)
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      t('common.confirmAction'),
      'Warning',
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      }
    )
    authStore.clearAuth()
    router.push('/login')
  } catch {
    // User cancelled
  }
}
</script>

<template>
  <el-container class="layout-container">
    <el-aside
      :width="collapsed ? '64px' : '200px'"
      class="layout-sider"
    >
      <div class="logo">
        <img :src="logoImage" alt="AIDP Manager Logo" class="logo-image" />
        <h1 v-show="!collapsed">{{ t('layout.header.title') }}</h1>
      </div>
      <el-menu
        :default-active="route.path"
        :collapse="collapsed"
        @select="(key) => handleMenuClick(key as string)"
        class="layout-menu"
      >
        <el-menu-item
          v-for="item in menuItems"
          :key="item.key"
          :index="item.key"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.label }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-content">
          <h2>{{ currentLabel }}</h2>
          <div class="header-actions">
            <LanguageSwitcher />
            <el-dropdown trigger="click" @command="handleLogout">
              <div class="user-info">
                <el-avatar :icon="User" style="background-color: #6366F1; margin-right: 8px" />
                <span>{{ authStore.username }}</span>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :icon="SwitchButton">
                    {{ t('sidebar.logout') }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>

      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout-container {
  min-height: 100vh;
}

.layout-sider {
  background: #F3F4F6;
  border-right: 1px solid #E5E7EB;
  transition: width 0.2s;
}

.logo {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 12px;
  border-bottom: 1px solid #E5E7EB;
}

.logo-image {
  width: 32px;
  height: 32px;
}

.logo h1 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
}

.layout-menu {
  background: #F3F4F6;
  border-right: none;
}

.layout-menu:not(.el-menu--collapse) {
  width: 200px;
}

.layout-header {
  background: #FFFFFF;
  border-bottom: 1px solid #E5E7EB;
  padding: 0 24px;
  display: flex;
  align-items: center;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-content h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: #F3F4F6;
}

.layout-main {
  background: #F9FAFB;
  padding: 24px;
  min-height: calc(100vh - 60px);
}
</style>
