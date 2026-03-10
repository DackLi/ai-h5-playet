#!/bin/bash

# 设置 locale，避免 Docker 容器中 locale 警告
export LC_ALL=C
export LANG=C

# 创建应用目录和日志目录
mkdir -p /dianyi/app/h5-playlet/h5-playlet
mkdir -p /dianyi/log/h5-playlet

# 将临时目录中的构建产物复制到正式运行目录
cp -r /dianyi/app/h5-playlet/h5-playlet-tmp/. /dianyi/app/h5-playlet/
# 复制 public 静态资源到子目录（供 nginx 直接访问）
cp -r /dianyi/app/h5-playlet/h5-playlet-tmp/public/. /dianyi/app/h5-playlet/h5-playlet/
# 复制 site-icon.ico（实际路径在 public/images/ 下）
if [ -f /dianyi/app/h5-playlet/h5-playlet-tmp/public/images/site-icon.ico ]; then
  cp /dianyi/app/h5-playlet/h5-playlet-tmp/public/images/site-icon.ico /dianyi/app/h5-playlet/h5-playlet/
fi

chmod 755 /dianyi/app/h5-playlet/h5-playlet

# 设置 Next.js 监听端口（standalone 模式默认 3000，与 nginx 反向代理对应）
# 注意：直接在 node 命令中通过环境变量传递，确保子进程能正确读取
export PORT=8089
export HOSTNAME="0.0.0.0"

# 从 Docker 环境变量中读取运行环境（在 docker run 时通过 -e 传入）
# 例如：docker run -e APP_ENV=development ...（测试环境）
# 例如：docker run -e APP_ENV=production ...（线上环境）
export NODE_ENV=${APP_ENV:-production}

echo "[INFO] 当前运行环境: NODE_ENV=${NODE_ENV}"
echo "[INFO] API 地址: NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}"
echo "[INFO] 监听端口: PORT=${PORT}"

# 启动 Next.js standalone 服务（后台运行）
# 显式传递 PORT 和 HOSTNAME 环境变量，避免 nohup 子进程丢失环境变量
cd /dianyi/app/h5-playlet && nohup env PORT=${PORT} HOSTNAME=${HOSTNAME} NODE_ENV=${NODE_ENV} node ./server.js >> /dianyi/log/h5-playlet/playlet.log 2>&1 &

# 前台启动 nginx
nginx -g 'daemon off;'
