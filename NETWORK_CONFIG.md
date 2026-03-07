# 网络配置说明

## 当前配置

### IP地址绑定

前端服务已配置为绑定到本机IP地址：**7.250.75.172**

### 访问地址

**通过本机IP访问**:
- 前端界面: http://7.250.75.172:5173
- 后端API: http://7.250.75.172:8000
- API文档: http://7.250.75.172:8000/api/docs

**通过localhost访问**（本地仍然可用）:
- 前端界面: http://localhost:5173
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/api/docs

## 配置文件

### 前端配置

**文件**: `frontend/vite.config.ts`

```typescript
server: {
  host: '7.250.75.172',  // 绑定的IP地址
  port: 5173,            // 端口号
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
},
```

### 后端配置

**文件**: `backend/app/main.py`

```python
# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://7.250.75.172:5173",  # 新增IP地址
        "http://7.250.75.172:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 修改IP地址

### 修改前端绑定IP

编辑 `frontend/vite.config.ts`:

```typescript
server: {
  host: '你的新IP地址',  // 修改这里
  port: 5173,
  // ...
},
```

### 修改后端CORS配置

编辑 `backend/app/main.py`:

```python
allow_origins=[
    "http://localhost:5173",
    "http://你的新IP地址:5173",  # 添加你的新IP
    // ...
],
```

### 更新启动脚本

**Windows** (`start-dev.bat`):
```batch
echo Frontend:   http://你的新IP地址:5173
```

**Linux/Mac** (`start-dev.sh`):
```bash
echo "Frontend:   http://你的新IP地址:5173"
```

## 网络访问

### 局域网访问

其他设备在同一局域网内可以通过以下方式访问：

1. **通过IP地址**: http://7.250.75.172:5173
2. **确保防火墙允许**:
   - Windows: 允许端口 5173 和 8000
   - Linux: `sudo ufw allow 5173` 和 `sudo ufw allow 8000`
   - Mac: 系统偏好设置 -> 安全性与隐私 -> 防火墙

### 防火墙配置

**Windows**:
```powershell
# 允许端口
netsh advfirewall firewall add rule name="AIDP Frontend" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="AIDP Backend" dir=in action=allow protocol=TCP localport=8000
```

**Linux (UFW)**:
```bash
sudo ufw allow 5173/tcp
sudo ufw allow 8000/tcp
sudo ufw reload
```

**Mac**:
```bash
# 添加防火墙规则（需要管理员权限）
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/bin/python3
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /node
```

## 端口说明

| 服务 | 端口 | 用途 |
|------|------|------|
| 前端 | 5173 | Vite开发服务器 |
| 后端 | 8000 | FastAPI应用 |
| API文档 | 8000/api/docs | Swagger UI |

## 故障排查

### 1. 无法访问前端

**症状**: 浏览器无法打开 http://7.250.75.172:5173

**解决方案**:
1. 检查IP地址是否正确: `ipconfig` (Windows) 或 `ifconfig` (Linux/Mac)
2. 检查防火墙设置
3. 确认前端服务正在运行
4. 尝试用 localhost 访问: http://localhost:5173

### 2. CORS错误

**症状**: 浏览器控制台显示CORS错误

**解决方案**:
1. 检查后端 `main.py` 中的 `allow_origins` 配置
2. 确保前端地址在允许列表中
3. 重启后端服务

### 3. API请求失败

**症状**: 前端加载但API请求失败

**解决方案**:
1. 检查后端是否正常运行
2. 检查Vite代理配置
3. 确认后端端口8000未被占用
4. 查看浏览器控制台和网络请求详情

### 4. IP地址变化

**症状**: IP地址改变后无法访问

**解决方案**:
1. 更新 `frontend/vite.config.ts` 中的 `host`
2. 更新 `backend/app/main.py` 中的 `allow_origins`
3. 更新启动脚本中的显示信息
4. 重启前后端服务

## 绑定到所有网络接口

如果需要绑定到所有可用的网络接口（不只是特定IP），可以使用：

```typescript
// frontend/vite.config.ts
server: {
  host: '0.0.0.0',  // 绑定到所有接口
  port: 5173,
  // ...
},
```

**注意**: 使用 `0.0.0.0` 时，服务可以从任何网络接口访问，包括局域网内的其他设备。

## 安全建议

### 开发环境
- ✅ 使用防火墙限制访问
- ✅ 仅允许必要的端口
- ✅ 定期更新依赖包
- ⚠️ 不要在生产环境使用开发服务器

### 生产环境
- 🔐 使用反向代理（Nginx）
- 🔐 启用HTTPS（SSL证书）
- 🔐 配置防火墙规则
- 🔐 使用环境变量管理配置
- 🔐 定期安全审计

## 示例场景

### 场景1: 局域网团队协作

**需求**: 团队成员需要访问你的开发环境

**配置**:
```typescript
// 绑定到所有接口
server: {
  host: '0.0.0.0',
  port: 5173,
}
```

**访问**: 其他设备通过 `http://你的IP:5173` 访问

### 场景2: 多IP地址

**需求**: 服务器有多个IP地址

**配置**: 选择一个主要IP或使用 `0.0.0.0`

### 场景3: 远程开发

**需求**: 在远程服务器上开发

**配置**:
```typescript
server: {
  host: '0.0.0.0',  // 允许远程访问
  port: 5173,
}
```

**注意**: 确保服务器安全配置正确

## 相关文档

- **README.md** - 项目总体说明
- **QUICKSTART.md** - 快速开始指南
- **TROUBLESHOOTING.md** - 故障排查指南

---

**配置更新**: 2026-03-06
**IP地址**: 7.250.75.172
**版本**: 1.2.1
