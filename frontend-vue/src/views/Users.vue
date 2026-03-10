<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Refresh, User as UserIcon, Search } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import type { User, UserCreate, UserUpdate } from '../types'
import { userApi } from '../services/api'

const { t } = useI18n()

// State
const loading = ref(false)
const users = ref<User[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')
const roleFilter = ref<string>()
const statusFilter = ref<string>()

const modalVisible = ref(false)
const editingUser = ref<User | null>(null)
const formData = ref({
  username: '',
  email: '',
  role: 'user' as 'admin' | 'user' | 'readonly',
  status: 'active' as 'active' | 'inactive'
})

// Fetch users
const fetchUsers = async () => {
  try {
    loading.value = true
    const response = await userApi.getUsers({
      skip: (page.value - 1) * pageSize.value,
      limit: pageSize.value,
      search: searchQuery.value || undefined,
      role: roleFilter.value,
      status: statusFilter.value,
    })
    users.value = response.users || []
    total.value = response.total || 0
  } catch (error) {
    ElMessage.error(t('users.fetchFailed'))
  } finally {
    loading.value = false
  }
}

// Watch for changes
watch([page, pageSize, searchQuery, roleFilter, statusFilter], () => {
  fetchUsers()
})

// Handle add
const handleAdd = () => {
  editingUser.value = null
  formData.value = {
    username: '',
    email: '',
    role: 'user',
    status: 'active'
  }
  modalVisible.value = true
}

// Handle edit
const handleEdit = (record: User) => {
  editingUser.value = record
  formData.value = {
    username: record.username,
    email: record.email,
    role: record.role,
    status: record.status
  }
  modalVisible.value = true
}

// Handle delete
const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      t('users.deleteConfirm'),
      'Warning',
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      }
    )
    await userApi.deleteUser(id)
    ElMessage.success(t('users.deleteSuccess'))
    fetchUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('users.deleteFailed'))
    }
  }
}

// Handle submit
const handleSubmit = async () => {
  try {
    if (editingUser.value) {
      const updateData: UserUpdate = {
        username: formData.value.username,
        email: formData.value.email,
        role: formData.value.role,
        status: formData.value.status,
      }
      await userApi.updateUser(editingUser.value.id, updateData)
      ElMessage.success(t('users.updateSuccess'))
    } else {
      const createData: UserCreate = {
        username: formData.value.username,
        email: formData.value.email,
        role: formData.value.role,
      }
      await userApi.createUser(createData)
      ElMessage.success(t('users.createSuccess'))

      // Clear filters and reset to first page
      searchQuery.value = ''
      roleFilter.value = undefined
      statusFilter.value = undefined
      page.value = 1
    }

    modalVisible.value = false

    // Refresh data
    setTimeout(() => {
      fetchUsers()
    }, 100)
  } catch (error) {
    ElMessage.error(editingUser.value ? t('users.updateFailed') : t('users.createFailed'))
  }
}

// Helper functions
const getRoleType = (role: string) => {
  switch (role) {
    case 'admin':
      return 'danger'
    case 'user':
      return 'success'
    case 'readonly':
      return 'info'
    default:
      return 'info'
  }
}

const getRoleText = (role: string) => {
  switch (role) {
    case 'admin':
      return t('users.roleAdmin')
    case 'user':
      return t('users.roleUser')
    case 'readonly':
      return t('users.roleReadonly')
    default:
      return role
  }
}

const getStatusType = (status: string) => {
  return status === 'active' ? 'success' : 'info'
}

const getStatusText = (status: string) => {
  return status === 'active' ? t('users.statusActive') : t('users.statusInactive')
}

const formatDate = (date: string) => {
  return date ? new Date(date).toLocaleString('zh-CN') : '-'
}

// Statistics
const adminCount = computed(() => users.value.filter((u) => u.role === 'admin').length)
const activeUserCount = computed(() => users.value.filter((u) => u.status === 'active').length)
const regularUserCount = computed(() => users.value.filter((u) => u.role === 'user').length)

// Load data on mount
onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="page-container">
    <!-- Statistics Cards -->
    <el-card class="stats-card mb-16">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-statistic :title="t('users.statsTotal')" :value="total">
            <template #prefix>
              <el-icon :size="20"><UserIcon /></el-icon>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic :title="t('users.statsActive')" :value="activeUserCount">
            <template #suffix>/ {{ total }}</template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic :title="t('users.statsAdmin')" :value="adminCount" />
        </el-col>
        <el-col :span="6">
          <el-statistic :title="t('users.statsUser')" :value="regularUserCount" />
        </el-col>
      </el-row>
    </el-card>

    <!-- User List Card -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ t('users.title') }}</span>
          <div class="header-actions">
            <el-button :icon="Refresh" @click="fetchUsers">
              {{ t('common.refresh') }}
            </el-button>
            <el-button type="primary" :icon="Plus" @click="handleAdd">
              {{ t('users.addButton') }}
            </el-button>
          </div>
        </div>
      </template>

      <!-- Filters -->
      <div class="filters mb-16">
        <el-input
          v-model="searchQuery"
          :placeholder="t('users.searchPlaceholder')"
          clearable
          style="width: 300px; margin-right: 12px"
          @keyup.enter="fetchUsers"
        >
          <template #append>
            <el-button :icon="Search" @click="fetchUsers" />
          </template>
        </el-input>

        <el-select
          v-model="roleFilter"
          :placeholder="t('users.roleFilter')"
          clearable
          style="width: 120px; margin-right: 12px"
          @change="fetchUsers"
        >
          <el-option value="admin" :label="t('users.roleAdmin')" />
          <el-option value="user" :label="t('users.roleUser')" />
          <el-option value="readonly" :label="t('users.roleReadonly')" />
        </el-select>

        <el-select
          v-model="statusFilter"
          :placeholder="t('users.statusFilter')"
          clearable
          style="width: 120px"
          @change="fetchUsers"
        >
          <el-option value="active" :label="t('users.statusActive')" />
          <el-option value="inactive" :label="t('users.statusInactive')" />
        </el-select>
      </div>

      <!-- Table -->
      <el-table
        v-loading="loading"
        :data="users"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="username" :label="t('users.username')" min-width="110" header-align="center" />
        <el-table-column prop="email" :label="t('users.email')" min-width="180" header-align="center" />
        <el-table-column :label="t('users.role')" width="90" header-align="center">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)">
              {{ getRoleText(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('users.status')" width="90" header-align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('users.createTime')" width="170" header-align="center">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('users.lastLogin')" width="170" header-align="center">
          <template #default="{ row }">
            {{ formatDate(row.last_login) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="150" fixed="right" header-align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :icon="Edit"
              link
              @click="handleEdit(row)"
            >
              {{ t('common.edit') }}
            </el-button>
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              link
              @click="handleDelete(row.id)"
            >
              {{ t('common.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        class="mt-24"
      />
    </el-card>

    <!-- Add/Edit Modal -->
    <el-dialog
      v-model="modalVisible"
      :title="editingUser ? t('users.editModalTitle') : t('users.addModalTitle')"
      width="500px"
    >
      <el-form :model="formData" label-width="100px">
        <el-form-item :label="t('users.usernameLabel')" required>
          <el-input
            v-model="formData.username"
            :placeholder="t('users.usernamePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('users.emailLabel')" required>
          <el-input
            v-model="formData.email"
            :placeholder="t('users.emailPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('users.roleLabel')" required>
          <el-select
            v-model="formData.role"
            :placeholder="t('users.rolePlaceholder')"
            style="width: 100%"
          >
            <el-option value="admin" :label="t('users.roleAdmin')" />
            <el-option value="user" :label="t('users.roleUser')" />
            <el-option value="readonly" :label="t('users.roleReadonly')" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="editingUser" :label="t('users.statusLabel')" required>
          <el-select
            v-model="formData.status"
            :placeholder="t('users.statusPlaceholder')"
            style="width: 100%"
          >
            <el-option value="active" :label="t('users.statusActive')" />
            <el-option value="inactive" :label="t('users.statusInactive')" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="modalVisible = false">
          {{ t('common.cancel') }}
        </el-button>
        <el-button type="primary" @click="handleSubmit">
          {{ t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.filters {
  display: flex;
  align-items: center;
}
</style>
