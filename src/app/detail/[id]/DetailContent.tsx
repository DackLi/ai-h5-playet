'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { Playlet, Episode, isEpisodeFree } from '@/types';
import { fetchPlayletDetail, fetchEpisodes, fetchRecommended, clearPlayletCache } from '@/lib/api';
import Loading from '@/components/Loading';
import { useI18n } from '@/i18n/context';
import { defaultLocale } from '@/i18n/index';
import { HiPlay, HiChevronDown, HiChevronUp, HiLockClosed, HiX, HiShare } from 'react-icons/hi';
import { useAdsInit, AdsMap } from '@/hooks/useAdsInit';

// 动态导入西瓜播放器，禁用 SSR
const XgPlayer = dynamic(() => import('@/components/XgPlayer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="w-10 h-10 border-2 border-white/30 border-t-red-500 rounded-full animate-spin" />
    </div>
  ),
});

// 页面级广告位注册表
const adsMap: AdsMap = {};

// 每页显示的剧集数量
const EPISODES_PER_PAGE = 50;

interface DetailContentProps {
  id: string;
  /** 服务端预取的短剧详情数据（默认语言） */
  initialPlaylet: Playlet | null;
  /** 服务端预取的剧集列表数据（默认语言） */
  initialEpisodes: Episode[];
  /** 服务端预取的推荐短剧数据（默认语言） */
  initialRelatedShows: Playlet[];
}

export default function DetailContent({
  id,
  initialPlaylet,
  initialEpisodes,
  initialRelatedShows,
}: DetailContentProps) {
  const { locale, t } = useI18n();
  const searchParams = useSearchParams();

  // 初始化广告
  const appProps = useAdsInit(adsMap);

  // 从 URL 参数中获取指定的剧集序号（从介绍页跳转时携带 ?ep=N）
  const epParam = searchParams.get('ep');
  const initialEpIndex = epParam ? parseInt(epParam, 10) : 1;

  // 根据 ep 参数找到对应的初始剧集
  const getInitialEpisode = (): Episode | null => {
    if (initialEpisodes.length === 0) return null;
    const found = initialEpisodes.find(ep => ep.episode_index === initialEpIndex);
    return found || initialEpisodes[0];
  };

  // 使用服务端预取的数据作为初始值
  const [playlet, setPlaylet] = useState<Playlet | null>(initialPlaylet);
  const [episodes, setEpisodes] = useState<Episode[]>(initialEpisodes);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(getInitialEpisode());
  const [loading, setLoading] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [relatedShows, setRelatedShows] = useState<Playlet[]>(initialRelatedShows);

  // 剧集分页范围
  const [activeRange, setActiveRange] = useState(0);

  // 付费弹窗状态
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingEpisode, setPendingEpisode] = useState<Episode | null>(null);

  // 自动播放下一集倒计时
  const [autoPlayCountdown, setAutoPlayCountdown] = useState<number | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 计算剧集分页范围标签
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

  // 当前分页范围内要显示的剧集
  const displayedEpisodes = useMemo(() => {
    const start = activeRange * EPISODES_PER_PAGE;
    return episodes.slice(start, start + EPISODES_PER_PAGE);
  }, [episodes, activeRange]);

  // 当用户切换语言时，重新加载对应语言的数据
  useEffect(() => {
    if (locale === defaultLocale) {
      setPlaylet(initialPlaylet);
      setEpisodes(initialEpisodes);
      setRelatedShows(initialRelatedShows);
      if (initialEpisodes.length > 0 && !currentEpisode) {
        setCurrentEpisode(initialEpisodes[0]);
      }
      return;
    }

    async function loadData() {
      setLoading(true);
      clearPlayletCache();
      try {
        const [detail, eps, related] = await Promise.all([
          fetchPlayletDetail(locale, id),
          fetchEpisodes(locale, id),
          fetchRecommended(locale),
        ]);
        setPlaylet(detail);
        setEpisodes(eps);
        setRelatedShows(related.filter(r => r.id !== id).slice(0, 6));
        if (eps.length > 0) {
          setCurrentEpisode(eps[0]);
        }
      } catch (error) {
        console.error('加载失败:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, locale]);

  // 切换剧集时动态更新浏览器标题
  useEffect(() => {
    if (playlet && currentEpisode) {
      document.title = `${playlet.name} - EP ${currentEpisode.episode_index} | BeiDou`;
    }
  }, [playlet, currentEpisode]);

  // 组件卸载时清除倒计时定时器
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // 获取下一集
  const getNextEpisode = useCallback((): Episode | null => {
    if (!currentEpisode || episodes.length === 0) return null;
    const currentIndex = episodes.findIndex(ep => ep.id === currentEpisode.id);
    if (currentIndex === -1 || currentIndex >= episodes.length - 1) return null;
    return episodes[currentIndex + 1];
  }, [currentEpisode, episodes]);

  // 获取最后一个免费剧集（用于回退）
  const getLastFreeEpisode = useCallback((): Episode | null => {
    if (episodes.length === 0) return null;
    for (let i = episodes.length - 1; i >= 0; i--) {
      if (isEpisodeFree(episodes[i].episode_index)) return episodes[i];
    }
    return episodes[0];
  }, [episodes]);

  // 开始自动播放倒计时
  const startAutoPlayCountdown = useCallback((nextEp: Episode) => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    setAutoPlayCountdown(5);
    countdownTimerRef.current = setInterval(() => {
      setAutoPlayCountdown(prev => {
        if (prev === null || prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          setCurrentEpisode(nextEp);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // 取消自动播放倒计时
  const cancelAutoPlay = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setAutoPlayCountdown(null);
  }, []);

  // 视频播放结束回调
  const handleVideoEnded = useCallback(() => {
    const nextEp = getNextEpisode();
    if (!nextEp) return;
    if (!isEpisodeFree(nextEp.episode_index)) {
      setPendingEpisode(nextEp);
      setShowPaymentModal(true);
    } else {
      startAutoPlayCountdown(nextEp);
    }
  }, [getNextEpisode, startAutoPlayCountdown]);

  // 手动切换剧集
  const handleEpisodeChange = useCallback((episode: Episode) => {
    cancelAutoPlay();
    if (!isEpisodeFree(episode.episode_index)) {
      setPendingEpisode(episode);
      setShowPaymentModal(true);
      return;
    }
    setCurrentEpisode(episode);
  }, [cancelAutoPlay]);

  // 关闭付费弹窗
  const closePaymentModal = useCallback(() => {
    setShowPaymentModal(false);
    setPendingEpisode(null);
  }, []);

  // 模拟解锁剧集
  const handleUnlockEpisode = useCallback(() => {
    if (pendingEpisode) {
      setCurrentEpisode(pendingEpisode);
      setShowPaymentModal(false);
      setPendingEpisode(null);
    }
  }, [pendingEpisode]);

  // 继续观看免费剧集
  const handleContinueFree = useCallback(() => {
    const freeEp = getLastFreeEpisode();
    if (freeEp && freeEp.id !== currentEpisode?.id) {
      setCurrentEpisode(freeEp);
    }
    setShowPaymentModal(false);
    setPendingEpisode(null);
  }, [getLastFreeEpisode, currentEpisode]);

  // 分享功能
  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: playlet?.name || 'BeiDou',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  }, [playlet]);

  // 加载中状态
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
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="flex items-center gap-2 text-sm text-white/40">
          <Link href="/" className="hover:text-white transition-colors">{t('home')}</Link>
          <span>/</span>
          <Link href={`/movie/${id}`} className="hover:text-white transition-colors line-clamp-1">{playlet.name}</Link>
          {currentEpisode && (
            <>
              <span>/</span>
              <span className="text-white/70">Episode {currentEpisode.episode_index}</span>
            </>
          )}
        </div>
      </div>

      {/* ===== 主内容区：PC端左右布局 ===== */}
      <div className="detail-main-wrapper max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="detail-layout flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* ===== 左侧：视频播放器 ===== */}
          <div className="detail-player-col w-full">
            <div className="detail-player-container relative bg-black rounded-xl overflow-hidden mx-auto lg:mx-0">
              {currentEpisode ? (
                <div className="detail-player-inner">
                  <XgPlayer
                    key={currentEpisode.id}
                    url={currentEpisode.file_path}
                    poster={playlet.cover_image}
                    autoplay={true}
                    locale={locale}
                    onEnded={handleVideoEnded}
                  />
                </div>
              ) : (
                <div className="detail-player-inner flex items-center justify-center">
                  <Image
                    src={playlet.cover_image}
                    alt={playlet.name}
                    fill
                    className="object-cover opacity-30 blur-sm"
                  />
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-red-600/80 flex items-center justify-center">
                      <HiPlay className="w-8 h-8 text-white ml-1" />
                    </div>
                    <span className="text-white/50 text-sm">{t('selectToPlay')}</span>
                  </div>
                </div>
              )}

              {/* 自动播放倒计时浮层 */}
              {autoPlayCountdown !== null && (
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 animate-fadeIn">
                  <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xl">
                    <div className="relative w-9 h-9 flex items-center justify-center">
                      <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                        <circle
                          cx="18" cy="18" r="16" fill="none" stroke="#ef4444" strokeWidth="2"
                          strokeDasharray={`${(autoPlayCountdown / 5) * 100.53} 100.53`}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <span className="absolute text-white text-xs font-bold">{autoPlayCountdown}</span>
                    </div>
                    <span className="text-white/80 text-xs whitespace-nowrap">
                      {t('autoPlayNext', { seconds: String(autoPlayCountdown) })}
                    </span>
                    <button
                      onClick={cancelAutoPlay}
                      className="text-white/50 hover:text-white transition-colors p-0.5"
                    >
                      <HiX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ===== 右侧：剧集信息 + 选集 ===== */}
          <div className="detail-info-col w-full lg:w-[500px] lg:shrink-0 py-1 lg:py-0">

            {/* 标题 */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight mb-3">
              {playlet.name}
              {currentEpisode && (
                <span className="text-white/50 font-normal text-lg lg:text-xl ml-2">
                  - Episode {currentEpisode.episode_index}
                </span>
              )}
            </h1>

            {/* 集数信息 */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="tag-pill text-[11px] bg-red-500/15 text-red-300 border-red-500/20">
                {playlet.episode_size} {t('ep')}
              </span>
              {playlet.highlight === 1 && (
                <span className="tag-pill text-[11px] bg-yellow-500/15 text-yellow-300 border-yellow-500/20">
                  🔥 {t('recommended')}
                </span>
              )}
            </div>

            {/* 剧情简介 */}
            <div className="mb-5 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
              <h2 className="text-sm font-semibold text-white/80 mb-2">
                {currentEpisode
                  ? t('plotOfEpisode', { ep: String(currentEpisode.episode_index) })
                  : t('expand')
                }
              </h2>
              <p className={`text-sm text-white/50 leading-relaxed ${!isDescExpanded ? 'line-clamp-3' : ''}`}>
                {playlet.summary}
              </p>
              <button
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="flex items-center gap-0.5 text-xs text-red-400 hover:text-red-300 mt-2 transition-colors"
              >
                {isDescExpanded ? (
                  <>{t('collapse')} <HiChevronUp className="w-3 h-3" /></>
                ) : (
                  <>{t('expand')} <HiChevronDown className="w-3 h-3" /></>
                )}
              </button>
            </div>

            {/* 分享按钮 */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-sm text-white/40">
                {t('totalEp', { total: playlet.episode_size })}
              </span>
              <button
                onClick={handleShare}
                className="ml-auto flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors"
              >
                {t('share')}
                <HiShare className="w-4 h-4" />
              </button>
            </div>

            {/* ===== 选集区域 ===== */}
            <div className="mb-5">
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

              {/* 总集数标签 */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/60 font-medium">
                  {episodes.length} {t('ep')}
                </span>
                {/* 图例说明 */}
                <div className="flex items-center gap-4 text-xs text-white/30">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-white/20 rounded-full" />
                    {t('freeToWatch')}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                    {t('vipOnly')}
                  </div>
                </div>
              </div>

              {/* 剧集网格 */}
              <div className="grid grid-cols-6 xs:grid-cols-8 sm:grid-cols-10 lg:grid-cols-8 gap-2">
                {displayedEpisodes.map((episode) => {
                  const isActive = currentEpisode?.id === episode.id;
                  const isFree = isEpisodeFree(episode.episode_index);
                  return (
                    <button
                      key={episode.id}
                      onClick={() => handleEpisodeChange(episode)}
                      className={`relative h-10 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-red-600 text-white shadow-lg shadow-red-600/25'
                          : isFree
                            ? 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/8'
                            : 'bg-white/5 text-white/30 hover:bg-yellow-500/10 hover:text-yellow-300 border border-white/8'
                      }`}
                    >
                      {episode.episode_index}
                      {!isFree && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-[7px] text-black font-bold">V</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ===== 猜你喜欢 ===== */}
            {relatedShows.length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/[0.06]">
                <h3 className="text-base font-bold text-white mb-4">{t('youMayLike')}</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-3">
                  {relatedShows.map((show) => (
                    <Link
                      key={show.id}
                      href={`/detail/${show.id}`}
                      className="group"
                    >
                      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-[#1a1a24] mb-2">
                        <Image
                          src={show.cover_image}
                          alt={show.name}
                          fill
                          loading="lazy"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <span className="text-[10px] text-white/70">
                            {show.episode_size} {t('ep')}
                          </span>
                        </div>
                      </div>
                      <h4 className="text-xs font-medium text-white/70 group-hover:text-red-400 transition-colors line-clamp-2 leading-snug">
                        {show.name}
                      </h4>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
                  onClick={handleUnlockEpisode}
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
