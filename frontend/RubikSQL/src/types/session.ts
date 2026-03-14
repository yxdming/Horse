import { Message } from './index';

export interface SessionMetadata {
  id: string;
  database_id: string;
  title: string;
  query: string;
  dialect: string;
  created_at: string;
  updated_at: string;
  preview: string;
}

export interface StepStats {
  token_count?: number;
  generation_time?: number;
  execution_time?: number;
}

export interface StepArtifact {
  type: 'sql_result' | 'error' | 'other';
  columns?: string[];
  data?: any[][];
  error_message?: string;
  [key: string]: any;
}

export interface Step {
  step_id: string;
  message: Message; // Raw OpenAI message
  stats?: StepStats;
  artifact?: StepArtifact;
}

export interface Turn {
  turn_id: string;
  user_message: Message;
  steps: Step[];
}

export interface SessionData extends SessionMetadata {
  turns: Turn[];
}
