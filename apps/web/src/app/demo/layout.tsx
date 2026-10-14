import { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo-config';
import DemoCTA from '@/components/demo/DemoCTA';
import DemoAccessWatcher from '@/components/demo/DemoAccessWatcher';

export const metadata: Metadata = generateMetadata('demo');

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <DemoCTA />
      {/* Si el acceso vence o se revoca con la demo abierta, recarga y muestra la pantalla de acceso. */}
      <DemoAccessWatcher />
    </>
  );
}
