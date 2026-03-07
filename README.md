# AIDP Manager

**AI Data Platform Manager** - 企业级智能数据管理平台，提供知识库管理、记忆库管理、用户管理和智能问数功能。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.10+-green.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/react-18+-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/fastapi-0.104+-red.svg)](https://fastapi.tiangolo.com/)

## ✨ 核心功能

### 📊 数据总览
- 实时统计数据卡片（用户、文档、问答量）
- 用户增长趋势图（30天）
- 问答量统计图（7天）
- 知识库分类分布饼图
- 系统性能指标监控

### 📚 知识库管理
- 文档CRUD操作（创建、编辑、删除）
- 分类和标签管理
- 语义搜索功能
- 批量导入/导出
- 向量索引管理

### 💡 记忆库管理
- 三种记忆类型（长期、短期、工作记忆）
- 记忆模板系统
- 用户权限管理
- 五级重要性评分
- 访问次数和时间跟踪

### 🤖 智能问数
- **数据库管理**: 支持MySQL、PostgreSQL、Oracle、SQL Server
- **行业黑话**: 业务术语词典映射
- **Text-to-SQL**: 自然语言转SQL查询
- **问数历史**: 完整的历史记录和统计

### 👥 用户管理
- 用户列表展示（分页、搜索）
- 角色管理（管理员、普通用户、只读用户）
- 用户状态管理（启用/禁用）
- 批量操作支持

### ⚙️ 问答策略
- 模型参数调整（Temperature、Max Tokens）
- 检索策略配置（Top-K、相似度阈值）
- 系统提示词管理
- 配置实时预览

## 🚀 快速开始

### 环境要求
- Python 3.10+
- Node.js 16+

### 快速启动

**Windows**:
```cmd
start-dev.bat
```

**Linux/Mac**:
```bash
./start-dev.sh
```

**手动启动**:
```bash
# 后端
cd backend && python run.py

# 前端
cd frontend && npm install && npm run dev
```

### 访问地址
- **前端**: http://localhost:5173
- **后端API**: http://localhost:8000
- **API文档**: http://localhost:8000/api/docs

### 默认账号
- 用户名: `admin`
- 密码: `admin`

## 📖 文档

- 📋 [更新日志](CHANGELOG.md) - 版本历史和功能变更
- 🔧 [开发指南](DEVELOPMENT.md) - 开发、部署和配置
- 🛠️ [故障排除](TROUBLESHOOTING.md) - 常见问题解决

## 🛠️ 技术栈

### 后端
- **框架**: FastAPI 0.104.1
- **服务器**: Uvicorn
- **数据存储**: JSON文件
- **API文档**: Swagger/OpenAPI

### 前端
- **框架**: React 18 + TypeScript
- **UI库**: Ant Design 5.x
- **路由**: React Router v6
- **HTTP客户端**: Axios
- **图表**: ECharts
- **构建工具**: Vite

## 📂 项目结构

```
aidp/
├── backend/          # FastAPI后端
├── frontend/         # React前端
├── CHANGELOG.md      # 更新日志
├── DEVELOPMENT.md    # 开发指南
├── README.md         # 项目说明
└── TROUBLESHOOTING.md # 故障排除
```

## 🎨 设计风格

系统采用**Dark Modern暗色现代**设计风格：
- **主色调**: 现代蓝色 (#177ddc)
- **背景色**: 深黑 (#0a0a0a)
- **科技感**: 发光阴影、蓝色主题
- **现代化**: 流畅动画、渐变效果

## 📝 开发指南

### 添加新功能
1. 后端: 在 `backend/app/` 创建模型、服务、API
2. 前端: 在 `frontend/src/pages/` 创建页面组件
3. 路由: 在 `App.tsx` 添加路由
4. 类型: 在 `types/index.ts` 定义类型

### API开发规范
- 固定路径必须在动态路径之前
- 遵循RESTful设计原则
- 使用Pydantic进行数据验证
- 添加详细的API文档

详细开发指南请查看 [DEVELOPMENT.md](DEVELOPMENT.md)

## 🌐 网络配置

系统已配置为绑定到IP地址 `7.250.75.172`，支持：
- **IP访问**: http://7.250.75.172:5173
- **本地访问**: http://localhost:5173

修改网络配置请查看 [DEVELOPMENT.md](DEVELOPMENT.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**最后更新**: 2026-03-07
**版本**: 1.0.0
**状态**: 🟢 稳定版本

## 功能特性

### 1. 数据总览
- 实时统计数据卡片（用户、文档、问答量）
- 用户增长趋势图（30天）
- 问答量统计图（7天）
- 知识库分类分布饼图
- 系统性能指标监控

### 2. 知识库管理
- 文档CRUD操作（创建、编辑、删除）
- 分类和标签管理
- 富文本编辑器支持
- 语义搜索（基于JSON文件的模拟向量检索）
- 批量导入/导出功能
- 向量索引管理（打桩实现）

### 3. 用户管理
- 用户列表展示（分页、搜索）
- 角色管理（管理员、普通用户、只读用户）
- 用户状态管理（启用/禁用）
- 用户信息编辑
- 批量操作支持

### 4. 问答策略配置
- 模型参数调整（Temperature、Max Tokens）
- 检索策略配置（Top-K、相似度阈值）
- 系统提示词管理
- 配置实时预览
- 一键恢复默认配置

## 技术栈

### 后端
- **框架**: FastAPI (Python 3.10+)
- **服务器**: Uvicorn
- **数据存储**: JSON文件
- **向量检索**: 基于JSON文件的模拟向量检索（打桩实现）
- **API文档**: Swagger/OpenAPI

### 前端
- **框架**: React 18 + TypeScript
- **UI库**: Ant Design 5.x
- **路由**: React Router v6
- **HTTP客户端**: axios
- **图表**: ECharts
- **构建工具**: Vite

## 快速开始

### 环境要求
- Python 3.10+
- Node.js 16+
- npm 或 yarn

### 后端启动

```bash
# 进入后端目录
cd backend

# 安装依赖
pip install -r requirements.txt

# 启动开发服务器
python run.py
```

后端服务将在 `http://localhost:8000` 启动

API文档: `http://localhost:8000/api/docs`

### 前端启动

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端应用将绑定到本机IP地址启动：
- **通过IP访问**: http://7.250.75.172:5173
- **本地访问**: http://localhost:5173

详细的网络配置说明请查看 [NETWORK_CONFIG.md](NETWORK_CONFIG.md)

### 登录系统

- **默认用户名**: `admin`
- **默认密码**: `admin`

首次访问系统会自动跳转到登录页面，输入默认账号即可登录。

详细的登录功能说明请查看 [LOGIN_GUIDE.md](LOGIN_GUIDE.md)

## 项目结构

```
aidp/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI应用入口
│   │   ├── models/              # 数据模型
│   │   ├── services/            # 业务逻辑
│   │   ├── api/                 # API路由
│   │   └── utils/               # 工具函数
│   ├── data/                    # JSON数据存储
│   ├── vectors/                 # 向量数据库
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/               # 页面组件
│   │   ├── components/          # 通用组件
│   │   ├── services/            # API调用
│   │   └── types/               # TypeScript类型
│   └── package.json
└── README.md
```

## 开发指南

### 添加新的API端点

1. 在 `backend/app/models/` 定义数据模型
2. 在 `backend/app/services/` 实现业务逻辑
3. 在 `backend/app/api/` 创建路由
4. 在 `backend/app/main.py` 注册路由

### 添加新的前端页面

1. 在 `frontend/src/pages/` 创建页面组件
2. 在 `frontend/src/types/` 定义类型
3. 在 `frontend/src/services/api.ts` 添加API调用
4. 在 `frontend/src/App.tsx` 添加路由

## 生产部署

### 后端部署

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 前端构建

```bash
cd frontend
npm run build
```

构建产物在 `frontend/dist/` 目录，可部署到任何静态文件服务器。

## 配置说明

### CORS配置
在 `backend/app/main.py` 中修改允许的前端地址：

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # 修改为实际前端地址
    ...
)
```

### 数据持久化
- JSON文件存储在 `backend/data/` 目录
- 向量数据存储在 `backend/vectors/` 目录

## 常见问题

### 1. 向量检索说明
当前版本使用JSON文件实现向量检索的打桩（Mock）版本，不依赖ChromaDB和sentence-transformers。这对于开发测试已经足够，生产环境建议升级为真实的向量数据库。

### 2. CORS错误
检查后端 `main.py` 中的 `allow_origins` 配置。

### 3. 数据文件丢失
系统会在启动时自动创建默认的数据文件，但建议定期备份 `backend/data/` 目录。

### 4. 升级到真实向量检索
如需使用真实的向量检索功能，可以：
1. 在 `requirements.txt` 中添加 `chromadb` 和 `sentence-transformers`
2. 修改 `vector_service.py` 使用真实的ChromaDB客户端
3. 重新安装依赖并重启服务

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
