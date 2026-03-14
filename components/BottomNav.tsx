'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, Phone, Clock, Menu } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Chats',   path: '/app/dashboard',         icon: MessageCircle },
    { name: 'Calls',   path: '/app/dashboard/calls',   icon: Phone },
    { name: 'Updates', path: '/app/dashboard/updates', icon: Clock },
    { name: 'More',    path: '/app/dashboard/more',    icon: Menu },
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
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 relative"
              style={{
                color: isActive ? '#c6ff33' : 'rgba(255,255,255,0.45)',
                transition: 'color 0.2s ease',
              }}
            >
              {/* Breathing capsule backdrop for active item */}
              {isActive && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: '8px 6px',
                    background: 'rgba(198,255,51,0.10)',
                    borderRadius: 999,
                    animation: 'breathePulse 3s ease-in-out infinite',
                  }}
                />
              )}

              <Icon
                className={`nav-icon relative z-10 ${isActive ? 'icon-active-glow' : ''}`}
                style={{
                  width: 22,
                  height: 22,
                  color: isActive ? '#c6ff33' : 'rgba(255,255,255,0.45)',
                  transform: isActive ? 'scale(1.08)' : 'scale(1)',
                  transition: 'color 0.2s ease, transform 0.2s ease',
                }}
              />
              <span
                className="relative z-10"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  opacity: isActive ? 1 : 0.55,
                  transition: 'opacity 0.2s ease',
                }}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
