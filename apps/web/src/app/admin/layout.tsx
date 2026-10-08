import type { Metadata } from 'next';

/** El panel es privado: no se indexa (el middleware además exige sesión y rol). */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
