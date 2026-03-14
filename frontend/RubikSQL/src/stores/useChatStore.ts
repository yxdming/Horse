import { create } from "zustand";
import {
  Message, Turn, Iteration, FeedbackType, AgentMode, Agent, AgentConfig, OpenAIMessage, IterationStatus, AutovizConfig
} from "@/types";
import { api } from "@/lib/api";
import { addTask, completeTaskByType } from "@/services/TaskQueueManager";
import i18n from "@/i18n/config";

interface ExecutionResult {
  columns: string[];
  data: any[][];
}

// Helper functions
const estimateTokens = (s: string | null | undefined): number =>
  s ? Math.ceil(s.length / 4) : 0;

const generateIterationId = (turnId: string, idx: number): string =>
  `${turnId}_iter_${idx}`;

/** Parse ASCII table or JSON from tool result to intermediate data format */
const parseToIntermediateData = (result: string | undefined): { schema: string[]; data: Record<string, any>[] } | null => {
  if (!result) return null;

  // Try JSON first
  try {
    const parsed = JSON.parse(result);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const schema = Object.keys(parsed[0]);
      return { schema, data: parsed };
    }
  } catch {
    // Not JSON
  }

  // Try ASCII Table
  try {
    const lines = result.trim().split("\n");
    const contentLines = lines.filter((l) => l.startsWith("|"));
    if (contentLines.length >= 2) {
      const parseLine = (line: string) =>
        line.split("|").map((s) => s.trim()).filter((s) => s !== "");
      const schema = parseLine(contentLines[0]);
      const data = contentLines.slice(1).map(parseLine).map(row => {
        const obj: Record<string, any> = {};
        schema.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
      });
      return { schema, data };
    }
  } catch {
    // Not ASCII Table
  }

  return null;
};

interface ChatState {
  messages: Record<string, Message[]>; // SessionID -> Messages
  turns: Record<string, Turn[]>;        // SessionID -> Turns
  isStreaming: boolean;
  executionCache: Record<string, ExecutionResult>; // Cache for tool execution results

  initializeSession: (sessionId: string) => void;
  fetchMessages: (sessionId: string) => Promise<void>;
  addMessage: (sessionId: string, message: Message) => void;
  updateLastMessage: (sessionId: string, updates: Partial<Message>) => void;
  updateMessageById: (
    sessionId: string,
    messageId: string,
    updates: Partial<Message>
  ) => void;
  sendMessage: (
    sessionId: string,
    connectionId: string,
    content: string,
    mode?: AgentMode
  ) => Promise<void>;
  sendStructMessage: (
    sessionId: string,
    databaseId: string,
    content: string,
    mode?: AgentMode
  ) => Promise<void>;
  setExecutionCache: (toolCallId: string, result: ExecutionResult) => void;

  // Turn management
  addTurn: (sessionId: string, question: string, hints?: string[], context?: Record<string, any>) => Promise<Turn | null>;
  addAgent: (sessionId: string, turnId: string, agentName: string, config?: AgentConfig) => Promise<Agent | null>;
  updateAgent: (sessionId: string, turnId: string, agentName: string, updates: Partial<Agent>) => Promise<void>;
  completeAgent: (sessionId: string, turnId: string, agentName: string, finalSql?: string, finalAnswer?: string) => Promise<void>;

  // Feedback management
  setTurnFeedback: (sessionId: string, turnId: string, feedback: FeedbackType, comment?: string) => void;

  // Turn management
  getTurn: (sessionId: string, turnId: string) => Turn | undefined;

  // Session management
  clearAllSessions: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: {},
  turns: {},
  isStreaming: false,
  executionCache: {},

  setExecutionCache: (toolCallId, result) =>
    set((state) => ({
      executionCache: {
        ...state.executionCache,
        [toolCallId]: result,
      },
    })),

  initializeSession: (sessionId: string) =>
    set((state) => {
      // Only initialize if not already exists
      if (state.messages[sessionId]) return state;
      return {
        messages: {
          ...state.messages,
          [sessionId]: [],
        },
        turns: {
          ...state.turns,
          [sessionId]: [],
        },
      };
    }),

  
  setTurnFeedback: (sessionId, turnId, feedbackType, comment) => {
    const feedback = {
      type: feedbackType,
      timestamp: new Date().toISOString(),
      comment,
    };

    // Update turns store
    set((state) => {
      const turns = state.turns[sessionId];
      if (!turns) return state;

      const updatedTurns = turns.map(turn => {
        if (turn.turn_id === turnId) {
          return { ...turn, feedback };
        }
        return turn;
      });

      return {
        turns: {
          ...state.turns,
          [sessionId]: updatedTurns,
        },
      };
    });

    // Persist to backend (only if feedback is not null)
    if (feedbackType !== null) {
      // On positive feedback, show background task for adding experience
      if (feedbackType === "like") {
        const turns = get().turns[sessionId] || [];
        const turn = turns.find(t => t.turn_id === turnId);

        // Get final_sql from the first agent's workspace (primary agent with SQL generation)
        let finalSql: string | undefined;
        let userQuestion: string | undefined;

        if (turn && turn.agents && turn.agents.length > 0) {
          // Check agents for final_sql
          for (const agent of turn.agents) {
            if (agent.workspace?.final_sql) {
              finalSql = agent.workspace.final_sql;
              break;
            }
          }
          userQuestion = turn.user_query?.question;
        }

        if (finalSql && userQuestion) {
          // Add task to queue (the backend handles the actual work)
          addTask(
            'add-experience',
            i18n.t('knowledge:experienceModal.title'),
            { question: userQuestion.slice(0, 50), sessionId, turnId }
          );
        }
      }

      // Persist feedback to backend
      api.setTurnFeedback(sessionId, turnId, feedbackType, comment)
        .then(() => {
          if (feedbackType === "like") {
            completeTaskByType('add-experience', { sessionId, turnId }, 'completed', i18n.t('knowledge:experienceAdded'));
          }
        })
        .catch((_err) => {
          console.warn("Failed to persist turn feedback to backend:", _err);
          if (feedbackType === "like") {
            completeTaskByType('add-experience', { sessionId, turnId }, 'error', i18n.t('knowledge:experienceModal.saveFailed'));
          }
        });
    }

    // Also update the first assistant message in this turn with the feedback info
    const messages = get().messages[sessionId] || [];
    const msgToUpdate = messages.find((m) => m.turnId === turnId && m.role === 'assistant');
    if (msgToUpdate?.id) {
      get().updateMessageById(sessionId, msgToUpdate.id, {
        metadata: {
          ...msgToUpdate.metadata,
          // Store feedback reference in metadata for UI access
        },
      });
    }
  },

  // Turn management
  addTurn: async (sessionId: string, question: string, hints?: string[], context?: Record<string, any>) => {
    const turn = await api.addTurn(sessionId, question, hints, context);
    if (turn) {
      set((state) => ({
        turns: {
          ...state.turns,
          [sessionId]: [...(state.turns[sessionId] || []), turn],
        },
      }));
    }
    return turn;
  },

  addAgent: async (sessionId: string, turnId: string, agentName: string, config?: AgentConfig) => {
    const agent = await api.addAgent(sessionId, turnId, agentName, config);
    if (agent) {
      set((state) => {
        const turns = state.turns[sessionId] || [];
        const updatedTurns = turns.map(turn => {
          if (turn.turn_id === turnId) {
            return {
              ...turn,
              agents: [...turn.agents, agent],  // Add to list
            };
          }
          return turn;
        });
        return {
          turns: {
            ...state.turns,
            [sessionId]: updatedTurns,
          },
        };
      });
    }
    return agent;
  },

  updateAgent: async (sessionId: string, turnId: string, agentName: string, updates: Partial<Agent>) => {
    await api.updateAgent(sessionId, turnId, agentName, updates);
    set((state) => {
      const turns = state.turns[sessionId] || [];
      const updatedTurns = turns.map(turn => {
        if (turn.turn_id === turnId) {
          // Find agent by name and update it
          const updatedAgents = turn.agents.map(agent => {
            if (agent.name === agentName) {
              return {
                ...agent,
                ...updates,
              };
            }
            return agent;
          });
          return {
            ...turn,
            agents: updatedAgents,
          };
        }
        return turn;
      });
      return {
        turns: {
          ...state.turns,
          [sessionId]: updatedTurns,
        },
      };
    });
  },

  completeAgent: async (sessionId: string, turnId: string, agentName: string, finalSql?: string, finalAnswer?: string) => {
    await api.completeAgent(sessionId, turnId, agentName, finalSql, finalAnswer);
    set((state) => {
      const turns = state.turns[sessionId] || [];
      const updatedTurns = turns.map(turn => {
        if (turn.turn_id === turnId) {
          // Find agent by name and update it
          const updatedAgents = turn.agents.map(agent => {
            if (agent.name === agentName) {
              return {
                ...agent,
                status: 'completed' as const,
                completed_at: new Date().toISOString(),
                workspace: {
                  ...agent.workspace,
                  ...(finalSql && { final_sql: finalSql }),
                  ...(finalAnswer && { final_answer: finalAnswer }),
                },
              };
            }
            return agent;
          });
          return {
            ...turn,
            agents: updatedAgents,
          };
        }
        return turn;
      });
      return {
        turns: {
          ...state.turns,
          [sessionId]: updatedTurns,
        },
      };
    });
  },

  // Turn management
  getTurn: (sessionId, turnId) => {
    const sessionTurns = get().turns[sessionId] || [];
    return sessionTurns.find((t) => t.turn_id === turnId);
  },

  // Session management
  clearAllSessions: () =>
    set({
      messages: {},
      turns: {},
      isStreaming: false,
      executionCache: {},
    }),

  fetchMessages: async (sessionId: string) => {
    // Don't fetch if session already exists in state (even if empty - it was initialized)
    // This check prevents overwriting messages that are being added in real-time
    const currentMessages = get().messages[sessionId];
    if (currentMessages !== undefined) {
      return;
    }

    try {
      // Fetch session
      const session = await api.getSession(sessionId);

      // Double-check after async operation to avoid race conditions
      const existingMessages = get().messages[sessionId];
      if (existingMessages !== undefined) {
        // Messages were added while we were fetching, don't overwrite
        return;
      }

      if (!session || !session.turns) {
        // No data, initialize empty
        set((state) => ({
          messages: { ...state.messages, [sessionId]: [] },
          turns: { ...state.turns, [sessionId]: [] },
        }));
        return;
      }

      // Use turns directly
      const restoredTurns: Turn[] = session.turns;

      // Derive UI messages from turns
      // IMPORTANT: Create ONE message per iteration (matching streaming behavior)
      const uiMessages: Message[] = [];
      for (const turn of restoredTurns) {
        // User message
        if (turn.user_query?.question) {
          uiMessages.push({
            id: `${turn.turn_id}_user`,
            role: "user",
            content: turn.user_query.question,
            status: "completed",
            turnId: turn.turn_id,
            timestamp: turn.created_at,
          });
        }

        // Iterate over each agent separately to preserve agent grouping
        for (const agent of turn.agents) {
          const agentName = agent.name;

          for (const iter of agent.iterations) {
            // Extract tool calls and text content from this iteration's delta_messages
            const iterToolCalls: Array<{id: string; name: string; arguments: any; result?: string}> = [];
            let iterTextContent = "";
            const iterThoughts: string[] = [];

            if (iter.delta_messages) {
              for (const msg of iter.delta_messages) {
                if (msg.role === "assistant" && msg.reasoning_content) {
                  // Extract reasoning/thinking content
                  iterThoughts.push(msg.reasoning_content);
                }
                if (msg.role === "assistant" && msg.content && !msg.tool_calls) {
                  // Regular text content
                  iterTextContent += msg.content;
                } else if (msg.role === "assistant" && msg.tool_calls) {
                  for (const tc of msg.tool_calls) {
                    iterToolCalls.push({
                      id: tc.id || "",
                      name: tc.function?.name || "",
                      arguments: tc.function?.arguments ? JSON.parse(tc.function.arguments) : {},
                    });
                  }
                } else if (msg.role === "tool" && msg.tool_call_id) {
                  const match = iterToolCalls.find(tc => tc.id === msg.tool_call_id);
                  if (match) match.result = msg.content || "";
                }
              }
            }

            // Find SQL from submit_sql tool call result (if any)
            const submitSqlCall = iterToolCalls.find(tc => tc.name === "submit_sql");
            const execSqlCall = iterToolCalls.find(tc => tc.name === "exec_sql");
            const sqlCall = submitSqlCall || execSqlCall;

            // Use tool_data (keyed by tool_call_id, list of dicts format)
            let resultData: any[][] | undefined;
            let resultColumns: string[] | undefined;

            // Get tool_data by tool_call_id
            if (iter.tool_data && sqlCall?.id) {
              const parsed = iter.tool_data[sqlCall.id];
              if (parsed && parsed.schema && parsed.data) {
                resultColumns = parsed.schema;
                // Convert list of dicts to array of arrays for UI
                resultData = parsed.data.map((row: Record<string, any>) =>
                  resultColumns!.map(col => row[col])
                );
              }
            }

            // Populate executionCache for all SQL tool calls in this iteration
            // This ensures SqlSections can find their data when rendering restored sessions
            for (const tc of iterToolCalls) {
              if ((tc.name === "exec_sql" || tc.name === "submit_sql") && tc.id && iter.tool_data?.[tc.id]) {
                const toolData = iter.tool_data[tc.id];
                if (toolData?.schema && toolData?.data) {
                  // Convert list of dicts to array of arrays for executionCache format
                  const cachedData = toolData.data.map((row: Record<string, any>) =>
                    toolData.schema!.map(col => row[col])
                  );
                  get().setExecutionCache(tc.id, { columns: toolData.schema, data: cachedData });
                }
              }
            }

            uiMessages.push({
              id: `${turn.turn_id}_${agentName}_iter_${iter.iteration_index}`,
              role: "assistant",
              content: iterTextContent,
              status: iter.status === "completed" ? "completed" : iter.status === "error" ? "error" : "completed",
              turnId: turn.turn_id,
              agentName,  // Include agentName for multi-agent grouping
              iterationIndex: iter.iteration_index,
              metadata: {
                iteration: iter.iteration_index,
                agentName,  // Also in metadata for redundancy
                thoughts: iterThoughts,
                toolCalls: iterToolCalls,
                // Only include SQL if this specific iteration has it (not from workspace)
                sql: submitSqlCall?.result || undefined,
                elapsed: iter.elapsed_seconds,
                columns: resultColumns,
                data: resultData,
                rows: resultData?.length,
                // Use actual output_tokens from iteration
                token_usage: iter.token_usage,
              },
              timestamp: iter.completed_at || iter.created_at,
            });
          }
        }

        // Handle error case with no iterations (check if all agents have 0 iterations)
        const hasAnyIterations = turn.agents.some(a => a.iterations && a.iterations.length > 0);
        if (!hasAnyIterations && turn.status === "error") {
          uiMessages.push({
            id: `${turn.turn_id}_assistant`,
            role: "assistant",
            content: turn.error || "An error occurred",
            status: "error",
            turnId: turn.turn_id,
            metadata: {},
            timestamp: turn.completed_at || turn.created_at,
          });
        }
      }

      set((state) => ({
        messages: { ...state.messages, [sessionId]: uiMessages },
        turns: { ...state.turns, [sessionId]: restoredTurns },
      }));
    } catch (e) {
      console.error("Failed to fetch messages:", e);
      // Initialize empty on error
      set((state) => ({
        messages: { ...state.messages, [sessionId]: [] },
        turns: { ...state.turns, [sessionId]: [] },
      }));
    }
  },

  addMessage: (sessionId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: [...(state.messages[sessionId] || []), message],
      },
    })),

  updateLastMessage: (sessionId, updates) =>
    set((state) => {
      const sessionMessages = state.messages[sessionId] || [];
      if (sessionMessages.length === 0) return state;

      const newMessages = [...sessionMessages];
      const lastIndex = newMessages.length - 1;
      newMessages[lastIndex] = { ...newMessages[lastIndex], ...updates };

      return {
        messages: {
          ...state.messages,
          [sessionId]: newMessages,
        },
      };
    }),

  updateMessageById: (sessionId, messageId, updates) =>
    set((state) => {
      const sessionMessages = state.messages[sessionId] || [];
      const index = sessionMessages.findIndex((msg) => msg.id === messageId);
      if (index === -1) {
        return state;
      }

      const updatedMessages = [...sessionMessages];
      updatedMessages[index] = { ...updatedMessages[index], ...updates };

      return {
        messages: {
          ...state.messages,
          [sessionId]: updatedMessages,
        },
      };
    }),

  sendMessage: async (sessionId, connectionId, content, mode) => {
    // This is the router - determine connection type and delegate
    // We need to import useAppStore to get connection type
    const { useAppStore } = await import("@/stores/useAppStore");
    const connection = useAppStore
      .getState()
      .connections.find((c) => c.id === connectionId);

    if (!connection) {
      console.error("Connection not found:", connectionId);
      return;
    }

    return get().sendStructMessage(sessionId, connectionId, content, mode);
  },

  sendStructMessage: async (sessionId, databaseId, content, mode) => {
    const { addMessage, updateMessageById } = get();

    // Create turn via API
    const turn = await get().addTurn(sessionId, content, [], {
      query_time: new Date().toISOString(),
    });
    if (!turn) {
      console.error("Failed to create turn");
      return;
    }

    const turnId = turn.turn_id;
    const isBetaMode = mode === "beta";

    // For non-beta mode, create a single agent upfront
    // For beta mode, agents will be created dynamically on agent_start events
    // Use "RubikSQL" as the default agent name for all modes
    let currentAgentName = isBetaMode ? "" : "RubikSQL";

    if (!isBetaMode) {
      const agent = await get().addAgent(sessionId, turnId, currentAgentName, {
        mode: mode || "auto",
      });
      if (!agent) {
        console.error("Failed to create agent");
        return;
      }
    }

    // Add user message
    addMessage(sessionId, {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: turn.created_at,
      turnId,
    });

    // ========================================================================
    // Per-agent state tracking (for beta mode, we track multiple agents)
    // ========================================================================
    interface AgentState {
      name: string;
      startTime: number;
      messageId: string;  // UI message ID for this agent
      iterationMessageIds: Record<number, string>;
      iterationData: Record<number, {
        id: string;
        startTime: number;
        deltaMessages: OpenAIMessage[];
        outputTokens: number;
        finalized?: boolean;
        intermediateData: Record<string, { schema?: string[]; data?: Record<string, any>[] }>;
      }>;
      lastIterationIndex: number;
      finalSql?: string;
      finalAnswer: string;
      finalData?: { schema: string[]; data: Record<string, any>[] };
      totalOutputTokens: number;
    }

    // Map from agent name to agent state
    const agentStates: Record<string, AgentState> = {};

    // For non-beta mode, initialize the single agent state
    if (!isBetaMode) {
      const messageId = `${Date.now()}-0-${Math.random().toString(36).slice(2, 6)}`;
      agentStates[currentAgentName] = {
        name: currentAgentName,
        startTime: Date.now(),
        messageId,
        iterationMessageIds: { 0: messageId },
        iterationData: {
          0: {
            id: generateIterationId(turnId, 0),
            startTime: Date.now(),
            deltaMessages: [],
            outputTokens: 0,
            intermediateData: {},
          },
        },
        lastIterationIndex: 0,
        finalAnswer: "",
        totalOutputTokens: 0,
      };

      // Create initial UI message
      addMessage(sessionId, {
        id: messageId,
        role: "assistant",
        content: "",
        status: "thinking",
        turnId,
        agentName: currentAgentName,
        iterationIndex: 0,
        metadata: { iteration: 0, thoughts: [], toolCalls: [] },
        timestamp: new Date().toISOString(),
      });
    }

    // Helper functions
    const getAgentState = (agentName?: string): AgentState | undefined => {
      const name = agentName || currentAgentName;
      return agentStates[name];
    };

    const getMessageById = (messageId: string) => {
      return get().messages[sessionId]?.find((msg) => msg.id === messageId);
    };

    const updateMetadata = (
      messageId: string,
      updater: (metadata: NonNullable<Message["metadata"]>) => NonNullable<Message["metadata"]>
    ) => {
      const currentMetadata = getMessageById(messageId)?.metadata || {};
      const nextMetadata = updater(currentMetadata);
      updateMessageById(sessionId, messageId, { metadata: nextMetadata });
    };

    /** Ensure an iteration exists for an agent and return its message ID */
    const ensureIteration = (agentName: string, iterationIndex: number): string => {
      const state = agentStates[agentName];
      if (!state) return "";

      const key = iterationIndex >= 0 ? iterationIndex : 0;
      if (!state.iterationMessageIds[key]) {
        // For beta mode, iteration 0 uses the agent's main messageId
        // For subsequent iterations, create new message IDs (though beta mock agents typically have 1-2 iterations)
        const messageId = key === 0 ? state.messageId : `${Date.now()}-${key}-${Math.random().toString(36).slice(2, 6)}`;
        state.iterationMessageIds[key] = messageId;

        state.iterationData[key] = {
          id: generateIterationId(turnId, key),
          startTime: Date.now(),
          deltaMessages: [],
          outputTokens: 0,
          intermediateData: {},
        };

        // Only create a new UI message if this is not the first iteration (which already has a message)
        if (key !== 0 || !isBetaMode) {
          // For non-beta mode with new iterations, add a new message
          if (key !== 0) {
            addMessage(sessionId, {
              id: messageId,
              role: "assistant",
              content: "",
              status: "thinking",
              turnId,
              agentName,
              iterationIndex: key,
              metadata: { iteration: key, thoughts: [], toolCalls: [] },
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
      return state.iterationMessageIds[key];
    };

    /** Finalize an iteration and persist to agent */
    const finalizeIteration = async (agentName: string, iterationIndex: number, error?: string) => {
      const state = agentStates[agentName];
      if (!state) return;

      const data = state.iterationData[iterationIndex];
      if (!data || data.finalized) return;

      data.finalized = true;

      // Gather delta messages
      const gatheredMessages: OpenAIMessage[] = [];
      let currentTextContent = "";

      for (const msg of data.deltaMessages) {
        if (msg.role === "assistant" && msg.content && !msg.tool_calls) {
          currentTextContent += msg.content;
        } else {
          if (currentTextContent) {
            gatheredMessages.push({ role: "assistant", content: currentTextContent });
            currentTextContent = "";
          }
          gatheredMessages.push(msg);
        }
      }
      if (currentTextContent) {
        gatheredMessages.push({ role: "assistant", content: currentTextContent });
      }

      const elapsedSeconds = (Date.now() - data.startTime) / 1000;

      const iteration: Iteration = {
        iteration_id: data.id,
        iteration_index: iterationIndex,
        delta_messages: gatheredMessages,
        tool_data: data.intermediateData,  // Always included (may be empty object)
        token_usage: { input_tokens: 0, output_tokens: data.outputTokens },
        elapsed_seconds: elapsedSeconds,
        status: (error ? "error" : "completed") as IterationStatus,
        error: error || undefined,
        created_at: new Date(data.startTime).toISOString(),
        completed_at: new Date().toISOString(),
      };

      // Persist iteration to agent via API
      try {
        await api.addIterationToAgent(sessionId, turnId, agentName, iteration);
      } catch (err) {
        console.warn("Failed to persist iteration to backend:", err);
      }

      // Update local state
      set((st) => {
        const turns = st.turns[sessionId] || [];
        const updatedTurns = turns.map(t => {
          if (t.turn_id === turnId) {
            const updatedAgents = t.agents.map(a => {
              if (a.name === agentName) {
                return { ...a, iterations: [...a.iterations, iteration] };
              }
              return a;
            });
            return { ...t, agents: updatedAgents };
          }
          return t;
        });
        return { turns: { ...st.turns, [sessionId]: updatedTurns } };
      });

      state.totalOutputTokens += data.outputTokens;
    };

    /** Finalize an agent (beta mode) */
    const finalizeAgent = async (agentName: string) => {
      const state = agentStates[agentName];
      if (!state) return;

      // Finalize any remaining iterations
      for (const key of Object.keys(state.iterationData)) {
        const idx = parseInt(key);
        const d = state.iterationData[idx];
        if (d && !d.finalized) {
          await finalizeIteration(agentName, idx);
        }
      }

      const totalElapsed = (Date.now() - state.startTime) / 1000;

      // Update the UI message to completed
      updateMessageById(sessionId, state.messageId, { status: "completed" });

      // Complete agent
      get().completeAgent(sessionId, turnId, agentName, state.finalSql, state.finalAnswer);
      get().updateAgent(sessionId, turnId, agentName, {
        status: "completed",
        total_token_usage: { input_tokens: 0, output_tokens: state.totalOutputTokens },
        total_elapsed_seconds: totalElapsed,
        workspace: {
          final_sql: state.finalSql,
          final_answer: state.finalAnswer,
          final_data: state.finalData,
        },
      });
    };

    set({ isStreaming: true });

    try {
      await api.chat(sessionId, databaseId, content, async (event, data) => {
        // ====================================================================
        // Beta mode: Handle agent_start/agent_end events
        // ====================================================================
        if (event === "agent_start" && isBetaMode) {
          const agentName = data.agent_name || `Agent-${data.agent_idx || 0}`;
          currentAgentName = agentName;

          // Create the agent via API
          const agent = await get().addAgent(sessionId, turnId, agentName, { mode: "beta" });
          if (!agent) {
            console.error(`Failed to create agent: ${agentName}`);
            return;
          }

          // Initialize agent state
          const messageId = `${Date.now()}-agent-${data.agent_idx || 0}-${Math.random().toString(36).slice(2, 6)}`;
          agentStates[agentName] = {
            name: agentName,
            startTime: Date.now(),
            messageId,
            iterationMessageIds: {},
            iterationData: {},
            lastIterationIndex: -1,
            finalAnswer: "",
            totalOutputTokens: 0,
          };

          // Create UI message for this agent
          addMessage(sessionId, {
            id: messageId,
            role: "assistant",
            content: "",
            status: "thinking",
            turnId,
            agentName,
            iterationIndex: 0,
            metadata: { agentName, thoughts: [], toolCalls: [] },
            timestamp: new Date().toISOString(),
          });

          return;
        }

        if (event === "agent_end" && isBetaMode) {
          const agentName = data.agent_name || currentAgentName;
          await finalizeAgent(agentName);
          return;
        }

        // ====================================================================
        // Get the current agent name (from event data or current context)
        // ====================================================================
        const eventAgentName = data?.agent_name || currentAgentName;
        const state = getAgentState(eventAgentName);

        if (!state) {
          // In beta mode, we might receive events before agent_start if there's a race condition
          // Just skip these events
          if (isBetaMode) return;
          console.warn(`No agent state for: ${eventAgentName}`);
          return;
        }

        // ====================================================================
        // Handle common events
        // ====================================================================
        if (event === "initial_messages") {
          get().updateAgent(sessionId, turnId, eventAgentName, {
            initial_messages: data.messages || [],
          });
          return;
        }

        if (event === "iteration") {
          const iterationIndex = typeof data?.iteration === "number" ? data.iteration : 0;
          state.lastIterationIndex = Math.max(state.lastIterationIndex, iterationIndex);
          const messageId = ensureIteration(eventAgentName, iterationIndex);

          if (data.status === "start") {
            updateMessageById(sessionId, messageId || state.messageId, { status: "thinking" });
          } else if (data.status === "end") {
            const iterData = state.iterationData[iterationIndex];
            if (iterData && !iterData.finalized) {
              await finalizeIteration(eventAgentName, iterationIndex, data.error);
            }
            updateMessageById(sessionId, messageId || state.messageId, {
              status: data.error ? "error" : "completed",
            });
            if (typeof data.duration === "number") {
              updateMetadata(messageId || state.messageId, (m) => ({ ...m, elapsed: data.duration }));
            }
          }
          return;
        }

        // Determine target iteration
        const targetIterationIndex = typeof data?.iteration === "number"
          ? data.iteration
          : state.lastIterationIndex >= 0 ? state.lastIterationIndex : 0;
        const messageId = ensureIteration(eventAgentName, targetIterationIndex) || state.messageId;
        const currentMessage = getMessageById(messageId);
        const iterData = state.iterationData[targetIterationIndex];

        if (!iterData) {
          // Ensure we have iteration data
          ensureIteration(eventAgentName, targetIterationIndex);
        }
        const safeIterData = state.iterationData[targetIterationIndex];

        if (event === "thought" || event === "think") {
          if (!data.step || !safeIterData) return;
          // Store thought in reasoning_content field for session persistence
          const thoughtMsg: OpenAIMessage = {
            role: "assistant",
            content: null,
            reasoning_content: data.step,
          };
          safeIterData.deltaMessages.push(thoughtMsg);
          safeIterData.outputTokens += estimateTokens(data.step);
          updateMetadata(messageId, (m) => ({
            ...m,
            thoughts: [...(m.thoughts || []), data.step],
          }));
          updateMessageById(sessionId, messageId, { status: "streaming" });
        } else if (event === "tool_call") {
          if (!safeIterData) return;

          // Initialize tool_data entry for ALL tool calls (will be populated when tool_result arrives)
          // Initialize tool_data entry for ALL tool calls as empty dict (will be populated for exec_sql/submit_sql)
          safeIterData.intermediateData[data.id] = {};

          const toolCallMsg: OpenAIMessage = {
            role: "assistant",
            content: null,
            tool_calls: [{
              id: data.id,
              type: "function",
              function: { name: data.name, arguments: JSON.stringify(data.arguments) },
            }],
          };
          safeIterData.deltaMessages.push(toolCallMsg);
          safeIterData.outputTokens += estimateTokens(JSON.stringify(data.arguments));
          updateMetadata(messageId, (m) => ({
            ...m,
            toolCalls: [...(m.toolCalls || []), { id: data.id, name: data.name, arguments: data.arguments }],
          }));
        } else if (event === "tool_result") {
          if (!safeIterData) return;
          const toolResultMsg: OpenAIMessage = {
            role: "tool",
            content: data.result,
            tool_call_id: data.id,
            name: data.name,
          };
          safeIterData.deltaMessages.push(toolResultMsg);
          safeIterData.outputTokens += estimateTokens(data.result);

          if ((data.name === "exec_sql" || data.name === "submit_sql") && data.id) {
            const parsed = parseToIntermediateData(data.result);
            // Update tool_data entry with parsed data (already initialized in tool_call handler)
            safeIterData.intermediateData[data.id] = parsed || { schema: [], data: [] };
          }

          updateMetadata(messageId, (m) => {
            const toolCalls = [...(m.toolCalls || [])];
            const idx = toolCalls.findIndex((tc) => tc.id === data.id);
            if (idx >= 0) {
              toolCalls[idx] = { ...toolCalls[idx], result: data.result };
            }
            return { ...m, toolCalls };
          });
        } else if (event === "user_proxy") {
          if (safeIterData) {
            safeIterData.deltaMessages.push({ role: "user", content: data.content });
          }
        } else if (event === "sql") {
          state.finalSql = data.code;
          updateMetadata(messageId, (m) => ({ ...m, sql: data.code }));
        } else if (event === "result") {
          if (data.columns && data.rows) {
            const schema = data.columns as string[];
            const rowsAsArrays = data.rows as any[][];
            const dataAsDicts = rowsAsArrays.map((row: any[]) => {
              const obj: Record<string, any> = {};
              schema.forEach((col, i) => { obj[col] = row[i]; });
              return obj;
            });
            state.finalData = { schema, data: dataAsDicts };
          }
          updateMetadata(messageId, (m) => ({
            ...m,
            rows: data.rows?.length || 0,
            columns: data.columns,
            data: data.rows,
          }));
          if (safeIterData && !safeIterData.finalized) {
            await finalizeIteration(eventAgentName, targetIterationIndex);
          }
        } else if (event === "text") {
          if (!safeIterData) return;
          const nextContent = (currentMessage?.content || "") + (data.content || "");
          state.finalAnswer = nextContent;
          safeIterData.outputTokens += estimateTokens(data.content);
          safeIterData.deltaMessages.push({ role: "assistant", content: data.content });
          updateMessageById(sessionId, messageId, { content: nextContent, status: "streaming" });
        } else if (event === "autoviz") {
          // Handle autoviz event from backend
          updateMetadata(messageId, (m) => ({
            ...m,
            autoviz: data.autoviz || data.chart_data,
          }));
          // Also update agent workspace with autoviz
          get().updateAgent(sessionId, turnId, eventAgentName, {
            workspace: {
              autoviz: data.autoviz,
            },
          });
        } else if (event === "codeblock") {
          // Handle codeblock event - add to metadata for display
          updateMetadata(messageId, (m) => ({
            ...m,
            codeblocks: [...(m.codeblocks || []), {
              language: data.language,
              code: data.code,
            }],
          }));
        } else if (event === "table") {
          // Handle table event (similar to result)
          if (data.columns && data.rows) {
            const schema = data.columns as string[];
            const rowsAsArrays = data.rows as any[][];
            const dataAsDicts = rowsAsArrays.map((row: any[]) => {
              const obj: Record<string, any> = {};
              schema.forEach((col, i) => { obj[col] = row[i]; });
              return obj;
            });
            state.finalData = { schema, data: dataAsDicts };
          }
          updateMetadata(messageId, (m) => ({
            ...m,
            rows: data.rows?.length || 0,
            columns: data.columns,
            data: data.rows,
          }));
        } else if (event === "file") {
          // Handle file event - add to metadata for display
          updateMetadata(messageId, (m) => ({
            ...m,
            files: [...(m.files || []), {
              name: data.name,
              url: data.url,
              type: data.type,
              size: data.size,
            }],
          }));
        } else if (event === "end") {
          if (safeIterData) {
            await finalizeIteration(eventAgentName, targetIterationIndex);
          }
          updateMessageById(sessionId, messageId, { status: "completed" });
          updateMetadata(messageId, (m) => ({ ...m, endMessage: data.message }));
        } else if (event === "error") {
          if (safeIterData) {
            await finalizeIteration(eventAgentName, targetIterationIndex, data.message);
          }
          updateMessageById(sessionId, messageId, { status: "error" });
          updateMetadata(messageId, (m) => ({ ...m, error: data.message }));
          get().updateAgent(sessionId, turnId, eventAgentName, {
            status: "error",
            completed_at: new Date().toISOString(),
          });
          set({ isStreaming: false });
        } else if (event === "agent_end") {
          // Handle agent_end event from new FrontEndAgentStream architecture
          try {
            const agentStatus = data.status || "success";
            const elapsed = data.elapsed || 0;
            const workspace = data.workspace || {};

            // Finalize any remaining iterations
            for (const key of Object.keys(state.iterationData)) {
              const idx = parseInt(key);
              const d = state.iterationData[idx];
              if (d && !d.finalized) {
                await finalizeIteration(eventAgentName, idx);
              }
            }

            // Update message status
            updateMessageById(sessionId, state.messageId, {
              status: agentStatus === "success" ? "completed" : "error",
            });

            // If backend computed autoviz, store it
            let autovizConfig: AutovizConfig | undefined;
            if (workspace.autoviz) {
              autovizConfig = workspace.autoviz;
              // Update metadata with autoviz
              updateMetadata(state.messageId, (m) => ({
                ...m,
                autoviz: autovizConfig,
              }));
            }

            // Complete the agent with workspace data
            get().completeAgent(
              sessionId,
              turnId,
              eventAgentName,
              workspace.final_sql,
              state.finalAnswer
            );

            get().updateAgent(sessionId, turnId, eventAgentName, {
              status: agentStatus === "success" ? "completed" : "error",
              total_elapsed_seconds: elapsed,
              workspace: workspace,
            });

            set({ isStreaming: false });
          } catch (error) {
            console.error(`[agent_end] Error processing agent_end:`, error);
            set({ isStreaming: false }); // Ensure streaming is disabled even on error
          }
        } else if (event === "done") {
          // For non-beta mode, finalize the single agent
          if (!isBetaMode) {
            // Finalize any remaining iterations
            for (const key of Object.keys(state.iterationData)) {
              const idx = parseInt(key);
              const d = state.iterationData[idx];
              if (d && !d.finalized) {
                await finalizeIteration(eventAgentName, idx);
              }
            }
            updateMessageById(sessionId, messageId, { status: "completed" });

            const totalElapsed = (Date.now() - state.startTime) / 1000;

            // Compute autoviz if we have final_data
            let autovizConfig: AutovizConfig | undefined;
            if (state.finalData && state.finalData.data.length > 0) {
              try {
                const vizResult = await api.computeAutoviz(content, state.finalData.data);
                autovizConfig = {
                  viz_type: vizResult.viz_type,
                  config: vizResult.config,
                  summary: vizResult.summary,
                  chart_data: vizResult.chart_data, // Include filtered chart data
                };
              } catch (err) {
                console.warn("Failed to compute autoviz:", err);
              }
            }

            get().completeAgent(sessionId, turnId, eventAgentName, state.finalSql, state.finalAnswer);
            get().updateAgent(sessionId, turnId, eventAgentName, {
              status: "completed",
              total_token_usage: { input_tokens: 0, output_tokens: state.totalOutputTokens },
              total_elapsed_seconds: totalElapsed,
              workspace: {
                final_sql: state.finalSql,
                final_answer: state.finalAnswer,
                final_data: state.finalData,
                autoviz: autovizConfig,
              },
            });
          }
          // For beta mode, agents are finalized on agent_end events

          set({ isStreaming: false });
        }
      }, mode);
    } catch (error) {
      console.error("Streaming error:", error);
      set({ isStreaming: false });
      // Complete current agent with error
      if (currentAgentName) {
        get().updateAgent(sessionId, turnId, currentAgentName, {
          status: "error",
          completed_at: new Date().toISOString(),
        });
      }
    }
  },

}));

