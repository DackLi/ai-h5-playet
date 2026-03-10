import type { Metadata } from 'next';
import { Suspense } from 'react';
import { fetchPlayletDetail, fetchEpisodes, fetchRecommended } from '@/lib/api';
import DetailContent from './DetailContent';
import Loading from '@/components/Loading';

/**
 * 服务端动态生成 SEO 元数据
 * 根据短剧 ID 获取标题、描述等信息，直接写入 HTML <head> 中
 */
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { id } = params;

  const playlet = await fetchPlayletDetail('en', id);

  if (!playlet) {
    return {
      title: 'Not Found | BeiDou',
      description: 'The requested show was not found.',
    };
  }

  const title = `${playlet.name} - Episode 1`;
  const description = playlet.summary.slice(0, 160);

  return {
    title,
    description,
    keywords: `${playlet.name}, BeiDou, short drama`,
    openGraph: {
      title: `${title} | BeiDou`,
      description,
      type: 'video.episode',
      siteName: 'BeiDou',
      images: [
        {
          url: playlet.cover_image,
          width: 400,
          height: 560,
          alt: playlet.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | BeiDou`,
      description,
      images: [playlet.cover_image],
    },
  };
}

/**
 * 详情页（服务端组件）
 * 在服务端调用真实 API 获取短剧详情、剧集列表和推荐数据
 */
export default async function DetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  // 服务端并行获取数据
  const [playlet, episodes, recommended] = await Promise.all([
    fetchPlayletDetail('en', id),
    fetchEpisodes('en', id),
    fetchRecommended('en'),
  ]);

  const relatedShows = recommended.filter(r => r.id !== id).slice(0, 6);

  return (
    <Suspense fallback={<Loading />}>
      <DetailContent
        id={id}
        initialPlaylet={playlet}
        initialEpisodes={episodes}
        initialRelatedShows={relatedShows}
      />
    </Suspense>
  );
}
