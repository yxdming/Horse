# AIDP Manager - 快速开始指南

## 5分钟快速启动

### 前置要求
- Python 3.10 或更高版本
- Node.js 16 或更高版本
- Git（可选）

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

**注意**: 系统已配置为绑定到IP地址 7.250.75.172，可以通过本机IP或localhost访问。

## 首次使用

### 1. 登录系统
打开浏览器访问 http://localhost:5173，系统会自动跳转到登录页面。

**默认登录账号**:
- 用户名: `admin`
- 密码: `admin`

### 2. 访问前端
登录成功后，即可进入数据总览页面

### 3. 创建管理员账户
系统启动时会自动创建默认数据文件，你可以：
- 通过API创建用户
- 或使用API文档中的用户创建接口

### 4. 添加知识库文档
- 进入"知识库管理"页面
- 点击"新增文档"
- 填写标题、内容、分类和标签
- 系统会自动创建向量索引

### 5. 测试语义搜索
- 进入"知识库管理"页面
- 点击"语义搜索"按钮
- 输入查询内容，系统会返回最相关的文档（使用JSON文件打桩实现）

### 6. 配置问答策略
- 进入"问答策略"页面
- 调整Temperature、Top-K等参数
- 修改系统提示词
- 点击"保存配置"

## 常用功能

### 数据总览
- 查看用户、文档、问答统计
- 用户增长趋势图
- 问答量统计图
- 知识库分类分布

### 知识库管理
- 创建、编辑、删除文档
- 按分类和标签筛选
- 语义搜索
- 批量导入/导出

### 用户管理
- 添加新用户
- 分配角色（管理员/普通用户/只读用户）
- 启用/禁用用户
- 查看用户活动日志

### 问答策略
- 调整模型参数
- 配置检索策略
- 自定义系统提示词
- 实时预览配置

### 退出登录
- 点击右上角的用户头像
- 在下拉菜单中选择"退出登录"
- 系统会清除登录状态并返回登录页面

## 停止服务

### 使用脚本启动
- Windows: 在命令行窗口按 Ctrl+C
- Linux/Mac: 在终端按 Ctrl+C

### 手动启动
- 在后端和前端的终端窗口分别按 Ctrl+C

## 生产环境部署

详细的部署指南请参考 [README.md](README.md) 或使用以下命令：

```bash
# 使用Docker部署（推荐）
docker-compose up -d

# 或使用部署脚本
chmod +x deploy.sh
./deploy.sh
```

## 故障排除

### 端口被占用
如果8000或5173端口被占用，可以修改端口：
- 后端：编辑 `backend/run.py`
- 前端：编辑 `frontend/vite.config.ts`

### 依赖安装失败
```bash
# 后端
pip install --upgrade pip
pip install -r requirements.txt

# 前端
npm cache clean --force
npm install
```

### API连接失败
检查：
1. 后端是否正常运行
2. CORS配置是否正确
3. 防火墙是否阻止连接

## 获取帮助

- 查看 [README.md](README.md) 了解详细文档
- 访问 API 文档: http://localhost:8000/api/docs
- 检查日志文件排查问题

## 下一步

- 配置真实的AI模型接口
- 设置数据备份策略
- 配置HTTPS和域名
- 设置监控和日志收集

祝你使用愉快！
