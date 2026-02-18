'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card, { CardContent } from '@/components/ui/Card';
import {
  CpuChipIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowPathIcon,
  LightBulbIcon,
  SparklesIcon,
  BanknotesIcon,
  UsersIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

export default function SolucionesIAPage() {
  const t = useTranslations('aiSolutionsPage');

  const solutions = [
    { icon: ChatBubbleBottomCenterTextIcon, title: t('s1t'), desc: t('s1d') },
    { icon: ArrowPathIcon, title: t('s2t'), desc: t('s2d') },
    { icon: ChartBarIcon, title: t('s3t'), desc: t('s3d') },
    { icon: DocumentTextIcon, title: t('s4t'), desc: t('s4d') },
    { icon: CpuChipIcon, title: t('s5t'), desc: t('s5d') },
    { icon: SparklesIcon, title: t('s6t'), desc: t('s6d') },
  ];

  const whyReasons = [
    { icon: BanknotesIcon, title: t('w1t'), desc: t('w1d') },
    { icon: UsersIcon, title: t('w2t'), desc: t('w2d') },
    { icon: LightBulbIcon, title: t('w3t'), desc: t('w3d') },
    { icon: TrophyIcon, title: t('w4t'), desc: t('w4d') },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" size="lg" className="mb-6 border-white/30 text-white">
              {t('badge')}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50" asChild>
                <Link href="/demo">{t('hero.cta1')}</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10" asChild>
                <Link href="/contact">{t('hero.cta2')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white dark:bg-secondary-950 border-b border-secondary-200 dark:border-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { v: '60%', l: 'Reducción de costos operativos' },
              { v: '24/7', l: 'Disponibilidad de sistemas IA' },
              { v: '10x', l: 'Mayor velocidad de procesamiento' },
              { v: '+500', l: 'Tareas automatizadas por día' },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">{s.v}</div>
                <div className="text-sm md:text-base text-secondary-600 dark:text-secondary-400">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              {t('solutionsTitle')}
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              {t('solutionsSubtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {solutions.map((s, i) => {
              const Icon = s.icon;
              return (
                <Card key={i} variant="bordered" className="hover:shadow-medium transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">{s.title}</h3>
                    <p className="text-secondary-600 dark:text-secondary-400 text-sm">{s.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why IA */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              {t('whyTitle')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {whyReasons.map((r, i) => {
              const Icon = r.icon;
              return (
                <div key={i} className="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-secondary-900 dark:to-secondary-800">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">{r.title}</h3>
                    <p className="text-secondary-600 dark:text-secondary-400 text-sm">{r.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              Tecnologías de IA que Implementamos
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400">
              Trabajamos con las plataformas de IA más avanzadas del mercado
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'GPT-4 / ChatGPT', desc: 'OpenAI' },
              { name: 'Claude AI', desc: 'Anthropic' },
              { name: 'Gemini', desc: 'Google' },
              { name: 'LangChain', desc: 'Orquestación IA' },
              { name: 'RAG Systems', desc: 'Recuperación de información' },
              { name: 'Python ML', desc: 'Machine Learning' },
              { name: 'TensorFlow', desc: 'Deep Learning' },
              { name: 'n8n / Make', desc: 'Automatización' },
            ].map((tech, i) => (
              <Card key={i} variant="bordered" className="text-center hover:shadow-medium transition-shadow">
                <CardContent className="p-4">
                  <div className="font-bold text-secondary-900 dark:text-white text-sm mb-1">{tech.name}</div>
                  <div className="text-xs text-secondary-500 dark:text-secondary-400">{tech.desc}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">{t('ctaTitle')}</h2>
          <p className="text-xl text-blue-100 mb-10">{t('ctaSubtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50" asChild>
              <Link href="/contact">{t('ctaButton')}</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10" asChild>
              <Link href="/demo">Ver Demos de IA</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
