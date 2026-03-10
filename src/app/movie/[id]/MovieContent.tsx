'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Playlet, Episode, isEpisodeFree } from '@/types';
import { fetchPlayletDetail, fetchRecommended, clearPlayletCache } from '@/lib/api';
import Loading from '@/components/Loading';
import { useI18n } from '@/i18n/context';
import { defaultLocale } from '@/i18n/index';
import { HiPlay, HiLockClosed, HiX } from 'react-icons/hi';
import { useAdsInit, AdsMap } from '@/hooks/useAdsInit';

// 页面级广告位注册表
const adsMap: AdsMap = {};

// 选集分页：每页显示的剧集数量
const EPISODES_PER_PAGE = 30;

interface MovieContentProps {
  id: string;
  /** 服务端预取的短剧详情数据 */
  initialPlaylet: Playlet | null;
  /** 服务端预取的推荐短剧数据 */
  initialRelatedShows: Playlet[];
}

export default function MovieContent({
  id,
  initialPlaylet,
  initialRelatedShows,
}: MovieContentProps) {
  const { locale, t } = useI18n();
  const appProps = useAdsInit(adsMap);

  const router = useRouter();

  const [playlet, setPlaylet] = useState<Playlet | null>(initialPlaylet);
  const [relatedShows, setRelatedShows] = useState<Playlet[]>(initialRelatedShows);
  const [loading, setLoading] = useState(false);
  const [activeRange, setActiveRange] = useState(0);

  // 付费弹窗状态
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingEpisode, setPendingEpisode] = useState<Episode | null>(null);

  // 点击剧集：免费直接跳转，付费弹出弹窗
  const handleEpisodeClick = useCallback((episode: Episode) => {
    if (isEpisodeFree(episode.episode_index)) {
      // 免费剧集，直接跳转到播放页
      router.push(`/detail/${id}?ep=${episode.episode_index}`);
    } else {
      // 付费剧集，弹出付费弹窗
      setPendingEpisode(episode);
      setShowPaymentModal(true);
    }
  }, [id, router]);

  // 关闭付费弹窗
  const closePaymentModal = useCallback(() => {
    setShowPaymentModal(false);
    setPendingEpisode(null);
  }, []);

  // 模拟解锁单集（付费成功后跳转播放）
  const handleUnlockEpisode = useCallback(() => {
    if (pendingEpisode) {
      router.push(`/detail/${id}?ep=${pendingEpisode.episode_index}`);
      setShowPaymentModal(false);
      setPendingEpisode(null);
    }
  }, [id, pendingEpisode, router]);

  // 模拟解锁全部（付费成功后跳转播放）
  const handleUnlockAll = useCallback(() => {
    if (pendingEpisode) {
      router.push(`/detail/${id}?ep=${pendingEpisode.episode_index}`);
      setShowPaymentModal(false);
      setPendingEpisode(null);
    }
  }, [id, pendingEpisode, router]);

  // 继续观看免费剧集
  const handleContinueFree = useCallback(() => {
    setShowPaymentModal(false);
    setPendingEpisode(null);
  }, []);

  // 当用户切换语言时，重新加载对应语言的数据
  useEffect(() => {
    if (locale === defaultLocale) {
      setPlaylet(initialPlaylet);
      setRelatedShows(initialRelatedShows);
      return;
    }

    async function loadData() {
      setLoading(true);
      clearPlayletCache();
      try {
        const [detail, related] = await Promise.all([
          fetchPlayletDetail(locale, id),
          fetchRecommended(locale),
        ]);
        setPlaylet(detail);
        setRelatedShows(related.filter(r => r.id !== id).slice(0, 10));
      } catch (error) {
        console.error('加载失败:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, locale]);

  // 剧集列表（使用 useMemo 避免每次渲染创建新数组引用）
  const episodes = useMemo(() => playlet?.episodes || [], [playlet]);

  // 计算分页范围
  const episodeRanges = useMemo(() => {
    if (episodes.length === 0) return [];
    const ranges: { start: number; end: number }[] = [];
    for (let i = 0; i < episodes.length; i += EPISODES_PER_PAGE) {
      ranges.push({
        start: i + 1,
        end: Math.min(i + EPISODES_PER_PAGE, episodes.length),
      });
    }
    return ranges;
  }, [episodes]);

  // 当前分页范围内的剧集
  const displayedEpisodes = useMemo(() => {
    const start = activeRange * EPISODES_PER_PAGE;
    return episodes.slice(start, start + EPISODES_PER_PAGE);
  }, [episodes, activeRange]);

  if (loading) return <Loading />;

  if (!playlet) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <span className="text-3xl">😕</span>
        </div>
        <p className="text-white/50 mb-4 text-sm">{t('showNotFound')}</p>
        <Link href="/" className="text-red-400 hover:text-red-300 text-sm font-medium">
          {t('backToHome')}
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* ===== 面包屑导航 ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="flex items-center gap-2 text-sm text-white/40">
          <Link href="/" className="hover:text-white transition-colors">{t('home')}</Link>
          <span>/</span>
          <span className="text-white/70 line-clamp-1">{playlet.name}</span>
        </div>
      </div>

      {/* ===== 主内容区：封面 + 信息 ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">

          {/* 左侧：封面图 */}
          <div className="movie-cover-wrapper flex-shrink-0 mx-auto md:mx-0">
            <div className="relative w-[200px] sm:w-[240px] md:w-[280px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/10">
              <Image
                src={playlet.cover_image}
                alt={playlet.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 200px, 280px"
              />
            </div>
          </div>

          {/* 右侧：剧集信息 */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* 标题 */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-3 text-center md:text-left">
              {playlet.name}
            </h1>

            {/* 标签行：集数 + 推荐 */}
            <div className="flex flex-wrap items-center gap-2 mb-4 justify-center md:justify-start">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80 border border-white/10">
                {t('totalEp', { total: playlet.episode_size })}
              </span>
              {playlet.highlight === 1 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/15 text-yellow-300 border border-yellow-500/20">
                  🔥 {t('recommended')}
                </span>
              )}
              {/* 来源标签 */}
              {playlet.source && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  {playlet.source.toUpperCase()}
                </span>
              )}
            </div>

            {/* 剧情简介 */}
            <div className="mb-5">
              <p className="text-sm sm:text-base text-white/60 leading-relaxed">
                {playlet.summary}
              </p>
            </div>

            {/* Play 按钮 */}
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <Link
                href={`/detail/${playlet.id}`}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-red-600 hover:bg-red-500 rounded-full text-white font-bold text-base transition-all hover:shadow-lg hover:shadow-red-600/30 active:scale-[0.97]"
              >
                <HiPlay className="w-6 h-6" />
                {t('startWatching')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 选集区域 ===== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="border-t border-white/[0.06] pt-6">
          {/* 标题行 */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {t('episodeList')}
            </h2>
            <span className="text-sm text-white/40">
              {episodes.length} {t('ep')}
            </span>
          </div>

          {/* 分页范围标签 */}
          {episodeRanges.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {episodeRanges.map((range, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveRange(idx)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeRange === idx
                      ? 'bg-red-600 text-white'
                      : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/8'
                  }`}
                >
                  {range.start}-{range.end}
                </button>
              ))}
            </div>
          )}

          {/* 剧集网格 */}
          <div className="grid grid-cols-5 xs:grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-[repeat(15,minmax(0,1fr))] gap-2">
            {displayedEpisodes.map((episode) => {
              const isFree = isEpisodeFree(episode.episode_index);
              return (
                <button
                  key={episode.id}
                  onClick={() => handleEpisodeClick(episode)}
                  className={`relative flex items-center justify-center h-10 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isFree
                      ? 'bg-white/5 text-white/70 hover:bg-red-600 hover:text-white border border-white/8 hover:border-red-600'
                      : 'bg-white/5 text-white/30 hover:bg-yellow-500/10 hover:text-yellow-300 border border-white/8'
                  }`}
                >
                  EP {episode.episode_index}
                  {!isFree && (
                    <HiLockClosed className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== Find Your Gem - 推荐短剧 ===== */}
      {relatedShows.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="border-t border-white/[0.06] pt-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-5">
              {t('findYourGem')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {relatedShows.map((show) => (
                <Link
                  key={show.id}
                  href={`/detail/${show.id}`}
                  className="group block"
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a1a24] mb-2 ring-1 ring-white/5">
                    <Image
                      src={show.cover_image}
                      alt={show.name}
                      fill
                      loading="lazy"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                    />
                    {/* 渐变遮罩 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    {/* 底部信息 */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h4 className="text-xs sm:text-sm font-medium text-white line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                        {show.name}
                      </h4>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========== 付费弹窗 ========== */}
      {showPaymentModal && pendingEpisode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* 遮罩层 */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closePaymentModal}
          />

          {/* 弹窗主体 */}
          <div className="payment-modal relative w-full max-w-md bg-[#1a1a24] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-fadeIn z-10">
            {/* 顶部渐变装饰线 */}
            <div className="h-1 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600" />

            {/* 关闭按钮 */}
            <button
              onClick={closePaymentModal}
              className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors z-10"
            >
              <HiX className="w-5 h-5" />
            </button>

            {/* 弹窗内容 */}
            <div className="px-6 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-8">
              {/* 锁定图标 */}
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500/20 to-red-600/20 border border-yellow-500/30 flex items-center justify-center">
                  <HiLockClosed className="w-7 h-7 text-yellow-400" />
                </div>
              </div>

              {/* 标题 */}
              <h3 className="text-xl font-bold text-white text-center mb-2">
                {t('paymentRequired')}
              </h3>

              {/* 剧集信息 */}
              <p className="text-center text-yellow-400/80 text-sm font-medium mb-3">
                {t('currentEp', { ep: pendingEpisode.episode_index })} — Episode {pendingEpisode.episode_index}
              </p>

              {/* 描述 */}
              <p className="text-center text-white/40 text-sm leading-relaxed mb-8">
                {t('paymentDesc')}
              </p>

              {/* 操作按钮 */}
              <div className="space-y-3">
                <button
                  onClick={handleUnlockEpisode}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold text-sm transition-all shadow-lg shadow-red-600/25 hover:shadow-red-500/40 active:scale-[0.98]"
                >
                  {t('unlockEpisode')}
                </button>
                <button
                  onClick={handleUnlockAll}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white font-semibold text-sm transition-all shadow-lg shadow-yellow-600/25 hover:shadow-yellow-500/40 active:scale-[0.98]"
                >
                  {t('unlockAllEpisodes')}
                </button>
                <button
                  onClick={handleContinueFree}
                  className="w-full h-10 rounded-xl bg-transparent border border-white/10 hover:border-white/20 text-white/50 hover:text-white/80 text-sm transition-all"
                >
                  {t('continueFree')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
