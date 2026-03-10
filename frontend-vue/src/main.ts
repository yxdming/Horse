import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './locales'
import './assets/styles/main.css'

// 按需导入Element Plus组件 - 只导入实际使用的组件
import {
  ElButton,
  ElInput,
  ElInputNumber,
  ElForm,
  ElFormItem,
  ElSelect,
  ElOption,
  ElTable,
  ElTableColumn,
  ElTag,
  ElCard,
  ElRow,
  ElCol,
  ElStatistic,
  ElDialog,
  ElPagination,
  ElAlert,
  ElTabs,
  ElTabPane,
  ElSwitch,
  ElSlider,
  ElRate,
  ElIcon,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElDivider,
  ElTooltip,
  ElPopover,
  ElCascader,
  ElCascaderPanel,
  ElCheckbox,
  ElCheckboxGroup,
  ElRadio,
  ElRadioGroup,
  ElRadioButton,
  ElDatePicker,
  ElTimePicker,
  ElUpload,
  ElProgress,
  ElSteps,
  ElStep,
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElDescriptions,
  ElDescriptionsItem,
  ElResult,
  ElEmpty,
  ElAvatar,
  ElText,
  ElLink,
  ElContainer,
  ElHeader,
  ElAside,
  ElMain,
  ElFooter,
  ElMenu,
  ElMenuItem,
  ElSubMenu,
  ElSpace,
} from 'element-plus'

// 只导入需要使用的图标
import {
  User,
  Edit,
  Delete,
  Search,
  Refresh,
  Plus,
  Document,
  Clock,
  Connection,
  ChatLineRound,
  Setting,
  SwitchButton,
  ArrowDown,
  Close,
  Check,
  Warning,
  InfoFilled,
  SuccessFilled,
  CircleCloseFilled,
  Odometer,
  QuestionFilled,
  Brush,
  Reading,
  Notebook,
} from '@element-plus/icons-vue'

const app = createApp(App)
const pinia = createPinia()

// 注册Element Plus组件
const components = [
  ElButton,
  ElInput,
  ElInputNumber,
  ElForm,
  ElFormItem,
  ElSelect,
  ElOption,
  ElTable,
  ElTableColumn,
  ElTag,
  ElCard,
  ElRow,
  ElCol,
  ElStatistic,
  ElDialog,
  ElPagination,
  ElAlert,
  ElTabs,
  ElTabPane,
  ElSwitch,
  ElSlider,
  ElRate,
  ElIcon,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElDivider,
  ElTooltip,
  ElPopover,
  ElCascader,
  ElCascaderPanel,
  ElCheckbox,
  ElCheckboxGroup,
  ElRadio,
  ElRadioGroup,
  ElRadioButton,
  ElDatePicker,
  ElTimePicker,
  ElUpload,
  ElProgress,
  ElSteps,
  ElStep,
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElDescriptions,
  ElDescriptionsItem,
  ElResult,
  ElEmpty,
  ElAvatar,
  ElText,
  ElLink,
  ElContainer,
  ElHeader,
  ElAside,
  ElMain,
  ElFooter,
  ElMenu,
  ElMenuItem,
  ElSubMenu,
  ElSpace,
]

components.forEach(component => {
  if (component.name) {
    app.component(component.name, component)
  }
})

// 注册图标组件
const icons = {
  User,
  Edit,
  Delete,
  Search,
  Refresh,
  Plus,
  Document,
  Clock,
  Connection,
  ChatLineRound,
  Setting,
  SwitchButton,
  ArrowDown,
  Close,
  Check,
  Warning,
  InfoFilled,
  SuccessFilled,
  CircleCloseFilled,
  Odometer,
  QuestionFilled,
  Brush,
  Reading,
  Notebook,
}

Object.entries(icons).forEach(([key, component]) => {
  app.component(key, component)
})

// 全局配置Element Plus
app.config.globalProperties.$ELEMENT_SIZE = 'default'

app.use(pinia)
app.use(router)
app.use(i18n)

app.mount('#app')
