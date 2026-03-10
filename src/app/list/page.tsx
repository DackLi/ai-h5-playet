import type { Metadata } from 'next';
import { fetchPlayletList } from '@/lib/api';
import ListContent from './ListContent';

/**
 * 列表页 SEO 元数据（服务端静态生成，直接写入 HTML 源码）
 */
export const metadata: Metadata = {
  title: 'Browse All Shows',
  description: 'Browse and discover all short drama series on BeiDou. Filter by category, find your favorite shows.',
  keywords: 'short drama list, browse shows, drama categories, BeiDou',
  openGraph: {
    title: 'Browse All Shows | BeiDou',
    description: 'Browse and discover all short drama series on BeiDou.',
    type: 'website',
    siteName: 'BeiDou',
  },
};

/**
 * 列表页（服务端组件）
 * 在服务端调用真实 API 获取数据，传递给客户端组件
 */
export default async function ListPage() {
  const { list: playletList, total } = await fetchPlayletList('en');

  return (
    <ListContent
      initialPlayletList={playletList}
      initialTotal={total}
    />
  );
}
