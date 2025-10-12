'use client';
import { useRouter } from 'next/navigation';

export default function useToggleLocale() {
  const router = useRouter();
  return () => {
    const next = (document.cookie.match(/(?:^|; )locale=([^;]+)/)?.[1] === 'es') ? 'en' : 'es';
    document.cookie = `locale=${next}; path=/; max-age=${31536000}; SameSite=Lax`;
    router.refresh(); // fuerza SSR para que request.ts lea x-locale
  };
}
