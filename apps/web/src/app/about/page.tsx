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

type TechCategory = {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  items: { name: string; note: string }[];
};

const techCategories: TechCategory[] = [
  {
    id: 'frontend',
    title: 'Frontend & UI',
    icon: PaintBrushIcon,
    description: 'Interfaces modernas, accesibles y rápidas en cualquier dispositivo.',
    items: [
      { name: 'Next.js 14', note: 'App Router, Server Components, ISR' },
      { name: 'React 18', note: 'Server/Client components, Suspense' },
      { name: 'TypeScript', note: 'strict mode end-to-end' },
      { name: 'TailwindCSS', note: 'utility-first + design tokens' },
      { name: 'shadcn/ui', note: 'Radix primitives accesibles' },
      { name: 'Framer Motion', note: 'animaciones declarativas' },
      { name: 'next-intl', note: 'i18n server-side ES/EN/PT' },
      { name: 'next-themes', note: 'dark mode persistente' },
      { name: 'React Hook Form', note: 'forms performantes' },
      { name: 'Zod', note: 'validación tipada compartida cliente/servidor' },
      { name: 'TanStack Query', note: 'data fetching + caching' },
      { name: 'SWR', note: 'revalidación automática' },
      { name: 'Axios', note: 'HTTP client con interceptors' },
      { name: 'Heroicons', note: 'iconografía SVG' },
      { name: 'Lucide', note: 'iconos open-source' },
      { name: 'date-fns', note: 'manejo de fechas inmutables' },
      { name: 'Day.js', note: 'fechas ligero' },
      { name: 'React Markdown', note: 'render Markdown + rehype/remark' },
      { name: 'jsPDF', note: 'export PDF cliente' },
      { name: 'pdfmake', note: 'PDFs declarativos' },
      { name: 'Recharts', note: 'gráficos React-first' },
      { name: 'D3.js', note: 'visualizaciones custom' },
      { name: 'Visx', note: 'componibles low-level' },
      { name: 'React Flow', note: 'diagramas y flujos' },
      { name: 'Tldraw', note: 'whiteboards colaborativos' },
      { name: 'dnd-kit', note: 'drag & drop accesible' },
      { name: 'Excalidraw', note: 'diagramas a mano alzada' },
      { name: 'Yjs / CRDTs', note: 'colaboración real-time' },
      { name: 'React Native + Expo', note: 'apps móviles iOS/Android' },
      { name: 'Flutter', note: 'cross-platform Dart' },
      { name: 'PWA', note: 'offline + installable' },
      { name: 'Storybook', note: 'librería UI documentada' },
      { name: 'Playwright', note: 'E2E browser testing' },
      { name: 'React Testing Library', note: 'unit/integration tests' },
      { name: 'Jest', note: 'test runner' },
    ],
  },
  {
    id: 'backend',
    title: 'Backend & APIs',
    icon: ServerStackIcon,
    description: 'APIs y servicios robustos, escalables y bien tipados.',
    items: [
      { name: 'Node.js 18/20/22', note: 'runtime principal' },
      { name: 'Express', note: 'REST APIs maduras' },
      { name: 'Fastify', note: 'alto throughput + plugins' },
      { name: 'NestJS', note: 'arquitectura modular DI' },
      { name: 'GraphQL', note: 'Apollo Server / Mercurius' },
      { name: 'REST APIs', note: 'OpenAPI 3, versionado' },
      { name: 'WebSockets', note: 'tiempo real bidireccional' },
      { name: 'Socket.io', note: 'rooms, namespaces, fallback' },
      { name: 'Server-Sent Events', note: 'streaming HTTP' },
      { name: 'gRPC', note: 'comunicación inter-servicios' },
      { name: 'tRPC', note: 'end-to-end typesafe' },
      { name: 'Python', note: 'FastAPI / Django / Flask' },
      { name: 'Java + Spring Boot', note: 'enterprise + microservicios' },
      { name: 'Go', note: 'Gin / Fiber, alto rendimiento' },
      { name: 'Ruby on Rails', note: 'monolitos productivos' },
      { name: 'PHP + Laravel', note: 'integraciones con WP/Shopify' },
      { name: 'C# .NET Core', note: 'integraciones Microsoft' },
      { name: 'Bun', note: 'runtime ultra-rápido' },
      { name: 'Deno', note: 'runtime secure-by-default' },
    ],
  },
  {
    id: 'databases',
    title: 'Bases de datos',
    icon: CircleStackIcon,
    description: 'Persistencia relacional, documental, vectorial y analítica.',
    items: [
      { name: 'PostgreSQL 15/16', note: 'OLTP + pgvector + PostGIS' },
      { name: 'MongoDB 7', note: 'documentos + agregaciones' },
      { name: 'MySQL / MariaDB', note: 'compatibilidad legacy' },
      { name: 'Redis', note: 'cache, pub/sub, streams' },
      { name: 'DynamoDB', note: 'NoSQL serverless AWS' },
      { name: 'Elasticsearch', note: 'búsqueda full-text' },
      { name: 'OpenSearch', note: 'fork open-source' },
      { name: 'ClickHouse', note: 'analytics columnar' },
      { name: 'Snowflake', note: 'data warehouse cloud' },
      { name: 'BigQuery', note: 'warehouse Google + ML' },
      { name: 'Pinecone', note: 'vector DB managed' },
      { name: 'Weaviate', note: 'vector + hybrid' },
      { name: 'Qdrant', note: 'vector self-hosted' },
      { name: 'Chroma', note: 'embeddings ligero' },
      { name: 'DuckDB', note: 'analytics embedded' },
      { name: 'SQLite', note: 'apps locales y edge' },
      { name: 'Firebase Firestore', note: 'realtime + offline' },
      { name: 'Supabase', note: 'Postgres + Auth managed' },
      { name: 'PlanetScale', note: 'MySQL serverless' },
    ],
  },
  {
    id: 'cloud',
    title: 'Cloud & Infraestructura',
    icon: CloudIcon,
    description: 'Despliegue, observabilidad y operación 24/7.',
    items: [
      { name: 'AWS', note: 'EC2, S3, Lambda, RDS, ECS, EKS, CloudFront, Route53, IAM' },
      { name: 'Google Cloud', note: 'GKE, Cloud Run, Pub/Sub, BigQuery' },
      { name: 'Microsoft Azure', note: 'AKS, Functions, CosmosDB' },
      { name: 'Vercel', note: 'deploy frontend Next.js' },
      { name: 'Railway', note: 'deploy backend rápido' },
      { name: 'Render', note: 'web services + cron' },
      { name: 'Fly.io', note: 'apps cerca del usuario' },
      { name: 'DigitalOcean', note: 'droplets + App Platform' },
      { name: 'Cloudflare', note: 'CDN, Workers, R2, Pages' },
      { name: 'Docker', note: 'contenedores reproducibles' },
      { name: 'Docker Compose', note: 'entornos locales multi-servicio' },
      { name: 'Kubernetes', note: 'EKS/GKE/AKS/k3s' },
      { name: 'Terraform', note: 'IaC multi-cloud' },
      { name: 'Pulumi', note: 'IaC en TypeScript/Python' },
      { name: 'Ansible', note: 'configuration management' },
      { name: 'GitHub Actions', note: 'CI/CD nativo' },
      { name: 'GitLab CI', note: 'pipelines self-hosted' },
      { name: 'CircleCI', note: 'CI orquestada' },
    ],
  },
  {
    id: 'ai',
    title: 'IA & Machine Learning',
    icon: CpuChipIcon,
    description: 'LLMs, RAG, agentes, visión, voz y ML clásico en producción.',
    items: [
      { name: 'OpenAI', note: 'GPT-4o, GPT-4o-mini, embeddings v3' },
      { name: 'Anthropic Claude', note: 'Sonnet, Opus, Haiku' },
      { name: 'Google Gemini', note: 'multimodal long-context' },
      { name: 'Mistral', note: 'modelos europeos' },
      { name: 'Llama', note: 'self-hosted on-prem' },
      { name: 'LangChain', note: 'orquestación LLM' },
      { name: 'LangGraph', note: 'flujos agentic con estado' },
      { name: 'LlamaIndex', note: 'RAG production-ready' },
      { name: 'Hugging Face', note: 'Transformers + Datasets' },
      { name: 'Embeddings', note: 'OpenAI / Cohere / Voyage' },
      { name: 'Rerankers', note: 'Cohere Rerank + cross-encoders' },
      { name: 'Hybrid retrieval', note: 'BM25 + dense + RRF' },
      { name: 'pgvector', note: 'búsqueda vectorial en Postgres' },
      { name: 'TensorFlow', note: 'deep learning' },
      { name: 'PyTorch', note: 'investigación + producción' },
      { name: 'scikit-learn', note: 'ML clásico' },
      { name: 'spaCy', note: 'NLP industrial' },
      { name: 'NLTK', note: 'NLP académico' },
      { name: 'Whisper', note: 'speech-to-text' },
      { name: 'ElevenLabs', note: 'voces TTS premium' },
      { name: 'Cartesia', note: 'TTS streaming baja latencia' },
      { name: 'Deepgram', note: 'STT streaming enterprise' },
      { name: 'AssemblyAI', note: 'STT + diarización' },
      { name: 'GPT-4V / Claude Vision', note: 'análisis multimodal' },
      { name: 'Tesseract OCR', note: 'extracción texto open-source' },
      { name: 'Stable Diffusion', note: 'generación de imágenes' },
      { name: 'ComfyUI', note: 'pipelines visuales SD' },
    ],
  },
  {
    id: 'messaging',
    title: 'Mensajería & Comunicación',
    icon: ChatBubbleLeftRightIcon,
    description: 'WhatsApp, voz, email y notificaciones push multicanal.',
    items: [
      { name: 'Twilio', note: 'SMS, voice, WhatsApp Business' },
      { name: 'WhatsApp Business API', note: 'oficial Meta Cloud API' },
      { name: 'SendGrid', note: 'email transaccional' },
      { name: 'Postmark', note: 'email confiable' },
      { name: 'Resend', note: 'email developer-friendly' },
      { name: 'Mailgun', note: 'email + listas' },
      { name: 'OneSignal', note: 'push notifications' },
      { name: 'Firebase Cloud Messaging', note: 'push iOS/Android/web' },
      { name: 'Slack API', note: 'bots e integraciones' },
      { name: 'Discord bots', note: 'comunidades' },
      { name: 'Microsoft Teams', note: 'bots empresariales' },
    ],
  },
  {
    id: 'payments',
    title: 'Pagos & Fintech',
    icon: CreditCardIcon,
    description: 'Pasarelas globales y locales LatAm, Open Banking, BNPL.',
    items: [
      { name: 'Stripe', note: 'subs, marketplace, Terminal' },
      { name: 'PayPal', note: 'pagos internacionales' },
      { name: 'Mercado Pago', note: 'pagos LatAm' },
      { name: 'Wompi', note: 'pagos Colombia (Bancolombia)' },
      { name: 'PayU', note: 'pagos LatAm multi-país' },
      { name: 'Nequi', note: 'billetera Colombia' },
      { name: 'Daviplata', note: 'billetera Colombia' },
      { name: 'PSE', note: 'débito bancario Colombia' },
      { name: 'Bre-B', note: 'pagos inmediatos Colombia' },
      { name: 'Addi', note: 'BNPL LatAm' },
      { name: 'Klarna', note: 'BNPL global' },
      { name: 'Afterpay', note: 'BNPL' },
      { name: 'Apple Pay', note: 'wallet iOS' },
      { name: 'Google Pay', note: 'wallet Android' },
      { name: 'Plaid', note: 'Open Banking US' },
      { name: 'Belvo', note: 'Open Banking LatAm' },
    ],
  },
  {
    id: 'einvoicing',
    title: 'Facturación electrónica LatAm',
    icon: DocumentTextIcon,
    description: 'Integraciones oficiales con los 8 organismos tributarios principales.',
    items: [
      { name: 'DIAN', note: 'Colombia — facturación electrónica' },
      { name: 'SAT', note: 'México — CFDI 4.0' },
      { name: 'AFIP', note: 'Argentina — FE electrónica' },
      { name: 'SII', note: 'Chile — DTE' },
      { name: 'SUNAT', note: 'Perú — comprobantes electrónicos' },
      { name: 'DGI', note: 'Uruguay — CFE' },
      { name: 'SET', note: 'Paraguay — KuDE' },
      { name: 'SRI', note: 'Ecuador — comprobantes electrónicos' },
    ],
  },
  {
    id: 'ecommerce',
    title: 'E-commerce',
    icon: ShoppingBagIcon,
    description: 'Tiendas headless, custom y plataformas tradicionales.',
    items: [
      { name: 'Shopify', note: 'apps custom + checkout extensions' },
      { name: 'WooCommerce', note: 'WordPress commerce' },
      { name: 'Magento', note: 'enterprise B2B/B2C' },
      { name: 'VTEX', note: 'commerce LatAm' },
      { name: 'Saleor', note: 'headless GraphQL' },
      { name: 'Medusa.js', note: 'open-source Node' },
      { name: 'Commerce Layer', note: 'composable commerce' },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics & Observabilidad',
    icon: ChartBarIcon,
    description: 'Métricas de producto, errores, logs y traces distribuidos.',
    items: [
      { name: 'Google Analytics 4', note: 'web + app' },
      { name: 'Mixpanel', note: 'product analytics' },
      { name: 'Amplitude', note: 'cohortes y funnels' },
      { name: 'Heap', note: 'auto-track' },
      { name: 'PostHog', note: 'self-hosted all-in-one' },
      { name: 'Hotjar', note: 'heatmaps + grabaciones' },
      { name: 'FullStory', note: 'session replay enterprise' },
      { name: 'Sentry', note: 'error tracking + tracing' },
      { name: 'DataDog', note: 'APM + logs + infra' },
      { name: 'New Relic', note: 'observability platform' },
      { name: 'Grafana', note: 'dashboards' },
      { name: 'Prometheus', note: 'métricas pull' },
      { name: 'Loki', note: 'logs agregados' },
      { name: 'Tempo', note: 'traces distribuidos' },
      { name: 'OpenTelemetry', note: 'estándar OTel' },
      { name: 'Better Stack', note: 'logs + uptime' },
      { name: 'Plausible / Umami', note: 'analytics privacy-friendly' },
    ],
  },
  {
    id: 'marketing',
    title: 'Marketing & SEO',
    icon: MegaphoneIcon,
    description: 'Visibilidad orgánica, automatización y growth.',
    items: [
      { name: 'Schema.org JSON-LD', note: 'structured data' },
      { name: 'OpenGraph + Twitter Cards', note: 'share previews' },
      { name: 'Sitemap.xml dinámico', note: 'cobertura completa' },
      { name: 'robots.txt', note: 'control de crawlers' },
      { name: 'Core Web Vitals', note: 'optimización LCP/INP/CLS' },
      { name: 'Lighthouse audits', note: 'auditorías repetibles' },
      { name: 'Mailchimp', note: 'email marketing clásico' },
      { name: 'Klaviyo', note: 'email + SMS e-commerce' },
      { name: 'Customer.io', note: 'mensajería automatizada' },
      { name: 'HubSpot', note: 'CRM + marketing' },
      { name: 'Iterable', note: 'cross-channel growth' },
    ],
  },
  {
    id: 'auth',
    title: 'Auth & Identidad',
    icon: LockClosedIcon,
    description: 'Login social, SSO empresarial, MFA y passkeys.',
    items: [
      { name: 'NextAuth.js / Auth.js', note: 'auth Next nativo' },
      { name: 'Clerk', note: 'auth managed dev-friendly' },
      { name: 'Auth0', note: 'IdP enterprise' },
      { name: 'Okta', note: 'IAM corporativo' },
      { name: 'AWS Cognito', note: 'auth AWS-native' },
      { name: 'Firebase Auth', note: 'auth Google' },
      { name: 'Supabase Auth', note: 'auth + RLS Postgres' },
      { name: 'Passport.js', note: 'estrategias custom' },
      { name: 'Keycloak', note: 'IdP open-source' },
      { name: 'SAML 2.0', note: 'SSO empresarial' },
      { name: 'OIDC', note: 'OpenID Connect' },
      { name: 'OAuth2', note: 'autorización delegada' },
      { name: 'MFA', note: 'TOTP, WebAuthn passkeys, SMS' },
      { name: 'SCIM', note: 'provisión automática usuarios' },
    ],
  },
  {
    id: 'maps',
    title: 'Mapas & Geolocalización',
    icon: MapIcon,
    description: 'Routing, geocoding y visualización geoespacial.',
    items: [
      { name: 'Mapbox', note: 'mapas vectoriales + estilos' },
      { name: 'Google Maps Platform', note: 'Places, Directions, Geocoding' },
      { name: 'OpenStreetMap + Leaflet', note: 'open-source' },
      { name: 'HERE Maps', note: 'routing logístico' },
      { name: 'Geoapify', note: 'geocoding asequible' },
    ],
  },
  {
    id: 'storage',
    title: 'Storage & CDN',
    icon: ArchiveBoxIcon,
    description: 'Archivos, imágenes y media a escala global.',
    items: [
      { name: 'AWS S3', note: 'object storage estándar' },
      { name: 'Cloudflare R2', note: 'S3-compatible sin egress' },
      { name: 'Google Cloud Storage', note: 'object storage GCP' },
      { name: 'Cloudinary', note: 'image/video transformations' },
      { name: 'ImageKit', note: 'imágenes on-the-fly' },
      { name: 'imgix', note: 'imagen + CDN' },
      { name: 'BunnyCDN', note: 'CDN económico' },
    ],
  },
  {
    id: 'devtools',
    title: 'DevTools & DX',
    icon: WrenchScrewdriverIcon,
    description: 'Herramientas que mantienen la calidad alta y los ciclos cortos.',
    items: [
      { name: 'ESLint', note: 'reglas de calidad' },
      { name: 'Prettier', note: 'formato consistente' },
      { name: 'Husky', note: 'git hooks' },
      { name: 'lint-staged', note: 'lint solo lo cambiado' },
      { name: 'Commitlint', note: 'conventional commits' },
      { name: 'Turborepo', note: 'monorepos rápidos' },
      { name: 'pnpm workspaces', note: 'gestión multi-paquete' },
      { name: 'yarn workspaces', note: 'monorepo alterno' },
      { name: 'Storybook', note: 'docs componentes' },
      { name: 'Chromatic', note: 'visual testing' },
      { name: 'BrowserStack', note: 'cross-browser real devices' },
    ],
  },
  {
    id: 'compliance',
    title: 'Compliance & Seguridad',
    icon: ScaleIcon,
    description: 'Marcos regulatorios para operar con seguridad y legalidad.',
    items: [
      { name: 'SOC 2', note: 'controles operacionales' },
      { name: 'ISO 27001', note: 'gestión seguridad información' },
      { name: 'GDPR', note: 'datos personales UE' },
      { name: 'HIPAA', note: 'salud EE.UU.' },
      { name: 'PCI-DSS', note: 'tarjetas de pago' },
      { name: 'Habeas Data', note: 'Colombia, Ley 1581' },
      { name: 'Ley 527', note: 'firma electrónica Colombia' },
      { name: 'eIDAS', note: 'firma electrónica UE' },
    ],
  },
];

const aiCapabilities = [
  {
    title: 'RAG enterprise',
    description: 'Hybrid retrieval (BM25 + vectorial), reranking, citaciones y workflows agentic.',
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
  { value: '27', label: 'Demos funcionales en línea' },
  { value: '170+', label: 'Tecnologías dominadas' },
  { value: '8', label: 'Países LatAm en facturación electrónica' },
];

const bigMetrics: { value: string; label: string; sub: string; gradient: string }[] = [
  {
    value: '27',
    label: 'Demos enterprise',
    sub: 'Funcionales, navegables y con backend mock',
    gradient: 'from-primary-500 to-primary-700',
  },
  {
    value: '170+',
    label: 'Tecnologías',
    sub: 'Frontend, backend, IA, cloud, data y mobile',
    gradient: 'from-secondary-500 to-secondary-800',
  },
  {
    value: '8',
    label: 'Países LatAm',
    sub: 'DIAN · SAT · AFIP · SII · SUNAT · DGI · SET · SRI',
    gradient: 'from-emerald-500 to-emerald-700',
  },
  {
    value: '2026',
    label: 'Año fundación',
    sub: 'Plataforma comercial Koptup',
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
    role: 'Founder & Tech Lead',
    bio: 'Full-stack engineer con 8+ años construyendo productos en Colombia y LatAm. Lidera arquitectura, IA aplicada y producto.',
    initials: 'RC',
    gradient: 'from-primary-500 to-primary-800',
    photo:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&q=80&auto=format',
  },
  {
    name: 'Full-stack Engineer',
    role: 'Web & APIs',
    bio: 'Next.js, Node, TypeScript end-to-end. Diseña y mantiene las 27 demos y la plataforma de servicios.',
    initials: 'FS',
    gradient: 'from-emerald-500 to-emerald-800',
  },
  {
    name: 'AI / ML Engineer',
    role: 'RAG, agentes y modelos',
    bio: 'OpenAI, RAG enterprise, agentes con tool calling, embeddings y evaluación de prompts en producción.',
    initials: 'AI',
    gradient: 'from-fuchsia-500 to-rose-700',
  },
  {
    name: 'UX / UI Designer',
    role: 'Producto y design system',
    bio: 'Wireframes en Figma, design tokens y diseño accesible para web y móvil.',
    initials: 'UX',
    gradient: 'from-amber-500 to-orange-700',
  },
  {
    name: 'DevOps Engineer',
    role: 'Cloud & CI/CD',
    bio: 'AWS, Vercel, Railway, Docker y Kubernetes. Pipelines verdes desde el día uno.',
    initials: 'DO',
    gradient: 'from-sky-500 to-blue-800',
  },
  {
    name: 'QA Engineer',
    role: 'Calidad y testing',
    bio: 'Playwright, Jest, smoke tests y revisiones de release antes de cada deploy a producción.',
    initials: 'QA',
    gradient: 'from-violet-500 to-purple-800',
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
    title: 'Primeras demos funcionales',
    description:
      'Arranca la idea de Koptup como vitrina: prototipos navegables de chatbot, e-commerce y dashboards con datos simulados.',
  },
  {
    year: '2025',
    title: 'Primer cliente real — SoSalud',
    description:
      'Implementación de VPN empresarial para SoSalud (tercero administrador de Nueva EPS). Expansión del catálogo a 18 demos enterprise.',
  },
  {
    year: '2026',
    title: 'Plataforma completa',
    description:
      '27 demos enterprise, RAG con GPT-4o, planes en COP y USD, facturación electrónica en 8 países y servicios SaaS hospedados.',
    highlight: true,
  },
  {
    year: '2027+',
    title: 'Expansión LatAm',
    description:
      'Roadmap: presencia comercial en México y Argentina, alianzas con integradores locales y nuevas verticales (fintech regulada, salud).',
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
              Construimos software a medida con IA para empresas de LatAm que quieren crecer rápido sin
              atarse a un SaaS extranjero.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="outline" className="bg-white text-primary-700 hover:bg-primary-50" asChild>
                <Link href="/demo">Ver las 27 demos</Link>
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
                Koptup nace en Colombia liderado por <strong>Ronald Cipagauta</strong>, desarrollador full-stack con
                más de 8 años construyendo productos digitales para clientes en Colombia, México, Costa Rica y otros
                países de LatAm. Somos un equipo pequeño y altamente técnico — escribimos código, no slides.
              </p>
              <p className="text-lg text-secondary-700 dark:text-secondary-300 mb-6">
                Trabajamos en dos modalidades: <strong>software a medida</strong> con código fuente entregado al
                cliente, o <strong>SaaS hospedado</strong> por nosotros listo para usar. En ambos casos garantizamos
                stack moderno, tests automáticos, CI/CD y soporte post-entrega.
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
            Probá las demos sin registrarte o agendá una llamada de 30 minutos para evaluar tu proyecto.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demo"
              className="bg-white text-primary-700 px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition shadow-xl"
            >
              Ver las 27 demos
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
