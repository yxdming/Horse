import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type KnowledgeItem } from '@/lib/api';
import { addTask, completeTaskByType, taskQueueManager } from '@/services/TaskQueueManager';
import { AddTaxonomyModal } from './AddTaxonomyModal';
import { AddKnowledgeModal } from './AddKnowledgeModal';
import { AddExperienceModal } from './AddExperienceModal';
import { useAppStore } from '@/stores/useAppStore';
import { Database, Search, FileText, Table2, Columns, List, Square, CheckSquare, X, Save, Plus, Loader2, Check, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, RefreshCw, Code, ChevronRight as ChevronRightIcon, Download, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
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

interface KnowledgeBrowserProps {
  dbId: string;
}

// Helper to format short hash for filename
function fmtShortHash(id: string): string {
  return id.slice(0, 8);
}

// Helper to convert "[SLOT:value]" to "slot:value" for display
function tagToDisplay(tag: string): string {
  const match = tag.match(/^\[([^:]+):(.+)\]$/);
  if (match) {
    return `${match[1]}:${match[2]}`;
  }
  return tag;
}

// Helper to convert tags array to display format and sort
function tagsToDisplay(tags: string[]): string[] {
  return tags.map(tagToDisplay).sort();
}

// Helper function to complete a task - wrapper for completeTaskByType
// Signature: (type, status, message)
function handleTaskComplete(type: string, status: 'completed' | 'error', message?: string) {
  completeTaskByType(type as any, {}, status, message);
}

export function KnowledgeBrowser({ dbId }: KnowledgeBrowserProps) {
  const { t } = useTranslation(['common', 'knowledge']);
  const { pendingExperience, setPendingExperience } = useAppStore();
  
  // Types state
  const [types, setTypes] = useState<string[]>([]);
  const [typeCounts, setTypeCounts] = useState<Map<string, number>>(new Map());
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [typesLoading, setTypesLoading] = useState(true);
  
  // Items state
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0); // 0-based for pagination
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  
  // Detail modal state
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Edit state
  const [editShortDesc, setEditShortDesc] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSynonyms, setEditSynonyms] = useState<string[]>([]);
  const [displayTags, setDisplayTags] = useState<string[]>([]);
  const [newSynonym, setNewSynonym] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Original values for change detection
  const [origShortDesc, setOrigShortDesc] = useState('');
  const [origDescription, setOrigDescription] = useState('');
  const [origSynonyms, setOrigSynonyms] = useState<string[]>([]);

  // JSON dict state for detail modal
  const [itemDict, setItemDict] = useState<any>(null);
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [loadingJson, setLoadingJson] = useState(false);

  // Add modals state
  const [showAddTaxonomyModal, setShowAddTaxonomyModal] = useState(false);
  const [showAddKnowledgeModal, setShowAddKnowledgeModal] = useState(false);
  const [showAddExperienceModal, setShowAddExperienceModal] = useState(false);

  // Batch import state
  const [isImporting, setIsImporting] = useState(false);

  // Batch export state
  const [isExporting, setIsExporting] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [needsSync, setNeedsSync] = useState(false);

  // Fetch available types
  const fetchTypes = useCallback(async () => {
    setTypesLoading(true);
    try {
      const response = await api.getKnowledgeTypes(dbId);
      // Response is array of {type, count}
      const typeList = response.map(t => t.type);
      const countsMap = new Map(response.map(t => [t.type, t.count]));
      setTypes(typeList);
      setTypeCounts(countsMap);
      // Keep current selection if possible, otherwise select all
      setSelectedTypes(prev => {
        if (prev.size === 0) {
          return new Set(typeList);
        }
        // Filter out any types that no longer exist
        const filtered = new Set(typeList.filter(t => prev.has(t)));
        // If all selected types were removed, select all
        return filtered.size > 0 ? filtered : new Set(typeList);
      });
    } catch (error) {
      console.error('Failed to fetch knowledge types:', error);
      setTypes([]);
      setTypeCounts(new Map());
    } finally {
      setTypesLoading(false);
    }
  }, [dbId]);

  useEffect(() => {
    if (dbId) {
      fetchTypes();
    }
  }, [dbId, fetchTypes]);

  // Fetch items based on current state
  const fetchItems = useCallback(async () => {
    if (selectedTypes.size === 0) {
      setItems([]);
      setTotalItems(0);
      return;
    }

    setItemsLoading(true);

    try {
      // Use the new API to fetch items for all selected types in a single query
      const typesArray = Array.from(selectedTypes);
      // API expects 1-based page numbers, so convert from 0-based
      const result = await api.getKnowledgeListForTypes(dbId, typesArray, page + 1, pageSize, searchQuery);

      setItems(result.items || []);
      setTotalItems(result.total || 0);
    } catch (error) {
      console.error('Failed to fetch knowledge items:', error);
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  }, [dbId, selectedTypes, page, pageSize, searchQuery]); // Include all dependencies

  // Reset page to 0 when search query or types change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, selectedTypes]);

  // Fetch items whenever dependencies change
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Handle type toggle
  const toggleType = (type: string) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Select all types
  const selectAllTypes = () => {
    setSelectedTypes(new Set(types));
  };

  // Clear all types
  const clearAllTypes = () => {
    setSelectedTypes(new Set());
  };

  // Initialize edit state from item
  const initEditState = (item: KnowledgeItem) => {
    const shortDesc = item.short_description || '';
    const desc = item.description || '';
    const syns = item.synonyms ? [...item.synonyms].sort() : [];
    const tags = item.tags ? tagsToDisplay(item.tags) : [];
    
    setEditShortDesc(shortDesc);
    setEditDescription(desc);
    setEditSynonyms(syns);
    setDisplayTags(tags);
    setNewSynonym('');
    
    // Store originals for change detection
    setOrigShortDesc(shortDesc);
    setOrigDescription(desc);
    setOrigSynonyms(syns);
    setSaveSuccess(false);
  };

  // Check if there are changes (tags are read-only, so not included)
  const hasChanges = 
    editShortDesc !== origShortDesc ||
    editDescription !== origDescription ||
    JSON.stringify(editSynonyms) !== JSON.stringify(origSynonyms);

  // Open item detail
  const openDetail = async (item: KnowledgeItem) => {
    setDetailLoading(true);
    setSelectedItem(item);
    initEditState(item);
    
    try {
      const detail = await api.getKnowledgeItem(dbId, item.id_str, item.type);
      setSelectedItem(detail);
      initEditState(detail);
    } catch (error) {
      console.error('Failed to fetch item detail:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  // Close detail modal
  const closeDetail = () => {
    setSelectedItem(null);
    setSaveSuccess(false);
    setItemDict(null);
    setIsJsonOpen(false);
  };

  // Fetch item dict
  const fetchItemDict = async () => {
    if (!selectedItem) return;

    if (itemDict) {
      // Already loaded
      return;
    }

    setLoadingJson(true);
    try {
      const dict = await api.getKnowledgeItemDict(dbId, selectedItem.id_str, selectedItem.type);
      setItemDict(dict);
    } catch (e) {
      console.error('Failed to fetch item dict:', e);
    } finally {
      setLoadingJson(false);
    }
  };

  // Toggle JSON section
  const toggleJson = () => {
    if (!isJsonOpen) {
      fetchItemDict();
    }
    setIsJsonOpen(!isJsonOpen);
  };

  // Handle save
  const handleSave = async () => {
    if (!selectedItem) return;

    // Debug logs removed

    setSaving(true);
    try {
      await api.updateKnowledgeItem(dbId, selectedItem.id_str, {
        short_description: editShortDesc,
        description: editDescription,
        synonyms: editSynonyms,
      }, selectedItem.type);
      // Debug log removed

      // Mark that sync is needed after editing knowledge
      setNeedsSync(true);

      // Refresh item
      const updated = await api.getKnowledgeItem(dbId, selectedItem.id_str, selectedItem.type);
      // Debug log removed
      setSelectedItem(updated);
      initEditState(updated);

      // Show success and close quickly
      setSaveSuccess(true);
      fetchItems();
      setTimeout(() => {
        closeDetail();
      }, 300);
    } catch (error) {
      console.error('Failed to save item:', error);
    } finally {
      setSaving(false);
    }
  };

  // Handle synonym add
  const addSynonym = () => {
    if (newSynonym.trim() && !editSynonyms.includes(newSynonym.trim())) {
      const updated = [...editSynonyms, newSynonym.trim()].sort();
      setEditSynonyms(updated);
      setNewSynonym('');
    }
  };

  // Handle synonym remove
  const removeSynonym = (index: number) => {
    setEditSynonyms(editSynonyms.filter((_, i) => i !== index));
  };

  // Handle field changes
  const handleFieldChange = (field: 'shortDesc' | 'description', value: string) => {
    if (field === 'shortDesc') {
      setEditShortDesc(value);
    } else {
      setEditDescription(value);
    }
  };

  // Get icon for type
  const getTypeIcon = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('database')) return <Database className="w-4 h-4" />;
    if (lower.includes('table')) return <Table2 className="w-4 h-4" />;
    if (lower.includes('column')) return <Columns className="w-4 h-4" />;
    if (lower.includes('enum')) return <List className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  // Open Add Taxonomy modal
  const openAddTaxonomyModal = () => {
    setShowAddTaxonomyModal(true);
  };

  // Open Add Knowledge modal
  const openAddKnowledgeModal = () => {
    setShowAddKnowledgeModal(true);
  };

  // Handle modal success callbacks
  const handleTaxonomySuccess = () => {
    setNeedsSync(true); // Mark that sync is needed after adding taxonomy
    fetchTypes(); // Refresh the types list
    fetchItems(); // Refresh the items list
  };

  const handleKnowledgeSuccess = () => {
    setNeedsSync(true); // Mark that sync is needed after adding knowledge
    fetchTypes(); // Refresh the types list
    fetchItems(); // Refresh the items list
  };

  // Handle export knowledge item
  const handleExportItem = async (item: KnowledgeItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the detail modal

    try {
      const dict = await api.getKnowledgeItemDict(dbId, item.id_str, item.type);
      const filename = `${item.name}_${fmtShortHash(item.id_str)}.json`;
      const content = JSON.stringify(dict, null, 2);

      // Add task to queue
      addTask(
        'export',
        t('knowledge:exporting', 'Exporting "{{name}}"...', { name: item.name }),
        { databaseId: dbId, itemId: item.id_str, itemType: item.type }
      );

      if (isTauri && tauriDialog && tauriFs) {
        // Tauri mode: use native save dialog
        const savePath = await tauriDialog.save({
          defaultPath: filename,
          filters: [{ name: 'JSON Files', extensions: ['json'] }],
        });
        if (savePath) {
          await tauriFs.writeTextFile(savePath, content);
          handleTaskComplete('export', 'completed', t('knowledge:exportSuccess', 'Item exported successfully'));
        } else {
          handleTaskComplete('export', 'error', t('knowledge:exportCancelled', 'Export cancelled'));
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
        handleTaskComplete('export', 'completed', t('knowledge:exportSuccess', 'Item exported successfully'));
      }
    } catch (error) {
      console.error('Failed to export item:', error);
      handleTaskComplete('export', 'error', t('knowledge:exportFailed', 'Failed to export item. Please try again.'));
    }
  };

  // Handle delete knowledge item
  const handleDeleteItem = async (item: KnowledgeItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the detail modal

    // Add task to queue
    addTask(
      'knowledge-upsert',
      t('knowledge:deleting', 'Deleting "{{name}}"...', { name: item.name }),
      { databaseId: dbId, itemId: item.id_str, itemType: item.type, operation: 'delete' }
    );

    try {
      await api.deleteKnowledgeItem(dbId, item.id_str, item.type);
      // Mark that sync is needed after deleting knowledge
      setNeedsSync(true);
      // Refresh the types and items list
      fetchTypes();
      fetchItems();
      // Show success notification
      handleTaskComplete('knowledge-upsert', 'completed', t('knowledge:itemDeleted', 'Item "{{name}}" deleted successfully', { name: item.name }));
    } catch (error) {
      console.error('Failed to delete item:', error);
      handleTaskComplete('knowledge-upsert', 'error', t('knowledge:deleteFailed', 'Failed to delete item. Please try again.'));
    }
  };

  // Handle sync knowledge engines
  const handleSync = () => {
    // Add task to queue
    const taskId = addTask(
      'kb-sync',
      t('database:kbSyncing', 'Syncing Knowledge Base for "{{name}}"...', { name: dbId }),
      { databaseId: dbId, databaseName: dbId }
    );

    setIsSyncing(true);

    // Trigger streaming sync via API
    api.streamSyncKnowledge(
      dbId,
      (status) => {
        // Update task progress
        const progress = Math.round((status.progress || 0) * 100);
        taskQueueManager.updateTask(taskId, {
          progress,
          message: status.message || `${progress}%`
        });
      },
      (error) => {
        // Handle error
        console.error('Failed to sync knowledge engines:', error);
        setIsSyncing(false);
        taskQueueManager.completeTask(taskId, 'error',
          t('knowledge:syncFailed', 'Failed to sync knowledge engines. Please try again.'));
      },
      () => {
        // On complete
        setIsSyncing(false);
        // Reset sync warning after successful sync
        setNeedsSync(false);
        // Refresh types and items after sync
        fetchTypes();
        fetchItems();
        // Complete the task
        taskQueueManager.completeTask(taskId, 'completed',
          t('database:kbSyncSuccess', 'Knowledge Base sync completed for "{{name}}"', { name: dbId }));
      }
    );
  };

  // Handle batch import
  const handleBatchImport = async () => {
    let filesToImport: { name: string; content: string }[] = [];

    if (isTauri && tauriDialog && tauriFs) {
      // Tauri mode: use native file dialog
      const selected = await tauriDialog.open({
        multiple: true,
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        title: t('knowledge:batchImport', 'Batch Import'),
      });
      
      if (!selected) return;
      
      const paths = Array.isArray(selected) ? selected : [selected];
      for (const path of paths) {
        try {
          const content = await tauriFs.readTextFile(path);
          const name = path.split(/[/\\]/).pop() || path;
          filesToImport.push({ name, content });
        } catch (error) {
          console.error(`Failed to read file ${path}:`, error);
        }
      }
    } else {
      // Browser mode: use file input
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = '.json';
      
      const filesPromise = new Promise<{ name: string; content: string }[]>((resolve) => {
        input.onchange = async (e) => {
          const files = (e.target as HTMLInputElement).files;
          if (!files || files.length === 0) {
            resolve([]);
            return;
          }
          
          const result: { name: string; content: string }[] = [];
          for (const file of Array.from(files)) {
            try {
              const content = await file.text();
              result.push({ name: file.name, content });
            } catch (error) {
              console.error(`Failed to read file ${file.name}:`, error);
            }
          }
          resolve(result);
        };
      });
      
      input.click();
      filesToImport = await filesPromise;
    }

    if (filesToImport.length === 0) return;

    // Add task to queue
    addTask(
      'add-knowledge',
      t('knowledge:batchImporting', 'Importing {{count}} knowledge items...', { count: filesToImport.length }),
      { databaseId: dbId, fileCount: filesToImport.length }
    );

    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const file of filesToImport) {
      try {
        const data = JSON.parse(file.content);
        await api.batchImportKnowledge(dbId, data);
        successCount++;
      } catch (error) {
        console.error(`Failed to import ${file.name}:`, error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`${file.name}: ${errorMsg}`);
        errorCount++;
      }
    }

    setIsImporting(false);
    setNeedsSync(true);
    fetchTypes();
    fetchItems();

    if (successCount > 0) {
      handleTaskComplete(
        'add-knowledge',
        'completed',
        t('knowledge:batchImportSuccess', 'Successfully imported {{count}} item(s)', { count: successCount })
      );
    }
    if (errorCount > 0) {
      console.error('Import errors:', errors);
      handleTaskComplete(
        'add-knowledge',
        'error',
        t('knowledge:batchImportErrors', 'Failed to import {{count}} item(s)', { count: errorCount })
      );
    }
  };

  // Handle export from modal
  const handleExportFromModal = async () => {
    if (!selectedItem || !itemDict) return;
    
    const filename = `${selectedItem.name}_${fmtShortHash(selectedItem.id_str)}.json`;
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
          handleTaskComplete('export', 'completed', t('knowledge:exportSuccess', 'Item exported successfully'));
        }
      } catch (error) {
        console.error('Failed to export item:', error);
        handleTaskComplete('export', 'error', t('knowledge:exportFailed', 'Failed to export item. Please try again.'));
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

  // Handle batch export for selected types
  const handleBatchExport = async () => {
    if (selectedTypes.size === 0) return;

    // Calculate total count for selected types
    const totalCount = Array.from(selectedTypes).reduce((sum, type) => sum + (typeCounts.get(type) || 0), 0);
    if (totalCount === 0) return;

    // Add task to queue
    const taskId = addTask(
      'export',
      t('knowledge:batchExporting', 'Exporting {{count}} knowledge items...', { count: totalCount }),
      { databaseId: dbId, types: Array.from(selectedTypes), totalCount }
    );

    setIsExporting(true);
    const defaultFilename = `knowledge_export_${new Date().toISOString().slice(0, 10)}.zip`;

    try {
      // Start streaming export
      api.streamBatchExportKnowledge(
        dbId,
        Array.from(selectedTypes),
        (progress) => {
          // Update task progress
          taskQueueManager.updateTask(taskId, {
            progress: progress.progress,
            message: t('knowledge:exportProgress', '{{current}} / {{total}}', {
              current: progress.current,
              total: progress.total
            })
          });
        },
        (error) => {
          // Handle error
          console.error('Failed to batch export:', error);
          setIsExporting(false);
          taskQueueManager.completeTask(taskId, 'error',
            t('knowledge:batchExportFailed', 'Failed to export knowledge items. Please try again.'));
        },
        async (blob) => {
          // On complete - download the zip file
          setIsExporting(false);

          if (isTauri && tauriDialog && tauriFs) {
            // Tauri mode: use native save dialog
            try {
              const savePath = await tauriDialog.save({
                defaultPath: defaultFilename,
                filters: [{ name: 'ZIP Files', extensions: ['zip'] }],
              });
              if (savePath) {
                // Convert blob to Uint8Array for Tauri
                const arrayBuffer = await blob.arrayBuffer();
                await tauriFs.writeBinaryFile(savePath, new Uint8Array(arrayBuffer));
                taskQueueManager.completeTask(taskId, 'completed',
                  t('knowledge:batchExportSuccess', 'Successfully exported {{count}} item(s)', { count: totalCount }));
              } else {
                taskQueueManager.completeTask(taskId, 'error',
                  t('knowledge:exportCancelled', 'Export cancelled'));
              }
            } catch (error) {
              console.error('Failed to save file:', error);
              taskQueueManager.completeTask(taskId, 'error',
                t('knowledge:batchExportFailed', 'Failed to export knowledge items. Please try again.'));
            }
          } else {
            // Browser mode: use blob download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = defaultFilename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            taskQueueManager.completeTask(taskId, 'completed',
              t('knowledge:batchExportSuccess', 'Successfully exported {{count}} item(s)', { count: totalCount }));
          }
        }
      );
    } catch (error) {
      console.error('Failed to start batch export:', error);
      setIsExporting(false);
      taskQueueManager.completeTask(taskId, 'error',
        t('knowledge:batchExportFailed', 'Failed to export knowledge items. Please try again.'));
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="flex h-full bg-white">
      {/* Types Sidebar - Facet Checkboxes */}
      <div className="w-[20%] min-w-[140px] border-r border-neutral-200 flex flex-col">
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-neutral-700">
              {t('knowledge:types', 'Types')}
            </h3>
            <button
              onClick={handleBatchExport}
              disabled={isExporting || selectedTypes.size === 0}
              className={cn(
                "p-1.5 rounded transition-colors",
                isExporting || selectedTypes.size === 0
                  ? "text-neutral-300 cursor-not-allowed"
                  : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
              )}
              title={t('knowledge:batchExport', 'Batch Export')}
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </button>
          </div>
          
          {/* Quick actions */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={selectAllTypes}
              className="text-xs px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
            >
              {t('knowledge:selectAll', 'All')}
            </button>
            <button
              onClick={clearAllTypes}
              className="text-xs px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
            >
              {t('knowledge:selectNone', 'None')}
            </button>
          </div>
          
          {/* Type checkboxes */}
          {typesLoading ? (
            <div className="text-sm text-neutral-400 py-2">{t('knowledge:loading', 'Loading...')}</div>
          ) : types.length === 0 ? (
            <div className="text-sm text-neutral-400 py-2">
              {t('knowledge:noTypes', 'No types available')}
            </div>
          ) : (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {types.map(type => {
                const isSelected = selectedTypes.has(type);
                const count = typeCounts.get(type) || 0;
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left transition-colors ${
                      isSelected
                        ? 'bg-neutral-100 text-neutral-700'
                        : 'text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-neutral-600 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    )}
                    <span className="truncate flex-1">{type}</span>
                    <span className="text-xs text-neutral-400 flex-shrink-0 tabular-nums">{count.toLocaleString()}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Edit Section */}
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-neutral-700">
              {t('knowledge:edit', 'Edit')}
            </h3>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={cn(
                "p-1.5 rounded transition-colors",
                isSyncing
                  ? "text-neutral-300 cursor-not-allowed"
                  : needsSync
                    ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                    : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
              )}
              title={needsSync
                ? t('knowledge:someChangesRequireSyncing', 'Some changes require syncing to be used by chat')
                : t('database:forceResync', 'Force Resync')
              }
            >
              <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
            </button>
          </div>
          <div className="space-y-2">
            <button
              onClick={handleBatchImport}
              disabled={isImporting}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-neutral-100 text-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {t('knowledge:batchImport', 'Batch Import')}
            </button>
            <button
              onClick={openAddTaxonomyModal}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-neutral-100 text-neutral-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('knowledge:addTaxonomy', 'Add Taxonomy')}
            </button>
            <button
              onClick={openAddKnowledgeModal}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-neutral-100 text-neutral-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('knowledge:addKnowledge', 'Add Knowledge')}
            </button>
            <button
              onClick={() => setShowAddExperienceModal(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-neutral-100 text-neutral-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('knowledge:addExperience', 'Add Experience')}
            </button>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search Bar */}
        <div className="p-4 border-b border-neutral-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('knowledge:searchPlaceholder', 'Search knowledge...')}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {selectedTypes.size === 0 ? (
            <div className="flex items-center justify-center h-full text-neutral-400 text-sm">
              {t('knowledge:selectType', 'Select at least one type to view items')}
            </div>
          ) : itemsLoading ? (
            <div className="flex items-center justify-center h-32 text-neutral-400 text-sm">
              {t('knowledge:loading', 'Loading...')}
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center h-full text-neutral-400 text-sm">
              {t('knowledge:noItems', 'No items found')}
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {items.map(item => (
                <div
                  key={`${item.type}-${item.id_str}`}
                  className="group/item p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-neutral-400">
                      {getTypeIcon(item.type)}
                    </div>
                    <button
                      onClick={() => openDetail(item)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-neutral-900 truncate">
                          {item.name}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 bg-neutral-100 text-neutral-500 rounded">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-500 line-clamp-2">
                        {item.short_description || item.description || t('knowledge:noDescription', 'No description')}
                      </p>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleExportItem(item, e)}
                        className="opacity-0 group-hover/item:opacity-100 p-1.5 hover:bg-neutral-100 rounded transition-all text-neutral-500 hover:text-neutral-700"
                        title={t('knowledge:exportItem', 'Export item')}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteItem(item, e)}
                        className="opacity-0 group-hover/item:opacity-100 p-1.5 hover:bg-red-50 rounded transition-all text-red-500 hover:text-red-600"
                        title={t('knowledge:deleteItem', 'Delete item')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {items.length > 0 && (
          <div className="p-3 border-t border-neutral-200 flex items-center justify-between bg-neutral-50 shrink-0">
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <span>{t('knowledge:itemsPerPage', 'Items per page')}:</span>
              <div className="relative">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(0);
                  }}
                  className="pl-2 pr-7 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-300 transition-all cursor-pointer"
                >
                  {[10, 20, 50, 100].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-sm text-neutral-600 mr-2">
                {t('knowledge:page', 'Page')} {page + 1} {t('knowledge:of', 'of')} {totalPages || 1} {t('knowledge:total', '')}
              </span>
              <button
                onClick={() => setPage(0)}
                disabled={page === 0}
                className={cn(
                  "p-1.5 rounded hover:bg-neutral-200 transition-colors",
                  page === 0 && "opacity-30 cursor-not-allowed"
                )}
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className={cn(
                  "p-1.5 rounded hover:bg-neutral-200 transition-colors",
                  page === 0 && "opacity-30 cursor-not-allowed"
                )}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className={cn(
                  "p-1.5 rounded hover:bg-neutral-200 transition-colors",
                  page >= totalPages - 1 && "opacity-30 cursor-not-allowed"
                )}
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setPage(totalPages - 1)}
                disabled={page >= totalPages - 1}
                className={cn(
                  "p-1.5 rounded hover:bg-neutral-200 transition-colors",
                  page >= totalPages - 1 && "opacity-30 cursor-not-allowed"
                )}
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                {getTypeIcon(selectedItem.type)}
                <h2 className="text-lg font-medium text-neutral-900">{selectedItem.name}</h2>
                <span className="text-xs px-1.5 py-0.5 bg-neutral-100 text-neutral-500 rounded">
                  {selectedItem.type}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={saving || saveSuccess || !hasChanges}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    saveSuccess
                      ? 'bg-green-600 text-white'
                      : saving || !hasChanges
                        ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                        : 'bg-black text-white hover:bg-neutral-800'
                  }`}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : saveSuccess ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving 
                    ? t('common:saving', 'Saving...')
                    : saveSuccess 
                      ? t('common:saved', 'Saved!')
                      : t('common:save', 'Save')
                  }
                </button>
                <button
                  onClick={closeDetail}
                  className="p-1 hover:bg-neutral-100 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1">
              {detailLoading ? (
                <div className="text-center text-neutral-400 py-8">{t('knowledge:loading', 'Loading...')}</div>
              ) : (
                <div className="space-y-4">
                  {/* Name (read-only) */}
                  <div>
                    <h3 className="text-xs font-medium text-neutral-500 uppercase mb-1">
                      {t('knowledge:name', 'Name')}
                    </h3>
                    <p className="text-sm text-neutral-700">{selectedItem.name}</p>
                  </div>

                  {/* Short Description (editable) */}
                  <div>
                    <h3 className="text-xs font-medium text-neutral-500 uppercase mb-1">
                      {t('knowledge:shortDescription', 'Short Description')}
                    </h3>
                    <input
                      type="text"
                      value={editShortDesc}
                      onChange={(e) => handleFieldChange('shortDesc', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('knowledge:shortDescPlaceholder', 'Enter short description...')}
                    />
                  </div>

                  {/* Description (editable) */}
                  <div>
                    <h3 className="text-xs font-medium text-neutral-500 uppercase mb-1">
                      {t('knowledge:description', 'Description')}
                    </h3>
                    <textarea
                      value={editDescription}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder={t('knowledge:descPlaceholder', 'Enter detailed description...')}
                    />
                  </div>

                  {/* Synonyms (editable with tags) */}
                  <div>
                    <h3 className="text-xs font-medium text-neutral-500 uppercase mb-1">
                      {t('knowledge:synonyms', 'Synonyms')}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {editSynonyms.map((syn, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded group"
                        >
                          {syn}
                          <button
                            onClick={() => removeSynonym(idx)}
                            className="hover:text-red-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
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
                        className="flex-1 px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t('knowledge:addSynonym', 'Add synonym...')}
                      />
                      <button
                        type="button"
                        onClick={addSynonym}
                        disabled={!newSynonym.trim() || editSynonyms.includes(newSynonym.trim())}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={16} />
                        {t('common:add', 'Add')}
                      </button>
                    </div>
                  </div>

                  {/* Tags (read-only) */}
                  <div>
                    <h3 className="text-xs font-medium text-neutral-500 uppercase mb-1">
                      {t('knowledge:tags', 'Tags')}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {displayTags.length > 0 ? (
                        displayTags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-neutral-400 italic">
                          {t('knowledge:noTags', 'No tags')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Knowledge JSON Data */}
                  <div className="border border-neutral-200 rounded-lg overflow-hidden">
                    <button
                      onClick={toggleJson}
                      className="w-full flex items-center justify-between px-3 py-2 bg-neutral-50 hover:bg-neutral-100 transition-colors"
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
                              handleExportFromModal();
                            }}
                            className="p-1 hover:bg-neutral-200 rounded transition-colors text-neutral-500 hover:text-neutral-700"
                            title={t('knowledge:exportItem', 'Export item')}
                          >
                            <Download size={14} />
                          </button>
                        )}
                        {loadingJson && <Loader2 size={14} className="animate-spin text-neutral-400" />}
                        {isJsonOpen ? <ChevronDown size={14} /> : <ChevronRightIcon size={14} />}
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

                  {/* Timestamps */}
                  <div className="flex gap-6 text-xs text-neutral-400 pt-2 border-t border-neutral-100">
                    <div>
                      <span className="font-medium">{t('knowledge:createdAt', 'Created')}:</span>{' '}
                      {selectedItem.created_at
                        ? new Date(selectedItem.created_at).toLocaleString()
                        : '—'}
                    </div>
                    <div>
                      <span className="font-medium">{t('knowledge:updatedAt', 'Updated')}:</span>{' '}
                      {selectedItem.updated_at
                        ? new Date(selectedItem.updated_at).toLocaleString()
                        : '—'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Taxonomy Modal */}
      <AddTaxonomyModal
        isOpen={showAddTaxonomyModal}
        onClose={() => setShowAddTaxonomyModal(false)}
        onSuccess={handleTaxonomySuccess}
        dbId={dbId}
      />

      {/* Add Knowledge Modal */}
      <AddKnowledgeModal
        isOpen={showAddKnowledgeModal}
        onClose={() => setShowAddKnowledgeModal(false)}
        onSuccess={handleKnowledgeSuccess}
        dbId={dbId}
      />

      {/* Add Experience Modal */}
      <AddExperienceModal
        isOpen={showAddExperienceModal || !!pendingExperience}
        onClose={() => {
          setShowAddExperienceModal(false);
          setPendingExperience(null);
        }}
        onSuccess={() => {
          handleKnowledgeSuccess();
          setPendingExperience(null);
        }}
        dbId={dbId}
        initialQuestion={pendingExperience?.question || ''}
        initialSql={pendingExperience?.sql || ''}
        autoExecute={pendingExperience?.autoExecute || false}
      />
    </div>
  );
}
