"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function Splash() {
  const [isVisible, setIsVisible] = useState(true); // Control visibility
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    // 3 second ka fixed timer taaki animation poori dikhe
    const timer = setTimeout(() => {
      setIsVisible(false); // Animation ko hide karo
      
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
      }
    }, 3000); // Tera 3-sec animated splash

    return () => clearTimeout(timer);
  }, [isLoaded, user, router]);

  if (!isVisible) return null; // 3 sec baad ye component poora gayab ho jayega

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
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
