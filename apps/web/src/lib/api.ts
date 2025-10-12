import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * API Client singleton
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

        // Handle 401 errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            if (typeof window !== 'undefined') {
              Cookies.remove('accessToken');
              Cookies.remove('refreshToken');
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
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
    const response = await this.client.post('/api/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data.data;

    Cookies.set('accessToken', accessToken, { expires: 1/96 }); // 15 minutes
    Cookies.set('refreshToken', refreshToken, { expires: 7 }); // 7 days

    return { user };
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

  async register(data: any) {
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
  async submitContactForm(data: any) {
    const response = await this.client.post('/api/contact', data);
    return response.data;
  }

  // Quote request
  async requestQuote(data: any) {
    const response = await this.client.post('/api/quotes', data);
    return response.data;
  }

  // Blog endpoints
  async getBlogPosts(params?: { page?: number; limit?: number; locale?: string }) {
    const response = await this.client.get('/api/blog/posts', { params });
    return response.data;
  }

  async getBlogPost(slug: string, locale?: string) {
    const response = await this.client.get(`/api/blog/posts/${slug}`, {
      params: { locale },
    });
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

  async createProject(data: any) {
    const response = await this.client.post('/api/projects', data);
    return response.data.data;
  }

  async updateProject(id: string, data: any) {
    const response = await this.client.put(`/api/projects/${id}`, data);
    return response.data.data;
  }

  async deleteProject(id: string) {
    await this.client.delete(`/api/projects/${id}`);
  }

  async createTask(projectId: string, data: any) {
    const response = await this.client.post(`/api/projects/${projectId}/tasks`, data);
    return response.data.data;
  }

  async updateTask(id: string, data: any) {
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

  async createOrder(data: any) {
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

  async uploadDeliverable(data: any) {
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

  async createInvoice(data: any) {
    const response = await this.client.post('/api/invoices', data);
    return response.data.data;
  }

  async payInvoice(id: string, paymentData: any) {
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

  delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.client.delete<T>(url, config);
  }
}

export const api = new ApiClient();
export default api;
