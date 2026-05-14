'use client';

import { ClockIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';

export function MetricCard({
  label,
  value,
  trend,
  up,
}: {
  label: string;
  value: string;
  trend?: string;
  up?: boolean;
}) {
  return (
    <Card variant="bordered" padding="md">
      <p className="text-xs uppercase tracking-wide text-secondary-500 dark:text-secondary-400 mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-secondary-900 dark:text-white">{value}</p>
      {trend && (
        <p className={`text-xs mt-1 ${up ? 'text-green-600 dark:text-green-300' : 'text-secondary-500'}`}>
          {trend}
        </p>
      )}
    </Card>
  );
}

export function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-secondary-500 dark:text-secondary-400 uppercase tracking-wide text-[10px]">
        {label}
      </dt>
      <dd className="text-secondary-800 dark:text-secondary-100 font-medium">{value}</dd>
    </div>
  );
}

export function BarChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end justify-between gap-3 h-40">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
          <div className="w-full flex items-end h-full">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-primary-600 to-primary-400"
              style={{ height: `${(d.value / max) * 100}%` }}
              title={`${d.value.toLocaleString()}`}
            />
          </div>
          <span className="text-xs text-secondary-600 dark:text-secondary-400">{d.label}</span>
          <span className="text-[10px] text-secondary-500 dark:text-secondary-500 font-mono">
            {d.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export function SlaBadge({ hours, overdueLabel }: { hours: number; overdueLabel: string }) {
  if (hours < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200">
        <ClockIcon className="h-3.5 w-3.5" />
        {overdueLabel}
      </span>
    );
  }
  const color =
    hours < 3
      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200'
      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200';
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${color}`}>
      <ClockIcon className="h-3.5 w-3.5" />
      {hours.toFixed(1)}h
    </span>
  );
}

export function codeSamples(mode: 'realtime' | 'batch', lang: 'curl' | 'ts' | 'python'): string {
  const endpoint = mode === 'batch' ? '/v1/moderate/batch' : '/v1/moderate';
  if (lang === 'curl') {
    return `curl -X POST https://api.koptup.ai${endpoint} \\
  -H "Authorization: Bearer $KOPTUP_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "vertical": "social",
    "items": [
      { "type": "text", "content": "..." },
      { "type": "image", "url": "https://cdn.example.com/img.jpg" }
    ]
  }'`;
  }
  if (lang === 'ts') {
    return `import { KoptupModeration } from "@koptup/sdk";

const client = new KoptupModeration({ apiKey: process.env.KOPTUP_KEY! });

const result = await client.moderate${mode === 'batch' ? 'Batch' : ''}({
  vertical: "social",
  items: [
    { type: "text", content: "..." },
    { type: "image", url: "https://cdn.example.com/img.jpg" },
  ],
});

console.log(result.decisions);`;
  }
  return `from koptup import ModerationClient

client = ModerationClient(api_key=os.environ["KOPTUP_KEY"])

result = client.moderate${mode === 'batch' ? '_batch' : ''}(
    vertical="social",
    items=[
        {"type": "text", "content": "..."},
        {"type": "image", "url": "https://cdn.example.com/img.jpg"},
    ],
)

print(result.decisions)`;
}
