'use client';

import Link from 'next/link';
import { HiChevronRight } from 'react-icons/hi';
import { useI18n } from '@/i18n/context';

interface SectionTitleProps {
  title: string;
  href?: string;
  showMore?: boolean;
}

export default function SectionTitle({ title, href, showMore = true }: SectionTitleProps) {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
        {title}
      </h2>
      {showMore && href && (
        <Link
          href={href}
          className="flex items-center gap-0.5 text-sm text-white/40 hover:text-red-400 transition-colors"
        >
          {t('more')}
          <HiChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
