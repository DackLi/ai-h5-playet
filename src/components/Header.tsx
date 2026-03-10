'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HiMenu, HiX, HiSearch } from 'react-icons/hi';
import { useI18n } from '@/i18n/context';
import { localeOptions } from '@/i18n';
import { Locale } from '@/i18n/types';
import { HiGlobeAlt } from 'react-icons/hi';

export default function Header() {
  const { locale, setLocale, t } = useI18n();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const router = useRouter();
  const langRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭语言下拉菜单
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 搜索处理
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      router.push(`/list?keyword=${encodeURIComponent(searchKeyword.trim())}`);
      setSearchKeyword('');
      setIsMenuOpen(false);
    }
  };

  const currentLocaleOption = localeOptions.find(l => l.code === locale);

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/images/logo.png"
              alt="BeiDou"
              width={34}
              height={34}
              className="w-[34px] h-[34px] object-contain"
              priority
            />
            <span className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {t('siteName')}
            </span>
          </Link>

          {/* PC端导航 */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-white/70 hover:text-white transition-colors font-medium text-sm">
              {t('home')}
            </Link>
            <Link href="/list" className="text-white/70 hover:text-white transition-colors font-medium text-sm">
              {t('browse')}
            </Link>
          </nav>

          {/* 右侧功能区 */}
          <div className="flex items-center gap-3">
            {/* 搜索框 */}
            <form onSubmit={handleSearch} className="hidden sm:flex items-center relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-44 lg:w-56 h-9 pl-4 pr-10 rounded-full bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-red-500/50 focus:bg-white/8 transition-all"
              />
              <button
                type="submit"
                className="absolute right-3 text-white/40 hover:text-red-400 transition-colors"
              >
                <HiSearch className="w-4 h-4" />
              </button>
            </form>

            {/* 语言切换器 */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm"
              >
                <HiGlobeAlt className="w-4 h-4" />
                <span className="hidden sm:inline">{currentLocaleOption?.nativeLabel}</span>
              </button>

              {isLangOpen && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fadeIn z-50">
                  {localeOptions.map((option) => (
                    <button
                      key={option.code}
                      onClick={() => {
                        setLocale(option.code as Locale);
                        setIsLangOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                        locale === option.code
                          ? 'bg-red-600/20 text-red-400'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span>{option.nativeLabel}</span>
                      {locale === option.code && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 移动端菜单按钮 */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white/70 hover:text-white transition-colors p-1"
            >
              {isMenuOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* 移动端菜单 */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t border-white/5 mt-2 pt-4 animate-fadeIn">
            <form onSubmit={handleSearch} className="flex items-center relative mb-4 sm:hidden">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full h-10 pl-4 pr-10 rounded-full bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-red-500/50"
              />
              <button
                type="submit"
                className="absolute right-3 text-white/40 hover:text-red-400"
              >
                <HiSearch className="w-4 h-4" />
              </button>
            </form>
            <nav className="flex flex-col gap-1">
              <Link
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className="text-white/70 hover:text-white hover:bg-white/5 transition-all font-medium px-3 py-2.5 rounded-lg text-sm"
              >
                {t('home')}
              </Link>
              <Link
                href="/list"
                onClick={() => setIsMenuOpen(false)}
                className="text-white/70 hover:text-white hover:bg-white/5 transition-all font-medium px-3 py-2.5 rounded-lg text-sm"
              >
                {t('browse')}
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
