'use client';

import Button from '@/components/ui/Button';

/** "Volver" de la página 404: regresa a la página anterior del historial. */
export default function BackButton({ label }: { label: string }) {
  return (
    <Button size="lg" variant="outline" onClick={() => window.history.back()}>
      {label}
    </Button>
  );
}
