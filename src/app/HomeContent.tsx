'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Playlet } from '@/types';
import { fetchRecommended, fetchHotPlaylets, fetchLatestPlaylets, clearPlayletCache } from '@/lib/api';
import PlayletCard from '@/components/PlayletCard';
import SectionTitle from '@/components/SectionTitle';
import Loading from '@/components/Loading';
import { useI18n } from '@/i18n/context';
import { defaultLocale } from '@/i18n/index';
import { HiPlay, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { useAdsInit, AdsMap } from '@/hooks/useAdsInit';

// 页面级广告位注册表（对标 novel 项目的 let adsMap = {}）
const adsMap: AdsMap = {};

interface HomeContentProps {
  /** 服务端预取的推荐短剧数据（默认语言） */
  initialRecommended: Playlet[];
  /** 服务端预取的热门短剧数据（默认语言） */
  initialHotPlaylets: Playlet[];
  /** 服务端预取的最新短剧数据（默认语言） */
  initialLatestPlaylets: Playlet[];
}

export default function HomeContent({
  initialRecommended,
  initialHotPlaylets,
  initialLatestPlaylets,
}: HomeContentProps) {
  const { locale, t } = useI18n();
  const router = useRouter();

  // 初始化广告
  const appProps = useAdsInit(adsMap);

  // 使用服务端预取的数据作为初始值
  const [recommended, setRecommended] = useState<Playlet[]>(initialRecommended);
  const [hotPlaylets, setHotPlaylets] = useState<Playlet[]>(initialHotPlaylets);
  const [latestPlaylets, setLatestPlaylets] = useState<Playlet[]>(initialLatestPlaylets);
  const [loading, setLoading] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);

  // 触摸滑动
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  // 当用户切换语言时，重新加载对应语言的数据
  useEffect(() => {
    if (locale === defaultLocale) {
      setRecommended(initialRecommended);
      setHotPlaylets(initialHotPlaylets);
      setLatestPlaylets(initialLatestPlaylets);
      return;
    }

    async function loadData() {
      setLoading(true);
      clearPlayletCache(); // 切换语言时清除缓存
      try {
        const [rec, hot, latest] = await Promise.all([
          fetchRecommended(locale),
          fetchHotPlaylets(locale),
          fetchLatestPlaylets(locale),
        ]);
        setRecommended(rec);
        setHotPlaylets(hot);
        setLatestPlaylets(latest);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [locale, initialRecommended, initialHotPlaylets, initialLatestPlaylets]);

  // 横幅自动轮播
  useEffect(() => {
    if (recommended.length === 0) return;
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % Math.min(recommended.length, 4));
    }, 5000);
    return () => clearInterval(timer);
  }, [recommended.length]);

  // 加载中状态
  if (loading) return <Loading />;

  const bannerItems = recommended.slice(0, 4);
  // 如果推荐列表为空，使用热门列表的前 4 个作为横幅
  const effectiveBannerItems = bannerItems.length > 0 ? bannerItems : hotPlaylets.slice(0, 4);
  const currentBanner = effectiveBannerItems[bannerIndex % effectiveBannerItems.length];

  // 触摸开始：记录起始坐标
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };

  // 触摸结束：判断滑动方向并切换 banner
  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > deltaY) {
      isSwiping.current = true;
      if (deltaX > 0) {
        // 右滑 → 上一张
        setBannerIndex((prev) => (prev - 1 + effectiveBannerItems.length) % effectiveBannerItems.length);
      } else {
        // 左滑 → 下一张
        setBannerIndex((prev) => (prev + 1) % effectiveBannerItems.length);
      }
    }
  };

  // 点击整个 banner 区域跳转（排除滑动操作）
  const handleBannerClick = () => {
    if (!isSwiping.current && currentBanner) {
      router.push(`/detail/${currentBanner.id}`);
    }
    isSwiping.current = false;
  };

  return (
    <div className="animate-fadeIn">
      {/* ===== 顶部横幅 ===== */}
      {currentBanner && (
        <section
          className="relative w-full h-[55vh] sm:h-[65vh] lg:h-[75vh] overflow-hidden cursor-pointer"
          onClick={handleBannerClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* 背景图片 */}
          {effectiveBannerItems.map((item, idx) => (
            <div
              key={item.id}
              className={`absolute inset-0 transition-opacity duration-700 ${
                idx === (bannerIndex % effectiveBannerItems.length) ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src={item.cover_image}
                alt={item.name}
                fill
                className="object-cover"
                priority={idx === 0}
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}

          {/* 渐变遮罩 */}
          <div className="absolute inset-0 banner-overlay" />
          <div className="absolute inset-0 banner-overlay-bottom" />

          {/* 内容区域 */}
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 lg:pb-16">
              <div className="max-w-xl animate-slideUp">
                {/* 集数信息 */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] text-white/50">
                    {currentBanner.episode_size} {t('ep')}
                  </span>
                </div>

                {/* 标题 */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">
                  {currentBanner.name}
                </h1>

                {/* 简介 */}
                <p className="text-sm sm:text-base text-white/50 line-clamp-2 mb-5 leading-relaxed">
                  {currentBanner.summary}
                </p>

                {/* 播放按钮 */}
                <Link
                  href={`/detail/${currentBanner.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-full text-white font-semibold transition-all hover:shadow-lg hover:shadow-red-600/30 text-sm"
                >
                  <HiPlay className="w-5 h-5" />
                  {t('play')}
                </Link>
              </div>

              {/* 横幅指示器 */}
              <div className="flex items-center gap-2 mt-6">
                {effectiveBannerItems.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setBannerIndex(idx); }}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      idx === (bannerIndex % effectiveBannerItems.length)
                        ? 'w-8 bg-red-500'
                        : 'w-2 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 左右切换箭头（仅PC端显示） */}
          <button
            onClick={(e) => { e.stopPropagation(); setBannerIndex((prev) => (prev - 1 + effectiveBannerItems.length) % effectiveBannerItems.length); }}
            className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm items-center justify-center text-white/60 hover:text-white hover:bg-black/50 transition-all"
          >
            <HiChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setBannerIndex((prev) => (prev + 1) % effectiveBannerItems.length); }}
            className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm items-center justify-center text-white/60 hover:text-white hover:bg-black/50 transition-all"
          >
            <HiChevronRight className="w-5 h-5" />
          </button>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10 sm:space-y-14">
        {/* ===== 热门推荐 ===== */}
        {hotPlaylets.length > 0 && (
          <section>
            <SectionTitle title={t('hotPicks')} href="/list" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {hotPlaylets.map((playlet) => (
                <PlayletCard key={playlet.id} playlet={playlet} showDescription />
              ))}
            </div>
          </section>
        )}

        {/* ===== 编辑推荐 ===== */}
        {recommended.length > 0 && (
          <section>
            <SectionTitle title={t('recommended')} href="/list" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {recommended.map((playlet) => (
                <PlayletCard key={playlet.id} playlet={playlet} />
              ))}
            </div>
          </section>
        )}

        {/* ===== 最新上线 ===== */}
        {latestPlaylets.length > 0 && (
          <section>
            <SectionTitle title={t('newReleases')} href="/list" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {latestPlaylets.map((playlet) => (
                <PlayletCard key={playlet.id} playlet={playlet} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
