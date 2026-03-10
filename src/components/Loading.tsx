'use client';

import { useI18n } from '@/i18n/context';

export default function Loading() {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border-2 border-red-500/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <span className="text-sm text-white/40">{t('loading')}</span>
      </div>
    </div>
  );
}
