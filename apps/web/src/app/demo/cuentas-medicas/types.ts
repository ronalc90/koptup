// Estados de documentos
export type DocumentStatus = 'uploaded' | 'processing' | 'indexed' | 'ready_for_training' | 'error';

// Estados de colecciones
export type CollectionStatus = 'draft' | 'ready_for_ingest' | 'ingested' | 'processing';

// Estados de cuentas médicas
export type AccountStatus = 'uploaded' | 'queued' | 'processing' | 'reviewed_by_agent' | 'awaiting_auditor' | 'approved' | 'rejected' | 'needs_info';

// Estados de batch
export type BatchStatus = 'queued' | 'processing' | 'partial_results' | 'completed';

// Nivel de confianza
export type ConfidenceLevel = 'low' | 'medium' | 'high';

// Roles de usuario
export type UserRole = 'revisor' | 'auditor' | 'admin';

// Tipos de documentos
export type DocumentType = 'normativa' | 'protocolo' | 'ley' | 'reglamento' | 'guia' | 'manual' | 'otro';

// Tipo de decisión
export type DecisionType = 'approved' | 'rejected' | 'needs_info' | 'pending';

// Documento normativo
export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  source: string;
  uploadDate: Date;
  size: number;
  status: DocumentStatus;
  confidence: number;
  metadata: {
    tags: string[];
    description?: string;
    version?: string;
    author?: string;
  };
  ocrText?: string;
}

// Colección de documentos
export interface Collection {
  id: string;
  name: string;
  description: string;
  documents: Document[];
  status: CollectionStatus;
  createdAt: Date;
  updatedAt: Date;
  ingestProgress?: number;
  snapshotId?: string;
}

// Cuenta médica
export interface MedicalAccount {
  id: string;
  patientName: string;
  patientId: string;
  accountNumber: string;
  uploadDate: Date;
  status: AccountStatus;
  totalAmount: number;
  services: MedicalService[];
  documentUrl?: string;
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
}

// Servicio médico
export interface MedicalService {
  id: string;
  code: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: string;
}

// Resultado de análisis de IA
export interface AnalysisResult {
  id: string;
  accountId: string;
  summary: string;
  issues: Issue[];
  recommendation: string;
  suggestedDecision: DecisionType;
  confidence: ConfidenceLevel;
  normativeReferences: NormativeReference[];
  createdAt: Date;
  agentVersion: string;
}

// Problema detectado
export interface Issue {
  id: string;
  severity: 'critical' | 'major' | 'minor' | 'info';
  category: string;
  description: string;
  affectedServices: string[];
  normativeReference?: string;
  suggestedAction?: string;
}

// Referencia normativa
export interface NormativeReference {
  documentId: string;
  documentName: string;
  section: string;
  text: string;
  relevance: number;
  pageNumber?: number;
  highlights: TextHighlight[];
}

// Resaltado de texto
export interface TextHighlight {
  start: number;
  end: number;
  text: string;
}

// Decisión del auditor
export interface AuditorDecision {
  id: string;
  accountId: string;
  analysisId: string;
  decision: DecisionType;
  notes: string;
  auditorId: string;
  auditorName: string;
  timestamp: Date;
  modifications?: DecisionModification[];
}

// Modificación de decisión
export interface DecisionModification {
  field: string;
  oldValue: any;
  newValue: any;
  reason: string;
}

// Lote de procesamiento
export interface Batch {
  id: string;
  name: string;
  accounts: MedicalAccount[];
  status: BatchStatus;
  createdAt: Date;
  completedAt?: Date;
  progress: number;
  totalAccounts: number;
  processedAccounts: number;
  approvedAccounts: number;
  rejectedAccounts: number;
}

// Log de auditoría
export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  resourceType: string;
  resourceId: string;
  timestamp: Date;
  before?: any;
  after?: any;
  confidence?: number;
  sourceFragments?: string[];
  collectionSnapshotId?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Notificación
export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

// Estadísticas
export interface Statistics {
  totalDocuments: number;
  totalCollections: number;
  totalAccounts: number;
  pendingAccounts: number;
  processingAccounts: number;
  completedAccounts: number;
  approvedAccounts: number;
  rejectedAccounts: number;
  avgProcessingTime: number;
  aiAcceptanceRate: number;
  todayProcessed: number;
  weekProcessed: number;
}
