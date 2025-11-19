'use client';

import { useState } from 'react';
import {
  DocumentTextIcon,
  FolderIcon,
  StarIcon,
  ClockIcon,
  TrashIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  DocumentIcon,
  SparklesIcon,
  TagIcon,
  CalendarIcon,
  ArrowsRightLeftIcon,
  AdjustmentsHorizontalIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid,
} from '@heroicons/react/24/solid';

interface Document {
  id: number;
  name: string;
  type: string;
  size: string;
  date: string;
  thumbnail: string;
  favorite: boolean;
  deleted: boolean;
  folder: string;
  tags: string[];
  summary?: string;
  keywords?: string[];
  entities?: string[];
  url?: string;
}

type ViewType = 'all' | 'favorites' | 'recent' | 'trash' | 'settings' | 'folder';

export default function GestorDocumentos() {
  const [activeView, setActiveView] = useState<ViewType>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [documents, setDocuments] = useState<Document[]>([
    // Favoritos (3) - Documentos reales de internet
    { id: 1, name: 'ISO_27001_Information_Security.pdf', type: 'PDF', size: '2.4 MB', date: '2024-01-15', thumbnail: '🔒', favorite: true, deleted: false, folder: 'Legal', tags: ['Seguridad', 'ISO'], summary: 'Estándar internacional para sistemas de gestión de seguridad de la información', keywords: ['ISO', 'seguridad', 'información'], entities: ['ISO 27001', 'SGSI'], url: 'https://www.iso.org/standard/27001' },
    { id: 2, name: 'GDPR_Compliance_Guide.pdf', type: 'PDF', size: '1.8 MB', date: '2024-01-22', thumbnail: '⚖️', favorite: true, deleted: false, folder: 'Legal', tags: ['GDPR', 'Legal'], summary: 'Guía completa de cumplimiento del Reglamento General de Protección de Datos', keywords: ['GDPR', 'privacidad', 'datos'], entities: ['UE', 'Datos Personales'], url: 'https://gdpr.eu/wp-content/uploads/2019/01/Our-GDPR-framework.pdf' },
    { id: 3, name: 'Financial_Report_Template.pdf', type: 'PDF', size: '856 KB', date: '2024-01-20', thumbnail: '📊', favorite: true, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'Reportes'], summary: 'Plantilla profesional para reportes financieros corporativos', keywords: ['finanzas', 'reportes'], entities: ['Balance', 'Estado Financiero'], url: 'https://www.worldbank.org/content/dam/doingbusiness/media/Annual-Reports/English/DB2020-report_web-version.pdf' },

    // Recientes (8 totales incluyendo favoritos = 5 más) - Documentos reales
    { id: 4, name: 'Marketing_Strategy_Guide.pdf', type: 'PDF', size: '1.2 MB', date: '2024-01-28', thumbnail: '📈', favorite: false, deleted: false, folder: 'Marketing', tags: ['Marketing', 'Estrategia'], summary: 'Guía completa de estrategias de marketing digital modernas', keywords: ['marketing', 'digital', 'estrategia'], entities: ['SEO', 'Redes Sociales'], url: 'https://business.adobe.com/resources/reports/digital-trends.html' },
    { id: 5, name: 'Employee_Handbook_Template.pdf', type: 'PDF', size: '5.6 MB', date: '2024-01-27', thumbnail: '👥', favorite: false, deleted: false, folder: 'RRHH', tags: ['RRHH', 'Manual'], summary: 'Manual completo para empleados con políticas y procedimientos', keywords: ['empleados', 'políticas', 'procedimientos'], entities: ['Recursos Humanos', 'Políticas'], url: 'https://www.shrm.org/resourcesandtools/tools-and-samples/how-to-guides/pages/howtocreateanemployeehandbook.aspx' },
    { id: 6, name: 'Project_Management_Best_Practices.pdf', type: 'PDF', size: '890 KB', date: '2024-01-26', thumbnail: '🎯', favorite: false, deleted: false, folder: 'Marketing', tags: ['Proyectos', 'Gestión'], summary: 'Mejores prácticas de gestión de proyectos según PMI', keywords: ['proyectos', 'gestión', 'PMI'], entities: ['PMBOK', 'Metodologías'], url: 'https://www.pmi.org/-/media/pmi/documents/public/pdf/learning/thought-leadership/pulse/pulse-of-the-profession-2020.pdf' },
    { id: 7, name: 'Cybersecurity_Framework.pdf', type: 'PDF', size: '2.1 MB', date: '2024-01-25', thumbnail: '🔐', favorite: false, deleted: false, folder: 'Legal', tags: ['Seguridad', 'IT'], summary: 'Framework de ciberseguridad del NIST para protección empresarial', keywords: ['ciberseguridad', 'NIST', 'protección'], entities: ['Framework', 'Controles'], url: 'https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.04162018.pdf' },
    { id: 8, name: 'Annual_Budget_Template.pdf', type: 'PDF', size: '1.4 MB', date: '2024-01-24', thumbnail: '💰', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'Presupuesto'], summary: 'Plantilla profesional para presupuestos anuales corporativos', keywords: ['presupuesto', 'finanzas', 'planificación'], entities: ['Ingresos', 'Gastos'], url: 'https://www.score.org/resource/business-budget-template' },

    // Papelera (3)
    { id: 9, name: 'Borrador_Antiguo_2023.docx', type: 'Word', size: '245 KB', date: '2023-12-15', thumbnail: '📝', favorite: false, deleted: true, folder: 'Marketing', tags: ['Borradores'], summary: 'Borrador obsoleto 2023', keywords: ['borrador'], entities: [] },
    { id: 10, name: 'Datos_Prueba_Test.xlsx', type: 'Excel', size: '128 KB', date: '2023-12-10', thumbnail: '🧪', favorite: false, deleted: true, folder: 'Finanzas', tags: ['Test'], summary: 'Datos de prueba', keywords: ['test'], entities: [] },
    { id: 11, name: 'Documento_Duplicado.pdf', type: 'PDF', size: '567 KB', date: '2023-12-05', thumbnail: '📄', favorite: false, deleted: true, folder: 'Legal', tags: ['Duplicados'], summary: 'Documento duplicado', keywords: ['duplicado'], entities: [] },

    // Más documentos - Finanzas (documentos reales)
    { id: 12, name: 'GAAP_Accounting_Principles.pdf', type: 'PDF', size: '1.8 MB', date: '2024-01-10', thumbnail: '📊', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'Contabilidad'], summary: 'Principios de contabilidad generalmente aceptados (GAAP)', keywords: ['GAAP', 'contabilidad'], entities: ['Principios Contables'], url: 'https://www.fasb.org/standards' },
    { id: 13, name: 'Cash_Flow_Analysis_Guide.pdf', type: 'PDF', size: '1.1 MB', date: '2024-01-09', thumbnail: '💵', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'Análisis'], summary: 'Guía completa de análisis de flujo de caja', keywords: ['flujo', 'caja', 'análisis'], entities: ['Cash Flow'], url: 'https://www.investopedia.com/terms/c/cashflow.asp' },
    { id: 14, name: 'Internal_Audit_Standards.pdf', type: 'PDF', size: '3.2 MB', date: '2024-01-08', thumbnail: '🔍', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'Auditoría'], summary: 'Estándares internacionales de auditoría interna', keywords: ['auditoría', 'estándares'], entities: ['IIA', 'IPPF'], url: 'https://www.theiia.org/en/standards/what-are-the-standards/' },
    { id: 15, name: 'Cost_Accounting_Methods.pdf', type: 'PDF', size: '980 KB', date: '2024-01-07', thumbnail: '📉', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'Costos'], summary: 'Métodos modernos de contabilidad de costos', keywords: ['costos', 'contabilidad'], entities: ['ABC', 'Variable Costing'], url: 'https://www.accountingtools.com/articles/cost-accounting.html' },
    { id: 16, name: 'Financial_Forecasting_Models.pdf', type: 'PDF', size: '4.5 MB', date: '2024-01-06', thumbnail: '📈', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'Proyecciones'], summary: 'Modelos de proyección financiera empresarial', keywords: ['proyecciones', 'modelos'], entities: ['Forecasting'], url: 'https://corporatefinanceinstitute.com/resources/knowledge/modeling/financial-forecast/' },
    { id: 17, name: 'Revenue_Recognition_Standards.pdf', type: 'PDF', size: '1.3 MB', date: '2024-01-05', thumbnail: '💰', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'Ingresos'], summary: 'Estándares de reconocimiento de ingresos (ASC 606)', keywords: ['ingresos', 'reconocimiento'], entities: ['ASC 606', 'IFRS 15'], url: 'https://www.pwc.com/us/en/cfodirect/publications/accounting-guides/pwc-revenue-recognition-guide.html' },
    { id: 18, name: 'Expense_Management_Best_Practices.pdf', type: 'PDF', size: '890 KB', date: '2024-01-04', thumbnail: '📋', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'Gastos'], summary: 'Mejores prácticas en gestión de gastos corporativos', keywords: ['gastos', 'gestión'], entities: ['Control de Gastos'], url: 'https://www.gartner.com/en/finance/trends/expense-management' },
    { id: 19, name: 'Accounts_Receivable_Management.pdf', type: 'PDF', size: '1.5 MB', date: '2024-01-03', thumbnail: '🧾', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'Cuentas'], summary: 'Gestión efectiva de cuentas por cobrar', keywords: ['cuentas', 'cobrar'], entities: ['A/R', 'DSO'], url: 'https://www.oracle.com/financial-services/receivables-management/' },
    { id: 20, name: 'Accounts_Payable_Automation.pdf', type: 'PDF', size: '1.4 MB', date: '2024-01-02', thumbnail: '💳', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'AP'], summary: 'Automatización de cuentas por pagar', keywords: ['pagar', 'automatización'], entities: ['A/P', 'Automation'], url: 'https://www.sap.com/products/financial-management/accounts-payable.html' },
    { id: 21, name: 'Profitability_Analysis_Framework.pdf', type: 'PDF', size: '2.1 MB', date: '2023-12-28', thumbnail: '📊', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'Rentabilidad'], summary: 'Framework para análisis de rentabilidad empresarial', keywords: ['rentabilidad', 'análisis'], entities: ['Profitability'], url: 'https://www.mckinsey.com/capabilities/strategy-and-corporate-finance/our-insights' },
    { id: 22, name: 'ROI_Calculation_Methods.pdf', type: 'PDF', size: '1.2 MB', date: '2023-12-27', thumbnail: '📈', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'ROI'], summary: 'Métodos de cálculo de retorno de inversión', keywords: ['ROI', 'inversión'], entities: ['Return on Investment'], url: 'https://hbr.org/2014/03/a-refresher-on-return-on-investment' },
    { id: 23, name: 'Financial_Statements_Guide.pdf', type: 'PDF', size: '3.8 MB', date: '2023-12-26', thumbnail: '📄', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'Estados'], summary: 'Guía completa de estados financieros', keywords: ['estados', 'financieros'], entities: ['Balance Sheet', 'Income Statement'], url: 'https://www.investopedia.com/terms/f/financial-statements.asp' },
    { id: 24, name: 'KPI_Financial_Metrics.pdf', type: 'PDF', size: '1.1 MB', date: '2023-12-25', thumbnail: '📊', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'KPIs'], summary: 'Indicadores clave de desempeño financiero', keywords: ['indicadores', 'KPIs'], entities: ['Financial KPIs'], url: 'https://www.klipfolio.com/resources/kpi-examples/finance' },
    { id: 25, name: 'Budgeting_Process_Guide.pdf', type: 'PDF', size: '2.3 MB', date: '2023-12-24', thumbnail: '💰', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'Presupuesto'], summary: 'Guía del proceso de presupuestación empresarial', keywords: ['presupuesto', 'planificación'], entities: ['Budget Planning'], url: 'https://www.cfo.com/budgeting/2021/01/best-practices-in-budgeting/' },
    { id: 26, name: 'Treasury_Management_Strategies.pdf', type: 'PDF', size: '1.7 MB', date: '2023-12-23', thumbnail: '🏦', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'Tesorería'], summary: 'Estrategias modernas de gestión de tesorería', keywords: ['tesorería', 'gestión'], entities: ['Cash Management'], url: 'https://www.jpmorgan.com/solutions/treasury-payments' },
    { id: 27, name: 'Cost_Benefit_Analysis_Framework.pdf', type: 'PDF', size: '1.4 MB', date: '2023-12-22', thumbnail: '⚖️', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'Análisis'], summary: 'Framework de análisis costo-beneficio', keywords: ['análisis', 'costos'], entities: ['CBA'], url: 'https://www.cdc.gov/policy/polaris/economics/cost-benefit/index.html' },
    { id: 28, name: 'Bank_Reconciliation_Process.pdf', type: 'PDF', size: '890 KB', date: '2023-12-21', thumbnail: '🏧', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'Conciliación'], summary: 'Proceso de conciliación bancaria efectiva', keywords: ['conciliación', 'bancaria'], entities: ['Bank Rec'], url: 'https://quickbooks.intuit.com/r/bookkeeping/bank-reconciliation/' },
    { id: 29, name: 'Financial_Ratios_Analysis.pdf', type: 'PDF', size: '980 KB', date: '2023-12-20', thumbnail: '📐', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'Ratios'], summary: 'Análisis de ratios financieros clave', keywords: ['ratios', 'análisis'], entities: ['Financial Ratios'], url: 'https://corporatefinanceinstitute.com/resources/knowledge/finance/financial-ratios/' },
    { id: 30, name: 'Break_Even_Analysis.pdf', type: 'PDF', size: '1.2 MB', date: '2023-12-19', thumbnail: '🎯', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'Análisis'], summary: 'Análisis de punto de equilibrio empresarial', keywords: ['equilibrio', 'break-even'], entities: ['Break Even Point'], url: 'https://www.investopedia.com/terms/b/breakevenanalysis.asp' },
    { id: 31, name: 'Contribution_Margin_Analysis.pdf', type: 'PDF', size: '1.1 MB', date: '2023-12-18', thumbnail: '📊', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'Margen'], summary: 'Análisis de margen de contribución', keywords: ['margen', 'contribución'], entities: ['Contribution Margin'], url: 'https://www.accountingtools.com/articles/contribution-margin.html' },
    { id: 32, name: 'Working_Capital_Management.pdf', type: 'PDF', size: '1.5 MB', date: '2023-12-17', thumbnail: '💼', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'Capital'], summary: 'Gestión efectiva del capital de trabajo', keywords: ['capital', 'trabajo'], entities: ['Working Capital'], url: 'https://www.investopedia.com/terms/w/workingcapital.asp' },

    // Legal (documentos reales)
    { id: 33, name: 'NDA_Agreement_Template.pdf', type: 'PDF', size: '670 KB', date: '2024-01-12', thumbnail: '🔐', favorite: false, deleted: false, folder: 'Legal', tags: ['Legal', 'NDA'], summary: 'Plantilla estándar de acuerdo de confidencialidad', keywords: ['confidencialidad', 'NDA'], entities: ['Non-Disclosure'], url: 'https://www.rocketlawyer.com/form/non-disclosure-agreement.rl' },
    { id: 34, name: 'Software_License_Agreements.pdf', type: 'PDF', size: '540 KB', date: '2024-01-11', thumbnail: '⚖️', favorite: false, deleted: false, folder: 'Legal', tags: ['Legal', 'Software'], summary: 'Guía de acuerdos de licencia de software', keywords: ['licencias', 'software'], entities: ['MIT', 'GPL'], url: 'https://opensource.org/licenses' },
    { id: 35, name: 'Intellectual_Property_Guide.pdf', type: 'PDF', size: '1.9 MB', date: '2024-01-10', thumbnail: '©️', favorite: false, deleted: false, folder: 'Legal', tags: ['Legal', 'IP'], summary: 'Guía completa de propiedad intelectual', keywords: ['propiedad', 'intelectual'], entities: ['Patents', 'Trademarks'], url: 'https://www.wipo.int/publications/en/details.jsp?id=4080' },
    { id: 36, name: 'Vendor_Contract_Template.pdf', type: 'PDF', size: '2.3 MB', date: '2024-01-09', thumbnail: '📝', favorite: false, deleted: false, folder: 'Legal', tags: ['Legal', 'Contratos'], summary: 'Plantilla de contrato con proveedores', keywords: ['contratos', 'proveedores'], entities: ['Vendor Agreement'], url: 'https://www.pandadoc.com/vendor-agreement-template/' },
    { id: 37, name: 'Compliance_Framework_Guide.pdf', type: 'PDF', size: '3.1 MB', date: '2024-01-08', thumbnail: '📋', favorite: false, deleted: false, folder: 'Legal', tags: ['Legal', 'Compliance'], summary: 'Framework de cumplimiento normativo empresarial', keywords: ['normativas', 'cumplimiento'], entities: ['SOX', 'Compliance'], url: 'https://www.sec.gov/spotlight/sarbanes-oxley.htm' },
    { id: 38, name: 'Power_of_Attorney_Forms.pdf', type: 'PDF', size: '420 KB', date: '2024-01-07', thumbnail: '📜', favorite: false, deleted: false, folder: 'Legal', tags: ['Legal', 'POA'], summary: 'Formularios de poder legal', keywords: ['poderes', 'legal'], entities: ['Power of Attorney'], url: 'https://www.legalzoom.com/articles/power-of-attorney-form' },
    { id: 39, name: 'Business_Registration_Guide.pdf', type: 'PDF', size: '1.1 MB', date: '2024-01-06', thumbnail: '🏛️', favorite: false, deleted: false, folder: 'Legal', tags: ['Legal', 'Registro'], summary: 'Guía de registro mercantil empresarial', keywords: ['registro', 'empresa'], entities: ['Business Entity'], url: 'https://www.sba.gov/business-guide/launch-your-business/register-your-business' },
    { id: 40, name: 'Terms_and_Conditions_Template.pdf', type: 'PDF', size: '890 KB', date: '2024-01-05', thumbnail: '📄', favorite: false, deleted: false, folder: 'Legal', tags: ['Legal', 'T&C'], summary: 'Plantilla de términos y condiciones', keywords: ['términos', 'condiciones'], entities: ['Terms of Service'], url: 'https://www.termsfeed.com/blog/sample-terms-and-conditions-template/' },
    { id: 41, name: 'Employment_Contract_Guide.pdf', type: 'PDF', size: '2.1 MB', date: '2024-01-04', thumbnail: '👔', favorite: false, deleted: false, folder: 'Legal', tags: ['Legal', 'Empleo'], summary: 'Guía de contratos laborales', keywords: ['trabajo', 'contratos'], entities: ['Employment'], url: 'https://www.dol.gov/general/topic/labor-relations/employment-contracts' },
    { id: 42, name: 'Corporate_Governance_Best_Practices.pdf', type: 'PDF', size: '780 KB', date: '2024-01-03', thumbnail: '📝', favorite: false, deleted: false, folder: 'Legal', tags: ['Legal', 'Gobernanza'], summary: 'Mejores prácticas de gobernanza corporativa', keywords: ['actas', 'gobernanza'], entities: ['Board', 'Governance'], url: 'https://www.oecd.org/corporate/principles-corporate-governance/' },

    // Marketing (documentos reales)
    { id: 43, name: 'Social_Media_Marketing_Guide.pdf', type: 'PDF', size: '6.2 MB', date: '2024-01-13', thumbnail: '📱', favorite: false, deleted: false, folder: 'Marketing', tags: ['Marketing', 'Social'], summary: 'Guía completa de marketing en redes sociales', keywords: ['redes', 'social'], entities: ['Facebook', 'Instagram'], url: 'https://www.hootsuite.com/resources/social-media-marketing' },
    { id: 44, name: 'Content_Marketing_Strategy.pdf', type: 'PDF', size: '1.3 MB', date: '2024-01-12', thumbnail: '📝', favorite: false, deleted: false, folder: 'Marketing', tags: ['Marketing', 'Contenido'], summary: 'Estrategia de marketing de contenidos', keywords: ['contenidos', 'estrategia'], entities: ['Content Strategy'], url: 'https://contentmarketinginstitute.com/what-is-content-marketing/' },
    { id: 45, name: 'Competitive_Analysis_Framework.pdf', type: 'PDF', size: '2.8 MB', date: '2024-01-11', thumbnail: '🔍', favorite: false, deleted: false, folder: 'Marketing', tags: ['Marketing', 'Análisis'], summary: 'Framework de análisis competitivo', keywords: ['competencia', 'análisis'], entities: ['Porter Five Forces'], url: 'https://www.porter.com/about-michael-porter/business-frameworks' },
    { id: 46, name: 'Email_Marketing_Best_Practices.pdf', type: 'PDF', size: '980 KB', date: '2024-01-10', thumbnail: '📧', favorite: false, deleted: false, folder: 'Marketing', tags: ['Marketing', 'Email'], summary: 'Mejores prácticas de email marketing', keywords: ['email', 'marketing'], entities: ['Campaign Monitor'], url: 'https://www.mailchimp.com/marketing-glossary/email-marketing/' },
    { id: 47, name: 'Brand_Identity_Guidelines.pdf', type: 'PDF', size: '8.7 MB', date: '2024-01-04', thumbnail: '🎯', favorite: false, deleted: false, folder: 'Marketing', tags: ['Marketing', 'Marca'], summary: 'Guía de identidad de marca', keywords: ['marca', 'identidad'], entities: ['Brand Guidelines'], url: 'https://99designs.com/blog/tips/how-to-create-a-brand-style-guide/' },
    { id: 48, name: 'SEO_Optimization_Guide.pdf', type: 'PDF', size: '1.9 MB', date: '2024-01-02', thumbnail: '🔍', favorite: false, deleted: false, folder: 'Marketing', tags: ['Marketing', 'SEO'], summary: 'Guía de optimización SEO', keywords: ['SEO', 'optimización'], entities: ['Google', 'Search Engine'], url: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide' },
    { id: 49, name: 'Buyer_Persona_Template.pdf', type: 'PDF', size: '2.1 MB', date: '2024-01-07', thumbnail: '👥', favorite: false, deleted: false, folder: 'Marketing', tags: ['Marketing', 'Personas'], summary: 'Plantilla de buyer personas', keywords: ['personas', 'clientes'], entities: ['Target Audience'], url: 'https://blog.hubspot.com/marketing/buyer-persona-research' },
    { id: 50, name: 'Customer_Journey_Mapping.pdf', type: 'PDF', size: '5.3 MB', date: '2024-01-06', thumbnail: '🗺️', favorite: false, deleted: false, folder: 'Marketing', tags: ['Marketing', 'Journey'], summary: 'Mapeo del viaje del cliente', keywords: ['journey', 'cliente'], entities: ['Customer Experience'], url: 'https://www.nngroup.com/articles/customer-journey-mapping/' },

    // RRHH (documentos reales)
    { id: 59, name: 'Performance_Review_Template.pdf', type: 'PDF', size: '1.8 MB', date: '2024-01-12', thumbnail: '📈', favorite: false, deleted: false, folder: 'RRHH', tags: ['RRHH', 'Evaluación'], summary: 'Plantilla de evaluación de desempeño', keywords: ['evaluación', 'desempeño'], entities: ['Performance Management'], url: 'https://www.indeed.com/hire/c/info/performance-review-template' },
    { id: 60, name: 'Training_Development_Plan.pdf', type: 'PDF', size: '2.4 MB', date: '2024-01-11', thumbnail: '🎓', favorite: false, deleted: false, folder: 'RRHH', tags: ['RRHH', 'Capacitación'], summary: 'Plan de capacitación y desarrollo', keywords: ['capacitación', 'desarrollo'], entities: ['Learning & Development'], url: 'https://www.shrm.org/topics-tools/tools/toolkits/developing-training-program' },
    { id: 61, name: 'Benefits_Administration_Guide.pdf', type: 'PDF', size: '780 KB', date: '2024-01-10', thumbnail: '🎁', favorite: false, deleted: false, folder: 'RRHH', tags: ['RRHH', 'Beneficios'], summary: 'Guía de administración de beneficios', keywords: ['beneficios', 'administración'], entities: ['Employee Benefits'], url: 'https://www.dol.gov/general/topic/health-plans/employeebenefits' },
    { id: 62, name: 'Job_Description_Templates.pdf', type: 'PDF', size: '1.9 MB', date: '2024-01-08', thumbnail: '💼', favorite: false, deleted: false, folder: 'RRHH', tags: ['RRHH', 'Puestos'], summary: 'Plantillas de descripción de puestos', keywords: ['puestos', 'descripción'], entities: ['Job Descriptions'], url: 'https://www.betterteam.com/job-description-template' },
    { id: 63, name: 'Recruitment_Process_Guide.pdf', type: 'PDF', size: '670 KB', date: '2024-01-07', thumbnail: '🎯', favorite: false, deleted: false, folder: 'RRHH', tags: ['RRHH', 'Reclutamiento'], summary: 'Guía del proceso de reclutamiento', keywords: ['selección', 'reclutamiento'], entities: ['Hiring Process'], url: 'https://www.shrm.org/topics-tools/tools/toolkits/managing-recruitment-process' },
    { id: 64, name: 'Workplace_Safety_Standards.pdf', type: 'PDF', size: '1.1 MB', date: '2024-01-01', thumbnail: '🏥', favorite: false, deleted: false, folder: 'RRHH', tags: ['RRHH', 'Seguridad'], summary: 'Estándares de seguridad y salud laboral', keywords: ['seguridad', 'salud'], entities: ['OSHA', 'Workplace Safety'], url: 'https://www.osha.gov/safety-management' },
  ]);

  const folders = [
    { name: 'Finanzas', icon: '💰', count: 24 },
    { name: 'Legal', icon: '⚖️', count: 12 },
    { name: 'Marketing', icon: '📢', count: 18 },
    { name: 'RRHH', icon: '👥', count: 15 },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      // Simular progreso de carga
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev === null) return 0;
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setUploadProgress(null), 500);
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      // Determinar tipo de archivo
      const extension = file.name.split('.').pop()?.toLowerCase();
      let fileType = 'PDF';
      let thumbnail = '📄';

      if (extension === 'pdf') {
        fileType = 'PDF';
        thumbnail = '📄';
      } else if (extension === 'docx' || extension === 'doc') {
        fileType = 'Word';
        thumbnail = '📝';
      } else if (extension === 'xlsx' || extension === 'xls') {
        fileType = 'Excel';
        thumbnail = '📊';
      } else if (extension === 'pptx' || extension === 'ppt') {
        fileType = 'PowerPoint';
        thumbnail = '📊';
      }

      // Crear nuevo documento
      const newDoc: Document = {
        id: documents.length + 1,
        name: file.name,
        type: fileType,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        date: new Date().toISOString().split('T')[0],
        thumbnail: thumbnail,
        favorite: false,
        deleted: false,
        folder: activeView === 'folder' && selectedFolder ? selectedFolder : 'General',
        tags: ['Nuevo', 'Subido'],
        summary: `Documento subido: ${file.name}`,
        keywords: ['nuevo', 'subido'],
        entities: [],
        url: URL.createObjectURL(file) // Crear URL local para previsualización
      };

      setTimeout(() => {
        setDocuments([newDoc, ...documents]);
      }, 1000);
    });
  };

  const toggleFavorite = (id: number) => {
    setDocuments(documents.map(doc =>
      doc.id === id ? { ...doc, favorite: !doc.favorite } : doc
    ));
  };

  const restoreDocument = (id: number) => {
    setDocuments(documents.map(doc =>
      doc.id === id ? { ...doc, deleted: false } : doc
    ));
  };

  const toggleCompareSelection = (id: number) => {
    if (selectedDocs.includes(id)) {
      setSelectedDocs(selectedDocs.filter(docId => docId !== id));
    } else if (selectedDocs.length < 2) {
      setSelectedDocs([...selectedDocs, id]);
    }
  };

  const getFilteredDocuments = () => {
    let filtered = documents;

    if (activeView === 'favorites') {
      filtered = filtered.filter(doc => doc.favorite && !doc.deleted);
    } else if (activeView === 'recent') {
      filtered = filtered.filter(doc => !doc.deleted).slice(0, 8);
    } else if (activeView === 'trash') {
      filtered = filtered.filter(doc => doc.deleted);
    } else if (activeView === 'folder' && selectedFolder) {
      filtered = filtered.filter(doc => doc.folder === selectedFolder && !doc.deleted);
    } else if (activeView === 'all') {
      filtered = filtered.filter(doc => !doc.deleted);
    }

    if (searchQuery) {
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filtered;
  };

  const sidebarItems = [
    { id: 'all', name: 'Todos los Documentos', icon: DocumentTextIcon, count: documents.filter(d => !d.deleted).length },
    { id: 'favorites', name: 'Favoritos', icon: StarIcon, count: 3 },
    { id: 'recent', name: 'Recientes', icon: ClockIcon, count: 8 },
    { id: 'trash', name: 'Papelera', icon: TrashIcon, count: 3 },
    { id: 'settings', name: 'Configuración', icon: Cog6ToothIcon, count: null },
  ];

  const renderSettingsView = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
          Configuración del Sistema
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Sincronización Automática</h4>
              <p className="text-sm text-slate-500">Sincronizar documentos con la nube</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
              <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Búsqueda Semántica</h4>
              <p className="text-sm text-slate-500">Habilitar búsqueda inteligente con IA</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
              <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Resumen Automático</h4>
              <p className="text-sm text-slate-500">Generar resúmenes de documentos nuevos</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
              <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Notificaciones</h4>
              <p className="text-sm text-slate-500">Recibir alertas de documentos compartidos</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-300">
              <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
          Almacenamiento
        </h3>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Espacio Utilizado</span>
            <span className="text-sm font-semibold">34.5 GB de 100 GB</span>
          </div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: '34.5%' }}></div>
          </div>
        </div>
        <p className="text-sm text-slate-500 mt-4">
          Tienes 65.5 GB disponibles. {' '}
          <button className="text-blue-600 hover:underline">Ampliar almacenamiento</button>
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg">
          Guardar Cambios
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl">DocuIA</span>
            </div>

            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileInput}
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            />
            <button
              onClick={() => document.getElementById('file-upload')?.click()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg px-4 py-3 font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <CloudArrowUpIcon className="w-5 h-5" />
              Subir Archivo
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id as ViewType);
                    setSelectedFolder('');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    activeView === item.id
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  {item.count !== null && (
                    <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 px-3">
                Carpetas
              </h3>
              {folders.map((folder) => (
                <button
                  key={folder.name}
                  onClick={() => {
                    setActiveView('folder');
                    setSelectedFolder(folder.name);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    activeView === 'folder' && selectedFolder === folder.name
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{folder.icon}</span>
                    <span className="text-sm font-medium">{folder.name}</span>
                  </div>
                  <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full">
                    {folder.count}
                  </span>
                </button>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por significado, no solo por texto..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <AdjustmentsHorizontalIcon className="w-5 h-5" />
                Filtros
              </button>
              <button
                onClick={() => setCompareMode(!compareMode)}
                className={`px-4 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                  compareMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <ArrowsRightLeftIcon className="w-5 h-5" />
                Comparar
              </button>
            </div>

            {showFilters && (
              <div className="flex gap-3 flex-wrap">
                <select className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm">
                  <option>Tipo: Todos</option>
                  <option>PDF</option>
                  <option>Word</option>
                  <option>Excel</option>
                </select>
                <select className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm">
                  <option>Fecha: Todas</option>
                  <option>Última semana</option>
                  <option>Último mes</option>
                  <option>Último año</option>
                </select>
                <select className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm">
                  <option>Etiquetas: Todas</option>
                  <option>Finanzas</option>
                  <option>Legal</option>
                  <option>Marketing</option>
                </select>
                <select className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm">
                  <option>Relevancia: Todos</option>
                  <option>Alta relevancia</option>
                  <option>Media relevancia</option>
                </select>
              </div>
            )}

            {compareMode && selectedDocs.length === 2 && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      2 documentos seleccionados para comparar
                    </span>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold">
                    Ver Comparación
                  </button>
                </div>
              </div>
            )}
          </header>

          {/* Content */}
          {activeView === 'settings' ? (
            <div className="flex-1 overflow-y-auto p-6">
              {renderSettingsView()}
            </div>
          ) : (
            <>
              {/* Upload Area */}
              <div
                className="mx-6 mt-6"
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <div
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950'
                  }`}
                >
                  <div className="text-center">
                    <CloudArrowUpIcon className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Arrastra y suelta tus archivos aquí o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-slate-500">
                      Soporta PDF, Word, Excel, PowerPoint
                    </p>
                    {uploadProgress !== null && (
                      <div className="mt-4 max-w-md mx-auto">
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                          Subiendo... {uploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Documents Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeView === 'trash' && (
                  <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <p className="text-sm text-orange-700 dark:text-orange-400">
                      Los documentos en la papelera se eliminarán permanentemente después de 30 días.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFilteredDocuments().map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => !activeView !== 'trash' && setSelectedDoc(doc)}
                      className={`bg-white dark:bg-slate-900 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg ${
                        compareMode && selectedDocs.includes(doc.id)
                          ? 'border-blue-500 shadow-lg'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="text-4xl">{doc.thumbnail}</div>
                          <div className="flex items-center gap-2">
                            {activeView === 'trash' ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  restoreDocument(doc.id);
                                }}
                                className="p-2 hover:bg-green-100 dark:hover:bg-green-950 rounded-lg transition-colors"
                              >
                                <ArrowPathIcon className="w-4 h-4 text-green-600" />
                              </button>
                            ) : (
                              <>
                                {compareMode && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleCompareSelection(doc.id);
                                    }}
                                    className={`p-2 rounded-lg transition-colors ${
                                      selectedDocs.includes(doc.id)
                                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-600'
                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                  >
                                    <ArrowsRightLeftIcon className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(doc.id);
                                  }}
                                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                  {doc.favorite ? (
                                    <StarIconSolid className="w-5 h-5 text-yellow-500" />
                                  ) : (
                                    <StarIcon className="w-5 h-5 text-slate-400" />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <h3 className="font-semibold text-sm mb-2 text-slate-900 dark:text-white line-clamp-2">
                          {doc.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                          <span>{doc.type}</span>
                          <span>•</span>
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span>{doc.date}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {doc.tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                          {doc.tags.length > 2 && (
                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-xs">
                              +{doc.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>

        {/* Document Viewer Panel */}
        {selectedDoc && activeView !== 'trash' && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSelectedDoc(null)}
            />
            <div className="fixed right-0 top-0 h-full w-[600px] bg-white dark:bg-slate-900 z-50 shadow-2xl overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      {selectedDoc.name}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span>{selectedDoc.type}</span>
                      <span>•</span>
                      <span>{selectedDoc.size}</span>
                      <span>•</span>
                      <span>{selectedDoc.date}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* PDF Preview */}
                <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-8 mb-6 min-h-[400px] flex items-center justify-center">
                  <div className="text-center">
                    <DocumentIcon className="w-24 h-24 mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      Vista previa del documento
                    </p>
                    {selectedDoc.url && (
                      <a
                        href={selectedDoc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg"
                      >
                        <DocumentIcon className="w-5 h-5" />
                        Abrir Documento Real
                      </a>
                    )}
                  </div>
                </div>

                {/* AI Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <SparklesIcon className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Resumen Automático
                    </h3>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedDoc.summary}
                  </p>
                </div>

                {/* Keywords */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <TagIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      Palabras Clave
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedDoc.keywords?.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Entities */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <SparklesIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      Entidades Detectadas
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {selectedDoc.entities?.map((entity, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                      >
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {entity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* File Details */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">
                    Detalles del Archivo
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Nombre</span>
                      <span className="text-slate-900 dark:text-white font-medium">
                        {selectedDoc.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Tamaño</span>
                      <span className="text-slate-900 dark:text-white font-medium">
                        {selectedDoc.size}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Fecha</span>
                      <span className="text-slate-900 dark:text-white font-medium">
                        {selectedDoc.date}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Tipo</span>
                      <span className="text-slate-900 dark:text-white font-medium">
                        {selectedDoc.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Carpeta</span>
                      <span className="text-slate-900 dark:text-white font-medium">
                        {selectedDoc.folder}
                      </span>
                    </div>
                    <div className="flex items-start justify-between text-sm">
                      <span className="text-slate-500">Etiquetas</span>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                        {selectedDoc.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
                  <button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg px-4 py-3 font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all">
                    Explicar este documento
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
