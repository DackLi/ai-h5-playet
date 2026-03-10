'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Playlet } from '@/types';
import { useI18n } from '@/i18n/context';
import { HiPlay } from 'react-icons/hi';

interface PlayletCardProps {
  playlet: Playlet;
  showDescription?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function PlayletCard({ playlet, showDescription = false, size = 'medium' }: PlayletCardProps) {
  const { t } = useI18n();

  return (
    <Link href={`/detail/${playlet.id}`} className="group block card-glow">
      <div className="relative overflow-hidden rounded-xl bg-[#1a1a24] aspect-[3/4]">
        {/* 封面图 */}
        <Image
          src={playlet.cover_image}
          alt={playlet.name}
          fill
          loading="lazy"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes={size === 'large' ? '(max-width: 768px) 50vw, 25vw' : '(max-width: 768px) 33vw, 16vw'}
        />

        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* 悬浮播放按钮 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="relative w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center play-btn-pulse">
            <HiPlay className="w-6 h-6 text-white ml-0.5" />
          </div>
        </div>

        {/* 推荐标签（highlight === 1 时显示） */}
        {playlet.highlight === 1 && (
          <div className="absolute top-2.5 left-2.5">
            <span className="tag-pill text-[10px]">
              🔥 {t('recommended')}
            </span>
          </div>
        )}

        {/* 集数 - 右上角 */}
        <div className="absolute top-2.5 right-2.5">
          <span className="text-[10px] text-white/80 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
            {playlet.episode_size} {t('ep')}
          </span>
        </div>

        {/* 底部信息 */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className={`font-bold text-white line-clamp-2 mb-1 leading-tight ${
            size === 'large' ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
          }`}>
            {playlet.name}
          </h3>

          {/* 简介（大卡片显示） */}
          {showDescription && (
            <p className="text-[11px] text-white/50 line-clamp-2 mt-1.5 leading-relaxed">
              {playlet.summary}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
