import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Card, Statistic, Spin } from 'antd';
import {
  UserOutlined,
  DatabaseOutlined,
  QuestionCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import type { DashboardStats, GrowthDataPoint } from '../types';
import { statsApi } from '../services/api';
import { useTranslation } from '../contexts/LanguageContext';
import { createTranslateProxy } from '../utils/i18n';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const tp = useMemo(() => createTranslateProxy(t), [t]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userGrowth, setUserGrowth] = useState<GrowthDataPoint[]>([]);
  const [qaStats, setQaStats] = useState<GrowthDataPoint[]>([]);
  const [categoryDist, setCategoryDist] = useState<{ category: string; count: number }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashboardData, growthData, qaData, categoryData] = await Promise.all([
        statsApi.getDashboard(),
        statsApi.getUserGrowth(30),
        statsApi.getQAStats(7),
        statsApi.getCategoryDistribution(),
      ]);

      setStats(dashboardData);
      setUserGrowth(growthData);
      setQaStats(qaData);
      setCategoryDist(categoryData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserGrowthOption = () => ({
    title: {
      text: tp('dashboard.charts.userGrowth'),
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: userGrowth.map(d => d.date),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        data: userGrowth.map(d => d.count),
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
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
            ],
          },
        },
      },
    ],
  });

  const getQAStatsOption = () => ({
    title: {
      text: tp('dashboard.charts.qaStats'),
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: qaStats.map(d => d.date),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        data: qaStats.map(d => d.count),
        type: 'bar',
        itemStyle: {
          color: '#52c41a',
        },
      },
    ],
  });

  const getCategoryDistOption = () => ({
    title: {
      text: tp('dashboard.charts.categoryDist'),
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
        name: tp('dashboard.charts.docCount'),
        type: 'pie',
        radius: '50%',
        data: categoryDist.map(d => ({
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
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={tp('dashboard.stats.totalUsers')}
              value={stats?.users.total_users || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={tp('dashboard.stats.activeUsers')}
              value={stats?.users.active_users || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={tp('dashboard.stats.totalDocuments')}
              value={stats?.knowledge.total_documents || 0}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={tp('dashboard.stats.todayQA')}
              value={stats?.qa.today_qa_count || 0}
              prefix={<QuestionCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title={tp('dashboard.overview.title')}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title={tp('dashboard.overview.vectorCount')}
                  value={stats?.vectors.total_vectors || 0}
                  suffix={tp('dashboard.overview.unit条')}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={tp('dashboard.overview.avgResponseTime')}
                  value={stats?.qa.avg_response_time || 0}
                  suffix={tp('dashboard.overview.unit秒')}
                  prefix={<ClockCircleOutlined />}
                  precision={2}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={tp('dashboard.overview.categoryCount')}
                  value={stats?.knowledge.categories || 0}
                  suffix={tp('dashboard.overview.unit个')}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={tp('dashboard.overview.successRate')}
                  value={(stats?.qa.success_rate || 0) * 100}
                  suffix="%"
                  precision={1}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={tp('dashboard.charts.categoryDist')}>
            <ReactECharts option={getCategoryDistOption()} style={{ height: 250 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title={tp('dashboard.charts.userGrowthPeriod')}>
            <ReactECharts option={getUserGrowthOption()} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={tp('dashboard.charts.qaStatsPeriod')}>
            <ReactECharts option={getQAStatsOption()} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
