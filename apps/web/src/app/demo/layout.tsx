import DemoCTA from '@/components/demo/DemoCTA';

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <DemoCTA />
    </>
  );
}
