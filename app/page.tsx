"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function Splash() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => {
      if (userId) {
        router.push("/dashboard");
      } else {
        router.push("/welcome");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [router, userId, isLoaded]);

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
