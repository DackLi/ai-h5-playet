import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import AdsTag from '@/components/AdsTag';
import { I18nProvider } from '@/i18n/context';
import { SiteConfigProvider } from '@/context/SiteConfigContext';
import { fetchSiteEnvMap } from '@/lib/siteConfig';

// 默认页面元数据（作为兜底，各子页面通过 metadata 或 generateMetadata 覆盖）
// template 模式：子页面只需设置 title 字符串，会自动拼接 " | BeiDou" 后缀
export const metadata: Metadata = {
  title: {
    default: 'BeiDou - Watch Short Drama Series Online',
    template: '%s | BeiDou',
  },
  description: 'Discover trending short drama series. Sweet romance, underdog rise, time travel, suspense and more. Stream in HD.',
  keywords: 'short drama, mini series, BeiDou, watch online, romance, suspense',
  openGraph: {
    type: 'website',
    siteName: 'BeiDou',
  },
};

// 视口配置
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0f',
};

// 根布局组件（服务端组件）
// 在服务端获取站点配置（siteId、zoneMap、theme 等），注入到客户端上下文
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 从请求头中获取当前域名
  const headersList = headers();
  const hostname = headersList.get('host') || 'localhost:8089';

  // 服务端获取站点配置（siteId + sdkSiteConfig + siteConfig）
  const siteEnvMap = await fetchSiteEnvMap(hostname);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* 将站点配置注入到 window.APP_PROPS，供 adsTag SDK 和客户端组件读取 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.APP_PROPS = ${JSON.stringify(siteEnvMap)};`,
          }}
        />
        {/* 全局广告标签：使用动态获取的 siteId 注入 BeesAds SDK */}
        {siteEnvMap.siteId && (
          <AdsTag siteId={siteEnvMap.siteId} />
        )}
      </head>
      <body className="min-h-screen flex flex-col bg-[#0a0a0f]">
        <SiteConfigProvider siteEnvMap={siteEnvMap}>
          <I18nProvider>
            <Header />
            <main className="flex-1 main-content">{children}</main>
            <Footer />
            <BottomNav />
          </I18nProvider>
        </SiteConfigProvider>
      </body>
    </html>
  );
}
