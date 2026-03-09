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

// Directory Mapping types
export interface DirectoryMapping {
  id: string;
  directory_name: string;
  directory_path: string;
  file_system: 'NFS' | 'S3' | 'LOCAL';
  last_import_time: string;
  operator: string;
}

export interface MappingCreate {
  directoryName: string;
  directoryPath: string;
  fileSystem: 'NFS' | 'S3' | 'LOCAL';
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
  importance: number;
  memory_type: string;
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

// Memory Template types
export interface MemoryTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  memory_type: string;
  default_importance: number;
  tags: string[];
  created_by: string;
  created_at: string;
}

export interface TemplateCreate {
  name: string;
  description: string;
  category: string;
  memory_type: string;
  default_importance: number;
  tags: string[];
}

export interface TemplateUpdate {
  name?: string;
  description?: string;
  category?: string;
  memory_type?: string;
  default_importance?: number;
  tags?: string[];
}

// Memory User Permission types
export interface MemoryUser {
  id: string;
  username: string;
  role: 'admin' | 'editor' | 'viewer';
  permissions: string[];
  memoryCount: number;
  lastAccess: string;
  created_at: string;
}

export interface MemoryUserCreate {
  username: string;
  role: 'admin' | 'editor' | 'viewer';
  permissions: string[];
}

export interface MemoryUserUpdate {
  role?: 'admin' | 'editor' | 'viewer';
  permissions?: string[];
}

// Questioning (BI) types
export interface DatabaseSource {
  id: string;
  name: string;
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  status: string;
  tableCount: number;
  lastSync: string;
  created_at: string;
  updated_at?: string;
}

export interface DatabaseSourceCreate {
  name: string;
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string;
  description?: string;
}

export interface DatabaseSourceUpdate {
  name?: string;
  type?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  description?: string;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  mapping: string;
  category: string;
  example: string;
  created_at: string;
  updated_at?: string;
}

export interface GlossaryTermCreate {
  term: string;
  definition: string;
  mapping: string;
  category: string;
  example: string;
}

export interface GlossaryTermUpdate {
  term?: string;
  definition?: string;
  mapping?: string;
  category?: string;
  example?: string;
}

export interface QuestionHistory {
  id: string;
  question: string;
  sql: string;
  result?: string;
  duration: number;
  status: string;
  database_name: string;
  confidence?: number;
  created_at: string;
}

export interface QuestionRequest {
  question: string;
  database_id: string;
}

export interface QuestionResponse {
  sql: string;
  explanation: string;
  confidence: number;
  glossaries: string[];
  estimated_rows?: number;
}

export interface QuestionStats {
  total_questions: number;
  success_count: number;
  error_count: number;
  success_rate: number;
  avg_duration: number;
  avg_confidence: number;
}
