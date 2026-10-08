'use client';

import { useTranslations } from 'next-intl';
import {
  SparklesIcon,
  DocumentCheckIcon,
  ClockIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

/**
 * Los cuatro datos que KopTup puede respaldar hoy ("Demo con IA real, sin
 * registro", "Respuestas con fuente citada", "Piloto en 2 semanas", "Equipo en
 * Colombia"). Reemplazan las cifras sin respaldo (proyectos, clientes,
 * calificaciones, soporte 24/7) en la home y en las landings que las repetían.
 */
export default function HomeHighlights({ className = '' }: { className?: string }) {
  const t = useTranslations('homePage.stats');

  const highlights = [
    { icon: SparklesIcon, label: t('liveDemo') },
    { icon: DocumentCheckIcon, label: t('citedAnswers') },
    { icon: ClockIcon, label: t('pilot') },
    { icon: MapPinIcon, label: t('team') },
  ];

  return (
    <ul className={`grid grid-cols-2 md:grid-cols-4 gap-8 ${className}`}>
      {highlights.map(({ icon: Icon, label }) => (
        <li key={label} className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950 rounded-lg flex items-center justify-center mb-3">
            <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
          </div>
          <span className="text-base md:text-lg font-semibold text-secondary-900 dark:text-white">
            {label}
          </span>
        </li>
      ))}
    </ul>
  );
}
