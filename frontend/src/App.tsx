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
          colorPrimary: '#595959',
          colorBgBase: '#ffffff',
          colorBgContainer: '#ffffff',
          colorBgLayout: '#f5f5f5',
          colorBorder: '#d9d9d9',
          borderRadius: 4,
        },
        components: {
          Layout: {
            headerBg: '#ffffff',
            siderBg: '#ffffff',
          },
          Menu: {
            itemBg: 'transparent',
            itemSelectedBg: '#f0f0f0',
            itemSelectedColor: '#262626',
            itemHoverBg: '#fafafa',
          },
          Card: {
            colorBgContainer: '#ffffff',
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
