#!/bin/bash

# ===========================================
# AIDP Frontend Multi-Architecture Build Script
# ===========================================
# 用于构建支持 AMD64 和 ARM64 的多架构 Docker 镜像
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
REGISTRY="" # 设置你的私有仓库，如: registry.example.com/
VERSION="1.0.0"

# 支持的架构
PLATFORMS="linux/amd64,linux/arm64"

# 打印帮助信息
print_help() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Multi-Architecture Docker Build Script${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo "Usage: ./build-multiarch.sh [OPTION]"
    echo ""
    echo "Options:"
    echo "  build         构建多架构镜像"
    echo "  build-local   构建本地多架构镜像"
    echo "  push          构建并推送到仓库"
    echo "  amd64         仅构建 AMD64 架构"
    echo "  arm64         仅构建 ARM64 架构"
    echo "  test          测试构建环境"
    echo "  clean         清理构建缓存"
    echo "  help          显示此帮助信息"
    echo ""
    echo -e "${YELLOW}示例:${NC}"
    echo "  ./build-multiarch.sh build        # 构建所有架构"
    echo "  ./build-multiarch.sh amd64        # 仅构建 AMD64"
    echo "  ./build-multiarch.sh arm64        # 仅构建 ARM64"
    echo ""
}

# 检查 Docker 版本
check_docker() {
    echo -e "${YELLOW}Checking Docker version...${NC}"
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed!${NC}"
        exit 1
    fi

    # 检查是否支持 buildx
    if ! docker buildx version &> /dev/null; then
        echo -e "${RED}❌ Docker buildx is not available!${NC}"
        echo "Please upgrade Docker to version 19.03 or later."
        exit 1
    fi

    DOCKER_VERSION=$(docker version --format '{{.Server.Version}}')
    echo -e "${GREEN}✅ Docker version: $DOCKER_VERSION${NC}"

    BUILDX_VERSION=$(docker buildx version)
    echo -e "${GREEN}✅ $BUILDX_VERSION${NC}"
}

# 检查并创建 buildx 构建器
setup_builder() {
    BUILDER_NAME="multiarch-builder"

    echo -e "${YELLOW}Setting up buildx builder...${NC}"

    # 检查构建器是否已存在
    if docker buildx inspect $BUILDER_NAME &> /dev/null; then
        echo -e "${GREEN}✅ Builder '$BUILDER_NAME' already exists${NC}"
    else
        echo -e "${YELLOW}Creating new builder '$BUILDER_NAME'...${NC}"
        docker buildx create --name $BUILDER_NAME --driver docker-container --use
        echo -e "${GREEN}✅ Builder created${NC}"
    fi

    # 启用构建器
    docker buildx use $BUILDER_NAME
    docker buildx inspect --bootstrap
}

# 构建多架构镜像
build_multiarch() {
    echo -e "${GREEN}🚀 Building multi-architecture image...${NC}"
    echo -e "${YELLOW}Platforms: $PLATFORMS${NC}"

    setup_builder

    docker buildx build \
        --platform $PLATFORMS \
        -f Dockerfile.arm64 \
        -t ${REGISTRY}${PROJECT_NAME}:${VERSION} \
        -t ${REGISTRY}${PROJECT_NAME}:latest \
        -t ${REGISTRY}${PROJECT_NAME}:multiarch \
        --progress=plain \
        .

    echo -e "${GREEN}✅ Multi-architecture image built successfully!${NC}"
}

# 构建本地多架构镜像
build_local() {
    echo -e "${GREEN}🚀 Building local multi-architecture image...${NC}"
    echo -e "${YELLOW}Platforms: $PLATFORMS${NC}"

    setup_builder

    docker buildx build \
        --platform $PLATFORMS \
        -f Dockerfile.arm64 \
        -t ${REGISTRY}${PROJECT_NAME}:${VERSION} \
        -t ${REGISTRY}${PROJECT_NAME}:latest \
        --load \
        --progress=plain \
        .

    echo -e "${GREEN}✅ Local multi-architecture image built!${NC}"
    docker images | grep ${PROJECT_NAME}
}

# 构建并推送
build_push() {
    echo -e "${GREEN}🚀 Building and pushing multi-architecture image...${NC}"
    echo -e "${YELLOW}Platforms: $PLATFORMS${NC}"

    if [ -z "$REGISTRY" ]; then
        echo -e "${RED}❌ Error: REGISTRY is not set!${NC}"
        echo "Please edit this script and set REGISTRY variable."
        exit 1
    fi

    setup_builder

    docker buildx build \
        --platform $PLATFORMS \
        -f Dockerfile.arm64 \
        -t ${REGISTRY}${PROJECT_NAME}:${VERSION} \
        -t ${REGISTRY}${PROJECT_NAME}:latest \
        -t ${REGISTRY}${PROJECT_NAME}:multiarch \
        --push \
        --progress=plain \
        .

    echo -e "${GREEN}✅ Image built and pushed successfully!${NC}"
}

# 仅构建 AMD64
build_amd64() {
    echo -e "${GREEN}🚀 Building AMD64 image...${NC}"

    docker buildx build \
        --platform linux/amd64 \
        -f Dockerfile.arm64 \
        -t ${REGISTRY}${PROJECT_NAME}:amd64 \
        --progress=plain \
        --load \
        .

    echo -e "${GREEN}✅ AMD64 image built!${NC}"
    docker images | grep ${PROJECT_NAME}
}

# 仅构建 ARM64
build_arm64() {
    echo -e "${GREEN}🚀 Building ARM64 image...${NC}"

    docker buildx build \
        --platform linux/arm64 \
        -f Dockerfile.arm64 \
        -t ${REGISTRY}${PROJECT_NAME}:arm64 \
        --progress=plain \
        --load \
        .

    echo -e "${GREEN}✅ ARM64 image built!${NC}"
    docker images | grep ${PROJECT_NAME}
}

# 测试构建环境
test_build() {
    echo -e "${YELLOW}Testing build environment...${NC}"
    check_docker

    echo ""
    echo -e "${BLUE}Available platforms:${NC}"
    docker buildx inspect --bootstrap

    echo ""
    echo -e "${GREEN}✅ Build environment is ready!${NC}"
}

# 清理构建缓存
clean_cache() {
    echo -e "${YELLOW}Cleaning build cache...${NC}"
    docker buildx prune -f
    echo -e "${GREEN}✅ Cache cleaned${NC}"
}

# 主逻辑
case "$1" in
    build)
        check_docker
        build_multiarch
        ;;
    build-local)
        check_docker
        build_local
        ;;
    push)
        check_docker
        build_push
        ;;
    amd64)
        check_docker
        build_amd64
        ;;
    arm64)
        check_docker
        build_arm64
        ;;
    test)
        test_build
        ;;
    clean)
        clean_cache
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
