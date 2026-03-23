"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function Splash() {
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  // Navigation check taaki dusre pages par splash na dikhe
  if (pathname !== "/" && pathname !== "/dashboard") {
    if (isVisible) setIsVisible(false);
  }

  useEffect(() => {
    // 4 second ka timer taaki slide-in aur exit dono animation dikhe
    const timer = setTimeout(() => {
      if (isLoaded) {
        if (user?.id) {
          const isProfileComplete = (user.publicMetadata as any)?.profile_complete === true;
          if (isProfileComplete) {
            router.push("/dashboard");
          } else {
            router.push("/profile-setup");
          }
        } else {
          router.push("/welcome");
        }
        setIsVisible(false);
      }
    }, 4000); 

    return () => clearTimeout(timer);
  }, [router, user, isLoaded]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-screen items-center justify-center overflow-hidden"
      style={{ background: '#06000c' }} // Tera Primary Background
    >
      <div className="monia-logo-wrapper flex items-center justify-center relative scale-[0.4] md:scale-100">
        
        {/* PEHLI LAYER (Neon Green Base - Fast Slide) */}
        <div className="base-neon flex items-center select-none">
          <span style={{ fontSize: '260px' }}>M</span>
          <span style={{ fontSize: '260px', marginLeft: '-15px' }}>O</span>
          <span style={{ fontSize: '260px', marginLeft: '-15px' }}>N</span>
          <span style={{ fontSize: '260px', marginLeft: '-10px' }}>i</span>
          <span style={{ fontSize: '260px', marginLeft: '-15px' }}>A</span>
        </div>

        {/* DOOSRI LAYER (Dark Overlay - Jo background jaisa hai aur slow aata hai) */}
        <div className="overlay-dark flex items-center select-none">
          <span style={{ fontSize: '141px', marginLeft: '30px' }}>M</span>
          <span style={{ fontSize: '145px', marginLeft: '65px' }}>O</span>
          <span style={{ fontSize: '141px', marginLeft: '65px' }}>N</span>
          {/* i lowercase wala exact adjustment */}
          <span style={{ fontSize: '187px', marginLeft: '55px', position: 'relative', top: '15px' }}>i</span>
          <span style={{ fontSize: '145px', marginLeft: '45px' }}>A</span>
        </div>

      </div>
    </div>
  );
}
