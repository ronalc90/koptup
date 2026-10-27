// Títulos y descripciones en inglés para /en (ver seo-config.ts). Las claves son las de seoConfig.
// Las cifras y precios de las descripciones salen de las mismas fuentes que la versión en español.
import { DEMO_COUNT } from './demos';
import { formatRagCOP, getRagPlan } from './rag-plans';

const RAG_PILOT = getRagPlan('piloto');
const RAG_ESSENTIAL = getRagPlan('esencial');

export const seoConfigEn: Record<string, { title: string; description: string }> = {
  cookies: {
    title: 'Cookie Policy',
    description: 'KopTup cookie policy. What cookies we use, what they are for, and how to manage or turn them off in your browser.',
  },
  'desarrollo-web-colombia': {
    title: 'Web Development and Custom Software in Colombia',
    description: 'Hire KopTup for your web app, AI chatbot, e-commerce or business system. Custom software studio in Bogotá, Colombia. Published prices and a free quote.',
  },
  'chatbots-ia': {
    title: 'RAG Chatbots for WhatsApp and Your Website',
    description: `RAG chatbots for WhatsApp and your website: they answer from your documents and cite the source. From ${formatRagCOP(RAG_ESSENTIAL.setup.cop)}, or a pilot for ${formatRagCOP(RAG_PILOT.setup.cop)}.`,
  },
  'soluciones-ia': {
    title: 'Artificial Intelligence Solutions for Businesses',
    description: 'AI solutions for businesses in Colombia: RAG systems that answer from your documents and cite the source, chatbots, automation and predictive analytics.',
  },
  rag: {
    title: 'RAG Systems for Businesses in Colombia',
    description: `RAG (retrieval augmented generation) systems for businesses in Colombia: a chatbot with your company's documents that cites the source. Pilot in ${RAG_PILOT.weeks.max} weeks.`,
  },
  'rag-salud': {
    title: 'Healthcare RAG: Protocols, Regulations, Audits',
    description: 'RAG for healthcare: AI that answers from your clinical protocols and sector regulations, cites the source and supports medical billing audits.',
  },
  'rag-legal': {
    title: 'Search Contracts with AI: RAG for Legal Teams',
    description: 'Search contracts with AI: a RAG system that answers from your contracts, internal legal opinions and regulations, and cites the clause it comes from.',
  },
  'rag-soporte': {
    title: 'AI Assistant for Internal Manuals and Support',
    description: 'AI assistant for internal manuals: your support agents look up manuals, policies and the knowledge base with AI and answer with the source cited.',
  },
  'demo-cuentas-medicas': {
    title: 'Healthcare Expert System: Audit Medical Claims',
    description: 'Expert system that audits medical claims with rules and sample rates, flagging possible denials (glosas). AI extracts invoice data. Invitation-only demo.',
  },
  home: {
    title: 'AI That Answers From Your Company\'s Documents',
    description: 'RAG systems for companies in Colombia: AI that answers from your manuals, contracts and policies, cites its source and protects your data. Try the free demo.',
  },
  services: {
    title: 'RAG Systems and Custom Software Pricing',
    description: `RAG systems: ${RAG_PILOT.weeks.max}-week pilot for ${formatRagCOP(RAG_PILOT.setup.cop)} and plans from ${formatRagCOP(RAG_ESSENTIAL.setup.cop)} (prices in COP and USD, plus IVA where applicable). And other custom solutions.`,
  },
  pricing: {
    title: 'Plans and Pricing',
    description: 'RAG system plans with prices in COP and USD, plus IVA where applicable, and other custom software solutions.',
  },
  contact: {
    title: 'Contact: Request Your Free Quote',
    description: 'Contact KopTup for a no-obligation software development quote. We reply within 24 hours. WhatsApp, email and phone calls available. Bogotá, Colombia.',
  },
  'solicitar-demo': {
    title: 'Request a Guided Demo',
    description: 'Pick the KopTup demos you\'re interested in and tell us about your case. We review your request and, if approved, send you a link to access your demos.',
  },
  about: {
    title: 'About Us: Custom Software Studio in Bogotá',
    description: `KopTup is a custom software studio in Bogotá: RAG systems and software for businesses. Try ${DEMO_COUNT} demos and review our published plans and prices.`,
  },
  demo: {
    title: 'Interactive Prototypes: Try Before You Buy',
    description: `Explore ${DEMO_COUNT} interactive demos. Some use real AI, like the RAG chatbot; most use sample data, as each one notes. Open ones need no sign-up; the rest on request.`,
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'KopTup privacy policy: what data we collect, why, who we share it with, how long we keep it, and your rights under Colombian Law 1581 of 2012.',
  },
  terms: {
    title: 'Terms and Conditions',
    description: 'Terms and conditions for using KopTup\'s services: engagement terms, responsibilities, payments and warranties for custom software development.',
  },
  'demo-chatbot': {
    title: 'RAG Demo: Try It With Your Own Document',
    description: 'Upload a PDF, DOCX or TXT and ask a RAG chatbot about it. It cites the page or passage each answer comes from. Or try a sample document, no sign-up.',
  },
  'demo-linkedin-ads': {
    title: 'AI Content Generator for LinkedIn',
    description: 'We use AI for our LinkedIn content: a 30-day calendar, posts, ad copy, carousels and demo screenshots. It does not publish: you copy the text and post it.',
  },
  'demo-gestor-contenido': {
    title: 'AI Medical Content Manager',
    description: 'Generates medical content with AI: emails, announcements, medical reports and admin documents. IPS and hospital templates. Export to PDF. Try it free.',
  },
  'demo-gestor-documentos': {
    title: 'AI Document Manager: Summarize and Search',
    description: 'Upload PDF, DOCX, TXT or CSV: AI summarizes and tags each document. Search by meaning and ask it to explain them. Advanced features show fixed examples.',
  },
  'demo-ecommerce': {
    title: 'E-commerce Platform: Professional Online Store',
    description: 'Complete e-commerce solution: shopping cart, payment gateways, inventory and admin panel. Colombian payment methods integrated. Responsive. Working demo.',
  },
  'demo-dashboard-ejecutivo': {
    title: 'Executive Dashboard: KPIs, Finance, Receivables',
    description: 'Executive dashboard demo with sample data: sales vs. target, finance, receivables, cash flow, reports. Shows the kind of dashboard we connect to your data.',
  },
  'demo-control-proyectos': {
    title: 'Project Management and Control Software',
    description: 'Project management: planning, task assignment, progress tracking and reports, resources and schedules. Agile methods, team collaboration. Working demo.',
  },
  'demo-sistema-reservas': {
    title: 'Online Booking and Appointment Scheduling',
    description: 'Online booking platform: smart calendar, appointments, automatic confirmations, email/SMS reminders, Google Calendar sync. For clinics, spas, restaurants.',
  },
  'demo-sistema-experto': {
    title: 'AI Expert System for Decision-Making',
    description: 'AI expert system for complex decisions: inference engine, knowledge base, business rules, data-driven recommendations and explainability. Interactive demo.',
  },
  'demo-automatizacion': {
    title: 'Workflow and Process Automation',
    description: 'Interactive mockup of an AI workflow editor: nodes, run history, templates and SDK, with sample data. See how a process at your company could be automated.',
  },
  'demo-code-review-ia': {
    title: 'AI Code Review for Pull Requests',
    description: 'AI review of Pull Requests detecting bugs, security vulnerabilities and quality issues before merge. Inline suggestions and code metrics. Interactive demo.',
  },
  'demo-crm-ia': {
    title: 'AI CRM: Customers and Sales Pipeline',
    description: 'AI CRM for customers, contacts and sales pipeline. Lead scoring, sales automation and deal tracking. Ranks deals by likelihood to close. Interactive demo.',
  },
  'demo-delivery': {
    title: 'Delivery App: Orders and Couriers',
    description: 'Demo of a delivery platform with sample data: orders, courier assignment and simulated tracking. Shows the kind of app we build for restaurants and stores.',
  },
  'demo-erp': {
    title: 'ERP: Finance, Inventory and DIAN Invoicing',
    description: 'Demo of a modular ERP with sample data: finance, inventory, accounting and invoicing. Shows the kind of system we build to integrate your company\'s areas.',
  },
  'demo-facturacion-electronica': {
    title: 'DIAN Electronic Invoicing and Payroll',
    description: 'E-invoicing for Colombia, DIAN-certified. Issues invoices, credit notes and e-payroll, with automatic validation and secure archiving. Interactive demo.',
  },
  'demo-firma-electronica': {
    title: 'Electronic Document Signing: Interactive Demo',
    description: 'Interactive e-signature mockup: build an envelope with documents, signers and fields, and view the audit trail. Sample data: it won\'t sign or send emails.',
  },
  'demo-helpdesk-ia': {
    title: 'AI Helpdesk: Omnichannel Ticketing',
    description: 'AI help desk: ticket management, AI classification and knowledge base. Omnichannel support via email, chat and WhatsApp. Resolves faster. Interactive demo.',
  },
  'demo-hrms': {
    title: 'HRMS: Talent, Payroll and Performance',
    description: 'HRMS for talent: employees, payroll, vacations and performance reviews. Centralizes staff data, automates HR tasks, offers self-service. Interactive demo.',
  },
  'demo-lms': {
    title: 'LMS: E-learning Platform with Certificates',
    description: 'E-learning LMS to create and manage online courses, with enrollments, assessments, progress tracking and certificates. Interactive demo.',
  },
  'demo-loyalty': {
    title: 'Loyalty Program: Points and Rewards',
    description: 'Loyalty program to reward and retain customers with points, rewards and smart segmentation. Grows repeat purchases and lifetime value. Interactive demo.',
  },
  'demo-moderacion-contenido': {
    title: 'AI Content Moderation: Trust & Safety',
    description: 'Sample console for a trust & safety team: priority queue of reported content, score-based rules, appeals and audit. Sample data in the browser, no AI model.',
  },
  'demo-pos': {
    title: 'Multi-branch POS with DIAN Invoicing',
    description: 'Point-of-sale demo with sample data: sales, multiple locations, inventory and cash close-out. Shows the POS we build for stores and restaurants.',
  },
  'demo-saas-boilerplate': {
    title: 'Multi-tenant SaaS Boilerplate Showcase',
    description: 'Technical showcase of a multi-tenant B2B SaaS base: per-customer data isolation, auth, plans, billing, audit and feature flags. Sample data; no charges or storage.',
  },
  'demo-scraping': {
    title: 'Web Scraping and Data Extraction at Scale',
    description: 'Web scraping platform at scale: collects structured website data with proxy rotation and automatic processing. Clean, ready-to-use data. Interactive demo.',
  },
  'demo-telemedicina': {
    title: 'Telemedicine with Video Consults and EHR',
    description: 'Telemedicine platform: video consults, digital health records and scheduling. Secure remote care, prescriptions and patient follow-up. Interactive demo.',
  },
  'demo-voice-ai': {
    title: 'Voice AI: AI Voice Agents for Call Centers',
    description: 'AI voice agent demo for call centers: sample calls with voice menu, transcription and transfer to a live agent. Shows what we build for your phone system.',
  },
  'demo-wms-logistica': {
    title: 'WMS: Warehouse Logistics, Picking and Inventory',
    description: 'WMS demo with sample data: receiving, bin locations, picking, inventory and dispatch. Shows the type of system we build for your warehouse.',
  },
};
