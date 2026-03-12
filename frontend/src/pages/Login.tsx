import React, { useState, useMemo } from 'react';
import { Form, Input, Button, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../services/api';
import { useTranslation } from '../contexts/LanguageContext';
import { createTranslateProxy } from '../utils/i18n';
import { useApp } from '../hooks/useApp';
import './Login.css';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const tp = useMemo(() => createTranslateProxy(t), [t]);
  const { message } = useApp();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      setLoading(true);

      // 调用后端登录 API
      const response = await authApi.login(values.username, values.password);

      // 保存登录状态和 token
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      message.success(tp('login.loginSuccess'));

      // 跳转到之前访问的页面或首页
      navigate(from, { replace: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : tp('login.loginFailed');
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-header">
          <h1>{tp('login.title')}</h1>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: tp('login.usernamePlaceholder') }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={tp('login.username')}
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: tp('login.passwordPlaceholder') }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={tp('login.password')}
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              {tp('login.loginButton')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
