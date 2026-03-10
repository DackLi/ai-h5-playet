import type { Metadata } from 'next';
import { fetchPlayletDetail, fetchRecommended } from '@/lib/api';
import MovieContent from './MovieContent';

/**
 * 剧集介绍页 - 服务端动态生成 SEO 元数据
 * 路由：/movie/[id]
 * 参考竞品：https://www.flickreels.net/movie/xxx
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

  const title = `${playlet.name} - Watch Online | BeiDou`;
  const description = playlet.summary.slice(0, 160);

  return {
    title,
    description,
    keywords: `${playlet.name}, BeiDou, short drama, watch online, ${playlet.episode_size} episodes`,
    openGraph: {
      title,
      description,
      type: 'video.movie',
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
      title,
      description,
      images: [playlet.cover_image],
    },
  };
}

/**
 * 剧集介绍页（服务端组件）
 * 展示短剧封面、简介、选集列表、推荐短剧
 * 点击 Play 或选集跳转到 /detail/[id] 播放页
 */
export default async function MoviePage({ params }: { params: { id: string } }) {
  const { id } = params;

  // 服务端并行获取数据
  const [playlet, recommended] = await Promise.all([
    fetchPlayletDetail('en', id),
    fetchRecommended('en'),
  ]);

  const relatedShows = recommended.filter(r => r.id !== id).slice(0, 10);

  return (
    <MovieContent
      id={id}
      initialPlaylet={playlet}
      initialRelatedShows={relatedShows}
    />
  );
}
