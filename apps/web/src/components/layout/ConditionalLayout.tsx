'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Rutas que no deben mostrar Navbar y Footer
  const isDashboard = pathname?.startsWith('/dashboard');

  if (isDashboard) {
    // Dashboard tiene su propio layout integrado
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
