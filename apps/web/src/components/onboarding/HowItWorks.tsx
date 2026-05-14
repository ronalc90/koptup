'use client';

import Link from 'next/link';
import {
  Squares2X2Icon,
  PlayCircleIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import Card, { CardContent } from '@/components/ui/Card';

// TODO: extract to i18n
const STEPS = [
  {
    id: 'choose',
    title: 'Elegí',
    description: 'Explorá nuestro catálogo de soluciones IA y servicios a medida.',
    icon: Squares2X2Icon,
    href: '/services',
    cta: 'Ver catálogo',
  },
  {
    id: 'try',
    title: 'Probá',
    description: 'Probá las demos interactivas sin costo y sin tarjeta.',
    icon: PlayCircleIcon,
    href: '/demo',
    cta: 'Ir a las demos',
  },
  {
    id: 'quote',
    title: 'Cotizá',
    description: 'Pedí cotización personalizada o registrate para empezar ya.',
    icon: ChatBubbleLeftRightIcon,
    href: '/contact',
    cta: 'Cotizar',
  },
  {
    id: 'build',
    title: 'Implementamos',
    description: 'Nuestro equipo arma e integra tu solución end-to-end.',
    icon: CogIcon,
    href: '/about',
    cta: 'Cómo trabajamos',
  },
  {
    id: 'use',
    title: 'Usá',
    description: 'Accedé a tu dashboard, métricas y soporte cuando quieras.',
    icon: ChartBarIcon,
    href: '/dashboard',
    cta: 'Mi dashboard',
  },
];

export default function HowItWorks() {
  return (
    <Card variant="bordered">
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-1">
            ¿Cómo funciona Koptup?
          </h2>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            En 5 pasos pasás de explorar a tener tu solución funcionando.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.id}
                href={step.href}
                className="group relative flex flex-col items-start gap-3 p-4 rounded-xl border border-secondary-200 dark:border-secondary-800 bg-secondary-50/50 dark:bg-secondary-900/50 hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md transition-all"
              >
                <div className="absolute top-2 right-3 text-xs font-bold text-secondary-300 dark:text-secondary-700">
                  0{idx + 1}
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-950 flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-900 transition-colors">
                  <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="font-semibold text-secondary-900 dark:text-white mb-0.5">
                    {step.title}
                  </p>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 leading-snug">
                    {step.description}
                  </p>
                </div>
                <span className="text-xs font-medium text-primary-600 dark:text-primary-400 group-hover:underline">
                  {step.cta} →
                </span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
