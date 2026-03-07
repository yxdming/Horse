import axios from 'axios';
import type {
  UserCreate,
  UserUpdate,
  DocumentCreate,
  DocumentUpdate,
  QAStrategy
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'An error occurred';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

// User APIs
export const userApi = {
  getUsers: (params?: { skip?: number; limit?: number; search?: string; role?: string; status?: string }) =>
    api.get('/users/', { params }).then(res => res.data),

  getUser: (id: string) =>
    api.get(`/users/${id}`).then(res => res.data),

  createUser: (data: UserCreate) =>
    api.post('/users/', data).then(res => res.data),

  updateUser: (id: string, data: UserUpdate) =>
    api.put(`/users/${id}`, data).then(res => res.data),

  deleteUser: (id: string) =>
    api.delete(`/users/${id}`).then(res => res.data),

  updateLogin: (id: string) =>
    api.post(`/users/${id}/login`).then(res => res.data),
};

// Knowledge APIs
export const knowledgeApi = {
  getDocuments: (params?: { skip?: number; limit?: number; category?: string; search?: string }) =>
    api.get('/knowledge/', { params }).then(res => res.data),

  getDocument: (id: string) =>
    api.get(`/knowledge/${id}`).then(res => res.data),

  createDocument: (data: DocumentCreate) =>
    api.post('/knowledge/', data).then(res => res.data),

  updateDocument: (id: string, data: DocumentUpdate) =>
    api.put(`/knowledge/${id}`, data).then(res => res.data),

  deleteDocument: (id: string) =>
    api.delete(`/knowledge/${id}`).then(res => res.data),

  getCategories: () =>
    api.get('/knowledge/categories').then(res => res.data),

  getTags: () =>
    api.get('/knowledge/tags').then(res => res.data),

  semanticSearch: (query: string, topK: number = 5, category?: string) =>
    api.post('/knowledge/search/semantic', null, {
      params: { query, top_k: topK, category }
    }).then(res => res.data),

  batchImport: (documents: any[]) =>
    api.post('/knowledge/batch/import', documents).then(res => res.data),

  rebuildVectors: () =>
    api.post('/knowledge/vectors/rebuild').then(res => res.data),
};

// Stats APIs
export const statsApi = {
  getDashboard: () =>
    api.get('/stats/dashboard').then(res => res.data),

  getUserGrowth: (days: number = 30) =>
    api.get('/stats/user-growth', { params: { days } }).then(res => res.data),

  getQAStats: (days: number = 7) =>
    api.get('/stats/qa-stats', { params: { days } }).then(res => res.data),

  getCategoryDistribution: () =>
    api.get('/stats/category-distribution').then(res => res.data),
};

// Config APIs
export const configApi = {
  getConfig: () =>
    api.get('/config/').then(res => res.data),

  getQAStrategy: () =>
    api.get('/config/qa-strategy').then(res => res.data),

  updateQAStrategy: (data: Partial<QAStrategy>) =>
    api.put('/config/qa-strategy', data).then(res => res.data),

  resetQAStrategy: () =>
    api.post('/config/qa-strategy/reset').then(res => res.data),
};

export default api;
