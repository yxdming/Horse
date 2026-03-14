import { create } from "zustand";
import { Connection, Session } from "@/types";
import { api, type BuildStatus } from "@/lib/api";
import i18n from "@/i18n/config";
import { updateTaskByType, completeTaskByType } from "@/services/TaskQueueManager";

type SettingsTab = "info" | "data" | "kb" | "chats";

// Helper to translate backend build messages
const translateBuildMessage = (message: string | null | undefined): string => {
  if (!message) return '';
  
  // If it's a plain message (doesn't start with "kb."), return as-is
  if (!message.startsWith('kb.')) return message;
  
  const parts = message.split(':');
  const key = parts[0]; // e.g., "kb.buildingTable"
  
  // Build translation params based on key type
  let params: Record<string, string> = {};
  if (parts.length >= 2) {
    // Handle different key patterns
    if ((key === 'kb.savedEnumKls' || key === 'kb.syncingDaac' || key === 'kb.clearingProgress') && parts.length >= 3) {
      params = { current: parts[1], total: parts[2] };
    } else if (key === 'kb.failed') {
      params = { error: parts.slice(1).join(':') };
    } else if (
      // Keys that use {{count}} parameter
      key === 'kb.extractedTables' ||
      key === 'kb.extractedColumns' ||
      key === 'kb.extractedEnums'
    ) {
      params = { count: parts[1] };
    } else {
      // All other keys with params use {{name}} parameter
      params = { name: parts.slice(1).join(':') };
    }
  }
  
  // Try to translate using i18n
  const translationKey = `database:${key}`;
  const translated = i18n.t(translationKey, params);
  
  // If translation key not found, return original message
  return translated === translationKey ? message : translated;
};

// Pending experience data for pre-filling AddExperienceModal
interface PendingExperience {
  question: string;
  sql: string;
  autoExecute?: boolean;  // Whether to auto-trigger SQL execution
}

// Global build state for a single database
interface BuildState {
  databaseId: string;
  databaseName: string;
  status: BuildStatus;
  abortFn: (() => void) | null;
}

interface AppState {
  // Sidebar State
  isSidebarOpen: boolean;
  toggleSidebar: () => void;

  // Connection/Database State
  connections: Connection[];
  activeConnectionId: string | null;
  fetchConnections: () => Promise<void>;
  setActiveConnection: (id: string) => void;
  deleteConnection: (id: string) => Promise<boolean>;

  // Selected Table State (for data browsing)
  selectedTable: string | null;
  setSelectedTable: (tableName: string | null) => void;

  // Database Settings Tab
  settingsTab: SettingsTab;
  setSettingsTab: (tab: SettingsTab) => void;

  // Global KB Build State
  activeBuild: BuildState | null;
  startBuild: (
    databaseId: string,
    databaseName: string,
    force: boolean
  ) => void;
  updateBuildStatus: (status: BuildStatus) => void;
  cancelBuild: () => Promise<void>;
  clearBuild: () => void;

  // Session State
  sessions: Record<string, Session[]>;
  activeSessionId: string | null;
  fetchSessions: (databaseId?: string) => Promise<void>;
  setActiveSession: (id: string | null) => void;
  switchToSession: (sessionId: string, databaseId: string) => void;
  createSession: (databaseId: string) => Promise<Session>;
  deleteSession: (sessionId: string, databaseId: string) => Promise<boolean>;

  // Tabs (Simple implementation for now)
  activeTab: "chat" | "database" | "knowledge";
  setActiveTab: (tab: "chat" | "database" | "knowledge") => void;

  // Pending Experience for AddExperienceModal pre-fill
  pendingExperience: PendingExperience | null;
  setPendingExperience: (experience: PendingExperience | null) => void;
  openAddExperienceWithData: (
    databaseId: string,
    question: string,
    sql: string,
    autoExecute?: boolean
  ) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  isSidebarOpen: true,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  connections: [],
  activeConnectionId: null,
  fetchConnections: async () => {
    try {
      const [dbs] = await Promise.all([api.getDbConnections()]);
      set({ connections: dbs });
    } catch (e) {
      console.error("Failed to fetch connections:", e);
    }
  },
  setActiveConnection: (id) =>
    set({ activeConnectionId: id, selectedTable: null, activeSessionId: null }),
  deleteConnection: async (id: string) => {
    try {
      await api.deleteDatabase(id);
      // Refresh connections list
      await get().fetchConnections();
      // Clear active connection if it was deleted
      if (get().activeConnectionId === id) {
        set({ activeConnectionId: null, selectedTable: null });
      }
      return true;
    } catch (e) {
      console.error("Failed to delete connection:", e);
      return false;
    }
  },

  selectedTable: null,
  setSelectedTable: (tableName) => set({ selectedTable: tableName }),

  settingsTab: "info",
  setSettingsTab: (tab) => set({ settingsTab: tab }),

  // Global KB Build State
  activeBuild: null,
  startBuild: (databaseId: string, databaseName: string, force: boolean) => {
    // Abort any existing build
    const currentBuild = get().activeBuild;
    if (currentBuild?.abortFn) {
      currentBuild.abortFn();
    }

    const initialStatus: BuildStatus = {
      database_id: databaseId,
      status: "building",
      progress: 0,
      progress_pct: 0,
      message: i18n.t("database:starting"),
      step: null,
      step_progress: null,
      step_progress_pct: null,
      step_current: null,
      step_total: null,
      elapsed: null,
      estimated: null,
    };

    // Start the build stream
    const abortFn = api.buildKbStream(
      databaseId,
      force,
      (status) => {
        set((state) => ({
          activeBuild:
            state.activeBuild?.databaseId === databaseId
              ? { ...state.activeBuild, status }
              : state.activeBuild,
        }));

        // Update TaskQueueManager progress
        const progress = Math.round((status.progress || 0) * 100);
        const taskType = force ? 'kb-rebuild' : 'kb-build';
        updateTaskByType(taskType, { databaseId }, {
          progress,
          message: translateBuildMessage(status.message)
        });

        // Complete the task when done
        if (status.status === "completed") {
          completeTaskByType(taskType, { databaseId }, 'completed', i18n.t('database:kb.success'));
          get().fetchConnections();
        } else if (status.status === "failed") {
          completeTaskByType(taskType, { databaseId }, 'error', i18n.t('database:kb.failed', { error: status.message || 'Unknown error' }));
        } else if (status.status === "cancelled") {
          completeTaskByType(taskType, { databaseId }, 'error', i18n.t('database:kb.cancelled'));
        }
      },
      (error) => {
        set((state) => {
          const current = state.activeBuild;
          if (!current) return state;
          return {
            activeBuild:
              current.databaseId === databaseId
                ? { ...current, status: { ...current.status, status: 'failed', progress: 0, progress_pct: 0, message: error.message } }
                : current,
          };
        });

        // Update TaskQueueManager with error
        const taskType = force ? 'kb-rebuild' : 'kb-build';
        completeTaskByType(taskType, { databaseId }, 'error', error.message);
      },
      () => {
        // Build completed (success or failure)
      }
    );

    set({
      activeBuild: {
        databaseId,
        databaseName,
        status: initialStatus,
        abortFn,
      },
    });
  },
  updateBuildStatus: (status) => {
    set((state) => ({
      activeBuild: state.activeBuild ? { ...state.activeBuild, status } : null,
    }));
  },
  cancelBuild: async () => {
    const currentBuild = get().activeBuild;
    if (!currentBuild || currentBuild.status.status !== "building") {
      return;
    }

    try {
      // Call backend to cancel the build
      await api.cancelBuild(currentBuild.databaseId);
      // The SSE stream will receive a 'cancelled' status and update accordingly
    } catch (error) {
      console.error("Failed to cancel build:", error);
    }
  },
  clearBuild: () => {
    const currentBuild = get().activeBuild;
    if (currentBuild?.abortFn && currentBuild.status.status === "building") {
      currentBuild.abortFn();
    }
    set({ activeBuild: null });
  },

  sessions: {},
  activeSessionId: null,
  fetchSessions: async (databaseId?: string) => {
    try {
      const newSessions = await api.getSessions(databaseId);
      if (databaseId) {
        // Merge with existing sessions for other databases
        set((state) => ({
          sessions: {
            ...state.sessions,
            ...newSessions,
          },
        }));
      } else {
        // Full refresh
        set({ sessions: newSessions });
      }
    } catch (e) {
      console.error("Failed to fetch sessions:", e);
    }
  },
  setActiveSession: (id) => set({ activeSessionId: id }),
  switchToSession: (sessionId: string, databaseId: string) => {
    // Atomically switch to a session - sets both connection and session together
    set({
      activeConnectionId: databaseId,
      activeSessionId: sessionId,
      selectedTable: null,
      activeTab: "chat",
    });
  },
  createSession: async (databaseId: string) => {
    const session = await api.createSession(databaseId);
    // Add session directly to local state instead of fetching from server
    // This prevents race conditions and ensures immediate visibility
    set((state) => ({
      sessions: {
        ...state.sessions,
        [databaseId]: [session, ...(state.sessions[databaseId] || [])],
      },
      activeSessionId: session.id,
    }));
    return session;
  },
  deleteSession: async (sessionId: string, databaseId: string) => {
    const success = await api.deleteSession(sessionId);
    if (success) {
      // Remove session from local state immediately
      set((state) => {
        const dbSessions = state.sessions[databaseId] || [];
        const newSessions = dbSessions.filter((s) => s.id !== sessionId);
        return {
          sessions: {
            ...state.sessions,
            [databaseId]: newSessions,
          },
          // Clear active session if it was deleted
          activeSessionId:
            state.activeSessionId === sessionId ? null : state.activeSessionId,
        };
      });
    }
    return success;
  },

  activeTab: "chat",
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Pending Experience for AddExperienceModal pre-fill
  pendingExperience: null,
  setPendingExperience: (experience) => set({ pendingExperience: experience }),
  openAddExperienceWithData: (databaseId, question, sql, autoExecute = true) => {
    // Set the pending experience data
    set({
      pendingExperience: { question, sql, autoExecute },
      // Navigate to the database's KB tab
      activeConnectionId: databaseId,
      activeTab: "database",
      settingsTab: "kb",
    });
  },
}));
