'use client';

/**
 * 广告初始化 Hook
 * 完全对标 novel 项目的 adsComponentsInit 调用逻辑
 *
 * novel 项目的广告流程：
 * 1. _document.jsx 服务端获取 siteEnvMap → 注入 window.APP_PROPS
 * 2. 页面组件通过 useEffect 读取 window.APP_PROPS 得到 appProps（含 zoneMap）
 * 3. 页面中使用 <Ads> 组件，渲染时将广告位信息注册到 adsMap 对象
 * 4. appProps 就绪后调用 adsComponentsInit(windowWidth) 初始化穿插/锚定广告
 * 5. 然后遍历 adsMap，通过 window.adsTag.renderAds(dom, w, h, zoneId) 渲染广告
 *
 * 本 Hook 完整复刻了上述流程，适配 Next.js App Router
 */

import { useEffect, useState, useRef } from 'react';
import { ZoneMap } from '@/types';

// ============ window.adsTag 类型声明 ============
declare global {
  interface Window {
    adsTag: {
      cmd: Array<() => void>;
      renderInterstitial?: (zoneId: string) => void;
      renderAnchor?: (zoneId: string, position: string) => void;
      renderAds?: (dom: Element, width: number, height: number, zoneId: string) => void;
      sendBI?: (eventName: string, data?: Record<string, any>) => void;
      sendGTM?: (name: string, conf?: Record<string, any>) => void;
    };
    APP_PROPS: {
      siteId: string;
      hostname: string;
      zoneMap: ZoneMap;
      theme: Record<string, string | undefined>;
      sdkSiteConfig: Record<string, any>;
    };
  }
}

// ============ adsMap：页面级广告位注册表 ============
// 对标 novel 项目中每个页面顶部的 let adsMap = {};
// <Ads> 组件渲染时会将广告位信息写入此对象
export type AdsMapItem = { width: number; height: number; zoneId: string };
export type AdsMap = Record<string, AdsMapItem>;

/**
 * 获取 window.APP_PROPS 中的环境变量
 * 对标 novel 项目的 getEnvVar()
 */
export function getEnvVar(): Window['APP_PROPS'] | Record<string, never> {
  if (typeof window !== 'undefined' && window.APP_PROPS) {
    return window.APP_PROPS;
  }
  return {};
}

/**
 * 初始化穿插广告和锚定广告
 * 完全对标 novel 项目的 adsComponentsInit 函数
 *
 * @param windowWidth - 当前窗口宽度，用于区分 PC/移动端广告位
 */
export function adsComponentsInit(windowWidth?: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.adsTag?.cmd) {
      resolve();
      return;
    }

    const width = windowWidth ?? window.innerWidth;

    window.adsTag.cmd.push(() => {
      const envVar = getEnvVar();
      const zoneMap = (envVar as any).zoneMap || {};

      // 渲染穿插广告（PC 和移动端使用不同的 zoneId）
      if (zoneMap.webinterstitial_pc && width > 768) {
        window.adsTag.renderInterstitial?.(zoneMap.webinterstitial_pc);
      } else if (zoneMap.webinterstitial_mobile && width <= 768) {
        window.adsTag.renderInterstitial?.(zoneMap.webinterstitial_mobile);
      }

      // 渲染锚定广告（固定在页面底部）
      if (zoneMap.anchorId) {
        window.adsTag.renderAnchor?.(zoneMap.anchorId, 'bottom');
      }

      resolve();
    });
  });
}

/**
 * 渲染页面内嵌广告
 * 对标 novel 项目中 adsComponentsInit().then() 回调里的逻辑
 * 遍历 adsMap，找到对应 DOM 并调用 window.adsTag.renderAds
 *
 * @param adsMap - 页面级广告位注册表
 */
export function renderPageAds(adsMap: AdsMap): void {
  if (typeof window === 'undefined' || !window.adsTag?.cmd) return;

  window.adsTag.cmd.push(() => {
    Object.keys(adsMap).forEach((adsId) => {
      const { width, height, zoneId } = adsMap[adsId];
      const dom = document.querySelector(`[data-ads-id="${adsId}"]`);
      if (dom && !dom.innerHTML) {
        window.adsTag.renderAds?.(dom, width, height, zoneId);
      }
    });
  });
}

/**
 * 广告初始化 Hook
 * 对标 novel 项目中每个页面的以下模式：
 *
 * ```js
 * const [appProps, setAppProps] = useState(null);
 * useEffect(() => {
 *   if (window.APP_PROPS) setAppProps(window.APP_PROPS);
 * }, []);
 * useEffect(() => {
 *   if (appProps) {
 *     adsComponentsInit(windowWidth).then(() => {
 *       window.adsTag.cmd.push(() => {
 *         Object.keys(adsMap).forEach(adsId => {
 *           const { width, height, zoneId } = adsMap[adsId];
 *           const dom = document.querySelector(`[data-ads-id="${adsId}"]`);
 *           if (dom && !dom.innerHTML) {
 *             window.adsTag.renderAds(dom, width, height, zoneId);
 *           }
 *         });
 *       });
 *     });
 *   }
 * }, [appProps]);
 * ```
 *
 * @param adsMap - 页面级广告位注册表（由 <Ads> 组件填充）
 * @returns appProps - window.APP_PROPS 的值，供页面组件使用
 */
export function useAdsInit(adsMap: AdsMap = {}) {
  const [appProps, setAppProps] = useState<Window['APP_PROPS'] | null>(null);
  const initializedRef = useRef(false);

  // 第一步：读取 window.APP_PROPS（对标 novel 项目的 useEffect + setAppProps）
  useEffect(() => {
    if (typeof window !== 'undefined' && window.APP_PROPS) {
      setAppProps(window.APP_PROPS);
    }
  }, []);

  // 第二步：appProps 就绪后，初始化广告（对标 novel 项目的 useEffect([appProps])）
  useEffect(() => {
    if (!appProps || initializedRef.current) return;
    initializedRef.current = true;

    adsComponentsInit().then(() => {
      renderPageAds(adsMap);
    });
  }, [appProps, adsMap]);

  return appProps;
}

/**
 * 数据变化后重新渲染广告
 * 对标 novel 项目中 useEffect([list]) 里的广告刷新逻辑：
 *
 * ```js
 * useEffect(() => {
 *   window.adsTag.cmd.push(() => {
 *     Object.keys(adsMap).forEach(adsId => { ... });
 *   });
 * }, [list]);
 * ```
 *
 * @param adsMap - 页面级广告位注册表
 */
export function refreshAds(adsMap: AdsMap): void {
  renderPageAds(adsMap);
}

/**
 * 发送 BI 事件
 * 对标 novel 项目的 trackBiEvent
 */
export function trackBiEvent(eventName: string, customData?: Record<string, any>): void {
  if (typeof window === 'undefined' || !window.adsTag?.cmd) return;

  window.adsTag.cmd.push(() => {
    const widgetDomain = window.sessionStorage?.getItem('widget_domain');
    if (widgetDomain) {
      window.adsTag.sendBI?.(eventName, { ...customData, widgetOriginPage: widgetDomain });
    } else {
      window.adsTag.sendBI?.(eventName, customData);
    }
  });
}

/**
 * 发送 GTM 事件
 * 对标 novel 项目的 gtmEvent
 */
export function gtmEvent(name: string, conf?: Record<string, any>): void {
  if (typeof window === 'undefined' || !window.adsTag?.cmd) return;

  window.adsTag.cmd.push(() => {
    const widgetDomain = window.sessionStorage?.getItem('widget_domain');
    if (widgetDomain) {
      window.adsTag.sendGTM?.(name, { ...conf, widgetOriginPage: widgetDomain });
    } else {
      window.adsTag.sendGTM?.(name, conf);
    }
  });
}

export default useAdsInit;
