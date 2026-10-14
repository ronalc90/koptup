/**
 * Tipos TypeScript para API Client
 * Creado para eliminar uso de 'any' en api.ts
 */

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// CONTACT & QUOTE TYPES
// ============================================================================

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service: string;
  budget?: string;
  message: string;
  /** ¿Cuándo quieres empezar? (`now`, `1m`, `3m` u `open`; vacío si no respondió). */
  timeline?: string;
  /** Autorización de tratamiento de datos (Ley 1581): el backend la exige. */
  consentimiento?: boolean;
  /** Campo trampa contra bots: una persona lo deja vacío. */
  website?: string;
  /** Plan RAG, o nivel y modalidad del catálogo, que se estaban cotizando (lib/contact-quote.ts). */
  quote?: {
    service: string;
    plan?: string;
    tier?: string;
    modality?: string;
  };
}

// ============================================================================
// PROJECT TYPES
// ============================================================================

export interface CreateProjectData {
  name: string;
  description?: string;
  clientName?: string;
  status?: 'active' | 'completed' | 'on-hold' | 'cancelled';
  startDate?: string;
  endDate?: string;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  // Permite actualizar campos parciales
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: 'pending' | 'in-progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  // Permite actualizar campos parciales
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export interface CreateOrderData {
  name: string;
  description?: string;
  projectId?: string;
  items: OrderItem[];
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

// ============================================================================
// DELIVERABLE TYPES
// ============================================================================

export interface UploadDeliverableData {
  projectId: string;
  orderId?: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

// ============================================================================
// INVOICE TYPES
// ============================================================================

export interface CreateInvoiceData {
  projectId?: string;
  orderId?: string;
  clientName: string;
  clientEmail: string;
  items: InvoiceItem[];
  subtotal: number;
  tax?: number;
  total: number;
  dueDate: string;
  notes?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

/** Método de pago configurado por el equipo (GET /api/invoices/payment-methods). */
export interface InvoicePaymentMethod {
  tipo: 'transferencia';
  instrucciones: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// FILE UPLOAD TYPES
// ============================================================================

export interface UploadResponse {
  success: boolean;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}
