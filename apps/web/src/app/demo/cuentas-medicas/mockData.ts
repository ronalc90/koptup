import {
  Document,
  Collection,
  MedicalAccount,
  AnalysisResult,
  AuditLog,
  Notification,
  Statistics,
  Batch
} from './types';

// Documentos normativos de ejemplo
export const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    name: 'Resolución 3047 de 2008 - CUPS',
    type: 'normativa',
    source: 'Ministerio de Salud',
    uploadDate: new Date('2024-01-15'),
    size: 2048576,
    status: 'ready_for_training',
    confidence: 0.98,
    metadata: {
      tags: ['CUPS', 'procedimientos', 'facturación'],
      description: 'Clasificación Única de Procedimientos en Salud',
      version: '2024',
      author: 'MinSalud'
    }
  },
  {
    id: 'doc-2',
    name: 'Ley 100 de 1993 - Sistema de Seguridad Social',
    type: 'ley',
    source: 'Congreso de la República',
    uploadDate: new Date('2024-01-15'),
    size: 4096000,
    status: 'ready_for_training',
    confidence: 0.99,
    metadata: {
      tags: ['seguridad social', 'salud', 'normatividad base'],
      description: 'Ley fundamental del sistema de seguridad social en salud',
      version: 'Actualizada 2024'
    }
  },
  {
    id: 'doc-3',
    name: 'Resolución 1619 de 2015 - Glosas',
    type: 'normativa',
    source: 'Ministerio de Salud',
    uploadDate: new Date('2024-01-20'),
    size: 1536000,
    status: 'ready_for_training',
    confidence: 0.95,
    metadata: {
      tags: ['glosas', 'auditoría', 'facturación'],
      description: 'Procedimiento de glosas y devoluciones',
      version: '2015'
    }
  },
  {
    id: 'doc-4',
    name: 'Circular 030 de 2013 - Negación de servicios',
    type: 'normativa',
    source: 'Supersalud',
    uploadDate: new Date('2024-01-22'),
    size: 819200,
    status: 'indexed',
    confidence: 0.92,
    metadata: {
      tags: ['negación', 'servicios', 'derechos'],
      description: 'Prohibición de negación de servicios de salud',
      version: '2013'
    }
  },
  {
    id: 'doc-5',
    name: 'Manual Tarifario SOAT 2024',
    type: 'manual',
    source: 'Gobierno Nacional',
    uploadDate: new Date('2024-02-01'),
    size: 3072000,
    status: 'ready_for_training',
    confidence: 0.97,
    metadata: {
      tags: ['tarifas', 'SOAT', 'precios'],
      description: 'Manual tarifario del SOAT',
      version: '2024'
    }
  },
  {
    id: 'doc-6',
    name: 'Acuerdo 029 de 2011 - POS',
    type: 'normativa',
    source: 'CNSSS',
    uploadDate: new Date('2024-02-05'),
    size: 5120000,
    status: 'processing',
    confidence: 0.85,
    metadata: {
      tags: ['POS', 'cobertura', 'servicios'],
      description: 'Plan Obligatorio de Salud',
      version: '2011'
    }
  }
];

// Colecciones de ejemplo
export const mockCollections: Collection[] = [
  {
    id: 'col-1',
    name: 'Normativa Facturación 2024',
    description: 'Conjunto completo de normativa vigente para facturación médica',
    documents: [mockDocuments[0], mockDocuments[1], mockDocuments[2], mockDocuments[4]],
    status: 'ingested',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-10'),
    ingestProgress: 100,
    snapshotId: 'snap-1'
  },
  {
    id: 'col-2',
    name: 'Protocolos Hospital San José',
    description: 'Protocolos internos y guías clínicas del hospital',
    documents: [mockDocuments[3]],
    status: 'ready_for_ingest',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-10'),
    ingestProgress: 0
  },
  {
    id: 'col-3',
    name: 'Legislación Base Salud',
    description: 'Leyes y decretos fundamentales del sistema de salud',
    documents: [mockDocuments[1], mockDocuments[3]],
    status: 'ingested',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-25'),
    ingestProgress: 100,
    snapshotId: 'snap-2'
  }
];

// Cuentas médicas de ejemplo
export const mockAccounts: MedicalAccount[] = [
  {
    id: 'acc-1',
    patientName: 'Juan García Pérez',
    patientId: '1234567890',
    accountNumber: 'CTA-2024-0001',
    uploadDate: new Date('2024-02-15'),
    status: 'awaiting_auditor',
    totalAmount: 2850000,
    priority: 'high',
    assignedTo: 'María López',
    services: [
      {
        id: 'srv-1-1',
        code: '890201',
        description: 'Cirugía de apendicitis',
        quantity: 1,
        unitPrice: 1500000,
        total: 1500000,
        category: 'Cirugía'
      },
      {
        id: 'srv-1-2',
        code: '890305',
        description: 'Anestesia general',
        quantity: 1,
        unitPrice: 450000,
        total: 450000,
        category: 'Anestesia'
      },
      {
        id: 'srv-1-3',
        code: '890110',
        description: 'Hospitalización sala general',
        quantity: 3,
        unitPrice: 300000,
        total: 900000,
        category: 'Hospitalización'
      }
    ]
  },
  {
    id: 'acc-2',
    patientName: 'Ana Martínez Silva',
    patientId: '9876543210',
    accountNumber: 'CTA-2024-0002',
    uploadDate: new Date('2024-02-16'),
    status: 'queued',
    totalAmount: 1250000,
    priority: 'medium',
    services: [
      {
        id: 'srv-2-1',
        code: '890450',
        description: 'Resonancia magnética cerebro',
        quantity: 1,
        unitPrice: 850000,
        total: 850000,
        category: 'Imagenología'
      },
      {
        id: 'srv-2-2',
        code: '890601',
        description: 'Consulta neurología',
        quantity: 2,
        unitPrice: 200000,
        total: 400000,
        category: 'Consulta'
      }
    ]
  },
  {
    id: 'acc-3',
    patientName: 'Carlos Rodríguez Torres',
    patientId: '5551234567',
    accountNumber: 'CTA-2024-0003',
    uploadDate: new Date('2024-02-16'),
    status: 'reviewed_by_agent',
    totalAmount: 3450000,
    priority: 'high',
    assignedTo: 'Pedro González',
    services: [
      {
        id: 'srv-3-1',
        code: '890710',
        description: 'Reemplazo de cadera',
        quantity: 1,
        unitPrice: 2800000,
        total: 2800000,
        category: 'Cirugía ortopédica'
      },
      {
        id: 'srv-3-2',
        code: '890305',
        description: 'Anestesia general',
        quantity: 1,
        unitPrice: 450000,
        total: 450000,
        category: 'Anestesia'
      },
      {
        id: 'srv-3-3',
        code: '890120',
        description: 'Terapia física',
        quantity: 5,
        unitPrice: 40000,
        total: 200000,
        category: 'Rehabilitación'
      }
    ]
  },
  {
    id: 'acc-4',
    patientName: 'María Fernández López',
    patientId: '7778889990',
    accountNumber: 'CTA-2024-0004',
    uploadDate: new Date('2024-02-17'),
    status: 'processing',
    totalAmount: 580000,
    priority: 'low',
    services: [
      {
        id: 'srv-4-1',
        code: '890801',
        description: 'Laboratorio clínico completo',
        quantity: 1,
        unitPrice: 280000,
        total: 280000,
        category: 'Laboratorio'
      },
      {
        id: 'srv-4-2',
        code: '890601',
        description: 'Consulta medicina general',
        quantity: 3,
        unitPrice: 100000,
        total: 300000,
        category: 'Consulta'
      }
    ]
  },
  {
    id: 'acc-5',
    patientName: 'Luis Alberto Ramírez',
    patientId: '3334445556',
    accountNumber: 'CTA-2024-0005',
    uploadDate: new Date('2024-02-17'),
    status: 'approved',
    totalAmount: 1980000,
    priority: 'medium',
    assignedTo: 'María López',
    services: [
      {
        id: 'srv-5-1',
        code: '890501',
        description: 'Cateterismo cardíaco',
        quantity: 1,
        unitPrice: 1680000,
        total: 1680000,
        category: 'Cardiología'
      },
      {
        id: 'srv-5-2',
        code: '890601',
        description: 'Consulta cardiología',
        quantity: 3,
        unitPrice: 100000,
        total: 300000,
        category: 'Consulta'
      }
    ]
  }
];

// Resultados de análisis de ejemplo
export const mockAnalysisResults: AnalysisResult[] = [
  {
    id: 'ana-1',
    accountId: 'acc-1',
    summary: 'Cuenta médica para cirugía de apendicitis con servicios relacionados. Se detectaron 2 observaciones menores relacionadas con tarifación.',
    issues: [
      {
        id: 'iss-1-1',
        severity: 'minor',
        category: 'Tarifación',
        description: 'La tarifa de hospitalización excede en 5% el valor de referencia SOAT 2024',
        affectedServices: ['srv-1-3'],
        normativeReference: 'Manual Tarifario SOAT 2024',
        suggestedAction: 'Verificar tarifa con manual actualizado o justificar diferencia'
      },
      {
        id: 'iss-1-2',
        severity: 'info',
        category: 'Documentación',
        description: 'Se recomienda adjuntar protocolo quirúrgico firmado',
        affectedServices: ['srv-1-1'],
        suggestedAction: 'Solicitar protocolo quirúrgico'
      }
    ],
    recommendation: 'La cuenta es procedente en términos generales. Se sugiere ajuste menor en tarifa de hospitalización y verificación de documentación soporte.',
    suggestedDecision: 'approved',
    confidence: 'high',
    normativeReferences: [
      {
        documentId: 'doc-1',
        documentName: 'Resolución 3047 de 2008 - CUPS',
        section: 'Capítulo 8 - Procedimientos Quirúrgicos',
        text: 'El código 890201 corresponde a apendicectomía simple...',
        relevance: 0.95,
        pageNumber: 142,
        highlights: [
          { start: 0, end: 50, text: 'El código 890201 corresponde a apendicectomía simple' }
        ]
      },
      {
        documentId: 'doc-5',
        documentName: 'Manual Tarifario SOAT 2024',
        section: 'Tarifas Hospitalización',
        text: 'Sala general: $285.000 día...',
        relevance: 0.88,
        pageNumber: 78,
        highlights: [
          { start: 0, end: 30, text: 'Sala general: $285.000 día' }
        ]
      }
    ],
    createdAt: new Date('2024-02-15T10:30:00'),
    agentVersion: 'v2.5.1'
  },
  {
    id: 'ana-3',
    accountId: 'acc-3',
    summary: 'Cuenta de cirugía ortopédica de alta complejidad. Todos los códigos son correctos y las tarifas están dentro de los rangos establecidos.',
    issues: [
      {
        id: 'iss-3-1',
        severity: 'info',
        category: 'Documentación',
        description: 'Verificar consentimiento informado para procedimiento de alto riesgo',
        affectedServices: ['srv-3-1'],
        normativeReference: 'Ley 100 de 1993',
        suggestedAction: 'Confirmar consentimiento informado en historia clínica'
      }
    ],
    recommendation: 'Cuenta procedente. Servicios acordes con el diagnóstico y protocolos establecidos. Tarifas dentro del rango permitido.',
    suggestedDecision: 'approved',
    confidence: 'high',
    normativeReferences: [
      {
        documentId: 'doc-1',
        documentName: 'Resolución 3047 de 2008 - CUPS',
        section: 'Capítulo 8 - Cirugía Ortopédica',
        text: 'El código 890710 corresponde a artroplastia total de cadera...',
        relevance: 0.98,
        pageNumber: 203,
        highlights: [
          { start: 0, end: 60, text: 'El código 890710 corresponde a artroplastia total de cadera' }
        ]
      },
      {
        documentId: 'doc-2',
        documentName: 'Ley 100 de 1993',
        section: 'Artículo 15 - Consentimiento informado',
        text: 'Todo procedimiento de alto riesgo requiere consentimiento informado...',
        relevance: 0.85,
        pageNumber: 12,
        highlights: [
          { start: 0, end: 55, text: 'Todo procedimiento de alto riesgo requiere consentimiento' }
        ]
      }
    ],
    createdAt: new Date('2024-02-16T14:20:00'),
    agentVersion: 'v2.5.1'
  }
];

// Logs de auditoría de ejemplo
export const mockAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    actorId: 'user-1',
    actorName: 'María López',
    actorRole: 'revisor',
    action: 'Marcó colección como lista para indexar',
    resourceType: 'collection',
    resourceId: 'col-1',
    timestamp: new Date('2024-02-10T09:15:00'),
    before: { status: 'draft' },
    after: { status: 'ready_for_ingest' },
    collectionSnapshotId: 'snap-1'
  },
  {
    id: 'log-2',
    actorId: 'system',
    actorName: 'Sistema AI',
    actorRole: 'admin',
    action: 'Procesó cuenta médica',
    resourceType: 'account',
    resourceId: 'acc-1',
    timestamp: new Date('2024-02-15T10:30:00'),
    confidence: 0.92,
    after: { status: 'reviewed_by_agent', analysisId: 'ana-1' }
  },
  {
    id: 'log-3',
    actorId: 'user-2',
    actorName: 'Pedro González',
    actorRole: 'auditor',
    action: 'Aprobó cuenta médica',
    resourceType: 'account',
    resourceId: 'acc-5',
    timestamp: new Date('2024-02-17T16:45:00'),
    before: { status: 'awaiting_auditor' },
    after: { status: 'approved', decision: 'approved' }
  },
  {
    id: 'log-4',
    actorId: 'user-1',
    actorName: 'María López',
    actorRole: 'revisor',
    action: 'Subió documento normativo',
    resourceType: 'document',
    resourceId: 'doc-6',
    timestamp: new Date('2024-02-05T11:20:00'),
    after: { status: 'uploaded', name: 'Acuerdo 029 de 2011 - POS' }
  }
];

// Notificaciones de ejemplo
export const mockNotifications: Notification[] = [
  {
    id: 'not-1',
    userId: 'user-1',
    type: 'success',
    title: 'Indexación completada',
    message: 'La colección "Normativa Facturación 2024" ha sido indexada exitosamente',
    timestamp: new Date('2024-02-10T10:00:00'),
    read: false,
    actionUrl: '/demo/cuentas-medicas?tab=collections',
    actionLabel: 'Ver colección'
  },
  {
    id: 'not-2',
    userId: 'user-1',
    type: 'info',
    title: 'Nueva cuenta procesada',
    message: 'La cuenta CTA-2024-0001 ha sido procesada y requiere revisión',
    timestamp: new Date('2024-02-15T10:35:00'),
    read: false,
    actionUrl: '/demo/cuentas-medicas?tab=review&account=acc-1',
    actionLabel: 'Revisar cuenta'
  },
  {
    id: 'not-3',
    userId: 'user-2',
    type: 'warning',
    title: 'Cuenta requiere atención',
    message: 'La cuenta CTA-2024-0003 tiene problemas detectados que requieren revisión urgente',
    timestamp: new Date('2024-02-16T14:25:00'),
    read: true,
    actionUrl: '/demo/cuentas-medicas?tab=review&account=acc-3',
    actionLabel: 'Ver detalles'
  }
];

// Estadísticas de ejemplo
export const mockStatistics: Statistics = {
  totalDocuments: 6,
  totalCollections: 3,
  totalAccounts: 5,
  pendingAccounts: 1,
  processingAccounts: 1,
  completedAccounts: 3,
  approvedAccounts: 1,
  rejectedAccounts: 0,
  avgProcessingTime: 45,
  aiAcceptanceRate: 85,
  todayProcessed: 3,
  weekProcessed: 12
};

// Lotes de ejemplo
export const mockBatches: Batch[] = [
  {
    id: 'batch-1',
    name: 'Lote Febrero 2024 - Semana 1',
    accounts: [mockAccounts[0], mockAccounts[1], mockAccounts[2]],
    status: 'completed',
    createdAt: new Date('2024-02-15'),
    completedAt: new Date('2024-02-16'),
    progress: 100,
    totalAccounts: 3,
    processedAccounts: 3,
    approvedAccounts: 2,
    rejectedAccounts: 0
  },
  {
    id: 'batch-2',
    name: 'Lote Febrero 2024 - Semana 2',
    accounts: [mockAccounts[3], mockAccounts[4]],
    status: 'processing',
    createdAt: new Date('2024-02-17'),
    progress: 60,
    totalAccounts: 2,
    processedAccounts: 1,
    approvedAccounts: 1,
    rejectedAccounts: 0
  }
];
