"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function Splash() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => {
      if (user?.id) {
        const isProfileComplete = (user.publicMetadata as any)?.profile_complete === true;
        console.log(`[Splash] User logged in — profile_complete: ${isProfileComplete}`);
        if (isProfileComplete) {
          router.push("/dashboard");
        } else {
          console.log('[Splash] Redirecting to profile-setup (incomplete profile)');
          router.push("/profile-setup");
        }
      } else {
        router.push("/welcome");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [router, user, isLoaded]);

  return (
    <div
      className="flex h-screen items-center justify-center page-enter"
      style={{ background: '#06000c' }}
    >
      <h1
        className="font-black text-white logo-glow animate-pulse"
        style={{ fontSize: '4.5rem', letterSpacing: '-0.04em' }}
      >
        MONiA
      </h1>
    </div>
  );
}
