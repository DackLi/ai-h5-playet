import { Locale, Translations, LocaleOption } from './types';
import en from './locales/en';
import ja from './locales/ja';
import es from './locales/es';

// 所有语言翻译映射
export const locales: Record<Locale, Translations> = { en, ja, es };

// 语言选项列表
export const localeOptions: LocaleOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
];

// 默认语言
export const defaultLocale: Locale = 'en';

/**
 * 检测浏览器语言并映射到支持的语言
 */
export function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return defaultLocale;

  const browserLang = navigator.language || (navigator as any).userLanguage || '';
  const lang = browserLang.toLowerCase();

  if (lang.startsWith('ja')) return 'ja';
  if (lang.startsWith('es')) return 'es';
  if (lang.startsWith('en')) return 'en';

  // 默认回退
  return defaultLocale;
}

// 获取指定语言的翻译
export function getTranslations(locale: Locale): Translations {
  return locales[locale] || locales[defaultLocale];
}

/**
 * 简单模板字符串替换："Hello {name}" + {name: "World"} => "Hello World"
 */
export function t(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (str, [key, value]) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template
  );
}

export type { Locale, Translations, LocaleOption };
