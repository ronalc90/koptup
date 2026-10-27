import { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo-config';
import { getLocale } from 'next-intl/server';
import DemoCTA from '@/components/demo/DemoCTA';
import DemoAccessWatcher from '@/components/demo/DemoAccessWatcher';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('demo', await getLocale());
}

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
