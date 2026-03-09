<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Setting, Refresh, Check } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import type { QAStrategy } from '../types'
import { configApi } from '../services/api'

const { t } = useI18n()

const loading = ref(false)
const formData = reactive<QAStrategy>({
  temperature: 0.7,
  max_tokens: 2000,
  top_k: 5,
  similarity_threshold: 0.75,
  system_prompt: ''
})

const fetchConfig = async () => {
  try {
    loading.value = true
    const data = await configApi.getQAStrategy()
    Object.assign(formData, data)
  } catch (error) {
    ElMessage.error(t('strategy.fetchConfigError'))
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  try {
    loading.value = true
    await configApi.updateQAStrategy(formData)
    ElMessage.success(t('strategy.saveConfigSuccess'))
    fetchConfig()
  } catch (error) {
    ElMessage.error(t('strategy.saveConfigError'))
  } finally {
    loading.value = false
  }
}

const handleReset = async () => {
  try {
    loading.value = true
    await configApi.resetQAStrategy()
    ElMessage.success(t('strategy.resetConfigSuccess'))
    fetchConfig()
  } catch (error) {
    ElMessage.error(t('strategy.resetConfigError'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchConfig()
})
</script>

<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon :size="20"><Setting /></el-icon>
            <span>{{ t('strategy.title') }}</span>
          </div>
          <div class="header-actions">
            <el-button :icon="Refresh" :loading="loading" @click="fetchConfig">
              {{ t('strategy.refresh') }}
            </el-button>
            <el-button type="primary" :icon="Check" :loading="loading" @click="handleSubmit">
              {{ t('strategy.saveConfig') }}
            </el-button>
          </div>
        </div>
      </template>

      <el-alert
        :title="t('strategy.configInfo.title')"
        :description="t('strategy.configInfo.description')"
        type="info"
        show-icon
        :closable="false"
        class="mb-24"
      />

      <el-form label-width="200px" label-position="left">
        <!-- Model Parameters -->
        <div class="form-section">
          <h4>{{ t('strategy.modelParams.title') }}</h4>

          <el-form-item :label="t('strategy.modelParams.temperature.label')">
            <template #label>
              <div class="label-with-value">
                <span>{{ t('strategy.modelParams.temperature.label') }}</span>
                <span class="value-display">{{ formData.temperature?.toFixed(2) || 0.7 }}</span>
              </div>
            </template>
            <el-slider
              v-model="formData.temperature"
              :min="0"
              :max="2"
              :step="0.1"
              :marks="{
                0: t('strategy.modelParams.temperature.marks.deterministic'),
                0.7: t('strategy.modelParams.temperature.marks.balanced'),
                1.4: t('strategy.modelParams.temperature.marks.creative'),
                2: t('strategy.modelParams.temperature.marks.random')
              }"
              :disabled="loading"
            />
          </el-form-item>

          <el-form-item :label="t('strategy.modelParams.maxTokens.label')">
            <el-input-number
              v-model="formData.max_tokens"
              :min="100"
              :max="8000"
              :step="100"
              :disabled="loading"
              style="width: 200px"
            />
            <span class="unit-text">{{ t('strategy.modelParams.maxTokens.unit') }}</span>
          </el-form-item>
        </div>

        <el-divider />

        <!-- Retrieval Strategy -->
        <div class="form-section">
          <h4>{{ t('strategy.retrievalStrategy.title') }}</h4>

          <el-form-item :label="t('strategy.retrievalStrategy.topK.label')">
            <el-input-number
              v-model="formData.top_k"
              :min="1"
              :max="20"
              :disabled="loading"
              style="width: 200px"
            />
            <span class="unit-text">{{ t('strategy.retrievalStrategy.topK.unit') }}</span>
          </el-form-item>

          <el-form-item :label="t('strategy.retrievalStrategy.similarityThreshold.label')">
            <template #label>
              <div class="label-with-value">
                <span>{{ t('strategy.retrievalStrategy.similarityThreshold.label') }}</span>
                <span class="value-display">{{ formData.similarity_threshold?.toFixed(2) || 0.75 }}</span>
              </div>
            </template>
            <el-slider
              v-model="formData.similarity_threshold"
              :min="0"
              :max="1"
              :step="0.05"
              :marks="{
                0: t('strategy.retrievalStrategy.similarityThreshold.marks.all'),
                0.5: t('strategy.retrievalStrategy.similarityThreshold.marks.loose'),
                0.75: t('strategy.retrievalStrategy.similarityThreshold.marks.moderate'),
                0.9: t('strategy.retrievalStrategy.similarityThreshold.marks.strict'),
                1: t('strategy.retrievalStrategy.similarityThreshold.marks.precise')
              }"
              :disabled="loading"
            />
          </el-form-item>
        </div>

        <el-divider />

        <!-- Prompt Configuration -->
        <div class="form-section">
          <h4>{{ t('strategy.promptConfig.title') }}</h4>

          <el-form-item :label="t('strategy.promptConfig.systemPrompt.label')">
            <el-input
              v-model="formData.system_prompt"
              type="textarea"
              :rows="8"
              :placeholder="t('strategy.promptConfig.systemPrompt.placeholder')"
              :maxlength="2000"
              show-word-limit
              :disabled="loading"
            />
          </el-form-item>
        </div>

        <el-divider />

        <!-- Quick Actions -->
        <div class="form-section">
          <h4>{{ t('strategy.quickActions.title') }}</h4>
          <el-button type="danger" :loading="loading" @click="handleReset">
            {{ t('strategy.quickActions.resetDefault') }}
          </el-button>
        </div>
      </el-form>

      <el-divider />

      <!-- Config Preview -->
      <div class="form-section">
        <h4>{{ t('strategy.configPreview.title') }}</h4>
        <el-card class="preview-card">
          <div class="preview-item">
            <span class="preview-label">{{ t('strategy.configPreview.fields.temperature') }}:</span>
            <span class="preview-value">{{ formData.temperature || 0.7 }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">{{ t('strategy.configPreview.fields.maxTokens') }}:</span>
            <span class="preview-value">{{ formData.max_tokens || 2000 }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">{{ t('strategy.configPreview.fields.topK') }}:</span>
            <span class="preview-value">{{ formData.top_k || 5 }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">{{ t('strategy.configPreview.fields.similarityThreshold') }}:</span>
            <span class="preview-value">{{ formData.similarity_threshold || 0.75 }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">{{ t('strategy.configPreview.fields.systemPrompt') }}:</span>
          </div>
          <div class="preview-prompt">
            {{ formData.system_prompt || t('strategy.configPreview.fields.notSet') }}
          </div>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.form-section {
  margin-bottom: 24px;
}

.form-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
}

.label-with-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.value-display {
  font-weight: 600;
  color: #6366F1;
  margin-left: 12px;
}

.unit-text {
  margin-left: 8px;
  color: #6B7280;
  font-size: 14px;
}

.preview-card {
  background: #F3F4F6;
  border: none;
}

.preview-item {
  display: flex;
  margin-bottom: 8px;
}

.preview-label {
  font-weight: 600;
  margin-right: 8px;
  min-width: 150px;
}

.preview-value {
  color: #111827;
}

.preview-prompt {
  margin-top: 12px;
  padding: 12px;
  background: #FFFFFF;
  border-radius: 6px;
  white-space: pre-wrap;
  color: #6B7280;
  font-size: 14px;
  line-height: 1.6;
}
</style>
