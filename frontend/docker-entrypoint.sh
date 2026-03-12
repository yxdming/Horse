#!/bin/sh
set -e

# 默认后端 URL
BACKEND_URL=${BACKEND_URL:-http://backend:8000}

echo "==================================="
echo "Nginx Configuration"
echo "==================================="
echo "Backend URL: ${BACKEND_URL}"
echo "==================================="

# 使用 envsubst 替换 nginx 配置文件中的环境变量
envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf > /tmp/nginx.conf

# 移动替换后的配置文件
mv /tmp/nginx.conf /etc/nginx/conf.d/default.conf

# 验证 nginx 配置
nginx -t

# 如果配置验证成功，启动 nginx
if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid. Starting nginx..."
    exec nginx -g 'daemon off;'
else
    echo "Nginx configuration is invalid!"
    exit 1
fi
