import type { Metadata } from 'next';

/** El portal es privado: no se indexa (el middleware además exige sesión). */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
