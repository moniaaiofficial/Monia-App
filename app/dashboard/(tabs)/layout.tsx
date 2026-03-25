import BottomNav from '@/components/BottomNav';

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ background: '#14141f' }}>
      {children}
      <BottomNav />
    </div>
  );
}
