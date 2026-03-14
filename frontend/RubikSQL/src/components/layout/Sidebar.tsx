import { useEffect, useState, useRef, useMemo } from "react";
import {
  MessageSquare,
  Database,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  Trash2,
  SlidersHorizontal,
} from "lucide-react";
import { useAppStore } from "@/stores/useAppStore";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import { Connection, Session } from "@/types";
import { useTranslation } from "react-i18next";
import { ImportDatabaseModal } from "@/components/modals/ImportDatabaseModal";
import { SettingsModal } from "@/components/modals/SettingsModal";

// Helper function to format relative time
const formatTimeAgo = (dateString: string, t: any): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t("sidebar:timeAgo.justNow", "just now");
  if (diffMins < 60)
    return t("sidebar:timeAgo.minutesAgo", "{{count}}m ago", {
      count: diffMins,
    });
  if (diffHours < 24)
    return t("sidebar:timeAgo.hoursAgo", "{{count}}h ago", {
      count: diffHours,
    });
  if (diffDays < 7)
    return t("sidebar:timeAgo.daysAgo", "{{count}}d ago", { count: diffDays });
  return date.toLocaleDateString();
};

const SectionHeader = ({
  label,
  isOpen,
  isExpanded,
  onToggle,
  action,
}: {
  label: string;
  isOpen: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  action?: React.ReactNode;
}) => {
  if (!isOpen) return <div className="h-4" />;
  return (
    <div
      className={cn(
        "w-full px-3 py-1 mt-2 flex items-center justify-between group shrink-0 select-none",
        onToggle && "cursor-pointer hover:bg-neutral-200/50 rounded-md"
      )}
      onClick={onToggle}
    >
      <div className="flex items-center gap-2">
        <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide group-hover:text-neutral-700 transition-colors">
          {label}
        </div>
        {onToggle && (
          <div className="text-neutral-400 group-hover:text-neutral-600 transition-colors">
            {isExpanded ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
          </div>
        )}
      </div>
      {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
    </div>
  );
};

const DbCard = ({
  connection,
  isOpen,
  isActive,
  onChat,
  onOpenSettings,
}: {
  connection: Connection;
  isOpen: boolean;
  isActive: boolean;
  onChat: (e: React.MouseEvent) => void;
  onOpenSettings: (e: React.MouseEvent) => void;
}) => {
  const { t } = useTranslation(["common", "sidebar", "database"]);
  if (!isOpen) {
    return (
      <button
        onClick={onChat}
        className={cn(
          "w-full flex justify-center p-2 rounded-md mb-2 transition-colors relative group",
          isActive
            ? "bg-neutral-200 text-black"
            : "text-neutral-500 hover:bg-neutral-100"
        )}
        title={connection.name}
      >
        <Database size={20} />
        <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
          {connection.name}
        </div>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "group rounded-lg border transition-all duration-200 overflow-hidden relative",
        isActive
          ? "bg-white border-neutral-300 shadow-sm"
          : "bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-sm"
      )}
    >
      <div
        className="p-3 cursor-pointer flex items-center justify-between"
        onClick={onChat}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className={cn(
              "p-1.5 rounded-md shrink-0",
              isActive
                ? "bg-black text-white"
                : "bg-neutral-100 text-neutral-600"
            )}
          >
            <Database size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate text-neutral-800">
              {connection.name}
            </div>
            <div className="text-[10px] text-neutral-400 truncate">
              {connection.type} •{" "}
              {connection.host || t("sidebar:local", "local")}
            </div>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenSettings(e);
          }}
          className="p-1.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-md transition-colors opacity-0 group-hover:opacity-100"
        >
          <SlidersHorizontal size={14} />
        </button>
      </div>
    </div>
  );
};

export const Sidebar = () => {
  const { t } = useTranslation(["common", "sidebar", "database"]);
  const {
    isSidebarOpen,
    toggleSidebar,
    sessions,
    fetchSessions,
    connections,
    fetchConnections,
    deleteSession,
    switchToSession,
    activeSessionId,
    setActiveTab,
    activeConnectionId,
    setActiveConnection,
    setSettingsTab,
  } = useAppStore();

  // Section States
  const [isSessionsOpen, setIsSessionsOpen] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDatabasesOpen, setIsDatabasesOpen] = useState(true);

  // Split Ratio (Percentage for Sessions)
  const [splitRatio, setSplitRatio] = useState(50);

  // Sidebar width (pixels)
  const [sidebarWidth, setSidebarWidth] = useState(288); // 288px = w-72
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  // Resizing Logic
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    fetchSessions();
    fetchConnections();
  }, []);

  // Sidebar width resize handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingSidebar) {
        const newWidth = e.clientX;
        const minWidth = window.innerWidth * 0.15; // 15% minimum
        const maxWidth = window.innerWidth * 0.4; // 40% maximum
        setSidebarWidth(Math.min(Math.max(newWidth, minWidth), maxWidth));
        return;
      }

      if (!isResizing || !sidebarRef.current) return;

      const sidebarRect = sidebarRef.current.getBoundingClientRect();
      const relativeY = e.clientY - sidebarRect.top;
      const percentage = (relativeY / sidebarRect.height) * 100;

      // Clamp between 25% and 75%
      const newRatio = Math.min(Math.max(percentage, 25), 75);
      setSplitRatio(newRatio);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setIsResizingSidebar(false);
      document.body.style.cursor = "default";
    };

    if (isResizing || isResizingSidebar) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = isResizingSidebar
        ? "col-resize"
        : "row-resize";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
    };
  }, [isResizing, isResizingSidebar]);

  const handleDbChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveConnection(id);
    setActiveTab("chat");
  };

  const handleOpenSettings = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveConnection(id);
    setSettingsTab("info");
    setActiveTab("database");
  };

  // Group sessions by date
  const groupedSessions = useMemo(() => {
    const groups: Record<string, Session[]> = {
      today: [],
      yesterday: [],
      previous_7_days: [],
      older: [],
    };

    const allSessions = Object.values(sessions)
      .flat()
      // Filter out empty sessions, but always show the active session
      .filter(
        (session) =>
          session.id === activeSessionId || // Always show active session
          session.message_count > 0 || // Show sessions with messages
          session.title !== "New Chat" // Show renamed sessions
      )
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();
    const yesterday = today - 86400000;
    const lastWeek = today - 86400000 * 7;

    allSessions.forEach((session) => {
      const date = new Date(session.updated_at).getTime();
      if (date >= today) {
        groups["today"].push(session);
      } else if (date >= yesterday) {
        groups["yesterday"].push(session);
      } else if (date >= lastWeek) {
        groups["previous_7_days"].push(session);
      } else {
        groups["older"].push(session);
      }
    });

    // Remove empty groups
    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [sessions, activeSessionId]);

  return (
    <aside
      className={cn(
        "h-screen bg-neutral-100/50 border-r border-neutral-200 flex flex-col transition-all duration-300 ease-in-out z-20 relative",
        !isSidebarOpen && "w-16"
      )}
      style={isSidebarOpen ? { width: `${sidebarWidth}px` } : undefined}
    >
      {/* Header */}
      <div className="h-14 flex items-center px-4 border-b border-neutral-200 bg-neutral-50/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <img
            src={logo}
            alt="RubikSQL Logo"
            className="w-8 h-8 rounded-lg shrink-0"
          />
          {isSidebarOpen && (
            <span className="font-bold text-lg tracking-tight text-neutral-900">
              RubikSQL
            </span>
          )}
        </div>
      </div>

      {/* Resizable Content Area */}
      <div
        ref={sidebarRef}
        className="flex-1 flex flex-col min-h-0 overflow-hidden relative pb-3"
      >
        {/* 1. Sessions Section */}
        <div
          className="flex flex-col min-h-0 transition-[flex-grow] duration-200 ease-out px-3"
          style={{
            height:
              isSessionsOpen && isDatabasesOpen ? `${splitRatio}%` : "auto",
            flexGrow: !isDatabasesOpen && isSessionsOpen ? 1 : 0,
            flexShrink: !isDatabasesOpen && isSessionsOpen ? 1 : 0,
          }}
        >
          <div className="flex items-center shrink-0 w-full mb-1">
            <SectionHeader
              label={t("sidebar:chats")}
              isOpen={isSidebarOpen}
              isExpanded={isSessionsOpen}
              onToggle={() => setIsSessionsOpen(!isSessionsOpen)}
              action={
                isSidebarOpen && (
                  <button
                    onClick={() => {
                        setActiveConnection('');
                        setActiveTab("chat");
                    }}
                    className="p-1 text-neutral-400 hover:text-black hover:bg-neutral-200 rounded transition-colors"
                    title={t("sidebar:createSession")}
                  >
                    <Plus size={14} />
                  </button>
                )
              }
            />
          </div>

          {isSessionsOpen && (
            <div className="flex-1 min-h-0 bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col mb-1">
              <div
                className="flex-1 overflow-y-auto p-2 scrollbar-hide"
                style={{
                  maskImage:
                    "linear-gradient(to bottom, black 85%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, black 85%, transparent 100%)",
                }}
              >
                {groupedSessions.map(([group, items]) => (
                  <div key={group} className="mb-4 last:mb-0">
                    {isSidebarOpen && (
                      <h3 className="px-2 text-[10px] font-semibold text-neutral-400 uppercase mb-1">
                        {t(`sidebar:${group}`)}
                      </h3>
                    )}
                    {items.map((session) => {
                      const dbName = connections.find(
                        (c) => c.id === session.database_id
                      )?.name;
                      const timeAgo = formatTimeAgo(session.updated_at, t);
                      return (
                        <div
                          key={session.id}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors mb-1 group/session cursor-pointer",
                            activeSessionId === session.id
                              ? "bg-neutral-100 text-black font-medium"
                              : "text-neutral-600 hover:bg-neutral-50",
                            !isSidebarOpen && "justify-center px-0"
                          )}
                          onClick={() => {
                            switchToSession(session.id, session.database_id);
                            setActiveTab("chat");
                          }}
                          title={`${session.title} • ${dbName} • ${new Date(
                            session.updated_at
                          ).toLocaleString()}`}
                        >
                          <MessageSquare
                            size={16}
                            className={cn(
                              "shrink-0",
                              activeSessionId === session.id
                                ? "text-black"
                                : "text-neutral-400"
                            )}
                          />
                          {isSidebarOpen && (
                            <>
                              <div className="flex-1 min-w-0 text-left">
                                <div className="truncate">{session.title}</div>
                                <div className="text-[10px] text-neutral-400 truncate flex items-center gap-1">
                                  <span>{dbName}</span>
                                  <span>•</span>
                                  <span>{timeAgo}</span>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSession(
                                    session.id,
                                    session.database_id
                                  );
                                }}
                                className="opacity-0 group-hover/session:opacity-100 p-1 rounded hover:bg-neutral-200 text-neutral-400 hover:text-red-500 transition-all"
                                title={t("sidebar:delete_chat", "Delete chat")}
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Resize Handle */}
        {isSessionsOpen && isDatabasesOpen && isSidebarOpen && (
          <div
            className="h-2 w-full cursor-row-resize hover:bg-neutral-200/50 flex items-center justify-center group shrink-0 -my-1 z-10"
            onMouseDown={() => setIsResizing(true)}
          >
            <div className="w-8 h-1 rounded-full bg-neutral-200 group-hover:bg-neutral-400 transition-colors" />
          </div>
        )}

        {/* 2. Databases Section */}
        <div
          className="flex flex-col min-h-0 transition-[flex-grow] duration-200 ease-out px-3 overflow-hidden"
          style={{
            flexGrow: isDatabasesOpen ? 1 : 0,
            height: !isDatabasesOpen ? "auto" : undefined,
            flexShrink: isDatabasesOpen ? 1 : 0,
            minHeight: isDatabasesOpen ? "120px" : "auto",
          }}
        >
          <div className="flex items-center shrink-0 w-full mb-1">
            <SectionHeader
              label={t("sidebar:connections")}
              isOpen={isSidebarOpen}
              isExpanded={isDatabasesOpen}
              onToggle={() => setIsDatabasesOpen(!isDatabasesOpen)}
              action={
                isSidebarOpen && (
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="p-0.5 w-4 h-4 flex items-center justify-center text-neutral-400 hover:text-black hover:bg-neutral-200 rounded transition-colors"
                    title={t("sidebar:importDatabase", "Import Database")}
                  >
                    <Plus size={14} />
                  </button>
                )
              }
            />
          </div>

          {isDatabasesOpen && (
            <div className="flex-1 min-h-0 bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
              <div
                className="flex-1 overflow-y-auto p-2 scrollbar-hide"
                style={{
                  maskImage:
                    "linear-gradient(to bottom, black 85%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, black 85%, transparent 100%)",
                }}
              >
                <div className="space-y-1">
                  {connections.map((conn) => (
                    <DbCard
                      key={conn.id}
                      connection={conn}
                      isOpen={isSidebarOpen}
                      isActive={activeConnectionId === conn.id}
                      onChat={(e) => handleDbChat(e, conn.id)}
                      onOpenSettings={(e) => handleOpenSettings(e, conn.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Settings & Account */}
      <div className="p-3 border-t border-neutral-200 bg-neutral-50 shrink-0 space-y-1">
        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-neutral-600 hover:bg-neutral-200 hover:text-black",
            !isSidebarOpen && "justify-center px-0"
          )}
          title={t("settings")}
        >
          <Settings size={18} />
          {isSidebarOpen && <span>{t("settings")}</span>}
        </button>

        <button
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-neutral-600 hover:bg-neutral-200 hover:text-black",
            !isSidebarOpen && "justify-center px-0"
          )}
          title={t("account")}
        >
          <User size={18} />
          {isSidebarOpen && <span>{t("account")}</span>}
        </button>

        <div className="h-px bg-neutral-200 my-2" />

        <button
          onClick={toggleSidebar}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-neutral-500 hover:bg-neutral-200 hover:text-black",
            !isSidebarOpen && "justify-center px-0"
          )}
          title={t("sidebar:collapseSidebar", "Collapse Sidebar")}
        >
          {isSidebarOpen ? (
            <ChevronLeft size={18} />
          ) : (
            <ChevronRight size={18} />
          )}
          {isSidebarOpen && <span>{t("sidebar:collapse", "Collapse")}</span>}
        </button>
      </div>

      {/* Import Database Modal */}
      <ImportDatabaseModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Sidebar Resize Handle */}
      {isSidebarOpen && (
        <div
          className="absolute top-0 right-0 w-1 h-full bg-transparent hover:bg-neutral-400 cursor-col-resize transition-colors z-30"
          onMouseDown={() => setIsResizingSidebar(true)}
        />
      )}
    </aside>
  );
};
