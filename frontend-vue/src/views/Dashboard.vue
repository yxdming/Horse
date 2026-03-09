<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DashboardStats, GrowthDataPoint } from '../types'
import { statsApi } from '../services/api'
import { User, Document, QuestionFilled, Clock } from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const { t } = useI18n()

const loading = ref(true)
const stats = ref<DashboardStats | null>(null)
const userGrowth = ref<GrowthDataPoint[]>([])
const qaStats = ref<GrowthDataPoint[]>([])
const categoryDist = ref<{ category: string; count: number }[]>([])

const fetchData = async () => {
  try {
    loading.value = true
    const [dashboardData, growthData, qaData, categoryData] = await Promise.all([
      statsApi.getDashboard(),
      statsApi.getUserGrowth(30),
      statsApi.getQAStats(7),
      statsApi.getCategoryDistribution(),
    ])

    stats.value = dashboardData
    userGrowth.value = growthData
    qaStats.value = qaData
    categoryDist.value = categoryData
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
  } finally {
    loading.value = false
  }
}

// User Growth Chart Option
const userGrowthOption = computed(() => ({
  title: {
    text: t('dashboard.charts.userGrowth'),
    left: 'center',
  },
  tooltip: {
    trigger: 'axis',
  },
  xAxis: {
    type: 'category',
    data: userGrowth.value.map(d => d.date),
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      data: userGrowth.value.map(d => d.count),
      type: 'line',
      smooth: true,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(99, 102, 241, 0.3)' },
            { offset: 1, color: 'rgba(99, 102, 241, 0.05)' },
          ],
        },
      },
      itemStyle: {
        color: '#6366F1',
      },
    },
  ],
}))

// QA Stats Chart Option
const qaStatsOption = computed(() => ({
  title: {
    text: t('dashboard.charts.qaStats'),
    left: 'center',
  },
  tooltip: {
    trigger: 'axis',
  },
  xAxis: {
    type: 'category',
    data: qaStats.value.map(d => d.date),
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      data: qaStats.value.map(d => d.count),
      type: 'bar',
      itemStyle: {
        color: '#10B981',
      },
    },
  ],
}))

// Category Distribution Chart Option
const categoryDistOption = computed(() => ({
  title: {
    text: t('dashboard.charts.categoryDist'),
    left: 'center',
  },
  tooltip: {
    trigger: 'item',
  },
  legend: {
    orient: 'vertical',
    left: 'left',
  },
  series: [
    {
      name: t('dashboard.charts.docCount'),
      type: 'pie',
      radius: '50%',
      data: categoryDist.value.map(d => ({
        value: d.count,
        name: d.category,
      })),
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    },
  ],
}))

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="page-container">
    <div v-loading="loading" class="dashboard-content">
      <!-- Statistics Cards -->
      <el-row :gutter="16" class="mb-16">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card>
            <el-statistic
              :title="t('dashboard.stats.totalUsers')"
              :value="stats?.users.total_users || 0"
            >
              <template #prefix>
                <el-icon :size="20" color="#6366F1"><User /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card>
            <el-statistic
              :title="t('dashboard.stats.activeUsers')"
              :value="stats?.users.active_users || 0"
            >
              <template #prefix>
                <el-icon :size="20" color="#10B981"><User /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card>
            <el-statistic
              :title="t('dashboard.stats.totalDocuments')"
              :value="stats?.knowledge.total_documents || 0"
            >
              <template #prefix>
                <el-icon :size="20" color="#8B5CF6"><Document /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card>
            <el-statistic
              :title="t('dashboard.stats.todayQuestions')"
              :value="stats?.qa.today_qa_count || 0"
            >
              <template #prefix>
                <el-icon :size="20" color="#F59E0B"><QuestionFilled /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
      </el-row>

      <!-- Overview and Category Distribution -->
      <el-row :gutter="16" class="mb-16">
        <el-col :xs="24" :md="12">
          <el-card>
            <template #header>
              <span>{{ t('dashboard.overview.title') }}</span>
            </template>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-statistic
                  :title="t('dashboard.overview.vectorCount')"
                  :value="stats?.vectors.total_vectors || 0"
                />
              </el-col>
              <el-col :span="12">
                <el-statistic
                  :title="t('dashboard.overview.avgResponseTime')"
                  :value="stats?.qa.avg_response_time || 0"
                  :precision="2"
                >
                  <template #prefix>
                    <el-icon :size="16"><Clock /></el-icon>
                  </template>
                  <template #suffix>
                    <span class="unit-text">s</span>
                  </template>
                </el-statistic>
              </el-col>
              <el-col :span="12" class="mt-16">
                <el-statistic
                  :title="t('dashboard.overview.categoryCount')"
                  :value="stats?.knowledge.categories || 0"
                />
              </el-col>
              <el-col :span="12" class="mt-16">
                <el-statistic
                  :title="t('dashboard.overview.successRate')"
                  :value="(stats?.qa.success_rate || 0) * 100"
                  :precision="1"
                >
                  <template #suffix>%</template>
                </el-statistic>
              </el-col>
            </el-row>
          </el-card>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-card>
            <template #header>
              <span>{{ t('dashboard.charts.categoryDistribution') }}</span>
            </template>
            <v-chart :option="categoryDistOption" style="height: 250px" autoresize />
          </el-card>
        </el-col>
      </el-row>

      <!-- User Growth and QA Stats Charts -->
      <el-row :gutter="16">
        <el-col :xs="24" :lg="12">
          <el-card>
            <template #header>
              <span>{{ t('dashboard.charts.userGrowthPeriod') }}</span>
            </template>
            <v-chart :option="userGrowthOption" style="height: 300px" autoresize />
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="12">
          <el-card>
            <template #header>
              <span>{{ t('dashboard.charts.qaStatsPeriod') }}</span>
            </template>
            <v-chart :option="qaStatsOption" style="height: 300px" autoresize />
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style scoped>
.dashboard-content {
  min-height: 400px;
}

.unit-text {
  font-size: 12px;
  color: #6B7280;
  margin-left: 4px;
}
</style>
