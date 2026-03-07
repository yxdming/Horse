// User types
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'readonly';
  status: 'active' | 'inactive';
  created_at: string;
  last_login?: string;
}

export interface UserCreate {
  username: string;
  email: string;
  role: 'admin' | 'user' | 'readonly';
}

export interface UserUpdate {
  username?: string;
  email?: string;
  role?: 'admin' | 'user' | 'readonly';
  status?: 'active' | 'inactive';
}

// Knowledge types
export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  vectorized: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentCreate {
  title: string;
  content: string;
  category: string;
  tags?: string[];
}

export interface DocumentUpdate {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  similarity_score: number;
}

// Config types
export interface QAStrategy {
  temperature: number;
  max_tokens: number;
  top_k: number;
  similarity_threshold: number;
  system_prompt: string;
}

export interface SystemConfig {
  qa_strategy: QAStrategy;
}

// Stats types
export interface DashboardStats {
  users: {
    total_users: number;
    active_users: number;
    admin_count: number;
    user_count: number;
    readonly_count: number;
  };
  knowledge: {
    total_documents: number;
    vectorized_documents: number;
    categories: number;
    total_tags: number;
    category_distribution: Record<string, number>;
  };
  vectors: {
    total_vectors: number;
  };
  qa: {
    today_qa_count: number;
    avg_response_time: number;
    success_rate: number;
  };
}

export interface GrowthDataPoint {
  date: string;
  count: number;
}

// Memory types
export interface Memory {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  importance: number; // 1-5
  memory_type: string; // '长期记忆', '短期记忆', '工作记忆'
  vectorized: boolean;
  created_at: string;
  updated_at?: string;
  access_count: number;
  last_accessed?: string;
}

export interface MemoryCreate {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  importance?: number;
  memory_type?: string;
}

export interface MemoryUpdate {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  importance?: number;
  memory_type?: string;
  vectorized?: boolean;
}

export interface MemorySearchParams {
  skip?: number;
  limit?: number;
  category?: string;
  memory_type?: string;
  search?: string;
  min_importance?: number;
}

export interface MemoryListResponse {
  memories: Memory[];
  total: number;
}

export interface MemoryStats {
  total_memories: number;
  vectorized_memories: number;
  by_type: Record<string, number>;
  by_category: Record<string, number>;
  avg_importance: number;
  total_access: number;
  most_accessed: Memory[];
}

