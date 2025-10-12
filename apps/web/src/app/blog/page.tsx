'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  MagnifyingGlassIcon,
  ClockIcon,
  UserCircleIcon,
  TagIcon,
  ArrowRightIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

export default function BlogPage() {
  const t = useTranslations('blogPage');
  const tc = useTranslations('common');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', name: t('categories.all'), count: 24 },
    { id: 'development', name: t('categories.development'), count: 8 },
    { id: 'design', name: t('categories.design'), count: 5 },
    { id: 'ai', name: t('categories.ai'), count: 6 },
    { id: 'business', name: t('categories.business'), count: 5 },
  ];

  const posts = [
    {
      id: 1,
      title: 'Cómo la IA está Revolucionando el E-Commerce en 2025',
      excerpt: 'Descubre las últimas tendencias en inteligencia artificial aplicadas al comercio electrónico y cómo pueden aumentar tus ventas hasta un 40%.',
      category: 'ai',
      categoryName: 'Inteligencia Artificial',
      author: 'Carlos Mendoza',
      date: '2025-10-05',
      readTime: '8 min',
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
      featured: true,
    },
    {
      id: 2,
      title: 'Next.js 15: Nuevas Características y Mejoras de Performance',
      excerpt: 'Una guía completa sobre las nuevas funcionalidades de Next.js 15 y cómo aprovecharlas en tus proyectos.',
      category: 'development',
      categoryName: 'Desarrollo',
      author: 'Ana García',
      date: '2025-10-02',
      readTime: '12 min',
      image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
      featured: true,
    },
    {
      id: 3,
      title: 'Diseño UX/UI: Principios para Apps Móviles Exitosas',
      excerpt: 'Los fundamentos del diseño de experiencia de usuario que todo desarrollador de apps móviles debe conocer.',
      category: 'design',
      categoryName: 'Diseño',
      author: 'Laura Martínez',
      date: '2025-09-28',
      readTime: '10 min',
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
      featured: false,
    },
    {
      id: 4,
      title: 'Chatbots con GPT-4: Guía Completa de Implementación',
      excerpt: 'Aprende a integrar chatbots inteligentes en tu negocio usando las últimas versiones de GPT para mejorar la atención al cliente.',
      category: 'ai',
      categoryName: 'Inteligencia Artificial',
      author: 'Roberto Silva',
      date: '2025-09-25',
      readTime: '15 min',
      image: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=800',
      featured: false,
    },
    {
      id: 5,
      title: 'ROI en Transformación Digital: Cómo Medir el Éxito',
      excerpt: 'Métricas clave y estrategias para calcular el retorno de inversión en proyectos de transformación digital.',
      category: 'business',
      categoryName: 'Negocios',
      author: 'Patricia López',
      date: '2025-09-20',
      readTime: '7 min',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
      featured: false,
    },
    {
      id: 6,
      title: 'Arquitectura Microservicios vs Monolítica: Qué Elegir',
      excerpt: 'Una comparación detallada entre arquitecturas de software y cuándo usar cada una según tu proyecto.',
      category: 'development',
      categoryName: 'Desarrollo',
      author: 'Carlos Mendoza',
      date: '2025-09-15',
      readTime: '11 min',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
      featured: false,
    },
    {
      id: 7,
      title: 'Tendencias de Diseño Web para 2025',
      excerpt: 'Las últimas tendencias en diseño web que dominarán este año: minimalismo, dark mode, y más.',
      category: 'design',
      categoryName: 'Diseño',
      author: 'Laura Martínez',
      date: '2025-09-10',
      readTime: '9 min',
      image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800',
      featured: false,
    },
    {
      id: 8,
      title: 'Seguridad en APIs: Mejores Prácticas 2025',
      excerpt: 'Todo lo que necesitas saber sobre autenticación, autorización y protección de APIs REST y GraphQL.',
      category: 'development',
      categoryName: 'Desarrollo',
      author: 'Ana García',
      date: '2025-09-05',
      readTime: '13 min',
      image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800',
      featured: false,
    },
    {
      id: 9,
      title: 'Automatización de Marketing con IA',
      excerpt: 'Cómo usar inteligencia artificial para automatizar y optimizar tus campañas de marketing digital.',
      category: 'ai',
      categoryName: 'Inteligencia Artificial',
      author: 'Roberto Silva',
      date: '2025-08-30',
      readTime: '10 min',
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800',
      featured: false,
    },
  ];

  const filteredPosts = posts
    .filter((post) => selectedCategory === 'all' || post.category === selectedCategory)
    .filter((post) =>
      searchQuery === ''
        ? true
        : post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const featuredPosts = posts.filter((post) => post.featured);

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

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <input
                  type="text"
                  placeholder={t('search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-secondary-900 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="sticky top-16 md:top-20 z-40 bg-white/95 dark:bg-secondary-900/95 backdrop-blur-md border-b border-secondary-200 dark:border-secondary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'
                }`}
              >
                {category.name}
                <span className="ml-2 text-xs opacity-75">({category.count})</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {selectedCategory === 'all' && searchQuery === '' && (
        <section className="section-padding bg-white dark:bg-secondary-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
                {t('featured.title')}
              </h2>
              <p className="text-secondary-600 dark:text-secondary-400">
                {t('featured.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredPosts.map((post) => (
                <Card
                  key={post.id}
                  variant="bordered"
                  className="overflow-hidden hover:shadow-large transition-shadow group"
                >
                  <div className="aspect-video overflow-hidden bg-secondary-100 dark:bg-secondary-800">
                    <div
                      className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                      style={{ backgroundImage: `url(${post.image})` }}
                    />
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="primary" size="sm">
                        {post.categoryName}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-secondary-600 dark:text-secondary-400">
                        <ClockIcon className="h-4 w-4" />
                        {post.readTime}
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-secondary-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {post.title}
                    </h3>

                    <p className="text-secondary-700 dark:text-secondary-300 line-clamp-2">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-secondary-200 dark:border-secondary-700">
                      <div className="flex items-center gap-2">
                        <UserCircleIcon className="h-5 w-5 text-secondary-400" />
                        <span className="text-sm text-secondary-600 dark:text-secondary-400">
                          {post.author}
                        </span>
                      </div>
                      <span className="text-sm text-secondary-500 dark:text-secondary-500">
                        {new Date(post.date).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <Button size="sm" variant="ghost" className="group">
                      {t('readMore')}
                      <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Posts */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
              {selectedCategory === 'all' ? t('allPosts') : `${t('postsOf')} ${categories.find((c) => c.id === selectedCategory)?.name}`}
            </h2>
            <p className="text-secondary-600 dark:text-secondary-400">
              {filteredPosts.length} {t('postsFound')}
            </p>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <BookOpenIcon className="h-16 w-16 mx-auto text-secondary-400 mb-4" />
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">
                {t('noResults.title')}
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400 mb-6">
                {t('noResults.subtitle')}
              </p>
              <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
                {t('noResults.button')}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <Card
                  key={post.id}
                  variant="bordered"
                  className="overflow-hidden hover:shadow-medium transition-shadow group flex flex-col"
                >
                  <div className="aspect-video overflow-hidden bg-secondary-100 dark:bg-secondary-800">
                    <div
                      className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                      style={{ backgroundImage: `url(${post.image})` }}
                    />
                  </div>
                  <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" size="sm">
                        {post.categoryName}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-secondary-600 dark:text-secondary-400">
                        <ClockIcon className="h-4 w-4" />
                        {post.readTime}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-secondary-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {post.title}
                    </h3>

                    <p className="text-secondary-700 dark:text-secondary-300 line-clamp-3 flex-1">
                      {post.excerpt}
                    </p>

                    <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-secondary-600 dark:text-secondary-400">
                          {post.author}
                        </span>
                        <span className="text-sm text-secondary-500 dark:text-secondary-500">
                          {new Date(post.date).toLocaleDateString('es-ES', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      <Button size="sm" variant="ghost" fullWidth className="group">
                        {t('readArticle')}
                        <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {filteredPosts.length > 0 && (
            <div className="mt-12 flex justify-center gap-2">
              <Button variant="outline" disabled>
                {t('pagination.previous')}
              </Button>
              <Button variant="primary">1</Button>
              <Button variant="outline">2</Button>
              <Button variant="outline">3</Button>
              <Button variant="outline">{t('pagination.next')}</Button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="section-padding bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <TagIcon className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            {t('newsletter.title')}
          </h2>
          <p className="text-xl mb-10 text-primary-100">
            {t('newsletter.subtitle')}
          </p>
          <div className="max-w-md mx-auto">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder={t('newsletter.placeholder')}
                className="flex-1 px-4 py-3 rounded-lg bg-white text-secondary-900 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
              <Button size="lg" variant="outline" className="bg-white text-primary-600 hover:bg-primary-50">
                {t('newsletter.button')}
              </Button>
            </div>
            <p className="text-sm text-primary-100 mt-4">
              {t('newsletter.disclaimer')}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
