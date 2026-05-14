'use client';

import { useTranslations } from 'next-intl';
import { AcademicCapIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

type CourseStatus = 'completed' | 'inProgress' | 'overdue' | 'notStarted';

interface Course {
  name: string;
  duration: string;
  progress: number;
  status: CourseStatus;
  due: string;
}

const sections: { key: string; courses: Course[] }[] = [
  {
    key: 'mandatory',
    courses: [
      { name: 'Código de Ética 2026', duration: '45 min', progress: 100, status: 'completed', due: '2026-04-30' },
      { name: 'Prevención Acoso Laboral', duration: '60 min', progress: 100, status: 'completed', due: '2026-04-30' },
      { name: 'Ciberseguridad básica', duration: '30 min', progress: 35, status: 'inProgress', due: '2026-06-15' },
      { name: 'PESV (CO)', duration: '90 min', progress: 0, status: 'overdue', due: '2026-04-30' },
    ],
  },
  {
    key: 'recommended',
    courses: [
      { name: 'Liderazgo situacional', duration: '4 hrs', progress: 60, status: 'inProgress', due: '2026-08-31' },
      { name: 'Feedback radical', duration: '2 hrs', progress: 0, status: 'notStarted', due: '2026-09-30' },
      { name: 'TypeScript avanzado', duration: '8 hrs', progress: 22, status: 'inProgress', due: '2026-10-31' },
    ],
  },
  {
    key: 'compliance',
    courses: [
      { name: 'SAGRILAFT', duration: '60 min', progress: 100, status: 'completed', due: '2026-04-30' },
      { name: 'Protección de datos', duration: '45 min', progress: 80, status: 'inProgress', due: '2026-06-30' },
    ],
  },
];

function statusVariant(s: CourseStatus): 'success' | 'warning' | 'danger' | 'default' {
  if (s === 'completed') return 'success';
  if (s === 'inProgress') return 'warning';
  if (s === 'overdue') return 'danger';
  return 'default';
}

export default function LearningTab() {
  const t = useTranslations('demoHrms');
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-secondary-900 dark:text-white">{t('learning.title')}</h2>
        <p className="text-secondary-600 dark:text-secondary-400 text-sm">{t('learning.subtitle')}</p>
      </div>

      {sections.map((section) => (
        <Card key={section.key} variant="bordered">
          <h3 className="font-bold text-secondary-900 dark:text-white mb-4">{t(`learning.${section.key}`)}</h3>
          <div className="space-y-3">
            {section.courses.map((c) => (
              <div key={c.name} className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <AcademicCapIcon className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-secondary-900 dark:text-white">{c.name}</p>
                      <p className="text-xs text-secondary-500">
                        {c.duration} · {t('learning.due')}: {c.due}
                      </p>
                    </div>
                  </div>
                  <Badge variant={statusVariant(c.status)} size="sm">
                    {t(`learning.${c.status}`)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${c.status === 'overdue' ? 'bg-red-500' : 'bg-primary-600'}`}
                      style={{ width: `${c.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-secondary-700 dark:text-secondary-300 w-10 text-right">
                    {c.progress}%
                  </span>
                  {c.status !== 'completed' && (
                    <button className="text-xs font-medium text-primary-600 hover:underline">
                      {t('learning.start')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
