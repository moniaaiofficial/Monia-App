import BottomNav from '@/components/BottomNav';

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden" style={{ background: '#14141f' }}>
      {children}
      <BottomNav />
    </div>
  );
}
