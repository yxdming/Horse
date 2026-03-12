# ===========================================
# AIDP Frontend Docker Makefile
# ===========================================
# 快速执行常见 Docker 操作的快捷命令
# ===========================================

.PHONY: help build build-all build-optimized build-full build-bundle build-multiarch push clean test up down restart logs

# 默认目标
.DEFAULT_GOAL := help

# 项目名称
PROJECT_NAME := aidp-frontend
REGISTRY := # 设置你的私有仓库地址，如: registry.example.com/

# 颜色定义
GREEN  := \033[0;32m
YELLOW := \033[1;33m
BLUE   := \033[0;34m
NC     := \033[0m # No Color

##@ 帮助信息

help: ## 显示帮助信息
	@echo "$(BLUE)========================================$(NC)"
	@echo "$(BLUE)AIDP Frontend Docker Makefile$(NC)"
	@echo "$(BLUE)========================================$(NC)"
	@echo ""
	@echo "$(GREEN)使用方法:$(NC)"
	@echo "  make [target]"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "$(YELLOW)可用命令:$(NC)\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
	@echo ""

##@ 构建镜像

build: build-optimized ## 构建生产优化版本

build-all: ## 构建所有版本
	@echo "$(GREEN)🚀 Building all Docker images...$(NC)"
	docker build -f Dockerfile.optimized -t $(REGISTRY)$(PROJECT_NAME):optimized -t $(REGISTRY)$(PROJECT_NAME):latest .
	docker build -f Dockerfile.full -t $(REGISTRY)$(PROJECT_NAME):full -t $(REGISTRY)$(PROJECT_NAME):dev .
	docker build -f Dockerfile.bundle -t $(REGISTRY)$(PROJECT_NAME):bundle .
	@echo "$(GREEN)✅ All images built successfully!$(NC)"
	@docker images | grep $(PROJECT_NAME)

build-optimized: ## 构建生产优化版本（推荐）
	@echo "$(GREEN)🚀 Building optimized image...$(NC)"
	docker build -f Dockerfile.optimized -t $(REGISTRY)$(PROJECT_NAME):optimized -t $(REGISTRY)$(PROJECT_NAME):latest -t $(REGISTRY)$(PROJECT_NAME):v1.0.0 .
	@echo "$(GREEN)✅ Optimized image built!$(NC)"
	@docker images $(REGISTRY)$(PROJECT_NAME):optimized

build-full: ## 构建完整开发版本
	@echo "$(GREEN)🚀 Building full image...$(NC)"
	docker build -f Dockerfile.full -t $(REGISTRY)$(PROJECT_NAME):full -t $(REGISTRY)$(PROJECT_NAME):dev .
	@echo "$(GREEN)✅ Full image built!$(NC)"
	@docker images $(REGISTRY)$(PROJECT_NAME):full

build-bundle: ## 构建依赖打包版本（离线部署）
	@echo "$(GREEN)🚀 Building bundle image...$(NC)"
	docker build -f Dockerfile.bundle -t $(REGISTRY)$(PROJECT_NAME):bundle .
	@echo "$(GREEN)✅ Bundle image built!$(NC)"
	@docker images $(REGISTRY)$(PROJECT_NAME):bundle

build-multiarch: ## 构建多架构镜像（AMD64 + ARM64）
	@echo "$(GREEN)🚀 Building multi-architecture image...${NC}"
	@if ! docker buildx version &> /dev/null; then \
		echo "$(YELLOW)⚠️  Docker buildx not found, installing...$(NC)"; \
		docker run --rm privileged multiarch/qemu-user-static --reset -p yes; \
	fi
	@docker buildx build \
		--platform linux/amd64,linux/arm64 \
		-f Dockerfile.arm64 \
		-t $(REGISTRY)$(PROJECT_NAME):multiarch \
		-t $(REGISTRY)$(PROJECT_NAME):latest \
		--progress=plain \
		.
	@echo "$(GREEN)✅ Multi-architecture image built!$(NC)"

build-arm64: ## 构建仅 ARM64 架构镜像
	@echo "$(GREEN)🚀 Building ARM64 image...$(NC)"
	@docker buildx build \
		--platform linux/arm64 \
		-f Dockerfile.arm64 \
		-t $(REGISTRY)$(PROJECT_NAME):arm64 \
		--load \
		--progress=plain \
		.
	@echo "$(GREEN)✅ ARM64 image built!$(NC)"
	@docker images | grep $(PROJECT_NAME)

build-amd64: ## 构建仅 AMD64 架构镜像
	@echo "$(GREEN)🚀 Building AMD64 image...$(NC)"
	@docker buildx build \
		--platform linux/amd64 \
		-f Dockerfile.arm64 \
		-t $(REGISTRY)$(PROJECT_NAME):amd64 \
		--load \
		--progress=plain \
		.
	@echo "$(GREEN)✅ AMD64 image built!$(NC)"
	@docker images | grep $(PROJECT_NAME)

##@ 推送镜像

push: ## 推送所有镜像到仓库
	@echo "$(YELLOW)Pushing images to registry...$(NC)"
	docker push $(REGISTRY)$(PROJECT_NAME):optimized
	docker push $(REGISTRY)$(PROJECT_NAME):latest
	docker push $(REGISTRY)$(PROJECT_NAME):v1.0.0
	docker push $(REGISTRY)$(PROJECT_NAME):full
	docker push $(REGISTRY)$(PROJECT_NAME):dev
	docker push $(REGISTRY)$(PROJECT_NAME):bundle
	@echo "$(GREEN)✅ All images pushed!$(NC)"

push-optimized: ## 推送优化版本
	@echo "$(YELLOW)Pushing optimized image...$(NC)"
	docker push $(REGISTRY)$(PROJECT_NAME):optimized
	docker push $(REGISTRY)$(PROJECT_NAME):latest

##@ 运行容器

run: run-optimized ## 运行生产优化版本

run-optimized: ## 运行生产优化版本
	@echo "$(GREEN)🚀 Starting optimized container...$(NC)"
	docker run -d \
		--name $(PROJECT_NAME) \
		-p 80:80 \
		--restart unless-stopped \
		$(REGISTRY)$(PROJECT_NAME):optimized
	@echo "$(GREEN)✅ Container started on http://localhost$(NC)"

run-full: ## 运行完整开发版本
	@echo "$(GREEN)🚀 Starting full container...$(NC)"
	docker run -d \
		--name $(PROJECT_NAME)-dev \
		-p 5173:5173 \
		-p 3002:80 \
		-e NODE_ENV=development \
		-v $(PWD)/src:/app/src \
		$(REGISTRY)$(PROJECT_NAME):full
	@echo "$(GREEN)✅ Dev container started on http://localhost:5173$(NC)"

run-bundle: ## 运行依赖打包版本
	@echo "$(GREEN)🚀 Starting bundle container...$(NC)"
	docker run -d \
		--name $(PROJECT_NAME)-bundle \
		-p 3003:80 \
		--restart unless-stopped \
		$(REGISTRY)$(PROJECT_NAME):bundle
	@echo "$(GREEN)✅ Bundle container started on http://localhost:3003$(NC)"

##@ Docker Compose

up: ## 使用 Docker Compose 启动服务（优化版）
	docker-compose --profile production up -d

up-dev: ## 使用 Docker Compose 启动开发环境
	docker-compose --profile development up -d

up-bundle: ## 使用 Docker Compose 启动依赖打包版本
	docker-compose --profile offline up -d

down: ## 停止所有 Docker Compose 服务
	docker-compose down

restart: down up ## 重启服务

logs: ## 查看服务日志
	docker-compose logs -f

##@ 容器管理

stop: ## 停止所有运行的容器
	@echo "$(YELLOW)Stopping all containers...$(NC)"
	-docker stop $(PROJECT_NAME) 2>/dev/null || true
	-docker stop $(PROJECT_NAME)-dev 2>/dev/null || true
	-docker stop $(PROJECT_NAME)-bundle 2>/dev/null || true
	@echo "$(GREEN)✅ All containers stopped$(NC)"

rm: stop ## 停止并删除所有容器
	@echo "$(YELLOW)Removing all containers...$(NC)"
	-docker rm $(PROJECT_NAME) 2>/dev/null || true
	-docker rm $(PROJECT_NAME)-dev 2>/dev/null || true
	-docker rm $(PROJECT_NAME)-bundle 2>/dev/null || true
	@echo "$(GREEN)✅ All containers removed$(NC)"

exec: ## 进入优化版容器
	docker exec -it $(PROJECT_NAME) /bin/sh

exec-dev: ## 进入开发版容器
	docker exec -it $(PROJECT_NAME)-dev /bin/sh

##@ 维护操作

clean: ## 清理未使用的镜像和容器
	@echo "$(YELLOW)Cleaning up Docker resources...$(NC)"
	docker system prune -f
	@echo "$(GREEN)✅ Cleanup completed$(NC)"

clean-all: clean ## 清理所有（包括未使用的镜像）
	@echo "$(YELLOW)Cleaning all Docker resources...$(NC)"
	docker system prune -a -f
	@echo "$(GREEN)✅ All cleanup completed$(NC)"

ps: ## 查看运行中的容器
	docker ps -a | grep $(PROJECT_NAME) || echo "No containers running"

images: ## 查看所有镜像
	docker images | grep $(PROJECT_NAME) || echo "No images found"

##@ 导出/导入

export: ## 导出镜像到 tar.gz 文件
	@echo "$(YELLOW)Exporting images...$(NC)"
	docker save $(REGISTRY)$(PROJECT_NAME):optimized | gzip > $(PROJECT_NAME)-optimized.tar.gz
	docker save $(REGISTRY)$(PROJECT_NAME):bundle | gzip > $(PROJECT_NAME)-bundle.tar.gz
	@echo "$(GREEN)✅ Images exported:$(NC)"
	@ls -lh $(PROJECT_NAME)-*.tar.gz

import-optimized: ## 从 tar.gz 导入优化版镜像
	@echo "$(YELLOW)Importing optimized image...$(NC)"
	gunzip -c $(PROJECT_NAME)-optimized.tar.gz | docker load
	@echo "$(GREEN)✅ Image imported$(NC)"

##@ 测试

test: ## 测试容器是否正常运行
	@echo "$(YELLOW)Testing container...$(NC)"
	@curl -f http://localhost/ > /dev/null 2>&1 && echo "$(GREEN)✅ Container is running!$(NC)" || echo "$(YELLOW)⚠️  Container may not be running$(NC)"
	@docker ps | grep $(PROJECT_NAME) || echo "$(YELLOW)⚠️  No containers found$(NC)"

health: ## 检查容器健康状态
	@echo "$(YELLOW)Checking container health...$(NC)"
	@docker inspect --format='{{.State.Health.Status}}' $(PROJECT_NAME) 2>/dev/null || echo "Container not running"

##@ 信息

info: ## 显示项目信息
	@echo "$(BLUE)========================================$(NC)"
	@echo "$(BLUE)Project Information$(NC)"
	@echo "$(BLUE)========================================$(NC)"
	@echo "Project Name: $(PROJECT_NAME)"
	@echo "Registry: $(REGISTRY)"
	@echo "Working Directory: $$(PWD)"
	@echo ""
	@echo "$(GREEN)Available Images:$(NC)"
	@$(MAKE) --no-print-directory images
	@echo ""
	@echo "$(GREEN)Running Containers:$(NC)"
	@$(MAKE) --no-print-directory ps

stats: ## 查看容器资源使用情况
	docker stats $(PROJECT_NAME) --no-stream
