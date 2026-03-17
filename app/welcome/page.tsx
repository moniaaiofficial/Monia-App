
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dosis } from 'next/font/google';

const dosis = Dosis({ subsets: ['latin'], weight: ['800'] });

const WelcomePage = () => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/auth/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="h-screen w-screen flex justify-center items-center bg-black">
      <h1 className={`${dosis.className} text-white text-7xl font-extrabold animate-pulse`}>
        MONiA
      </h1>
    </div>
  );
};

export default WelcomePage;
