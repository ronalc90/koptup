'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
import HomeHighlights from '@/components/home/HomeHighlights';
import { DEMO_COUNT } from '@/lib/demos';
import { formatRagCOP, formatRagUSD, getRagPlan } from '@/lib/rag-plans';
import {
  ChatBubbleBottomCenterTextIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  CodeBracketIcon,
  CheckCircleIcon,
  GiftIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

const demos = [
  {
    icon: ChatBubbleBottomCenterTextIcon,
    title: 'Chatbot con IA',
    desc: 'Configura y prueba tu propio chatbot RAG con IA real (OpenAI). Sube documentos, personaliza colores y genera el código embed.',
    href: '/demo/chatbot',
    color: 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400',
  },
  {
    icon: ShoppingCartIcon,
    title: 'E-commerce completo',
    desc: 'Tienda online con catálogo, carrito, pasarela de pago y panel de administración. Lista para usar.',
    href: '/demo/ecommerce',
    color: 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400',
  },
  {
    icon: ChartBarIcon,
    title: 'Dashboard Ejecutivo',
    desc: 'KPIs en tiempo real, métricas de negocio y reportes interactivos para tomar mejores decisiones.',
    href: '/demo/dashboard-ejecutivo',
    color: 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
  },
  {
    icon: CodeBracketIcon,
    title: 'Control de Proyectos',
    desc: 'Gestión de tareas, cronogramas, equipos y seguimiento de avances con metodología ágil.',
    href: '/demo/control-proyectos',
    color: 'bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400',
  },
];

// Precio publicado del piloto RAG (mismo valor que /services#planes-rag).
const pilot = getRagPlan('piloto').setup;

const features = [
  'Software 100% a medida — nada genérico',
  'Demos interactivos antes de pagar',
  'Chatbots con GPT-4 y Claude AI',
  'E-commerce con pagos colombianos e internacionales',
  'Stack moderno: React, Next.js, Node.js, Python',
  'Equipo en Colombia, clientes en todo el mundo',
  `Precios publicados: piloto RAG de ${formatRagCOP(pilot.cop)} / ${formatRagUSD(pilot.usd)}`,
  'Entrega en 4–8 semanas para MVPs',
];

export default function BienvenidoProductHuntPage() {
  return (
    <>
      {/* Hero Product Hunt */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#DA552F] via-[#e8603a] to-[#c94424] text-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">

          {/* PH Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <svg viewBox="0 0 40 40" className="w-12 h-12 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0zm4.375 22.5H16.25V30h-3.75V10H24.375a6.25 6.25 0 0 1 0 12.5z"/>
              <path d="M24.375 13.75H16.25v5h8.125a2.5 2.5 0 0 0 0-5z"/>
            </svg>
            <span className="text-2xl font-bold opacity-90">Product Hunt</span>
          </div>

          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-6 text-sm font-medium">
            <GiftIcon className="h-4 w-4" />
            Oferta exclusiva para la comunidad de Product Hunt
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Bienvenido a KopTup 👋
          </h1>
          <p className="text-xl md:text-2xl mb-4 text-white/90 max-w-3xl mx-auto">
            Desarrollamos software a medida con demos interactivos que puedes probar <strong>ahora mismo</strong> — antes de comprometer un solo dólar.
          </p>
          <p className="text-lg text-white/75 mb-10 max-w-2xl mx-auto">
            Chatbots con IA, e-commerce, dashboards, apps móviles y más. Clientes en Colombia, México, Argentina, España y Estados Unidos.
          </p>

          {/* Special Offer */}
          <div className="bg-white/15 border border-white/30 rounded-2xl p-6 mb-10 max-w-lg mx-auto">
            <div className="flex items-center gap-2 justify-center mb-3">
              <RocketLaunchIcon className="h-5 w-5" />
              <span className="font-bold text-lg">Oferta Product Hunt</span>
            </div>
            <p className="text-white/90 mb-1 text-sm">
              Menciona <strong>&quot;PRODUCTHUNT&quot;</strong> en tu mensaje y obtén:
            </p>
            <p className="text-2xl font-bold mb-2">15% de descuento en tu primer proyecto</p>
            <p className="text-white/70 text-xs">Válido por 30 días desde el lanzamiento. Solo para nuevos clientes.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-[#DA552F] hover:bg-orange-50 font-bold" asChild>
              <Link href="/demo">Probar Demos Gratis →</Link>
            </Button>
            <Button size="lg" className="border-2 border-white/60 text-white hover:bg-white/10" asChild>
              <Link href="/contact">Solicitar Cotización</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* What is KopTup */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              ¿Qué es KopTup?
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              Una empresa de desarrollo de software que construye exactamente lo que tu negocio necesita. Sin plantillas. Sin genéricos. Cada proyecto es único.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-secondary-50 dark:bg-secondary-900">
                <CheckCircleIcon className="h-5 w-5 text-[#DA552F] flex-shrink-0" />
                <span className="text-secondary-700 dark:text-secondary-300">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demos */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              Prueba nuestras demos ahora
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400">
              Sin registro. Sin tarjeta de crédito. 100% funcional.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {demos.map((demo, i) => {
              const Icon = demo.icon;
              return (
                <Link key={i} href={demo.href}>
                  <Card variant="bordered" className="hover:shadow-medium transition-all hover:-translate-y-1 cursor-pointer h-full">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${demo.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">{demo.title}</h3>
                      <p className="text-secondary-600 dark:text-secondary-400 text-sm mb-4">{demo.desc}</p>
                      <span className="text-[#DA552F] font-medium text-sm">Probar demo →</span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link href="/demo">Ver todas las demos ({DEMO_COUNT} en total)</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Datos verificables (sin cifras de proyectos, clientes ni calificaciones) */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <HomeHighlights />
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding bg-gradient-to-br from-[#DA552F] to-[#c94424] text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Tienes un proyecto en mente?
          </h2>
          <p className="text-xl text-white/85 mb-8">
            Cuéntanos qué necesitas. Respondemos en menos de 24 horas. No hay compromiso.
            <br />
            <strong>Recuerda mencionar &quot;PRODUCTHUNT&quot; para tu 15% de descuento.</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-[#DA552F] hover:bg-orange-50 font-bold" asChild>
              <Link href="/contact">Hablar con el equipo</Link>
            </Button>
            <Button size="lg" className="border-2 border-white/60 text-white hover:bg-white/10" asChild>
              <Link href="/services#planes-rag">Ver precios</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
