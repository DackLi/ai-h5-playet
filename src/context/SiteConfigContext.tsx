'use client';

/**
 * 站点配置上下文
 * 在服务端获取 siteEnvMap 后，通过此 Provider 注入到客户端组件树
 * 客户端组件可通过 useSiteConfig() 获取 siteId、zoneMap、theme 等数据
 *
 * 同时将 siteEnvMap 挂载到 window.APP_PROPS 上，
 * 兼容 novel 项目中 adsTag SDK 通过 window.APP_PROPS 读取配置的方式
 */

import { createContext, useContext, useEffect } from 'react';
import { SiteEnvMap, ZoneMap, SiteTheme, SdkSiteConfig } from '@/types';

// 默认值（未获取到配置时的兜底）
const defaultSiteEnvMap: SiteEnvMap = {
  siteId: '',
  hostname: '',
  theme: {},
  zoneMap: {},
  sdkSiteConfig: {},
};

const SiteConfigContext = createContext<SiteEnvMap>(defaultSiteEnvMap);

interface SiteConfigProviderProps {
  children: React.ReactNode;
  siteEnvMap: SiteEnvMap;
}

export function SiteConfigProvider({ children, siteEnvMap }: SiteConfigProviderProps) {
  // 将站点配置挂载到 window.APP_PROPS，兼容 adsTag SDK 的读取方式
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).APP_PROPS = siteEnvMap;
    }
  }, [siteEnvMap]);

  return (
    <SiteConfigContext.Provider value={siteEnvMap}>
      {children}
    </SiteConfigContext.Provider>
  );
}

/**
 * 获取站点配置的 Hook
 * @returns SiteEnvMap - 包含 siteId、hostname、theme、zoneMap、sdkSiteConfig
 */
export function useSiteConfig(): SiteEnvMap {
  return useContext(SiteConfigContext);
}

/**
 * 便捷 Hook：仅获取 siteId
 */
export function useSiteId(): string {
  const { siteId } = useContext(SiteConfigContext);
  return siteId;
}

/**
 * 便捷 Hook：仅获取 zoneMap（广告位映射）
 */
export function useZoneMap(): ZoneMap {
  const { zoneMap } = useContext(SiteConfigContext);
  return zoneMap;
}

/**
 * 便捷 Hook：仅获取主题配置
 */
export function useSiteTheme(): SiteTheme {
  const { theme } = useContext(SiteConfigContext);
  return theme;
}

/**
 * 便捷 Hook：仅获取 SDK 配置
 */
export function useSdkSiteConfig(): SdkSiteConfig {
  const { sdkSiteConfig } = useContext(SiteConfigContext);
  return sdkSiteConfig;
}
