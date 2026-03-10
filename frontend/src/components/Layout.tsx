import React, { useState, useEffect, useMemo } from 'react';
import { Layout, Menu, Dropdown, Avatar, Space } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  DatabaseOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BulbOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from '../contexts/LanguageContext';
import { createTranslateProxy } from '../utils/i18n';
import LanguageSwitcher from './LanguageSwitcher';
import './Layout.css';
import logoImage from '../images/logo.png';

const { Header, Sider, Content } = Layout;

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const tp = useMemo(() => createTranslateProxy(t), [t]);

  useEffect(() => {
    // 获取当前登录用户信息
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUsername(user.username);
    }
  }, []);

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: tp('sidebar.dashboard'),
    },
    {
      key: '/knowledge',
      icon: <DatabaseOutlined />,
      label: tp('sidebar.knowledge'),
    },
    {
      key: '/memory',
      icon: <BulbOutlined />,
      label: tp('sidebar.memory'),
    },
    {
      key: '/questioning',
      icon: <QuestionCircleOutlined />,
      label: tp('sidebar.questioning'),
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: tp('sidebar.users'),
    },
    {
      key: '/strategy',
      icon: <SettingOutlined />,
      label: tp('sidebar.strategy'),
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: tp('sidebar.logout'),
      onClick: handleLogout,
    },
  ];

  const currentLabel = useMemo(() => {
    return menuItems.find(item => item.key === location.pathname)?.label || 'AIDP Manager';
  }, [menuItems, location.pathname]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={200}
        theme="light"
      >
        <div className="logo">
          <img src={logoImage} alt="AIDP Manager Logo" className="logo-image" />
          {!collapsed && <h1>{tp('layout.header.title')}</h1>}
        </div>
        <Menu
          mode="inline"
          theme="light"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#ffffff',
          padding: '0 24px',
          borderBottom: '1px solid #E5E7EB',
        }}>
          <div className="header-content">
            <h2 style={{ margin: 0 }}>
              {currentLabel}
            </h2>
            <Space size="middle">
              <LanguageSwitcher style={{ width: 120 }} />
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <div className="user-info">
                  <Avatar
                    icon={<UserOutlined />}
                    style={{ marginRight: 8, backgroundColor: '#6366F1' }}
                  />
                  <span>{username}</span>
                </div>
              </Dropdown>
            </Space>
          </div>
        </Header>
        <Content style={{
          marginTop: '0',
          marginLeft: '12px',
          marginRight: '12px',
          marginBottom: '12px',
          background: '#F9FAFB',
          padding: '12px',
          borderRadius: '6px',
          minHeight: 'calc(100vh - 64px - 12px)'
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
