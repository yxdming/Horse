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
  SwitchButton,
  ArrowLeft,
  ArrowRight
} from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import LanguageSwitcher from './LanguageSwitcher.vue'
import logoImage from '../assets/images/logo.png'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const collapsed = ref(false)

const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

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
      <div class="sider-content">
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
      </div>

      <!-- 折叠按钮 -->
      <div class="collapse-trigger" @click="toggleCollapse">
        <el-icon>
          <ArrowLeft v-if="!collapsed" />
          <ArrowRight v-else />
        </el-icon>
      </div>
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
        <!-- 使用keep-alive缓存组件，提升路由切换性能 -->
        <router-view v-slot="{ Component, route }">
          <keep-alive :include="['Dashboard', 'Knowledge', 'Memory', 'Questioning', 'Users']">
            <component :is="Component" :key="route.path" />
          </keep-alive>
        </router-view>
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
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.sider-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.logo {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 60px;
  gap: 12px;
  border-bottom: 1px solid #E5E7EB;
  box-sizing: border-box;
}

.logo-image {
  width: 32px;
  height: 32px;
  object-fit: contain;
  flex-shrink: 0;
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

/* 菜单项默认状态 */
.layout-menu .el-menu-item {
  color: #4B5563;
}

.layout-menu .el-menu-item .el-icon {
  color: #6B7280;
}

/* 菜单项悬停状态 */
.layout-menu .el-menu-item:hover {
  background-color: #E5E7EB;
  color: #111827;
}

.layout-menu .el-menu-item:hover .el-icon {
  color: #111827;
}

/* 菜单项选中状态 */
.layout-menu .el-menu-item.is-active {
  background-color: #EEF2FF;
  color: #6366F1;
}

.layout-menu .el-menu-item.is-active .el-icon {
  color: #6366F1;
}

/* 折叠按钮 */
.collapse-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  margin: 8px 0;
  background-color: #E5E7EB;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #4B5563;
  flex-shrink: 0;
}

.collapse-trigger:hover {
  background-color: #D1D5DB;
  color: #111827;
}

.layout-header {
  background: #FFFFFF;
  border-bottom: 1px solid #E5E7EB;
  padding: 0 24px;
  display: flex;
  align-items: center;
  height: 60px;
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
  height: calc(100vh - 60px);
  overflow-y: auto;
}
</style>
