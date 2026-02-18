import { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo-config';
import DemoCTA from '@/components/demo/DemoCTA';

export const metadata: Metadata = generateMetadata('demo');

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <DemoCTA />
    </>
  );
}
