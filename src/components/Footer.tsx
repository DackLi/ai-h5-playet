'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useI18n } from '@/i18n/context';

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="bg-[#0a0a0f] border-t border-white/5 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="BeiDou"
              width={28}
              height={28}
              loading="lazy"
              className="w-7 h-7 object-contain"
            />
            <span className="text-sm font-semibold text-white/80">{t('siteName')}</span>
          </div>

          {/* 链接 */}
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs text-white/40">
            <Link href="/about-us" className="hover:text-white/70 transition-colors">{t('aboutUs')}</Link>
            <Link href="/contact-us" className="hover:text-white/70 transition-colors">{t('contactUs')}</Link>
            <Link href="/privacy-policy" className="hover:text-white/70 transition-colors">{t('privacyPolicy')}</Link>
            <Link href="/terms-of-use" className="hover:text-white/70 transition-colors">{t('userAgreement')}</Link>
          </div>

          {/* 版权信息 */}
          <p className="text-xs text-white/25 text-center">
            {t('footerText')}
          </p>
        </div>
      </div>
    </footer>
  );
}
