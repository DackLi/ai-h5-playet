请帮我用 Next.js 14 (App Router) + TypeScript + Tailwind CSS 构建一个名为 "BeiDou" 的短剧视频播放平台（h5-playlet），以下是完整需求：

---

## 技术栈
- Next.js 14.2+ (App Router, output: standalone)
- React 18 + TypeScript 5.7
- Tailwind CSS 3.4（自定义主题色：红色系 primary，深色系 dark）
- xgplayer 3.0 + xgplayer-hls（西瓜播放器）
- axios（HTTP 请求）
- sharp（图片优化，实际配置 unoptimized: true）
- react-icons 5.5

## 端口
开发/生产均使用 8089 端口

---

## 页面路由结构

### 1. 首页 `/`
- 服务端渲染（SSR），并行获取推荐/热门/最新短剧
- 顶部 Banner 轮播：自动播放（5s间隔）+ 手机端触摸滑动切换
- 点击 Banner 整个区域跳转到 /detail/[id]（区分滑动和点击）
- 三大分区：hotPicks（热门）/ newReleases（最新）/ recommended（推荐）
- 短剧卡片网格（响应式：2-6列）
- 切换语言时清除缓存并重新拉取数据

### 2. 列表页 `/list`
- 展示全部短剧，支持 URL 参数 ?keyword=xxx 搜索
- 搜索结果计数显示

### 3. 短剧介绍页 `/movie/[id]`
- 封面、简介、标签
- 剧集列表（每页30集，分页带"更多"按钮）
- 付费剧集拦截：弹出 VIP 弹窗
- 推荐短剧（最多10个）

### 4. 视频播放页 `/detail/[id]`
- PC端：左右分栏（播放器 + 剧集信息），高度撑满视口（减去 Header + 面包屑）
- 移动端：上下布局，播放器宽度 min(100%, calc(80vh * 9/16))
- 西瓜播放器：竖屏 9:16，自动识别 HLS(.m3u8)/MP4
- 自动播放策略：尝试有声 → 浏览器阻止则静音降级 + "Tap to unmute"提示 → 用户交互后记录状态
- 播放结束自动播放下一集（5秒倒计时，可取消）
- 付费剧集弹窗拦截（VIP弹窗）
- 剧集选择器（每页50集，分页）
- 猜你喜欢推荐
- 修复：快速切换视频时 HLS AbortError → 模块级 unhandledrejection 处理器静默该错误

### 5. 四个政策页面（均从 GameBridge API 动态获取内容，有则显示，无则显示静态兜底）
- `/about-us` - 关于我们
- `/contact-us` - 联系我们
- `/privacy-policy` - 隐私政策  
- `/terms-of-use` - 使用条款

### 6. 健康检查 `/health` (GET)
返回 `{"name":"H5Playlet"}`

---

## 组件清单

### Header（头部导航）
- Logo（/images/logo.png）+ 站点名
- 导航：首页、浏览
- 搜索框（跳转 /list?keyword=xxx）
- 语言切换下拉（en/ja/es）
- sticky + 半透明毛玻璃背景（bg-[#0a0a0f]/90 backdrop-blur）

### Footer（页脚）
- Logo + 多语言链接（关于/联系/隐私/条款），使用 t() 翻译
- 版权信息

### BottomNav（移动端底部固定导航）
- 仅 mobile 显示，首页 + 浏览两项，当前路由高亮

### PlayletCard（短剧卡片）
- 3:4 比例封面，渐变遮罩，悬浮播放按钮（脉冲动画）
- 底部集数标签、推荐标签

### XgPlayer（西瓜播放器封装）
- 使用 dynamic import（禁用 SSR）
- 自动检测视频格式，按需加载 HLS 插件
- Props: url, poster, autoplay, locale, onEnded
- 完整生命周期：组件卸载时清空 src + 同步销毁播放器

### Loading / SectionTitle / Ads / AdsTag 组件

---

## 国际化（i18n）
- 支持：英语(en)、日语(ja)、西班牙语(es)
- localStorage 持久化（key: 'beidou-locale'）
- 自动检测浏览器语言
- 参数化翻译：t('totalEp', { total: 10 }) → "All 10 EP"
- 97个翻译键，涵盖：导航、首页、列表页、详情页、底部、付费弹窗、SEO

---

## API 层（src/lib/api.ts）
- 基础地址：process.env.API_BASE_URL（默认 https://video.beesads.com）
- 所有请求按语言获取数据（lan: 'EN'/'JA'/'ES'）
- 请求去重：同时发出同语言请求时复用同一 Promise
- 数据缓存 + 语言切换时清除缓存（clearPlayletCache()）
- API 失败自动降级到 mock 数据（12个虚构短剧，使用 HLS 公开测试流）
- 过滤无效短剧（resource_status == 'no_video' 或 episodes 为空）
- 核心函数：
  - fetchAllPlaylets(lan): 获取全部（带缓存）
  - fetchPlayletDetail(lan, id)
  - fetchEpisodes(lan, playletId)
  - fetchRecommended / fetchHotPlaylets / fetchLatestPlaylets
  - searchPlaylets(lan, keyword): 模糊匹配 name + summary
  - export getPolicyAndContact(siteId, lang, type): GET /site/{siteId}/custom_privacy_v2

---

## 站点配置服务（src/lib/siteConfig.ts）
- getSiteByHostname(hostname): GET /site/domain?domain=xxx → siteId
- getSdkSiteConfig(siteId): GET /site/{siteId}/site-config
- getSiteConfigByHostname(hostname): GET /site/config?domain=xxx
- fetchSiteEnvMap(hostname): 一次性获取完整配置
- 所有 fetch 请求 next.revalidate: 600（缓存10分钟）
- layout.tsx 服务端调用，结果注入 window.APP_PROPS

---

## 核心样式（globals.css）

背景色：#0a0a0f（深黑），主题色：红色（#cc2229/#ef4444）

详情页播放器布局：
- PC(≥1024px)：container 全高 flex 居中；inner height:100% width:auto aspect-ratio:9/16
- Mobile(<1024px)：container max-width: min(100%, calc(80vh * 9/16))；inner width:100%

西瓜播放器覆盖样式：
- 播放器占满容器 width/height 100% !important
- 播放按钮圆形红色 56px
- 进度条红色

动画：fadeIn、pulse-ring（播放按钮脉冲）

---

## 类型定义（src/types/index.ts）
```typescript
Playlet { id, video_id, lan, name, cover_image, source, category, status, episode_size, resource_status, resource_type, summary, highlight, episodes }
Episode { id, video_id, episode_id, episode_code, episode_index, file_path }
SiteEnvMap { siteId, hostname, theme, zoneMap, sdkSiteConfig }
SiteTheme { icon, logo, header-bg, header-color, footer-bg, footer-color, theme-color }
ZoneMap { [key: string]: string }
isEpisodeFree(episodeIndex): boolean // 目前全部返回 true

## 广告系统
BeesAds SDK：从 window.APP_PROPS 读取 siteId + zoneMap
<AdsTag>：往 <head> 注入 <script data-site-id>
<Ads zone_key="">：渲染广告占位 DOM，注册到 adsMap
useAdsInit Hook：初始化穿插广告、锚定广告、内嵌广告
广告类型：穿插(interstitial)、锚定(anchor)、内嵌(banner)

## 环境变量
NEXT_PUBLIC_API_BASE_URL=https://video.beesads.com
NEXT_PUBLIC_ENV=production|development
NEXT_PUBLIC_ADS_TAG_URL=https://sdk.beesads.com/v1/ads-tag.js
NEXT_PUBLIC_ADS_SITE_ID=
GAMEBRIDGE_API_URL=https://service.gamebridge.games/gamebridge/v1

## 颜色风格
纯深黑背景：bg-[#0a0a0f]
卡片/面板：bg-white/[0.04] border border-white/[0.08]
主文字：text-white，次要：text-white/60，更次：text-white/40
强调色：text-red-400、bg-red-500/red-600
页脚/导航背景：bg-[#0a0a0f] border-t border-white/5


##  部署

next.config.mjs: output: 'standalone', images.unoptimized: true
Docker 容器化，健康检查地址 /health
构建脚本：build:prod（cross-env NEXT_PUBLIC_ENV=production）

---

这份提示词包含了项目的**所有核心细节**，用这份提示词应该可以让我重新生成与当前项目高度一致的代码。如果需要生成某个具体模块，也可以截取对应部分单独使用。
