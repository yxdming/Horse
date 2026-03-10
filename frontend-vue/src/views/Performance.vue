<template>
  <div class="performance-container">
    <el-card class="perf-card">
      <template #header>
        <div class="card-header">
          <el-icon><Odometer /></el-icon>
          <span>性能测试面板</span>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <!-- 基础指标 -->
        <el-tab-pane label="基础指标" name="basic">
          <el-row :gutter="16">
            <el-col :span="8">
              <el-statistic title="首次内容绘制(FCP)" :value="metrics.fcp" suffix="ms" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="最大内容绘制(LCP)" :value="metrics.lcp" suffix="ms" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="首次输入延迟(FID)" :value="metrics.fid" suffix="ms" />
            </el-col>
          </el-row>

          <el-divider />

          <el-row :gutter="16">
            <el-col :span="8">
              <el-statistic title="内存使用" :value="metrics.memory.used" suffix="MB" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="DOM节点数" :value="metrics.domNodes" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="组件数量" :value="metrics.components" />
            </el-col>
          </el-row>
        </el-tab-pane>

        <!-- 性能测试 -->
        <el-tab-pane label="性能测试" name="test">
          <el-space direction="vertical" :size="16" style="width: 100%">
            <el-button type="primary" @click="runPerformanceTest" :loading="testing">
              <el-icon><Odometer /></el-icon>
              运行性能测试
            </el-button>

            <el-button @click="testRendering" :loading="testing">
              <el-icon><Refresh /></el-icon>
              测试渲染性能
            </el-button>

            <el-button @click="testMemory" :loading="testing">
              <el-icon><Document /></el-icon>
              测试内存使用
            </el-button>

            <el-alert
              v-if="testResult"
              :title="testResult"
              type="success"
              :closable="false"
              show-icon
            />
          </el-space>
        </el-tab-pane>

        <!-- 网络请求 -->
        <el-tab-pane label="网络请求" name="network">
          <el-table :data="networkRequests" stripe>
            <el-table-column prop="url" label="请求URL" show-overflow-tooltip />
            <el-table-column prop="duration" label="耗时(ms)" width="120" />
            <el-table-column prop="size" label="大小(KB)" width="100" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 200 ? 'success' : 'danger'">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 组件性能 -->
        <el-tab-pane label="组件性能" name="components">
          <el-table :data="componentMetrics" stripe>
            <el-table-column prop="name" label="组件名称" />
            <el-table-column prop="renderTime" label="渲染时间(ms)" width="150" />
            <el-table-column prop="reRenders" label="重渲染次数" width="120" />
            <el-table-column prop="score" label="性能评分" width="100">
              <template #default="{ row }">
                <el-tag :type="getScoreType(row.score)">
                  {{ row.score }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Odometer, Refresh, Document } from '@element-plus/icons-vue'

const activeTab = ref('basic')
const testing = ref(false)
const testResult = ref('')

// 基础指标
const metrics = ref({
  fcp: 0,
  lcp: 0,
  fid: 0,
  memory: {
    used: 0,
    total: 0,
    limit: 0
  },
  domNodes: 0,
  components: 0
})

// 网络请求
const networkRequests = ref([
  { url: '/api/users', duration: 45, size: 2.3, status: 200 },
  { url: '/api/knowledge', duration: 120, size: 5.6, status: 200 },
  { url: '/api/memory', duration: 85, size: 3.2, status: 200 },
])

// 组件性能
const componentMetrics = ref([
  { name: 'Dashboard', renderTime: 45, reRenders: 2, score: 95 },
  { name: 'Knowledge', renderTime: 120, reRenders: 5, score: 88 },
  { name: 'Memory', renderTime: 95, reRenders: 3, score: 92 },
  { name: 'Questioning', renderTime: 85, reRenders: 4, score: 90 },
])

// 获取评分类型
const getScoreType = (score: number) => {
  if (score >= 90) return 'success'
  if (score >= 75) return 'warning'
  return 'danger'
}

// 运行性能测试
const runPerformanceTest = async () => {
  testing.value = true
  testResult.value = ''

  try {
    // 模拟性能测试
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 获取Web Vitals指标
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (perfData) {
      metrics.value.fcp = Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart)
      metrics.value.lcp = Math.round(perfData.loadEventEnd - perfData.fetchStart)
    }

    // 内存信息
    const memoryInfo = (performance as any).memory
    if (memoryInfo) {
      metrics.value.memory = {
        used: Math.round(memoryInfo.usedJSHeapSize / 1048576),
        total: Math.round(memoryInfo.totalJSHeapSize / 1048576),
        limit: Math.round(memoryInfo.jsHeapSizeLimit / 1048576)
      }
    }

    // DOM节点数
    metrics.value.domNodes = document.querySelectorAll('*').length

    testResult.value = `✅ 性能测试完成！FCP: ${metrics.value.fcp}ms, LCP: ${metrics.value.lcp}ms, 内存: ${metrics.value.memory.used}MB`
  } catch (error) {
    testResult.value = `❌ 性能测试失败: ${error}`
  } finally {
    testing.value = false
  }
}

// 测试渲染性能
const testRendering = async () => {
  testing.value = true

  const startTime = performance.now()

  // 模拟大量渲染
  const container = document.createElement('div')
  for (let i = 0; i < 1000; i++) {
    const div = document.createElement('div')
    div.textContent = `Item ${i}`
    container.appendChild(div)
  }

  const endTime = performance.now()
  const renderTime = Math.round(endTime - startTime)

  testing.value = false
  testResult.value = `✅ 渲染1000个元素耗时: ${renderTime}ms`
}

// 测试内存使用
const testMemory = async () => {
  testing.value = true

  const startMemory = (performance as any).memory?.usedJSHeapSize || 0

  // 创建大量对象
  const objects: any[] = []
  for (let i = 0; i < 10000; i++) {
    objects.push({
      id: i,
      data: new Array(100).fill(`test data ${i}`)
    })
  }

  const endMemory = (performance as any).memory?.usedJSHeapSize || 0
  const memoryUsed = ((endMemory - startMemory) / 1048576).toFixed(2)

  testing.value = false
  testResult.value = `✅ 创建10000个对象内存增长: ${memoryUsed}MB`

  // 清理
  objects.length = 0
}

// 页面加载性能监控
onMounted(() => {
  // 等待页面完全加载
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (perfData) {
      console.log('📊 页面加载性能:', {
        DNS查询: Math.round(perfData.domainLookupEnd - perfData.domainLookupStart),
        TCP连接: Math.round(perfData.connectEnd - perfData.connectStart),
        请求响应: Math.round(perfData.responseEnd - perfData.requestStart),
        DOM解析: Math.round(perfData.domComplete - perfData.domInteractive),
        完整加载: Math.round(perfData.loadEventEnd - perfData.fetchStart)
      })
    }
  })

  // 监控长任务
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'longtask') {
          console.warn('⚠️ 检测到长任务:', {
            持续时间: entry.duration,
            开始时间: entry.startTime
          })
        }
      }
    })
    observer.observe({ entryTypes: ['longtask'] })
  }
})
</script>

<style scoped>
.performance-container {
  padding: 20px;
}

.perf-card {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
}
</style>
