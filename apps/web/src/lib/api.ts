import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import type {
  RegisterData,
  ContactFormData,
  QuoteRequestData,
  CreateProjectData,
  UpdateProjectData,
  CreateTaskData,
  UpdateTaskData,
  CreateOrderData,
  UploadDeliverableData,
  CreateInvoiceData,
  PayInvoiceData,
} from '@/types/api.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * API Client singleton
 *
 * Note: Network errors (404, 401) will still appear in the browser's network console
 * even when handled gracefully. This is normal browser behavior and cannot be
 * suppressed from JavaScript. The application handles these errors with fallback data.
 */
class ApiClient {
  private client: AxiosInstance;
  private refreshing: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = Cookies.get('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Don't try to refresh token for login/register endpoints
        const isAuthEndpoint = originalRequest.url?.includes('/api/auth/login') ||
                               originalRequest.url?.includes('/api/auth/register');

        // Handle 401 errors (token expired) - but not for auth endpoints
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint && Cookies.get('accessToken')) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login only if we're on a protected page
            if (typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard')) {
              Cookies.remove('accessToken');
              Cookies.remove('refreshToken');
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        }

        // Suppress console errors for expected failures (404, 401 when backend is down)
        // BUT NOT for auth endpoints - we want those errors to be handled properly
        const isSuppressibleError =
          !isAuthEndpoint && (
            error.response?.status === 404 ||
            (error.response?.status === 401 && !Cookies.get('accessToken')) ||
            error.code === 'ERR_NETWORK'
          );

        // Create a custom error that won't log to console for suppressible errors
        if (isSuppressibleError) {
          const silentError = new Error(error.message);
          Object.defineProperty(silentError, 'suppressLogging', { value: true });
          return Promise.reject(silentError);
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshing) {
      return this.refreshing;
    }

    this.refreshing = (async () => {
      try {
        const refreshToken = Cookies.get('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data.data;
        Cookies.set('accessToken', accessToken, { expires: 1/96 }); // 15 minutes

        return accessToken;
      } catch (error) {
        throw error;
      } finally {
        this.refreshing = null;
      }
    })();

    return this.refreshing;
  }

  // Auth endpoints
  async login(email: string, password: string) {
    try {
      const response = await this.client.post('/api/auth/login', { email, password });
      const { accessToken, refreshToken, user } = response.data.data;

      Cookies.set('accessToken', accessToken, { expires: 1/96 }); // 15 minutes
      Cookies.set('refreshToken', refreshToken, { expires: 7 }); // 7 days

      return { user };
    } catch (error: any) {
      // Crear un error completamente nuevo con mensaje amigable
      if (error.response?.status === 401) {
        // No usar el error original, crear uno completamente nuevo
        const newError: any = new Error('El correo electrónico o la contraseña son incorrectos. Si no tienes cuenta, regístrate primero.');
        newError.response = {
          status: 401,
          data: { message: 'El correo electrónico o la contraseña son incorrectos. Si no tienes cuenta, regístrate primero.' }
        };
        // Suprimir el log de consola del error original
        throw newError;
      }

      // Para otros errores de red
      if (error.code === 'ERR_NETWORK' || !error.response) {
        const newError = new Error('No se pudo conectar con el servidor. Por favor verifica tu conexión a internet.');
        throw newError;
      }

      throw error;
    }
  }

  async logout() {
    try {
      await this.client.post('/api/auth/logout');
    } catch (error) {
      // Ignorar errores de logout del backend (404, 401, etc.)
      // Lo importante es limpiar las cookies del cliente
      console.log('Logout request failed, but continuing with local cleanup');
    } finally {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
    }
  }

  async register(data: RegisterData) {
    const response = await this.client.post('/api/auth/register', data);
    return response.data;
  }

  // Google OAuth
  getGoogleOAuthURL(): string {
    return `${API_URL}/api/auth/google`;
  }

  // Handle OAuth callback (save tokens from URL params)
  handleOAuthCallback(accessToken: string, refreshToken: string) {
    Cookies.set('accessToken', accessToken, { expires: 1/96 }); // 15 minutes
    Cookies.set('refreshToken', refreshToken, { expires: 7 }); // 7 days
  }

  // Get current user
  async getCurrentUser() {
    const response = await this.client.get('/api/auth/profile');
    return response.data.data;
  }

  // Document upload
  async uploadDocument(file: File, onProgress?: (progress: number) => void) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post('/api/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(Math.round(progress));
        }
      },
    });

    return response.data;
  }

  // Chat endpoints
  async sendChatMessage(sessionId: string, message: string, documentIds?: string[]) {
    const response = await this.client.post('/api/chat/message', {
      sessionId,
      message,
      documentIds,
    });
    return response.data;
  }

  async createChatSession() {
    const response = await this.client.post('/api/chat/session');
    return response.data;
  }

  // Contact form
  async submitContactForm(data: ContactFormData) {
    const response = await this.client.post('/api/contact', data);
    return response.data;
  }

  // Quote request
  async requestQuote(data: QuoteRequestData) {
    const response = await this.client.post('/api/quotes', data);
    return response.data;
  }

  // Project management endpoints
  async getDashboardStats() {
    const response = await this.client.get('/api/projects/dashboard/stats');
    return response.data.data;
  }

  async getUserProjects() {
    const response = await this.client.get('/api/projects');
    return response.data.data;
  }

  async getProjectById(id: string) {
    const response = await this.client.get(`/api/projects/${id}`);
    return response.data.data;
  }

  async getProjectMembers(id: string) {
    const response = await this.client.get(`/api/projects/${id}/members`);
    return response.data.data;
  }

  async getProjectTasks(id: string) {
    const response = await this.client.get(`/api/projects/${id}/tasks`);
    return response.data.data;
  }

  async createProject(data: CreateProjectData) {
    const response = await this.client.post('/api/projects', data);
    return response.data.data;
  }

  async updateProject(id: string, data: UpdateProjectData) {
    const response = await this.client.put(`/api/projects/${id}`, data);
    return response.data.data;
  }

  async deleteProject(id: string) {
    await this.client.delete(`/api/projects/${id}`);
  }

  async createTask(projectId: string, data: CreateTaskData) {
    const response = await this.client.post(`/api/projects/${projectId}/tasks`, data);
    return response.data.data;
  }

  async updateTask(id: string, data: UpdateTaskData) {
    const response = await this.client.put(`/api/projects/tasks/${id}`, data);
    return response.data.data;
  }

  // Orders endpoints
  async getOrders(status?: string) {
    const response = await this.client.get('/api/orders', { params: { status } });
    return response.data.data;
  }

  async getOrderById(id: string) {
    const response = await this.client.get(`/api/orders/${id}`);
    return response.data.data;
  }

  async createOrder(data: CreateOrderData) {
    const response = await this.client.post('/api/orders', data);
    return response.data.data;
  }

  async cancelOrder(id: string) {
    const response = await this.client.post(`/api/orders/${id}/cancel`);
    return response.data;
  }

  // Deliverables endpoints
  async getDeliverables(status?: string, projectId?: string) {
    const response = await this.client.get('/api/deliverables', { params: { status, projectId } });
    return response.data.data;
  }

  async getDeliverableById(id: string) {
    const response = await this.client.get(`/api/deliverables/${id}`);
    return response.data.data;
  }

  async uploadDeliverable(data: UploadDeliverableData) {
    const response = await this.client.post('/api/deliverables', data);
    return response.data.data;
  }

  async approveDeliverable(id: string, comments?: string) {
    const response = await this.client.post(`/api/deliverables/${id}/approve`, { comments });
    return response.data;
  }

  async rejectDeliverable(id: string, comments: string) {
    const response = await this.client.post(`/api/deliverables/${id}/reject`, { comments });
    return response.data;
  }

  // Invoices endpoints
  async getInvoices(status?: string) {
    const response = await this.client.get('/api/invoices', { params: { status } });
    return response.data.data;
  }

  async getInvoiceById(id: string) {
    const response = await this.client.get(`/api/invoices/${id}`);
    return response.data.data;
  }

  async createInvoice(data: CreateInvoiceData) {
    const response = await this.client.post('/api/invoices', data);
    return response.data.data;
  }

  async payInvoice(id: string, paymentData: PayInvoiceData) {
    const response = await this.client.post(`/api/invoices/${id}/pay`, paymentData);
    return response.data;
  }

  async downloadInvoice(id: string) {
    const response = await this.client.get(`/api/invoices/${id}/download`);
    return response.data;
  }

  // Messages endpoints
  async getConversations() {
    const response = await this.client.get('/api/messages/conversations');
    return response.data.data;
  }

  async getConversationById(id: string) {
    const response = await this.client.get(`/api/messages/conversations/${id}`);
    return response.data.data;
  }

  async sendMessage(data: { conversationId: string; content: string; attachments?: any[] }) {
    const response = await this.client.post('/api/messages/send', data);
    return response.data.data;
  }

  async markConversationAsRead(id: string) {
    const response = await this.client.post(`/api/messages/conversations/${id}/read`);
    return response.data;
  }

  // Notifications endpoints
  async getNotifications(type?: string, unreadOnly?: boolean) {
    const response = await this.client.get('/api/notifications', { params: { type, unreadOnly } });
    return response.data.data;
  }

  async getUnreadNotificationsCount() {
    const response = await this.client.get('/api/notifications/unread-count');
    return response.data.data;
  }

  async markNotificationAsRead(id: string) {
    const response = await this.client.post(`/api/notifications/${id}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead() {
    const response = await this.client.post('/api/notifications/read-all');
    return response.data;
  }

  async deleteNotification(id: string) {
    const response = await this.client.delete(`/api/notifications/${id}`);
    return response.data;
  }

  async createNotification(data: {
    type: 'order' | 'project' | 'billing' | 'message' | 'system' | 'deliverable' | 'task';
    title: string;
    message: string;
    actionUrl?: string;
    metadata?: Record<string, any>;
    targetUserId?: string;
  }) {
    const response = await this.client.post('/api/notifications', data);
    return response.data;
  }

  // Generic methods
  get<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.client.get<T>(url, config);
  }

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.post<T>(url, data, config);
  }

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.put<T>(url, data, config);
  }

  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.patch<T>(url, data, config);
  }

  delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.client.delete<T>(url, config);
  }
}

export const api = new ApiClient();
export default api;
