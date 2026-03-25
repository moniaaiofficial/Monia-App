import BottomNav from '@/components/BottomNav';

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-28" style={{ background: '#1a0d00' }}>
      {children}
      <BottomNav />
    </div>
  );
}
