'use client';

import { useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MessageCircle, Sparkles, Bot, Phone, Menu, Plus } from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Chats',  path: '/app/dashboard',         icon: MessageCircle, middle: false },
  { name: 'Status', path: '/app/dashboard/status',  icon: Sparkles,      middle: false },
  { name: 'M+Ai',  path: '/app/dashboard/ai',       icon: Bot,           middle: true  },
  { name: 'Calls',  path: '/app/dashboard/calls',   icon: Phone,         middle: false },
  { name: 'More',   path: '/app/dashboard/more',    icon: Menu,          middle: false },
];

const TAB_PATHS = NAV_ITEMS.map((n) => n.path);

function hapticTick() {
  if ('vibrate' in navigator) navigator.vibrate(8);
}

export default function BottomNav() {
  const pathname  = usePathname();
  const router    = useRouter();
  const touchX    = useRef<number | null>(null);
  const navRef    = useRef<HTMLDivElement>(null);

  /* ── Swipe left/right to change tab ─────────────────────────── */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchX.current === null) return;
      const dx = e.changedTouches[0].clientX - touchX.current;
      touchX.current = null;
      if (Math.abs(dx) < 50) return;

      const currentIdx = TAB_PATHS.indexOf(pathname);
      if (currentIdx === -1) return;

      const nextIdx = dx < 0
        ? Math.min(currentIdx + 1, TAB_PATHS.length - 1)
        : Math.max(currentIdx - 1, 0);

      if (nextIdx !== currentIdx) {
        hapticTick();
        router.push(TAB_PATHS[nextIdx]);
      }
    },
    [pathname, router],
  );

  /* ── Swipe on the full document too ─────────────────────────── */
  useEffect(() => {
    let startX = 0;
    const onStart = (e: TouchEvent) => { startX = e.touches[0].clientX; };
    const onEnd   = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) < 60) return;

      const currentIdx = TAB_PATHS.indexOf(pathname);
      if (currentIdx === -1) return;

      const nextIdx = dx < 0
        ? Math.min(currentIdx + 1, TAB_PATHS.length - 1)
        : Math.max(currentIdx - 1, 0);

      if (nextIdx !== currentIdx) {
        hapticTick();
        router.push(TAB_PATHS[nextIdx]);
      }
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchend',   onEnd,   { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchend',   onEnd);
    };
  }, [pathname, router]);

  return (
    <>
      {/* ── FAB – centered above tab bar ─────────────────────── */}
      <div
        style={{
          position: 'fixed',
          bottom: 88,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 60,
        }}
      >
        <button
          aria-label="Quick actions"
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #c6ff33 0%, #a8e000 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(198,255,51,0.55), 0 4px 16px rgba(0,0,0,0.5)',
            border: 'none',
            cursor: 'pointer',
            transition: 'transform 0.2s cubic-bezier(0.175,0.885,0.32,1.275)',
          }}
          onPointerDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.92)';
          }}
          onPointerUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
        >
          <Plus style={{ width: 22, height: 22, color: '#06000c', strokeWidth: 2.5 }} />
        </button>
      </div>

      {/* ── Bottom nav bar ───────────────────────────────────── */}
      <nav
        ref={navRef}
        className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-5"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="floating-nav flex items-center justify-around h-16 rounded-2xl px-1">
          {NAV_ITEMS.map((item) => {
            const Icon     = item.icon;
            const isActive = pathname === item.path;
            const isMiddle = item.middle;

            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={hapticTick}
                className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative"
                style={{
                  color: isMiddle
                    ? 'transparent'
                    : isActive
                    ? '#c6ff33'
                    : 'rgba(255,255,255,0.45)',
                  transition: 'color 0.2s ease',
                }}
              >
                {/* Active breathing capsule (non-middle tabs only) */}
                {isActive && !isMiddle && (
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
                  className={[
                    'nav-icon relative z-10',
                    isMiddle  ? 'middle-icon'      : '',
                    isActive && !isMiddle ? 'icon-active-glow' : '',
                  ].join(' ')}
                  style={{
                    width:     isMiddle ? 26 : 22,
                    height:    isMiddle ? 26 : 22,
                    color:     isMiddle
                      ? '#c6ff33'
                      : isActive
                      ? '#c6ff33'
                      : 'rgba(255,255,255,0.45)',
                    transform: isActive && !isMiddle
                      ? 'translateY(-5px) scale(1.08)'
                      : 'translateY(0) scale(1)',
                    transition:
                      'color 0.2s ease, transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
                  }}
                />
                <span
                  className="relative z-10"
                  style={{
                    fontSize:      isMiddle ? 9 : 10,
                    fontWeight:    700,
                    letterSpacing: '0.04em',
                    opacity:       isActive ? 1 : 0.55,
                    transition:    'opacity 0.2s ease',
                    color:         isMiddle ? '#c6ff33' : undefined,
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
