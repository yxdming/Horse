import { useState, useCallback, useEffect, useRef } from 'react';
import { X, Database, Loader2, CheckCircle2, AlertCircle, FolderOpen, ChevronDown, Play, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useAppStore } from '@/stores/useAppStore';
import { SqliteIcon, PostgresIcon, MysqlIcon, DuckdbIcon, MssqlIcon } from '@/components/icons/DatabaseIcons';

// Tauri APIs - imported dynamically to support both browser and Tauri
let tauriDialog: typeof import('@tauri-apps/api/dialog') | null = null;

// Check if running in Tauri
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

// Load Tauri APIs if available
if (isTauri) {
  import('@tauri-apps/api/dialog').then(m => { tauriDialog = m; });
}

interface ImportDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ImportStatus = 'idle' | 'uploading' | 'success' | 'error';
type DatabaseType = 'sqlite' | 'postgresql' | 'mysql' | 'duckdb' | 'mssql';

// Database type options configuration
const DB_TYPE_OPTIONS: { value: DatabaseType; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { value: 'sqlite', label: 'SQLite', icon: SqliteIcon },
  { value: 'postgresql', label: 'PostgreSQL', icon: PostgresIcon },
  { value: 'mysql', label: 'MySQL', icon: MysqlIcon },
  { value: 'duckdb', label: 'DuckDB', icon: DuckdbIcon },
  { value: 'mssql', label: 'SQL Server', icon: MssqlIcon },
];

// File-based database types
const FILE_BASED_TYPES: DatabaseType[] = ['sqlite', 'duckdb'];
// Server-based database types (require host/port/user/password)
const SERVER_BASED_TYPES: DatabaseType[] = ['postgresql', 'mysql', 'mssql'];

export const ImportDatabaseModal = ({ isOpen, onClose }: ImportDatabaseModalProps) => {
  const { t } = useTranslation(['common', 'database']);
  const { fetchConnections } = useAppStore();
  
  const [dbType, setDbType] = useState<DatabaseType>('sqlite');
  const [dbName, setDbName] = useState('');
  const [filePath, setFilePath] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Server-based connection details
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState('5432');
  const [user, setUser] = useState('postgres');
  const [password, setPassword] = useState('');
  const [database, setDatabase] = useState('postgres');

  const [status, setStatus] = useState<ImportStatus>('idle');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load default database provider settings when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDefaults();
    }
  }, [isOpen]);

  const loadDefaults = async () => {
    try {
      const cfg = await api.getConfig();
      // Load defaults based on current db type
      const provider = cfg.database_providers?.[dbType];
      if (provider && SERVER_BASED_TYPES.includes(dbType)) {
        setHost(provider.host || 'localhost');
        setPort(String(provider.port || getDefaultPort(dbType)));
        setUser(provider.user || '');
        setPassword(provider.password || '');
      }
    } catch (err) {
      console.error('Failed to load database defaults:', err);
    }
  };

  // Get default port for server-based database types
  const getDefaultPort = (type: DatabaseType): number => {
    switch (type) {
      case 'postgresql': return 5432;
      case 'mysql': return 3306;
      case 'mssql': return 1433;
      default: return 5432;
    }
  };

  // Update defaults when db type changes
  const handleDbTypeChange = (type: DatabaseType) => {
    setDbType(type);
    setTestStatus('idle');
    setErrorMessage('');
    setIsDropdownOpen(false);
    // Reset port to default for the new type
    if (SERVER_BASED_TYPES.includes(type)) {
      setPort(String(getDefaultPort(type)));
      setUser(type === 'mssql' ? 'sa' : (type === 'mysql' ? 'root' : 'postgres'));
      setDatabase(type === 'mssql' ? 'master' : 'postgres');
    }
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setErrorMessage('');
    
    try {
      const requestData: any = {};
      if (FILE_BASED_TYPES.includes(dbType)) {
        if (!filePath.trim()) {
          setTestStatus('error');
          setErrorMessage(t('database:pleaseProvidePath', 'Please provide a file path'));
          return;
        }
        requestData.path = filePath;
      } else if (SERVER_BASED_TYPES.includes(dbType)) {
        requestData.host = host;
        requestData.port = parseInt(port);
        requestData.user = user;
        requestData.password = password;
        requestData.database = database;
      }

      const result = await api.testConnection(dbType, requestData);
      
      if (result.success) {
        setTestStatus('success');
        // Auto-fill name if empty
        if (!dbName) {
          if (FILE_BASED_TYPES.includes(dbType)) {
            const filename = filePath.split(/[/\\]/).pop() || '';
            setDbName(filename.replace(/\.[^/.]+$/, ''));
          } else {
            setDbName(database || dbType);
          }
        }
      } else {
        setTestStatus('error');
        setErrorMessage(t('database:connectionFailed', 'Connection failed'));
      }
    } catch (error) {
      setTestStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Connection failed');
    }
  };

  // Open native file dialog (Tauri) or show info message (browser)
  const openFileDialog = useCallback(async () => {
    if (isTauri && tauriDialog) {
      try {
        const filters = dbType === 'duckdb' 
          ? [{ name: 'DuckDB Database', extensions: ['duckdb', 'db'] }]
          : [{ name: 'SQLite Database', extensions: ['db', 'sqlite', 'sqlite3'] }];
        
        const selected = await tauriDialog.open({
          multiple: false,
          filters,
          title: t('database:selectDatabaseFile', 'Select Database File'),
        });
        
        if (selected && typeof selected === 'string') {
          setFilePath(selected);
          setErrorMessage('');
          
          // Auto-fill database name from filename
          if (!dbName) {
            const filename = selected.split(/[/\\]/).pop() || '';
            const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
            setDbName(nameWithoutExt);
          }
        }
      } catch (error) {
        console.error('File dialog error:', error);
        setErrorMessage(t('database:dialogError', 'Failed to open file dialog'));
      }
    }
  }, [dbName, dbType, t]);

  // Process file (from drag-drop)
  const handleImport = async () => {
    if (!dbName.trim()) {
      setErrorMessage(t('database:pleaseProvideName', 'Please provide a database name'));
      return;
    }

    if (FILE_BASED_TYPES.includes(dbType) && !filePath.trim()) {
      setErrorMessage(t('database:pleaseProvidePath', 'Please provide a file path'));
      return;
    }

    // Require test success before import
    if (testStatus !== 'success') {
      // Try to test automatically
      setTestStatus('testing');
      setErrorMessage('');
      try {
        const requestData: any = {};
        if (FILE_BASED_TYPES.includes(dbType)) {
          requestData.path = filePath;
        } else if (SERVER_BASED_TYPES.includes(dbType)) {
          requestData.host = host;
          requestData.port = parseInt(port);
          requestData.user = user;
          requestData.password = password;
          requestData.database = database;
        }
        const result = await api.testConnection(dbType, requestData);
        if (!result.success) {
          setTestStatus('error');
          setErrorMessage(t('database:connectionFailed', 'Connection failed'));
          return;
        }
        setTestStatus('success');
        if (!dbName) {
          if (FILE_BASED_TYPES.includes(dbType)) {
            const filename = filePath.split(/[/\\]/).pop() || '';
            setDbName(filename.replace(/\.[^/.]+$/, ''));
          } else {
            setDbName(database || dbType);
          }
        }
      } catch (error) {
        setTestStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Connection failed');
        return;
      }
    }

    setStatus('uploading');
    setErrorMessage('');

    try {
      // Construct request based on type
      const requestData: any = {
        name: dbName,
        type: dbType,
      };

      if (FILE_BASED_TYPES.includes(dbType)) {
        requestData.path = filePath;
      } else if (SERVER_BASED_TYPES.includes(dbType)) {
        requestData.host = host;
        requestData.port = parseInt(port);
        requestData.user = user;
        requestData.password = password;
        requestData.database = database;
      }

      await api.importDatabase(requestData.name, requestData.path, requestData.type, requestData);
      setStatus('success');
      await fetchConnections();
      
      // Close quickly while still flashing the success state
      setTimeout(() => {
        handleClose();
      }, 300);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Import failed');
    }
  };

  const handleClose = () => {
    setDbName('');
    setFilePath('');
    setStatus('idle');
    setTestStatus('idle');
    setErrorMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-100 rounded-lg">
              <Database size={20} className="text-neutral-700" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900">
              {t('database:importDatabase', 'Import Database')}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X size={18} className="text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Database Type Selector - Custom dropdown for Tauri compatibility */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">
              {t('database:databaseType', 'Database Type')}
            </label>
            <div className="relative" ref={dropdownRef}>
              {/* Dropdown trigger button */}
              <button
                type="button"
                onClick={() => status !== 'uploading' && setIsDropdownOpen(!isDropdownOpen)}
                className={cn(
                  "w-full flex items-center gap-3 pl-4 pr-10 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-left transition-all",
                  status === 'uploading' ? "opacity-60 cursor-not-allowed" : "hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-300"
                )}
                disabled={status === 'uploading'}
              >
                {(() => {
                  const option = DB_TYPE_OPTIONS.find(o => o.value === dbType);
                  if (!option) return null;
                  const Icon = option.icon;
                  return (
                    <>
                      <Icon size={20} className="h-5 w-5 shrink-0" />
                      <span className="flex-1">{option.label}</span>
                    </>
                  );
                })()}
              </button>
              <ChevronDown 
                size={16} 
                className={cn(
                  "absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none transition-transform",
                  isDropdownOpen && "rotate-180"
                )} 
              />
              
              {/* Dropdown menu */}
              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden">
                  {DB_TYPE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = dbType === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleDbTypeChange(option.value)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                          isSelected ? "bg-neutral-100" : "hover:bg-neutral-50"
                        )}
                      >
                        <Icon size={20} className="h-5 w-5 shrink-0" />
                        <span className="flex-1">{option.label}</span>
                        {isSelected && <Check size={16} className="text-neutral-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {FILE_BASED_TYPES.includes(dbType) && (
            <>
              {/* File Path (editable) */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  {t('database:filePath', 'Database File Path')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={filePath}
                    onChange={(e) => {
                      setFilePath(e.target.value);
                      setTestStatus('idle');
                      setErrorMessage('');
                    }}
                    placeholder={t('database:enterPath', '/path/to/database.sqlite')}
                    className="flex-1 px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-300 transition-all"
                    disabled={status === 'uploading'}
                  />
                  <button
                    onClick={openFileDialog}
                    className="px-3 py-2.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                    disabled={status === 'uploading'}
                    title={t('database:browse', 'Browse')}
                  >
                    <FolderOpen size={18} className="text-neutral-600" />
                  </button>
                </div>
                <p className="text-xs text-neutral-500">
                  {t('database:pathHint', 'Enter the absolute path to your SQLite database file')}
                </p>
              </div>

              {/* Test Connection Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing' || status === 'uploading' || !filePath.trim()}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                    testStatus === 'success'
                      ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      : testStatus === 'error'
                        ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                  )}
                >
                  {testStatus === 'testing' ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : testStatus === 'success' ? (
                    <CheckCircle2 size={14} />
                  ) : testStatus === 'error' ? (
                    <AlertCircle size={14} />
                  ) : (
                    <Play size={14} />
                  )}
                  {testStatus === 'testing' ? t('common:testing', 'Testing...') :
                    testStatus === 'success' ? t('common:connected', 'Connected') :
                      t('common:testConnection', 'Test Connection')}
                </button>
              </div>

              {/* Database Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  {t('database:databaseName', 'Database Name')}
                </label>
                <input
                  type="text"
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  placeholder={t('database:enterName', 'Enter a name for this database')}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-300 transition-all"
                  disabled={status === 'uploading'}
                />
              </div>
            </>
          )}

          {SERVER_BASED_TYPES.includes(dbType) && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    {t('database:host', 'Host')}
                  </label>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => { setHost(e.target.value); setTestStatus('idle'); }}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-300 transition-all"
                    disabled={status === 'uploading'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    {t('database:port', 'Port')}
                  </label>
                  <input
                    type="text"
                    value={port}
                    onChange={(e) => { setPort(e.target.value); setTestStatus('idle'); }}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-300 transition-all"
                    disabled={status === 'uploading'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    {t('database:user', 'User')}
                  </label>
                  <input
                    type="text"
                    value={user}
                    onChange={(e) => { setUser(e.target.value); setTestStatus('idle'); }}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-300 transition-all"
                    disabled={status === 'uploading'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    {t('database:password', 'Password')}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setTestStatus('idle'); }}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-300 transition-all"
                    disabled={status === 'uploading'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  {t('database:database', 'Database')}
                </label>
                <input
                  type="text"
                  value={database}
                  onChange={(e) => { setDatabase(e.target.value); setTestStatus('idle'); }}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-300 transition-all"
                  disabled={status === 'uploading'}
                />
              </div>

              {/* Test Connection Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing' || status === 'uploading'}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                    testStatus === 'success' 
                      ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      : testStatus === 'error'
                        ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                  )}
                >
                  {testStatus === 'testing' ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : testStatus === 'success' ? (
                    <CheckCircle2 size={14} />
                  ) : testStatus === 'error' ? (
                    <AlertCircle size={14} />
                  ) : (
                    <Play size={14} />
                  )}
                  {testStatus === 'testing' ? t('common:testing', 'Testing...') : 
                   testStatus === 'success' ? t('common:connected', 'Connected') :
                   t('common:testConnection', 'Test Connection')}
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">
                  {t('database:databaseName', 'Display Name')}
                </label>
                <input
                  type="text"
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  placeholder={t('database:enterName', 'Enter a name for this database')}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-300 transition-all"
                  disabled={status === 'uploading'}
                />
              </div>
            </>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 rounded-lg border border-red-100">
              <AlertCircle size={18} className="text-red-500 shrink-0" />
              <span className="text-sm text-red-700">{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {status === 'success' && (
            <div className="flex items-center gap-2 px-4 py-3 bg-green-50 rounded-lg border border-green-100">
              <CheckCircle2 size={18} className="text-green-500 shrink-0" />
              <span className="text-sm text-green-700">
                {t('database:importSuccess', 'Database imported successfully!')}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            disabled={status === 'uploading'}
          >
            {t('common:cancel', 'Cancel')}
          </button>
          <button
            onClick={handleImport}
            disabled={
              status === 'uploading' || 
              status === 'success' || 
              !dbName.trim() || 
              (FILE_BASED_TYPES.includes(dbType) && !filePath.trim()) ||
              (SERVER_BASED_TYPES.includes(dbType) && (!host || !port || !user || !database))
            }
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all",
              (status === 'uploading' || status === 'success' || !dbName.trim() || 
               (FILE_BASED_TYPES.includes(dbType) && !filePath.trim()) || 
               (SERVER_BASED_TYPES.includes(dbType) && (!host || !port || !user || !database)))
                ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                : "bg-black text-white hover:bg-neutral-800"
            )}
          >
            {status === 'uploading' && <Loader2 size={16} className="animate-spin" />}
            {status === 'success' && <CheckCircle2 size={16} />}
            {status === 'uploading' 
              ? t('database:importing', 'Importing...') 
              : status === 'success'
                ? t('database:imported', 'Imported!')
                : t('database:import', 'Import')
            }
          </button>
        </div>
      </div>
    </div>
  );
};
