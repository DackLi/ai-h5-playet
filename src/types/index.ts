// ============ API 真实数据类型（对应 beesads API） ============

// 短剧数据类型（对应 API 返回的 data 数组中的每一项）
export interface Playlet {
  id: string;
  video_id: string;
  lan: string;                    // 语言代码，如 "EN"
  name: string;                   // 短剧名称
  cover_image: string;            // 封面图 URL
  source: string;                 // 来源，如 "wgt"、"jowo"
  category: number[];             // 分类 ID 数组，如 [15, 34, 275]
  status: number;                 // 状态：1=上线
  episode_size: number;           // 总集数
  resource_status: string;        // 资源状态："owned_video" | "no_video"
  resource_type: string;          // 资源类型："drama"
  summary: string;                // 剧情简介
  highlight: number;              // 是否推荐/高亮：0=否, 1=是
  episodes: Episode[];            // 剧集列表（内嵌在短剧对象中）
}

// 剧集数据类型（对应 episodes 数组中的每一项）
export interface Episode {
  id: string;
  video_id: string;               // 所属短剧的 video_id
  episode_id: string;             // 剧集唯一 ID
  episode_code: string;           // 剧集编码，如 "VD00000006230"
  episode_index: number;          // 集数序号（从 1 开始）
  file_path: string;              // 视频文件地址（m3u8 或 mp4）
}

// API 响应类型（对应 beesads API 的返回结构）
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  total: number;
}

// 分页请求参数
export interface PageParams {
  group_id?: string;
  page_index?: number;
  page_size?: number;
  app_id?: string;
  lan?: string;
  device_id?: string;
  gaid?: string;
  api_version?: number;
}

// ============ 前端辅助类型 ============

// 判断剧集是否免费（前 3 集免费）
export function isEpisodeFree(episodeIndex: number): boolean {
  // 先全部免费
  return true;
  // TODO: 后续根据实际情况判断
  return episodeIndex <= 3;
}

// ============ 站点配置相关类型 ============

// 广告位映射表（zoneId 对应各广告位）
export interface ZoneMap {
  [key: string]: string;
}

// 站点主题配置
export interface SiteTheme {
  icon?: string;
  logo?: string;
  'header-bg'?: string;
  'header-color'?: string;
  'footer-bg'?: string;
  'footer-color'?: string;
  'theme-color'?: string;
  [key: string]: string | undefined;
}

// 站点配置（从 /site/config 接口返回）
export interface SiteConfig {
  siteId: string;
  zoneMap: ZoneMap;
  theme: SiteTheme;
}

// SDK 站点配置（从 /site/{siteId}/site-config 接口返回）
export interface SdkSiteConfig {
  site_id?: string;
  [key: string]: any;
}

// 全局站点环境数据（合并后注入到客户端）
export interface SiteEnvMap {
  siteId: string;
  hostname: string;
  theme: SiteTheme;
  zoneMap: ZoneMap;
  sdkSiteConfig: SdkSiteConfig;
}
