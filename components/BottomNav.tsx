'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, Phone, Clock, Menu } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Chats', path: '/app/dashboard', icon: MessageCircle },
    { name: 'Calls', path: '/app/dashboard/calls', icon: Phone },
    { name: 'Updates', path: '/app/dashboard/updates', icon: Clock },
    { name: 'More', path: '/app/dashboard/more', icon: Menu },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0f0102] border-t border-[#fc2857] z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-[#fc2857]' : 'text-white'
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
