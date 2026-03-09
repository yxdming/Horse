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
  <el-select v-model="currentLanguage" style="width: 120px">
    <el-option
      v-for="lang in languages"
      :key="lang.value"
      :label="lang.label"
      :value="lang.value"
    />
  </el-select>
</template>
