import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface Document {
  id: string;
  name: string;
  filename: string;
  folder: string;
  size: string;
  sizeBytes: number;
  type: string;
  mimeType: string;
  favorite: boolean;
  tags: string[];
  summary?: string;
  keywords?: string[];
  entities?: string[];
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  name: string;
  count: number;
}

export interface DocumentStats {
  total: number;
  favorites: number;
  recent: number;
  trash: number;
  totalSize: number;
}

export interface SemanticSearchResult {
  id: string;
  name: string;
  folder: string;
  size: string;
  type: string;
  tags: string[];
  summary?: string;
  similarity: number;
  date: string;
}

type ViewType = 'all' | 'favorites' | 'recent' | 'trash' | 'folder' | 'settings';

export function useDocuments(view: ViewType = 'all', selectedFolder?: string) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {};

      if (view === 'favorites') {
        params.favorites = 'true';
      } else if (view === 'recent') {
        params.recent = 'true';
      } else if (view === 'trash') {
        params.trash = 'true';
      } else if (view === 'folder' && selectedFolder) {
        params.folder = selectedFolder;
      }

      const response = await api.get('/api/documents', { params });
      setDocuments(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      setError(err.response?.data?.message || 'Error al cargar documentos');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [view, selectedFolder]);

  const fetchFolders = useCallback(async () => {
    try {
      const response = await api.get('/api/documents/folders');
      setFolders(response.data.data || []);
    } catch (err) {
      console.error('Error fetching folders:', err);
      setFolders([]);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/api/documents/stats');
      setStats(response.data.data || null);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setStats(null);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    fetchFolders();
    fetchStats();
  }, []);

  const uploadDocument = useCallback(
    async (file: File, folder?: string, onProgress?: (progress: number) => void) => {
      const formData = new FormData();
      formData.append('file', file);
      if (folder) {
        formData.append('folder', folder);
      }

      try {
        const response = await api.post('/api/documents/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress?.(progress);
            }
          },
        });

        // Recargar documentos y estadísticas
        await Promise.all([fetchDocuments(), fetchFolders(), fetchStats()]);

        return response.data.data;
      } catch (err: any) {
        throw new Error(err.response?.data?.message || 'Error al subir documento');
      }
    },
    [fetchDocuments, fetchFolders, fetchStats]
  );

  const updateDocument = useCallback(
    async (id: string, updates: { filename?: string; folder?: string; is_favorite?: boolean }) => {
      try {
        await api.patch(`/api/documents/${id}`, updates);
        await Promise.all([fetchDocuments(), fetchFolders(), fetchStats()]);
      } catch (err: any) {
        throw new Error(err.response?.data?.message || 'Error al actualizar documento');
      }
    },
    [fetchDocuments, fetchFolders, fetchStats]
  );

  const deleteDocument = useCallback(
    async (id: string, pin: string, permanent: boolean = false) => {
      try {
        await api.delete(`/api/documents/${id}`, {
          params: {
            permanent: permanent ? 'true' : 'false',
            pin
          },
        });
        await Promise.all([fetchDocuments(), fetchFolders(), fetchStats()]);
      } catch (err: any) {
        throw new Error(err.response?.data?.message || 'Error al eliminar documento');
      }
    },
    [fetchDocuments, fetchFolders, fetchStats]
  );

  const restoreDocument = useCallback(
    async (id: string) => {
      try {
        await api.post(`/api/documents/${id}/restore`);
        await Promise.all([fetchDocuments(), fetchFolders(), fetchStats()]);
      } catch (err: any) {
        throw new Error(err.response?.data?.message || 'Error al restaurar documento');
      }
    },
    [fetchDocuments, fetchFolders, fetchStats]
  );

  const toggleFavorite = useCallback(
    async (id: string, currentFavorite: boolean) => {
      await updateDocument(id, { is_favorite: !currentFavorite });
    },
    [updateDocument]
  );

  const renameDocument = useCallback(
    async (id: string, newName: string) => {
      await updateDocument(id, { filename: newName });
    },
    [updateDocument]
  );

  const moveToFolder = useCallback(
    async (id: string, folder: string) => {
      await updateDocument(id, { folder });
    },
    [updateDocument]
  );

  const createFolder = useCallback(
    async (name: string) => {
      try {
        await api.post('/api/documents/folders', { name });
        await fetchFolders();
      } catch (err: any) {
        throw new Error(err.response?.data?.message || 'Error al crear carpeta');
      }
    },
    [fetchFolders]
  );

  const searchSemantic = useCallback(async (query: string): Promise<SemanticSearchResult[]> => {
    try {
      const response = await api.post('/api/documents/search/semantic', { query });
      return response.data.results || [];
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error en búsqueda semántica');
    }
  }, []);

  const explainDocument = useCallback(async (id: string): Promise<string> => {
    try {
      const response = await api.get(`/api/documents/${id}/explain`);
      return response.data.data.explanation || '';
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al explicar documento');
    }
  }, []);

  const explainSimilarity = useCallback(async (id: string, query: string, similarity: number): Promise<string> => {
    try {
      const response = await api.post(`/api/documents/${id}/explain-similarity`, { query, similarity });
      return response.data.data.explanation || '';
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al explicar similitud');
    }
  }, []);

  const searchDocuments = useCallback(
    async (query: string) => {
      try {
        const response = await api.get('/api/documents', {
          params: { search: query },
        });
        setDocuments(response.data.data || []);
      } catch (err: any) {
        console.error('Error searching documents:', err);
        setDocuments([]);
      }
    },
    []
  );

  return {
    documents,
    folders,
    stats,
    loading,
    error,
    uploadDocument,
    updateDocument,
    deleteDocument,
    restoreDocument,
    toggleFavorite,
    renameDocument,
    moveToFolder,
    createFolder,
    searchSemantic,
    explainDocument,
    explainSimilarity,
    searchDocuments,
    refetch: fetchDocuments,
  };
}
