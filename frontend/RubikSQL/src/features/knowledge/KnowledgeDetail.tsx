import { useState, useEffect } from 'react';
import { Save, Trash2, ArrowLeft, Loader2, AlertCircle, X, Plus, ChevronDown, ChevronRight, Code, Download } from 'lucide-react';
import { api, KnowledgeItem } from '@/lib/api';
import { useAppStore } from '@/stores/useAppStore';
import { CodeEditor } from '@/components/ui/CodeEditor';

// Tauri APIs - imported dynamically to support both browser and Tauri
let tauriDialog: typeof import('@tauri-apps/api/dialog') | null = null;
let tauriFs: typeof import('@tauri-apps/api/fs') | null = null;

// Check if running in Tauri
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

// Load Tauri APIs if available
if (isTauri) {
  import('@tauri-apps/api/dialog').then(m => { tauriDialog = m; });
  import('@tauri-apps/api/fs').then(m => { tauriFs = m; });
}

// Helper to format short hash for filename
function fmtShortHash(id: string): string {
  return id.slice(0, 8);
}

interface KnowledgeDetailProps {
  itemIdStr: string;
  type: string;
  onBack: () => void;
  onUpdate: () => void;
}

export const KnowledgeDetail = ({ itemIdStr, type, onBack, onUpdate }: KnowledgeDetailProps) => {
  const { activeConnectionId } = useAppStore();
  const [item, setItem] = useState<KnowledgeItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [newSynonym, setNewSynonym] = useState('');

  // JSON dict state
  const [itemDict, setItemDict] = useState<any>(null);
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [loadingJson, setLoadingJson] = useState(false);

  useEffect(() => {
    if (activeConnectionId && itemIdStr && type) {
      fetchItem();
    }
  }, [activeConnectionId, itemIdStr, type]);

  const fetchItem = async () => {
    if (!activeConnectionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await api.getKnowledgeItem(activeConnectionId, itemIdStr, type);
      setItem(data);
      setShortDesc(data.short_description || '');
      setDescription(data.description || '');
      setSynonyms(data.synonyms || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch item');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!activeConnectionId || !item) return;

    setSaving(true);
    try {
      await api.updateKnowledgeItem(activeConnectionId, itemIdStr, {
        short_description: shortDesc,
        description: description,
        synonyms: synonyms,
      }, type);
      onUpdate();
      // Optionally refresh item
      await fetchItem();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeConnectionId || !confirm('Are you sure you want to delete this item?')) return;
    
    setSaving(true);
    try {
      await api.deleteKnowledgeItem(activeConnectionId, type, itemIdStr);
      onUpdate();
      onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete item');
      setSaving(false);
    }
  };



  const addSynonym = () => {
    if (newSynonym.trim()) {
      setSynonyms([...synonyms, newSynonym.trim()]);
      setNewSynonym('');
    }
  };

  const removeSynonym = (index: number) => {
    setSynonyms(synonyms.filter((_, i) => i !== index));
  };

  const fetchItemDict = async () => {
    if (!activeConnectionId) return;

    if (itemDict) {
      // Already loaded
      return;
    }

    setLoadingJson(true);
    try {
      const dict = await api.getKnowledgeItemDict(activeConnectionId, itemIdStr, type);
      setItemDict(dict);
    } catch (e) {
      console.error('Failed to fetch item dict:', e);
    } finally {
      setLoadingJson(false);
    }
  };

  const toggleJson = () => {
    if (!isJsonOpen) {
      fetchItemDict();
    }
    setIsJsonOpen(!isJsonOpen);
  };

  // Handle export JSON
  const handleExport = async () => {
    if (!item || !itemDict) return;
    
    const filename = `${item.name}_${fmtShortHash(itemIdStr)}.json`;
    const content = JSON.stringify(itemDict, null, 2);
    
    if (isTauri && tauriDialog && tauriFs) {
      // Tauri mode: use native save dialog
      try {
        const savePath = await tauriDialog.save({
          defaultPath: filename,
          filters: [{ name: 'JSON Files', extensions: ['json'] }],
        });
        if (savePath) {
          await tauriFs.writeTextFile(savePath, content);
        }
      } catch (error) {
        console.error('Failed to export item:', error);
      }
    } else {
      // Browser mode: use blob download
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-4 text-red-500 flex items-center gap-2">
        <AlertCircle size={16} />
        Item not found
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <button 
            onClick={onBack}
            className="p-1 hover:bg-neutral-100 rounded-md transition-colors"
          >
            <ArrowLeft size={20} className="text-neutral-500" />
          </button>
          <h2 className="text-lg font-medium text-neutral-900 truncate max-w-md">{item.name}</h2>
          <span className="text-xs px-2 py-0.5 bg-neutral-100 rounded-full text-neutral-600 border border-neutral-200">
            {item.type}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={saving}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
            title="Delete Item"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-md transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">Short Description <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={shortDesc}
            onChange={(e) => setShortDesc(e.target.value)}
            className="w-full bg-white border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-neutral-900 placeholder:text-neutral-400"
            placeholder="Brief summary..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">Full Description <span className="text-red-500">*</span></label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="w-full bg-white border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none text-neutral-900 placeholder:text-neutral-400"
            placeholder="Detailed description..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700">Synonyms</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {synonyms.map((syn, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded group">
                {syn}
                <button onClick={() => removeSynonym(i)} className="hover:text-red-500 transition-colors">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSynonym}
              onChange={(e) => setNewSynonym(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSynonym()}
              className="flex-1 px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-neutral-900 placeholder:text-neutral-400"
              placeholder="Add synonym..."
            />
            <button
              onClick={addSynonym}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
        </div>

        {/* Read-only Metadata View */}
        {item.metadata && Object.keys(item.metadata).length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">Metadata (Read-only)</label>
            <pre className="bg-neutral-50 border border-neutral-200 p-3 rounded-md text-xs text-neutral-600 overflow-x-auto font-mono">
              {JSON.stringify(item.metadata, null, 2)}
            </pre>
          </div>
        )}

        {/* Knowledge JSON Data */}
        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <button
            onClick={toggleJson}
            className="w-full flex items-center justify-between px-4 py-2 bg-neutral-50 hover:bg-neutral-100 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
              <Code size={14} className="text-neutral-500" />
              <span>Knowledge JSON Data</span>
            </div>
            <div className="flex items-center gap-2">
              {isJsonOpen && itemDict && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExport();
                  }}
                  className="p-1 hover:bg-neutral-200 rounded transition-colors text-neutral-500 hover:text-neutral-700"
                  title="Export item"
                >
                  <Download size={14} />
                </button>
              )}
              {loadingJson && <Loader2 size={14} className="animate-spin text-neutral-400" />}
              {isJsonOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          </button>
          {isJsonOpen && (
            <div className="border-t border-neutral-200">
              <CodeEditor
                value={itemDict ? JSON.stringify(itemDict, null, 2) : loadingJson ? 'Loading...' : 'Failed to load JSON data'}
                language="json"
                editable={false}
                dark={true}
                minHeight="200px"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
