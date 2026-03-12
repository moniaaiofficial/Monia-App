'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, Phone, Clock, Menu } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Chats', path: '/app/dashboard', icon: MessageCircle },
    { name: 'Calls', path: '/app/dashboard/calls', icon: Phone },
    { name: 'Updates', path: '/app/dashboard/updates', icon: Clock },
    { name: 'More', path: '/app/dashboard/more', icon: Menu },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-5">
      <div className="floating-nav flex items-center justify-around h-16 rounded-2xl px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 ${
                isActive ? 'text-[#ff1e43]' : 'text-white/50'
              }`}
            >
              <Icon
                className={`w-6 h-6 transition-all duration-200 ${isActive ? 'icon-active-glow scale-110' : ''}`}
              />
              <span className={`text-xs font-semibold tracking-wide ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
