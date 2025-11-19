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

  const [documents, setDocuments] = useState<Document[]>([
    // Favoritos (3)
    { id: 1, name: 'Reporte_Financiero_Q1_2024.pdf', type: 'PDF', size: '2.4 MB', date: '2024-01-15', thumbnail: '📊', favorite: true, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'Q1'], summary: 'Análisis financiero Q1 2024', keywords: ['finanzas', 'ingresos'], entities: ['Balance', 'Estado'] },
    { id: 2, name: 'Propuesta_Marketing_2024.pdf', type: 'PDF', size: '1.8 MB', date: '2024-01-22', thumbnail: '📈', favorite: true, deleted: false, folder: 'Marketing', tags: ['Marketing', 'Proyectos'], summary: 'Propuesta de campaña digital', keywords: ['marketing', 'campaña'], entities: ['Plan', 'KPIs'] },
    { id: 3, name: 'Contrato_Principal_ABC.docx', type: 'Word', size: '856 KB', date: '2024-01-20', thumbnail: '📄', favorite: true, deleted: false, folder: 'Legal', tags: ['Contratos', 'Legal'], summary: 'Contrato principal ABC Corp', keywords: ['contrato', 'legal'], entities: ['ABC Corp', 'Términos'] },

    // Recientes (8 totales incluyendo favoritos = 5 más)
    { id: 4, name: 'Informe_Mensual_Enero.pdf', type: 'PDF', size: '1.2 MB', date: '2024-01-28', thumbnail: '📋', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'Reportes'], summary: 'Informe financiero de enero', keywords: ['informe', 'mensual'], entities: ['Ingresos', 'Gastos'] },
    { id: 5, name: 'Plan_Estrategico_2024.pptx', type: 'PowerPoint', size: '5.6 MB', date: '2024-01-27', thumbnail: '🎯', favorite: false, deleted: false, folder: 'Marketing', tags: ['Estrategia', 'Presentaciones'], summary: 'Plan estratégico anual', keywords: ['estrategia', 'objetivos'], entities: ['Metas', 'KPIs'] },
    { id: 6, name: 'Nomina_Enero_2024.xlsx', type: 'Excel', size: '890 KB', date: '2024-01-26', thumbnail: '📊', favorite: false, deleted: false, folder: 'RRHH', tags: ['RRHH', 'Nómina'], summary: 'Nómina del mes de enero', keywords: ['nómina', 'salarios'], entities: ['Empleados', 'Pagos'] },
    { id: 7, name: 'Politicas_Seguridad.pdf', type: 'PDF', size: '2.1 MB', date: '2024-01-25', thumbnail: '🔒', favorite: false, deleted: false, folder: 'Legal', tags: ['Legal', 'Políticas'], summary: 'Políticas de seguridad empresarial', keywords: ['seguridad', 'políticas'], entities: ['Normativas', 'Procedimientos'] },
    { id: 8, name: 'Presupuesto_Q1.xlsx', type: 'Excel', size: '1.4 MB', date: '2024-01-24', thumbnail: '💰', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'Presupuesto'], summary: 'Presupuesto primer trimestre', keywords: ['presupuesto', 'Q1'], entities: ['Ingresos', 'Egresos'] },

    // Papelera (3)
    { id: 9, name: 'Borrador_Antiguo_2023.docx', type: 'Word', size: '245 KB', date: '2023-12-15', thumbnail: '📝', favorite: false, deleted: true, folder: 'Marketing', tags: ['Borradores'], summary: 'Borrador obsoleto 2023', keywords: ['borrador'], entities: [] },
    { id: 10, name: 'Datos_Prueba_Test.xlsx', type: 'Excel', size: '128 KB', date: '2023-12-10', thumbnail: '🧪', favorite: false, deleted: true, folder: 'Finanzas', tags: ['Test'], summary: 'Datos de prueba', keywords: ['test'], entities: [] },
    { id: 11, name: 'Documento_Duplicado.pdf', type: 'PDF', size: '567 KB', date: '2023-12-05', thumbnail: '📄', favorite: false, deleted: true, folder: 'Legal', tags: ['Duplicados'], summary: 'Documento duplicado', keywords: ['duplicado'], entities: [] },

    // Más documentos para completar carpetas
    // Finanzas (24 total = 3 ya creados + 21 más)
    { id: 12, name: 'Balance_General_2023.pdf', type: 'PDF', size: '1.8 MB', date: '2024-01-10', thumbnail: '📊', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas'], summary: 'Balance general del año 2023', keywords: ['balance'], entities: [] },
    { id: 13, name: 'Flujo_Caja_Diciembre.xlsx', type: 'Excel', size: '1.1 MB', date: '2024-01-09', thumbnail: '💵', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas'], summary: 'Flujo de caja diciembre', keywords: ['flujo', 'caja'], entities: [] },
    { id: 14, name: 'Auditoria_Interna_Q4.pdf', type: 'PDF', size: '3.2 MB', date: '2024-01-08', thumbnail: '🔍', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas', 'Auditoría'], summary: 'Auditoría Q4', keywords: ['auditoría'], entities: [] },
    { id: 15, name: 'Costos_Operativos_2024.xlsx', type: 'Excel', size: '980 KB', date: '2024-01-07', thumbnail: '📉', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas'], summary: 'Costos operativos', keywords: ['costos'], entities: [] },
    { id: 16, name: 'Proyecciones_Financieras.pptx', type: 'PowerPoint', size: '4.5 MB', date: '2024-01-06', thumbnail: '📈', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas'], summary: 'Proyecciones financieras', keywords: ['proyecciones'], entities: [] },
    { id: 17, name: 'Ingresos_por_Producto.xlsx', type: 'Excel', size: '1.3 MB', date: '2024-01-05', thumbnail: '💰', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas'], summary: 'Ingresos por producto', keywords: ['ingresos'], entities: [] },
    { id: 18, name: 'Gastos_Mensuales_Enero.pdf', type: 'PDF', size: '890 KB', date: '2024-01-04', thumbnail: '📋', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas'], summary: 'Gastos mensuales', keywords: ['gastos'], entities: [] },
    { id: 19, name: 'Cuentas_por_Cobrar.xlsx', type: 'Excel', size: '1.5 MB', date: '2024-01-03', thumbnail: '🧾', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas'], summary: 'Cuentas por cobrar', keywords: ['cuentas'], entities: [] },
    { id: 20, name: 'Cuentas_por_Pagar.xlsx', type: 'Excel', size: '1.4 MB', date: '2024-01-02', thumbnail: '💳', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas'], summary: 'Cuentas por pagar', keywords: ['pagar'], entities: [] },
    { id: 21, name: 'Rentabilidad_2023.pdf', type: 'PDF', size: '2.1 MB', date: '2023-12-28', thumbnail: '📊', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas'], summary: 'Análisis de rentabilidad', keywords: ['rentabilidad'], entities: [] },
    { id: 22, name: 'ROI_Inversiones.xlsx', type: 'Excel', size: '1.2 MB', date: '2023-12-27', thumbnail: '📈', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas'], summary: 'ROI de inversiones', keywords: ['ROI'], entities: [] },
    { id: 23, name: 'Estados_Financieros_Q4.pdf', type: 'PDF', size: '3.8 MB', date: '2023-12-26', thumbnail: '📄', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas'], summary: 'Estados financieros Q4', keywords: ['estados'], entities: [] },
    { id: 24, name: 'Indicadores_Financieros.xlsx', type: 'Excel', size: '1.1 MB', date: '2023-12-25', thumbnail: '📊', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas'], summary: 'Indicadores financieros', keywords: ['indicadores'], entities: [] },
    { id: 25, name: 'Presupuesto_Anual_2024.xlsx', type: 'Excel', size: '2.3 MB', date: '2023-12-24', thumbnail: '💰', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas'], summary: 'Presupuesto anual', keywords: ['presupuesto'], entities: [] },
    { id: 26, name: 'Plan_Tesoreria.pdf', type: 'PDF', size: '1.7 MB', date: '2023-12-23', thumbnail: '🏦', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas'], summary: 'Plan de tesorería', keywords: ['tesorería'], entities: [] },
    { id: 27, name: 'Analisis_Costos_Beneficios.xlsx', type: 'Excel', size: '1.4 MB', date: '2023-12-22', thumbnail: '⚖️', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas'], summary: 'Análisis costo-beneficio', keywords: ['análisis'], entities: [] },
    { id: 28, name: 'Conciliacion_Bancaria.pdf', type: 'PDF', size: '890 KB', date: '2023-12-21', thumbnail: '🏧', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas'], summary: 'Conciliación bancaria', keywords: ['conciliación'], entities: [] },
    { id: 29, name: 'Ratios_Financieros.xlsx', type: 'Excel', size: '980 KB', date: '2023-12-20', thumbnail: '📐', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas'], summary: 'Ratios financieros', keywords: ['ratios'], entities: [] },
    { id: 30, name: 'Punto_Equilibrio.pdf', type: 'PDF', size: '1.2 MB', date: '2023-12-19', thumbnail: '🎯', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas'], summary: 'Análisis punto de equilibrio', keywords: ['equilibrio'], entities: [] },
    { id: 31, name: 'Margen_Contribucion.xlsx', type: 'Excel', size: '1.1 MB', date: '2023-12-18', thumbnail: '📊', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas'], summary: 'Margen de contribución', keywords: ['margen'], entities: [] },
    { id: 32, name: 'Capital_Trabajo.pdf', type: 'PDF', size: '1.5 MB', date: '2023-12-17', thumbnail: '💼', favorite: false, deleted: false, folder: 'Finanzas', tags: ['Finanzas'], summary: 'Capital de trabajo', keywords: ['capital'], entities: [] },

    // Legal (12 total = 2 ya creados + 10 más)
    { id: 33, name: 'Acuerdos_Confidencialidad.pdf', type: 'PDF', size: '670 KB', date: '2024-01-12', thumbnail: '🔐', favorite: false, deleted: false, folder: 'Legal', tags: ['Legal'], summary: 'Acuerdos de confidencialidad', keywords: ['confidencialidad'], entities: [] },
    { id: 34, name: 'Licencias_Software.docx', type: 'Word', size: '540 KB', date: '2024-01-11', thumbnail: '⚖️', favorite: false, deleted: false, folder: 'Legal', tags: ['Legal'], summary: 'Licencias de software', keywords: ['licencias'], entities: [] },
    { id: 35, name: 'Propiedad_Intelectual.pdf', type: 'PDF', size: '1.9 MB', date: '2024-01-10', thumbnail: '©️', favorite: false, deleted: false, folder: 'Legal', tags: ['Legal'], summary: 'Documentos de propiedad intelectual', keywords: ['propiedad'], entities: [] },
    { id: 36, name: 'Contratos_Proveedores.pdf', type: 'PDF', size: '2.3 MB', date: '2024-01-09', thumbnail: '📝', favorite: false, deleted: false, folder: 'Legal', tags: ['Legal'], summary: 'Contratos con proveedores', keywords: ['contratos'], entities: [] },
    { id: 37, name: 'Normativas_Cumplimiento.pdf', type: 'PDF', size: '3.1 MB', date: '2024-01-08', thumbnail: '📋', favorite: false, deleted: false, folder: 'Legal', tags: ['Legal'], summary: 'Normativas de cumplimiento', keywords: ['normativas'], entities: [] },
    { id: 38, name: 'Poderes_Legales.docx', type: 'Word', size: '420 KB', date: '2024-01-07', thumbnail: '📜', favorite: false, deleted: false, folder: 'Legal', tags: ['Legal'], summary: 'Poderes legales', keywords: ['poderes'], entities: [] },
    { id: 39, name: 'Registro_Mercantil.pdf', type: 'PDF', size: '1.1 MB', date: '2024-01-06', thumbnail: '🏛️', favorite: false, deleted: false, folder: 'Legal', tags: ['Legal'], summary: 'Registro mercantil', keywords: ['registro'], entities: [] },
    { id: 40, name: 'Terminos_Condiciones.pdf', type: 'PDF', size: '890 KB', date: '2024-01-05', thumbnail: '📄', favorite: false, deleted: false, folder: 'Legal', tags: ['Legal'], summary: 'Términos y condiciones', keywords: ['términos'], entities: [] },
    { id: 41, name: 'Contratos_Trabajo.pdf', type: 'PDF', size: '2.1 MB', date: '2024-01-04', thumbnail: '👔', favorite: false, deleted: false, folder: 'Legal', tags: ['Legal'], summary: 'Contratos de trabajo', keywords: ['trabajo'], entities: [] },
    { id: 42, name: 'Actas_Asamblea.docx', type: 'Word', size: '780 KB', date: '2024-01-03', thumbnail: '📝', favorite: false, deleted: false, folder: 'Legal', tags: ['Legal'], summary: 'Actas de asamblea', keywords: ['actas'], entities: [] },

    // Marketing (18 total = 2 ya creados + 16 más)
    { id: 43, name: 'Estrategia_Redes_Sociales.pptx', type: 'PowerPoint', size: '6.2 MB', date: '2024-01-13', thumbnail: '📱', favorite: false, deleted: false, folder: 'Marketing', tags: ['Marketing'], summary: 'Estrategia de redes sociales', keywords: ['redes'], entities: [] },
    { id: 44, name: 'Plan_Contenidos_Q1.xlsx', type: 'Excel', size: '1.3 MB', date: '2024-01-12', thumbnail: '📝', favorite: false, deleted: false, folder: 'Marketing', tags: ['Marketing'], summary: 'Plan de contenidos Q1', keywords: ['contenidos'], entities: [] },
    { id: 45, name: 'Analisis_Competencia.pdf', type: 'PDF', size: '2.8 MB', date: '2024-01-11', thumbnail: '🔍', favorite: false, deleted: false, folder: 'Marketing', tags: ['Marketing'], summary: 'Análisis de competencia', keywords: ['competencia'], entities: [] },
    { id: 46, name: 'Campana_Email_Marketing.docx', type: 'Word', size: '980 KB', date: '2024-01-10', thumbnail: '📧', favorite: false, deleted: false, folder: 'Marketing', tags: ['Marketing'], summary: 'Campaña de email marketing', keywords: ['email'], entities: [] },
    { id: 47, name: 'Brief_Creativo_2024.pdf', type: 'PDF', size: '1.7 MB', date: '2024-01-09', thumbnail: '🎨', favorite: false, deleted: false, folder: 'Marketing', tags: ['Marketing'], summary: 'Brief creativo 2024', keywords: ['creativo'], entities: [] },
    { id: 48, name: 'Metricas_Marketing.xlsx', type: 'Excel', size: '1.4 MB', date: '2024-01-08', thumbnail: '📊', favorite: false, deleted: false, folder: 'Marketing', tags: ['Marketing'], summary: 'Métricas de marketing', keywords: ['métricas'], entities: [] },
    { id: 49, name: 'Buyer_Personas.pdf', type: 'PDF', size: '2.1 MB', date: '2024-01-07', thumbnail: '👥', favorite: false, deleted: false, folder: 'Marketing', tags: ['Marketing'], summary: 'Buyer personas', keywords: ['personas'], entities: [] },
    { id: 50, name: 'Journey_Cliente.pptx', type: 'PowerPoint', size: '5.3 MB', date: '2024-01-06', thumbnail: '🗺️', favorite: false, deleted: false, folder: 'Marketing', tags: ['Marketing'], summary: 'Customer journey', keywords: ['journey'], entities: [] },
    { id: 51, name: 'Presupuesto_Marketing.xlsx', type: 'Excel', size: '1.2 MB', date: '2024-01-05', thumbnail: '💰', favorite: false, deleted: false, folder: 'Marketing', tags: ['Marketing'], summary: 'Presupuesto de marketing', keywords: ['presupuesto'], entities: [] },
    { id: 52, name: 'Guia_Marca.pdf', type: 'PDF', size: '8.7 MB', date: '2024-01-04', thumbnail: '🎯', favorite: false, deleted: false, folder: 'Marketing', tags: ['Marketing'], summary: 'Guía de marca', keywords: ['marca'], entities: [] },
    { id: 53, name: 'Plan_Lanzamiento.pptx', type: 'PowerPoint', size: '7.1 MB', date: '2024-01-03', thumbnail: '🚀', favorite: false, deleted: false, folder: 'Marketing', tags: ['Marketing'], summary: 'Plan de lanzamiento', keywords: ['lanzamiento'], entities: [] },
    { id: 54, name: 'SEO_Strategy.pdf', type: 'PDF', size: '1.9 MB', date: '2024-01-02', thumbnail: '🔍', favorite: false, deleted: false, folder: 'Marketing', tags: ['Marketing'], summary: 'Estrategia SEO', keywords: ['SEO'], entities: [] },
    { id: 55, name: 'SEM_Campaigns.xlsx', type: 'Excel', size: '1.5 MB', date: '2024-01-01', thumbnail: '💻', favorite: false, deleted: false, folder: 'Marketing', tags: ['Marketing'], summary: 'Campañas SEM', keywords: ['SEM'], entities: [] },
    { id: 56, name: 'Influencer_Strategy.docx', type: 'Word', size: '890 KB', date: '2023-12-31', thumbnail: '⭐', favorite: false, deleted: false, folder: 'Marketing', tags: ['Marketing'], summary: 'Estrategia de influencers', keywords: ['influencers'], entities: [] },
    { id: 57, name: 'Landing_Pages_Design.pdf', type: 'PDF', size: '4.2 MB', date: '2023-12-30', thumbnail: '🎨', favorite: false, deleted: false, folder: 'Marketing', tags: ['Marketing'], summary: 'Diseño de landing pages', keywords: ['landing'], entities: [] },
    { id: 58, name: 'Conversion_Funnel.pptx', type: 'PowerPoint', size: '3.8 MB', date: '2023-12-29', thumbnail: '🔄', favorite: false, deleted: false, folder: 'Marketing', tags: ['Marketing'], summary: 'Embudo de conversión', keywords: ['conversión'], entities: [] },

    // RRHH (15 total = 1 ya creado + 14 más)
    { id: 59, name: 'Manual_Empleado_2024.pdf', type: 'PDF', size: '3.2 MB', date: '2024-01-14', thumbnail: '📖', favorite: false, deleted: false, folder: 'RRHH', tags: ['RRHH'], summary: 'Manual del empleado 2024', keywords: ['manual'], entities: [] },
    { id: 60, name: 'Politicas_Vacaciones.docx', type: 'Word', size: '560 KB', date: '2024-01-13', thumbnail: '🏖️', favorite: false, deleted: false, folder: 'RRHH', tags: ['RRHH'], summary: 'Políticas de vacaciones', keywords: ['vacaciones'], entities: [] },
    { id: 61, name: 'Evaluacion_Desempeno.xlsx', type: 'Excel', size: '1.8 MB', date: '2024-01-12', thumbnail: '📈', favorite: false, deleted: false, folder: 'RRHH', tags: ['RRHH'], summary: 'Evaluaciones de desempeño', keywords: ['evaluación'], entities: [] },
    { id: 62, name: 'Plan_Capacitacion.pdf', type: 'PDF', size: '2.4 MB', date: '2024-01-11', thumbnail: '🎓', favorite: false, deleted: false, folder: 'RRHH', tags: ['RRHH'], summary: 'Plan de capacitación', keywords: ['capacitación'], entities: [] },
    { id: 63, name: 'Beneficios_Empleados.docx', type: 'Word', size: '780 KB', date: '2024-01-10', thumbnail: '🎁', favorite: false, deleted: false, folder: 'RRHH', tags: ['RRHH'], summary: 'Beneficios para empleados', keywords: ['beneficios'], entities: [] },
    { id: 64, name: 'Organigrama_2024.pptx', type: 'PowerPoint', size: '2.1 MB', date: '2024-01-09', thumbnail: '🏢', favorite: false, deleted: false, folder: 'RRHH', tags: ['RRHH'], summary: 'Organigrama empresarial', keywords: ['organigrama'], entities: [] },
    { id: 65, name: 'Descripcion_Puestos.pdf', type: 'PDF', size: '1.9 MB', date: '2024-01-08', thumbnail: '💼', favorite: false, deleted: false, folder: 'RRHH', tags: ['RRHH'], summary: 'Descripción de puestos', keywords: ['puestos'], entities: [] },
    { id: 66, name: 'Proceso_Seleccion.docx', type: 'Word', size: '670 KB', date: '2024-01-07', thumbnail: '🎯', favorite: false, deleted: false, folder: 'RRHH', tags: ['RRHH'], summary: 'Proceso de selección', keywords: ['selección'], entities: [] },
    { id: 67, name: 'Codigo_Etica.pdf', type: 'PDF', size: '1.3 MB', date: '2024-01-06', thumbnail: '⚖️', favorite: false, deleted: false, folder: 'RRHH', tags: ['RRHH'], summary: 'Código de ética', keywords: ['ética'], entities: [] },
    { id: 68, name: 'Reglamento_Interno.pdf', type: 'PDF', size: '2.8 MB', date: '2024-01-05', thumbnail: '📋', favorite: false, deleted: false, folder: 'RRHH', tags: ['RRHH'], summary: 'Reglamento interno', keywords: ['reglamento'], entities: [] },
    { id: 69, name: 'Clima_Laboral_2023.xlsx', type: 'Excel', size: '1.4 MB', date: '2024-01-04', thumbnail: '🌤️', favorite: false, deleted: false, folder: 'RRHH', tags: ['RRHH'], summary: 'Encuesta clima laboral', keywords: ['clima'], entities: [] },
    { id: 70, name: 'Compensaciones_Salarios.xlsx', type: 'Excel', size: '1.7 MB', date: '2024-01-03', thumbnail: '💵', favorite: false, deleted: false, folder: 'RRHH', tags: ['RRHH'], summary: 'Tabla de compensaciones', keywords: ['salarios'], entities: [] },
    { id: 71, name: 'Horarios_Trabajo.pdf', type: 'PDF', size: '540 KB', date: '2024-01-02', thumbnail: '⏰', favorite: false, deleted: false, folder: 'RRHH', tags: ['RRHH'], summary: 'Horarios de trabajo', keywords: ['horarios'], entities: [] },
    { id: 72, name: 'Seguridad_Salud.docx', type: 'Word', size: '1.1 MB', date: '2024-01-01', thumbnail: '🏥', favorite: false, deleted: false, folder: 'RRHH', tags: ['RRHH'], summary: 'Seguridad y salud laboral', keywords: ['seguridad'], entities: [] },
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

            <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg px-4 py-3 font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2">
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
                  className={`border-2 border-dashed rounded-2xl p-8 transition-all ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                  }`}
                >
                  <div className="text-center">
                    <CloudArrowUpIcon className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Arrastra y suelta tus archivos aquí
                    </p>
                    <p className="text-xs text-slate-500">
                      Soporta PDF, Word, Excel, PowerPoint e imágenes
                    </p>
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
            <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-slate-900 z-50 shadow-2xl overflow-y-auto">
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
                    <p className="text-slate-600 dark:text-slate-400">
                      Vista previa del documento
                    </p>
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
