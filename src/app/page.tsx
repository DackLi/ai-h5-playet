import type { Metadata } from 'next';
import { fetchRecommended, fetchHotPlaylets, fetchLatestPlaylets } from '@/lib/api';
import HomeContent from './HomeContent';

/**
 * 首页 SEO 元数据（服务端静态生成，直接写入 HTML 源码）
 */
export const metadata: Metadata = {
  title: 'BeiDou - Watch Short Drama Series Online',
  description: 'Discover trending short drama series on BeiDou. Sweet romance, underdog rise, time travel, suspense and more. Stream in HD for free.',
  keywords: 'short drama, mini series, BeiDou, watch online, romance, suspense, free streaming',
  openGraph: {
    title: 'BeiDou - Watch Short Drama Series Online',
    description: 'Discover trending short drama series on BeiDou. Stream in HD for free.',
    type: 'website',
    siteName: 'BeiDou',
  },
};

/**
 * 首页（服务端组件）
 * 在服务端调用真实 API 获取数据，传递给客户端组件进行渲染
 * 首次渲染时 HTML 中就包含完整的页面内容，有利于 SEO 爬虫抓取
 */
export default async function HomePage() {
  // 服务端并行获取数据
  const [recommended, hotPlaylets, latestPlaylets] = await Promise.all([
    fetchRecommended('en'),
    fetchHotPlaylets('en'),
    fetchLatestPlaylets('en'),
  ]);

  return (
    <HomeContent
      initialRecommended={recommended}
      initialHotPlaylets={hotPlaylets}
      initialLatestPlaylets={latestPlaylets}
    />
  );
}
