'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  RocketLaunchIcon,
  HeartIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  TrophyIcon,
  GlobeAltIcon,
  CodeBracketIcon,
  SparklesIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function AboutPage() {
  const t = useTranslations('aboutPage');
  const tc = useTranslations('common');

  // Estado para la sección de tecnologías
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<string>('All');
  const [showAll, setShowAll] = useState(false);

  const values = [
    {
      icon: RocketLaunchIcon,
      title: t('values.items.innovation.title'),
      description: t('values.items.innovation.description'),
    },
    {
      icon: HeartIcon,
      title: t('values.items.excellence.title'),
      description: t('values.items.excellence.description'),
    },
    {
      icon: LightBulbIcon,
      title: t('values.items.creativity.title'),
      description: t('values.items.creativity.description'),
    },
    {
      icon: ShieldCheckIcon,
      title: t('values.items.transparency.title'),
      description: t('values.items.transparency.description'),
    },
    {
      icon: UserGroupIcon,
      title: t('values.items.clientFirst.title'),
      description: t('values.items.clientFirst.description'),
    },
    {
      icon: TrophyIcon,
      title: t('values.items.results.title'),
      description: t('values.items.results.description'),
    },
  ];

  const team = [
    {
      name: t('team.members.ronald.name'),
      role: t('team.members.ronald.role'),
      description: t('team.members.ronald.description'),
      avatar: 'https://media.licdn.com/dms/image/v2/C4E03AQFkHy4q8806WA/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1657683263984?e=1763596800&v=beta&t=GDtxdYIv_fyBVJvzawmB0j75qUPOGyeSLLpUZy_au8M',
      skills: ['React', 'TypeScript', 'Node.js', 'OpenAI', 'AWS'],
    },
  ];

  const stats = [
    { value: '100+', label: t('stats.projects') },
    { value: '50+', label: t('stats.clients') },
    { value: '8+', label: t('stats.experience') },
    { value: '98%', label: t('stats.satisfaction') },
  ];

 const milestones = [
  { year: '2019', title: t('history.milestones.2019.title'), description: t('history.milestones.2019.description') },
  { year: '2021', title: t('history.milestones.2021.title'), description: t('history.milestones.2021.description') },
  { year: '2022', title: t('history.milestones.2022.title'), description: t('history.milestones.2022.description') },
  { year: '2023', title: t('history.milestones.2023.title'), description: t('history.milestones.2023.description') },
  { year: '2025', title: t('history.milestones.2025.title'), description: t('history.milestones.2025.description') }
];



// highlights = lo que muestras primero y grande
const highlights = [
  { name: 'React', level: 'Expert' },
  { name: 'Node.js', level: 'Expert' },
  { name: 'PostgreSQL', level: 'Proficient' },
  { name: 'Docker', level: 'Proficient' },
  { name: 'TensorFlow', level: 'Proficient' },
  { name: 'AWS', level: 'Proficient' },
];

// grouped = mostrado en acordeones / chips
const grouped = {
  Frontend: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Sass'],
  Backend: ['Node.js', 'Express', 'Python', 'Java', '.NET'],
  DB: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis'],
  Cloud: ['AWS', 'Azure', 'Vercel', 'AWS S3'],
  DevOps: ['Docker', 'Kubernetes', 'CI/CD', 'Git', 'Jenkins'],
  ML: ['TensorFlow', 'ML/DL', 'NLP', 'Embeddings', 'Semantic Search'],
  Tools: ['VS Code', 'IntelliJ', 'Postman'],
};

// Categorías para los filtros
const categories = ['All', ...Object.keys(grouped)];

// Filtrado de tecnologías basado en búsqueda y categoría activa
const filtered = useMemo(() => {
  let result: Record<string, string[]> = { ...grouped };

  // Filtrar por categoría activa
  if (activeCat !== 'All') {
    result = { [activeCat]: grouped[activeCat as keyof typeof grouped] };
  }

  // Filtrar por búsqueda de texto
  if (query.trim()) {
    const lowerQuery = query.toLowerCase();
    const newResult: Record<string, string[]> = {};

    Object.entries(result).forEach(([cat, items]) => {
      const filteredItems = items.filter(item =>
        item.toLowerCase().includes(lowerQuery)
      );
      if (filteredItems.length > 0) {
        newResult[cat] = filteredItems;
      }
    });

    return newResult;
  }

  return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [query, activeCat]);


  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" size="lg" className="mb-6 border-white/30 text-white">
              {t('badge')}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-primary-100">
              {t('hero.subtitle')}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-primary-100">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-6">
                {t('mission.title')}
              </h2>
              <p className="text-lg text-secondary-700 dark:text-secondary-300 mb-6">
                {t('mission.text1')}
              </p>
              <p className="text-lg text-secondary-700 dark:text-secondary-300 mb-6">
                {t('mission.text2')}
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                  <span className="text-secondary-700 dark:text-secondary-300">
                    {t('mission.points.custom')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                  <span className="text-secondary-700 dark:text-secondary-300">
                    {t('mission.points.modern')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                  <span className="text-secondary-700 dark:text-secondary-300">
                    {t('mission.points.support')}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800)' }}
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary-600 rounded-2xl flex items-center justify-center">
                <SparklesIcon className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              {t('values.title')}
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              {t('values.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} variant="bordered" className="text-center hover:shadow-medium transition-shadow">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-primary-100 dark:bg-primary-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-3">
                      {value.title}
                    </h3>
                    <p className="text-secondary-700 dark:text-secondary-300">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              {t('team.title')}
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              {t('team.subtitle')}
            </p>
          </div>

          <div className="flex justify-center">
            {team.map((member, index) => (
              <Card key={index} variant="bordered" className="text-center hover:shadow-large transition-shadow max-w-md w-full">
                <CardContent className="p-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 ring-4 ring-primary-100 dark:ring-primary-950">
                    <div
                      className="w-full h-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${member.avatar})` }}
                    />
                  </div>
                  <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-1">
                    {member.name}
                  </h3>
                  <p className="text-sm text-primary-600 dark:text-primary-400 mb-3 font-semibold">
                    {member.role}
                  </p>
                  <p className="text-sm text-secondary-700 dark:text-secondary-300 mb-4">
                    {member.description}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {member.skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary" size="sm">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              {t('history.title')}
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              {t('history.subtitle')}
            </p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary-200 dark:bg-primary-900 -translate-x-1/2 hidden md:block" />

            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className="relative">
                  <div className={`md:grid md:grid-cols-2 md:gap-8 ${index % 2 === 0 ? '' : 'md:flex-row-reverse'}`}>
                    <div className={`${index % 2 === 0 ? 'md:text-right' : 'md:col-start-2'}`}>
                      <Card variant="bordered" className="hover:shadow-medium transition-shadow">
                        <CardContent className="p-6">
                          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                            {milestone.year}
                          </div>
                          <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">
                            {milestone.title}
                          </h3>
                          <p className="text-secondary-700 dark:text-secondary-300">
                            {milestone.description}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Timeline Dot */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                    <div className="w-4 h-4 bg-primary-600 rounded-full ring-4 ring-white dark:ring-secondary-950" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
<section className="section-padding bg-white dark:bg-secondary-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <CodeBracketIcon className="h-14 w-14 mx-auto text-primary-600 dark:text-primary-400 mb-3" />
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-2">
            {t('technologies.title')}
          </h2>
          <p className="text-lg text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
            {t('technologies.subtitle')}
          </p>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {highlights.map(h => (
            <div key={h.name} className="flex items-center gap-3 p-3 border rounded-lg shadow-sm">
              <div aria-hidden className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center text-sm">
                {h.name[0]}
              </div>
              <div>
                <div className="font-medium">{h.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{h.level}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search technologies..."
            className="flex-1 px-4 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="flex gap-2 flex-wrap">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => { setActiveCat(c); setShowAll(false); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCat === c
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'border border-secondary-300 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Grouped lists */}
        <div className="space-y-6">
          {Object.entries(filtered).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-secondary-600 dark:text-secondary-400">
                No technologies found matching &quot;{query}&quot;
              </p>
            </div>
          ) : (
            Object.entries(filtered).map(([cat, items]) => (
              <Card key={cat} variant="bordered" className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-secondary-900 dark:text-white">
                      {cat}{' '}
                      <span className="text-sm font-normal text-secondary-500 dark:text-secondary-400">
                        ({items.length})
                      </span>
                    </h3>
                    {items.length > 4 && (
                      <button
                        onClick={() => setShowAll(s => !s)}
                        className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
                      >
                        {showAll ? 'Show less' : 'View all'}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(showAll ? items : items.slice(0, 8)).map(it => (
                      <Badge
                        key={it}
                        variant="secondary"
                        size="lg"
                        className="text-sm font-medium"
                      >
                        {it}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <GlobeAltIcon className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            {t('cta.title')}
          </h2>
          <p className="text-xl mb-10 text-primary-100">
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline" className="bg-white text-primary-600 hover:bg-primary-50" asChild>
              <Link href="/contact">{t('cta.button1')}</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
              <Link href="/services">{t('cta.button2')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
