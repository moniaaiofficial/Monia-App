import BottomNav from '@/components/BottomNav';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0f0102] pb-16">
      {children}
      <BottomNav />
    </div>
  );
}
