# 更新日志

本文档记录AIDP Manager的所有重要变更和功能更新。

## [1.0.0] - 2026-03-07

### ✨ 新功能

#### 记忆库管理系统
- 独立的记忆库管理页面（左侧导航栏）
- 记忆列表管理（CRUD操作）
- 记忆库模板管理系统
- 用户权限管理功能
- 三种记忆类型（长期、短期、工作记忆）
- 五级重要性评分（1-5星）
- 访问次数和最后访问时间跟踪

#### 问数管理功能
- 数据库管理（MySQL、PostgreSQL、Oracle、SQL Server）
- 行业黑话/术语词典管理
- Text-to-SQL自然语言问数功能
- 问数历史记录和统计
- 数据库连接测试功能

### 🔧 技术改进

#### 项目重命名
- 项目名称从"AIDP Manager Beta"简化为"AIDP Manager"
- 更新所有文档、脚本、API响应中的项目名称

#### 主题更新
- **最新**: Dark Modern暗色现代风格
  - 深色背景配合蓝色主色调
  - 高对比度，确保文字清晰可读
  - 现代科技感设计

- **历史变更**: 灰白色调简约风格 → 暗色现代风格

### 🐛 Bug修复

#### API路由顺序修复
- 修复memory API路由顺序问题（/types/list, /categories/list）
- 修复questioning API路由顺序问题（/glossaries/search, /history/stats）
- 确保FastAPI正确匹配路由优先级
- 解决ERR_EMPTY_RESPONSE错误

#### 登录功能
- 实现完整的用户认证系统
- 添加路由守卫组件
- JWT token管理
- 用户信息和退出登录功能

### 📝 文档更新

- 新增快速开始指南
- 新增设计指南
- 新增故障排除文档
- 新增网络配置说明
- 新增向量检索实现说明
- 完善API文档和实施文档

---

## 早期开发记录

### 初始化阶段
- 项目结构初始化（前后端分离架构）
- FastAPI后端 + React 18 + TypeScript前端
- Ant Design 5.x UI组件库
- JSON文件数据存储
- 基础CRUD功能实现

### 功能模块
- 数据总览页面（Dashboard）
- 知识库管理
- 用户管理
- 问答策略配置
- 向量检索（Mock实现）

---

## 技术栈

### 后端
- FastAPI 0.104.1
- Python 3.10+
- Uvicorn服务器
- JSON文件存储

### 前端
- React 18
- TypeScript 5.2
- Vite 5.4
- Ant Design 5.12
- React Router v6
- Axios
- ECharts

### 开发工具
- ESLint + Prettier
- Git版本控制
- 热重载开发服务器
