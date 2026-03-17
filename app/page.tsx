
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function Splash() {
  const router = useRouter();
  const { userId } = useAuth();

  useEffect(() => {
    const navigate = () => {
      if (userId) {
        router.push("/dashboard");
      } else {
        router.push("/welcome");
      }
    };

    const timer = setTimeout(() => {
      navigate();
    }, 1500);

    return () => clearTimeout(timer);
  }, [router, userId]);

  return (
    <div className="flex h-screen items-center justify-center bg-black">
      <h1 className="text-5xl font-bold text-white animate-pulse">MONiA</h1>
    </div>
  );
}
