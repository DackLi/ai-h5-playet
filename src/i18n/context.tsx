'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Locale, Translations } from './types';
import { detectLocale, getTranslations, t as tFn } from './index';

interface I18nContextType {
  locale: Locale;
  translations: Translations;
  setLocale: (locale: Locale) => void;
  t: (key: keyof Translations, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

// 本地存储键名
const LOCALE_STORAGE_KEY = 'beidou-locale';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  // 初始化语言：优先从 localStorage 读取，否则自动检测浏览器语言
  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (stored && ['en', 'ja', 'es'].includes(stored)) {
      setLocaleState(stored);
    } else {
      const detected = detectLocale();
      setLocaleState(detected);
      localStorage.setItem(LOCALE_STORAGE_KEY, detected);
    }
    setMounted(true);
  }, []);

  // 切换语言并持久化
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const translations = getTranslations(locale);

  // 翻译函数：根据 key 获取翻译文本，支持参数替换
  const t = useCallback(
    (key: keyof Translations, params?: Record<string, string | number>) => {
      const template = translations[key];
      return tFn(template, params);
    },
    [translations]
  );

  // 防止水合不匹配：挂载前使用默认语言渲染
  if (!mounted) {
    return (
      <I18nContext.Provider value={{ locale: 'en', translations: getTranslations('en'), setLocale, t }}>
        {children}
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider value={{ locale, translations, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

// 自定义 Hook：获取国际化上下文
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n 必须在 I18nProvider 内部使用');
  }
  return context;
}
