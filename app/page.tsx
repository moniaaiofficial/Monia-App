"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function Splash() {
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  if (pathname !== "/" && pathname !== "/dashboard") {
    if (isVisible) setIsVisible(false);
  }

  useEffect(() => {
    if (!isLoaded) return;

    if (user?.id) {
      // Already logged in → short splash (just enough for animation to feel intentional)
      const timer = setTimeout(() => {
        const isProfileComplete = (user.publicMetadata as any)?.profile_complete === true;
        router.push(isProfileComplete ? "/dashboard" : "/profile-setup");
        setIsVisible(false);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      // Not logged in → full splash animation
      const timer = setTimeout(() => {
        router.push("/welcome");
        setIsVisible(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [router, user, isLoaded]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-screen items-center justify-center overflow-hidden"
      style={{ background: '#06000c' }}
    >
      <h1
        className="font-black text-white logo-glow-premium flex"
        style={{ fontSize: '4.5rem', letterSpacing: '-0.02em' }}
      >
        <span className="letter-anim" style={{ animationDelay: '0.1s' }}>M</span>
        <span className="letter-anim" style={{ animationDelay: '0.2s' }}>O</span>
        <span className="letter-anim" style={{ animationDelay: '0.3s' }}>N</span>
        <span className="letter-anim" style={{ animationDelay: '0.4s' }}>i</span>
        <span className="letter-anim" style={{ animationDelay: '0.5s' }}>A</span>
      </h1>
    </div>
  );
}
