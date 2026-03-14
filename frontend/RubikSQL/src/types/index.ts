export interface Connection {
  id: string;
  name: string;
  type: 'postgresql' | 'mysql' | 'sqlite';
  host?: string;
  user?: string;
  database?: string;
  kb_path?: string;
  kb_built?: boolean;
  created_at: string;
}

// =============================================================================
// QueryEvent Types (Backend Streaming Events)
// =============================================================================

/**
 * QueryEvent type for SSE streaming from backend
 *
 * Event Type Categories:
 * - Lifecycle: agent_start, agent_end, iteration, initial_messages
 * - Content: text, think, user_proxy (what the agent "says")
 * - Artifacts: sql, codeblock, autoviz (what the agent "creates")
 * - Process: tool_call, tool_result (how the agent "thinks")
 * - Data: result, table (query results)
 * - Attachments: file (extensible for future types)
 */
export type QueryEventType =
  // Lifecycle
  | "agent_start"
  | "agent_end"
  | "iteration"
  | "initial_messages"
  // Content
  | "text"
  | "think"
  | "user_proxy"
  // Artifacts
  | "sql"
  | "codeblock"
  | "autoviz"
  // Process
  | "tool_call"
  | "tool_result"
  // Data
  | "result"
  | "table"
  // Attachments
  | "file"
  // Legacy/compatibility
  | "error"
  | "thought"; // Old name for "think"

/**
 * QueryEvent from backend SSE streaming
 */
export interface QueryEvent {
  event: QueryEventType;
  data: Record<string, any>;
  hidden?: boolean;  // If true, don't display (e.g., initial_messages, iteration)
  metadata?: Record<string, any>;  // Debug info, timestamps
}

// =============================================================================
// OpenAI Compatible Message Types
// =============================================================================

export interface Session {
  id: string;
  database_id: string;
  title: string;
  query?: string;
  dialect?: string;
  created_at: string;
  updated_at: string;
  preview: string | null;
  message_count: number;
}

// =============================================================================
// OpenAI Compatible Message Types
// =============================================================================

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

/** Standard OpenAI message format for LLM communication */
export interface OpenAIMessage {
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string | null;
  reasoning_content?: string;  // Optional reasoning/thinking content
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

// =============================================================================
// Session Storage Types
// =============================================================================

/** Agent mode types */
export type AgentMode = 'flash' | 'auto' | 'heavy' | 'beta';

/** User profile information */
export interface UserProfile {
  user_id?: string;
}

/** Agent configuration */
export interface AgentConfig {
  mode: AgentMode;
  llm_args?: Record<string, any>;
  max_steps?: number;
}

/** Automatic visualization configuration */
export interface AutovizConfig {
  viz_type?: 'bar' | 'line' | 'pie' | 'radar' | 'kpi' | 'table';
  config?: Record<string, any>;
  summary?: string; // Summary of the data visualization
  chart_data?: Record<string, any>[]; // Filtered data for charts (without aggregation rows)
}

/** Agent workspace containing results */
export interface AgentWorkspace {
  final_sql?: string;
  final_answer?: string;
  final_data?: ExecutionResultData;
  autoviz?: AutovizConfig;
}

/** An agent that processes a user query */
export interface Agent {
  name: string;
  agent_run_index: number;  // Run index within turn (consecutive, for future parallelism support)
  agent_run_id?: string;
  config: AgentConfig;
  initial_messages: OpenAIMessage[];
  iterations: Iteration[];
  total_token_usage: TokenUsage;
  workspace: AgentWorkspace;
  total_elapsed_seconds: number;
  status: 'not_started' | 'pending' | 'streaming' | 'completed' | 'error';
  created_at?: string;
  completed_at?: string;
  hidden?: boolean;  // If true, the AgentCard should not be displayed in UI (defaults to false)
}

/** A turn representing one user interaction with multiple agent responses */
export interface Turn {
  turn_id: string;
  turn_index: number;  // Consecutive index within session
  user_query: UserQuery;
  agents: Agent[];  // Changed from Dict to List
  final_sql?: string;
  final_answer?: string;
  total_elapsed_seconds: number;
  feedback?: TurnFeedback;
  status: 'pending' | 'streaming' | 'completed' | 'error';
  error?: string;
  created_at: string;
  completed_at?: string;
}

/** Full session detail with turn history */
export interface SessionDetail {
  id: string;
  database_id: string;
  title: string;
  dialect?: string;
  created_at: string;
  updated_at: string;
  preview: string | null;
  turns: Turn[];
  messages?: Message[];  // UI messages derived from turns
}


/** 
 * User query input, faithful to RubikSQLExpUKFT inputs.
 * Maps to: question, context, schema, hints
 */
export interface UserQuery {
  question: string;                    // NL question text
  context?: Record<string, any>;       // Query context (user profile, time, etc.)
  schema?: any;                        // Desired SQL execution result schema
  hints?: string[];                    // Optional hints or notes
}

/** Token usage statistics (estimated as char/2.2 for now) */
export interface TokenUsage {
  input_tokens: number;   // Input tokens to LLM
  output_tokens: number;  // Output tokens from LLM
}

/** User feedback on agent response */
export type FeedbackType = 'like' | 'dislike' | null;

export interface TurnFeedback {
  type: FeedbackType;
  timestamp?: string;
  comment?: string;  // Optional user comment
}

/** Iteration/Turn status */
export type IterationStatus = 'pending' | 'streaming' | 'completed' | 'error';
export type TurnStatus = 'pending' | 'streaming' | 'completed' | 'error';

/**
 * Structured execution result data (parsed from ASCII table or JSON)
 * - Empty object {} for non-SQL tools
 * - Populated with schema/data for exec_sql/submit_sql tools
 */
export interface ExecutionResultData {
  schema?: string[];  // Column names
  data?: Record<string, any>[];  // List of dicts for each row
}

/**
 * An iteration represents a single LLM call within a turn.
 * Each iteration has its own delta_messages, token usage, and timing stats.
 */
export interface Iteration {
  iteration_id: string;
  iteration_index: number;           // 0-based index within the turn

  // Messages from this iteration
  delta_messages: OpenAIMessage[];

  // Tool execution data keyed by tool_call_id
  // - ALL tool calls have entries (initialized on tool_call event)
  // - exec_sql/submit_sql calls get populated with actual result data
  // - Other tool calls contain empty dict {}
  // Used for displaying tables in UI when restored from session
  tool_data: Record<string, ExecutionResultData>;

  // Metrics for this iteration
  token_usage: TokenUsage;
  elapsed_seconds: number;
  
  // Status
  status: IterationStatus;
  error?: string;
  
  // Timestamps
  created_at: string;
  completed_at?: string;
}


// =============================================================================
// UI Message Type (for rendering, derived from Iteration.delta_messages)
// =============================================================================

export interface Message {
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
  // UI specific fields (generated at runtime)
  id?: string;
  timestamp?: string;
  status?: 'thinking' | 'streaming' | 'completed' | 'error';
  // Turn/Iteration reference for feedback
  turnId?: string;
  iterationIndex?: number;
  // Agent name (for multi-agent beta mode)
  agentName?: string;
  metadata?: {
    execution_time?: number;
    sql?: string;
    columns?: string[];
    data?: any[][];
    rows?: number;
    thoughts?: string[];
    iteration?: number;
    elapsed?: number;
    error?: string;
    endMessage?: string;
    // Agent name for multi-agent beta mode
    agentName?: string;
    // Token usage (from iteration)
    token_usage?: TokenUsage;
    // Legacy support for AgentCard until fully refactored
    toolCalls?: Array<{
      id?: string;
      name: string;
      arguments: Record<string, any>;
      result?: string;
      executionResult?: any;
    }>;
    // New event types from multi-agent architecture
    autoviz?: AutovizConfig | any;  // Visualization config from autoviz event
    codeblocks?: Array<{  // Code blocks from codeblock events
      language: string;
      code: string;
    }>;
    files?: Array<{  // File attachments from file events
      name: string;
      url: string;
      type: string;
      size: number;
    }>;
  };
}


export interface SchemaNode {
  name: string;
  type: 'schema' | 'table' | 'column';
  children?: SchemaNode[];
  dataType?: string;
}

export interface QueryResult {
  columns: string[];
  rows: any[][];
  executionTime: number;
}
