import React, { useState, useEffect, useMemo } from 'react';
import { Layout, Menu, Dropdown, Avatar, Space, Breadcrumb, Button } from 'antd';
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
  BookOutlined,
  FileTextOutlined,
  MessageOutlined,
  RightOutlined,
  RollbackOutlined,
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
      key: '/questioning',
      icon: <QuestionCircleOutlined />,
      label: tp('sidebar.questioning'),
    },
    {
      key: '/knowledge',
      icon: <DatabaseOutlined />,
      label: tp('sidebar.knowledge'),
      children: [
        {
          key: '/knowledge-base',
          icon: <BookOutlined />,
          label: tp('sidebar.knowledgeBase'),
        },
        {
          key: '/glossary',
          icon: <FileTextOutlined />,
          label: tp('sidebar.glossary'),
        },
        {
          key: '/prompts',
          icon: <MessageOutlined />,
          label: tp('sidebar.prompts'),
        },
      ],
    },
    {
      key: '/memory',
      icon: <BulbOutlined />,
      label: tp('sidebar.memory'),
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

  const handleSwitchToRubik = () => {
    // 跳转到 RubikSQL 应用
    window.location.href = 'http://localhost:32744';
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

    // 创建扁平化的菜单项映射，包括所有子菜单项
    const menuItemsMap = new Map<string, { label: string; parentPath?: string }>();
    menuItems.forEach(item => {
      menuItemsMap.set(item.key, { label: item.label as string });
      // 如果有子菜单，也添加到映射中
      if (item.children) {
        item.children.forEach((child: any) => {
          menuItemsMap.set(child.key, {
            label: child.label as string,
            parentPath: item.key as string,
          });
        });
      }
    });

    // 根据当前路径添加面包屑项
    const pathSegments = location.pathname.split('/').filter(Boolean);

    if (pathSegments.length === 0) {
      // 首页 - 显示Home图标和页面名称，保持和其他页面一致的格式
      items.push({
        title: <span style={{ fontSize: 14 }}><HomeOutlined /></span>,
        onClick: () => navigate('/'),
      });
      items.push({
        title: <span style={{ fontSize: 14, color: '#24292F', fontWeight: 500 }}>{tp('sidebar.dashboard')}</span>,
      });
    } else {
      // 首先添加Home图标（可点击返回首页）
      items.push({
        title: <span style={{ fontSize: 14 }}><HomeOutlined /></span>,
        onClick: () => navigate('/'),
      });

      // 检查当前路径是否是子菜单项
      const currentMenuItem = menuItemsMap.get(location.pathname);

      if (currentMenuItem?.parentPath) {
        // 如果是子菜单项，先添加父级菜单
        const parentItem = menuItemsMap.get(currentMenuItem.parentPath);
        if (parentItem) {
          items.push({
            title: <span style={{ fontSize: 14, color: '#57606A', fontWeight: 400 }}>{parentItem.label}</span>,
            onClick: () => navigate(currentMenuItem.parentPath!),
          });
        }
        // 然后添加当前子菜单项
        items.push({
          title: <span style={{ fontSize: 14, color: '#24292F', fontWeight: 500 }}>{currentMenuItem.label}</span>,
        });
      } else if (currentMenuItem) {
        // 如果是普通菜单项，直接添加
        items.push({
          title: <span style={{ fontSize: 14, color: '#24292F', fontWeight: 500 }}>{currentMenuItem.label}</span>,
        });
      }
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
          expandIcon={({ isOpen }) => (isOpen ? <RightOutlined rotate={90} /> : <RightOutlined />)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#ffffff',
          padding: '0 24px',
        }}>
          <div className="header-content">
            <Breadcrumb items={breadcrumbItems} style={{ margin: 0 }} />
            <Space size="middle">
              <LanguageSwitcher style={{ width: 120 }} />
              <Button
                type="text"
                icon={<RollbackOutlined />}
                onClick={handleSwitchToRubik}
                style={{
                  borderRadius: 8,
                  padding: '4px 12px',
                  transition: 'all 0.3s ease',
                }}
                className="hover:text-indigo-600 hover:bg-indigo-50"
              >
                返回 RubikSQL
              </Button>
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
          marginLeft: '0',
          marginRight: '12px',
          marginBottom: '12px',
          background: '#F3F4F6',
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
