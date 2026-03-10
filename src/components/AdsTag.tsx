/**
 * 广告标签组件
 * 用于在页面 <head> 中注入 BeesAds SDK 脚本
 * 在 layout.tsx 中全局引入，所有页面自动生效
 *
 * siteId 来源：服务端通过 /site/domain 接口动态获取（参考 novel 项目）
 * SDK 地址：根据环境变量区分线上/测试
 */

import { ADS_TAG_URL } from '@/lib/env';

interface AdsTagProps {
  /** 站点 ID，由服务端从 GameBridge API 动态获取 */
  siteId: string;
  /** 广告标签标题（可选），用于 SDK 内部标识 */
  title?: string;
}

export default function AdsTag({ siteId, title = '' }: AdsTagProps): React.ReactElement {
  return (
    <>
      {/* 初始化广告标签全局对象 */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.adsTag = window.adsTag || { cmd: [] }; window.templateFlag = true;`,
        }}
      />
      {/* 异步加载广告 SDK（地址根据环境变量区分线上/测试） */}
      <script
        defer
        id="ads-tag-sdk"
        src={ADS_TAG_URL}
        data-site-id={siteId}
        data-title={title}
      />
    </>
  );
}
