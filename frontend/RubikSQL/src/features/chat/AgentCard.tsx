import { useState, useEffect, useMemo } from "react";
import { Message, FeedbackType, AutovizConfig } from "@/types";
import { cn } from "@/lib/utils";
import {
  Bot,
  Terminal,
  Table as TableIcon,
  CheckCircle2,
  XCircle,
  Loader2,
  Wrench,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  Edit3,
} from "lucide-react";
import { Markdown } from "./Markdown";
import { useTranslation } from "react-i18next";
import { CodeEditor } from "@/components/ui/CodeEditor";
import { AutoVisualizer } from "@/components/ui/AutoVisualizer";
import { useChatStore } from "@/stores/useChatStore";
import { useAppStore } from "@/stores/useAppStore";
import { api } from "@/lib/api";

import "katex/dist/katex.min.css";

interface ToolCallInfo {
  id?: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: string;
  executionResult?: unknown;
}

interface AgentCardProps {
  messages: Message[];
  sessionId?: string;
  turnId?: string;
  databaseId?: string;
  question?: string; // User's question for autoviz
  agentName?: string; // Agent name for multi-agent display
}

// Helper to parse ASCII table or JSON
const parseResult = (result: string | undefined) => {
  if (!result) return null;

  // Try JSON first
  try {
    const parsed = JSON.parse(result);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const columns = Object.keys(parsed[0]);
      const data = parsed.map((row: Record<string, unknown>) => Object.values(row));
      return { columns, data };
    }
  } catch (e) {
    // Not JSON
  }

  // Try ASCII Table
  try {
    const lines = result.trim().split("\n");
    const contentLines = lines.filter((l) => l.startsWith("|"));
    if (contentLines.length >= 2) {
      const parseLine = (line: string) =>
        line
          .split("|")
          .map((s) => s.trim())
          .filter((s) => s !== "");
      const columns = parseLine(contentLines[0]);
      const data = contentLines.slice(1).map(parseLine);
      return { columns, data };
    }
  } catch (e) {
    // Not ASCII Table
  }

  return null;
};

// Tool Call Display Component
const ToolCallItem = ({ toolCall }: { toolCall: ToolCallInfo }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isError = toolCall.result?.includes("[ERROR]");

  return (
    <div
      className={cn(
        "border rounded-lg mb-2 overflow-hidden",
        isError ? "border-red-200" : "border-neutral-200"
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 transition-colors text-left",
          isError
            ? "bg-red-50 hover:bg-red-100"
            : "bg-neutral-50 hover:bg-neutral-100"
        )}
      >
        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Wrench
          size={14}
          className={isError ? "text-red-500" : "text-blue-500"}
        />
        <span
          className={cn(
            "text-sm font-medium",
            isError ? "text-red-700" : "text-neutral-700"
          )}
        >
          {toolCall.name}
        </span>
        {toolCall.result &&
          (isError ? (
            <div className="ml-auto text-xs font-bold text-red-600 px-2 py-0.5 bg-red-100 rounded-full">
              ERROR
            </div>
          ) : (
            <CheckCircle2 size={12} className="text-green-500 ml-auto" />
          ))}
      </button>
      {isExpanded && (
        <div className="p-3 text-xs space-y-2">
          <div>
            <div className="text-neutral-500 mb-1">Arguments:</div>
            <CodeEditor
              value={JSON.stringify(toolCall.arguments, null, 2)}
              language="json"
              editable={false}
              dark={true}
              minHeight="80px"
              className="border-neutral-800"
            />
          </div>
          {toolCall.result && (
            <div>
              <div className="text-neutral-500 mb-1">Result:</div>
              <CodeEditor
                value={toolCall.result}
                language="text"
                editable={false}
                dark={!isError}
                minHeight="80px"
                className={
                  isError
                    ? "border-red-200"
                    : "border-neutral-800"
                }
              />
            </div>
          )}
          {typeof toolCall.executionResult === 'string' && toolCall.executionResult && (
            <div>
              <div className="text-neutral-500 mb-1">Execution Result:</div>
              <CodeEditor
                value={toolCall.executionResult}
                language="text"
                editable={false}
                dark={true}
                minHeight="80px"
                className="border-neutral-800"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Threshold for auto-folding large result tables
const INTERMEDIATE_RESULT_FOLD_THRESHOLD = 8;

const SqlSection = ({
  sql,
  data,
  columns,
  toolCall,
  executionCache,
  question,
  showViz,
  autovizConfig,
  isCompleted,
}: {
  sql?: string;
  data?: unknown[][];
  columns?: string[];
  toolCall?: ToolCallInfo;
  executionCache: Record<string, unknown>;
  question?: string;
  showViz?: boolean;
  autovizConfig?: AutovizConfig;
  isCompleted?: boolean;
}) => {
  const { t } = useTranslation();
  const [isSqlOpen, setIsSqlOpen] = useState(false);

  // Resolve data from cache if not provided directly
  let displayData = data;
  let displayColumns = columns;

  if (!displayData && toolCall) {
    if (toolCall.id && executionCache[toolCall.id]) {
      const cached = executionCache[toolCall.id] as { columns?: string[]; data?: unknown[][] };
      displayColumns = cached.columns;
      displayData = cached.data;
    } else if (toolCall.result) {
      const parsed = parseResult(toolCall.result);
      if (parsed) {
        displayColumns = parsed.columns;
        displayData = parsed.data;
      }
    }
  }

  // Convert array-based data to object-based format for AutoVisualizer
  const objectData = useMemo(() => {
    if (!displayData || !displayColumns) return null;
    return displayData.map((row: unknown[]) => {
      const obj: Record<string, unknown> = {};
      displayColumns?.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  }, [displayData, displayColumns]);

  const rowCount = displayData?.length || 0;

  // Default to folded if intermediate result has more than threshold rows
  const [isTableOpen, setIsTableOpen] = useState(() => {
    // For final results (showViz=true), always default to open
    if (showViz) return true;
    // For intermediate results, fold if more than threshold rows
    return rowCount <= INTERMEDIATE_RESULT_FOLD_THRESHOLD;
  });

  return (
    <div className="space-y-6 mt-4">
      {/* SQL Section - only show when not in visualization mode */}
      {!showViz && (
        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setIsSqlOpen(!isSqlOpen)}
            className="w-full flex items-center justify-between px-4 py-2 bg-neutral-50 hover:bg-neutral-100 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
              <Terminal size={14} className="text-neutral-500" />
              <span>{t("agent.sqlQuery", "SQL Query")}</span>
            </div>
            {isSqlOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {isSqlOpen && (
            <div className="border-t border-neutral-200">
              <CodeEditor
                value={sql || t("agent.no_sql")}
                language="sql"
                editable={false}
                dark={true}
                minHeight="80px"
                className="!rounded-none border-neutral-800"
              />
            </div>
          )}
        </div>
      )}

      {/* Thick separator line when agent is completed */}
      {isCompleted && (
        <hr className="border-t-4 border-neutral-200 my-6" />
      )}

      {/* Data Visualization Section - only show when agent is completed with final_data and autoviz */}
      {showViz && objectData && question && autovizConfig ? (
        objectData.length > 0 ? (
          <AutoVisualizer
            question={question}
            data={objectData as Record<string, any>[]}
            initialVizResult={{
              viz_type: autovizConfig.viz_type || 'table',
              config: autovizConfig.config || {},
              summary: autovizConfig.summary || '',
              chart_data: autovizConfig.chart_data, // Pass filtered chart data
              fallback_reason: undefined,
            }}
          />
        ) : (
          // Show empty table when there are no results (foldable)
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setIsTableOpen(!isTableOpen)}
              className="w-full flex items-center justify-between px-4 py-2 bg-neutral-50 hover:bg-neutral-100 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                <TableIcon size={14} className="text-neutral-500" />
                <span>{t("agent.sqlResult", "SQL Result")}</span>
                <span className="text-xs text-neutral-400 font-normal">({rowCount} {t("agent.rows", "rows")})</span>
              </div>
              {isTableOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {isTableOpen && (
              <div className="border-t border-neutral-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                      <tr>
                        {displayColumns?.map((col: string, i: number) => (
                          <th key={i} className="px-4 py-2 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      <tr>
                        <td
                          colSpan={displayColumns?.length || 1}
                          className="px-4 py-8 text-center text-neutral-400 text-sm italic"
                        >
                          {t("agent.no_data", "No data returned")}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        // Regular table display (foldable)
        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setIsTableOpen(!isTableOpen)}
            className="w-full flex items-center justify-between px-4 py-2 bg-neutral-50 hover:bg-neutral-100 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
              <TableIcon size={14} className="text-neutral-500" />
              <span>{t("agent.sqlResult", "SQL Result")}</span>
              <span className="text-xs text-neutral-400 font-normal">({rowCount} {t("agent.rows", "rows")})</span>
            </div>
            {isTableOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {isTableOpen && (
            <div className="border-t border-neutral-200">
              <div className="overflow-x-auto">
                {displayData ? (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                      <tr>
                        {displayColumns?.map((col: string, i: number) => (
                          <th key={i} className="px-4 py-2 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {displayData.map((row: unknown[], i: number) => (
                        <tr key={i} className="hover:bg-neutral-50/50">
                          {row.map((cell, j) => (
                            <td
                              key={j}
                              className="px-4 py-2 whitespace-nowrap text-neutral-700"
                            >
                              {String(cell ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-neutral-400 text-sm">
                    {t("agent.no_data")}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Feedback Button Component
const FeedbackButtons = ({
  sessionId,
  turnId,
  isCompleted,
  databaseId,
  userQuestion,
  finalSql,
}: {
  sessionId?: string;
  turnId?: string;
  isCompleted: boolean;
  databaseId?: string;
  userQuestion?: string;
  finalSql?: string;
}) => {
  const { t } = useTranslation();
  const { setTurnFeedback, getTurn } = useChatStore();
  const { openAddExperienceWithData } = useAppStore();
  
  // Get current feedback from turn
  const turn = sessionId && turnId ? getTurn(sessionId, turnId) : undefined;
  const currentFeedback = turn?.feedback?.type || null;
  
  // Feedback is locked once set (not null)
  const isLocked = currentFeedback !== null;
  
  // Can edit if we have database, question, and SQL
  const canEdit = !!databaseId && !!userQuestion && !!finalSql;
  
  if (!sessionId || !turnId || !isCompleted) return null;

  const handleFeedback = (type: FeedbackType) => {
    // Don't allow changes if feedback is already locked
    if (isLocked) return;
    setTurnFeedback(sessionId, turnId, type);
  };

  const handleEdit = () => {
    if (!canEdit) return;
    openAddExperienceWithData(databaseId!, userQuestion!, finalSql!, true);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleFeedback("like")}
        disabled={isLocked && currentFeedback !== "like"}
        className={cn(
          "p-1.5 rounded-md transition-all",
          currentFeedback === "like"
            ? "bg-green-100 text-green-600 cursor-default"
            : isLocked
            ? "text-neutral-300 cursor-not-allowed"
            : "hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600"
        )}
        title={isLocked 
          ? t("agent.feedback.locked", "Feedback already submitted")
          : t("agent.feedback.like", "Good response")}
      >
        <ThumbsUp size={14} className={currentFeedback === "like" ? "fill-current" : ""} />
      </button>
      <button
        onClick={() => handleFeedback("dislike")}
        disabled={isLocked && currentFeedback !== "dislike"}
        className={cn(
          "p-1.5 rounded-md transition-all",
          currentFeedback === "dislike"
            ? "bg-red-100 text-red-600 cursor-default"
            : isLocked
            ? "text-neutral-300 cursor-not-allowed"
            : "hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600"
        )}
        title={isLocked
          ? t("agent.feedback.locked", "Feedback already submitted")
          : t("agent.feedback.dislike", "Bad response")}
      >
        <ThumbsDown size={14} className={currentFeedback === "dislike" ? "fill-current" : ""} />
      </button>
      {canEdit && (
        <button
          onClick={handleEdit}
          className={cn(
            "p-1.5 rounded-md transition-all",
            "hover:bg-blue-100 text-neutral-400 hover:text-blue-600"
          )}
          title={t("agent.feedback.edit", "Edit & save as experience")}
        >
          <Edit3 size={14} />
        </button>
      )}
    </div>
  );
};

export const AgentCard = ({ messages, sessionId, turnId, databaseId, question, agentName }: AgentCardProps) => {
  const { t } = useTranslation();
  const { executionCache, setExecutionCache, getTurn } = useChatStore();

  // Debug mode state
  const [debugMode, setDebugMode] = useState(false);
  useEffect(() => {
    api.getConfig().then((cfg) => {
      setDebugMode(cfg.app.debug || false);
    }).catch(() => {
      setDebugMode(false);
    });
  }, []);

  // Get turn status to check for turn-level errors
  const turn = sessionId && turnId ? getTurn(sessionId, turnId) : undefined;

  // Check if agent should be hidden (defaults to false if property is missing)
  const isHidden = turn?.agents?.[0]?.hidden === true;

  // Don't render the card if agent is hidden
  if (isHidden) {
    return null;
  }

  // Determine display name - use prop or derive from messages
  const displayAgentName = agentName || messages[0]?.agentName || messages[0]?.metadata?.agentName;

  const turnError = turn?.error;
  const turnStatus = turn?.status;

  const message = useMemo(() => {
    if (!messages || messages.length === 0) return {} as Message;
    const lastMsg = messages[messages.length - 1];
    return {
      ...lastMsg,
      metadata: {
        ...lastMsg.metadata,
        toolCalls: messages.flatMap((m) => m.metadata?.toolCalls || []),
        thoughts: messages.flatMap((m) => m.metadata?.thoughts || []),
        elapsed: messages.reduce((acc, m) => {
          if (typeof m.metadata?.elapsed === "number") {
            return acc + m.metadata.elapsed;
          }
          if (typeof m.metadata?.execution_time === "number") {
            return acc + m.metadata.execution_time;
          }
          return acc;
        }, 0),
      },
    };
  }, [messages]);

  const { status, metadata } = message;

  const toolCalls = (metadata?.toolCalls || []) as ToolCallInfo[];

  // Cache execution results
  useEffect(() => {
    toolCalls.forEach((tc) => {
      if (
        (tc.name === "exec_sql" || tc.name === "submit_sql") &&
        tc.result &&
        tc.id
      ) {
        if (!executionCache[tc.id]) {
          const parsed = parseResult(tc.result);
          if (parsed) {
            setExecutionCache(tc.id, parsed);
          }
        }
      }
    });
  }, [toolCalls, executionCache, setExecutionCache]);

  const sqlTool = toolCalls.find(
    (tc) => tc.name === "submit_sql" || tc.name === "exec_sql"
  );
  const hasSQL = !!sqlTool;

  const thoughts = (metadata?.thoughts || []) as string[];
  const lastToolCall = toolCalls[toolCalls.length - 1];
  const hasToolError = Boolean(
    lastToolCall &&
      (lastToolCall.result?.includes("[ERROR]") ||
        (typeof lastToolCall.executionResult === "string" &&
          lastToolCall.executionResult.includes("[ERROR]")))
  );
  const hasMetadataError = Boolean(metadata?.error);
  const hasTurnError = Boolean(turnError || turnStatus === "error");
  const explicitStatus = status || "completed";
  const isThinking = explicitStatus === "thinking";
  const isStreaming = explicitStatus === "streaming";
  const { isStreaming: storeIsStreaming } = useChatStore();
  const isEnd = turn?.status === "completed" && !turn.agents?.some(a => a.workspace?.final_sql);  // End signal: query was not NL2SQL, no SQL generated
  const isErrored = storeIsStreaming
    ? false
    : !isEnd && (explicitStatus === "error" || hasToolError || hasMetadataError || hasTurnError);
  const isCompleted = !isErrored && !isEnd && explicitStatus === "completed";

  // Get agent workspace for final_data and autoviz
  const agentWorkspace = turn?.agents?.[0]?.workspace;
  const finalData = agentWorkspace?.final_data;
  const autovizConfig = agentWorkspace?.autoviz;

  // Convert finalData to object-based format for AutoVisualizer
  const finalObjectData = useMemo(() => {
    if (!finalData?.data || !finalData?.schema) return null;
    return finalData.data.map((row: Record<string, any>) => row);
  }, [finalData]);

  type StatusVariant = "inProgress" | "completed" | "error" | "end";
  const statusVariant: StatusVariant = isErrored
    ? "error"
    : isEnd
    ? "end"
    : isCompleted
    ? "completed"
    : "inProgress";
  const statusStyles: Record<
    StatusVariant,
    { icon: string; label: string; badge: string }
  > = {
    inProgress: {
      icon: "text-blue-500",
      label: "text-blue-700",
      badge: "bg-blue-50 border-blue-100 text-blue-700",
    },
    completed: {
      icon: "text-green-600",
      label: "text-green-700",
      badge: "bg-green-50 border-green-100 text-green-700",
    },
    error: {
      icon: "text-red-500",
      label: "text-red-700",
      badge: "bg-red-50 border-red-100 text-red-700",
    },
    end: {
      icon: "text-neutral-500",
      label: "text-neutral-600",
      badge: "bg-neutral-50 border-neutral-200 text-neutral-600",
    },
  };

  const statusLabel =
    statusVariant === "completed"
      ? t("agent.status.responded")
      : statusVariant === "error"
      ? t("agent.status.failed")
      : statusVariant === "end"
      ? t("agent.status.ended")
      : t("agent.status.responding");

  const currentStatusStyle = statusStyles[statusVariant];

  const renderStatusIcon = (additionalClasses = "", size = 14) => {
    if (statusVariant === "inProgress") {
      return (
        <Loader2
          size={size}
          className={cn(
            "animate-spin",
            currentStatusStyle.icon,
            additionalClasses
          )}
        />
      );
    }
    if (statusVariant === "completed") {
      return (
        <CheckCircle2
          size={size}
          className={cn(currentStatusStyle.icon, additionalClasses)}
        />
      );
    }
    if (statusVariant === "end") {
      return (
        <MoreHorizontal
          size={size}
          className={cn(currentStatusStyle.icon, additionalClasses)}
        />
      );
    }
    return (
      <XCircle
        size={size}
        className={cn(currentStatusStyle.icon, additionalClasses)}
      />
    );
  };

  const StatusPill = () => (
    <div
      className={cn(
        "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
        currentStatusStyle.badge
      )}
    >
      {renderStatusIcon()}
      <span className={currentStatusStyle.label}>{statusLabel}</span>
    </div>
  );

  const [isExpanded, setIsExpanded] = useState(true);

  const timestampLabel = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const elapsedSeconds =
    typeof metadata?.elapsed === "number"
      ? metadata.elapsed
      : typeof metadata?.execution_time === "number"
      ? metadata.execution_time
      : undefined;
  const elapsedDisplay =
    typeof elapsedSeconds === "number"
      ? elapsedSeconds >= 10
        ? Math.round(elapsedSeconds).toString()
        : elapsedSeconds.toFixed(1)
      : null;
  const elapsedWithUnit = elapsedDisplay ? `${elapsedDisplay}s` : null;
  
  // Use actual output_tokens from metadata if available, otherwise estimate from content
  const tokenCount = useMemo(() => {
    // Sum up output_tokens from all messages' token_usage
    const actualTokens = messages?.reduce((acc, m) => {
      const usage = m.metadata?.token_usage;
      if (usage?.output_tokens) {
        return acc + usage.output_tokens;
      }
      return acc;
    }, 0) || 0;
    
    if (actualTokens > 0) return actualTokens;
    
    // Fallback to estimation if no actual token data
    return Math.ceil(
      (messages?.reduce((acc, m) => acc + (m.content?.length || 0), 0) || 0) / 2.2
    );
  }, [messages]);

  useEffect(() => {
    if (sqlTool?.name === "submit_sql") {
      setIsExpanded(true);
    }
  }, [sqlTool?.name]);

  const footerStatusText =
    statusVariant === "completed" && elapsedDisplay
      ? t("agent.completed_in", { time: elapsedDisplay })
      : statusVariant === "end" && elapsedDisplay
      ? t("agent.completed_in", { time: elapsedDisplay })
      : statusLabel;

  const getCompletedSummary = () => {
    if (hasSQL) {
      if (sqlTool?.name === "submit_sql")
        return t("agent.completed.submitting_sql");
      return t("agent.completed.executing_sql");
    }
    if (toolCalls.length > 0) {
      const names = toolCalls
        .map((tc) => t(`agent.tool_names.${tc.name}`, tc.name))
        .join(", ");
      return t("agent.completed.calling_tools", { names });
    }
    return t("agent.completed.analyzing");
  };

  // Determine folded summary text
  const getFoldedSummary = () => {
    // In debug mode, show error message; in non-debug mode, hide error details
    if (isErrored) {
      if (debugMode) {
        return turnError || metadata?.error || t("agent.status.failed");
      }
      return t("agent.status.failed");
    }
    if (isEnd) return t("agent.status.ended");
    if (isThinking) return t("agent.thinking");
    if (statusVariant === "completed") return getCompletedSummary();
    if (hasSQL) {
      if (sqlTool?.name === "submit_sql") return t("agent.submitting_sql");
      return t("agent.executing_sql");
    }
    if (toolCalls.length > 0) {
      const names = toolCalls
        .map((tc) => t(`agent.tool_names.${tc.name}`, tc.name))
        .join(", ");
      return t("agent.calling_tools", { names }); // "Calling {names}..."
    }
    return t("agent.analyzing"); // "Analyzing..."
  };

  // Folded View Component
  if (!isExpanded) {
    return (
      <div className="w-fit max-w-[90%] mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button
          onClick={() => setIsExpanded(true)}
          className={cn(
            "flex items-center gap-3 px-4 py-3 bg-white border rounded-2xl rounded-tl-sm shadow-sm hover:shadow-md transition-all group",
            statusVariant === "error" ? "border-red-200" : 
            statusVariant === "end" ? "border-neutral-300" : "border-neutral-200"
          )}
        >
          <div
            className={cn(
              "p-1.5 rounded-md transition-colors",
              statusVariant === "error"
                ? "bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white"
                : statusVariant === "completed"
                ? "bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white"
                : statusVariant === "end"
                ? "bg-neutral-100 text-neutral-500 group-hover:bg-neutral-500 group-hover:text-white"
                : "bg-neutral-100 text-neutral-600 group-hover:bg-black group-hover:text-white"
            )}
          >
            <Bot size={18} />
          </div>
          <div className="flex flex-col items-start">
            <span
              className={cn(
                "text-sm font-semibold",
                statusVariant === "error"
                  ? "text-red-900"
                  : statusVariant === "completed"
                  ? "text-green-900"
                  : statusVariant === "end"
                  ? "text-neutral-700"
                  : "text-neutral-900"
              )}
            >
              {displayAgentName || t("agent.name")}
            </span>
            <span
              className={cn(
                "text-sm font-medium text-left",
                statusVariant === "error"
                  ? "text-red-600"
                  : statusVariant === "completed"
                  ? "text-green-700"
                  : statusVariant === "end"
                  ? "text-neutral-500"
                  : "text-neutral-600"
              )}
            >
              {getFoldedSummary()}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1 text-xs font-medium">
            {renderStatusIcon()}
            <span className={currentStatusStyle.label}>{statusLabel}</span>
          </div>
        </button>
        <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-1 ml-1">
          <span>~{tokenCount} tokens</span>
          {elapsedWithUnit && (
            <>
              <span>•</span>
              <span>{elapsedWithUnit}</span>
            </>
          )}
          {timestampLabel && (
            <>
              <span>•</span>
              <span>{timestampLabel}</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-neutral-200 rounded-md transition-colors text-neutral-500"
            >
              <ChevronUp size={16} />
            </button>
            <div className="p-1.5 bg-black rounded-md text-white">
              <Bot size={18} />
            </div>
            <span className="text-sm font-medium text-neutral-700">
              {isThinking ? t("agent.thinking") : (displayAgentName || t("agent.name"))}
            </span>
            <StatusPill />
          </div>
        </div>

        {/* Body */}
        <div className="p-5 min-h-[100px]">
          <div className="space-y-6">
            {/* Show thoughts if any */}
            {thoughts.length > 0 && (
              <div className="text-xs text-neutral-500 space-y-1 pb-3 border-b border-neutral-100">
                {thoughts
                  .filter((thought) => thought.trim() !== "")
                  .map((thought, i) => (
                    <div key={i} className="flex items-start gap-1">
                      <span className="text-neutral-400">•</span>
                      <span>
                        {Markdown({
                          id: messages[0].id || Date.now().toString(),
                          content: thought
                        })}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            {messages.map((msg, idx) => {
              const msgToolCalls = (msg.metadata?.toolCalls ||
                []) as ToolCallInfo[];
              const msgSql = msg.metadata?.sql;
              // Find all SQL tool calls in this message
              const sqlToolCalls = msgToolCalls.filter(
                (tc) => tc.name === "submit_sql" || tc.name === "exec_sql"
              );

              return (
                <div key={msg.id || idx} className="space-y-4">
                  {/* Content */}
                  {(msg.content ||
                    (isStreaming && idx === messages.length - 1)) && (
                    <div className="prose prose-sm max-w-none text-neutral-800">
                      {Markdown({
                        id: msg.id || Date.now().toString() + "-" + idx,
                        content: msg.content || ""
                      })}
                    </div>
                  )}

                  {/* Tool Calls - including SQL tool calls */}
                  {msgToolCalls.length > 0 && (
                    <div className="space-y-2">
                      {msgToolCalls.map((tc, i) => (
                        <ToolCallItem key={i} toolCall={tc} />
                      ))}
                    </div>
                  )}

                  {/* SQL/Data sections - show one for each SQL tool call that has data */}
                  {sqlToolCalls.map((sqlTool, tcIdx) => {
                    // Get data for this specific tool call from execution cache
                    const toolData = sqlTool.id && executionCache[sqlTool.id]
                      ? executionCache[sqlTool.id] as { columns?: string[]; data?: unknown[][] }
                      : null;

                    // Only show if this tool call has SQL, result data, or if there's msgSql for the first SQL tool
                    const shouldShow = msgSql && tcIdx === 0
                      ? true  // Show for msgSql (only on first SQL tool)
                      : !!(sqlTool.result || toolData || msg.metadata?.data);

                    if (!shouldShow) return null;

                    return (
                      <SqlSection
                        key={`sql-${tcIdx}`}
                        sql={
                          msgSql && tcIdx === 0
                            ? msgSql  // Use msgSql for the first SQL tool only
                            : (sqlTool?.arguments as Record<string, unknown>)?.query as string ||
                              (sqlTool?.arguments as Record<string, unknown>)?.sql as string
                        }
                        data={toolData?.data as unknown[][] | undefined}
                        columns={toolData?.columns}
                        toolCall={sqlTool}
                        executionCache={executionCache}
                        question={question}
                        showViz={false}
                        autovizConfig={undefined}
                        isCompleted={false}
                      />
                    );
                  })}
                </div>
              );
            })}

            {/* Final Data Visualization - show once when agent is completed with final data */}
            {isCompleted && finalData && finalObjectData && question && autovizConfig && (
              <div className="mt-4">
                <SqlSection
                  sql={turn?.final_sql || agentWorkspace?.final_sql || undefined}
                  data={finalData.data?.map(row => Object.values(row)) as unknown[][]}
                  columns={finalData.schema}
                  toolCall={undefined}
                  executionCache={executionCache}
                  question={question}
                  showViz={true}
                  autovizConfig={autovizConfig}
                  isCompleted={true}
                />
              </div>
            )}

            {/* Thinking State */}
            {isThinking && (
              <div className="flex flex-col gap-3 animate-pulse mt-4">
                <div className="h-4 bg-neutral-100 rounded w-3/4"></div>
                <div className="h-4 bg-neutral-100 rounded w-1/2"></div>
              </div>
            )}

            {/* Error Display (Debug Mode Only) */}
            {debugMode && isErrored && (turnError || metadata?.error) && (
              <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
                {turnError || metadata?.error}
              </div>
            )}
          </div>
        </div>

        {/* Footer Status */}
        <div className="px-4 py-2 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            {renderStatusIcon("", 12)}
            <span className="font-medium">{footerStatusText}</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Feedback buttons */}
            <FeedbackButtons
              sessionId={sessionId}
              turnId={turnId}
              isCompleted={isCompleted}
              databaseId={databaseId}
              userQuestion={turn?.user_query?.question}
              finalSql={turn?.final_sql}
            />
            <div className="flex items-center gap-2">
              <span>~{tokenCount} tokens</span>
              {elapsedWithUnit && (
                <>
                  <span>•</span>
                  <span>{elapsedWithUnit}</span>
                </>
              )}
              {timestampLabel && (
                <>
                  <span>•</span>
                  <span>{timestampLabel}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
