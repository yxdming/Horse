import { useEffect, useRef, useState, useMemo } from "react";
import { Message, AgentMode } from "@/types";
import { useChatStore } from "@/stores/useChatStore";
import { useAppStore } from "@/stores/useAppStore";
import { AgentCard } from "./AgentCard";
import { api } from "@/lib/api";
import { copyToClipboard } from "@/lib/clipboard";
import {
  Send,
  Zap,
  Sparkles,
  Database,
  ChevronDown,
  MessageSquare,
  Clock,
  Copy,
  Check,
  X,
  FlaskConical,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export const ChatArea = () => {
  const { t } = useTranslation();
  const {
    activeSessionId,
    activeConnectionId,
    sessions,
    createSession,
    setActiveSession,
    setActiveConnection,
    connections,
    fetchSessions,
  } = useAppStore();
  const {
    messages,
    sendMessage,
    fetchMessages,
    isStreaming,
    initializeSession,
  } = useChatStore();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<AgentMode>("auto");
  const [isModeOpen, setIsModeOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScroll = useRef<boolean>(true);
  const lastScrollTop = useRef<number>(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  // Wrapper ref for positioning mention dropdown relative to the input area
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [mentionActive, setMentionActive] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  // Ref to the mention dropdown scroll container so we can keep the selected
  // item visible when navigating with keyboard arrows.
  const mentionListRef = useRef<HTMLDivElement | null>(null);
  const [mentionPos, setMentionPos] = useState({ left: 0, top: 0, width: 240 });

  // Utility: compute coordinates for a position in the textarea.
  // If `length` > 0, measure that many characters starting at `position` (useful to get the exact char box and height).
  const getCaretCoordinates = (
    textarea: HTMLTextAreaElement,
    position: number,
    length = 0
  ) => {
    const div = document.createElement("div");
    const style = getComputedStyle(textarea);
    const properties = [
      "boxSizing",
      "width",
      "fontSize",
      "fontFamily",
      "fontWeight",
      "lineHeight",
      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "paddingLeft",
      "borderTopWidth",
      "borderRightWidth",
      "borderBottomWidth",
      "borderLeftWidth",
      "whiteSpace",
      "letterSpacing",
      "textTransform",
      "textIndent",
    ];

    properties.forEach((prop) => {
      // @ts-ignore
      div.style[prop] = style[prop];
    });

    div.style.position = "absolute";
    div.style.visibility = "hidden";
    div.style.whiteSpace = "pre-wrap";
    div.style.wordWrap = "break-word";
    // match textarea width so wrapping is the same
    div.style.width = `${textarea.clientWidth}px`;

    // text before the measured position
    div.textContent = textarea.value
      .substring(0, position)
      .replace(/\s/g, (s) => (s === " " ? "\u00a0" : s));

    const span = document.createElement("span");
    if (length > 0) {
      span.textContent =
        textarea.value.substring(position, position + length) || ".";
    } else {
      span.textContent = textarea.value.substring(position) || ".";
    }
    div.appendChild(span);

    document.body.appendChild(div);
    const rect = span.getBoundingClientRect();
    const parentRect = div.getBoundingClientRect();
    const left = rect.left - parentRect.left;
    const top = rect.top - parentRect.top;
    const height = rect.height;
    document.body.removeChild(div);
    return { left, top, height };
  };

  const updateMentionPosition = () => {
    const el = inputRef.current;
    const wrapper = wrapperRef.current;
    if (!el || !wrapper || mentionStart === null) return;

    try {
      // measure the single character at mentionStart (the '@') so we can base the dropdown
      // position on the actual character box and avoid overlapping the input line
      const caretPos = getCaretCoordinates(el, mentionStart, 1);
      const textareaRect = el.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();

      // left relative to wrapper
      let left = textareaRect.left - wrapperRect.left + caretPos.left;
      // compute visible bottom of the measured character
      const scrollOffset = el.scrollTop || 0;
      const computed = getComputedStyle(el);
      const rawLineHeight = parseFloat(computed.lineHeight || "");
      const lineHeight = Number.isFinite(rawLineHeight)
        ? rawLineHeight
        : parseFloat(computed.fontSize || "14") * 1.2;
      const visibleCharTop =
        textareaRect.top - wrapperRect.top + caretPos.top - scrollOffset;
      const charHeight = caretPos.height || lineHeight;
      const visibleCharBottom = visibleCharTop + charHeight;
      // use a slightly larger gap to ensure we don't overlap the caret
      let top = visibleCharBottom + 10; // small gap so dropdown doesn't touch the text

      // clamp left and width so dropdown stays inside wrapper
      const maxWidth = 320;
      const minLeft = 8;
      left = Math.max(minLeft, left);
      const available = wrapperRect.width - left - 8;
      const width = Math.min(maxWidth, Math.max(160, available));

      setMentionPos({ left, top, width });
    } catch (err) {
      // ignore
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const caret = e.target.selectionStart ?? value.length;
    setInput(value);

    const before = value.slice(0, caret);
    const match = before.match(/@([^\s@]*)$/);
    if (!activeConnectionId && match) {
      setMentionActive(true);
      setMentionQuery(match[1]);
      setMentionIndex(0);
      setMentionStart(caret - match[0].length);
    } else {
      setMentionActive(false);
      setMentionQuery("");
      setMentionStart(null);
    }
  };

  const filteredConnections = useMemo(() => {
    if (!mentionActive) return [];
    const q = mentionQuery.toLowerCase();
    return connections.filter((c) => c.name.toLowerCase().includes(q));
  }, [connections, mentionActive, mentionQuery]);

  // If filtered list shrinks such that current index is out of bounds,
  // clamp the index to a valid value.
  useEffect(() => {
    if (mentionIndex >= filteredConnections.length) {
      setMentionIndex(Math.max(0, filteredConnections.length - 1));
    }
  }, [filteredConnections.length, mentionIndex]);

  // When the mention index changes (keyboard navigation), ensure the
  // highlighted item is visible inside the scrollable dropdown.
  useEffect(() => {
    if (!mentionActive) return;
    const list = mentionListRef.current;
    if (!list) return;
    const items = list.querySelectorAll<HTMLButtonElement>("button");
    const el = items[mentionIndex];
    if (el) {
      // Use nearest so it only scrolls minimally to reveal the item.
      el.scrollIntoView({ block: "nearest" });
    }
  }, [mentionIndex, mentionActive, filteredConnections]);

  // Recompute dropdown position when mention becomes active, start changes, input changes, or on resize/scroll
  useEffect(() => {
    if (!mentionActive) return;
    updateMentionPosition();

    const onResize = () => updateMentionPosition();
    window.addEventListener("resize", onResize);
    // also update on scroll (in case wrapper moves)
    window.addEventListener("scroll", onResize, true);
    // update when the textarea content scrolls internally
    const textareaEl = inputRef.current;
    if (textareaEl) textareaEl.addEventListener("scroll", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      if (textareaEl) textareaEl.removeEventListener("scroll", onResize);
    };
  }, [mentionActive, mentionStart, input]);

  const insertMention = (name: string) => {
    if (mentionStart === null) return;
    const el = inputRef.current;
    const caret = el?.selectionStart ?? input.length;
    const before = input.slice(0, mentionStart);
    const after = input.slice(caret);
    // Remove the @mention from input, just keep the text before and after
    const newValue = before + after;
    setInput(newValue);
    setMentionActive(false);
    setMentionQuery("");
    setMentionStart(null);

    // Update active connection to the mentioned connection
    const mentionedConnection = connections.find((c) => c.name === name);
    if (mentionedConnection) {
      setActiveConnection(mentionedConnection.id);
    }

    // Move cursor to where the mention was
    requestAnimationFrame(() => {
      if (el) {
        const pos = before.length;
        el.focus();
        el.setSelectionRange(pos, pos);
      }
    });
  };

  const activeConnection = connections.find((c) => c.id === activeConnectionId);

  const modes = useMemo(() => {
    const baseModes: Array<{
      id: AgentMode;
      label: string;
      icon: typeof Zap;
      color: string;
    }> = [
      {
        id: "flash",
        label: t("modes.flash"),
        icon: Zap,
        color: "text-orange-500",
      },
      {
        id: "auto",
        label: t("modes.auto"),
        icon: Sparkles,
        color: "text-blue-500",
      },
      {
        id: "heavy",
        label: t("modes.heavy"),
        icon: Brain,
        color: "text-purple-500",
      },
    ];

    // Add beta mode only if debug mode is enabled
    if (isDebugMode) {
      baseModes.push({
        id: "beta",
        label: t("modes.beta"),
        icon: FlaskConical,
        color: "text-green-500",
      });
    }

    return baseModes;
  }, [t, isDebugMode]);

  const currentMode = modes.find((m) => m.id === mode) || modes[1]; // Default to auto if mode not found

  const sessionMessages = activeSessionId
    ? messages[activeSessionId] || []
    : [];
  const dbSessions = activeConnectionId
    ? sessions[activeConnectionId] || []
    : [];

  const groupedMessages = useMemo(() => {
    const turns: { id: string; user: Message | null; assistants: Message[] }[] =
      [];
    let currentTurn: {
      id: string;
      user: Message | null;
      assistants: Message[];
    } | null = null;

    sessionMessages.forEach((msg) => {
      if (msg.role === "user") {
        if (currentTurn) turns.push(currentTurn);
        currentTurn = {
          id: msg.id || `msg_${Math.random()}`,
          user: msg,
          assistants: [],
        };
      } else if (msg.role === "assistant") {
        if (!currentTurn) {
          currentTurn = { id: "start", user: null, assistants: [] };
        }
        currentTurn.assistants.push(msg);
      }
    });
    if (currentTurn) turns.push(currentTurn);
    return turns;
  }, [sessionMessages]);

  // Fetch debug mode status on mount
  useEffect(() => {
    const fetchDebugMode = async () => {
      try {
        const config = await api.getConfig();
        setIsDebugMode(config.app.debug);
      } catch (error) {
        console.error("Failed to fetch debug mode:", error);
      }
    };
    fetchDebugMode();
  }, []);

  // Only fetch messages when switching to an existing session that we haven't loaded yet
  useEffect(() => {
    if (activeSessionId) {
      // Use the chat store's fetchMessages which has internal checks
      // to avoid overwriting existing messages
      fetchMessages(activeSessionId);
    }
  }, [activeSessionId, fetchMessages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (!autoScroll.current) {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
      return;
    }

    // If there's already a pending scroll, do nothing
    if (scrollTimeoutRef.current) return;

    // Schedule scroll after 500ms
    scrollTimeoutRef.current = setTimeout(() => {
      try {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      } catch {
        el.scrollTop = el.scrollHeight;
      }
      scrollTimeoutRef.current = null;
    }, 500);
  }, [sessionMessages, isStreaming, activeSessionId]);

  const handleSend = async () => {
    if (!input.trim() || !activeConnectionId || isStreaming) return;

    autoScroll.current = true;

    const content = input.trim();
    setInput("");

    let sessionId = activeSessionId;
    if (!sessionId) {
      // Create session and wait for it to complete
      const newSession = await createSession(activeConnectionId);
      sessionId = newSession.id;
    }

    // Initialize the session in chat store to prevent fetchMessages from running
    // This must be done before sendMessage to ensure messages array exists
    initializeSession(sessionId);

    // Send message using the session ID we have
    // The messages will be added to this sessionId in the store
    await sendMessage(sessionId, activeConnectionId, content, mode);

    // Refresh sessions list to update title/preview from backend
    fetchSessions(activeConnectionId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 优先处理 mention 导航
    if (mentionActive) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) =>
          Math.min(i + 1, Math.max(0, filteredConnections.length - 1))
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const sel = filteredConnections[mentionIndex];
        if (sel) insertMention(sel.name);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionActive(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await copyToClipboard(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    const currentScrollTop = el.scrollTop;
    const isAtBottom =
      Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) < 50;

    // Detect if user scrolled up manually
    if (currentScrollTop < lastScrollTop.current) {
      autoScroll.current = false;
    }

    // If user scrolled to bottom, re-enable auto scroll
    if (isAtBottom) {
      autoScroll.current = true;
    }

    lastScrollTop.current = currentScrollTop;
  };

  return (
    <div className="flex-1 flex h-full relative overflow-hidden">
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        {!activeConnectionId && <div style={{ flex: 7 / 24 }}></div>}
        {/* Messages Area */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className={`${
            activeConnectionId ? "flex-1" : ""
          } overflow-y-auto px-6 pb-6 space-y-8`}
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent, black 20px, black calc(100% - 20px), transparent)",
          }}
        >
          {!activeSessionId || !activeConnectionId ? (
            <div className="max-w-3xl mx-auto space-y-12 pt-10">
              {/* Welcome / Placeholder */}
              <div className="flex flex-col items-center justify-center text-neutral-300 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-neutral-200">R</span>
                </div>
                <p>
                  {t("chat_placeholder")} {activeConnection?.name}
                </p>
              </div>

              {/* History Cards */}
              {!!activeConnectionId && (
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-1">
                    {t("sidebar:recentChats", "Recent Chats")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dbSessions.length === 0 && (
                      <div className="col-span-full flex items-center justify-center py-12 text-sm text-neutral-400">
                        {t(
                          "sidebar:noRecentChats",
                          "No sessions yet. Start a new chat!"
                        )}
                      </div>
                    )}
                    {dbSessions
                      .sort(
                        (a, b) =>
                          new Date(b.updated_at).getTime() -
                          new Date(a.updated_at).getTime()
                      )
                      .map((session) => (
                        <button
                          key={session.id}
                          onClick={() => setActiveSession(session.id)}
                          className="flex flex-col items-start p-4 bg-white border border-neutral-200 rounded-xl hover:border-neutral-300 hover:shadow-sm transition-all text-left group"
                        >
                          <div className="flex items-center gap-2 mb-2 w-full">
                            <MessageSquare
                              size={16}
                              className="text-neutral-400 group-hover:text-black transition-colors"
                            />
                            <span className="font-medium text-neutral-900 truncate flex-1">
                              {session.title}
                            </span>
                            <span className="text-xs text-neutral-400 whitespace-nowrap flex items-center gap-1">
                              <Clock size={12} />
                              {new Date(
                                session.updated_at
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-500 line-clamp-2 w-full">
                            {session.preview ||
                              t(
                                "common:noPreviewAvailable",
                                "No preview available"
                              )}
                          </p>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {sessionMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-neutral-300 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-neutral-200">
                      R
                    </span>
                  </div>
                  <p>
                    {t("chat_placeholder")} {activeConnection?.name}
                  </p>
                </div>
              )}

              {groupedMessages.map((turn) => {
                return (
                  <div key={turn.id} className="relative group/turn">
                    {/* User Message - Sticky */}
                    {turn.user && (
                      <div
                        className="sticky top-0 z-10 pb-4 pt-8 -mt-2 cursor-pointer pointer-events-none bg-white"
                        onClick={(e) => {
                          e.currentTarget.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }}
                      >
                        <div className="w-full max-w-3xl mx-auto flex justify-end group pointer-events-auto">
                          <div className="flex flex-col items-end max-w-[60%]">
                            <div className="bg-neutral-100/80 text-neutral-800 px-4 py-3 rounded-2xl rounded-tr-sm text-sm shadow-sm relative border border-neutral-200/50 backdrop-blur-md">
                              {turn.user.content}
                            </div>
                            <div className="flex items-center gap-2 mt-1 mr-1 text-[10px] text-neutral-400">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(
                                    turn.user!.content || "",
                                    turn.user!.id || "unknown"
                                  );
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-neutral-600"
                                title="Copy"
                              >
                                {copiedId === turn.user.id ? (
                                  <Check size={10} className="text-green-500" />
                                ) : (
                                  <Copy size={10} />
                                )}
                              </button>
                              <span>
                                {turn.user.timestamp
                                  ? new Date(
                                      turn.user.timestamp
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Assistant Messages */}
                    <div className="relative w-full max-w-3xl mx-auto">
                      <div className="space-y-8 pt-2 pb-8">
                        {turn.assistants.length > 0 && (() => {
                          // Group messages by agentName for multi-agent support
                          const agentGroups: { agentName: string; messages: Message[] }[] = [];
                          let currentAgent: { agentName: string; messages: Message[] } | null = null;

                          turn.assistants.forEach((msg) => {
                            const msgAgentName = msg.agentName || msg.metadata?.agentName || "";
                            if (!currentAgent || currentAgent.agentName !== msgAgentName) {
                              if (currentAgent) {
                                agentGroups.push(currentAgent);
                              }
                              currentAgent = { agentName: msgAgentName, messages: [msg] };
                            } else {
                              currentAgent.messages.push(msg);
                            }
                          });
                          if (currentAgent) {
                            agentGroups.push(currentAgent);
                          }

                          return agentGroups.map((group, groupIdx) => (
                            <div key={`agent-${groupIdx}-${group.agentName || 'default'}`} className="relative">
                              <AgentCard
                                messages={group.messages}
                                sessionId={activeSessionId || undefined}
                                turnId={group.messages[0]?.turnId}
                                databaseId={activeConnectionId || undefined}
                                question={turn.user?.content || undefined}
                                agentName={group.agentName || undefined}
                              />
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="flex-none p-6 bg-white">
          <div className="max-w-3xl mx-auto relative" ref={wrapperRef}>
            {/* Connection Badge */}
            {activeConnection && (
              <div className="flex items-center mb-3">
                <div className="w-2"></div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-full text-xs font-medium text-neutral-700 shadow-sm">
                  <Database className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{activeConnection.name}</span>
                  <button
                    onClick={() => {
                      setActiveConnection("");
                      setActiveSession(null);
                    }}
                    className="ml-1 p-0.5 hover:bg-neutral-200 rounded-full transition-colors"
                    title="Clear connection"
                  >
                    <X className="w-3 h-3 text-neutral-500" />
                  </button>
                </div>
              </div>
            )}

            {/* Input Box */}
            <div
              className={cn(
                "bg-white border rounded-xl shadow-sm transition-all duration-200 flex items-center p-2",
                "focus-within:border-neutral-400 focus-within:shadow-md",
                "border-neutral-200"
              )}
            >
              <div className="relative mr-1">
                <button
                  onClick={() => setIsModeOpen(!isModeOpen)}
                  className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-neutral-100 text-sm font-medium text-neutral-600 transition-colors"
                >
                  <currentMode.icon
                    className={cn("w-4 h-4", currentMode.color)}
                  />
                  <ChevronDown className="w-3 h-3 text-neutral-400" />
                </button>

                {isModeOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-32 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-10">
                    {modes.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setMode(m.id);
                          setIsModeOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 text-left text-sm transition-colors",
                          mode === m.id
                            ? "bg-neutral-50 text-neutral-900"
                            : "text-neutral-600 hover:bg-neutral-50"
                        )}
                      >
                        <m.icon className={cn("w-4 h-4", m.color)} />
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={t("chat_placeholder")}
                className="flex-1 max-h-32 min-h-[44px] py-2.5 px-3 bg-transparent border-none focus:outline-none resize-none text-sm placeholder:text-neutral-400 mr-2"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  input.trim() && !isStreaming
                    ? "bg-black text-white hover:bg-neutral-800"
                    : "bg-neutral-100 text-neutral-300 cursor-not-allowed"
                )}
              >
                <Send size={18} />
              </button>
            </div>

            {/* Mention 下拉：绝对定位在输入框下方 */}
            {mentionActive && filteredConnections.length > 0 && (
              <div
                className="absolute z-20"
                style={{
                  left: `${mentionPos.left}px`,
                  top: `${mentionPos.top}px`,
                  width: `${mentionPos.width}px`,
                }}
              >
                <div
                  ref={mentionListRef}
                  className="bg-white border border-neutral-200 rounded-md shadow-lg max-h-48 overflow-auto text-sm"
                  style={{ width: "100%" }}
                >
                  {filteredConnections.map((c, idx) => (
                    <button
                      key={c.id}
                      onMouseDown={(e) => {
                        // onMouseDown 避免 textarea 失焦导致 selection 问题
                        e.preventDefault();
                        insertMention(c.name);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 hover:bg-neutral-50 flex items-center gap-2",
                        idx === mentionIndex ? "bg-neutral-100" : ""
                      )}
                    >
                      <Database className="w-4 h-4 text-neutral-400" />
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeConnectionId && (
              <div className="text-center mt-2">
                <span className="text-[10px] text-neutral-400">
                  {t("disclaimer")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
