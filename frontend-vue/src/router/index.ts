import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('../components/Layout.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '数据总览' }
      },
      {
        path: 'knowledge',
        name: 'Knowledge',
        component: () => import('../views/Knowledge.vue'),
        meta: { title: '知识库管理' }
      },
      {
        path: 'memory',
        name: 'Memory',
        component: () => import('../views/Memory.vue'),
        meta: { title: '记忆库管理' }
      },
      {
        path: 'questioning',
        name: 'Questioning',
        component: () => import('../views/Questioning.vue'),
        meta: { title: '问数管理' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/Users.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'strategy',
        name: 'Strategy',
        component: () => import('../views/Strategy.vue'),
        meta: { title: '问答策略' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Restore auth state from localStorage to ensure sync
  authStore.restoreAuth()

  const isAuthenticated = authStore.isAuthenticated.value
  const token = localStorage.getItem('token')

  console.log('路由守卫 - 目标路径:', to.path)
  console.log('路由守卫 - 来源路径:', from.path)
  console.log('路由守卫 - Store认证状态:', isAuthenticated)
  console.log('路由守卫 - Token存在:', !!token)
  console.log('路由守卫 - Store token值:', authStore.token)

  // If not authenticated and trying to access protected route
  // Check both store state and localStorage as fallback
  if (to.meta.requiresAuth !== false && !isAuthenticated && !token) {
    console.log('路由守卫 - 未认证，重定向到登录页')
    next('/login')
    return
  }

  console.log('路由守卫 - 允许访问:', to.path)
  next()
})

export default router
