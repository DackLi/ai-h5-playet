'use client';

/**
 * 广告位组件
 * 完全对标 novel 项目的 components/Ads/index.jsx
 *
 * 功能：
 * 1. 渲染一个带 data-ads-id 属性的空 DOM 容器
 * 2. 将广告位信息（width、height、zoneId）注册到页面级的 adsMap 中
 * 3. 后续由 useAdsInit Hook 中的 renderPageAds 统一调用 window.adsTag.renderAds 渲染
 *
 * 使用方式：
 * ```tsx
 * const adsMap = {};
 * <Ads zone_key="mobile_index_top_300_250" adsMap={adsMap} zoneMap={appProps.zoneMap} width={300} height={250} />
 * ```
 */

import { AdsMap } from '@/hooks/useAdsInit';
import { ZoneMap } from '@/types';

interface AdsProps {
  /** 广告位 key，对应 zoneMap 中的键名 */
  zone_key: string;
  /** 页面级广告位注册表（可变对象，由本组件写入） */
  adsMap: AdsMap;
  /** 广告位映射表（来自 window.APP_PROPS.zoneMap） */
  zoneMap: ZoneMap;
  /** 广告宽度 */
  width: number;
  /** 广告高度 */
  height: number;
  /** 可选索引，用于同一 zone_key 在页面中出现多次时区分 */
  index?: number | string;
}

export default function Ads({ zone_key, adsMap, zoneMap, width, height, index }: AdsProps) {
  // 生成唯一的广告 DOM ID（对标 novel 项目的 adsId 生成逻辑）
  const adsId = index !== undefined ? `ads-dom-${zone_key}_${index}` : `ads-dom-${zone_key}`;

  // 将广告位信息注册到 adsMap（对标 novel 项目的 if(!adsMap[adsId]) { adsMap[adsId] = {...} }）
  if (!adsMap[adsId] && zoneMap[zone_key]) {
    adsMap[adsId] = {
      width,
      height,
      zoneId: zoneMap[zone_key],
    };
  }

  // 渲染空的广告容器 DOM，后续由 window.adsTag.renderAds 填充内容
  return (
    <div
      data-ads-id={adsId}
      style={{ width: `${width}px`, height: `${height}px`, margin: '0 auto' }}
    />
  );
}
