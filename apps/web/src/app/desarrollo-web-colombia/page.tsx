'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card, { CardContent } from '@/components/ui/Card';
import {
  CodeBracketIcon,
  ChatBubbleBottomCenterTextIcon,
  ShoppingCartIcon,
  DevicePhoneMobileIcon,
  ChartBarIcon,
  CpuChipIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  BoltIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export default function DesarrolloWebColombiaPage() {
  const t = useTranslations('devWebPage');

  const services = [
    { icon: CodeBracketIcon, title: t('sv1t'), desc: t('sv1d') },
    { icon: ChatBubbleBottomCenterTextIcon, title: t('sv2t'), desc: t('sv2d') },
    { icon: ShoppingCartIcon, title: t('sv3t'), desc: t('sv3d') },
    { icon: DevicePhoneMobileIcon, title: t('sv4t'), desc: t('sv4d') },
    { icon: ChartBarIcon, title: t('sv5t'), desc: t('sv5d') },
    { icon: CpuChipIcon, title: t('sv6t'), desc: t('sv6d') },
  ];

  const whyReasons = [
    { icon: ShieldCheckIcon, title: t('w1t'), desc: t('w1d') },
    { icon: GlobeAltIcon, title: t('w2t'), desc: t('w2d') },
    { icon: BoltIcon, title: t('w3t'), desc: t('w3d') },
    { icon: CheckCircleIcon, title: t('w4t'), desc: t('w4d') },
  ];

  const process = [
    { title: t('p1t'), desc: t('p1d') },
    { title: t('p2t'), desc: t('p2d') },
    { title: t('p3t'), desc: t('p3d') },
    { title: t('p4t'), desc: t('p4d') },
  ];

  const faqs = [
    { q: t('q1q'), a: t('q1a') },
    { q: t('q2q'), a: t('q2a') },
    { q: t('q3q'), a: t('q3a') },
    { q: t('q4q'), a: t('q4a') },
    { q: t('q5q'), a: t('q5a') },
    { q: t('q6q'), a: t('q6a') },
  ];

  const techStack = [
    { category: 'Frontend', techs: ['React', 'Next.js', 'Vue.js', 'TypeScript', 'Tailwind CSS'] },
    { category: 'Backend', techs: ['Node.js', 'Python', 'FastAPI', 'NestJS', 'Express'] },
    { category: 'Bases de datos', techs: ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis'] },
    { category: 'IA & ML', techs: ['OpenAI GPT-4', 'Claude AI', 'LangChain', 'RAG'] },
    { category: 'Cloud & DevOps', techs: ['AWS', 'Google Cloud', 'Docker', 'Vercel', 'Railway'] },
    { category: 'Mobile', techs: ['React Native', 'Flutter', 'Expo'] },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-900 text-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" size="lg" className="mb-6 border-white/30 text-white">
              {t('badge')}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>
            {/* Geographic reach */}
            <p className="text-base md:text-lg text-primary-200 mb-10 max-w-2xl mx-auto">
              Trabajamos con clientes en <strong className="text-white">cualquier parte del mundo</strong> — Colombia, México, Argentina, España, Estados Unidos y más. 100% remoto.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50" asChild>
                <Link href="/contact">{t('hero.cta1')}</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10" asChild>
                <Link href="/demo">{t('hero.cta2')}</Link>
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
              { v: t('s1v'), l: t('s1l') },
              { v: t('s2v'), l: t('s2l') },
              { v: t('s3v'), l: t('s3l') },
              { v: t('s4v'), l: t('s4l') },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-4xl md:text-5xl font-bold text-primary-600 dark:text-primary-400 mb-2">{s.v}</div>
                <div className="text-sm md:text-base text-secondary-600 dark:text-secondary-400">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              {t('servicesTitle')}
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              {t('servicesSubtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => {
              const Icon = s.icon;
              return (
                <Card key={i} variant="bordered" className="hover:shadow-medium transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
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

      {/* Why KopTup */}
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
                <div key={i} className="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-secondary-900 dark:to-secondary-800">
                  <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
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

      {/* Process */}
      <section className="section-padding bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-secondary-900 dark:to-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              {t('processTitle')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {process.map((p, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">{p.title}</h3>
                <p className="text-secondary-600 dark:text-secondary-400 text-sm">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              {t('techTitle')}
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400">{t('techSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {techStack.map((cat, i) => (
              <Card key={i} variant="bordered">
                <CardContent className="p-5">
                  <h3 className="font-bold text-secondary-900 dark:text-white mb-3 text-sm uppercase tracking-wider">{cat.category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {cat.techs.map((tech, j) => (
                      <span key={j} className="text-xs bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 rounded-full px-3 py-1 font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-12 text-center">
            {t('faqTitle')}
          </h2>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <Card key={i} variant="bordered">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-3">{f.q}</h3>
                  <p className="text-secondary-600 dark:text-secondary-400">{f.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-br from-primary-600 to-primary-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">{t('ctaTitle')}</h2>
          <p className="text-xl text-primary-100 mb-10">{t('ctaSubtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50" asChild>
              <Link href="/contact">{t('ctaButton')}</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10" asChild>
              <Link href="/pricing">{useTranslations('common')('requestQuote')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
