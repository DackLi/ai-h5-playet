'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Playlet } from '@/types';
import { fetchPlayletList, searchPlaylets, clearPlayletCache } from '@/lib/api';
import PlayletCard from '@/components/PlayletCard';
import Loading from '@/components/Loading';
import { useI18n } from '@/i18n/context';
import { defaultLocale } from '@/i18n/index';
import { useAdsInit, AdsMap } from '@/hooks/useAdsInit';

// 页面级广告位注册表
const adsMap: AdsMap = {};

interface ListContentProps {
  /** 服务端预取的短剧列表数据（默认语言） */
  initialPlayletList: Playlet[];
  /** 服务端预取的短剧总数 */
  initialTotal: number;
}

function ListInner({
  initialPlayletList,
  initialTotal,
}: ListContentProps) {
  const { locale, t } = useI18n();

  // 初始化广告
  const appProps = useAdsInit(adsMap);

  const searchParams = useSearchParams();
  const keywordParam = searchParams.get('keyword') || '';

  // 使用服务端预取的数据作为初始值
  const [playletList, setPlayletList] = useState<Playlet[]>(initialPlayletList);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(initialTotal);

  // 标记是否已完成首次客户端初始化
  const [initialized, setInitialized] = useState(false);

  // 当语言切换或 URL 参数变化时，重新加载数据
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      if (locale === defaultLocale && !keywordParam) {
        return;
      }
    }

    async function reloadData() {
      setLoading(true);
      clearPlayletCache();
      try {
        if (keywordParam) {
          const results = await searchPlaylets(locale, keywordParam);
          setPlayletList(results);
          setTotal(results.length);
        } else {
          const { list, total: totalCount } = await fetchPlayletList(locale);
          setPlayletList(list);
          setTotal(totalCount);
        }
      } catch (error) {
        console.error('加载失败:', error);
      } finally {
        setLoading(false);
      }
    }
    reloadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, keywordParam]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fadeIn">
      {/* 页面标题 */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {keywordParam
            ? t('searchResultsFor', { keyword: keywordParam })
            : t('allShows')
          }
        </h1>
        {!keywordParam && (
          <p className="text-sm text-white/40 mt-1.5">
            {t('totalShows', { count: total })}
          </p>
        )}
      </div>

      {/* 短剧列表 */}
      {loading ? (
        <Loading />
      ) : playletList.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {playletList.map((playlet) => (
            <PlayletCard key={playlet.id} playlet={playlet} showDescription />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <span className="text-3xl">🎬</span>
          </div>
          <p className="text-white/40 text-sm">{t('noResults')}</p>
        </div>
      )}

      {/* 搜索结果数量 */}
      {keywordParam && !loading && playletList.length > 0 && (
        <p className="text-center text-sm text-white/30 mt-8">
          {t('foundResults', { count: playletList.length })}
        </p>
      )}
    </div>
  );
}

export default function ListContent(props: ListContentProps) {
  return (
    <Suspense fallback={<Loading />}>
      <ListInner {...props} />
    </Suspense>
  );
}
