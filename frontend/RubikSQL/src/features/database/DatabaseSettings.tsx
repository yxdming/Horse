import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Database,
  Info,
  Table2,
  BrainCircuit,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Copy,
  Check,
  Clock,
  Zap,
  FolderEdit,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { api } from '@/lib/api';
import { copyToClipboard } from '@/lib/clipboard';
import { addTask, taskQueueManager, useTaskQueue } from '@/services/TaskQueueManager';
import { SchemaTree } from './SchemaTree';
import { DataGrid } from './DataGrid';
import { KnowledgeBrowser } from '@/features/knowledge/KnowledgeBrowser';
import { SchemaNode } from '@/types';

// Tauri APIs - imported dynamically to support both browser and Tauri
let tauriDialog: typeof import('@tauri-apps/api/dialog') | null = null;

// Check if running in Tauri
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

// Load Tauri APIs if available
if (isTauri) {
  import('@tauri-apps/api/dialog').then(m => { tauriDialog = m; });
}

type SettingsTab = 'info' | 'data' | 'kb' | 'chats';

interface DatabaseStatus {
  exists: boolean;
  path: string;
  connected: boolean;
}

export const DatabaseSettings = () => {
  const { t } = useTranslation(['common', 'database']);
  const { activeTasks } = useTaskQueue();
  const {
    activeConnectionId,
    connections,
    selectedTable,
    setSelectedTable,
    deleteConnection,
    setActiveTab,
    settingsTab,
    setSettingsTab,
    activeBuild,
    startBuild,
    cancelBuild
  } = useAppStore();
  
  const [schema, setSchema] = useState<SchemaNode[]>([]);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedKb, setCopiedKb] = useState(false);
  const [_isSyncing, _setIsSyncing] = useState(false);

  // Check if there's an active sync task for this database
  const hasActiveSyncTask = () => {
    return activeTasks.some(t =>
      t.type === 'kb-sync' &&
      t.metadata?.databaseId === activeConnectionId
    );
  };

  // Path change modal state (for both DB and KB)
  const [showPathModal, setShowPathModal] = useState(false);
  const [pathModalTarget, setPathModalTarget] = useState<'db' | 'kb'>('kb');
  const [newPath, setNewPath] = useState('');
  const [pathSaving, setPathSaving] = useState(false);
  const [moveFiles, setMoveFiles] = useState(false); // Whether to copy files when changing path
  
  // Resizable explorer sidebar
  const [explorerWidth, setExplorerWidth] = useState(window.innerWidth * 0.15); // Default to 15% of window width
  const [isResizingExplorer, setIsResizingExplorer] = useState(false);
  const dataTabRef = useRef<HTMLDivElement>(null);

  // Get current connection
  const connection = connections.find(c => c.id === activeConnectionId);

  // Get build status for current database
  const currentBuildStatus = activeBuild?.databaseId === activeConnectionId ? activeBuild.status : null;
  const isBuilding = currentBuildStatus?.status === 'building' || currentBuildStatus?.status === 'syncing';

  // Check database status periodically
  const checkStatus = useCallback(async () => {
    if (!activeConnectionId) return;
    
    setStatusLoading(true);
    try {
      const status = await api.checkDatabase(activeConnectionId);
      setDbStatus(status);
    } catch (e) {
      console.error('Failed to check database status:', e);
      setDbStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }, [activeConnectionId]);

  // Load schema when switching to data tab
  useEffect(() => {
    if (settingsTab === 'data' && activeConnectionId) {
      api.getSchema(activeConnectionId)
        .then(setSchema)
        .catch(console.error);
    }
  }, [settingsTab, activeConnectionId]);

  // Check status on mount and periodically (every 60s)
  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every 60s
    return () => clearInterval(interval);
  }, [checkStatus]);

  // Handle explorer resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingExplorer || !dataTabRef.current) return;
      
      const containerRect = dataTabRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      const minWidth = containerRect.width * 0.15; // 15% minimum
      const maxWidth = containerRect.width * 0.50; // 50% maximum
      
      setExplorerWidth(Math.min(Math.max(newWidth, minWidth), maxWidth));
    };

    const handleMouseUp = () => {
      setIsResizingExplorer(false);
      document.body.style.cursor = 'default';
    };

    if (isResizingExplorer) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isResizingExplorer]);

  // Handle KB build using TaskQueueManager
  const handleBuildKb = useCallback((force: boolean = false) => {
    if (!activeConnectionId || !connection || isBuilding) return;

    // Add task to queue
    addTask(
      force ? 'kb-rebuild' : 'kb-build',
      force
        ? t('database:kbRebuilding', 'Rebuilding Knowledge Base for "{{name}}"...', { name: connection.name })
        : t('database:kbBuilding', 'Building Knowledge Base for "{{name}}"...', { name: connection.name }),
      { databaseId: activeConnectionId, databaseName: connection.name, force }
    );

    // Start the build (the backend will update the task via SSE)
    startBuild(activeConnectionId, connection.name, force);
  }, [activeConnectionId, connection, isBuilding, startBuild, t]);

  // Handle delete
  const handleDelete = async () => {
    if (!activeConnectionId) return;
    
    setDeleteLoading(true);
    const success = await deleteConnection(activeConnectionId);
    setDeleteLoading(false);
    
    if (success) {
      setShowDeleteConfirm(false);
      setActiveTab('chat');
    }
  };

  // Format time duration
  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Translate build message from backend key format
  // Format: "kb.keyName" or "kb.keyName:param1" or "kb.keyName:param1:param2"
  const translateBuildMessage = useCallback((message: string | null | undefined): string => {
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
    const translated = t(translationKey, params);
    
    // If translation key not found, return original message
    return translated === translationKey ? message : translated;
  }, [t]);

  // Copy path to clipboard
  const copyPath = async () => {
    if (connection?.database) {
      try {
        await copyToClipboard(connection.database);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  if (!connection) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-neutral-50">
        <div className="text-center text-neutral-400">
          <Database size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-sm">{t('database:selectDatabase', 'Select a database to view settings')}</p>
        </div>
      </div>
    );
  }

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'info', label: t('database:info', 'Info'), icon: <Info size={16} /> },
    { id: 'data', label: t('database:data', 'Data'), icon: <Table2 size={16} /> },
    { id: 'kb', label: t('database:knowledge', 'Knowledge'), icon: <BrainCircuit size={16} /> },
    { id: 'chats', label: t('database:chats', 'Chats'), icon: <MessageSquare size={16} /> },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black rounded-lg">
            <Database size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">{connection.name}</h1>
            <p className="text-xs text-neutral-500">{connection.type} • {connection.id}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 border-b border-neutral-200">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSettingsTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                settingsTab === tab.id
                  ? "border-black text-black"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {/* Info Tab */}
        {settingsTab === 'info' && (
          <div className="p-6 space-y-8">
            {/* ========== Database Section ========== */}
            <section>
              <h2 className="text-base font-bold text-neutral-900 mb-4">
                {t('database:sectionDatabase', 'Database')}
              </h2>
              
              {/* Database File Path */}
              <div className="mb-4">
                <label className="text-sm text-neutral-500 mb-1 block">
                  {t('database:filePath', 'Database File Path')}
                </label>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg font-mono text-sm truncate",
                    connection.database ? "text-neutral-700" : "text-neutral-400 italic"
                  )}>
                    {connection.database || t('database:notConfigured', 'Not configured')}
                  </div>
                  {connection.database && (
                    <button
                      onClick={copyPath}
                      className="p-2 hover:bg-neutral-100 rounded-lg transition-colors shrink-0"
                      title={t('common:copy', 'Copy')}
                    >
                      {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} className="text-neutral-500" />}
                    </button>
                  )}
                  {connection.database && (
                    <button
                      onClick={async () => {
                        try {
                          // Extract directory from file path
                          const dirPath = connection.database?.substring(0, connection.database.lastIndexOf('/')) || connection.database;
                          if (dirPath) {
                            await api.openPath(dirPath);
                          }
                        } catch (error) {
                          console.error('Failed to open folder:', error);
                        }
                      }}
                      className="p-2 hover:bg-neutral-100 rounded-lg transition-colors shrink-0"
                      title={t('database:open', 'Open')}
                    >
                      <FolderOpen size={18} className="text-neutral-500" />
                    </button>
                  )}
                  {/* Edit Button (for SQLite) */}
                  {connection.type === 'sqlite' && (
                    <button
                      onClick={() => {
                        setPathModalTarget('db');
                        setNewPath(connection.database || '');
                        setMoveFiles(false); // Default to edit mode
                        setShowPathModal(true);
                      }}
                      className="p-2 hover:bg-neutral-100 rounded-lg transition-colors shrink-0"
                      title={t('database:change', 'Change')}
                    >
                      <FolderEdit size={18} className="text-neutral-500" />
                    </button>
                  )}
                  {/* Connection Status Button */}
                  <div className="relative group">
                    <button
                      onClick={checkStatus}
                      disabled={statusLoading}
                      className={cn(
                        "p-2 rounded-lg transition-colors shrink-0",
                        statusLoading && "cursor-wait",
                        !dbStatus?.exists
                          ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
                          : dbStatus?.connected
                            ? "bg-green-100 text-green-600 hover:bg-green-200"
                            : "bg-red-100 text-red-600 hover:bg-red-200"
                      )}
                    >
                      {statusLoading ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : !dbStatus?.exists ? (
                        <AlertTriangle size={18} />
                      ) : dbStatus?.connected ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <XCircle size={18} />
                      )}
                    </button>
                    <div className="absolute right-0 top-full mt-1 px-2 py-1 bg-neutral-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                      {!dbStatus?.exists
                        ? t('database:fileNotFound', 'File not found')
                        : dbStatus?.connected
                          ? t('database:connected', 'Connected')
                          : t('database:disconnected', 'Disconnected')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Database Info Grid */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-neutral-500 block">{t('database:type', 'Type')}</span>
                  <span className="text-neutral-900 font-medium">{connection.type}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">{t('database:id', 'ID')}</span>
                  <span className="text-neutral-900 font-mono text-xs">{connection.id}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">{t('database:createdAt', 'Created')}</span>
                  <span className="text-neutral-900">{new Date(connection.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </section>

            {/* Separator */}
            <div className="border-t border-neutral-200" />

            {/* ========== Knowledge Base Section ========== */}
            <section>
              <h2 className="text-base font-bold text-neutral-900 mb-4">
                {t('database:sectionKnowledgeBase', 'Knowledge Base')}
              </h2>

              {/* KB Path */}
              <div className="mb-4">
                <label className="text-sm text-neutral-500 mb-1 block">
                  {t('database:kbPath', 'Knowledge Base Path')}
                </label>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg font-mono text-sm truncate",
                    connection.kb_path ? "text-neutral-700" : "text-neutral-400 italic"
                  )}>
                    {connection.kb_path || t('database:kbNotConfigured', 'Not configured')}
                  </div>
                  {connection.kb_path && (
                    <button
                      onClick={async () => {
                        try {
                          await copyToClipboard(connection.kb_path || '');
                          setCopiedKb(true);
                          setTimeout(() => setCopiedKb(false), 2000);
                        } catch (error) {
                          console.error('Failed to copy:', error);
                        }
                      }}
                      className="p-2 hover:bg-neutral-100 rounded-lg transition-colors shrink-0"
                      title={t('common:copy', 'Copy')}
                    >
                      {copiedKb ? <Check size={18} className="text-green-600" /> : <Copy size={18} className="text-neutral-500" />}
                    </button>
                  )}
                  {connection.kb_path && (
                    <button
                      onClick={async () => {
                        try {
                          if (connection.kb_path) {
                            await api.openPath(connection.kb_path);
                          }
                        } catch (error) {
                          console.error('Failed to open folder:', error);
                        }
                      }}
                      className="p-2 hover:bg-neutral-100 rounded-lg transition-colors shrink-0"
                      title={t('database:open', 'Open')}
                    >
                      <FolderOpen size={18} className="text-neutral-500" />
                    </button>
                  )}
                  {/* Edit Button */}
                  <button
                    onClick={() => {
                      setPathModalTarget('kb');
                      setNewPath(connection.kb_path || '');
                      setMoveFiles(false); // Default to edit mode
                      setShowPathModal(true);
                    }}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors shrink-0"
                    title={t('database:change', 'Change')}
                  >
                    <FolderEdit size={18} className="text-neutral-500" />
                  </button>
                  {/* KB Status */}
                  <div className="relative group">
                    <button
                      className={cn(
                        "p-2 rounded-lg transition-colors shrink-0",
                        connection.kb_built
                          ? "bg-green-100 text-green-600 hover:bg-green-200"
                          : "bg-neutral-100 text-neutral-400"
                      )}
                    >
                      {connection.kb_built ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    </button>
                    <div className="absolute right-0 top-full mt-1 px-2 py-1 bg-neutral-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                      {connection.kb_built
                        ? t('database:kbBuilt', 'Knowledge Base Built')
                        : t('database:kbNotBuilt', 'Not built')}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Build Status Card */}
              <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      currentBuildStatus?.status === 'completed' || (!currentBuildStatus && connection.kb_built) ? "bg-green-100" :
                      currentBuildStatus?.status === 'failed' ? "bg-red-100" :
                      currentBuildStatus?.status === 'building' ? "bg-blue-100" :
                      "bg-neutral-100"
                    )}>
                      {currentBuildStatus?.status === 'completed' || (!currentBuildStatus && connection.kb_built) ? (
                        <CheckCircle2 size={20} className="text-green-600" />
                      ) : currentBuildStatus?.status === 'failed' ? (
                        <XCircle size={20} className="text-red-600" />
                      ) : currentBuildStatus?.status === 'building' ? (
                        <Loader2 size={20} className="text-blue-600 animate-spin" />
                      ) : (
                        <BrainCircuit size={20} className="text-neutral-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-neutral-900 text-sm">
                        {currentBuildStatus?.status === 'completed' || (!currentBuildStatus && connection.kb_built) 
                          ? t('database:kbBuilt', 'Knowledge Base Built') 
                          : currentBuildStatus?.status === 'failed' 
                          ? t('database:kbFailed', 'Build Failed')
                          : currentBuildStatus?.status === 'cancelled'
                          ? t('database:kbCancelled', 'Build Cancelled')
                          : currentBuildStatus?.status === 'building' 
                          ? t('database:building', 'Building...') 
                          : t('database:kbReady', 'Ready to Build')}
                      </h4>
                      <p className="text-xs text-neutral-500">
                        {translateBuildMessage(currentBuildStatus?.message ?? undefined) || (connection.kb_built 
                          ? t('database:kbReadyToUse', 'Knowledge base is ready for AI queries')
                          : t('database:kbBuildHint', 'Build knowledge base to enable AI features'))}
                      </p>
                    </div>
                  </div>
                  
                  {/* Build/Cancel/Sync Buttons */}
                  <div className="flex items-center gap-2">
                    {isBuilding && (
                      <button
                        onClick={() => cancelBuild()}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        <XCircle size={14} />
                        {t('database:cancel', 'Cancel')}
                      </button>
                    )}
                    {/* Only show Build button when KB is not built yet */}
                    {!connection.kb_built && currentBuildStatus?.status !== 'completed' && (
                      <button
                        onClick={() => handleBuildKb(false)}
                        disabled={isBuilding}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors",
                          isBuilding
                            ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                            : "bg-black text-white hover:bg-neutral-800"
                        )}
                      >
                        {isBuilding ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            {t('database:building', 'Building...')}
                          </>
                        ) : (
                          <>
                            <Zap size={14} />
                            {t('database:build', 'Build')}
                          </>
                        )}
                      </button>
                    )}
                    {/* Show Sync button when KB is built and ready */}
                    {(connection.kb_built || currentBuildStatus?.status === 'completed') && !isBuilding && activeConnectionId && (
                      <button
                        onClick={() => {
                          // Add sync task to queue
                          const taskId = addTask(
                            'kb-sync',
                            t('database:kbSyncing', 'Syncing Knowledge Base for "{{name}}"...', { name: connection?.name || activeConnectionId }),
                            { databaseId: activeConnectionId, databaseName: connection?.name }
                          );

                          // Trigger streaming sync via API
                          // Note: cancelFn is available if we want to support sync cancellation in the future
                          api.streamSyncKnowledge(
                            activeConnectionId,
                            (status) => {
                              // Update task progress
                              const progress = Math.round((status.progress || 0) * 100);
                              taskQueueManager.updateTask(taskId, {
                                progress,
                                message: translateBuildMessage(status.message)
                              });
                            },
                            (error) => {
                              // Handle error
                              console.error('Failed to sync knowledge:', error);
                              taskQueueManager.completeTask(taskId, 'error',
                                t('database:kbSyncFailed', 'Failed to sync knowledge base. Please try again.'));
                            },
                            () => {
                              // On complete - check final status
                              checkStatus(); // Refresh status
                              const connName = connection?.name || activeConnectionId;
                              taskQueueManager.completeTask(taskId, 'completed',
                                t('database:kbSyncSuccess', 'Knowledge Base sync completed for "{{name}}"', { name: connName }));
                            }
                          );
                        }}
                        disabled={hasActiveSyncTask()}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          hasActiveSyncTask()
                            ? "text-neutral-300 cursor-not-allowed"
                            : "hover:bg-neutral-100"
                        )}
                        title={t('database:forceResync', 'Force Resync')}
                      >
                        <RefreshCw size={16} className={cn(hasActiveSyncTask() && "animate-spin")} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Section */}
                {isBuilding && currentBuildStatus && (
                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    {/* Progress Bar */}
                    <div className="relative h-1.5 bg-neutral-100 rounded-full overflow-hidden mb-2">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${currentBuildStatus?.progress_pct ?? ((currentBuildStatus?.progress || 0) * 100)}%` }}
                      />
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                        style={{ backgroundSize: '200% 100%' }}
                      />
                    </div>

                    {/* Step and Time Info */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-neutral-600">
                        <span className="font-medium truncate max-w-[200px]">
                          {translateBuildMessage(currentBuildStatus?.step) || t('database:initializing', 'Initializing...')}
                        </span>
                        {currentBuildStatus?.step_current !== undefined && currentBuildStatus?.step_total !== undefined && (
                          <span className="text-neutral-400">
                            ({currentBuildStatus.step_current}/{currentBuildStatus.step_total})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-neutral-500 shrink-0">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{formatTime(currentBuildStatus?.elapsed ?? null)}</span>
                        </div>
                        <span className="text-neutral-400">
                          {((currentBuildStatus?.progress_pct ?? ((currentBuildStatus?.progress || 0) * 100))).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Details */}
                {currentBuildStatus?.status === 'failed' && currentBuildStatus.message && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-700 font-mono">{translateBuildMessage(currentBuildStatus.message)}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Separator */}
            <div className="border-t border-neutral-200" />

            {/* ========== Danger Zone Section ========== */}
            <section>
              <h2 className="text-base font-bold text-red-700 mb-4">
                {t('database:dangerZone', 'Danger Zone')}
              </h2>
              <div className="space-y-3">
                {/* Force Rebuild KB */}
                {(connection.kb_built || currentBuildStatus?.status === 'completed') && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          {t('database:forceRebuildKb', 'Force Rebuild Knowledge Base')}
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          {t('database:forceRebuildKbHint', 'This will remove all Enum, Column, Table, and Database knowledge. Custom knowledge will be preserved but may need manual sync.')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleBuildKb(true)}
                        disabled={isBuilding}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors shrink-0",
                          isBuilding
                            ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                            : "bg-red-600 text-white hover:bg-red-700"
                        )}
                      >
                        {isBuilding ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <RefreshCw size={14} />
                        )}
                        {t('database:forceRebuild', 'Force Rebuild')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Remove Connection */}
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        {t('database:removeConnection', 'Remove Connection')}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        {t('database:removeConnectionHint', 'This removes the database from RubikSQL. Your data files will not be deleted.')}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shrink-0"
                    >
                      {t('database:remove', 'Remove')}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Path Change Modal */}
            {showPathModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                  onClick={() => setShowPathModal(false)}
                />
                <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    {pathModalTarget === 'db'
                      ? t('database:changeDbPathTitle', 'Change Database Path')
                      : t('database:changeKbPathTitle', 'Change Knowledge Base Path')}
                  </h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    {t('database:changePathHint', 'Enter new path for your database or knowledge base.')}
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="text"
                      value={newPath}
                      onChange={(e) => setNewPath(e.target.value)}
                      placeholder={pathModalTarget === 'db'
                        ? t('database:enterPath', '/path/to/database.sqlite')
                        : t('database:enterKbPath', 'Enter knowledge base path...')}
                      className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {isTauri && (
                      <button
                        onClick={async () => {
                          if (tauriDialog) {
                            try {
                              const selected = pathModalTarget === 'db'
                                ? await tauriDialog.open({
                                    multiple: false,
                                    filters: [{
                                      name: 'SQLite Database',
                                      extensions: ['db', 'sqlite', 'sqlite3']
                                    }],
                                    title: t('database:selectDatabaseFile', 'Select Database File'),
                                  })
                                : await tauriDialog.open({
                                    directory: true,
                                    title: t('database:selectKbFolder', 'Select Knowledge Base Folder'),
                                  });
                              if (selected && typeof selected === 'string') {
                                setNewPath(selected);
                              }
                            } catch (error) {
                              console.error('File dialog error:', error);
                            }
                          }
                        }}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        title={t('database:browse', 'Browse')}
                      >
                        <FolderOpen size={18} className="text-neutral-500" />
                      </button>
                    )}
                  </div>
                  {/* Move Files Checkbox */}
                  <div className="flex items-start gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="moveFiles"
                      checked={moveFiles}
                      onChange={(e) => setMoveFiles(e.target.checked)}
                      className="w-4 h-4 text-neutral-600 border-neutral-300 rounded focus:ring-neutral-500 mt-0.5"
                    />
                    <label htmlFor="moveFiles" className="text-sm text-neutral-600 leading-relaxed">
                      {t('database:moveFilesHint', 'Copy files to new location (if unchecked, only path reference will be changed)')}
                    </label>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowPathModal(false)}
                      className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                      disabled={pathSaving}
                    >
                      {t('common:cancel', 'Cancel')}
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implement path change API with moveFiles parameter
                        setPathSaving(true);
                        setTimeout(() => {
                          setPathSaving(false);
                          setShowPathModal(false);
                        }, 1000);
                      }}
                      disabled={pathSaving || !newPath.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:bg-neutral-300"
                    >
                      {pathSaving && <Loader2 size={16} className="animate-spin" />}
                      {t('common:save', 'Save')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div 
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                  onClick={() => setShowDeleteConfirm(false)}
                />
                <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    {t('database:confirmRemove', 'Remove Connection?')}
                  </h3>
                  <p className="text-sm text-neutral-600 mb-6">
                    {t('database:removeWarning', 'Are you sure you want to remove this database connection? Your data files will not be deleted.')}
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                      disabled={deleteLoading}
                    >
                      {t('common:cancel', 'Cancel')}
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleteLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                      {deleteLoading && <Loader2 size={16} className="animate-spin" />}
                      {t('database:remove', 'Remove')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Data Tab */}
        {settingsTab === 'data' && (
          <div ref={dataTabRef} className="flex h-full">
            <SchemaTree 
              data={schema} 
              onTableSelect={setSelectedTable}
              selectedTable={selectedTable}
              width={explorerWidth}
              isResizing={isResizingExplorer}
            />
            {/* Resize Handle */}
            <div 
              className="w-1 bg-neutral-200 hover:bg-neutral-400 cursor-col-resize shrink-0 transition-colors"
              onMouseDown={() => setIsResizingExplorer(true)}
            />
            <DataGrid 
              dbId={activeConnectionId}
              tableName={selectedTable}
            />
          </div>
        )}

        {/* KB Tab - Knowledge Browser */}
        {settingsTab === 'kb' && activeConnectionId && (
          <KnowledgeBrowser dbId={activeConnectionId} />
        )}

        {/* Chats Tab */}
        {settingsTab === 'chats' && (
          <div className="p-6 flex items-center justify-center h-full">
            <div className="text-center text-neutral-400">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm">{t('database:chatsComingSoon', 'Chat history coming soon')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Export a function to set the initial tab from outside
export const useSettingsTab = () => {
  const [initialTab, setInitialTab] = useState<SettingsTab>('info');
  return { initialTab, setInitialTab };
};
