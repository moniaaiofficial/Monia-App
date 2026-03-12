import BottomNav from '@/components/BottomNav';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#100002] pb-28">
      {children}
      <BottomNav />
    </div>
  );
}
