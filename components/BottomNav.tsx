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
  const touchY   = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => { 
    touchX.current = e.touches[0].clientX; 
    touchY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd   = useCallback((e: React.TouchEvent) => {
    if (touchX.current === null || touchY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    const dy = e.changedTouches[0].clientY - touchY.current;
    touchX.current = null;
    touchY.current = null;

    if (Math.abs(dy) > Math.abs(dx) || Math.abs(dy) > 35) return;
    if (Math.abs(dx) < 65) return;

    const cur = TAB_PATHS.indexOf(pathname);
    if (cur === -1) return;
    const next = dx < 0 ? Math.min(cur + 1, TAB_PATHS.length - 1) : Math.max(cur - 1, 0);
    if (next !== cur) { hapticTick(); router.push(TAB_PATHS[next]); }
  }, [pathname, router]);

  useEffect(() => {
    let sx = 0; let sy = 0;
    const s = (e: TouchEvent) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; };
    const en = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      
      if (Math.abs(dy) > Math.abs(dx) || Math.abs(dy) > 35) return;
      if (Math.abs(dx) < 70) return;

      const cur = TAB_PATHS.indexOf(pathname);
      if (cur === -1) return;
      const next = dx < 0 ? Math.min(cur + 1, TAB_PATHS.length - 1) : Math.max(cur - 1, 0);
      if (next !== cur) { hapticTick(); router.push(TAB_PATHS[next]); }
    };
    document.addEventListener('touchstart', s, { passive: true });
    document.addEventListener('touchend', en, { passive: true });
    return () => { document.removeEventListener('touchstart', s); document.removeEventListener('touchend', en); };
  }, [pathname, router]);

  const isInChatPage = pathname.startsWith('/dashboard/chat');

  return (
    <>
      {!isInChatPage && (
        <div style={{ position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)', zIndex: 60 }}>
          <button
            aria-label="New chat"
            onClick={() => { hapticTick(); router.push('/dashboard?newchat=1'); }}
            style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff0066 0%, #a8e000 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(198,255,51,0.5)', border: 'none', cursor: 'pointer',
              transition: 'transform 0.2s cubic-bezier(0.175,0.885,0.32,1.275)',
            }}
          >
            <Plus style={{ width: 22, height: 22, color: '#14141f', strokeWidth: 2.5 }} />
          </button>
        </div>
      )}

      <nav
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: '#14141f' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '4rem', maxWidth: '28rem', margin: '0 auto', padding: '0 1rem' }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/dashboard' 
              ? pathname.startsWith('/dashboard') 
              : pathname === item.path;
            const isMid = item.middle;

            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={hapticTick}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  flex: 1, 
                  height: '100%', 
                  gap: '0.125rem', 
                  position: 'relative',
                  color: isMid ? '#ff0066' : isActive ? '#ff0066' : '#ffffff' 
                }}
              >
                {isActive && !isMid && (
                  <span aria-hidden style={{ position: 'absolute', inset: '8px 6px', background: 'rgba(198,255,51,0.10)', borderRadius: 999, animation: 'breathePulse 3s ease-in-out infinite' }} />
                )}
                <Icon
                  style={{
                    position: 'relative',
                    zIndex: 10,
                    width: isMid ? 26 : 22,
                    height: isMid ? 26 : 22,
                    color: isMid ? '#ff0066' : isActive ? '#ff0066' : '#ffffff',
                    transform: isActive && !isMid ? 'translateY(-5px) scale(1.08)' : 'translateY(0) scale(1)',
                    transition: 'color 0.15s ease, transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
                    filter: isActive ? 'drop-shadow(0 0 8px currentColor)' : 'none'
                  }}
                />
                <span
                  style={{
                    position: 'relative',
                    zIndex: 10,
                    fontSize: isMid ? 9 : 10, 
                    fontWeight: 700, 
                    letterSpacing: '0.04em',
                    opacity: isActive ? 1 : 0.65,
                    color: isMid ? '#ff0066' : isActive ? '#ff0066' : '#ffffff',
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
