# 登录认证功能说明

## 功能概述

系统已添加完整的登录认证功能，保护所有管理页面。

## 默认账号

- **用户名**: `admin`
- **密码**: `admin`

## 功能特性

### 1. 登录页面 (`/login`)

- ✅ 精美的登录界面设计
- ✅ 表单验证
- ✅ 加载状态显示
- ✅ 错误提示
- ✅ 自动跳转到之前访问的页面

### 2. 认证保护

- ✅ 所有管理页面都需要登录
- ✅ 未登录用户自动跳转到登录页
- ✅ 登录后自动返回原访问页面

### 3. 用户会话

- ✅ 使用 localStorage 存储登录状态
- ✅ 显示当前登录用户名
- ✅ 支持退出登录

### 4. Header 用户菜单

- ✅ 显示用户头像和用户名
- ✅ 下拉菜单包含退出登录选项
- ✅ 点击退出清除登录状态

## 使用流程

### 首次访问

1. 访问 `http://localhost:5173`
2. 自动跳转到登录页面
3. 输入用户名和密码（admin/admin）
4. 点击"登录"按钮
5. 登录成功后跳转到数据总览页面

### 退出登录

1. 点击右上角的用户头像/用户名
2. 在下拉菜单中选择"退出登录"
3. 自动跳转到登录页面

### 记住登录状态

- 登录状态保存在浏览器 localStorage
- 关闭浏览器后重新打开，仍然保持登录状态
- 除非主动退出或清除浏览器数据

## 技术实现

### 路由配置

```typescript
// 公开路由
<Route path="/login" element={<Login />} />

// 受保护路由
<Route path="/" element={
  <ProtectedRoute>
    <AppLayout />
  </ProtectedRoute>
}>
  <Route index element={<Dashboard />} />
  <Route path="knowledge" element={<Knowledge />} />
  <Route path="users" element={<Users />} />
  <Route path="strategy" element={<Strategy />} />
</Route>
```

### 认证逻辑

```typescript
// 登录验证
if (values.username === 'admin' && values.password === 'admin') {
  localStorage.setItem('user', JSON.stringify({
    username: values.username,
    loginTime: new Date().toISOString()
  }));
  navigate(from, { replace: true });
}

// 路由守卫检查
const user = localStorage.getItem('user');
if (!user) {
  return <Navigate to="/login" state={{ from: location }} replace />;
}
```

### 退出登录

```typescript
const handleLogout = () => {
  localStorage.removeItem('user');
  navigate('/login', { replace: true });
};
```

## 安全说明

### 当前实现（开发版本）

⚠️ **重要提示**: 当前登录认证为前端基础实现，适用于开发测试环境。

**特点**:
- ✅ 简单易用，快速部署
- ✅ 无需后端API支持
- ⚠️ 凭证硬编码在前端
- ⚠️ 无密码加密
- ⚠️ 无会话过期机制
- ⚠️ 不适合生产环境

### 生产环境建议

在生产环境使用时，建议实现以下功能：

1. **后端API认证**
   - 使用 JWT (JSON Web Token)
   - 实现真实的用户数据库
   - 密码加密存储（bcrypt）

2. **会话管理**
   - Token 过期机制
   - 自动刷新 Token
   - 多设备登录控制

3. **安全增强**
   - CSRF 保护
   - XSS 防护
   - 登录失败次数限制
   - 两步验证（2FA）

4. **用户权限**
   - 角色权限系统（RBAC）
   - 细粒度权限控制
   - 操作日志记录

## 升级到后端认证

### 1. 创建后端登录API

```python
# backend/app/api/auth.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
async def login(request: LoginRequest):
    # 验证用户凭证
    # 生成JWT token
    # 返回token和用户信息
    pass
```

### 2. 修改前端登录逻辑

```typescript
// 调用后端API
const response = await axios.post('/api/auth/login', {
  username: values.username,
  password: values.password
});

// 保存token
localStorage.setItem('token', response.data.token);
```

### 3. 添加API请求拦截器

```typescript
// 自动在请求中添加token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 自定义配置

### 修改默认账号

编辑 `frontend/src/pages/Login.tsx`:

```typescript
// 修改这部分
if (values.username === 'your_username' && values.password === 'your_password') {
  // ...
}
```

### 修改登录页面样式

编辑 `frontend/src/pages/Login.css`:

```css
/* 修改背景渐变 */
.login-container {
  background: linear-gradient(135deg, #your-color1 0%, #your-color2 100%);
}

/* 修改卡片宽度 */
.login-card {
  width: 400px; /* 修改为你想要的宽度 */
}
```

## 常见问题

### 1. 忘记密码

当前版本使用固定账号密码（admin/admin），如果忘记：
- 查看本说明文档
- 查看 `frontend/src/pages/Login.tsx` 源码

### 2. 无法登录

检查项：
- 用户名和密码是否正确（区分大小写）
- 浏览器控制台是否有错误
- localStorage 是否正常工作

### 3. 登录后立即退出

可能原因：
- localStorage 被禁用
- 浏览器隐私模式
- 清除浏览器数据后退出登录

### 4. 修改登录逻辑后的缓存问题

解决方法：
- 清除浏览器 localStorage
- 硬刷新页面（Ctrl+Shift+R）
- 重新启动开发服务器

## 文件清单

新增/修改的文件：

- ✅ `frontend/src/pages/Login.tsx` - 登录页面组件
- ✅ `frontend/src/pages/Login.css` - 登录页面样式
- ✅ `frontend/src/components/ProtectedRoute.tsx` - 路由守卫组件
- ✅ `frontend/src/components/Layout.tsx` - 更新：添加用户信息和退出功能
- ✅ `frontend/src/components/Layout.css` - 更新：添加用户信息样式
- ✅ `frontend/src/App.tsx` - 更新：添加登录路由和受保护路由

## 测试清单

- [ ] 访问首页自动跳转到登录页
- [ ] 输入错误密码显示错误提示
- [ ] 输入正确密码登录成功
- [ ] 登录后显示用户名
- [ ] 点击退出登录返回登录页
- [ ] 退出后无法直接访问受保护页面
- [ ] 浏览器刷新后保持登录状态

---

**更新时间**: 2026-03-06
**版本**: 1.1.0
**状态**: ✅ 已完成并可用
