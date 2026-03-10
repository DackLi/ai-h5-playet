'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { IPlayerOptions } from 'xgplayer';

interface XgPlayerProps {
  url: string;
  poster?: string;
  autoplay?: boolean;
  locale?: string;
  onEnded?: () => void;
}

// ============ 模块级状态：跨组件实例共享 ============
// 记录用户是否已经有过交互（点击取消静音 / 有声播放成功过）
// 一旦为 true，后续所有新播放器实例都直接有声播放，不再走降级逻辑
let userHasInteracted = false;

/**
 * 模块级 AbortError 静默处理器
 *
 * 注意：不能注册在组件 useEffect 里。
 * 原因：cleanup 用 setTimeout 延迟销毁时，组件已卸载、事件监听器已移除，
 *       导致 HLS fetch 被 abort 后的 AbortError 没有处理器而报错。
 * 解决方案：在模块加载时注册一次，不随组件生命周期销毁。
 */
let _abortHandlerRegistered = false;
function ensureAbortErrorSuppressed() {
  if (_abortHandlerRegistered || typeof window === 'undefined') return;
  _abortHandlerRegistered = true;
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    // 切集时 HLS 请求被中断是正常行为，静默处理
    if (event.reason?.name === 'AbortError') {
      event.preventDefault();
    }
  });
}

/**
 * 判断视频 URL 的格式类型
 * @param url 视频地址
 * @returns 'hls' | 'mp4' | 'unknown'
 */
function detectVideoFormat(url: string): 'hls' | 'mp4' | 'unknown' {
  if (!url) return 'unknown';
  const lowerUrl = url.toLowerCase().split('?')[0]; // 去掉查询参数后判断
  if (lowerUrl.endsWith('.m3u8')) return 'hls';
  if (lowerUrl.endsWith('.mp4')) return 'mp4';
  // 部分 CDN 的 m3u8 地址可能不以 .m3u8 结尾，但路径中包含 m3u8 关键字
  if (lowerUrl.includes('.m3u8')) return 'hls';
  return 'unknown';
}

/**
 * 西瓜播放器组件
 *
 * 视频格式支持：
 * - mp4：使用 xgplayer 内置解码，直接播放
 * - m3u8 (HLS)：自动加载 xgplayer-hls 插件进行解析播放
 * - 根据传入的 url 后缀自动识别格式，无需手动指定
 *
 * 自动播放策略（渐进式降级）：
 * 1. 首先尝试有声自动播放（autoplayMuted: false）
 * 2. 如果浏览器阻止有声播放（几乎所有移动端浏览器都会阻止），
 *    自动降级为静音播放，并显示"点击开启声音"提示
 * 3. 用户点击提示后取消静音（此时已有用户交互，浏览器允许有声播放）
 * 4. 用户手动取消静音后，后续切集都会记住有声状态
 *
 * 浏览器自动播放政策参考：
 * - Chrome/Firefox/Safari 均默认阻止有声自动播放
 * - iOS Safari 最为严格，即使 muted 也需要 playsinline 属性
 * - 静音自动播放在所有主流浏览器中均被允许
 */
export default function XgPlayer({ url, poster, autoplay = true, locale = 'en', onEnded }: XgPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const onEndedRef = useRef(onEnded);

  // 确保模块级 AbortError 静默处理器已注册（幂等，只注册一次）
  ensureAbortErrorSuppressed();

  // 是否因浏览器策略降级为静音播放（显示"点击开启声音"提示）
  const [isMutedFallback, setIsMutedFallback] = useState(false);

  // 保持 onEnded 回调引用最新，避免触发播放器重新初始化
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  // 根据应用语言映射到西瓜播放器语言包
  const getLanguage = useCallback(async () => {
    const xg = await import('xgplayer');
    switch (locale) {
      case 'ja':
        return xg.langJp;
      case 'es':
        return xg.langEs;
      default:
        return xg.langEn;
    }
  }, [locale]);

  // 初始化播放器
  useEffect(() => {
    if (!containerRef.current || !url) return;

    let destroyed = false;

    const initPlayer = async () => {
      // 销毁已有的播放器实例（先暂停 + 清空 src，避免 HLS AbortError）
      if (playerRef.current) {
        try {
          const oldPlayer = playerRef.current;
          try { oldPlayer.pause(); } catch (_) { /* 忽略 */ }
          try {
            const video = oldPlayer.video as HTMLVideoElement | undefined;
            if (video) {
              video.pause();
              video.removeAttribute('src');
              video.load();
            }
          } catch (_) { /* 忽略 */ }
          oldPlayer.destroy();
        } catch (e) {
          // 忽略销毁错误
        }
        playerRef.current = null;
      }

      if (destroyed) return;

      // 动态导入 xgplayer 核心模块，避免 SSR 问题
      const xgModule = await import('xgplayer');
      await import('xgplayer/dist/index.min.css');

      if (destroyed || !containerRef.current) return;

      const PresetPlayer = xgModule.default;
      const Events = xgModule.Events;
      const lang = await getLanguage();

      // ========== 根据 URL 格式自动选择播放器插件 ==========
      const videoFormat = detectVideoFormat(url);
      const plugins: any[] = [];

      // m3u8 格式需要加载 HLS 插件
      if (videoFormat === 'hls') {
        try {
          const hlsModule = await import('xgplayer-hls');
          plugins.push(hlsModule.HlsPlugin);
          console.log('[XgPlayer] 检测到 HLS (m3u8) 格式，已加载 HlsPlugin');
        } catch (e) {
          console.error('[XgPlayer] 加载 HLS 插件失败:', e);
        }
      } else {
        console.log(`[XgPlayer] 检测到 ${videoFormat} 格式，使用内置解码`);
      }

      // ========== 渐进式自动播放策略 ==========
      // 核心逻辑：
      // - 首次加载：尝试有声自动播放，失败则降级静音 + 显示提示
      // - 用户交互后（点击取消静音 / 点击播放 / 切集）：直接有声播放
      //   因为浏览器的自动播放策略是"页面级"的，一旦用户在页面上有过交互，
      //   后续的 play() 调用都会被允许有声播放
      const shouldTryMuted = !userHasInteracted;
      
      if (userHasInteracted) {
        console.log('[XgPlayer] 用户已有交互记录，直接有声播放');
      }

      const config: IPlayerOptions = {
        el: containerRef.current,
        url: url,
        poster: poster || '',
        autoplay: autoplay,
        // 如果用户已交互过，直接有声播放；否则先尝试有声，失败再降级
        autoplayMuted: false,
        playsinline: true,
        // 不使用 fluid（fluid 会强制按视频原始比例计算 padding-top: 56.25% 即 16:9）
        // 改为 width/height 100% 填满父容器，由父容器的 aspectRatio 控制竖屏比例
        fluid: false,
        width: '100%',
        height: '100%',
        // fill 模式让视频内容填满播放器区域（裁剪超出部分）
        videoFillMode: 'fill',
        lang: lang as any,
        volume: 0.6,
        commonStyle: {
          progressColor: '#cc2229',
          playedColor: '#cc2229',
          volumeColor: '#cc2229',
        },
        marginControls: false,
        // 注册插件（m3u8 时注入 HlsPlugin，mp4 时为空数组）
        plugins: plugins,
      };

      try {
        const player = new PresetPlayer(config);
        playerRef.current = player;

        // 重置静音降级状态
        setIsMutedFallback(false);

        // 监听视频播放结束事件
        player.on(Events.ENDED, () => {
          if (onEndedRef.current) {
            onEndedRef.current();
          }
        });

        // ========== 监听有声播放成功 ==========
        // 一旦视频成功有声播放，标记用户已交互
        player.on(Events.PLAY, () => {
          if (!player.muted) {
            userHasInteracted = true;
          }
        });

        // ========== 处理自动播放被阻止的情况 ==========
        // 当浏览器阻止有声自动播放时，降级为静音播放
        // 西瓜播放器会触发 autoplay_was_prevented 事件
        player.on('autoplay_was_prevented', () => {
          if (destroyed) return;
          
          if (userHasInteracted) {
            // 用户已有交互，理论上不应被阻止，尝试直接 play()
            console.warn('[XgPlayer] 用户已交互但自动播放仍被阻止，尝试手动 play()');
            player.play().catch(() => {
              // 极端情况：降级静音
              player.muted = true;
              player.play().catch(() => {});
              setIsMutedFallback(true);
            });
            return;
          }
          
          console.warn('[XgPlayer] 首次有声自动播放被浏览器阻止，降级为静音播放');
          // 静音后重新尝试播放
          player.muted = true;
          player.play().catch(() => {
            // 如果静音播放也失败（极端情况），不做额外处理
            console.error('[XgPlayer] 静音自动播放也被阻止');
          });
          // 显示"点击开启声音"提示
          setIsMutedFallback(true);
        });

        // 额外兜底：监听播放器的 play promise 被拒绝
        // 部分浏览器/播放器版本可能不触发 autoplay_was_prevented
        if (autoplay && shouldTryMuted) {
          // 给播放器一点初始化时间（仅首次无交互时兜底）
          setTimeout(() => {
            if (destroyed || !playerRef.current) return;
            const video = playerRef.current.video as HTMLVideoElement | undefined;
            if (video && video.paused && !video.ended) {
              // 视频仍然暂停，说明自动播放失败
              console.warn('[XgPlayer] 兜底检测：自动播放未生效，降级为静音播放');
              video.muted = true;
              video.play().then(() => {
                setIsMutedFallback(true);
              }).catch(() => {
                console.error('[XgPlayer] 兜底静音播放也失败');
              });
            }
          }, 1000);
        }

      } catch (e) {
        console.error('西瓜播放器初始化失败:', e);
      }
    };

    initPlayer().catch(() => { /* 初始化被中断时（快速切集）忽略错误 */ });

    // 组件卸载时销毁播放器
    return () => {
      destroyed = true;
      if (playerRef.current) {
        const player = playerRef.current;
        playerRef.current = null;
        // 先暂停并清空 src，让 HLS loader 停止拉取 segment
        try { player.pause(); } catch (_) { /* 忽略 */ }
        try {
          const video = player.video as HTMLVideoElement | undefined;
          if (video) {
            video.pause();
            video.removeAttribute('src');
            video.load();
          }
        } catch (_) { /* 忽略 */ }
        // 同步销毁（不用 setTimeout）：
        // - 已清空 src，HLS 新的 fetch 不会再发出
        // - 残余 AbortError 由模块级 unhandledrejection 处理器统一静默
        try { player.destroy(); } catch (_) { /* 忽略 */ }
      }
    };
  }, [url, poster, autoplay, getLanguage]);

  // 用户点击"开启声音"按钮
  const handleUnmute = useCallback(() => {
    if (playerRef.current) {
      const player = playerRef.current;
      player.muted = false;
      player.volume = 0.6;
      // 如果视频暂停了，尝试播放（此时有用户交互，浏览器允许有声播放）
      if (player.paused) {
        player.play().catch(() => {});
      }
    }
    // 标记用户已交互，后续切集不再降级静音
    userHasInteracted = true;
    setIsMutedFallback(false);
    console.log('[XgPlayer] 用户点击取消静音，已标记交互状态，后续切集将直接有声播放');
  }, []);

  return (
    <>
      {/* 播放器容器 */}
      <div
        ref={containerRef}
        className="xg-player-wrapper"
      />

      {/* 静音降级提示：浏览器阻止有声播放时显示
          使用 fixed 定位避免额外嵌套 div 导致水合不匹配 */}
      {isMutedFallback && (
        <button
          onClick={handleUnmute}
          className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-2 
                     bg-black/70 backdrop-blur-sm border border-white/20 rounded-full 
                     text-white text-xs font-medium hover:bg-black/90 
                     transition-all animate-fadeIn cursor-pointer
                     active:scale-95"
          aria-label="开启声音"
        >
          {/* 静音图标 */}
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
          <span>
            {locale === 'ja' ? '音声をオンにする' : locale === 'es' ? 'Activar sonido' : 'Tap to unmute'}
          </span>
        </button>
      )}
    </>
  );
}
