import { useState, useEffect, useMemo } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle, ChevronDown, Sparkles, Database, Globe, Settings2, FileCode2, Eye, EyeOff, Copy, Check, Plus, Trash2, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { api, type ModelPresetConfig } from '@/lib/api';
import { copyToClipboard } from '@/lib/clipboard';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'models' | 'databases' | 'language' | 'advanced';
type DatabaseSubTab = 'postgresql' | 'mysql' | 'sqlite' | 'duckdb' | 'mssql';
type ModelsSubTab = 'presets' | 'providers';

// Consistent input styles matching ImportDatabaseModal
const inputClassName = "w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-300 transition-all";

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { t, i18n } = useTranslation(['common', 'settings']);
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('models');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Models sub-tab
  const [modelsSubTab, setModelsSubTab] = useState<ModelsSubTab>('presets');
  
  // Model presets editing state
  const [tinyModel, setTinyModel] = useState<ModelPresetConfig>({ model: '' });
  const [chatModel, setChatModel] = useState<ModelPresetConfig>({ model: '' });
  const [proModel, setProModel] = useState<ModelPresetConfig>({ model: '' });
  const [embedderModel, setEmbedderModel] = useState<ModelPresetConfig>({ model: '' });
  const [expandedPreset, setExpandedPreset] = useState<string | null>(null);
  
  // LLM Providers state - now stores full config with editable kv pairs
  const [llmProviders, setLlmProviders] = useState<Record<string, Record<string, any>>>({});
  const [providerEdits, setProviderEdits] = useState<Record<string, Record<string, string | null>>>({});
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [showApiKeyFor, setShowApiKeyFor] = useState<string | null>(null);
  const [apiKeyCopied, setApiKeyCopied] = useState<string | null>(null);  // Track which provider's key was copied
  const [newKvKey, setNewKvKey] = useState<Record<string, string>>({});
  const [newKvValue, setNewKvValue] = useState<Record<string, string>>({});
  
  // New provider creation state
  const [showNewProviderForm, setShowNewProviderForm] = useState(false);
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderBackend, setNewProviderBackend] = useState('');
  const [newProviderApiBase, setNewProviderApiBase] = useState('');
  
  // Default provider names that cannot be deleted
  const DEFAULT_PROVIDER_NAMES = new Set(['openrouter', 'openai', 'gemini', 'anthropic', 'deepseek', 'ollama', 'lmstudio', 'vllm']);
  
  // Database provider defaults
  const [dbSubTab, setDbSubTab] = useState<DatabaseSubTab>('postgresql');
  const [pgHost, setPgHost] = useState('localhost');
  const [pgPort, setPgPort] = useState(5432);
  const [pgUser, setPgUser] = useState('postgres');
  const [pgPassword, setPgPassword] = useState('');
  const [showPgPassword, setShowPgPassword] = useState(false);
  const [mysqlHost, setMysqlHost] = useState('localhost');
  const [mysqlPort, setMysqlPort] = useState(3306);
  const [mysqlUser, setMysqlUser] = useState('root');
  const [mssqlHost, setMssqlHost] = useState('localhost');
  const [mssqlPort, setMssqlPort] = useState(1433);
  const [mssqlUser, setMssqlUser] = useState('sa');
  const [mssqlPassword, setMssqlPassword] = useState('');
  const [showMssqlPassword, setShowMssqlPassword] = useState(false);
  
  // Language - separate app (UI) and query (prompts) languages
  const [appLang, setAppLang] = useState<'en' | 'zh'>('en');
  const [queryLang, setQueryLang] = useState<'en' | 'zh'>('en');
  
  // Advanced settings
  const [debugMode, setDebugMode] = useState(false);
  
  // Providers that don't require api_key
  const NO_API_KEY_PROVIDERS = new Set(['ollama', 'lmstudio']);

  // Load config on mount
  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const cfg = await api.getConfig();
      
      // Set model presets
      setTinyModel(cfg.models.tiny);
      setChatModel(cfg.models.chat);
      setProModel(cfg.models.pro || { model: '' });
      setEmbedderModel(cfg.models.embedder);
      
      // Load LLM providers with full config
      const providers = await api.getLLMProviders();
      setLlmProviders(providers);
      // Initialize edit states
      setProviderEdits({});
      setNewKvKey({});
      setNewKvValue({});
      
      // Set database defaults
      setPgHost(cfg.database_providers.postgresql?.host || 'localhost');
      setPgPort(cfg.database_providers.postgresql?.port || 5432);
      setPgUser(cfg.database_providers.postgresql?.user || 'postgres');
      setPgPassword(cfg.database_providers.postgresql?.password || '');
      setMysqlHost(cfg.database_providers.mysql?.host || 'localhost');
      setMysqlPort(cfg.database_providers.mysql?.port || 3306);
      setMysqlUser(cfg.database_providers.mysql?.user || 'root');
      setMssqlHost(cfg.database_providers.mssql?.host || 'localhost');
      setMssqlPort(cfg.database_providers.mssql?.port || 1433);
      setMssqlUser(cfg.database_providers.mssql?.user || 'sa');
      setMssqlPassword(cfg.database_providers.mssql?.password || '');
      
      // Set languages
      setAppLang(cfg.language.app as 'en' | 'zh');
      setQueryLang(cfg.language.query as 'en' | 'zh');
      
      // Set advanced settings
      setDebugMode(cfg.app.debug || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load config');
    } finally {
      setLoading(false);
    }
  };

  // Get configured provider names for preset dropdowns
  const configuredProviders = Object.keys(llmProviders).filter(name => name !== '_OVERWRITE_');

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Save model presets
      await api.setModelPreset('tiny', tinyModel);
      await api.setModelPreset('chat', chatModel);
      await api.setModelPreset('pro', proModel);
      await api.setModelPreset('embedder', embedderModel);
      
      // Save database provider defaults
      await api.setDatabaseProviderDefaults('postgresql', {
        host: pgHost,
        port: pgPort,
        user: pgUser,
        password: pgPassword,
      });
      await api.setDatabaseProviderDefaults('mysql', {
        host: mysqlHost,
        port: mysqlPort,
        user: mysqlUser,
      });
      await api.setDatabaseProviderDefaults('mssql', {
        host: mssqlHost,
        port: mssqlPort,
        user: mssqlUser,
        password: mssqlPassword,
      });
      
      // Save languages (app for UI, query for prompts)
      await api.setLanguages(appLang, queryLang);
      i18n.changeLanguage(appLang);
      
      // Save advanced settings
      await api.setAppConfig('debug', debugMode);
      
      // Save all pending provider edits
      for (const [providerKey, edits] of Object.entries(providerEdits)) {
        if (Object.keys(edits).length > 0) {
          await api.setLLMProvider(providerKey, edits);
        }
      }
      
      // Reload config to confirm
      await api.reloadConfig();
      
      // Close modal quickly after successful save
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-900">{t('settings')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-400 hover:text-neutral-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 px-6">
          <button
            onClick={() => setActiveTab('models')}
            className={cn(
              "px-4 py-3 font-medium text-sm border-b-2 transition-colors",
              activeTab === 'models'
                ? "border-black text-black"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            )}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} />
              <span>{t('settings:models')}</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('databases')}
            className={cn(
              "px-4 py-3 font-medium text-sm border-b-2 transition-colors",
              activeTab === 'databases'
                ? "border-black text-black"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            )}
          >
            <div className="flex items-center gap-2">
              <Database size={16} />
              <span>{t('settings:databases')}</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('language')}
            className={cn(
              "px-4 py-3 font-medium text-sm border-b-2 transition-colors",
              activeTab === 'language'
                ? "border-black text-black"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            )}
          >
            <div className="flex items-center gap-2">
              <Globe size={16} />
              <span>{t('language')}</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={cn(
              "px-4 py-3 font-medium text-sm border-b-2 transition-colors",
              activeTab === 'advanced'
                ? "border-black text-black"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            )}
          >
            <div className="flex items-center gap-2">
              <Settings2 size={16} />
              <span>{t('settings:advanced')}</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-neutral-400" size={32} />
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* Models Tab */}
              {activeTab === 'models' && (
                <div className="space-y-4">
                  <p className="text-sm text-neutral-500">
                    {t('settings:models_desc')}
                  </p>

                  {/* Models Sub-tabs */}
                  <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg">
                    {(['presets', 'providers'] as ModelsSubTab[]).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setModelsSubTab(tab)}
                        className={cn(
                          "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                          modelsSubTab === tab
                            ? "bg-white text-black shadow-sm"
                            : "text-neutral-500 hover:text-neutral-700"
                        )}
                      >
                        {t(`settings:${tab}`)}
                      </button>
                    ))}
                  </div>

                  {/* Presets Sub-tab */}
                  {modelsSubTab === 'presets' && (
                    <div className="space-y-4">
                      {/* Tiny Model */}
                      <ModelPresetCard
                        title={t('settings:tiny_model')}
                        description={t('settings:tiny_model_desc')}
                        preset={tinyModel}
                        onUpdate={setTinyModel}
                        isExpanded={expandedPreset === 'tiny'}
                        onToggle={() => setExpandedPreset(expandedPreset === 'tiny' ? null : 'tiny')}
                        configuredProviders={configuredProviders}
                      />

                      {/* Chat Model */}
                      <ModelPresetCard
                        title={t('settings:chat_model')}
                        description={t('settings:chat_model_desc')}
                        preset={chatModel}
                        onUpdate={setChatModel}
                        isExpanded={expandedPreset === 'chat'}
                        onToggle={() => setExpandedPreset(expandedPreset === 'chat' ? null : 'chat')}
                        configuredProviders={configuredProviders}
                      />

                      {/* Pro Model */}
                      <ModelPresetCard
                        title={t('settings:pro_model')}
                        description={t('settings:pro_model_desc')}
                        preset={proModel}
                        onUpdate={setProModel}
                        isExpanded={expandedPreset === 'pro'}
                        onToggle={() => setExpandedPreset(expandedPreset === 'pro' ? null : 'pro')}
                        configuredProviders={configuredProviders}
                      />

                      {/* Embedder Model */}
                      <ModelPresetCard
                        title={t('settings:embedder_model')}
                        description={t('settings:embedder_model_desc')}
                        preset={embedderModel}
                        onUpdate={setEmbedderModel}
                        isExpanded={expandedPreset === 'embedder'}
                        onToggle={() => setExpandedPreset(expandedPreset === 'embedder' ? null : 'embedder')}
                        configuredProviders={configuredProviders}
                      />
                    </div>
                  )}

                  {/* Providers Sub-tab */}
                  {modelsSubTab === 'providers' && (
                    <div className="space-y-3">
                      {Object.entries(llmProviders).map(([providerKey, providerData]) => {
                        if (providerKey === '_OVERWRITE_') return null;
                        const isExpanded = expandedProvider === providerKey;
                        const hasApiKey = providerData?._has_api_key || false;
                        const backend = providerData?.backend || providerKey;
                        const showApiKey = showApiKeyFor === providerKey;
                        const isDefaultProvider = DEFAULT_PROVIDER_NAMES.has(providerKey);
                        
                        // Provider is configured if:
                        // 1. It doesn't require api_key (ollama, lmstudio) OR
                        // 2. It has an api_key set
                        const requiresApiKey = !NO_API_KEY_PROVIDERS.has(providerKey);
                        const isConfigured = !requiresApiKey || hasApiKey;
                        
                        // Merge provider data with local edits so UI reflects additions/removals immediately.
                        // Edits set to `null` mean the key should be removed (deleted) locally.
                        const currentEdits = providerEdits[providerKey] || {};
                        const hasEdits = Object.keys(currentEdits).length > 0;
                        const currentNewKey = newKvKey[providerKey] || '';
                        const currentNewValue = newKvValue[providerKey] || '';

                        // Start with original provider data then apply edits (edits override/add; null => delete)
                        const mergedFields: Record<string, any> = { ...(providerData || {}) };
                        Object.entries(currentEdits).forEach(([k, v]) => {
                          if (v === null) {
                            delete mergedFields[k];
                          } else {
                            mergedFields[k] = v;
                          }
                        });

                        // Exclude non-editable meta keys
                        const editableFields = Object.entries(mergedFields).filter(
                          ([key]) => key !== 'backend' && key !== '_has_api_key'
                        );
                        
                        return (
                          <div key={providerKey} className="border border-neutral-200 rounded-xl overflow-visible">
                            <div className="flex items-center bg-neutral-50">
                              <button
                                onClick={() => setExpandedProvider(isExpanded ? null : providerKey)}
                                className="flex-1 px-4 py-3 flex items-center justify-between hover:bg-neutral-100 transition-colors"
                              >
                                <div className="text-left">
                                  <div className="font-medium text-sm text-neutral-900">{providerKey}</div>
                                  <div className="text-xs text-neutral-400 font-mono">{backend}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {hasEdits ? (
                                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                                      {t('settings:edited')}
                                    </span>
                                  ) : isConfigured ? (
                                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                      {t('settings:configured')}
                                    </span>
                                  ) : null}
                                  <ChevronDown className={cn(
                                    "text-neutral-400 transition-transform",
                                    isExpanded && "rotate-180"
                                  )} size={16} />
                                </div>
                              </button>
                              {!isDefaultProvider && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await api.deleteLLMProvider(providerKey);
                                      const providers = await api.getLLMProviders();
                                      setLlmProviders(providers);
                                    } catch (err) {
                                      setError(err instanceof Error ? err.message : 'Failed to delete provider');
                                    }
                                  }}
                                  className="px-3 py-3 text-neutral-400 hover:text-red-500 hover:bg-neutral-100 transition-colors"
                                  title={t('settings:delete_provider')}
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                            
                            {isExpanded && (
                              <div className="px-4 py-3 border-t border-neutral-200 space-y-3">
                                {/* Backend (read-only) */}
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-neutral-500 min-w-[80px]">backend</span>
                                  <div className="flex-1 px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-lg text-sm font-mono text-neutral-600">
                                    {backend}
                                  </div>
                                </div>
                                
                                {/* Editable key-value pairs */}
                                {editableFields.map(([key, value]) => {
                                  const isApiKey = key === 'api_key';
                                  // Use edit value if user has typed, otherwise use original value
                                  const originalValue = String(value);
                                  const editValue = currentEdits[key] !== undefined
                                    ? currentEdits[key] || originalValue
                                    : originalValue;
                                  const showThisKey = isApiKey && showApiKey;
                                  // Track if this key has been copied
                                  const isCopied = apiKeyCopied === providerKey;
                                  
                                  return (
                                    <div key={key} className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-neutral-500 min-w-[80px] font-mono">{key}</span>
                                      <div className="flex-1 relative">
                                        <input
                                          type={isApiKey && !showThisKey ? 'password' : 'text'}
                                          value={editValue}
                                            onChange={(e) => {
                                              setProviderEdits(prev => ({
                                                ...prev,
                                                [providerKey]: { ...prev[providerKey], [key]: e.target.value }
                                              }));
                                            }}
                                          placeholder=""
                                          className={cn(inputClassName, isApiKey && "pr-20")}
                                        />
                                        {isApiKey && (
                                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                            {/* Copy button */}
                                            <button
                                              type="button"
                                              onClick={async () => {
                                                try {
                                                  await copyToClipboard(editValue);
                                                  setApiKeyCopied(providerKey);
                                                  setTimeout(() => setApiKeyCopied(null), 1500);
                                                } catch (error) {
                                                  console.error('Failed to copy:', error);
                                                }
                                              }}
                                              className="p-1 text-neutral-400 hover:text-neutral-600"
                                              title={t('copy')}
                                            >
                                              {isCopied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                                            </button>
                                            {/* Show/hide button */}
                                            <button
                                              type="button"
                                              onClick={() => setShowApiKeyFor(showThisKey ? null : providerKey)}
                                              className="p-1 text-neutral-400 hover:text-neutral-600"
                                              title={showThisKey ? t('common:hide') : t('common:show')}
                                            >
                                              {showThisKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                      {!isApiKey && key !== 'api_base' && (
                                        <button
                                          onClick={() => {
                                            // Mark for deletion by setting to null so the merged view removes it immediately
                                            setProviderEdits(prev => ({
                                              ...prev,
                                              [providerKey]: { ...prev[providerKey], [key]: null }
                                            }));
                                          }}
                                          className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
                                          title={t('delete')}
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                                
                                {/* Add new key-value pair */}
                                <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                                  <input
                                    type="text"
                                    value={currentNewKey}
                                    onChange={(e) => setNewKvKey(prev => ({ ...prev, [providerKey]: e.target.value }))}
                                    placeholder={t('settings:new_key')}
                                    className={cn(inputClassName, "min-w-[80px] flex-shrink-0 w-24")}
                                  />
                                  <input
                                    type="text"
                                    value={currentNewValue}
                                    onChange={(e) => setNewKvValue(prev => ({ ...prev, [providerKey]: e.target.value }))}
                                    placeholder={t('settings:new_value')}
                                    className={cn(inputClassName, "flex-1")}
                                  />
                                  <button
                                    onClick={() => {
                                      if (currentNewKey && currentNewKey !== 'backend') {
                                        setProviderEdits(prev => ({
                                          ...prev,
                                          [providerKey]: { ...prev[providerKey], [currentNewKey]: currentNewValue }
                                        }));
                                        setNewKvKey(prev => ({ ...prev, [providerKey]: '' }));
                                        setNewKvValue(prev => ({ ...prev, [providerKey]: '' }));
                                      }
                                    }}
                                    disabled={!currentNewKey || currentNewKey === 'backend'}
                                    className="p-1.5 text-neutral-400 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title={t('add')}
                                  >
                                    <Plus size={16} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Add New Provider Section */}
                      {showNewProviderForm ? (
                        <div className="border border-dashed border-neutral-300 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-neutral-900">{t('settings:new_provider')}</span>
                            <button
                              onClick={() => {
                                setShowNewProviderForm(false);
                                setNewProviderName('');
                                setNewProviderBackend('');
                                setNewProviderApiBase('');
                              }}
                              className="p-1 text-neutral-400 hover:text-neutral-600"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-neutral-500 mb-1">{t('settings:provider_name')}</label>
                              <input
                                type="text"
                                value={newProviderName}
                                onChange={(e) => setNewProviderName(e.target.value)}
                                placeholder="my-provider"
                                className={inputClassName}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-neutral-500 mb-1 flex items-center gap-1">
                                backend
                                <a
                                  href="https://docs.litellm.ai/docs/providers"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-neutral-400 hover:text-neutral-600"
                                  title={t('settings:backend_hint')}
                                >
                                  <HelpCircle size={12} />
                                </a>
                              </label>
                              <input
                                type="text"
                                value={newProviderBackend}
                                onChange={(e) => setNewProviderBackend(e.target.value)}
                                placeholder="openai"
                                className={inputClassName}
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs font-medium text-neutral-500 mb-1">api_base ({t('common:optional')})</label>
                              <input
                                type="text"
                                value={newProviderApiBase}
                                onChange={(e) => setNewProviderApiBase(e.target.value)}
                                placeholder="https://api.example.com/v1"
                                className={inputClassName}
                              />
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              if (!newProviderName.trim() || !newProviderBackend.trim()) return;
                              try {
                                await api.createLLMProvider(
                                  newProviderName.trim(),
                                  newProviderBackend.trim(),
                                  undefined,
                                  newProviderApiBase.trim() || undefined
                                );
                                const providers = await api.getLLMProviders();
                                setLlmProviders(providers);
                                setShowNewProviderForm(false);
                                setNewProviderName('');
                                setNewProviderBackend('');
                                setNewProviderApiBase('');
                              } catch (err) {
                                setError(err instanceof Error ? err.message : 'Failed to create provider');
                              }
                            }}
                            disabled={!newProviderName.trim() || !newProviderBackend.trim()}
                            className="w-full px-3 py-2 text-sm font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {t('settings:create_provider')}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowNewProviderForm(true)}
                          className="w-full px-4 py-3 border border-dashed border-neutral-300 rounded-xl text-sm text-neutral-500 hover:text-neutral-700 hover:border-neutral-400 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus size={16} />
                          <span>{t('settings:add_provider')}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Database Defaults Tab */}
              {activeTab === 'databases' && (
                <div className="space-y-4">
                  <p className="text-sm text-neutral-500">
                    {t('settings:db_defaults_desc')}
                  </p>

                  {/* Database Sub-tabs */}
                  <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg">
                    {(['postgresql', 'mysql', 'sqlite', 'duckdb', 'mssql'] as DatabaseSubTab[]).map((db) => (
                      <button
                        key={db}
                        onClick={() => setDbSubTab(db)}
                        className={cn(
                          "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                          dbSubTab === db
                            ? "bg-white text-black shadow-sm"
                            : "text-neutral-500 hover:text-neutral-700"
                        )}
                      >
                        {db === 'postgresql' ? 'PostgreSQL' : db === 'mysql' ? 'MySQL' : db === 'sqlite' ? 'SQLite' : db === 'duckdb' ? 'DuckDB' : 'MSSQL'}
                      </button>
                    ))}
                  </div>

                  {/* PostgreSQL Settings */}
                  {dbSubTab === 'postgresql' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                            {t('database:host')}
                          </label>
                          <input
                            type="text"
                            value={pgHost}
                            onChange={(e) => setPgHost(e.target.value)}
                            className={inputClassName}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                            {t('database:port')}
                          </label>
                          <input
                            type="number"
                            value={pgPort}
                            onChange={(e) => setPgPort(parseInt(e.target.value))}
                            className={inputClassName}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                            {t('database:user')}
                          </label>
                          <input
                            type="text"
                            value={pgUser}
                            onChange={(e) => setPgUser(e.target.value)}
                            className={inputClassName}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                            {t('database:password')}
                          </label>
                          <div className="relative">
                            <input
                              type={showPgPassword ? 'text' : 'password'}
                              value={pgPassword}
                              onChange={(e) => setPgPassword(e.target.value)}
                              className={cn(inputClassName, "pr-10")}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPgPassword(!showPgPassword)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600"
                            >
                              {showPgPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MySQL Settings */}
                  {dbSubTab === 'mysql' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                            {t('database:host')}
                          </label>
                          <input
                            type="text"
                            value={mysqlHost}
                            onChange={(e) => setMysqlHost(e.target.value)}
                            className={inputClassName}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                            {t('database:port')}
                          </label>
                          <input
                            type="number"
                            value={mysqlPort}
                            onChange={(e) => setMysqlPort(parseInt(e.target.value))}
                            className={inputClassName}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                            {t('database:user')}
                          </label>
                          <input
                            type="text"
                            value={mysqlUser}
                            onChange={(e) => setMysqlUser(e.target.value)}
                            className={inputClassName}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SQLite - No config needed */}
                  {dbSubTab === 'sqlite' && (
                    <div className="flex items-center justify-center py-8 text-neutral-400 text-sm">
                      {t('settings:no_config_needed')}
                    </div>
                  )}

                  {/* DuckDB - No config needed */}
                  {dbSubTab === 'duckdb' && (
                    <div className="flex items-center justify-center py-8 text-neutral-400 text-sm">
                      {t('settings:no_config_needed')}
                    </div>
                  )}

                  {/* MSSQL Settings */}
                  {dbSubTab === 'mssql' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                            {t('database:host')}
                          </label>
                          <input
                            type="text"
                            value={mssqlHost}
                            onChange={(e) => setMssqlHost(e.target.value)}
                            className={inputClassName}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                            {t('database:port')}
                          </label>
                          <input
                            type="number"
                            value={mssqlPort}
                            onChange={(e) => setMssqlPort(parseInt(e.target.value))}
                            className={inputClassName}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                            {t('database:user')}
                          </label>
                          <input
                            type="text"
                            value={mssqlUser}
                            onChange={(e) => setMssqlUser(e.target.value)}
                            className={inputClassName}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                            {t('database:password')}
                          </label>
                          <div className="relative">
                            <input
                              type={showMssqlPassword ? 'text' : 'password'}
                              value={mssqlPassword}
                              onChange={(e) => setMssqlPassword(e.target.value)}
                              className={cn(inputClassName, "pr-10")}
                            />
                            <button
                              type="button"
                              onClick={() => setShowMssqlPassword(!showMssqlPassword)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600"
                            >
                              {showMssqlPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Language Tab */}
              {activeTab === 'language' && (
                <div className="space-y-6">
                  <p className="text-sm text-neutral-500">
                    {t('settings:language_desc')}
                  </p>

                  {/* App Language (UI) */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-neutral-900">
                      {t('settings:app_language')}
                    </label>
                    <p className="text-xs text-neutral-500">{t('settings:app_language_desc')}</p>
                    <div className="space-y-2">
                      <button
                        onClick={() => setAppLang('en')}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all",
                          appLang === 'en'
                            ? "border-neutral-400 bg-neutral-50"
                            : "border-neutral-200 hover:border-neutral-300 bg-white"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                            appLang === 'en' ? "border-neutral-800" : "border-neutral-300"
                          )}>
                            {appLang === 'en' && (
                              <div className="w-2 h-2 rounded-full bg-neutral-800" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-neutral-900">English</span>
                        </div>
                      </button>
                      <button
                        onClick={() => setAppLang('zh')}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all",
                          appLang === 'zh'
                            ? "border-neutral-400 bg-neutral-50"
                            : "border-neutral-200 hover:border-neutral-300 bg-white"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                            appLang === 'zh' ? "border-neutral-800" : "border-neutral-300"
                          )}>
                            {appLang === 'zh' && (
                              <div className="w-2 h-2 rounded-full bg-neutral-800" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-neutral-900">中文</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Query Language (Prompts) */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-neutral-900">
                      {t('settings:query_language')}
                    </label>
                    <p className="text-xs text-neutral-500">{t('settings:query_language_desc')}</p>
                    <div className="space-y-2">
                      <button
                        onClick={() => setQueryLang('en')}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all",
                          queryLang === 'en'
                            ? "border-neutral-400 bg-neutral-50"
                            : "border-neutral-200 hover:border-neutral-300 bg-white"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                            queryLang === 'en' ? "border-neutral-800" : "border-neutral-300"
                          )}>
                            {queryLang === 'en' && (
                              <div className="w-2 h-2 rounded-full bg-neutral-800" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-neutral-900">English</span>
                        </div>
                      </button>
                      <button
                        onClick={() => setQueryLang('zh')}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all",
                          queryLang === 'zh'
                            ? "border-neutral-400 bg-neutral-50"
                            : "border-neutral-200 hover:border-neutral-300 bg-white"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                            queryLang === 'zh' ? "border-neutral-800" : "border-neutral-300"
                          )}>
                            {queryLang === 'zh' && (
                              <div className="w-2 h-2 rounded-full bg-neutral-800" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-neutral-900">中文</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Tab */}
              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  <p className="text-sm text-neutral-500">
                    {t('settings:advanced_desc')}
                  </p>

                  {/* Debug Mode */}
                  <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                    <div>
                      <div className="text-sm font-medium text-neutral-900">{t('settings:debug_mode')}</div>
                      <div className="text-xs text-neutral-500">{t('settings:debug_mode_desc')}</div>
                    </div>
                    <button
                      onClick={async () => {
                        const newValue = !debugMode;
                        setDebugMode(newValue);
                        // Immediately save debug mode
                        try {
                          await api.setAppConfig('debug', newValue);
                        } catch (err) {
                          console.error('Failed to save debug mode:', err);
                          // Revert on error
                          setDebugMode(!newValue);
                        }
                      }}
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-colors",
                        debugMode ? "bg-black" : "bg-neutral-300"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                          debugMode ? "translate-x-5" : "translate-x-0.5"
                        )}
                      />
                    </button>
                  </div>

                  {/* Config Files */}
                  <div className="pt-4 border-t border-neutral-200 space-y-2">
                    <label className="block text-sm font-medium text-neutral-900">
                      {t('settings:config_files')}
                    </label>
                    <p className="text-xs text-neutral-500">{t('settings:config_files_desc')}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          try {
                            await api.openConfigFile('rubiksql');
                          } catch (err) {
                            console.error('Failed to open config:', err);
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-sm font-medium text-neutral-700 transition-colors"
                      >
                        <FileCode2 size={16} />
                        <span>RubikSQL</span>
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await api.openConfigFile('agentheaven');
                          } catch (err) {
                            console.error('Failed to open config:', err);
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-sm font-medium text-neutral-700 transition-colors"
                      >
                        <FileCode2 size={16} />
                        <span>AgentHeaven</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors disabled:opacity-50"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>{t('settings:saving')}</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>{t('save')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ModelPresetCard component for collapsible model configuration
interface ModelPresetCardProps {
  title: string;
  description: string;
  preset: ModelPresetConfig;
  onUpdate: (preset: ModelPresetConfig) => void;
  isExpanded: boolean;
  onToggle: () => void;
  configuredProviders: string[];
}

const ModelPresetCard = ({
  title,
  description,
  preset,
  onUpdate,
  isExpanded,
  onToggle,
  configuredProviders,
}: ModelPresetCardProps) => {
  const { t } = useTranslation(['settings']);
  
  // Check if the current provider is valid (exists in configured providers)
  const isProviderValid = !preset.provider || configuredProviders.includes(preset.provider);

  // Build provider options for CustomSelect
  const providerOptions = useMemo(() => {
    const options = [{ value: '', label: t('settings:none') }];
    
    // Show current provider even if not in list (for visibility)
    if (preset.provider && !configuredProviders.includes(preset.provider)) {
      options.push({
        value: preset.provider,
        label: `${preset.provider} (${t('settings:not_configured')})`,
      });
    }
    
    // Add all configured providers
    configuredProviders.forEach(provider => {
      options.push({ value: provider, label: provider });
    });
    
    return options;
  }, [configuredProviders, preset.provider, t]);

  return (
    <div className="border border-neutral-200 rounded-lg overflow-visible bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="text-left">
            <div className="text-sm font-medium text-neutral-900">{title}</div>
            <div className="text-xs text-neutral-500">{description}</div>
            <div className="text-xs text-neutral-400 mt-1 font-mono">
              {preset.provider ? `${preset.provider}:` : ''}{preset.model || t('not_set')}
            </div>
          </div>
          {!isProviderValid && (
            <span title={t('settings:provider_not_configured')}>
              <AlertCircle size={16} className="text-red-500" />
            </span>
          )}
        </div>
        <ChevronDown
          size={18}
          className={cn(
            "text-neutral-400 transition-transform",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {isExpanded && (
        <div className="px-4 py-3 border-t border-neutral-200 bg-neutral-50/50 space-y-3">
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">
              {t('provider')}
            </label>
            <div className="flex items-center gap-2">
              <CustomSelect
                value={preset.provider || ''}
                onChange={(value) => onUpdate({ ...preset, provider: value || undefined })}
                options={providerOptions}
                placeholder={t('settings:none')}
                error={!isProviderValid}
                className="flex-1"
              />
              {!isProviderValid && (
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">
              {t('model')}
            </label>
            <input
              type="text"
              value={preset.model}
              onChange={(e) => onUpdate({ ...preset, model: e.target.value })}
              placeholder={t('settings:enter_model_name')}
              className={inputClassName}
            />
          </div>
        </div>
      )}
    </div>
  );
};
