import { Suspense } from 'react';
import DemoRequestForm from '@/components/demo-request/DemoRequestForm';

/**
 * Formulario "Solicitar demo" (wiki 04, §7.1). Acepta `?demos=slug1,slug2`
 * (o `?demo=slug`) para dejar elegidas las demos de donde viene la persona.
 * Envía a POST /api/demo-requests (honeypot, autorización Ley 1581 y cupos en
 * el backend). La metadata y el JSON-LD están en layout.tsx.
 */
export default function SolicitarDemoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <DemoRequestForm />
    </Suspense>
  );
}
