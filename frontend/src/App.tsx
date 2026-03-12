import React, { useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { LanguageProvider, useTranslation } from './contexts/LanguageContext';
import AppLayout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Knowledge from './pages/Knowledge';
import Memory from './pages/Memory';
import Questioning from './pages/Questioning';
import Users from './pages/Users';
import Strategy from './pages/Strategy';

const antdLocales: Record<string, any> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

const AppContent: React.FC = () => {
  const { language } = useTranslation();
  const antdLocale = useMemo(() => antdLocales[language] || zhCN, [language]);

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        token: {
          // Databricks-inspired minimal button style
          colorPrimary: '#6366F1',
          colorSuccess: '#10B981',
          colorWarning: '#F59E0B',
          colorError: '#EF4444',
          colorInfo: '#3B82F6',

          // Clean light theme matching reference page
          colorBgBase: '#FFFFFF',
          colorBgContainer: '#FFFFFF',
          colorBgLayout: '#F9FAFB',
          colorBorder: '#E5E7EB',
          colorBorderSecondary: '#D1D5DB',

          // Crisp high contrast text
          colorText: '#111827',
          colorTextSecondary: '#6B7280',
          colorTextTertiary: '#9CA3AF',
          colorTextQuaternary: '#D1D5DB',

          // Modern border radius
          borderRadius: 8,
          borderRadiusLG: 12,
          borderRadiusSM: 6,

          // Elevations and shadows
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
          boxShadowSecondary: '0 2px 8px 0 rgba(0, 0, 0, 0.08), 0 1px 4px 0 rgba(0, 0, 0, 0.04)',
          boxShadowTertiary: '0 4px 16px 0 rgba(0, 0, 0, 0.08), 0 2px 8px 0 rgba(0, 0, 0, 0.04)',

          // Subtle backgrounds
          colorFillAlter: '#F5F7FA',
          colorBgTextHover: '#F5F7FA',

          // Link colors
          colorLink: '#6366F1',
          colorLinkHover: '#4F46E5',
        },
        components: {
          Layout: {
            headerBg: '#FFFFFF',
            headerHeight: 64,
            headerPadding: '0 24px',
            siderBg: '#F3F4F6',
          },
          Menu: {
            darkItemBg: 'transparent',
            darkItemSelectedBg: '#EEF2FF',
            darkItemSelectedColor: '#6366F1',
            darkItemHoverBg: '#F3F4F6',
            itemBorderRadius: 8,
            marginXS: 4,
            padding: 8,
          },
          Card: {
            colorBgContainer: '#FFFFFF',
            boxShadowTertiary: '0 2px 8px 0 rgba(0, 0, 0, 0.06)',
            borderRadiusLG: 12,
            paddingLG: 24,
          },
          Button: {
            borderRadius: 8,
            paddingInline: 20,
            paddingBlock: 10,
            fontWeight: 500,
            controlHeight: 40,
            controlHeightLG: 48,
            controlHeightSM: 32,
          },
          Input: {
            borderRadius: 8,
            controlHeight: 40,
            colorBgContainer: '#FFFFFF',
            activeBorderColor: '#6366F1',
            hoverBorderColor: '#6366F1',
          },
          Select: {
            borderRadius: 8,
            controlHeight: 40,
          },
          Table: {
            headerBg: '#F9FAFB',
            headerColor: '#6B7280',
            headerSplitColor: '#E5E7EB',
            borderColor: '#E5E7EB',
            rowHoverBg: '#F9FAFB',
            borderRadiusLG: 8,
          },
          Modal: {
            borderRadiusLG: 12,
          },
          Tag: {
            borderRadiusSM: 6,
            marginXS: 4,
          },
          Statistic: {
            contentFontSize: 24,
          },
          Divider: {
            marginLG: 24,
            marginMD: 20,
            marginSM: 16,
            marginXS: 12,
          },
          Alert: {
            borderRadiusLG: 8,
            marginXS: 0,
          },
          Tabs: {
            itemActiveColor: '#6366F1',
            inkBarColor: '#6366F1',
            itemSelectedColor: '#6366F1',
            borderRadiusLG: 8,
          },
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="knowledge" element={<Knowledge />} />
            <Route path="memory" element={<Memory />} />
            <Route path="questioning" element={<Questioning />} />
            <Route path="users" element={<Users />} />
            <Route path="strategy" element={<Strategy />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
