/**
 * 站点配置服务
 * 参考 novel 项目的 utils/siteConfig.js
 *
 * 核心流程：
 * 1. 通过当前域名调用 /site/domain 接口获取 siteId
 * 2. 通过 siteId 调用 /site/{siteId}/site-config 获取 SDK 配置
 * 3. 通过域名调用 /site/config 获取站点配置（zoneMap、theme 等）
 * 4. 合并为 SiteEnvMap 注入到客户端全局
 */

import { SiteConfig, SdkSiteConfig, SiteEnvMap, ZoneMap, SiteTheme } from '@/types';

// GameBridge API 基础地址（服务端专用，不需要 NEXT_PUBLIC_ 前缀）
const GAMEBRIDGE_API_URL = process.env.GAMEBRIDGE_API_URL || 'https://service.gamebridge.games/gamebridge/v1';

// 默认站点 ID（接口异常时的兜底值）
const DEFAULT_SITE_ID = process.env.NEXT_PUBLIC_ADS_SITE_ID || '';

// 默认广告位映射（兜底配置，可根据实际业务调整）
const DEFAULT_ZONE_MAP: ZoneMap = {};

// 默认主题配置
const DEFAULT_THEME: SiteTheme = {
  icon: '/favicon.ico',
  logo: '/images/logo.png',
  'header-bg': '#0a0a0f',
  'header-color': '#ffffff',
  'footer-bg': '#0a0a0f',
  'footer-color': '#ffffff',
  'theme-color': '#0a0a0f',
};

/**
 * 通过域名获取站点 ID
 * 接口：GET /site/domain?domain={hostname}
 */
export async function getSiteByHostname(hostname: string): Promise<string> {
  try {
    const url = `${GAMEBRIDGE_API_URL}/site/domain?domain=${encodeURIComponent(hostname)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // 服务端请求，设置超时（Next.js fetch 支持 next.revalidate）
      next: { revalidate: 600 }, // 缓存 10 分钟
    });
    const data = await response.json();
    if (data.success && data.data?.siteId) {
      return data.data.siteId;
    }
    // 接口返回失败，使用默认 siteId
    return DEFAULT_SITE_ID;
  } catch (error) {
    console.error('[siteConfig] 获取 siteId 失败:', error);
    return DEFAULT_SITE_ID;
  }
}

/**
 * 通过 siteId 获取 SDK 站点配置
 * 接口：GET /site/{siteId}/site-config
 */
export async function getSdkSiteConfig(siteId: string): Promise<SdkSiteConfig> {
  try {
    const url = `${GAMEBRIDGE_API_URL}/site/${siteId}/site-config`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 600 },
    });
    const data = await response.json();
    return data || {};
  } catch (error) {
    console.error('[siteConfig] 获取 SDK 配置失败:', error);
    return {};
  }
}

/**
 * 通过域名获取站点配置（zoneMap、theme 等）
 * 接口：GET /site/config?domain={hostname}
 */
export async function getSiteConfigByHostname(hostname: string): Promise<SiteConfig> {
  try {
    const url = `${GAMEBRIDGE_API_URL}/site/config?domain=${encodeURIComponent(hostname)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 600 },
    });
    const data = await response.json();
    const siteData = data?.data;
    if (siteData) {
      return siteData;
    }
    // 接口无数据，返回默认配置
    return {
      siteId: DEFAULT_SITE_ID,
      zoneMap: DEFAULT_ZONE_MAP,
      theme: DEFAULT_THEME,
    };
  } catch (error) {
    console.error('[siteConfig] 获取站点配置失败:', error);
    return {
      siteId: DEFAULT_SITE_ID,
      zoneMap: DEFAULT_ZONE_MAP,
      theme: DEFAULT_THEME,
    };
  }
}

/**
 * 一次性获取完整的站点环境数据
 * 在 layout.tsx 服务端调用，合并 siteId + sdkSiteConfig + siteConfig
 *
 * @param hostname - 当前请求的域名（如 www.example.com）
 * @returns SiteEnvMap - 合并后的站点环境数据
 */
export async function fetchSiteEnvMap(hostname: string): Promise<SiteEnvMap> {
  // 1. 获取 siteId
  const siteId = await getSiteByHostname(hostname);

  // 2. 并行获取 SDK 配置和站点配置
  const [sdkSiteConfigRes, siteConfigRes] = await Promise.all([
    getSdkSiteConfig(siteId),
    getSiteConfigByHostname(hostname),
  ]);

  // 3. 校验 SDK 配置的 site_id 是否匹配
  const sdkSiteConfig = sdkSiteConfigRes?.site_id === siteId ? sdkSiteConfigRes : {};

  // 4. 合并为最终的环境数据
  const siteEnvMap: SiteEnvMap = {
    siteId,
    hostname,
    theme: siteConfigRes.theme || DEFAULT_THEME,
    zoneMap: siteConfigRes.zoneMap || DEFAULT_ZONE_MAP,
    sdkSiteConfig,
  };

  return siteEnvMap;
}
