<script setup lang="ts">
import { computed } from 'vue'
import { ElSelect, ElOption } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useLanguageStore } from '../stores/language'

const { locale } = useI18n()
const languageStore = useLanguageStore()

const languages = [
  { label: '中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' }
]

const currentLanguage = computed({
  get: () => languageStore.currentLanguage,
  set: (value) => {
    languageStore.setLanguage(value)
    locale.value = value
  }
})
</script>

<template>
  <el-select v-model="currentLanguage" class="language-select" style="width: 120px">
    <el-option
      v-for="lang in languages"
      :key="lang.value"
      :label="lang.label"
      :value="lang.value"
    />
  </el-select>
</template>

<style scoped>
.language-select {
  :deep(.el-input__wrapper) {
    background-color: transparent;
    border: none;
    box-shadow: none;
    transition: all 0.15s ease;

    &:hover {
      background-color: #F6F8FA;
      border-radius: 6px;
    }
  }

  :deep(.el-input__inner) {
    font-weight: 500;
    color: #24292F;
    font-size: 14px;
  }
}
</style>
