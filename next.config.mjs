/** @type {import('next').NextConfig} */
const nextConfig = {
  // 开启 standalone 输出模式，用于 Docker 部署
  output: 'standalone',
  // 图片远程域名配置
  // 关闭服务端图片优化（CDN 不透传 query string，导致 /_next/image 返回 400）
  // 开启后 next/image 直接使用原始图片 URL，不经过 /_next/image 端点
  images: {
    unoptimized: true,
  },
  // 环境变量配置（NEXT_PUBLIC_ 前缀的变量会自动暴露到客户端）
  // 此处可以添加服务端专用的环境变量
  env: {
    // 构建时间戳，用于版本追踪
    BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
