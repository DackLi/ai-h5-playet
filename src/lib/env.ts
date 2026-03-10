/**
 * 环境配置工具
 * 统一管理不同环境下的配置变量
 *
 * Next.js 环境变量加载规则：
 * 1. `next dev`  → 加载 .env.development
 * 2. `next build` + `next start` → 加载 .env.production
 * 3. .env.local 始终加载（优先级最高，会覆盖上述文件中的同名变量）
 * 4. NEXT_PUBLIC_ 前缀的变量会暴露到客户端（浏览器端可访问）
 */

// API 请求基础地址（默认回退到真实 API 地址，避免服务端渲染时环境变量为空）
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://video.beesads.com';

// 当前环境标识：development | production | local
export const APP_ENV = process.env.NEXT_PUBLIC_ENV || 'development';

// 网站域名
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:8089';

// 广告 SDK 站点 ID
export const ADS_SITE_ID = process.env.NEXT_PUBLIC_ADS_SITE_ID || '';

// 广告 SDK 脚本地址（线上：sdk.beesads.com / 测试：sdk-test.beesads.com）
export const ADS_TAG_URL = process.env.NEXT_PUBLIC_ADS_TAG_URL || 'https://sdk-test.beesads.com/v1/ads-tag.js';

// GameBridge API 地址（服务端专用，用于获取 siteId、siteConfig 等）
// 不需要 NEXT_PUBLIC_ 前缀，仅在服务端使用
export const GAMEBRIDGE_API_URL = process.env.GAMEBRIDGE_API_URL || 'https://service.gamebridge.games/gamebridge/v1';

// 是否为开发环境
export const isDev = APP_ENV === 'development' || APP_ENV === 'local';

// 是否为生产环境
export const isProd = APP_ENV === 'production';


// 环境配置对象（方便统一引用）
export const envConfig = {
  apiBaseUrl: API_BASE_URL,
  env: APP_ENV,
  siteUrl: SITE_URL,
  adsSiteId: ADS_SITE_ID,
  adsTagUrl: ADS_TAG_URL,
  gamebridgeApiUrl: GAMEBRIDGE_API_URL,
  isDev,
  isProd,
} as const;

export default envConfig;
