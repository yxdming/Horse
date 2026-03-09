import axios from 'axios';
import type {
  UserCreate,
  UserUpdate,
  DocumentCreate,
  DocumentUpdate,
  QAStrategy,
  MemoryCreate,
  MemoryUpdate,
  MemorySearchParams,
  DatabaseSourceCreate,
  GlossaryTermCreate,
  QuestionRequest,
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

// Auth APIs
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }).then(res => res.data),

  getCurrentUser: (token: string) =>
    api.get('/auth/me', { params: { token } }).then(res => res.data),
};

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

// Memory APIs
export const memoryApi = {
  getMemories: (params?: MemorySearchParams) =>
    api.get('/memory/', { params }).then(res => res.data),

  getMemory: (id: string) =>
    api.get(`/memory/${id}`).then(res => res.data),

  createMemory: (data: MemoryCreate) =>
    api.post('/memory/', data).then(res => res.data),

  updateMemory: (id: string, data: MemoryUpdate) =>
    api.put(`/memory/${id}`, data).then(res => res.data),

  deleteMemory: (id: string) =>
    api.delete(`/memory/${id}`).then(res => res.data),

  getCategories: () =>
    api.get('/memory/categories/list').then(res => res.data),

  getTypes: () =>
    api.get('/memory/types/list').then(res => res.data),

  getStats: () =>
    api.get('/memory/stats/summary').then(res => res.data),

  // Memory User Permission Management
  getMemoryUsers: () =>
    api.get('/memory/users/list').then(res => res.data),

  getMemoryUser: (id: string) =>
    api.get(`/memory/users/${id}`).then(res => res.data),

  createMemoryUser: (data: any) =>
    api.post('/memory/users/', data).then(res => res.data),

  updateMemoryUser: (id: string, data: any) =>
    api.put(`/memory/users/${id}`, data).then(res => res.data),

  deleteMemoryUser: (id: string) =>
    api.delete(`/memory/users/${id}`).then(res => res.data),

  // Memory Template Management
  getTemplates: () =>
    api.get('/memory/templates/list').then(res => res.data),

  getTemplate: (id: string) =>
    api.get(`/memory/templates/${id}`).then(res => res.data),

  createTemplate: (data: any) =>
    api.post('/memory/templates/', data).then(res => res.data),

  updateTemplate: (id: string, data: any) =>
    api.put(`/memory/templates/${id}`, data).then(res => res.data),

  deleteTemplate: (id: string) =>
    api.delete(`/memory/templates/${id}`).then(res => res.data),
};

// Questioning APIs
export const questioningApi = {
  // Database management
  getDatabases: () =>
    api.get('/questioning/databases/').then(res => res.data),

  createDatabase: (data: DatabaseSourceCreate) =>
    api.post('/questioning/databases/', data).then(res => res.data),

  updateDatabase: (id: string, data: any) =>
    api.put(`/questioning/databases/${id}`, data).then(res => res.data),

  deleteDatabase: (id: string) =>
    api.delete(`/questioning/databases/${id}`).then(res => res.data),

  testConnection: (id: string) =>
    api.post(`/questioning/databases/${id}/test`).then(res => res.data),

  // Glossary management
  getGlossaries: () =>
    api.get('/questioning/glossaries/').then(res => res.data),

  createGlossary: (data: GlossaryTermCreate) =>
    api.post('/questioning/glossaries/', data).then(res => res.data),

  updateGlossary: (id: string, data: any) =>
    api.put(`/questioning/glossaries/${id}`, data).then(res => res.data),

  deleteGlossary: (id: string) =>
    api.delete(`/questioning/glossaries/${id}`).then(res => res.data),

  searchGlossaries: (keyword: string) =>
    api.get(`/questioning/glossaries/search/${keyword}`).then(res => res.data),

  // Question history
  getHistories: (skip: number = 0, limit: number = 10) =>
    api.get('/questioning/history/', { params: { skip, limit } }).then(res => res.data),

  createHistory: (data: any) =>
    api.post('/questioning/history/', data).then(res => res.data),

  getQuestionStats: () =>
    api.get('/questioning/history/stats').then(res => res.data),

  // Question processing
  askQuestion: (data: QuestionRequest) =>
    api.post('/questioning/ask', data).then(res => res.data),

  // Dashboard stats
  getDashboardStats: () =>
    api.get('/questioning/stats/dashboard').then(res => res.data),
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
