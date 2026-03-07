# 开发指南

本文档提供AIDP Manager的开发、部署和配置指南。

## 📋 目录

- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [开发环境设置](#开发环境设置)
- [开发指南](#开发指南)
- [部署指南](#部署指南)
- [配置说明](#配置说明)

---

## 🚀 快速开始

### 环境要求

- **Python**: 3.10 或更高版本
- **Node.js**: 16 或更高版本
- **Git**: (可选)

### 方法1: 使用启动脚本（推荐）

#### Windows用户
双击运行 `start-dev.bat` 文件，或在命令行中执行：
```cmd
start-dev.bat
```

#### Linux/Mac用户
```bash
chmod +x start-dev.sh
./start-dev.sh
```

### 方法2: 手动启动

#### 1. 启动后端
```bash
cd backend
pip install -r requirements.txt
python run.py
```

#### 2. 启动前端（新终端窗口）
```bash
cd frontend
npm install
npm run dev
```

### 访问系统

启动成功后，在浏览器中打开：
- **前端界面**: http://7.250.75.172:5173 或 http://localhost:5173
- **后端API**: http://7.250.75.172:8000 或 http://localhost:8000
- **API文档**: http://7.250.75.172:8000/api/docs 或 http://localhost:8000/api/docs

### 首次登录

- **默认用户名**: `admin`
- **默认密码**: `admin`

---

## 📁 项目结构

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
├── CHANGELOG.md                 # 更新日志
├── README.md                    # 项目说明
├── DEVELOPMENT.md               # 开发指南（本文档）
└── TROUBLESHOOTING.md           # 故障排除
```

---

## 🔧 开发环境设置

### 后端开发

1. **安装Python依赖**
```bash
cd backend
pip install -r requirements.txt
```

2. **运行开发服务器**
```bash
python run.py
```

后端服务将在 `http://localhost:8000` 启动

### 前端开发

1. **安装Node.js依赖**
```bash
cd frontend
npm install
```

2. **运行开发服务器**
```bash
npm run dev
```

前端应用将绑定到本机IP地址启动：
- **通过IP访问**: http://7.250.75.172:5173
- **本地访问**: http://localhost:5173

### 代码规范

- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **TypeScript**: 类型检查

运行代码检查：
```bash
npm run lint
```

---

## 📚 开发指南

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

### 重要开发原则

#### SOLID原则
- **单一职责**: 每个组件/函数只负责一件事
- **开闭原则**: 对扩展开放，对修改关闭
- **里氏替换**: 子类可以替换父类
- **接口隔离**: 接口应该细粒度
- **依赖倒置**: 依赖抽象而非具体实现

#### 代码规范
- **KISS**: 保持简单，避免过度设计
- **DRY**: 不要重复代码
- **YAGNI**: 你不会需要它（避免过度设计）
- **命名规范**: 使用有意义的变量和函数名

#### API路由顺序
在FastAPI中，**固定路径必须在动态路径之前**：
```python
# ✅ 正确
@router.get("/stats")           # 固定路径
@router.get("/{id}")            # 动态路径

# ❌ 错误
@router.get("/{id}")            # 会匹配所有路径
@router.get("/stats")           # 永远无法访问
```

---

## 🚢 部署指南

### 生产环境配置

#### 后端部署
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### 前端构建
```bash
cd frontend
npm run build
```

构建产物在 `frontend/dist/` 目录

### 防火墙配置

**Windows**:
```powershell
# 允许端口
netsh advfirewall firewall add rule name="AIDP Manager Frontend" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="AIDP Manager Backend" dir=in action=allow protocol=TCP localport=8000
```

**Linux (UFW)**:
```bash
ufw allow 5173/tcp
ufw allow 8000/tcp
```

**Linux (firewalld)**:
```bash
firewall-cmd --permanent --add-port=5173/tcp
firewall-cmd --permanent --add-port=8000/tcp
firewall-cmd --reload
```

---

## ⚙️ 配置说明

### CORS配置

在 `backend/app/main.py` 中修改允许的前端地址：

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # 修改为实际前端地址
        "http://7.250.75.172:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 网络配置

前端服务器配置文件：`frontend/vite.config.ts`

```typescript
server: {
  host: '7.250.75.172',  // 修改为实际IP地址
  port: 5173,            // 端口号
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

### 数据持久化

- JSON文件存储在 `backend/data/` 目录
- 向量数据存储在 `backend/vectors/` 目录
- 系统会在启动时自动创建默认数据文件

### 环境变量

当前版本使用配置文件，如需使用环境变量：

**后端 (.env)**:
```
DATABASE_URL=sqlite:///./aidp.db
SECRET_KEY=your-secret-key
DEBUG=False
```

**前端 (.env)**:
```
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 🧪 测试

### 运行测试

**前端测试**:
```bash
cd frontend
npm run lint
```

**后端测试**:
```bash
cd backend
pytest tests/
```

### API测试

访问Swagger UI进行API测试：
- 开发环境: http://localhost:8000/api/docs
- 生产环境: http://7.250.75.172:8000/api/docs

---

## 🐛 故障排除

详细故障排除指南请查看 [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### 常见问题

1. **向量检索说明**
   当前版本使用JSON文件实现向量检索的Mock版本

2. **CORS错误**
   检查后端 `main.py` 中的 `allow_origins` 配置

3. **数据文件丢失**
   系统会在启动时自动创建默认的数据文件

4. **路由冲突**
   确保固定路径定义在动态路径之前

---

## 📞 支持

如有问题或建议，请：
1. 查看更新日志：[CHANGELOG.md](CHANGELOG.md)
2. 查看故障排除：[TROUBLESHOOTING.md](TROUBLESHOOTING.md)
3. 提交Issue或Pull Request

---

**最后更新**: 2026-03-07
**版本**: 1.0.0
