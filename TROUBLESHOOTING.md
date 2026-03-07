# 常见问题排查指南

## 前端问题

### 1. 页面空白 - "Input is not defined" 错误

**问题症状**: 浏览器控制台显示 `Uncaught ReferenceError: Input is not defined`

**原因**: Strategy.tsx 中使用了 `Input` 组件的 `TextArea`，但没有导入 `Input`

**解决方案**:
```typescript
// 在 Strategy.tsx 中添加 Input 导入
import {
  Card,
  Form,
  Input,        // 添加这行
  InputNumber,
  // ...
} from 'antd';
```

**已修复**: ✅ 此问题已在最新代码中修复

### 2. 前端构建失败 - TypeScript 错误

**问题症状**: 运行 `npm run build` 时出现 TypeScript 编译错误

**常见原因**:
- 未使用的导入
- 类型不匹配

**解决方案**:
```bash
# 清理并重新安装依赖
cd frontend
rm -rf node_modules package-lock.json
npm install

# 重新构建
npm run build
```

### 3. 前端无法连接后端 API

**问题症状**: 浏览器网络请求失败，CORS 错误

**检查项**:
1. 后端是否正常运行（访问 http://localhost:8000/health）
2. 前端代理配置是否正确（vite.config.ts）
3. CORS 配置是否允许前端地址

**解决方案**:
```typescript
// frontend/vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

## 后端问题

### 1. ChromaDB 错误 - "chroma_server_nofile"

**问题症状**: `unable to infer type for attribute "chroma_server_nofile"`

**原因**: ChromaDB 版本兼容性问题

**解决方案**:
- ✅ 已修复：移除 ChromaDB 依赖，使用 JSON 文件打桩实现
- 参见 `VECTOR_STUB_CHANGES.md`

### 2. 模块导入错误

**问题症状**: `ModuleNotFoundError: No module named 'xxx'`

**解决方案**:
```bash
cd backend
pip install -r requirements.txt

# 或使用虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

### 3. 端口已被占用

**问题症状**: 启动失败，提示端口 8000 或 5173 已被使用

**解决方案**:
```bash
# 查找占用端口的进程
# Linux/Mac
lsof -i :8000
lsof -i :5173

# Windows
netstat -ano | findstr :8000
netstat -ano | findstr :5173

# 杀死进程
kill -9 <PID>  # Linux/Mac
taskkill /PID <PID> /F  # Windows
```

或修改配置文件使用其他端口：
- 后端: `backend/run.py`
- 前端: `frontend/vite.config.ts`

## 数据问题

### 1. 数据文件丢失

**问题症状**: 启动后找不到数据，API 返回空数据

**解决方案**:
```bash
# 系统会自动创建默认数据文件
# 检查 backend/data/ 目录
ls -la backend/data/

# 应该包含以下文件：
# - users.json
# - knowledge.json
# - config.json
# - vectors.json
```

### 2. 向量数据损坏

**问题症状**: 语义搜索返回错误或空结果

**解决方案**:
```bash
# 通过 API 重建索引
curl -X POST http://localhost:8000/api/knowledge/vectors/rebuild

# 或在前端界面点击"重建索引"按钮
```

## 性能问题

### 1. 前端加载缓慢

**优化建议**:
- 启用生产构建：`npm run build`
- 使用 CDN 加速 Ant Design
- 启用路由懒加载

### 2. 后端响应慢

**优化建议**:
- 使用分页查询，避免一次性加载大量数据
- 添加缓存层（Redis）
- 升级到真实向量数据库（ChromaDB）

## 开发环境问题

### 1. 依赖冲突

**解决方案**:
```bash
# 清理所有依赖和缓存
cd frontend
rm -rf node_modules .vite dist package-lock.json
npm cache clean --force
npm install

cd ../backend
rm -rf venv __pycache__
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. 热重载不工作

**解决方案**:
```bash
# 前端：确保使用开发模式
npm run dev

# 后端：使用 uvicorn --reload
uvicorn app.main:app --reload
```

## 日志和调试

### 启用详细日志

**前端**:
```typescript
// 在浏览器控制台
localStorage.debug = '*'
```

**后端**:
```python
# 在 run.py 中
uvicorn.run(
    "app.main:app",
    log_level="debug"  # 改为 debug
)
```

### 查看日志文件

```bash
# 后端日志
tail -f backend/logs/*.log

# 前端浏览器控制台
# F12 打开开发者工具 -> Console 标签
```

## 获取帮助

如果以上方案都无法解决问题：

1. 查看完整错误信息
2. 检查系统日志
3. 参考项目文档：
   - `README.md` - 完整文档
   - `QUICKSTART.md` - 快速开始
   - `VECTOR_STUB_CHANGES.md` - 向量检索说明
   - `UPGRADE_GUIDE.md` - 升级指南

## 版本信息

- 前端: React 18 + TypeScript + Vite 5.4
- 后端: FastAPI 0.104 + Python 3.10+
- UI: Ant Design 5.12

最后更新: 2026-03-06
