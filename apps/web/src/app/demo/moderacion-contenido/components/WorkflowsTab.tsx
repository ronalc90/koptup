'use client';

import { useTranslations } from 'next-intl';
import { PlusCircleIcon, PlayCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CATEGORY_COLORS, type RuleNode } from './mockData';

interface Props {
  rules: RuleNode[];
  setRules: React.Dispatch<React.SetStateAction<RuleNode[]>>;
}

export default function WorkflowsTab({ rules, setRules }: Props) {
  const t = useTranslations('demoModeration');

  const toggleRule = (id: string) =>
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  const removeRule = (id: string) => setRules((prev) => prev.filter((r) => r.id !== id));
  const addRule = () =>
    setRules((prev) => [
      ...prev,
      {
        id: `r-${Date.now()}`,
        category: 'spam',
        operator: 'gt',
        threshold: 0.7,
        action: 'humanReview',
        active: true,
      },
    ]);

  return (
    <section>
      <div className="flex items-end justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">
            {t('workflows.title')}
          </h2>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            {t('workflows.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addRule}>
            <PlusCircleIcon className="h-4 w-4 mr-1" />
            {t('workflows.addRule')}
          </Button>
          <Button variant="primary" size="sm">
            {t('workflows.saveAll')}
          </Button>
        </div>
      </div>

      <Card variant="bordered" padding="md">
        <div className="space-y-3">
          {rules.map((r) => (
            <div
              key={r.id}
              className="flex flex-col md:flex-row md:items-center gap-3 p-3 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50/40 dark:bg-secondary-800/30"
            >
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-wide text-secondary-500">
                  {t('workflows.ruleIf')}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[r.category]}`}>
                  {t(`queue.classifications.${r.category}`)}
                </span>
                <span className="text-xs text-secondary-600 dark:text-secondary-300">
                  {t('workflows.score')}
                </span>
                <select
                  value={r.operator}
                  onChange={(e) =>
                    setRules((prev) =>
                      prev.map((x) =>
                        x.id === r.id ? { ...x, operator: e.target.value as RuleNode['operator'] } : x
                      )
                    )
                  }
                  className="text-xs rounded-md border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 px-2 py-1"
                >
                  <option value="gt">{t('workflows.operators.gt')}</option>
                  <option value="lt">{t('workflows.operators.lt')}</option>
                  <option value="between">{t('workflows.operators.between')}</option>
                </select>
                <input
                  type="number"
                  step="0.05"
                  min={0}
                  max={1}
                  value={r.threshold}
                  onChange={(e) =>
                    setRules((prev) =>
                      prev.map((x) =>
                        x.id === r.id ? { ...x, threshold: parseFloat(e.target.value) } : x
                      )
                    )
                  }
                  className="w-20 text-xs rounded-md border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 px-2 py-1"
                />
                {r.operator === 'between' && (
                  <>
                    <span className="text-xs text-secondary-500">{t('workflows.and')}</span>
                    <input
                      type="number"
                      step="0.05"
                      min={0}
                      max={1}
                      value={r.threshold2 ?? 0.9}
                      onChange={(e) =>
                        setRules((prev) =>
                          prev.map((x) =>
                            x.id === r.id ? { ...x, threshold2: parseFloat(e.target.value) } : x
                          )
                        )
                      }
                      className="w-20 text-xs rounded-md border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 px-2 py-1"
                    />
                  </>
                )}
                <span className="text-xs font-semibold uppercase tracking-wide text-secondary-500">
                  {t('workflows.then')}
                </span>
                <select
                  value={r.action}
                  onChange={(e) =>
                    setRules((prev) =>
                      prev.map((x) =>
                        x.id === r.id ? { ...x, action: e.target.value as RuleNode['action'] } : x
                      )
                    )
                  }
                  className="text-xs rounded-md border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 px-2 py-1"
                >
                  {(
                    ['autoReject', 'humanReview', 'autoApprove', 'shadowBan', 'warnUser', 'escalateLegal'] as const
                  ).map((a) => (
                    <option key={a} value={a}>
                      {t(`workflows.actions.${a}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleRule(r.id)}
                  className={`text-xs px-2 py-1 rounded-full ${
                    r.active
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200'
                      : 'bg-secondary-200 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300'
                  }`}
                >
                  {r.active ? t('workflows.active') : t('workflows.paused')}
                </button>
                <button
                  onClick={() => removeRule(r.id)}
                  className="p-1 rounded-md text-secondary-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-sm text-primary-800 dark:text-primary-200 flex items-center gap-2">
          <PlayCircleIcon className="h-4 w-4" />
          {t('workflows.preview')}:{' '}
          <strong className="ml-1">{rules.filter((r) => r.active).length * 1240}</strong>
        </div>
      </Card>
    </section>
  );
}
