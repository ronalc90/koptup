'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Rutas que no deben mostrar Navbar y Footer: el portal y el panel tienen
  // su propio encabezado (DashboardLayout y AdminLayout).
  const hasOwnLayout = pathname?.startsWith('/dashboard') || pathname === '/admin' || pathname?.startsWith('/admin/');

  if (hasOwnLayout) {
    return <>{children}</>;
  }

  // Layout normal con Navbar y Footer
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-16 md:pt-20">{children}</main>
      <Footer />
    </div>
  );
}
