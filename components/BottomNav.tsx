'use client';

import { useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MessageCircle, Sparkles, Bot, Phone, Menu, Plus } from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Chats',  path: '/dashboard',         icon: MessageCircle, middle: false },
  { name: 'Status', path: '/dashboard/status',  icon: Sparkles,      middle: false },
  { name: 'M+Ai',  path: '/dashboard/ai',       icon: Bot,           middle: true  },
  { name: 'Calls',  path: '/dashboard/calls',   icon: Phone,         middle: false },
  { name: 'More',   path: '/dashboard/more',    icon: Menu,          middle: false },
];
const TAB_PATHS = NAV_ITEMS.map((n) => n.path);

function hapticTick() {
  if ('vibrate' in navigator) navigator.vibrate(8);
}

export default function BottomNav() {
  const pathname = usePathname();
  const router   = useRouter();
  const touchX   = useRef<number | null>(null);

  const isInChat = pathname.startsWith('/dashboard/chat/');

  const onTouchStart = useCallback((e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; }, []);
  const onTouchEnd   = useCallback((e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 50) return;
    const cur = TAB_PATHS.indexOf(pathname);
    if (cur === -1) return;
    const next = dx < 0 ? Math.min(cur + 1, TAB_PATHS.length - 1) : Math.max(cur - 1, 0);
    if (next !== cur) { hapticTick(); router.push(TAB_PATHS[next]); }
  }, [pathname, router]);

  useEffect(() => {
    let sx = 0;
    const s = (e: TouchEvent) => { sx = e.touches[0].clientX; };
    const en = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) < 60) return;
      const cur = TAB_PATHS.indexOf(pathname);
      if (cur === -1) return;
      const next = dx < 0 ? Math.min(cur + 1, TAB_PATHS.length - 1) : Math.max(cur - 1, 0);
      if (next !== cur) { hapticTick(); router.push(TAB_PATHS[next]); }
    };
    document.addEventListener('touchstart', s, { passive: true });
    document.addEventListener('touchend', en, { passive: true });
    return () => { document.removeEventListener('touchstart', s); document.removeEventListener('touchend', en); };
  }, [pathname, router]);

  return (
    <>
      {!isInChat && (
        <div style={{ position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)', zIndex: 60 }}>
          <button
            aria-label="New chat"
            onClick={() => { hapticTick(); router.push('/dashboard'); }}
            style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'linear-gradient(135deg, #c6ff33 0%, #a8e000 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(198,255,51,0.5)', border: 'none', cursor: 'pointer',
              transition: 'transform 0.2s cubic-bezier(0.175,0.885,0.32,1.275)',
            }}
          >
            <Plus style={{ width: 22, height: 22, color: '#06000c', strokeWidth: 2.5 }} />
          </button>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-5"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="floating-nav flex items-center justify-around h-16 rounded-2xl px-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path === '/dashboard' && pathname === '/dashboard');
            const isMid = item.middle;

            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={hapticTick}
                className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative"
                style={{ color: isMid ? '#c6ff33' : isActive ? '#c6ff33' : '#ffffff' }}
              >
                {isActive && !isMid && (
                  <span aria-hidden style={{ position: 'absolute', inset: '8px 6px', background: 'rgba(198,255,51,0.10)', borderRadius: 999, animation: 'breathePulse 3s ease-in-out infinite' }} />
                )}
                <Icon
                  className={`nav-icon relative z-10 ${isMid ? 'middle-icon' : isActive ? 'icon-active-glow' : ''}`}
                  style={{
                    width: isMid ? 26 : 22,
                    height: isMid ? 26 : 22,
                    color: isMid ? '#c6ff33' : isActive ? '#c6ff33' : '#ffffff',
                    transform: isActive && !isMid ? 'translateY(-5px) scale(1.08)' : 'translateY(0) scale(1)',
                    transition: 'color 0.15s ease, transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
                  }}
                />
                <span
                  className="relative z-10"
                  style={{
                    fontSize: isMid ? 9 : 10, fontWeight: 700, letterSpacing: '0.04em',
                    opacity: isActive ? 1 : 0.65,
                    color: isMid ? '#c6ff33' : isActive ? '#c6ff33' : '#ffffff',
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
