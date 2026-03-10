<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Plus,
  Edit,
  Delete,
  Search,
  ChatLineRound,
  Document
} from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import type { DatabaseSource, GlossaryTerm, QuestionHistory } from '../types'
import type { DatabaseSourceCreate, GlossaryTermCreate } from '../types'
import { questioningApi } from '../services/api'

const { t } = useI18n()

const activeTab = ref('databases')

// Databases State
const dbLoading = ref(false)
const databases = ref<DatabaseSource[]>([])
const dbModalVisible = ref(false)
const editingDb = ref<DatabaseSource | null>(null)
const dbFormData = ref<DatabaseSourceCreate>({
  name: '',
  type: 'MySQL',
  host: '',
  port: 3306,
  database: '',
  username: '',
  password: ''
})

// Glossaries State
const glossaryLoading = ref(false)
const glossaries = ref<GlossaryTerm[]>([])
const glossaryModalVisible = ref(false)
const editingGlossary = ref<GlossaryTerm | null>(null)
const glossaryFormData = ref<GlossaryTermCreate>({
  term: '',
  definition: '',
  mapping: '',
  category: '销售指标',
  example: ''
})
const searchKeyword = ref('')

// History State
const historyLoading = ref(false)
const questionHistory = ref<QuestionHistory[]>([])

// Natural Language Ask State
const selectedDatabase = ref<string>()
const questionText = ref('')
const askLoading = ref(false)
const generatedSQL = ref('')
const questionExplanation = ref('')
const questionConfidence = ref(0)
const recognizedTerms = ref<string[]>([])

// Fetch databases
const fetchDatabases = async () => {
  try {
    dbLoading.value = true
    const response = await questioningApi.getDatabases()
    // Transform snake_case to camelCase if needed
    databases.value = (response.databases || []).map((db: any) => ({
      ...db,
      tableCount: db.tableCount || db.table_count || 0,
      lastSync: db.lastSync || db.last_sync || '',
      status: db.status || 'unknown'
    }))
  } catch (error) {
    console.error('Failed to fetch databases:', error)
    ElMessage.error(t('questioning.databases.fetchFailed'))
  } finally {
    dbLoading.value = false
  }
}

// Handle database add/edit
const handleDbAdd = () => {
  editingDb.value = null
  dbFormData.value = {
    name: '',
    type: 'MySQL',
    host: '',
    port: 3306,
    database: '',
    username: '',
    password: ''
  }
  dbModalVisible.value = true
}

const handleDbEdit = (record: DatabaseSource) => {
  editingDb.value = record
  dbFormData.value = {
    name: record.name,
    type: record.type,
    host: record.host,
    port: record.port,
    database: record.database,
    username: record.username,
    password: ''
  }
  dbModalVisible.value = true
}

const handleDbDelete = async (id: string) => {
  try {
    await questioningApi.deleteDatabase(id)
    ElMessage.success(t('questioning.databases.deleteSuccess'))
    fetchDatabases()
  } catch (error) {
    ElMessage.error(t('questioning.databases.deleteFailed'))
  }
}

const handleDbSubmit = async () => {
  try {
    if (editingDb.value) {
      await questioningApi.updateDatabase(editingDb.value.id, dbFormData.value)
      ElMessage.success(t('questioning.databases.updateSuccess'))
    } else {
      await questioningApi.createDatabase(dbFormData.value)
      ElMessage.success(t('questioning.databases.createSuccess'))
    }
    dbModalVisible.value = false
    fetchDatabases()
  } catch (error) {
    ElMessage.error(editingDb.value ? t('questioning.databases.updateFailed') : t('questioning.databases.createFailed'))
  }
}

// Fetch glossaries
const fetchGlossaries = async () => {
  try {
    glossaryLoading.value = true
    const response = await questioningApi.getGlossaries()
    // Ensure all fields have default values
    glossaries.value = (response.glossaries || []).map((item: any) => ({
      ...item,
      term: item.term || '',
      definition: item.definition || '',
      mapping: item.mapping || '',
      category: item.category || '',
      example: item.example || '',
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at
    }))
  } catch (error) {
    console.error('Failed to fetch glossaries:', error)
    ElMessage.error(t('questioning.glossaries.fetchFailed'))
  } finally {
    glossaryLoading.value = false
  }
}

// Handle glossary add/edit
const handleGlossaryAdd = () => {
  editingGlossary.value = null
  glossaryFormData.value = {
    term: '',
    definition: '',
    mapping: '',
    category: '销售指标',
    example: ''
  }
  glossaryModalVisible.value = true
}

const handleGlossaryEdit = (record: GlossaryTerm) => {
  editingGlossary.value = record
  glossaryFormData.value = {
    term: record.term,
    definition: record.definition,
    mapping: record.mapping,
    category: record.category,
    example: record.example
  }
  glossaryModalVisible.value = true
}

const handleGlossaryDelete = async (id: string) => {
  try {
    await questioningApi.deleteGlossary(id)
    ElMessage.success(t('questioning.glossaries.deleteSuccess'))
    fetchGlossaries()
  } catch (error) {
    ElMessage.error(t('questioning.glossaries.deleteFailed'))
  }
}

const handleGlossarySubmit = async () => {
  try {
    if (editingGlossary.value) {
      await questioningApi.updateGlossary(editingGlossary.value.id, glossaryFormData.value)
      ElMessage.success(t('questioning.glossaries.updateSuccess'))
    } else {
      await questioningApi.createGlossary(glossaryFormData.value)
      ElMessage.success(t('questioning.glossaries.createSuccess'))
    }
    glossaryModalVisible.value = false
    fetchGlossaries()
  } catch (error) {
    ElMessage.error(editingGlossary.value ? t('questioning.glossaries.updateFailed') : t('questioning.glossaries.createFailed'))
  }
}

// Fetch history
const fetchHistory = async () => {
  try {
    historyLoading.value = true
    const response = await questioningApi.getHistories(0, 50)
    // Transform data and handle potential missing fields
    questionHistory.value = (response.histories || []).map((item: any) => ({
      ...item,
      duration: item.duration || 0,
      status: item.status || 'unknown',
      database_name: item.database_name || item.databaseName || '',
      created_at: item.created_at || new Date().toISOString()
    }))
  } catch (error) {
    console.error('Failed to fetch history:', error)
    ElMessage.error(t('questioning.history.fetchFailed'))
  } finally {
    historyLoading.value = false
  }
}

// Handle ask question
const handleAskQuestion = async () => {
  if (!selectedDatabase.value) {
    ElMessage.warning(t('questioning.ask.noDatabase'))
    return
  }
  if (!questionText.value.trim()) {
    ElMessage.warning(t('questioning.ask.questionRequired'))
    return
  }

  try {
    askLoading.value = true
    const response = await questioningApi.askQuestion({
      question: questionText.value,
      database_id: selectedDatabase.value
    })
    generatedSQL.value = response.sql
    questionExplanation.value = response.explanation
    questionConfidence.value = response.confidence
    recognizedTerms.value = response.glossaries || []
    ElMessage.success(t('questioning.ask.askSuccess'))
  } catch (error) {
    ElMessage.error(t('questioning.ask.askFailed'))
  } finally {
    askLoading.value = false
  }
}

// Helper functions
const getStatusType = (status?: string) => {
  if (!status) return 'info'
  return status === 'connected' ? 'success' : 'danger'
}

const getStatusText = (status?: string) => {
  if (!status) return t('questioning.databases.statusUnknown')
  return status === 'connected' ? t('questioning.databases.statusConnected') : t('questioning.databases.statusDisconnected')
}

// Watch tab changes
const handleTabChange = (tabName: string | number) => {
  const tab = String(tabName)
  if (tab === 'databases') {
    fetchDatabases()
  } else if (tab === 'glossaries') {
    fetchGlossaries()
  } else if (tab === 'history') {
    fetchHistory()
  }
}

onMounted(() => {
  fetchDatabases()
})
</script>

<template>
  <div class="page-container">
    <el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange">
      <!-- Databases Tab -->
      <el-tab-pane :label="t('questioning.tabs.databases')" name="databases">
        <div class="table-header">
          <el-alert
            :title="t('questioning.databases.alertMessage')"
            :description="t('questioning.databases.alertDescription')"
            type="info"
            show-icon
            :closable="false"
          />
          <el-button type="primary" :icon="Plus" @click="handleDbAdd">
            {{ t('questioning.databases.addButton') }}
          </el-button>
        </div>

        <el-table
          v-loading="dbLoading"
          :data="databases"
          stripe
          style="width: 100%"
        >
          <el-table-column prop="name" :label="t('questioning.databases.name')" min-width="130" header-align="center" />
          <el-table-column prop="type" :label="t('questioning.databases.type')" width="100" header-align="center" />
          <el-table-column prop="host" :label="t('questioning.databases.host')" min-width="140" header-align="center" />
          <el-table-column prop="port" :label="t('questioning.databases.port')" width="70" header-align="center" />
          <el-table-column prop="database" :label="t('questioning.databases.database')" min-width="110" header-align="center" />
          <el-table-column :label="t('questioning.databases.status')" width="90" header-align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('questioning.databases.tableCount')" width="80" header-align="center">
            <template #default="{ row }">
              {{ row.tableCount || 0 }}
            </template>
          </el-table-column>
          <el-table-column :label="t('common.actions')" width="150" fixed="right" header-align="center">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                :icon="Edit"
                link
                @click="handleDbEdit(row)"
              >
                {{ t('common.edit') }}
              </el-button>
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                link
                @click="handleDbDelete(row.id)"
              >
                {{ t('common.delete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Glossaries Tab -->
      <el-tab-pane :label="t('questioning.tabs.glossaries')" name="glossaries">
        <div class="table-header">
          <el-input
            v-model="searchKeyword"
            :placeholder="t('questioning.glossaries.searchPlaceholder')"
            clearable
            style="width: 300px"
          >
            <template #append>
              <el-button :icon="Search" />
            </template>
          </el-input>
          <el-button type="primary" :icon="Plus" @click="handleGlossaryAdd">
            {{ t('questioning.glossaries.addButton') }}
          </el-button>
        </div>

        <el-table
          v-loading="glossaryLoading"
          :data="glossaries.filter(g => !searchKeyword || g.term.includes(searchKeyword))"
          stripe
          style="width: 100%"
        >
          <el-table-column prop="term" :label="t('questioning.glossaries.term')" min-width="130" header-align="center" />
          <el-table-column prop="definition" :label="t('questioning.glossaries.definition')" min-width="180" show-overflow-tooltip header-align="center" />
          <el-table-column prop="mapping" :label="t('questioning.glossaries.mapping')" min-width="140" show-overflow-tooltip header-align="center" />
          <el-table-column prop="category" :label="t('questioning.glossaries.category')" min-width="100" header-align="center" />
          <el-table-column :label="t('common.actions')" width="150" fixed="right" header-align="center">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                :icon="Edit"
                link
                @click="handleGlossaryEdit(row)"
              >
                {{ t('common.edit') }}
              </el-button>
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                link
                @click="handleGlossaryDelete(row.id)"
              >
                {{ t('common.delete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- History Tab -->
      <el-tab-pane :label="t('questioning.tabs.history')" name="history">
        <el-alert
          :title="t('questioning.history.alertMessage')"
          :description="t('questioning.history.alertDescription')"
          type="info"
          show-icon
          :closable="false"
          class="mb-16"
        />

        <el-table
          v-loading="historyLoading"
          :data="questionHistory"
          stripe
          style="width: 100%"
        >
          <el-table-column prop="question" :label="t('questioning.history.question')" min-width="220" show-overflow-tooltip header-align="center" />
          <el-table-column prop="sql" :label="t('questioning.history.sql')" min-width="260" show-overflow-tooltip header-align="center" />
          <el-table-column :label="t('questioning.history.duration')" width="90" header-align="center">
            <template #default="{ row }">
              {{ row.duration ? `${row.duration}ms` : '-' }}
            </template>
          </el-table-column>
          <el-table-column :label="t('questioning.history.status')" width="90" header-align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.status === 'success' ? 'success' : row.status === 'failed' ? 'danger' : 'info'"
                size="small"
              >
                {{ row.status === 'success' ? t('questioning.history.statusSuccess') : row.status === 'failed' ? t('questioning.history.statusFailed') : t('questioning.history.statusUnknown') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="database_name" :label="t('questioning.history.database')" min-width="110" header-align="center" />
          <el-table-column prop="created_at" :label="t('questioning.history.askTime')" width="170" header-align="center">
            <template #default="{ row }">
              {{ new Date(row.created_at).toLocaleString('zh-CN') }}
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Natural Language Ask Tab -->
      <el-tab-pane :label="t('questioning.tabs.ask')" name="ask">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-card>
              <template #header>
                <div class="card-header">
                  <el-icon><ChatLineRound /></el-icon>
                  <span>{{ t('questioning.ask.title') }}</span>
                </div>
              </template>

              <el-form label-width="120px">
                <el-form-item :label="t('questioning.ask.selectDatabase')" required>
                  <el-select
                    v-model="selectedDatabase"
                    :placeholder="t('questioning.ask.selectDatabase')"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="db in databases.filter(d => d.status === 'connected')"
                      :key="db.id"
                      :label="db.name"
                      :value="db.id"
                    />
                  </el-select>
                </el-form-item>

                <el-form-item :label="t('questioning.ask.questionLabel')" required>
                  <el-input
                    v-model="questionText"
                    type="textarea"
                    :rows="4"
                    :placeholder="t('questioning.ask.questionPlaceholder')"
                  />
                </el-form-item>

                <el-form-item>
                  <el-button
                    type="primary"
                    :loading="askLoading"
                    @click="handleAskQuestion"
                  >
                    {{ t('questioning.ask.askButton') }}
                  </el-button>
                  <el-button @click="generatedSQL = ''; questionText = ''">
                    {{ t('questioning.ask.clearButton') }}
                  </el-button>
                </el-form-item>
              </el-form>

              <el-divider />

              <div>
                <h4>{{ t('questioning.ask.exampleLabel') }}</h4>
                <p>{{ t('questioning.ask.example1') }}</p>
                <p>{{ t('questioning.ask.example2') }}</p>
                <p>{{ t('questioning.ask.example3') }}</p>
              </div>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card v-if="generatedSQL">
              <template #header>
                <div class="card-header">
                  <el-icon><Document /></el-icon>
                  <span>{{ t('questioning.ask.resultTitle') }}</span>
                </div>
              </template>

              <div class="result-section">
                <h4>{{ t('questioning.ask.generatedSQL') }}</h4>
                <el-input
                  v-model="generatedSQL"
                  type="textarea"
                  :rows="6"
                  readonly
                />

                <h4 class="mt-16">{{ t('questioning.ask.explanation') }}</h4>
                <p>{{ questionExplanation }}</p>

                <el-row :gutter="16" class="mt-16">
                  <el-col :span="12">
                    <el-statistic :title="t('questioning.ask.confidence')" :value="Number((questionConfidence * 100).toFixed(1))" suffix="%" />
                  </el-col>
                  <el-col :span="12">
                    <div>{{ t('questioning.ask.recognizedTerms') }}:</div>
                    <el-tag
                      v-for="term in recognizedTerms"
                      :key="term"
                      size="small"
                      style="margin-right: 4px; margin-top: 8px"
                    >
                      {{ term }}
                    </el-tag>
                  </el-col>
                </el-row>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>

    <!-- Database Modal -->
    <el-dialog
      v-model="dbModalVisible"
      :title="editingDb ? t('questioning.databases.editModalTitle') : t('questioning.databases.addModalTitle')"
      width="600px"
    >
      <el-form :model="dbFormData" label-width="120px">
        <el-form-item :label="t('questioning.databases.nameLabel')" required>
          <el-input v-model="dbFormData.name" :placeholder="t('questioning.databases nameLabel')" />
        </el-form-item>

        <el-form-item :label="t('questioning.databases.typeLabel')" required>
          <el-select v-model="dbFormData.type" style="width: 100%">
            <el-option value="MySQL" />
            <el-option value="PostgreSQL" />
            <el-option value="Oracle" />
            <el-option value="SQLServer" />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('questioning.databases.hostLabel')" required>
          <el-input v-model="dbFormData.host" :placeholder="t('questioning.databases.hostPlaceholder')" />
        </el-form-item>

        <el-form-item :label="t('questioning.databases.portLabel')" required>
          <el-input-number v-model="dbFormData.port" :min="1" :max="65535" style="width: 100%" />
        </el-form-item>

        <el-form-item :label="t('questioning.databases.databaseLabel')" required>
          <el-input v-model="dbFormData.database" />
        </el-form-item>

        <el-form-item :label="t('questioning.databases.usernameLabel')" required>
          <el-input v-model="dbFormData.username" />
        </el-form-item>

        <el-form-item :label="t('questioning.databases.passwordLabel')">
          <el-input v-model="dbFormData.password" type="password" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dbModalVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleDbSubmit">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- Glossary Modal -->
    <el-dialog
      v-model="glossaryModalVisible"
      :title="editingGlossary ? t('questioning.glossaries.editModalTitle') : t('questioning.glossaries.addModalTitle')"
      width="600px"
    >
      <el-form :model="glossaryFormData" label-width="120px">
        <el-form-item :label="t('questioning.glossaries.termLabel')" required>
          <el-input v-model="glossaryFormData.term" :placeholder="t('questioning.glossaries.termPlaceholder')" />
        </el-form-item>

        <el-form-item :label="t('questioning.glossaries.definitionLabel')" required>
          <el-input v-model="glossaryFormData.definition" type="textarea" :rows="2" />
        </el-form-item>

        <el-form-item :label="t('questioning.glossaries.mappingLabel')" required>
          <el-input v-model="glossaryFormData.mapping" :placeholder="t('questioning.glossaries.mappingPlaceholder')" />
        </el-form-item>

        <el-form-item :label="t('questioning.glossaries.categoryLabel')" required>
          <el-select v-model="glossaryFormData.category" style="width: 100%">
            <el-option :label="t('questioning.glossaries.categorySales')" value="销售指标" />
            <el-option :label="t('questioning.glossaries.categoryUser')" value="用户指标" />
            <el-option :label="t('questioning.glossaries.categoryProduct')" value="产品指标" />
            <el-option :label="t('questioning.glossaries.categoryFinance')" value="财务指标" />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('questioning.glossaries.exampleLabel')" required>
          <el-input v-model="glossaryFormData.example" :placeholder="t('questioning.glossaries.examplePlaceholder')" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="glossaryModalVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleGlossarySubmit">{{ t('common.confirm') }}</el-button>
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

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.result-section h4 {
  margin-bottom: 8px;
  font-weight: 600;
  color: #111827;
}
</style>
