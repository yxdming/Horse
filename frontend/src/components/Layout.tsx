import React, { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Avatar } from 'antd';
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
import './Layout.css';
import logoImage from '../images/logo.png';

const { Header, Sider, Content } = Layout;

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

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
      label: '数据总览',
    },
    {
      key: '/knowledge',
      icon: <DatabaseOutlined />,
      label: '知识库管理',
    },
    {
      key: '/memory',
      icon: <BulbOutlined />,
      label: '记忆库管理',
    },
    {
      key: '/questioning',
      icon: <QuestionCircleOutlined />,
      label: '问数管理',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: '用户管理',
    },
    {
      key: '/strategy',
      icon: <SettingOutlined />,
      label: '问答策略',
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
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={200}
        theme="dark"
      >
        <div className="logo">
          <img src={logoImage} alt="AIDP Manager Logo" className="logo-image" />
          {!collapsed && <h1>AIDP Manager</h1>}
        </div>
        <Menu
          mode="inline"
          theme="dark"
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
          borderBottom: '1px solid #f0f0f0',
        }}>
          <div className="header-content">
            <h2 style={{ margin: 0 }}>
              {menuItems.find(item => item.key === location.pathname)?.label || 'AIDP Manager'}
            </h2>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="user-info">
                <Avatar
                  icon={<UserOutlined />}
                  style={{ marginRight: 8, backgroundColor: '#595959' }}
                />
                <span>{username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{
          margin: '24px',
          background: '#ffffff',
          padding: '24px',
          borderRadius: '4px',
          minHeight: 'calc(100vh - 64px - 48px)'
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
