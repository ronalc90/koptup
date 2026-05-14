'use client';

import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  RocketLaunchIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  CodeBracketIcon,
  SparklesIcon,
  CheckCircleIcon,
  CpuChipIcon,
  CloudIcon,
  CircleStackIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  MegaphoneIcon,
  LockClosedIcon,
  MapIcon,
  ArchiveBoxIcon,
  WrenchScrewdriverIcon,
  ScaleIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  TruckIcon,
  HeartIcon,
  BuildingOffice2Icon,
  PaintBrushIcon,
  ServerStackIcon,
  CommandLineIcon,
  UsersIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

type TechItem = { name: string; note: string };
type TechCategory = {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  items: TechItem[];
};

const techCategories: TechCategory[] = [
  {
    id: 'core-stack',
    title: 'Stack que usamos a diario',
    icon: CodeBracketIcon,
    description:
      'Lo que escribimos en este repo y entregamos a clientes. Si lo ves acá, lo dominamos a nivel de producción.',
    items: [
      { name: 'Next.js 14', note: 'App Router · Server Components · ISR' },
      { name: 'React 18', note: 'hooks, Suspense, server components' },
      { name: 'TypeScript', note: 'strict mode en frontend y backend' },
      { name: 'TailwindCSS', note: 'utility-first + design tokens' },
      { name: 'next-intl', note: 'i18n cookie-based ES/EN' },
      { name: 'Framer Motion', note: 'microinteracciones declarativas' },
      { name: 'React Hook Form + Zod', note: 'forms + validación tipada' },
      { name: 'SWR', note: 'data fetching con revalidación' },
      { name: 'Recharts', note: 'gráficas para dashboards' },
      { name: 'Node.js 18+', note: 'runtime del backend' },
      { name: 'Express', note: 'APIs REST simples y maduras' },
      { name: 'Mongoose + MongoDB 7', note: 'persistencia principal' },
      { name: 'OpenAI SDK', note: 'GPT-4o, embeddings, function calling' },
      { name: 'JWT + bcryptjs', note: 'auth stateless con hash seguro' },
      { name: 'AWS S3 SDK', note: 'uploads y storage de archivos' },
      { name: 'Docker', note: 'entornos local + production-like' },
      { name: 'Turborepo', note: 'monorepo con cache de builds' },
      { name: 'Vercel', note: 'deploy del frontend' },
      { name: 'Railway', note: 'hosting del backend + Mongo' },
      { name: 'Jest', note: 'unit + integration tests' },
      { name: 'Playwright', note: 'E2E cross-browser' },
      { name: 'React Testing Library', note: 'tests de componentes' },
      { name: 'ESLint + Prettier', note: 'lint y formato consistentes' },
      { name: 'Swagger / OpenAPI 3', note: 'documentación de APIs' },
      { name: 'BM25 (custom)', note: 'retrieval keyword para el RAG' },
    ],
  },
  {
    id: 'familiarity',
    title: 'Familiaridad — usamos cuando el proyecto lo pide',
    icon: WrenchScrewdriverIcon,
    description:
      'Tecnologías que hemos puesto en producción en proyectos pasados pero no son nuestro día a día. Cuando un cliente las necesita, las traemos sin curva de aprendizaje extra.',
    items: [
      { name: 'Python', note: 'FastAPI / Django / Flask' },
      { name: 'Java + Spring Boot', note: 'microservicios enterprise' },
      { name: 'PostgreSQL + pgvector', note: 'relacional con vectores' },
      { name: 'Redis', note: 'caché y sesiones' },
      { name: 'Pinecone', note: 'vector DB managed' },
      { name: 'Anthropic Claude SDK', note: 'multi-LLM routing' },
      { name: 'GraphQL (Apollo)', note: 'cuando el cliente lo pide' },
      { name: 'WebSockets / Socket.io', note: 'real-time bidireccional' },
      { name: 'React Native + Expo', note: 'apps móviles cross-platform' },
      { name: 'Kubernetes', note: 'cuando el cliente ya lo opera' },
      { name: 'Terraform', note: 'IaC stubs' },
      { name: 'GitHub Actions', note: 'CI/CD pipelines' },
      { name: 'Stripe / PayU', note: 'pagos online' },
      { name: 'Twilio', note: 'SMS y WhatsApp Business' },
      { name: 'DIAN e-invoicing', note: 'facturación electrónica Colombia' },
    ],
  },
  {
    id: 'aware',
    title: 'Conceptualmente sólidos — no son nuestro core',
    icon: SparklesIcon,
    description:
      'Sabemos qué son, cuándo aplican y cómo encajan en una arquitectura. Si un proyecto los requiere de forma intensiva, sumamos a un colaborador especialista en lugar de fingir experiencia profunda.',
    items: [
      { name: 'gRPC / Protobuf', note: 'comunicación inter-servicios' },
      { name: 'Kafka / RabbitMQ', note: 'event streaming a escala' },
      { name: 'ClickHouse / Snowflake', note: 'analytics OLAP' },
      { name: 'Flutter / Swift / Kotlin', note: 'mobile nativo' },
      { name: 'ML clásico (sklearn, XGBoost)', note: 'modelos tabulares' },
      { name: 'Deepgram / ElevenLabs', note: 'STT/TTS streaming' },
      { name: 'Compliance (HIPAA, SOC2, ISO 27001)', note: 'alineación, no certificación formal' },
    ],
  },
];

const aiCapabilities = [
  {
    title: 'RAG con citas verificables',
    description: 'Hybrid retrieval (BM25 + vectorial), reranking y respuestas con citaciones inline clickeables. Implementado en el chatbot demo.',
  },
  {
    title: 'Chatbots conversacionales',
    description: 'WhatsApp, web, Instagram, Messenger y Telegram con memoria y handoff humano.',
  },
  {
    title: 'Procesamiento de documentos',
    description: 'OCR, extracción de tablas, clasificación y validación de campos.',
  },
  {
    title: 'Voice AI',
    description: 'STT/TTS streaming, IVR conversacional, transcripción de llamadas.',
  },
  {
    title: 'Visión por computadora',
    description: 'Análisis de imágenes, OCR, moderación de contenido, conteo de objetos.',
  },
  {
    title: 'AI Agents',
    description: 'Planner/executor, tool calling, multi-agente con memoria persistente.',
  },
  {
    title: 'ML clásico',
    description: 'Clasificación, regresión, clustering, forecasting de demanda y series temporales.',
  },
  {
    title: 'NLP',
    description: 'Extracción de entidades, sentiment, intent classification, topic modeling.',
  },
  {
    title: 'Recomendaciones',
    description: 'Personalización producto y contenido — collaborative + content-based.',
  },
  {
    title: 'Anomaly detection',
    description: 'Detección de fraude, transacciones inusuales y comportamiento atípico.',
  },
  {
    title: 'Predicción de negocio',
    description: 'Churn, LTV, propensity scoring y next-best-action.',
  },
];

const verticals = [
  {
    icon: HeartIcon,
    title: 'Health-tech',
    description: 'Telemedicina, EHR, integración HL7/FHIR y HIPAA. Caso reciente: SoSalud.',
  },
  {
    icon: CreditCardIcon,
    title: 'Fintech',
    description: 'Facturación electrónica, KYC, pasarelas, billeteras y PCI-DSS.',
  },
  {
    icon: ShoppingBagIcon,
    title: 'E-commerce & Retail',
    description: 'Multi-país, multi-warehouse, omnicanal y promociones complejas.',
  },
  {
    icon: TruckIcon,
    title: 'Logística & Delivery',
    description: 'WMS, last-mile, routing optimizado y tracking en tiempo real.',
  },
  {
    icon: AcademicCapIcon,
    title: 'EdTech',
    description: 'LMS, AI tutoring, evaluaciones automáticas y certificaciones.',
  },
  {
    icon: DocumentTextIcon,
    title: 'LegalTech',
    description: 'Firma electrónica eIDAS / Ley 527, contratos inteligentes y compliance.',
  },
  {
    icon: BriefcaseIcon,
    title: 'CRM & Ventas',
    description: 'Pipelines, automatización comercial y forecasting de ingresos.',
  },
  {
    icon: BuildingOffice2Icon,
    title: 'ERP & Operaciones',
    description: 'Inventarios, facturación, contabilidad y nómina multi-país.',
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: 'Help desk & Customer support',
    description: 'Mesa de servicio, SLAs, base de conocimiento con IA.',
  },
];

const methodology = [
  { step: '01', title: 'Discovery & roadmap', description: '1-2 semanas. Mapeamos objetivos, riesgos y entregables.' },
  { step: '02', title: 'Diseño UI/UX en Figma', description: 'Mockups validables antes de escribir código de producción.' },
  { step: '03', title: 'Sprints semanales', description: 'Reviews con cliente cada viernes, ajustes ágiles.' },
  { step: '04', title: 'CI/CD desde día 1', description: 'Pipelines automáticas, staging permanente.' },
  { step: '05', title: 'Tests automáticos', description: 'Unit + integration + E2E corriendo en cada PR.' },
  { step: '06', title: 'Deploy continuo', description: 'Staging actualizado en cada merge, producción on-demand.' },
  { step: '07', title: 'Producto en producción', description: 'Entrega real, no maquetas. Métricas desde el día uno.' },
  { step: '08', title: 'Soporte post-entrega', description: '1-3 meses incluidos según contrato + SLA opcional.' },
];

const tooling = [
  { label: 'Reuniones', items: ['Zoom', 'Google Meet', 'Microsoft Teams'] },
  { label: 'Comunicación', items: ['Slack', 'WhatsApp', 'Email'] },
  { label: 'Código', items: ['GitHub', 'GitLab', 'Bitbucket'] },
  { label: 'Documentación', items: ['Notion', 'Confluence', 'GitBook'] },
  { label: 'Issues', items: ['Linear', 'Jira', 'GitHub Issues'] },
  { label: 'Tiempo', items: ['Toggl', 'Harvest', 'Clockify'] },
];

const caseStudies = [
  {
    badge: 'Health-tech · Bogotá',
    title: 'SoSalud — VPN empresarial corporativa',
    description:
      'Tercero administrador de Nueva EPS. Implementación de VPN empresarial para habilitar trabajo remoto seguro de su equipo administrativo, con 2 meses de soporte post-entrega incluidos.',
    tech: ['VPN site-to-site', 'IPsec / WireGuard', 'Hardening', 'Soporte 2 meses'],
    metric: '$3.500.000 COP',
    metricLabel: 'inversión total',
  },
  {
    badge: 'Retail · Colombia',
    title: 'Chatbot WhatsApp para empresa de productos',
    description:
      'Bot conversacional WhatsApp Business API con catálogo, captura de leads y handoff humano. Integrado a Wompi para cobros en línea y a CRM para seguimiento.',
    tech: ['WhatsApp Business API', 'GPT-4o-mini', 'Wompi', 'PostgreSQL'],
    metric: '+3x',
    metricLabel: 'leads cualificados',
  },
  {
    badge: 'Servicios profesionales · LatAm',
    title: 'Dashboard ejecutivo mid-market',
    description:
      'Tablero unificado con métricas operativas y financieras consolidadas desde múltiples sistemas. Vista por sucursal, exportes PDF y alertas automáticas.',
    tech: ['Next.js 14', 'PostgreSQL', 'Recharts', 'Vercel'],
    metric: '-60%',
    metricLabel: 'tiempo de cierre mensual',
  },
];

const heroStats = [
  { value: '8+', label: 'Años construyendo software' },
  { value: '2', label: 'Apps reales con OpenAI' },
  { value: '25', label: 'Prototipos navegables' },
  { value: '~25', label: 'Tecnologías core que usamos' },
];

const bigMetrics: { value: string; label: string; sub: string; gradient: string }[] = [
  {
    value: '2',
    label: 'Apps reales con IA',
    sub: 'Chatbot RAG con OpenAI + Generador LinkedIn Ads',
    gradient: 'from-primary-500 to-primary-700',
  },
  {
    value: '25',
    label: 'Prototipos navegables',
    sub: 'Mockups interactivos con datos simulados realistas',
    gradient: 'from-secondary-500 to-secondary-800',
  },
  {
    value: '~25',
    label: 'Tecnologías core',
    sub: 'Las que dominamos y usamos a diario en el repo',
    gradient: 'from-emerald-500 to-emerald-700',
  },
  {
    value: '2026',
    label: 'Año fundación',
    sub: 'Estudio comercial Koptup',
    gradient: 'from-amber-500 to-orange-700',
  },
  {
    value: 'CO',
    label: 'Base Bogotá',
    sub: 'Trabajamos con clientes en toda LatAm',
    gradient: 'from-fuchsia-500 to-rose-700',
  },
];

type TeamMember = {
  name: string;
  role: string;
  bio: string;
  initials: string;
  gradient: string;
  photo?: string;
};

const team: TeamMember[] = [
  {
    name: 'Ronald Cipagauta',
    role: 'Founder · Full-stack & IA aplicada',
    bio: 'Full-stack engineer con 8+ años construyendo productos en Colombia y LATAM. Diseña, escribe y opera el stack — frontend, backend, IA aplicada y deploy.',
    initials: 'RC',
    gradient: 'from-primary-500 to-primary-800',
    photo:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&q=80&auto=format',
  },
  {
    name: 'Red de colaboradores',
    role: 'Diseño, IA, DevOps, QA · bajo demanda',
    bio: 'Cuando un proyecto requiere especialización extra (UI/UX dedicado, ML engineer para casos no estándar, DevOps para infraestructura compleja, QA con Playwright), sumamos colaboradores freelance de confianza. Estructura flexible, no headcount fijo.',
    initials: 'C+',
    gradient: 'from-emerald-500 to-emerald-800',
  },
];

type TimelineItem = {
  year: string;
  title: string;
  description: string;
  highlight?: boolean;
};

const timeline: TimelineItem[] = [
  {
    year: '2024',
    title: 'Primeros prototipos',
    description:
      'Arranca la idea de Koptup como vitrina: prototipos navegables de chatbot, e-commerce y dashboards con datos simulados para mostrar capacidad de UI/UX.',
  },
  {
    year: '2025',
    title: 'Primer cliente real — SoSalud',
    description:
      'Implementación de VPN empresarial para SoSalud (tercero administrador de Nueva EPS) por $3.5M COP. Ese ingreso financia la expansión del catálogo de prototipos.',
  },
  {
    year: '2026',
    title: 'Vitrina y dos apps reales',
    description:
      '27 vistas interactivas en línea (2 con integración real a OpenAI: chatbot RAG y generador de LinkedIn Ads, el resto mockups), planes en COP/USD con TRM en vivo, sitio comercial completo.',
    highlight: true,
  },
  {
    year: '2027+',
    title: 'Convertir prototipos en productos',
    description:
      'Roadmap: convertir 2-3 prototipos más en apps reales según demanda de clientes (CRM IA, helpdesk IA, automatización de workflows). Alianzas con integradores en México y Argentina.',
  },
];

const missionPoints = [
  'Software a medida con código fuente entregado',
  'O SaaS hospedado por nosotros, listo para usar',
  'Stack moderno: Next.js, Node, Python, IA',
  'Foco LatAm — Colombia primero, todo el continente',
];

export default function AboutPage() {
  return (
    <>
      {/* Hero con foto de fondo */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&h=1080&fit=crop&q=80&auto=format')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/95 via-primary-800/90 to-secondary-950/95" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-white w-full">
          <div className="max-w-4xl">
            <Badge variant="outline" size="lg" className="mb-6 border-white/40 text-white">
              Sobre Koptup
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">Koptup</h1>
            <p className="text-2xl md:text-3xl mb-8 max-w-3xl text-primary-50">
              Estudio de desarrollo a medida en Bogotá. Construimos software para empresas de LATAM con stack moderno —
              dos apps reales con IA online + 25 prototipos navegables para que veas lo que podemos construirte.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="outline" className="bg-white text-primary-700 hover:bg-primary-50" asChild>
                <Link href="/demo">Ver los 27 prototipos</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10" asChild>
                <Link href="/contact">Hablar con nosotros</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
            {heroStats.map((s) => (
              <div key={s.label} className="text-center md:text-left">
                <div className="text-4xl md:text-5xl font-bold mb-2">{s.value}</div>
                <div className="text-sm md:text-base text-primary-100">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Métricas grandes */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <ChartBarIcon className="h-14 w-14 mx-auto text-primary-600 dark:text-primary-400 mb-3" />
            <Badge variant="primary" size="md" className="mb-4">
              Métricas
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              Koptup en números
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              Los datos detrás de la plataforma — actualizados a 2026.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {bigMetrics.map((m) => (
              <div
                key={m.label}
                className={`relative overflow-hidden rounded-3xl p-8 text-white bg-gradient-to-br ${m.gradient} shadow-xl hover:scale-[1.02] transition-transform`}
              >
                <div className="text-6xl md:text-7xl font-extrabold mb-3 leading-none">{m.value}</div>
                <div className="text-lg font-bold mb-2">{m.label}</div>
                <div className="text-sm text-white/80">{m.sub}</div>
                <SparklesIcon className="absolute -top-4 -right-4 h-24 w-24 text-white/10" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ¿Quiénes somos? */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="primary" size="md" className="mb-4">
                ¿Quiénes somos?
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-6">
                Un equipo técnico, no una agencia
              </h2>
              <p className="text-lg text-secondary-700 dark:text-secondary-300 mb-6">
                Koptup es el estudio de <strong>Ronald Cipagauta</strong> en Bogotá. Desarrollador full-stack
                con 8+ años construyendo productos para clientes en Colombia y LATAM. Cuando un proyecto lo requiere
                sumamos colaboradores especializados en diseño, IA y DevOps — somos un equipo flexible, no una agencia
                con headcount fijo.
              </p>
              <p className="text-lg text-secondary-700 dark:text-secondary-300 mb-6">
                Trabajamos en dos modalidades: <strong>software a medida</strong> con código fuente entregado al
                cliente, o <strong>SaaS hospedado</strong> por nosotros cuando el cliente prefiere no operar la
                infraestructura. Lo que ves online son <strong>2 apps reales</strong> (chatbot RAG con OpenAI y
                generador de LinkedIn Ads) y <strong>25 prototipos navegables</strong> con datos simulados que
                muestran el rango de soluciones que podemos construirte.
              </p>
              <div className="space-y-3">
                {missionPoints.map((point) => (
                  <div key={point} className="flex items-center gap-3">
                    <CheckCircleIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                    <span className="text-secondary-700 dark:text-secondary-300">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary-600 to-secondary-800 flex items-center justify-center">
                <div className="text-center text-white p-8">
                  <SparklesIcon className="h-20 w-20 mx-auto mb-6 opacity-90" />
                  <div className="text-3xl font-bold mb-2">Ronald Cipagauta</div>
                  <div className="text-primary-100 mb-6">Founder & CEO · Full-stack engineer</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['Next.js', 'Node.js', 'Python', 'OpenAI', 'AWS', 'PostgreSQL'].map((s) => (
                      <span
                        key={s}
                        className="px-3 py-1 bg-white/15 backdrop-blur rounded-full text-sm font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary-600 rounded-2xl flex items-center justify-center shadow-xl">
                <RocketLaunchIcon className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <UsersIcon className="h-14 w-14 mx-auto text-primary-600 dark:text-primary-400 mb-3" />
            <Badge variant="primary" size="md" className="mb-4">
              Equipo
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              Quién está detrás de Koptup
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              Un núcleo técnico pequeño y enfocado. Colaboramos con especialistas senior según el proyecto.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member) => (
              <Card
                key={member.name}
                variant="bordered"
                className="hover:shadow-large transition-shadow overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    {member.photo ? (
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 ring-2 ring-primary-200 dark:ring-primary-900">
                        <Image
                          src={member.photo}
                          alt={member.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className={`w-20 h-20 rounded-2xl flex-shrink-0 bg-gradient-to-br ${member.gradient} flex items-center justify-center text-white text-2xl font-extrabold shadow-lg`}
                      >
                        {member.initials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-secondary-900 dark:text-white leading-tight">
                        {member.name}
                      </h3>
                      <div className="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-1">
                        {member.role}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-secondary-700 dark:text-secondary-300">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline de la empresa */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <CalendarDaysIcon className="h-14 w-14 mx-auto text-primary-600 dark:text-primary-400 mb-3" />
            <Badge variant="primary" size="md" className="mb-4">
              Historia
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              De idea a plataforma
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              Lo que pasó cada año y a dónde vamos.
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div
              aria-hidden
              className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-200 via-primary-400 to-primary-200 dark:from-primary-900 dark:via-primary-600 dark:to-primary-900 md:-translate-x-1/2"
            />
            <ol className="space-y-10">
              {timeline.map((item, idx) => {
                const isLeft = idx % 2 === 0;
                return (
                  <li key={item.year} className="relative md:grid md:grid-cols-2 md:gap-12">
                    <div
                      aria-hidden
                      className={`absolute left-4 md:left-1/2 top-3 w-4 h-4 rounded-full border-4 md:-translate-x-1/2 ${
                        item.highlight
                          ? 'bg-primary-500 border-primary-200 dark:border-primary-900 ring-4 ring-primary-300/40'
                          : 'bg-white dark:bg-secondary-950 border-primary-500'
                      }`}
                    />
                    <div className={isLeft ? 'md:pr-12 md:text-right' : 'md:col-start-2 md:pl-12'}>
                      <div className="pl-12 md:pl-0">
                        <div className="text-3xl md:text-4xl font-extrabold text-primary-600 dark:text-primary-400 mb-2">
                          {item.year}
                        </div>
                        <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">
                          {item.title}
                        </h3>
                        <p className="text-secondary-700 dark:text-secondary-300">{item.description}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* Tecnologías que dominamos */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <CodeBracketIcon className="h-14 w-14 mx-auto text-primary-600 dark:text-primary-400 mb-3" />
            <Badge variant="primary" size="md" className="mb-4">
              Stack tecnológico
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              Tecnologías que dominamos
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              Más de 150 herramientas, frameworks y servicios productivos. Elegimos la combinación correcta para
              cada problema — no forzamos un stack único.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {techCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Card key={cat.id} variant="bordered" className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-1">
                          {cat.title}{' '}
                          <span className="text-sm font-normal text-secondary-500 dark:text-secondary-400">
                            ({cat.items.length})
                          </span>
                        </h3>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400">{cat.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {cat.items.map((item) => (
                        <span
                          key={item.name}
                          title={item.note}
                          className="group inline-flex items-center px-3 py-1.5 rounded-lg border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 text-sm font-medium text-secondary-800 dark:text-secondary-200 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:text-primary-700 dark:hover:text-primary-300 transition-colors cursor-default"
                        >
                          {item.name}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Capacidades de IA */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <CpuChipIcon className="h-14 w-14 mx-auto text-primary-600 dark:text-primary-400 mb-3" />
            <Badge variant="primary" size="md" className="mb-4">
              IA aplicada
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              Capacidades de IA en producción
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              No vendemos prompts. Construimos sistemas con LLMs, RAG, agentes y ML clásico operando 24/7.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiCapabilities.map((cap) => (
              <Card key={cap.title} variant="bordered" className="hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <SparklesIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                    <h3 className="text-lg font-bold text-secondary-900 dark:text-white">{cap.title}</h3>
                  </div>
                  <p className="text-secondary-700 dark:text-secondary-300 text-sm">{cap.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Verticales */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="primary" size="md" className="mb-4">
              Industrias
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              Verticales donde tenemos experiencia real
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              Conocemos los flujos, regulaciones y dolores específicos de cada sector.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {verticals.map((v) => {
              const Icon = v.icon;
              return (
                <Card key={v.title} variant="bordered" className="hover:shadow-medium transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">{v.title}</h3>
                    <p className="text-secondary-700 dark:text-secondary-300 text-sm">{v.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Metodología */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="primary" size="md" className="mb-4">
              Cómo trabajamos
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              Metodología probada en 8+ años
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              Iteramos en sprints semanales con producto real en staging desde el día uno.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {methodology.map((m) => (
              <Card key={m.step} variant="bordered" className="hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-3">{m.step}</div>
                  <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">{m.title}</h3>
                  <p className="text-secondary-700 dark:text-secondary-300 text-sm">{m.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Herramientas de trabajo */}
      <section className="section-padding bg-secondary-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <CommandLineIcon className="h-14 w-14 mx-auto text-primary-600 dark:text-primary-400 mb-3" />
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              Cómo nos coordinamos con el cliente
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              Nos adaptamos a las herramientas del cliente o sugerimos las que mejor encajan.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {tooling.map((g) => (
              <Card key={g.label} variant="bordered">
                <CardContent className="p-5">
                  <div className="text-xs uppercase tracking-wide text-secondary-500 dark:text-secondary-400 font-semibold mb-3">
                    {g.label}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {g.items.map((i) => (
                      <Badge key={i} variant="secondary" size="sm">
                        {i}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Casos reales */}
      <section className="section-padding bg-white dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <ShieldCheckIcon className="h-14 w-14 mx-auto text-primary-600 dark:text-primary-400 mb-3" />
            <Badge variant="primary" size="md" className="mb-4">
              Casos reales
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              Proyectos que ya entregamos
            </h2>
            <p className="text-xl text-secondary-600 dark:text-secondary-400 max-w-3xl mx-auto">
              Una muestra del trabajo en producción para clientes reales en Colombia y LatAm.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {caseStudies.map((cs) => (
              <Card key={cs.title} variant="bordered" className="hover:shadow-large transition-shadow flex flex-col">
                <CardContent className="p-6 flex flex-col h-full">
                  <Badge variant="info" size="sm" className="self-start mb-4">
                    {cs.badge}
                  </Badge>
                  <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-3">{cs.title}</h3>
                  <p className="text-secondary-700 dark:text-secondary-300 text-sm mb-4 flex-grow">
                    {cs.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {cs.tech.map((t) => (
                      <Badge key={t} variant="secondary" size="sm">
                        {t}
                      </Badge>
                    ))}
                  </div>
                  <div className="border-t border-secondary-200 dark:border-secondary-800 pt-4 mt-auto">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{cs.metric}</div>
                    <div className="text-xs text-secondary-500 dark:text-secondary-400">{cs.metricLabel}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final con foto/gradiente */}
      <section className="relative py-32 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1920&h=1080&fit=crop&q=80&auto=format')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/95 via-primary-700/95 to-secondary-900/95" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <GlobeAltIcon className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-4xl md:text-6xl font-bold mb-6">¿Empezamos?</h2>
          <p className="text-xl mb-10 text-white/90">
            Probá los prototipos sin registrarte o agendá una llamada de 30 minutos para evaluar tu proyecto.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demo"
              className="bg-white text-primary-700 px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition shadow-xl"
            >
              Ver los 27 prototipos
            </Link>
            <Link
              href="/contact"
              className="bg-white/15 border-2 border-white/30 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/25 transition"
            >
              Hablar con nosotros
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
