'use client';

import { useEffect, useRef } from 'react';

export default function TiltLayer({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const MAX_SHIFT = 5;

    const applyShift = (x: number, y: number) => {
      const targets = el.querySelectorAll<HTMLElement>('.tilt-target');
      targets.forEach((t) => {
        t.style.transform = `translate(${-x * MAX_SHIFT}px, ${-y * MAX_SHIFT}px)`;
        t.style.transition = 'transform 0.12s linear';
      });
    };

    /* Device orientation (mobile) */
    const onOrientation = (e: DeviceOrientationEvent) => {
      const beta  = e.beta  ?? 0;
      const gamma = e.gamma ?? 0;
      const normX = Math.max(-1, Math.min(1, gamma / 30));
      const normY = Math.max(-1, Math.min(1, (beta - 30) / 30));
      applyShift(normX, normY);
    };

    /* Mouse (desktop fallback) */
    const onMouse = (e: MouseEvent) => {
      const { innerWidth: w, innerHeight: h } = window;
      const normX = (e.clientX / w - 0.5) * 2;
      const normY = (e.clientY / h - 0.5) * 2;
      applyShift(normX, normY);
    };

    const hasMotion = 'DeviceOrientationEvent' in window;

    if (hasMotion) {
      window.addEventListener('deviceorientation', onOrientation, { passive: true });
    } else {
      window.addEventListener('mousemove', onMouse, { passive: true });
    }

    return () => {
      if (hasMotion) window.removeEventListener('deviceorientation', onOrientation);
      else           window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'contents' }}>
      {children}
    </div>
  );
}
