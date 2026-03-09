import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLanguageStore = defineStore('language', () => {
  // State
  const currentLanguage = ref<'zh-CN' | 'en-US'>(
    (localStorage.getItem('language') as 'zh-CN' | 'en-US') || 'zh-CN'
  )

  // Actions
  const setLanguage = (language: 'zh-CN' | 'en-US') => {
    currentLanguage.value = language
    localStorage.setItem('language', language)
  }

  const toggleLanguage = () => {
    const newLanguage = currentLanguage.value === 'zh-CN' ? 'en-US' : 'zh-CN'
    setLanguage(newLanguage)
  }

  return {
    currentLanguage,
    setLanguage,
    toggleLanguage
  }
})
