'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HiHome, HiViewGrid } from 'react-icons/hi';
import { useI18n } from '@/i18n/context';

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const navItems = [
    { href: '/', label: t('home'), icon: HiHome },
    { href: '/list', label: t('browse'), icon: HiViewGrid },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/5 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-6 py-1.5 transition-colors ${
                isActive ? 'text-red-500' : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
