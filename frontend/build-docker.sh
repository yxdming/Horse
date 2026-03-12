#!/bin/bash

# ===========================================
# AIDP Frontend Docker Build Script
# ===========================================
# 用于构建不同场景的 Docker 镜像
# ===========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目名称
PROJECT_NAME="aidp-frontend"
REGISTRY="" # 如果有私有仓库，在这里设置，如: registry.example.com/

# 打印帮助信息
print_help() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}AIDP Frontend Docker Build Script${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo "Usage: ./build-docker.sh [OPTION]"
    echo ""
    echo "Options:"
    echo "  optimized     构建优化版镜像（生产环境推荐）"
    echo "                镜像大小: ~50MB"
    echo "                包含内容: 仅静态文件 + Nginx"
    echo ""
    echo "  full          构建完整版镜像（开发/调试）"
    echo "                镜像大小: ~500MB-1GB"
    echo "                包含内容: 源码 + 依赖 + 构建工具"
    echo ""
    echo "  bundle        构建依赖打包版（离线部署）"
    echo "                镜像大小: ~300MB-500MB"
    echo "                包含内容: 依赖 + 静态文件 + 部分源码"
    echo ""
    echo "  all           构建所有版本"
    echo ""
    echo "  push          构建并推送所有版本到仓库"
    echo ""
    echo "  clean         清理未使用的 Docker 镜像和缓存"
    echo ""
    echo "  help          显示此帮助信息"
    echo ""
    echo -e "${YELLOW}示例:${NC}"
    echo "  ./build-docker.sh optimized    # 构建生产版本"
    echo "  ./build-docker.sh all          # 构建所有版本"
    echo "  ./build-docker.sh push         # 构建并推送"
    echo ""
}

# 构建优化版镜像
build_optimized() {
    echo -e "${GREEN}🚀 Building optimized Docker image...${NC}"
    docker build \
        -f Dockerfile.optimized \
        -t ${REGISTRY}${PROJECT_NAME}:optimized \
        -t ${REGISTRY}${PROJECT_NAME}:latest \
        -t ${REGISTRY}${PROJECT_NAME}:v1.0.0 \
        .
    echo -e "${GREEN}✅ Optimized image built successfully!${NC}"
    docker images ${REGISTRY}${PROJECT_NAME}:optimized
}

# 构建完整版镜像
build_full() {
    echo -e "${GREEN}🚀 Building full Docker image...${NC}"
    docker build \
        -f Dockerfile.full \
        -t ${REGISTRY}${PROJECT_NAME}:full \
        -t ${REGISTRY}${PROJECT_NAME}:dev \
        .
    echo -e "${GREEN}✅ Full image built successfully!${NC}"
    docker images ${REGISTRY}${PROJECT_NAME}:full
}

# 构建依赖打包版镜像
build_bundle() {
    echo -e "${GREEN}🚀 Building bundle Docker image...${NC}"
    docker build \
        -f Dockerfile.bundle \
        -t ${REGISTRY}${PROJECT_NAME}:bundle \
        .
    echo -e "${GREEN}✅ Bundle image built successfully!${NC}"
    docker images ${REGISTRY}${PROJECT_NAME}:bundle
}

# 构建所有版本
build_all() {
    echo -e "${YELLOW}Building all Docker images...${NC}"
    build_optimized
    echo ""
    build_full
    echo ""
    build_bundle
    echo ""
    echo -e "${GREEN}✅ All images built successfully!${NC}"
    echo ""
    docker images | grep ${PROJECT_NAME}
}

# 推送镜像到仓库
push_images() {
    echo -e "${YELLOW}Pushing images to registry...${NC}"

    if [ -z "$REGISTRY" ]; then
        echo -e "${RED}❌ Error: REGISTRY is not set!${NC}"
        echo "Please edit this script and set REGISTRY variable."
        exit 1
    fi

    docker push ${REGISTRY}${PROJECT_NAME}:optimized
    docker push ${REGISTRY}${PROJECT_NAME}:latest
    docker push ${REGISTRY}${PROJECT_NAME}:v1.0.0
    docker push ${REGISTRY}${PROJECT_NAME}:full
    docker push ${REGISTRY}${PROJECT_NAME}:dev
    docker push ${REGISTRY}${PROJECT_NAME}:bundle

    echo -e "${GREEN}✅ All images pushed successfully!${NC}"
}

# 清理未使用的镜像
clean() {
    echo -e "${YELLOW}Cleaning up Docker resources...${NC}"
    docker system prune -f
    echo -e "${GREEN}✅ Cleanup completed!${NC}"
}

# 主逻辑
case "$1" in
    optimized)
        build_optimized
        ;;
    full)
        build_full
        ;;
    bundle)
        build_bundle
        ;;
    all)
        build_all
        ;;
    push)
        build_all
        echo ""
        push_images
        ;;
    clean)
        clean
        ;;
    help|--help|-h|"")
        print_help
        ;;
    *)
        echo -e "${RED}❌ Unknown option: $1${NC}"
        echo ""
        print_help
        exit 1
        ;;
esac

exit 0
