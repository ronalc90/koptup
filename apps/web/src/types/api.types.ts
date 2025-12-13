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
}

export interface QuoteRequestData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  serviceType: string;
  description: string;
  budget?: string;
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
  projectId?: string;
  items: OrderItem[];
  totalAmount: number;
  notes?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
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

export interface PayInvoiceData {
  paymentMethod: 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash';
  paymentReference?: string;
  amount: number;
  notes?: string;
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
