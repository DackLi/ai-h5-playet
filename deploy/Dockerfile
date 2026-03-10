FROM 172.30.10.185:15000/cd-build/node-nginx:19

# 项目部署目录
ENV DEPLOY_DIR /dianyi/app/h5-playlet
ENV CONF_DIR /etc/nginx/

WORKDIR $DEPLOY_DIR

# 复制 Next.js standalone 构建产物到临时目录
COPY .next/standalone $DEPLOY_DIR/h5-playlet-tmp
# 复制静态资源（standalone 模式不会自动包含 static 目录）
COPY .next/static $DEPLOY_DIR/h5-playlet-tmp/.next/static
# 复制 public 目录（图片、logo 等静态文件）
COPY public $DEPLOY_DIR/h5-playlet-tmp/public

# 复制部署配置文件
COPY deploy/nginx.conf $CONF_DIR
COPY deploy/start.sh $DEPLOY_DIR/

RUN chmod 755 ${DEPLOY_DIR}/start.sh
CMD ["bash", "-c", "$DEPLOY_DIR/start.sh"]
