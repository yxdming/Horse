<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Edit,
  Delete,
  Search,
  Refresh,
  User,
  Document,
  Clock
} from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import type { Memory, MemoryCreate, MemoryUpdate, MemoryTemplate, TemplateCreate, MemoryUser, MemoryUserCreate } from '../types'
import { memoryApi } from '../services/api'

const { t } = useI18n()

const activeTab = ref('list')

// List State
const loading = ref(false)
const memories = ref<Memory[]>([])
const categories = ref<string[]>([])
const types = ref<string[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')
const selectedCategory = ref<string>()
const selectedType = ref<string>()
const minImportance = ref<number>()

const modalVisible = ref(false)
const editingMemory = ref<Memory | null>(null)
const formData = ref<MemoryCreate>({
  title: '',
  content: '',
  category: '',
  tags: [],
  importance: 3,
  memory_type: '长期记忆'
})
const tagInput = ref('')

// Template State
const templates = ref<MemoryTemplate[]>([])
const templateModalVisible = ref(false)
const editingTemplate = ref<MemoryTemplate | null>(null)
const templateFormData = ref<TemplateCreate>({
  name: '',
  description: '',
  category: '',
  memory_type: '长期记忆',
  default_importance: 3,
  tags: []
})
const templateTagInput = ref('')

// User Permission State
const memoryUsers = ref<MemoryUser[]>([])
const userModalVisible = ref(false)
const userFormData = ref<MemoryUserCreate>({
  username: '',
  role: 'viewer',
  permissions: []
})

// Fetch memories
const fetchMemories = async () => {
  try {
    loading.value = true
    const response = await memoryApi.getMemories({
      skip: (page.value - 1) * pageSize.value,
      limit: pageSize.value,
      category: selectedCategory.value,
      memory_type: selectedType.value,
      search: searchQuery.value || undefined,
      min_importance: minImportance.value,
    })
    memories.value = response.memories || []
    total.value = response.total || 0
  } catch (error) {
    ElMessage.error(t('memory.list.fetchFailed'))
  } finally {
    loading.value = false
  }
}

// Fetch categories and types
const fetchMetadata = async () => {
  try {
    const [catData, typeData] = await Promise.all([
      memoryApi.getCategories(),
      memoryApi.getTypes()
    ])

    // 处理 categories - 支持多种可能的响应格式
    console.log('Categories response:', catData)
    if (Array.isArray(catData)) {
      // 如果是数组，检查是否是嵌套数组
      if (catData.length > 0 && Array.isArray(catData[0])) {
        // 如果是嵌套数组，展开它
        categories.value = catData.flat()
      } else {
        // 普通字符串数组
        categories.value = catData
      }
    } else if (catData && typeof catData === 'object') {
      // 如果是对象，尝试获取 categories 属性
      if ('categories' in catData && Array.isArray(catData.categories)) {
        categories.value = catData.categories
      } else {
        // 对象的值可能是分类
        categories.value = Object.values(catData).filter(v => typeof v === 'string') as string[]
      }
    } else {
      categories.value = []
    }

    // 处理 types - 支持多种可能的响应格式
    console.log('Types response:', typeData)
    if (Array.isArray(typeData)) {
      if (typeData.length > 0 && Array.isArray(typeData[0])) {
        types.value = typeData.flat()
      } else {
        types.value = typeData
      }
    } else if (typeData && typeof typeData === 'object') {
      if ('types' in typeData && Array.isArray(typeData.types)) {
        types.value = typeData.types
      } else {
        types.value = Object.values(typeData).filter(v => typeof v === 'string') as string[]
      }
    } else {
      types.value = []
    }

    console.log('Processed categories:', categories.value)
    console.log('Processed types:', types.value)
  } catch (error) {
    console.error('Failed to fetch metadata:', error)
    categories.value = []
    types.value = []
  }
}

// Handle add
const handleAdd = () => {
  editingMemory.value = null
  formData.value = {
    title: '',
    content: '',
    category: '',
    tags: [],
    importance: 3,
    memory_type: '长期记忆'
  }
  modalVisible.value = true
}

// Handle edit
const handleEdit = (record: Memory) => {
  editingMemory.value = record
  formData.value = {
    title: record.title,
    content: record.content,
    category: record.category,
    tags: [...(record.tags || [])],
    importance: record.importance,
    memory_type: record.memory_type
  }
  modalVisible.value = true
}

// Handle delete
const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      t('memory.list.deleteConfirm'),
      'Warning',
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      }
    )
    await memoryApi.deleteMemory(id)
    ElMessage.success(t('memory.list.deleteSuccess'))
    fetchMemories()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('memory.list.deleteFailed'))
    }
  }
}

// Handle submit
const handleSubmit = async () => {
  try {
    if (editingMemory.value) {
      const updateData: MemoryUpdate = {
        title: formData.value.title,
        content: formData.value.content,
        category: formData.value.category,
        tags: formData.value.tags,
        importance: formData.value.importance,
        memory_type: formData.value.memory_type,
      }
      await memoryApi.updateMemory(editingMemory.value.id, updateData)
      ElMessage.success(t('memory.list.updateSuccess'))
    } else {
      await memoryApi.createMemory(formData.value)
      ElMessage.success(t('memory.list.createSuccess'))
    }
    modalVisible.value = false
    fetchMemories()
    fetchMetadata()
  } catch (error) {
    ElMessage.error(editingMemory.value ? t('memory.list.updateFailed') : t('memory.list.createFailed'))
  }
}

// Handle tags
const handleTagInput = () => {
  if (tagInput.value && formData.value.tags && !formData.value.tags.includes(tagInput.value)) {
    formData.value.tags.push(tagInput.value)
    tagInput.value = ''
  }
}

const removeTag = (tag: string) => {
  if (formData.value.tags) {
    const index = formData.value.tags.indexOf(tag)
    if (index > -1) {
      formData.value.tags.splice(index, 1)
    }
  }
}

// ==================== Template Management ====================
// Fetch templates
const fetchTemplates = async () => {
  try {
    const response = await memoryApi.getTemplates()
    templates.value = response.templates || []
  } catch (error) {
    ElMessage.error(t('memory.templates.fetchFailed'))
  }
}

// Handle add template
const handleAddTemplate = () => {
  editingTemplate.value = null
  templateFormData.value = {
    name: '',
    description: '',
    category: '',
    memory_type: '长期记忆',
    default_importance: 3,
    tags: []
  }
  templateTagInput.value = ''
  templateModalVisible.value = true
}

// Handle edit template
const handleEditTemplate = (template: MemoryTemplate) => {
  editingTemplate.value = template
  templateFormData.value = {
    name: template.name,
    description: template.description,
    category: template.category,
    memory_type: template.memory_type,
    default_importance: template.default_importance,
    tags: [...(template.tags || [])]
  }
  templateTagInput.value = ''
  templateModalVisible.value = true
}

// Handle delete template
const handleDeleteTemplate = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      t('memory.templates.deleteConfirm'),
      'Warning',
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      }
    )
    await memoryApi.deleteTemplate(id)
    ElMessage.success(t('memory.templates.deleteSuccess'))
    fetchTemplates()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('memory.templates.deleteFailed'))
    }
  }
}

// Handle submit template
const handleSubmitTemplate = async () => {
  try {
    if (editingTemplate.value) {
      await memoryApi.updateTemplate(editingTemplate.value.id, templateFormData.value)
      ElMessage.success(t('memory.templates.updateSuccess'))
    } else {
      await memoryApi.createTemplate(templateFormData.value)
      ElMessage.success(t('memory.templates.createSuccess'))
    }
    templateModalVisible.value = false
    fetchTemplates()
  } catch (error) {
    ElMessage.error(editingTemplate.value ? t('memory.templates.updateFailed') : t('memory.templates.createFailed'))
  }
}

// Handle use template
const handleUseTemplate = (template: MemoryTemplate) => {
  activeTab.value = 'list'
  formData.value = {
    title: '',
    content: '',
    category: template.category,
    tags: [...(template.tags || [])],
    importance: template.default_importance,
    memory_type: template.memory_type
  }
  modalVisible.value = true
  ElMessage.info(t('memory.templates.applied', { name: template.name }))
}

// Handle template tags
const handleTemplateTagInput = () => {
  if (templateTagInput.value && !templateFormData.value.tags.includes(templateTagInput.value)) {
    templateFormData.value.tags.push(templateTagInput.value)
    templateTagInput.value = ''
  }
}

const removeTemplateTag = (tag: string) => {
  const index = templateFormData.value.tags.indexOf(tag)
  if (index > -1) {
    templateFormData.value.tags.splice(index, 1)
  }
}

// ==================== User Permission Management ====================
// Fetch memory users
const fetchMemoryUsers = async () => {
  try {
    const response = await memoryApi.getMemoryUsers()
    memoryUsers.value = response.users || []
  } catch (error) {
    ElMessage.error(t('memory.permissions.fetchFailed'))
  }
}

// Handle add user
const handleAddUser = () => {
  userFormData.value = {
    username: '',
    role: 'viewer',
    permissions: []
  }
  userModalVisible.value = true
}

// Handle delete user
const handleDeleteUser = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      t('memory.permissions.removeConfirm'),
      'Warning',
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      }
    )
    await memoryApi.deleteMemoryUser(id)
    ElMessage.success(t('memory.permissions.removeSuccess'))
    fetchMemoryUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('memory.permissions.removeFailed'))
    }
  }
}

// Handle submit user
const handleSubmitUser = async () => {
  try {
    await memoryApi.createMemoryUser(userFormData.value)
    ElMessage.success(t('memory.permissions.addSuccess'))
    userModalVisible.value = false
    fetchMemoryUsers()
  } catch (error) {
    ElMessage.error(t('memory.permissions.addFailed'))
  }
}

// Helper functions
const getTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    '长期记忆': t('memory.list.typeLongTerm'),
    '短期记忆': t('memory.list.typeShortTerm'),
    '工作记忆': t('memory.list.typeWorking'),
  }
  return typeMap[type] || type
}

// Watch for changes
watch([page, pageSize, searchQuery, selectedCategory, selectedType, minImportance], () => {
  if (activeTab.value === 'list') {
    fetchMemories()
  }
})

watch(activeTab, (newTab) => {
  if (newTab === 'list') {
    fetchMemories()
    fetchMetadata()
  } else if (newTab === 'templates') {
    fetchTemplates()
  } else if (newTab === 'permissions') {
    fetchMemoryUsers()
  }
})

onMounted(() => {
  if (activeTab.value === 'list') {
    fetchMemories()
    fetchMetadata()
  }
})
</script>

<template>
  <div class="page-container">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- Memory List Tab -->
      <el-tab-pane :label="t('memory.tabs.list')" name="list">
        <!-- Statistics -->
        <el-row :gutter="16" class="mb-16">
          <el-col :span="8">
            <el-card>
              <el-statistic :title="t('memory.list.statsTotal')" :value="total" />
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card>
              <el-statistic :title="t('memory.list.statsCategories')" :value="categories.length" />
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card>
              <el-statistic :title="t('memory.list.statsTypes')" :value="types.length" />
            </el-card>
          </el-col>
        </el-row>

        <!-- Toolbar -->
        <div class="table-header">
          <div class="header-filters">
            <el-input
              v-model="searchQuery"
              :placeholder="t('memory.list.searchPlaceholder')"
              clearable
              style="width: 300px; margin-right: 12px"
              @keyup.enter="fetchMemories"
            >
              <template #append>
                <el-button :icon="Search" @click="fetchMemories" />
              </template>
            </el-input>

            <el-select
              v-model="selectedType"
              :placeholder="t('memory.list.typePlaceholder')"
              clearable
              style="width: 120px; margin-right: 12px"
              @change="fetchMemories"
            >
              <el-option :label="t('memory.list.typeLongTerm')" value="长期记忆" />
              <el-option :label="t('memory.list.typeShortTerm')" value="短期记忆" />
              <el-option :label="t('memory.list.typeWorking')" value="工作记忆" />
            </el-select>

            <el-select
              v-model="selectedCategory"
              :placeholder="t('memory.list.categoryPlaceholder')"
              clearable
              style="width: 120px; margin-right: 12px"
              @change="fetchMemories"
            >
              <el-option
                v-for="cat in categories"
                :key="cat"
                :label="cat"
                :value="cat"
              />
            </el-select>

            <el-select
              v-model="minImportance"
              :placeholder="t('memory.list.importancePlaceholder')"
              clearable
              style="width: 120px"
              @change="fetchMemories"
            >
              <el-option :label="'1+'" :value="1" />
              <el-option :label="'2+'" :value="2" />
              <el-option :label="'3+'" :value="3" />
              <el-option :label="'4+'" :value="4" />
              <el-option :label="'5'" :value="5" />
            </el-select>
          </div>

          <div class="header-actions">
            <el-button :icon="Refresh" @click="fetchMemories">
              {{ t('common.refresh') }}
            </el-button>
            <el-button type="primary" :icon="Plus" @click="handleAdd">
              {{ t('memory.list.addButton') }}
            </el-button>
          </div>
        </div>

        <!-- Table -->
        <el-table
          v-loading="loading"
          :data="memories"
          stripe
          style="width: 100%"
        >
          <el-table-column prop="title" :label="t('memory.list.colTitle')" min-width="180" header-align="center" show-overflow-tooltip />
          <el-table-column prop="category" :label="t('memory.list.category')" min-width="100" header-align="center" />
          <el-table-column :label="t('memory.list.colType')" min-width="100" header-align="center">
            <template #default="{ row }">
              {{ getTypeText(row.memory_type) }}
            </template>
          </el-table-column>
          <el-table-column :label="t('memory.list.colImportance')" width="110" header-align="center">
            <template #default="{ row }">
              <el-rate v-model="row.importance" disabled />
            </template>
          </el-table-column>
          <el-table-column :label="t('memory.list.colAccessCount')" width="100" header-align="center">
            <template #default="{ row }">
              {{ row.access_count }}
            </template>
          </el-table-column>
          <el-table-column :label="t('memory.list.colCreateTime')" width="170" header-align="center">
            <template #default="{ row }">
              {{ new Date(row.created_at).toLocaleString('zh-CN') }}
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
      </el-tab-pane>

      <!-- Templates Tab -->
      <el-tab-pane name="templates">
        <template #label>
          <el-icon><Document /></el-icon>
          <span>{{ t('memory.tabs.templates') }}</span>
        </template>

        <el-alert
          :title="t('memory.templates.sectionTitle')"
          type="info"
          :description="t('memory.templates.sectionDescription')"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
        />

        <!-- Toolbar -->
        <div class="table-header">
          <div class="header-filters"></div>
          <div class="header-actions">
            <el-button type="primary" :icon="Plus" @click="handleAddTemplate">
              {{ t('memory.templates.addButton') }}
            </el-button>
          </div>
        </div>

        <!-- Table -->
        <el-table
          :data="templates"
          stripe
          style="width: 100%"
        >
          <el-table-column
            prop="name"
            :label="t('memory.templates.name')"
            min-width="160"
            header-align="center"
            show-overflow-tooltip
          />
          <el-table-column
            prop="description"
            :label="t('memory.templates.colDescription')"
            min-width="200"
            show-overflow-tooltip
            header-align="center"
          />
          <el-table-column prop="category" :label="t('memory.list.colCategory')" min-width="100" header-align="center">
            <template #default="{ row }">
              <el-tag type="success">{{ row.category }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('memory.list.colType')" min-width="100" header-align="center">
            <template #default="{ row }">
              <el-tag type="info">{{ getTypeText(row.memory_type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('memory.templates.defaultImportance')" width="110" header-align="center">
            <template #default="{ row }">
              <el-rate v-model="row.default_importance" disabled />
            </template>
          </el-table-column>
          <el-table-column :label="t('common.actions')" width="180" fixed="right" header-align="center">
            <template #default="{ row }">
              <el-button
                type="success"
                size="small"
                :icon="Document"
                link
                @click="handleUseTemplate(row)"
              >
                {{ t('memory.templates.use') }}
              </el-button>
              <el-button
                type="primary"
                size="small"
                :icon="Edit"
                link
                @click="handleEditTemplate(row)"
              >
                {{ t('common.edit') }}
              </el-button>
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                link
                @click="handleDeleteTemplate(row.id)"
              >
                {{ t('common.delete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Permissions Tab -->
      <el-tab-pane name="permissions">
        <template #label>
          <el-icon><User /></el-icon>
          <span>{{ t('memory.tabs.permissions') }}</span>
        </template>

        <el-alert
          :title="t('memory.permissions.description')"
          type="info"
          :description="t('memory.permissions.descriptionText')"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
        />

        <!-- Toolbar -->
        <div class="table-header">
          <div class="header-filters"></div>
          <div class="header-actions">
            <el-button type="primary" :icon="Plus" @click="handleAddUser">
              {{ t('memory.permissions.addButton') }}
            </el-button>
          </div>
        </div>

        <!-- Table -->
        <el-table
          :data="memoryUsers"
          stripe
          style="width: 100%"
        >
          <el-table-column
            prop="username"
            :label="t('memory.permissions.colUsername')"
            min-width="120"
            header-align="center"
          />
          <el-table-column prop="role" :label="t('memory.permissions.colRole')" width="100" header-align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.role === 'admin' ? 'danger' : row.role === 'editor' ? 'warning' : 'info'"
                size="small"
              >
                {{ row.role }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('memory.permissions.colPermissions')" min-width="250" header-align="center">
            <template #default="{ row }">
              <el-tag
                v-for="p in row.permissions"
                :key="p"
                type="success"
                size="small"
                style="margin-right: 4px; margin-bottom: 4px"
              >
                {{ p }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="memoryCount"
            :label="t('memory.permissions.colMemoryCount')"
            width="100"
            header-align="center"
          />
          <el-table-column :label="t('memory.permissions.colLastAccess')" width="170" header-align="center">
            <template #default="{ row }">
              <div style="display: flex; align-items: center; gap: 4px">
                <el-icon><Clock /></el-icon>
                <span>{{ row.lastAccess }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="t('common.actions')" width="120" fixed="right" header-align="center">
            <template #default="{ row }">
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                link
                @click="handleDeleteUser(row.id)"
              >
                {{ t('memory.permissions.remove') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- Add/Edit Modal -->
    <el-dialog
      v-model="modalVisible"
      :title="editingMemory ? t('memory.list.editModalTitle') : t('memory.list.addModalTitle')"
      width="600px"
    >
      <el-form :model="formData" label-width="120px">
        <el-form-item :label="t('memory.list.titleLabel')" required>
          <el-input
            v-model="formData.title"
            :placeholder="t('memory.list.titlePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('memory.list.contentLabel')" required>
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="6"
            :placeholder="t('memory.list.contentPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('memory.list.categoryLabel')">
          <el-select
            v-model="formData.category"
            :placeholder="t('memory.list.categorySelectPlaceholder')"
            filterable
            allow-create
            style="width: 100%"
          >
            <el-option
              v-for="cat in categories"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>
          <div class="form-help">{{ t('memory.list.categoryHelp') }}</div>
        </el-form-item>

        <el-form-item :label="t('memory.list.tagsLabel')">
          <div class="tags-input">
            <el-tag
              v-for="tag in formData.tags"
              :key="tag"
              closable
              @close="removeTag(tag)"
              style="margin-right: 8px; margin-bottom: 8px"
            >
              {{ tag }}
            </el-tag>
            <el-input
              v-model="tagInput"
              :placeholder="t('memory.list.tagsPlaceholder')"
              style="width: 200px"
              @keyup.enter="handleTagInput"
            />
          </div>
        </el-form-item>

        <el-form-item :label="t('memory.list.typeLabel')" required>
          <el-select
            v-model="formData.memory_type"
            :placeholder="t('memory.list.typeLabel')"
            style="width: 100%"
          >
            <el-option :label="t('memory.list.typeLongTerm')" value="长期记忆" />
            <el-option :label="t('memory.list.typeShortTerm')" value="短期记忆" />
            <el-option :label="t('memory.list.typeWorking')" value="工作记忆" />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('memory.list.importanceLabel')" required>
          <el-rate v-model="formData.importance" />
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

    <!-- Template Add/Edit Modal -->
    <el-dialog
      v-model="templateModalVisible"
      :title="editingTemplate ? t('memory.templates.editModalTitle') : t('memory.templates.addModalTitle')"
      width="600px"
    >
      <el-form :model="templateFormData" label-width="140px">
        <el-form-item :label="t('memory.templates.nameLabel')" required>
          <el-input
            v-model="templateFormData.name"
            :placeholder="t('memory.templates.namePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('memory.templates.descriptionLabel')" required>
          <el-input
            v-model="templateFormData.description"
            type="textarea"
            :rows="3"
            :placeholder="t('memory.templates.descriptionPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('memory.list.categoryLabel')" required>
          <el-select
            v-model="templateFormData.category"
            :placeholder="t('memory.list.categorySelectPlaceholder')"
            filterable
            allow-create
            style="width: 100%"
          >
            <el-option
              v-for="cat in categories"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('memory.list.typeLabel')" required>
          <el-select
            v-model="templateFormData.memory_type"
            :placeholder="t('memory.list.typeLabel')"
            style="width: 100%"
          >
            <el-option :label="t('memory.list.typeLongTerm')" value="长期记忆" />
            <el-option :label="t('memory.list.typeShortTerm')" value="短期记忆" />
            <el-option :label="t('memory.list.typeWorking')" value="工作记忆" />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('memory.list.importanceLabel')" required>
          <el-rate v-model="templateFormData.default_importance" />
        </el-form-item>

        <el-form-item :label="t('memory.list.tagsLabel')">
          <div class="tags-input">
            <el-tag
              v-for="tag in templateFormData.tags"
              :key="tag"
              closable
              @close="removeTemplateTag(tag)"
              style="margin-right: 8px; margin-bottom: 8px"
            >
              {{ tag }}
            </el-tag>
            <el-input
              v-model="templateTagInput"
              :placeholder="t('memory.list.tagsPlaceholder')"
              style="width: 200px"
              @keyup.enter="handleTemplateTagInput"
            />
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="templateModalVisible = false">
          {{ t('common.cancel') }}
        </el-button>
        <el-button type="primary" @click="handleSubmitTemplate">
          {{ t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- User Permission Modal -->
    <el-dialog
      v-model="userModalVisible"
      :title="t('memory.permissions.modalTitle')"
      width="500px"
    >
      <el-form :model="userFormData" label-width="100px">
        <el-form-item :label="t('memory.permissions.usernameLabel')" required>
          <el-input
            v-model="userFormData.username"
            :placeholder="t('memory.permissions.usernamePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('memory.permissions.roleLabel')" required>
          <el-select
            v-model="userFormData.role"
            :placeholder="t('memory.permissions.rolePlaceholder')"
            style="width: 100%"
          >
            <el-option value="admin" :label="t('memory.permissions.roleAdmin')" />
            <el-option value="editor" :label="t('memory.permissions.roleEditor')" />
            <el-option value="viewer" :label="t('memory.permissions.roleViewer')" />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('memory.permissions.permissionsLabel')" required>
          <el-select
            v-model="userFormData.permissions"
            :placeholder="t('memory.permissions.permissionsPlaceholder')"
            multiple
            style="width: 100%"
          >
            <el-option value="read" :label="t('memory.permissions.permRead')" />
            <el-option value="write" :label="t('memory.permissions.permWrite')" />
            <el-option value="delete" :label="t('memory.permissions.permDelete')" />
            <el-option value="admin" :label="t('memory.permissions.permAdmin')" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="userModalVisible = false">
          {{ t('common.cancel') }}
        </el-button>
        <el-button type="primary" @click="handleSubmitUser">
          {{ t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.form-help {
  font-size: 12px;
  color: #6B7280;
  margin-top: 4px;
}

.tags-input {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
</style>
