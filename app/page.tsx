"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function Splash() {
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    // 3 second ka timer taaki animation poori ho
    const timer = setTimeout(() => {
      if (isLoaded) {
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
        // Redirect ke baad hi screen hide hogi
        setIsVisible(false);
      }
    }, 3000); 

    return () => clearTimeout(timer);
  }, [router, user, isLoaded]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-screen items-center justify-center"
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
