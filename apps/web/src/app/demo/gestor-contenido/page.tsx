'use client';

import { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  PresentationChartBarIcon,
  EnvelopeIcon,
  MegaphoneIcon,
  BriefcaseIcon,
  SparklesIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  FolderIcon,
  StarIcon,
  ClockIcon,
  Bars3BottomLeftIcon,
  ListBulletIcon,
  TableCellsIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import * as contentService from '@/services/contentManagerService';

interface Template {
  id: number;
  name: string;
  description: string;
  icon: any;
  color: string;
  category: string;
  placeholder: string;
}

interface SavedContent {
  id: number;
  title: string;
  type: string;
  date: string;
  favorite: boolean;
  content: string; // Contenido de ejemplo
}

export default function GestorContenido() {
  const [view, setView] = useState<'templates' | 'editor'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [content, setContent] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [tone, setTone] = useState<'formal' | 'técnico' | 'persuasivo'>('formal');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editableFields, setEditableFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [generatedVersions, setGeneratedVersions] = useState<contentService.ContentVersion[]>([]);

  const templates: Template[] = [
    {
      id: 1,
      name: 'Correo Corporativo',
      description: 'Plantilla profesional para comunicación empresarial',
      icon: EnvelopeIcon,
      color: 'from-blue-500 to-blue-600',
      category: 'Comunicación',
      placeholder: 'Escribe tu correo corporativo aquí...',
    },
    {
      id: 2,
      name: 'Presentación Comercial',
      description: 'Estructura para pitch de ventas y presentaciones',
      icon: PresentationChartBarIcon,
      color: 'from-purple-500 to-purple-600',
      category: 'Ventas',
      placeholder: 'Desarrolla tu presentación comercial...',
    },
    {
      id: 3,
      name: 'Descripción de Producto',
      description: 'Texto optimizado para catálogos y marketing',
      icon: DocumentTextIcon,
      color: 'from-green-500 to-green-600',
      category: 'Marketing',
      placeholder: 'Describe tu producto de manera atractiva...',
    },
    {
      id: 4,
      name: 'Post para Redes Sociales',
      description: 'Contenido optimizado para engagement digital',
      icon: MegaphoneIcon,
      color: 'from-pink-500 to-pink-600',
      category: 'Social Media',
      placeholder: 'Crea contenido impactante para redes...',
    },
    {
      id: 5,
      name: 'Propuesta de Negocio',
      description: 'Documento formal para propuestas comerciales',
      icon: BriefcaseIcon,
      color: 'from-orange-500 to-orange-600',
      category: 'Negocios',
      placeholder: 'Redacta tu propuesta de negocio...',
    },
  ];

  const savedContent: SavedContent[] = [
    {
      id: 1,
      title: 'Email Bienvenida Clientes',
      type: 'Correo Corporativo',
      date: '2024-01-28',
      favorite: true,
      content: 'Asunto: ¡Bienvenido a [Nombre Empresa]!\n\nEstimado/a [Nombre Cliente],\n\nEs un placer darle la bienvenida a nuestra familia de clientes. En [Nombre Empresa], nos comprometemos a ofrecerle soluciones innovadoras y un servicio excepcional.\n\nNuestro equipo está listo para ayudarle en todo lo que necesite. No dude en contactarnos al [Teléfono] o escribirnos a [Email].\n\nGracias por confiar en nosotros.\n\nCordialmente,\n[Nombre Remitente]\n[Cargo]'
    },
    {
      id: 2,
      title: 'Pitch Producto Q1',
      type: 'Presentación Comercial',
      date: '2024-01-27',
      favorite: false,
      content: 'PRESENTACIÓN: [Nombre Producto]\n\nProblema: Los clientes enfrentan dificultades con [problema específico].\n\nSolución: Nuestro producto ofrece [solución única] que permite [beneficio principal].\n\nVentajas Competitivas:\n• [Ventaja 1]\n• [Ventaja 2]\n• [Ventaja 3]\n\nMercado Objetivo: [Descripción del mercado]\n\nProyección de Ventas Q1: [Cifras]\n\nInversión Requerida: $[Monto]'
    },
    {
      id: 3,
      title: 'Descripción Software AI',
      type: 'Descripción de Producto',
      date: '2024-01-26',
      favorite: true,
      content: '[Nombre Software] - Inteligencia Artificial para Empresas\n\nDescripción:\nPlataforma de IA que automatiza [proceso] mediante algoritmos avanzados de aprendizaje automático.\n\nCaracterísticas:\n• Procesamiento en tiempo real\n• Integración con sistemas existentes\n• Dashboard analítico intuitivo\n• Soporte 24/7\n\nBeneficios:\n- Reducción del 40% en tiempo de proceso\n- Aumento del 30% en precisión\n- ROI en 6 meses\n\nPrecio: Desde $[Precio]/mes'
    },
    {
      id: 4,
      title: 'Post Lanzamiento Producto',
      type: 'Post para Redes Sociales',
      date: '2024-01-25',
      favorite: false,
      content: '🚀 ¡GRAN LANZAMIENTO! 🚀\n\nHoy presentamos [Nombre Producto], la solución que estabas esperando para [problema].\n\n✨ ¿Por qué te encantará?\n• [Beneficio 1]\n• [Beneficio 2]\n• [Beneficio 3]\n\n🎁 OFERTA ESPECIAL: 20% de descuento los primeros 100 clientes\n\n👉 Conoce más en [Link]\n\n#Innovación #Tecnología #[Industria]'
    },
    {
      id: 5,
      title: 'Propuesta Consultoría TI',
      type: 'Propuesta de Negocio',
      date: '2024-01-24',
      favorite: true,
      content: 'PROPUESTA DE CONSULTORÍA EN TI\n\nCliente: [Nombre Cliente]\nFecha: [Fecha]\n\nALCANCE:\nImplementación de infraestructura cloud para [objetivo específico].\n\nENTREGABLES:\n1. Análisis de situación actual\n2. Diseño de arquitectura cloud\n3. Migración de sistemas\n4. Capacitación del personal\n5. Soporte post-implementación (3 meses)\n\nTIMELINE: 4 meses\n\nINVERSIÓN TOTAL: $[Monto]\n\nTÉRMINOS DE PAGO: 30% inicio, 40% hito intermedio, 30% finalización'
    },
    {
      id: 6,
      title: 'Correo Seguimiento Ventas',
      type: 'Correo Corporativo',
      date: '2024-01-23',
      favorite: false,
      content: 'Asunto: Seguimiento - Propuesta [Nombre Proyecto]\n\nHola [Nombre],\n\nEspero que este mensaje te encuentre bien. Quería hacer seguimiento a nuestra propuesta presentada el [fecha].\n\n¿Has tenido oportunidad de revisarla? Me gustaría agendar una breve llamada para resolver cualquier duda y conocer tus impresiones.\n\nEstoy disponible [días y horarios].\n\nQuedo atento a tu respuesta.\n\nSaludos,\n[Tu Nombre]'
    },
    {
      id: 7,
      title: 'Presentación Inversionistas',
      type: 'Presentación Comercial',
      date: '2024-01-22',
      favorite: true,
      content: 'PITCH DECK - [Nombre Startup]\n\nVISIÓN: [Visión de la empresa]\n\nPROBLEMA:\n[Descripción del problema del mercado]\n\nSOLUCIÓN:\n[Cómo tu producto/servicio resuelve el problema]\n\nMERCADO:\n• TAM: $[Total Addressable Market]\n• SAM: $[Serviceable Addressable Market]\n• SOM: $[Serviceable Obtainable Market]\n\nMODELO DE NEGOCIO:\n[Descripción de cómo generas ingresos]\n\nTRACCIÓN:\n• [Métrica 1]\n• [Métrica 2]\n• [Métrica 3]\n\nEQUIPO: [Miembros clave]\n\nINVERSIÓN SOLICITADA: $[Monto]\nUSO DE FONDOS: [Distribución]'
    },
    {
      id: 8,
      title: 'Descripción Servicio Cloud',
      type: 'Descripción de Producto',
      date: '2024-01-21',
      favorite: false,
      content: 'SERVICIO DE ALMACENAMIENTO CLOUD EMPRESARIAL\n\n¿Qué es [Nombre Servicio]?\nSolución de almacenamiento en la nube diseñada para empresas que necesitan seguridad, escalabilidad y acceso desde cualquier lugar.\n\nFuncionalidades:\n• Almacenamiento ilimitado\n• Cifrado de extremo a extremo\n• Colaboración en tiempo real\n• Versionamiento automático\n• Backup diario\n• Acceso desde cualquier dispositivo\n\nPlanes:\n- Basic: 100GB - $9.99/mes\n- Professional: 1TB - $29.99/mes\n- Enterprise: Ilimitado - Consultar\n\nCompatibilidad: Windows, Mac, Linux, iOS, Android'
    },
    {
      id: 9,
      title: 'Campaña Black Friday',
      type: 'Post para Redes Sociales',
      date: '2024-01-20',
      favorite: true,
      content: '🔥 BLACK FRIDAY 2024 🔥\n\n¡Las ofertas más grandes del año están aquí!\n\n💥 HASTA 70% DE DESCUENTO\n💥 ENVÍO GRATIS en compras superiores a $[Monto]\n💥 12 CUOTAS SIN INTERÉS\n\n⏰ Solo por 72 horas\n📅 Del [Fecha] al [Fecha]\n\n🛍️ Categorías en oferta:\n• Tecnología\n• Hogar\n• Moda\n• Deportes\n\n👉 Compra ahora: [Link]\n\n¡No te lo pierdas! 🎯\n\n#BlackFriday #Ofertas #Descuentos'
    },
    {
      id: 10,
      title: 'Propuesta Desarrollo App',
      type: 'Propuesta de Negocio',
      date: '2024-01-19',
      favorite: false,
      content: 'PROPUESTA: DESARROLLO APP MÓVIL\n\nPara: [Cliente]\nDe: [Tu Empresa]\n\nOBJETIVO:\nDesarrollar aplicación móvil nativa (iOS/Android) para [objetivo del cliente].\n\nCARACTERÍSTICAS PRINCIPALES:\n• Registro e inicio de sesión\n• [Funcionalidad 1]\n• [Funcionalidad 2]\n• [Funcionalidad 3]\n• Notificaciones push\n• Panel de administración web\n\nTECNOLOGÍAS:\n- Frontend: React Native\n- Backend: Node.js + MongoDB\n- Infraestructura: AWS\n\nFASES DEL PROYECTO:\nFase 1: Diseño UX/UI (3 semanas)\nFase 2: Desarrollo MVP (8 semanas)\nFase 3: Testing y QA (2 semanas)\nFase 4: Lanzamiento y soporte (1 semana)\n\nINVERSIÓN: $[Monto]\nTiempo total: 14 semanas'
    },
  ];

  const selectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setContent('');
    setPreviewContent('');
    setError(null);
    setView('editor');
  };

  const openSavedContent = (item: SavedContent) => {
    // Buscar la plantilla correspondiente al tipo de documento
    const template = templates.find(t => t.name === item.type);
    if (template) {
      setSelectedTemplate(template);
      setContent(item.content);
      setPreviewContent('');
      setError(null);
      setEditableFields({});
      setView('editor');
    }
  };

  const improveText = async () => {
    if (!content.trim() || !selectedTemplate) {
      setError('Por favor escribe algo de contenido primero');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const templateId = contentService.getTemplateId(selectedTemplate.name);
      const improved = await contentService.improveContent(content, templateId);
      setPreviewContent(improved);
      setEditableFields({}); // Limpiar campos al generar nuevo contenido
    } catch (err: any) {
      setError(err.message || 'Error al mejorar el texto');
    } finally {
      setLoading(false);
    }
  };

  const changeToneHandler = async (newTone: 'formal' | 'técnico' | 'persuasivo') => {
    if (!content.trim() || !selectedTemplate) {
      setError('Por favor escribe algo de contenido primero');
      return;
    }

    setLoading(true);
    setError(null);
    setTone(newTone);

    try {
      const templateId = contentService.getTemplateId(selectedTemplate.name);
      const adapted = await contentService.changeTone(content, newTone, templateId);
      setPreviewContent(adapted);
      setEditableFields({}); // Limpiar campos al generar nuevo contenido
    } catch (err: any) {
      setError(err.message || 'Error al cambiar el tono');
    } finally {
      setLoading(false);
    }
  };

  const adjustWordCount = async (targetWords: number) => {
    if (!content.trim() || !selectedTemplate) {
      setError('Por favor escribe algo de contenido primero');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const templateId = contentService.getTemplateId(selectedTemplate.name);
      const adjusted = await contentService.adjustLength(content, targetWords, templateId);
      setPreviewContent(adjusted);
      setEditableFields({}); // Limpiar campos al generar nuevo contenido
    } catch (err: any) {
      setError(err.message || 'Error al ajustar la longitud');
    } finally {
      setLoading(false);
    }
  };

  const generateVersionsHandler = async () => {
    if (!content.trim() || !selectedTemplate) {
      setError('Por favor escribe algo de contenido primero');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const templateId = contentService.getTemplateId(selectedTemplate.name);
      const versions = await contentService.generateVersions(content, templateId, 3);
      setGeneratedVersions(versions);
      setShowVersions(true);
    } catch (err: any) {
      setError(err.message || 'Error al generar versiones');
    } finally {
      setLoading(false);
    }
  };

  // Función para renderizar contenido con campos editables
  const renderEditableContent = (text: string) => {
    if (!text) return null;

    // Patrón para encontrar texto entre corchetes [texto]
    const pattern = /\[([^\]]+)\]/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    let fieldIndex = 0;

    while ((match = pattern.exec(text)) !== null) {
      // Agregar texto antes del match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Agregar campo editable
      const fieldKey = `field_${fieldIndex}`;
      const placeholder = match[1];
      const value = editableFields[fieldKey] || '';

      parts.push(
        <input
          key={fieldKey}
          type="text"
          value={value}
          onChange={(e) => setEditableFields({ ...editableFields, [fieldKey]: e.target.value })}
          placeholder={placeholder}
          className="inline-block min-w-[150px] px-2 py-1 mx-1 border-b-2 border-pink-300 dark:border-pink-700 bg-transparent focus:outline-none focus:border-pink-500 dark:focus:border-pink-400 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
      );

      lastIndex = pattern.lastIndex;
      fieldIndex++;
    }

    // Agregar texto restante
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  // Función para obtener el texto final con los valores de los campos
  const getFinalContent = () => {
    const displayText = previewContent || content;
    if (!displayText) return '';

    let result = displayText;
    const pattern = /\[([^\]]+)\]/g;
    let fieldIndex = 0;

    result = result.replace(pattern, (match, placeholder) => {
      const fieldKey = `field_${fieldIndex}`;
      const value = editableFields[fieldKey] || placeholder;
      fieldIndex++;
      return value;
    });

    return result;
  };

  const loadVersion = (version: contentService.ContentVersion) => {
    setContent(version.content);
    setEditableFields({}); // Limpiar campos editables al cargar nueva versión
    setPreviewContent(version.content);
    setTone(version.tone);
    setShowVersions(false);
  };

  // Función para copiar al portapapeles
  const copyToClipboard = async () => {
    const finalText = getFinalContent();
    try {
      await navigator.clipboard.writeText(finalText);
      alert('Contenido copiado al portapapeles');
      setShowExportMenu(false);
    } catch (err) {
      console.error('Error al copiar:', err);
      alert('Error al copiar al portapapeles');
    }
  };

  // Función para descargar como archivo de texto
  const downloadAsTxt = () => {
    const finalText = getFinalContent();
    const blob = new Blob([finalText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate?.name || 'documento'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Función para descargar como PDF
  const downloadAsPdf = async () => {
    const finalText = getFinalContent();
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Configurar fuente y margenes
      doc.setFont('helvetica');
      doc.setFontSize(12);

      // Título
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(selectedTemplate?.name || 'Documento', 20, 20);

      // Contenido
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      // Dividir el texto en líneas que quepan en la página
      const lines = doc.splitTextToSize(finalText, 170);
      let yPosition = 35;
      const lineHeight = 7;
      const pageHeight = doc.internal.pageSize.height;

      lines.forEach((line: string) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 20, yPosition);
        yPosition += lineHeight;
      });

      // Descargar
      doc.save(`${selectedTemplate?.name || 'documento'}.pdf`);
      setShowExportMenu(false);
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('Error al generar PDF');
    }
  };

  // Función para vista previa de email
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const previewAsEmail = () => {
    setShowEmailPreview(true);
    setShowExportMenu(false);
  };

  // Evitar scroll automático al cargar la página
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  if (view === 'templates') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                <DocumentTextIcon className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                Gestor de Contenido Corporativo
              </h1>
            </div>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Crea textos empresariales profesionales con asistencia de IA
            </p>
          </div>

          {/* Saved Content Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Documentos Guardados
              </h2>
              <div className="flex items-center gap-2">
                <button className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <FolderIcon className="w-5 h-5" />
                </button>
                <button className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <StarIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {savedContent.map((item) => (
                <div
                  key={item.id}
                  onClick={() => openSavedContent(item)}
                  className="p-4 border-2 border-slate-200 dark:border-slate-800 rounded-xl hover:border-pink-500 hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                    {item.favorite && <StarIcon className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{item.type}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ClockIcon className="w-4 h-4" />
                    <span>{item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Selecciona una Plantilla
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => {
              const Icon = template.icon;
              return (
                <div
                  key={template.id}
                  onClick={() => selectTemplate(template)}
                  className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden cursor-pointer"
                >
                  <div className={`bg-gradient-to-br ${template.color} p-6 text-center`}>
                    <Icon className="w-16 h-16 text-white mx-auto mb-3" />
                    <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-white text-xs font-semibold">
                      {template.category}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      {template.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {template.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Editor View
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView('templates')}
                className="text-pink-600 dark:text-pink-400 hover:underline"
              >
                ← Volver a plantillas
              </button>
              <div className="border-l border-slate-300 dark:border-slate-700 pl-4">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedTemplate?.name}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedTemplate?.category}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={generateVersionsHandler}
                disabled={loading}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ClockIcon className="w-4 h-4" />
                Versiones {generatedVersions.length > 0 && `(${generatedVersions.length})`}
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all flex items-center gap-2 text-sm font-semibold"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Exportar
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-10">
                    <button
                      onClick={copyToClipboard}
                      className="w-full px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm flex items-center gap-2"
                    >
                      <DocumentTextIcon className="w-4 h-4" />
                      Copiar al Portapapeles
                    </button>
                    {selectedTemplate?.name === 'Correo Corporativo' && (
                      <button
                        onClick={previewAsEmail}
                        className="w-full px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm flex items-center gap-2 border-t border-slate-200 dark:border-slate-700"
                      >
                        <EnvelopeIcon className="w-4 h-4" />
                        Vista Previa Email
                      </button>
                    )}
                    <button
                      onClick={downloadAsPdf}
                      className="w-full px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm flex items-center gap-2 border-t border-slate-200 dark:border-slate-700"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      Descargar como PDF
                    </button>
                    <button
                      onClick={downloadAsTxt}
                      className="w-full px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm flex items-center gap-2 border-t border-slate-200 dark:border-slate-700"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      Descargar como TXT
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Editor and Preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor Panel */}
          <div className="flex-1 flex flex-col border-r border-slate-200 dark:border-slate-800">
            {/* Toolbar */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3">
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <Bars3BottomLeftIcon className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <ListBulletIcon className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <TableCellsIcon className="w-5 h-5" />
                </button>
                <div className="border-l border-slate-300 dark:border-slate-700 h-6 mx-2" />
                <select className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm">
                  <option>Arial</option>
                  <option>Times New Roman</option>
                  <option>Calibri</option>
                </select>
                <select className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm">
                  <option>12pt</option>
                  <option>14pt</option>
                  <option>16pt</option>
                </select>
              </div>
            </div>

            {/* Text Area */}
            <div className="flex-1 bg-white dark:bg-slate-900 p-8 overflow-y-auto">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={selectedTemplate?.placeholder}
                className="w-full h-full bg-transparent resize-none focus:outline-none text-slate-900 dark:text-white leading-relaxed"
                style={{ minHeight: '100%' }}
              />
            </div>

            {/* AI Tools Bar */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 border-t border-pink-200 dark:border-pink-800 px-6 py-4">
              <div className="flex items-center gap-2 mb-3">
                <SparklesIcon className="w-5 h-5 text-pink-600" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Herramientas IA</h3>
              </div>

              {error && (
                <div className="mb-3 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {loading && (
                <div className="mb-3 p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Procesando con IA...
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={improveText}
                  disabled={loading}
                  className="px-4 py-2 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SparklesIcon className="w-4 h-4" />
                  Mejorar Texto
                </button>
                <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-lg p-1">
                  {(['formal', 'técnico', 'persuasivo'] as const).map((toneOption) => (
                    <button
                      key={toneOption}
                      onClick={() => changeToneHandler(toneOption)}
                      disabled={loading}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        tone === toneOption
                          ? 'bg-pink-600 text-white'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {toneOption.charAt(0).toUpperCase() + toneOption.slice(1)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => adjustWordCount(200)}
                  disabled={loading}
                  className="px-4 py-2 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ajustar a 200 palabras
                </button>
                <button
                  onClick={() => adjustWordCount(500)}
                  disabled={loading}
                  className="px-4 py-2 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ajustar a 500 palabras
                </button>
                <button
                  onClick={generateVersionsHandler}
                  disabled={loading}
                  className="px-4 py-2 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  Generar Versiones
                </button>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="w-1/2 bg-slate-50 dark:bg-slate-950 flex flex-col">
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Previsualización
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Vista en formato corporativo
              </p>
            </div>

            {/* Document Preview */}
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-lg shadow-lg p-12 min-h-full">
                {/* Header */}
                <div className="mb-8 pb-6 border-b-2 border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg"></div>
                    <span className="text-sm text-slate-500">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-4">
                    {selectedTemplate?.name}
                  </h1>
                </div>

                {/* Content */}
                <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                  {(previewContent || content) ? (
                    <div className="leading-relaxed">
                      {renderEditableContent(previewContent || content)}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">
                      El contenido aparecerá aquí mientras escribes...
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-12 pt-6 border-t-2 border-slate-200 dark:border-slate-800">
                  <p className="text-sm text-slate-500 text-center">
                    Documento generado con KopTup Content Manager
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Versions Modal */}
      {showVersions && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowVersions(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-6 h-6 text-pink-600" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Versiones Anteriores
                  </h2>
                </div>
                <button
                  onClick={() => setShowVersions(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {generatedVersions.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No hay versiones generadas aún. Usa el botón &quot;Generar Versiones&quot; para crear variaciones de tu contenido.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {generatedVersions.map((version, index) => (
                      <div
                        key={index}
                        className="p-4 border-2 border-slate-200 dark:border-slate-800 rounded-xl hover:border-pink-500 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white mb-1">
                              {version.version}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {new Date(version.timestamp).toLocaleString('es-ES')} • Tono: {version.tone.charAt(0).toUpperCase() + version.tone.slice(1)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => loadVersion(version)}
                              className="px-3 py-1 bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400 rounded-lg hover:bg-pink-200 dark:hover:bg-pink-900 transition-colors text-sm font-medium"
                            >
                              Cargar
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                          {version.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal de Vista Previa Email */}
      {showEmailPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <EnvelopeIcon className="w-6 h-6" />
                Vista Previa de Email
              </h3>
              <button
                onClick={() => setShowEmailPreview(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Contenido del email */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Simulación de cliente de email */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                {/* Header del email */}
                <div className="mb-6 pb-4 border-b border-slate-300 dark:border-slate-600">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {selectedTemplate?.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        Tu Empresa
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        contacto@tuempresa.com
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <div><span className="font-medium">Para:</span> cliente@ejemplo.com</div>
                    <div><span className="font-medium">Asunto:</span> {selectedTemplate?.name}</div>
                  </div>
                </div>

                {/* Cuerpo del email */}
                <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm">
                  <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap font-sans text-slate-900 dark:text-white">
                    {getFinalContent()}
                  </div>
                </div>

                {/* Footer del email */}
                <div className="mt-6 pt-4 border-t border-slate-300 dark:border-slate-600 text-xs text-slate-500 dark:text-slate-400 text-center">
                  Este es un mensaje generado automáticamente. Por favor no responder a este correo.
                </div>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setShowEmailPreview(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  copyToClipboard();
                  setShowEmailPreview(false);
                }}
                className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all"
              >
                Copiar Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
