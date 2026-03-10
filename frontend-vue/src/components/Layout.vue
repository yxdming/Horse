<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElDropdown, ElDropdownMenu, ElDropdownItem, ElAvatar, ElMessageBox, ElBreadcrumb, ElBreadcrumbItem } from 'element-plus'
import { useI18n } from 'vue-i18n'
import type { Component } from 'vue'
import {
  Odometer,
  Document,
  Brush,
  QuestionFilled,
  User,
  Setting,
  SwitchButton,
  ArrowLeft,
  ArrowRight,
  HomeFilled
} from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import LanguageSwitcher from './LanguageSwitcher.vue'
import logoImage from '../assets/images/logo.png'

interface BreadcrumbItem {
  title?: string
  icon?: Component
  onClick?: () => void
  isLast?: boolean
}

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

// 生成面包屑导航
const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = []
  const pathSegments = route.path.split('/').filter(Boolean)
  const isLast = (index: number) => index === pathSegments.length - 1

  if (pathSegments.length === 0) {
    // 首页 - 只显示标题，不需要可点击
    items.push({
      title: t('sidebar.dashboard'),
      icon: HomeFilled
    })
  } else {
    // 首先添加Home图标（可点击返回首页）
    items.push({
      title: '',
      icon: HomeFilled,
      onClick: () => router.push('/')
    })

    // 构建路径面包屑
    let currentPath = ''
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const menuItem = menuItems.value.find(item => item.key === currentPath)

      if (menuItem) {
        items.push({
          title: menuItem.label,
          ...(isLast(index) ? {} : { onClick: () => router.push(currentPath) }),
          isLast: isLast(index)
        })
      }
    })
  }

  return items
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
          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              v-for="(item, index) in breadcrumbItems"
              :key="index"
              @click="item.onClick"
              :class="{ 'is-clickable': item.onClick, 'is-last': item.isLast }"
            >
              <template v-if="item.icon">
                <el-icon :size="14" style="margin-right: 4px">
                  <component :is="item.icon" />
                </el-icon>
              </template>
              <span v-if="item.title" :style="{ fontSize: '14px', color: item.isLast ? '#24292F' : '#57606A', fontWeight: item.isLast ? 500 : 400 }">{{ item.title }}</span>
            </el-breadcrumb-item>
          </el-breadcrumb>
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
  background: #FFFFFF;
  border-right: none;
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
  padding: 16px;
  height: 56px;
  gap: 12px;
  border-bottom: 1px solid #E5E7EB;
  box-sizing: border-box;
}

.logo-image {
  width: 28px;
  height: 28px;
  object-fit: contain;
  flex-shrink: 0;
}

.logo h1 {
  font-size: 16px;
  font-weight: 600;
  color: #24292F;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
}

.layout-menu {
  background: #FFFFFF;
  border-right: none;
  padding: 8px 0;
}

.layout-menu:not(.el-menu--collapse) {
  width: 200px;
}

/* 菜单项默认状态 */
.layout-menu .el-menu-item {
  color: #57606A;
  margin: 2px 8px;
  border-radius: 6px;
  height: 32px;
  line-height: 32px;
  font-weight: 400;
  font-size: 14px;
}

.layout-menu .el-menu-item .el-icon {
  color: #57606A;
}

/* 菜单项悬停状态 */
.layout-menu .el-menu-item:hover {
  background-color: #F6F8FA;
  color: #24292F;
}

.layout-menu .el-menu-item:hover .el-icon {
  color: #24292F;
}

/* 菜单项选中状态 */
.layout-menu .el-menu-item.is-active {
  background-color: #FFFFFF;
  color: #24292F;
  font-weight: 400;
}

.layout-menu .el-menu-item.is-active .el-icon {
  color: #24292F;
}

/* 折叠按钮 */
.collapse-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  margin: 8px;
  background-color: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  color: #57606A;
  flex-shrink: 0;
}

.collapse-trigger:hover {
  background-color: #F6F8FA;
  color: #24292F;
}

.layout-header {
  background: #FFFFFF;
  border-bottom: 1px solid #E5E7EB;
  padding: 0 24px;
  display: flex;
  align-items: center;
  height: 56px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* 面包屑导航 */
.header-content :deep(.el-breadcrumb) {
  margin: 0;
}

.header-content :deep(.el-breadcrumb__item) {
  font-size: 14px;
}

.header-content :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #24292F;
  font-weight: 500;
}

.header-content :deep(.el-breadcrumb__item .el-breadcrumb__inner) {
  color: #57606A;
  cursor: pointer;
  transition: color 0.15s ease;
}

.header-content :deep(.el-breadcrumb__item .el-breadcrumb__inner:hover) {
  color: #24292F;
}

.header-content :deep(.is-clickable) {
  cursor: pointer;
}

.header-content :deep(.is-last) {
  cursor: default;
}

.header-content h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #24292F;
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
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.15s ease;
  background-color: transparent;
  border: none;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #24292F;
}

.user-info:hover {
  background-color: #F6F8FA;
}

.layout-main {
  background: #F6F8FA;
  padding: 24px;
  min-height: calc(100vh - 56px);
  height: calc(100vh - 56px);
  overflow-y: auto;
}
</style>
