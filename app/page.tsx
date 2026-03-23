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
    // 3.5 second ka timer taaki animation sukoon se dikhe
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
    }, 3500); 

    return () => clearTimeout(timer);
  }, [router, user, isLoaded]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-screen items-center justify-center overflow-hidden"
      style={{ background: '#06000c' }} // Tera Primary Dark Purple Black Background
    >
      <h1
        className="font-black text-white logo-glow-premium flex"
        style={{ fontSize: '4.5rem', letterSpacing: '-0.02em' }}
      >
        {/* Simple & Professional White Letters Animation */}
        <span className="letter-anim" style={{ animationDelay: '0.1s' }}>M</span>
        <span className="letter-anim" style={{ animationDelay: '0.2s' }}>O</span>
        <span className="letter-anim" style={{ animationDelay: '0.3s' }}>N</span>
        <span className="letter-anim" style={{ animationDelay: '0.4s' }}>i</span>
        <span className="letter-anim" style={{ animationDelay: '0.5s' }}>A</span>
      </h1>
    </div>
  );
}
