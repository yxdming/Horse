import React, { useState, useEffect, useMemo } from 'react';
import { Layout, Menu, Dropdown, Avatar, Space, Breadcrumb } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  DatabaseOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BulbOutlined,
  QuestionCircleOutlined,
  HomeOutlined,
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

  // 生成面包屑导航
  const breadcrumbItems = useMemo(() => {
    const items: Array<{ title: React.ReactNode; onClick?: () => void }> = [];

    // 根据当前路径添加面包屑项
    const pathSegments = location.pathname.split('/').filter(Boolean);

    if (pathSegments.length === 0) {
      // 首页 - 只显示标题，不需要可点击
      items.push({
        title: <span style={{ fontSize: 14, color: '#24292F', fontWeight: 500 }}><HomeOutlined /> {tp('sidebar.dashboard')}</span>,
      });
    } else {
      // 首先添加Home图标（可点击返回首页）
      items.push({
        title: <span style={{ fontSize: 14 }}><HomeOutlined /></span>,
        onClick: () => navigate('/'),
      });

      // 构建路径面包屑
      let currentPath = '';
      pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        const menuItem = menuItems.find(item => item.key === currentPath);

        if (menuItem) {
          const isLast = index === pathSegments.length - 1;
          items.push({
            title: <span style={{ fontSize: 14, color: isLast ? '#24292F' : '#57606A', fontWeight: isLast ? 500 : 400 }}>{menuItem.label}</span>,
            ...(isLast ? {} : { onClick: () => navigate(currentPath) }),
          });
        }
      });
    }

    return items;
  }, [location.pathname, menuItems, navigate, tp]);

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
            <Breadcrumb items={breadcrumbItems} style={{ margin: 0 }} />
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
