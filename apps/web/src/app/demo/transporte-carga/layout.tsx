import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transporte y Carga | Demo',
  description: 'Sistema de gestión de transporte y carga con cumplimiento SUNAT',
  keywords: ['transporte', 'carga', 'logística', 'SUNAT', 'Perú'],
  openGraph: {
    title: 'Transporte y Carga | Demo',
    description: 'Sistema de gestión de transporte y carga con cumplimiento SUNAT',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
