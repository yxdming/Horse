# AIDP Frontend - Docker 部署完整指南

> AIDP 前端应用的 Docker 容器化部署方案，支持多种架构和部署场景

**最后更新**: 2026-03-12
**版本**: 1.0.0
**维护者**: AIDP Team

---

## 📋 目录

- [概述](#概述)
- [快速开始](#快速开始)
- [Docker 镜像方案](#docker-镜像方案)
- [部署场景](#部署场景)
- [ARM64 支持](#arm64-支持)
- [后端配置](#后端配置)
- [依赖分析](#依赖分析)
- [常用命令](#常用命令)
- [故障排查](#故障排查)
- [最佳实践](#最佳实践)

---

## 🎯 概述

### 技术栈

- **框架**: React 18.2.0 + TypeScript
- **构建工具**: Vite 5.4.21
- **UI 组件**: Ant Design 5.12.0
- **Web 服务器**: Nginx 1.25 (Alpine)
- **支持架构**: AMD64, ARM64

### 特性

✅ **多架构支持** - 同时支持 x86_64 和 ARM64 架构
✅ **灵活配置** - 环境变量动态配置后端地址
✅ **安全优化** - 非 root 用户运行，最小化镜像
✅ **多种方案** - 生产、开发、离线三种部署模式
✅ **完整文档** - 详细的部署和维护指南

---

## 🚀 快速开始

### 前置要求

- Docker >= 19.03
- Docker Compose (可选)
- Git

### 方式 1: 使用 Makefile（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd frontend

# 构建生产镜像
make build

# 运行容器
make run

# 查看日志
make logs

# 停止服务
make stop
```

### 方式 2: 使用 Docker Compose

```bash
# 启动生产环境
docker-compose --profile production up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 方式 3: 使用 Docker 命令

```bash
# 构建镜像
docker build -f Dockerfile.optimized -t aidp-frontend:latest .

# 运行容器
docker run -d \
  --name aidp-frontend \
  -p 80:80 \
  -e BACKEND_URL=http://backend:8000 \
  aidp-frontend:latest

# 查看日志
docker logs -f aidp-frontend
```

### 访问应用

浏览器打开: `http://localhost`

---

## 🐳 Docker 镜像方案

### 方案对比

| 方案 | 文件 | 大小 | 端口 | 适用场景 |
|------|------|------|------|----------|
| **优化版** | `Dockerfile.optimized` | ~50MB | 80 | 生产环境 ⭐推荐 |
| **完整版** | `Dockerfile.full` | ~500MB-1GB | 5173, 80 | 开发/调试 |
| **打包版** | `Dockerfile.bundle` | ~300MB-500MB | 80 | 离线部署 |
| **多架构版** | `Dockerfile.arm64` | ~50MB | 80 | ARM64 环境 |

### 1️⃣ 优化版（生产推荐）

**特点:**
- ✅ 最小的镜像大小（~50MB）
- ✅ 最快的启动速度（<5秒）
- ✅ 仅包含静态文件 + Nginx
- ✅ 使用非 root 用户运行
- ✅ 内置健康检查

**使用场景:**
- 生产环境部署
- 云服务部署
- 容器编排（Kubernetes）

**构建命令:**
```bash
make build-optimized
# 或
docker build -f Dockerfile.optimized -t aidp-frontend:optimized .
```

### 2️⃣ 完整版（开发调试）

**特点:**
- ✅ 包含完整源码和依赖
- ✅ 支持热更新（挂载源码）
- ✅ 可进入容器调试
- ✅ 保留所有开发工具

**使用场景:**
- 本地开发环境
- 远程调试
- 功能测试

**构建命令:**
```bash
make build-full
# 或
docker build -f Dockerfile.full -t aidp-frontend:dev .
```

### 3️⃣ 依赖打包版（离线部署）

**特点:**
- ✅ 包含所有运行时依赖
- ✅ 支持离线部署
- ✅ 可导出/导入镜像
- ✅ 适合内网环境

**使用场景:**
- 内网部署
- 离线环境
- 需要完整依赖的场景

**构建命令:**
```bash
make build-bundle
# 或
docker build -f Dockerfile.bundle -t aidp-frontend:bundle .
```

### 4️⃣ 多架构版（AMD64 + ARM64）

**特点:**
- ✅ 同时支持 x86_64 和 ARM64
- ✅ 自动适配目标平台
- ✅ 一次构建，多处运行
- ✅ 适合混合架构环境

**构建命令:**
```bash
make build-multiarch
# 或
./build-multiarch.sh build
```

---

## 📦 部署场景

### 场景 1: 生产环境部署

**推荐方案**: 优化版

```bash
# 1. 构建镜像
docker build -f Dockerfile.optimized -t aidp-frontend:latest .

# 2. 运行容器
docker run -d \
  --name aidp-frontend \
  -p 80:80 \
  --restart unless-stopped \
  -e BACKEND_URL=http://backend:8000 \
  --memory="128m" \
  --cpus="0.5" \
  aidp-frontend:latest

# 3. 验证部署
curl http://localhost/
```

**特点:**
- 镜像小（~50MB）
- 启动快（<5秒）
- 资源占用少（内存 <64MB）

---

### 场景 2: 开发环境调试

**推荐方案**: 完整版

```bash
# 1. 构建镜像
docker build -f Dockerfile.full -t aidp-frontend:dev .

# 2. 运行容器（开发模式）
docker run -d \
  --name aidp-frontend-dev \
  -p 5173:5173 \
  -v $(pwd)/src:/app/src \
  -e NODE_ENV=development \
  aidp-frontend:dev

# 3. 查看日志
docker logs -f aidp-frontend-dev

# 4. 进入容器调试
docker exec -it aidp-frontend-dev /bin/sh
```

**特点:**
- 支持热更新
- 可进入容器调试
- 保留源码映射

---

### 场景 3: 离线/内网部署

**推荐方案**: 依赖打包版

```bash
# ===== 在有网络的环境 =====

# 1. 构建镜像
make build-bundle

# 2. 导出镜像
docker save aidp-frontend:bundle | gzip > aidp-frontend-bundle.tar.gz

# 3. 传输到目标服务器
scp aidp-frontend-bundle.tar.gz user@target-server:/tmp/

# ===== 在目标服务器（离线环境） =====

# 4. 导入镜像
gunzip -c /tmp/aidp-frontend-bundle.tar.gz | docker load

# 5. 运行容器
docker run -d \
  --name aidp-frontend \
  -p 80:80 \
  --restart unless-stopped \
  aidp-frontend:bundle

# 6. 验证部署
curl http://localhost/
```

**特点:**
- 支持完全离线
- 包含所有依赖
- 无需网络连接

---

### 场景 4: Kubernetes 部署

**部署配置:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aidp-frontend
  labels:
    app: aidp-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: aidp-frontend
  template:
    metadata:
      labels:
        app: aidp-frontend
    spec:
      containers:
      - name: frontend
        image: your-registry/aidp-frontend:latest
        ports:
        - containerPort: 80
        env:
        - name: BACKEND_URL
          value: "http://backend-service:8000"
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10

---
apiVersion: v1
kind: Service
metadata:
  name: aidp-frontend-service
spec:
  selector:
    app: aidp-frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: LoadBalancer
```

**部署命令:**
```bash
kubectl apply -f deployment.yaml
```

---

## 💻 ARM64 支持

### 支持的平台

| 平台 | 架构 | 命令 |
|-----------|------|------|
| **Apple Silicon (M1/M2/M3)** | ARM64 | `--platform linux/arm64` |
| **Intel/AMD PC** | AMD64 | `--platform linux/amd64` |
| **Raspberry Pi 4/5** | ARM64 | `--platform linux/arm64` |
| **AWS Graviton** | ARM64 | `--platform linux/arm64` |
| **Google Cloud Tau** | ARM64 | `--platform linux/arm64` |
| **Azure ARM VMs** | ARM64 | `--platform linux/arm64` |
| **Oracle Cloud Ampere** | ARM64 | `--platform linux/arm64` |
| **华为云鲲鹏** | ARM64 | `--platform linux/arm64` |

### 构建 ARM64 镜像

#### 方式 1: 使用 Makefile

```bash
# 仅构建 ARM64
make build-arm64

# 仅构建 AMD64
make build-amd64

# 构建多架构（AMD64 + ARM64）
make build-multiarch
```

#### 方式 2: 使用构建脚本

```bash
chmod +x build-multiarch.sh

# 仅构建 ARM64
./build-multiarch.sh arm64

# 构建多架构
./build-multiarch.sh build
```

#### 方式 3: 使用 Docker 命令

```bash
# 创建 buildx 构建器
docker buildx create --name multiarch-builder --use

# 初始化构建器
docker buildx inspect --bootstrap

# 构建 ARM64 镜像
docker buildx build \
  --platform linux/arm64 \
  -f Dockerfile.arm64 \
  -t aidp-frontend:arm64 \
  --load \
  .

# 构建多架构镜像
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f Dockerfile.arm64 \
  -t aidp-frontend:multiarch \
  --push \
  .
```

### Apple Silicon (M1/M2/M3) 本地开发

```bash
# 构建 ARM64 镜像
docker buildx build \
  --platform linux/arm64 \
  -f Dockerfile.arm64 \
  -t aidp-frontend:arm64 \
  --load \
  .

# 运行容器
docker run -d \
  --name aidp-frontend \
  -p 80:80 \
  aidp-frontend:arm64

# 验证架构
docker inspect aidp-frontend | grep Architecture
# 输出: "Architecture": "arm64"
```

### Raspberry Pi 4/5 部署

```bash
# 在 x86_64 机器上构建
docker buildx build \
  --platform linux/arm64 \
  -f Dockerfile.arm64 \
  -t aidp-frontend:arm64 \
  --load \
  .

# 导出镜像
docker save aidp-frontend:arm64 | gzip > aidp-arm64.tar.gz

# 传输到 Pi
scp aidp-arm64.tar.gz pi@raspberrypi:/tmp/

# 在 Pi 上加载并运行
gunzip -c /tmp/aidp-arm64.tar.gz | docker load
docker run -d \
  --name aidp-frontend \
  -p 80:80 \
  --restart unless-stopped \
  aidp-frontend:arm64
```

### 性能对比

| 指标 | AMD64 | ARM64 | 说明 |
|------|-------|-------|------|
| **镜像大小** | ~45MB | ~42MB | ARM64 略小 |
| **启动时间** | ~3s | ~2s | ARM64 更快 |
| **内存占用** | ~50MB | ~40MB | ARM64 更省内存 |
| **能效比** | 中 | 高 | ARM64 优势明显 |

---

## ⚙️ 后端配置

### 环境变量配置

前端 Nginx 支持通过 `BACKEND_URL` 环境变量动态配置后端 API 地址。

#### 使用环境变量

```bash
# Docker Run
docker run -d \
  --name aidp-frontend \
  -p 80:80 \
  -e BACKEND_URL=http://your-backend:8000 \
  aidp-frontend:latest
```

```yaml
# Docker Compose
services:
  frontend:
    image: aidp-frontend:latest
    ports:
      - "80:80"
    environment:
      - BACKEND_URL=http://backend:8000
```

```yaml
# Kubernetes
env:
- name: BACKEND_URL
  value: "http://backend-service:8000"
```

### 常见配置场景

| 场景 | BACKEND_URL 配置 |
|------|------------------|
| **本地开发** | `http://host.docker.internal:8000` |
| **Docker 网络** | `http://backend:8000` |
| **远程服务器** | `https://api.example.com` |
| **Kubernetes** | `http://backend-service:8000` |

### 验证配置

```bash
# 检查环境变量
docker exec aidp-frontend echo $BACKEND_URL

# 查看 nginx 配置
docker exec aidp-frontend cat /etc/nginx/conf.d/default.conf | grep proxy_pass

# 测试 API 连接
docker exec aidp-frontend wget -O- ${BACKEND_URL}/api/health
```

---

## 📊 依赖分析

### 运行时依赖（9个）

| 包 | 版本 | 大小 | 用途 |
|---|---|---|---|
| **react** | ^18.2.0 | ~6.5KB | React 核心库 |
| **react-dom** | ^18.2.0 | ~130KB | React DOM 渲染 |
| **react-router-dom** | ^6.20.0 | ~12KB | 路由管理 |
| **antd** | ^5.12.0 | ~3.5MB | UI 组件库 |
| **@ant-design/icons** | ^5.2.6 | ~1.2MB | 图标库 |
| **echarts** | ^5.4.3 | ~1MB | 图表库 |
| **echarts-for-react** | ^3.0.2 | ~10KB | Echarts 封装 |
| **axios** | ^1.6.2 | ~15KB | HTTP 客户端 |
| **dayjs** | ^1.11.10 | ~3KB | 日期处理 |

**总计**: ~5.87MB (未压缩)，~1.8MB (Gzip)

### 开发依赖（10个）

- TypeScript 5.2.2
- Vite 5.4.21
- ESLint 及相关插件
- React 相关类型定义

### 构建产物

| 资源类型 | 未压缩 | Gzip | Brotli |
|---------|--------|------|--------|
| JavaScript | ~800KB | ~250KB | ~200KB |
| CSS | ~200KB | ~50KB | ~40KB |
| 资源文件 | ~500KB | ~400KB | ~380KB |
| **总计** | ~1.5MB | ~700KB | ~620KB |

---

## 🛠️ 常用命令

### Makefile 快捷命令

```bash
# 查看所有命令
make help

# ===== 构建镜像 =====
make build                 # 构建生产版本
make build-all            # 构建所有版本
make build-optimized      # 构建优化版
make build-full           # 构建完整版
make build-bundle         # 构建打包版
make build-multiarch      # 构建多架构
make build-arm64          # 仅构建 ARM64
make build-amd64          # 仅构建 AMD64

# ===== 运行容器 =====
make run                  # 运行生产版本
make run-optimized        # 运行优化版
make run-full             # 运行开发版
make run-bundle           # 运行打包版

# ===== 容器管理 =====
make stop                 # 停止容器
make rm                   # 删除容器
make restart              # 重启服务
make logs                 # 查看日志
make exec                 # 进入容器
make ps                   # 查看容器
make stats                # 资源使用

# ===== 维护操作 =====
make clean                # 清理资源
make clean-all            # 完全清理
make test                 # 测试服务
make health               # 健康检查
make info                 # 项目信息

# ===== 导出/导入 =====
make export               # 导出镜像到 tar.gz
make import-optimized     # 导入优化版镜像
```

### Docker Compose 命令

```bash
# 启动服务
docker-compose --profile production up -d    # 生产环境
docker-compose --profile development up -d   # 开发环境
docker-compose --profile offline up -d       # 离线部署

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重新构建
docker-compose build --no-cache
```

### 原生 Docker 命令

```bash
# 构建镜像
docker build -f Dockerfile.optimized -t aidp-frontend:latest .

# 运行容器
docker run -d --name aidp-frontend -p 80:80 aidp-frontend:latest

# 查看日志
docker logs -f aidp-frontend

# 停止容器
docker stop aidp-frontend

# 删除容器
docker rm aidp-frontend

# 删除镜像
docker rmi aidp-frontend:latest
```

---

## 🔍 故障排查

### 问题 1: 容器无法启动

**症状**: 容器启动后立即退出

**排查步骤**:

```bash
# 1. 查看容器状态
docker ps -a

# 2. 查看容器日志
docker logs aidp-frontend

# 3. 检查镜像是否构建成功
docker images | grep aidp-frontend

# 4. 测试手动运行
docker run -it --rm aidp-frontend:latest /bin/sh
```

**常见原因**:
- 端口冲突
- 环境变量格式错误
- 镜像构建失败

---

### 问题 2: 端口冲突

**症状**: 启动失败，提示端口已被占用

**解决方案**:

```bash
# 方案 1: 修改端口映射
docker run -d --name aidp-frontend -p 8080:80 aidp-frontend:latest

# 方案 2: 停止占用端口的容器
docker ps | grep :80
docker stop <container-id>

# 方案 3: 查找并停止占用端口的进程
sudo lsof -i :80
sudo kill -9 <pid>
```

---

### 问题 3: API 请求失败

**症状**: 前端页面加载正常，但 API 请求失败

**排查步骤**:

```bash
# 1. 检查环境变量
docker exec aidp-frontend echo $BACKEND_URL

# 2. 检查后端服务是否可访问
docker exec aidp-frontend wget -O- ${BACKEND_URL}/api/health

# 3. 检查 nginx 配置
docker exec aidp-frontend cat /etc/nginx/conf.d/default.conf

# 4. 查看容器日志
docker logs aidp-frontend | grep -i error
```

**解决方案**:
- 确保 `BACKEND_URL` 指向正确的后端地址
- 确保后端服务正在运行
- 确保网络连接正常
- 检查防火墙设置

---

### 问题 4: 镜像构建失败

**症状**: docker build 过程中报错

**排查步骤**:

```bash
# 1. 清理构建缓存
docker builder prune

# 2. 检查 Dockerfile 语法
docker build --no-cache -f Dockerfile.optimized .

# 3. 检查磁盘空间
df -h

# 4. 查看 Docker 日志
journalctl -u docker
```

**常见原因**:
- 磁盘空间不足
- 网络问题导致依赖下载失败
- Dockerfile 语法错误
- 基础镜像拉取失败

---

### 问题 5: ARM64 构建失败

**症状**: 在 Apple Silicon 或 ARM 设备上构建失败

**解决方案**:

```bash
# 1. 安装 QEMU 模拟器
docker run --rm privileged multiarch/qemu-user-static --reset -p yes

# 2. 使用 buildx 构建
docker buildx build \
  --platform linux/arm64 \
  -f Dockerfile.arm64 \
  -t aidp-frontend:arm64 \
  --load \
  .

# 3. 检查 buildx 版本
docker buildx version
```

---

### 问题 6: 跨平台运行失败

**症状**: "exec format error"

**原因**: Docker 平台与宿主机架构不匹配

**解决方案**:

```bash
# 使用 buildx 跨平台构建
docker buildx build \
  --platform linux/arm64 \
  -f Dockerfile.arm64 \
  -t aidp-frontend:arm64 \
  --load \
  .
```

---

## 🎯 最佳实践

### 1. 镜像优化

✅ **使用 Alpine 基础镜像** - 减小镜像大小
✅ **多阶段构建** - 分离构建和运行环境
✅ **清理构建缓存** - 减小镜像体积
✅ **使用 .dockerignore** - 排除不必要的文件

```dockerfile
# .dockerignore 示例
node_modules
npm-debug.log
.env.local
.git
```

---

### 2. 安全加固

✅ **使用非 root 用户** - 所有 Dockerfile 已配置
✅ **限制资源使用** - 设置内存和 CPU 限制
✅ **扫描镜像漏洞** - 使用 `docker scan`
✅ **定期更新基础镜像** - 获取安全补丁

```bash
# 资源限制示例
docker run -d \
  --name aidp-frontend \
  -p 80:80 \
  --memory="128m" \
  --cpus="0.5" \
  --read-only \
  aidp-frontend:latest
```

---

### 3. 日志管理

✅ **使用日志卷** - 持久化日志
✅ **配置日志轮转** - 避免磁盘占满
✅ **集中日志收集** - 使用 ELK/Loki 等

```bash
# 创建日志卷
docker volume create aidp-logs

# 挂载日志卷
docker run -d \
  --name aidp-frontend \
  -p 80:80 \
  -v aidp-logs:/var/log/nginx \
  aidp-frontend:latest
```

---

### 4. 监控和健康检查

✅ **内置健康检查** - 所有 Dockerfile 已配置
✅ **使用 Prometheus** - 收集指标
✅ **配置告警** - 及时发现问题

```yaml
# 健康检查配置
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
  interval: 30s
  timeout: 3s
  retries: 3
  start_period: 5s
```

---

### 5. 网络配置

✅ **使用 Docker 网络** - 隔离服务
✅ **配置反向代理** - 统一入口
✅ **启用 HTTPS** - 加密传输

```nginx
# 反向代理配置示例
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://aidp-frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://backend:8000;
    }
}
```

---

### 6. 部署流程

✅ **CI/CD 集成** - 自动化构建和部署
✅ **版本管理** - 使用语义化版本号
✅ **蓝绿部署** - 零停机更新
✅ **回滚机制** - 快速恢复

```bash
# 版本标签示例
docker build -t aidp-frontend:v1.0.0 .
docker tag aidp-frontend:v1.0.0 aidp-frontend:latest
docker push registry.example.com/aidp-frontend:v1.0.0
```

---

## 📚 相关文档

### 项目文件

- `Dockerfile` - 原始 Dockerfile
- `Dockerfile.optimized` - 优化版（生产推荐）
- `Dockerfile.full` - 完整版（开发调试）
- `Dockerfile.bundle` - 打包版（离线部署）
- `Dockerfile.arm64` - 多架构版
- `docker-compose.yml` - Docker Compose 配置
- `Makefile` - 快捷命令
- `nginx.conf` - Nginx 配置
- `docker-entrypoint.sh` - 启动脚本

### 脚本工具

- `build-docker.sh` - Docker 镜像构建脚本
- `build-multiarch.sh` - 多架构构建脚本

### 配置文件

- `.dockerignore` - Docker 构建排除文件
- `package.json` - Node.js 依赖配置

---

## 🆘 获取帮助

### 查看帮助信息

```bash
# Makefile 帮助
make help

# 构建脚本帮助
./build-docker.sh help

# 多架构构建脚本帮助
./build-multiarch.sh help

# Docker Compose 帮助
docker-compose --help
```

### 常用资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Buildx 文档](https://docs.docker.com/buildx/)
- [Nginx 官方文档](https://nginx.org/en/docs/)
- [React 官方文档](https://react.dev/)
- [Vite 官方文档](https://vitejs.dev/)
- [Ant Design 官方文档](https://ant.design/)

---

## 📝 更新日志

### v1.0.0 (2026-03-12)

**新增功能:**
- ✅ 添加三种 Docker 镜像方案
- ✅ 支持 AMD64 和 ARM64 架构
- ✅ 环境变量动态配置后端地址
- ✅ 完整的构建脚本和 Makefile
- ✅ Docker Compose 配置

**优化改进:**
- ✅ 使用非 root 用户运行
- ✅ 添加健康检查
- ✅ 优化镜像大小（~50MB）
- ✅ 完善文档和注释

**已知问题:**
- 无

---

## 📞 技术支持

如有问题，请联系开发团队或提交 Issue。

**项目仓库**: [GitHub Repository URL]
**文档维护**: AIDP Team
**最后更新**: 2026-03-12

---

**许可证**: [MIT](LICENSE)

---

<div align="center">

**Made with ❤️ by AIDP Team**

</div>
