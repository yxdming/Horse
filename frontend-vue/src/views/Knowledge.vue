<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Edit,
  Delete,
  Search,
  Refresh,
  InfoFilled,
  Link
} from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import type { KnowledgeDocument, SearchResult, DocumentCreate, DocumentUpdate, DirectoryMapping, MappingCreate } from '../types'
import { knowledgeApi } from '../services/api'

const { t } = useI18n()

const activeTab = ref('files')

// Files Management State
const loading = ref(false)
const documents = ref<KnowledgeDocument[]>([])
const categories = ref<string[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')
const selectedCategory = ref<string>()

const modalVisible = ref(false)
const editingDoc = ref<KnowledgeDocument | null>(null)
const formData = ref<DocumentCreate>({
  title: '',
  content: '',
  category: '',
  tags: []
})
const tagInput = ref('')

// Search Modal State
const searchModalVisible = ref(false)
const searchQueryText = ref('')
const searchResults = ref<SearchResult[]>([])
const searchLoading = ref(false)

// Directory Mapping State
const mappings = ref<DirectoryMapping[]>([])
const mappingModalVisible = ref(false)
const mappingFormData = ref<MappingCreate>({
  directoryName: '',
  directoryPath: '',
  fileSystem: 'NFS'
})
const mappingDetailVisible = ref(false)
const selectedMapping = ref<DirectoryMapping | null>(null)

// Fetch documents
const fetchDocuments = async () => {
  try {
    loading.value = true
    const response = await knowledgeApi.getDocuments({
      skip: (page.value - 1) * pageSize.value,
      limit: pageSize.value,
      category: selectedCategory.value,
      search: searchQuery.value || undefined,
    })
    documents.value = response.documents || []
    total.value = response.total || 0
  } catch (error) {
    ElMessage.error(t('knowledge.files.fetchFailed'))
  } finally {
    loading.value = false
  }
}

// Fetch categories
const fetchCategories = async () => {
  try {
    const data = await knowledgeApi.getCategories()
    categories.value = data || []
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }
}

// Handle add
const handleAdd = () => {
  editingDoc.value = null
  formData.value = {
    title: '',
    content: '',
    category: '',
    tags: []
  }
  modalVisible.value = true
}

// Handle edit
const handleEdit = (record: KnowledgeDocument) => {
  editingDoc.value = record
  formData.value = {
    title: record.title,
    content: record.content,
    category: record.category,
    tags: [...(record.tags || [])]
  }
  modalVisible.value = true
}

// Handle delete
const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      t('knowledge.files.deleteConfirm'),
      'Warning',
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      }
    )
    await knowledgeApi.deleteDocument(id)
    ElMessage.success(t('knowledge.files.deleteSuccess'))
    fetchDocuments()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('knowledge.files.deleteFailed'))
    }
  }
}

// Handle submit
const handleSubmit = async () => {
  try {
    if (editingDoc.value) {
      const updateData: DocumentUpdate = {
        title: formData.value.title,
        content: formData.value.content,
        category: formData.value.category,
        tags: formData.value.tags,
      }
      await knowledgeApi.updateDocument(editingDoc.value.id, updateData)
      ElMessage.success(t('knowledge.files.updateSuccess'))
    } else {
      await knowledgeApi.createDocument(formData.value)
      ElMessage.success(t('knowledge.files.createSuccess'))
    }
    modalVisible.value = false
    fetchDocuments()
    fetchCategories()
  } catch (error) {
    ElMessage.error(editingDoc.value ? t('knowledge.files.updateFailed') : t('knowledge.files.createFailed'))
  }
}

// Handle search
const handleSemanticSearch = async () => {
  if (!searchQueryText.value.trim()) {
    ElMessage.warning(t('knowledge.files.searchWarning'))
    return
  }
  try {
    searchLoading.value = true
    const results = await knowledgeApi.semanticSearch(searchQueryText.value, 5, selectedCategory.value)
    searchResults.value = results || []
  } catch (error) {
    ElMessage.error(t('knowledge.files.searchFailed'))
  } finally {
    searchLoading.value = false
  }
}

// Handle tags
const handleTagInput = () => {
  if (tagInput.value && !formData.value.tags.includes(tagInput.value)) {
    formData.value.tags.push(tagInput.value)
    tagInput.value = ''
  }
}

const removeTag = (tag: string) => {
  const index = formData.value.tags.indexOf(tag)
  if (index > -1) {
    formData.value.tags.splice(index, 1)
  }
}

// ==================== Directory Mapping Methods ====================
// Fetch mappings
const fetchMappings = async () => {
  try {
    const response = await knowledgeApi.getMappings()
    mappings.value = response.mappings || []
  } catch (error) {
    ElMessage.error(t('knowledge.mappings.fetchFailed'))
  }
}

// Handle add mapping
const handleAddMapping = () => {
  mappingFormData.value = {
    directoryName: '',
    directoryPath: '',
    fileSystem: 'NFS'
  }
  mappingModalVisible.value = true
}

// Handle submit mapping
const handleSubmitMapping = async () => {
  try {
    await knowledgeApi.createMapping(mappingFormData.value)
    ElMessage.success(t('knowledge.mappings.addSuccess'))
    mappingModalVisible.value = false
    fetchMappings()
  } catch (error) {
    ElMessage.error(t('knowledge.mappings.addFailed'))
  }
}

// Handle delete mapping
const handleDeleteMapping = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      t('knowledge.mappings.deleteConfirm'),
      'Warning',
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      }
    )
    await knowledgeApi.deleteMapping(id)
    ElMessage.success(t('knowledge.mappings.deleteSuccess'))
    fetchMappings()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('knowledge.mappings.deleteFailed'))
    }
  }
}

// Handle view mapping detail
const handleViewMapping = (mapping: DirectoryMapping) => {
  selectedMapping.value = mapping
  mappingDetailVisible.value = true
}

// Handle execute mapping
const handleExecuteMapping = async (id: string) => {
  try {
    ElMessage.info(t('knowledge.mappings.executeMessage'))
    // API call to execute mapping would go here
    // For now, just show a success message
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success(t('knowledge.mappings.executeSuccess', { id }))
  } catch (error) {
    ElMessage.error(t('knowledge.mappings.executeFailed'))
  }
}

// Statistics
const vectorizedCount = computed(() => documents.value.filter(d => d.vectorized).length)

// Watch for changes
watch([page, pageSize, searchQuery, selectedCategory], () => {
  if (activeTab.value === 'files') {
    fetchDocuments()
  }
})

watch(activeTab, (newTab) => {
  if (newTab === 'files') {
    fetchDocuments()
    fetchCategories()
  } else if (newTab === 'mappings') {
    fetchMappings()
  }
})

onMounted(() => {
  if (activeTab.value === 'files') {
    fetchDocuments()
    fetchCategories()
  }
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">{{ t('knowledge.title') }}</h1>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <!-- Files Management Tab -->
      <el-tab-pane :label="t('knowledge.tabs.files')" name="files">
        <!-- Statistics -->
        <el-row :gutter="16" class="mb-16">
          <el-col :span="8">
            <el-card>
              <el-statistic :title="t('knowledge.files.statsTotal')" :value="total" />
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card>
              <el-statistic :title="t('knowledge.files.statsIndexed')" :value="vectorizedCount" />
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card>
              <el-statistic :title="t('knowledge.files.statsCategories')" :value="categories.length" />
            </el-card>
          </el-col>
        </el-row>

        <!-- Toolbar -->
        <div class="table-header">
          <div class="header-filters">
            <el-input
              v-model="searchQuery"
              :placeholder="t('knowledge.files.searchPlaceholder')"
              clearable
              style="width: 300px; margin-right: 12px"
              @keyup.enter="fetchDocuments"
            >
              <template #append>
                <el-button :icon="Search" @click="fetchDocuments" />
              </template>
            </el-input>

            <el-select
              v-model="selectedCategory"
              :placeholder="t('knowledge.files.categoryPlaceholder')"
              clearable
              style="width: 150px"
              @change="fetchDocuments"
            >
              <el-option
                v-for="cat in categories"
                :key="cat"
                :label="cat"
                :value="cat"
              />
            </el-select>
          </div>

          <div class="header-actions">
            <el-button :icon="Search" @click="searchModalVisible = true">
              {{ t('knowledge.files.semanticSearch') }}
            </el-button>
            <el-button :icon="Refresh" @click="fetchDocuments">
              {{ t('common.refresh') }}
            </el-button>
            <el-button type="primary" :icon="Plus" @click="handleAdd">
              {{ t('knowledge.files.addButton') }}
            </el-button>
          </div>
        </div>

        <!-- Table -->
        <el-table
          v-loading="loading"
          :data="documents"
          stripe
          style="width: 100%"
        >
          <el-table-column prop="title" :label="t('knowledge.files.colTitle')" min-width="180" header-align="center" show-overflow-tooltip />
          <el-table-column prop="category" :label="t('knowledge.files.colCategory')" min-width="120" header-align="center" />
          <el-table-column :label="t('knowledge.files.colTags')" min-width="150" header-align="center">
            <template #default="{ row }">
              <el-tag
                v-for="tag in row.tags"
                :key="tag"
                size="small"
                style="margin-right: 4px"
              >
                {{ tag }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('knowledge.files.colVectorized')" width="100" header-align="center">
            <template #default="{ row }">
              <el-tag :type="row.vectorized ? 'success' : 'info'" size="small">
                {{ row.vectorized ? t('knowledge.files.colIndexed') : t('knowledge.files.colNotIndexed') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('knowledge.files.colUpdateTime')" width="170" header-align="center">
            <template #default="{ row }">
              {{ new Date(row.updated_at).toLocaleString('zh-CN') }}
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

      <!-- Directory Mappings Tab -->
      <el-tab-pane name="mappings">
        <template #label>
          <el-icon><Link /></el-icon>
          <span>{{ t('knowledge.tabs.mappings') }}</span>
        </template>

        <el-alert
          :title="t('knowledge.mappings.description')"
          type="info"
          :description="t('knowledge.mappings.descriptionText')"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
        />

        <!-- Toolbar -->
        <div class="table-header">
          <div class="header-filters"></div>
          <div class="header-actions">
            <el-button type="primary" :icon="Plus" @click="handleAddMapping">
              {{ t('knowledge.mappings.addButton') }}
            </el-button>
          </div>
        </div>

        <!-- Table -->
        <el-table
          :data="mappings"
          stripe
          style="width: 100%"
        >
          <el-table-column :label="t('knowledge.mappings.taskId')" width="100" header-align="center">
            <template #default="{ row }">
              <el-tag type="primary">{{ row.id }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="directory_name"
            :label="t('knowledge.mappings.directoryName')"
            min-width="140"
            header-align="center"
            show-overflow-tooltip
          />
          <el-table-column
            prop="directory_path"
            :label="t('knowledge.mappings.directoryPath')"
            min-width="220"
            show-overflow-tooltip
            header-align="center"
          />
          <el-table-column :label="t('knowledge.mappings.fileSystem')" width="90" header-align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.file_system === 'NFS' ? 'primary' : row.file_system === 'S3' ? 'success' : 'warning'"
                size="small"
              >
                {{ row.file_system }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="last_import_time"
            :label="t('knowledge.mappings.lastImportTime')"
            width="170"
            header-align="center"
          />
          <el-table-column
            prop="operator"
            :label="t('knowledge.mappings.operator')"
            min-width="100"
            header-align="center"
          />
          <el-table-column :label="t('knowledge.mappings.actions')" width="200" fixed="right" header-align="center">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                :icon="Search"
                link
                @click="handleViewMapping(row)"
              >
                {{ t('knowledge.mappings.view') }}
              </el-button>
              <el-button
                type="success"
                size="small"
                :icon="Refresh"
                link
                @click="handleExecuteMapping(row.id)"
              >
                {{ t('knowledge.mappings.execute') }}
              </el-button>
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                link
                @click="handleDeleteMapping(row.id)"
              >
                {{ t('common.delete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Introduction Tab -->
      <el-tab-pane :label="t('knowledge.tabs.intro')" name="intro">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon><InfoFilled /></el-icon>
              <span>{{ t('knowledge.intro.info') }}</span>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item :label="t('knowledge.intro.name')">
              {{ t('knowledge.intro.nameValue') }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('knowledge.intro.totalDocs')">
              {{ total }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('knowledge.intro.indexedDocs')">
              {{ vectorizedCount }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('knowledge.intro.categoryCount')">
              {{ categories.length }}
            </el-descriptions-item>
          </el-descriptions>

          <el-divider />

          <div>
            <h4>{{ t('knowledge.intro.description') }}</h4>
            <p>{{ t('knowledge.intro.descriptionText') }}</p>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- Add/Edit Modal -->
    <el-dialog
      v-model="modalVisible"
      :title="editingDoc ? t('knowledge.files.editModalTitle') : t('knowledge.files.addModalTitle')"
      width="600px"
    >
      <el-form :model="formData" label-width="100px">
        <el-form-item :label="t('knowledge.files.titleLabel')" required>
          <el-input
            v-model="formData.title"
            :placeholder="t('knowledge.files.titlePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('knowledge.files.categoryLabel')" required>
          <el-select
            v-model="formData.category"
            :placeholder="t('knowledge.files.modalCategoryPlaceholder')"
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
          <div class="form-help">{{ t('knowledge.files.categoryHelp') }}</div>
        </el-form-item>

        <el-form-item :label="t('knowledge.files.tagsLabel')">
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
              :placeholder="t('knowledge.files.tagsPlaceholder')"
              style="width: 200px"
              @keyup.enter="handleTagInput"
            />
          </div>
        </el-form-item>

        <el-form-item :label="t('knowledge.files.contentLabel')" required>
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="8"
            :placeholder="t('knowledge.files.contentPlaceholder')"
          />
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

    <!-- Semantic Search Modal -->
    <el-dialog
      v-model="searchModalVisible"
      :title="t('knowledge.files.searchModalTitle')"
      width="800px"
    >
      <el-input
        v-model="searchQueryText"
        type="textarea"
        :rows="3"
        :placeholder="t('knowledge.files.searchModalPlaceholder')"
      />

      <template #footer>
        <el-button @click="searchModalVisible = false">
          {{ t('common.cancel') }}
        </el-button>
        <el-button type="primary" :loading="searchLoading" @click="handleSemanticSearch">
          {{ t('common.search') }}
        </el-button>
      </template>

      <div v-if="searchResults.length > 0" class="search-results mt-24">
        <h4>{{ t('knowledge.files.searchResults') }}</h4>
        <el-card
          v-for="result in searchResults"
          :key="result.id"
          class="result-card mb-16"
        >
          <div class="result-header">
            <h5>{{ result.title }}</h5>
            <el-tag type="info" size="small">
              {{ t('knowledge.files.similarity') }}: {{ (result.similarity_score * 100).toFixed(1) }}%
            </el-tag>
          </div>
          <p class="result-content">{{ result.content }}</p>
          <div class="result-meta">
            <el-tag size="small">{{ result.category }}</el-tag>
            <el-tag
              v-for="tag in result.tags"
              :key="tag"
              size="small"
              style="margin-left: 4px"
            >
              {{ tag }}
            </el-tag>
          </div>
        </el-card>
      </div>
    </el-dialog>

    <!-- Add Mapping Modal -->
    <el-dialog
      v-model="mappingModalVisible"
      :title="t('knowledge.mappings.modalTitle')"
      width="600px"
    >
      <el-form :model="mappingFormData" label-width="140px">
        <el-form-item :label="t('knowledge.mappings.directoryNameLabel')" required>
          <el-input
            v-model="mappingFormData.directoryName"
            :placeholder="t('knowledge.mappings.directoryNamePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('knowledge.mappings.directoryPathLabel')" required>
          <el-input
            v-model="mappingFormData.directoryPath"
            :placeholder="t('knowledge.mappings.directoryPathPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('knowledge.mappings.fileSystemLabel')" required>
          <el-select
            v-model="mappingFormData.fileSystem"
            :placeholder="t('knowledge.mappings.fileSystemPlaceholder')"
            style="width: 100%"
          >
            <el-option value="NFS" :label="t('knowledge.mappings.fileSystemNFS')" />
            <el-option value="S3" :label="t('knowledge.mappings.fileSystemS3')" />
            <el-option value="LOCAL" :label="t('knowledge.mappings.fileSystemLOCAL')" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="mappingModalVisible = false">
          {{ t('common.cancel') }}
        </el-button>
        <el-button type="primary" @click="handleSubmitMapping">
          {{ t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Mapping Detail Modal -->
    <el-dialog
      v-model="mappingDetailVisible"
      :title="t('knowledge.mappings.detailTitle')"
      width="600px"
    >
      <el-descriptions v-if="selectedMapping" :column="2" border>
        <el-descriptions-item :label="t('knowledge.mappings.taskId')">
          <el-tag type="primary">{{ selectedMapping.id }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('knowledge.mappings.directoryName')">
          {{ selectedMapping.directory_name }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('knowledge.mappings.directoryPath')" :span="2">
          {{ selectedMapping.directory_path }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('knowledge.mappings.fileSystem')">
          <el-tag
            :type="selectedMapping.file_system === 'NFS' ? 'primary' : selectedMapping.file_system === 'S3' ? 'success' : 'warning'"
          >
            {{ selectedMapping.file_system }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('knowledge.mappings.lastImportTime')">
          {{ selectedMapping.last_import_time }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('knowledge.mappings.operator')" :span="2">
          {{ selectedMapping.operator }}
        </el-descriptions-item>
      </el-descriptions>
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
}

.header-actions {
  display: flex;
  gap: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
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

.search-results {
  max-height: 400px;
  overflow-y: auto;
}

.result-card {
  border: 1px solid #E5E7EB;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.result-header h5 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.result-content {
  color: #6B7280;
  margin-bottom: 12px;
  line-height: 1.6;
}

.result-meta {
  display: flex;
  gap: 8px;
}
</style>
