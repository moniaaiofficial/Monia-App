import BottomNav from '@/components/BottomNav';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#06000c] pb-24">
      {children}
      <BottomNav />
    </div>
  );
}
