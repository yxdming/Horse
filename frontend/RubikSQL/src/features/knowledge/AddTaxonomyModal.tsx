import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { addTask, completeTaskByType } from '@/services/TaskQueueManager';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface AddTaxonomyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  dbId: string;
}

export const AddTaxonomyModal = ({ isOpen, onClose, onSuccess, dbId }: AddTaxonomyModalProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [tablesColumns, setTablesColumns] = useState<Record<string, string[]>>({});
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch schema when modal opens
  useEffect(() => {
    if (isOpen && dbId) {
      fetchSchema();
    }
  }, [isOpen, dbId]);

  const fetchSchema = async () => {
    try {
      const tablesColumnsData = await api.getTablesAndColumns(dbId);
      setTablesColumns(tablesColumnsData);
    } catch (err) {
      setError(t('knowledge:taxonomyModal.failedToFetchSchema', 'Failed to fetch database schema'));
      console.error(err);
    }
  };

  // Update available columns when table changes
  useEffect(() => {
    if (selectedTable && tablesColumns[selectedTable]) {
      const columnNames = tablesColumns[selectedTable];
      setAvailableColumns(columnNames);
      // Clear selected columns that are not in the new table
      setSelectedColumns(prev => prev.filter(col => columnNames.includes(col)));
    } else {
      setAvailableColumns([]);
      setSelectedColumns([]);
    }
  }, [selectedTable, tablesColumns]);

  const handleAddColumn = (column: string) => {
    if (!selectedColumns.includes(column)) {
      setSelectedColumns([...selectedColumns, column]);
    }
  };

  const handleRemoveColumn = (column: string) => {
    setSelectedColumns(selectedColumns.filter(col => col !== column));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !selectedTable || selectedColumns.length === 0) {
      setError(t('knowledge:taxonomyModal.fillRequiredFields', 'Please fill in all required fields and select at least one column'));
      return;
    }

    setIsLoading(true);
    setError(null);

    // Add task to queue
    addTask(
      'add-taxonomy',
      t('knowledge:addingTaxonomy', 'Adding taxonomy "{{name}}"...', { name }),
      { databaseId: dbId, name, table: selectedTable }
    );

    try {
      await api.addTaxonomy(dbId, {
        name,
        table: selectedTable,
        columns: selectedColumns,
        short_description: shortDescription || undefined,
        description: description || undefined,
      });

      // Complete the task successfully
      completeTaskByType('add-taxonomy', { databaseId: dbId }, 'completed', t('knowledge:taxonomyAdded', 'Taxonomy "{{name}}" added successfully', { name }));

      // Reset form
      setName('');
      setSelectedTable('');
      setSelectedColumns([]);
      setShortDescription('');
      setDescription('');
      setAvailableColumns([]);
      setTablesColumns({});

      onSuccess();
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('knowledge:taxonomyModal.failed', 'Failed to add taxonomy');
      // Complete the task with error
      completeTaskByType('add-taxonomy', { databaseId: dbId }, 'error', errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setName('');
      setSelectedTable('');
      setSelectedColumns([]);
      setShortDescription('');
      setDescription('');
      setAvailableColumns([]);
      setTablesColumns({});
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h2 className="text-lg font-medium text-neutral-900">{t('knowledge:taxonomyModal.title', 'Add Taxonomy')}</h2>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 hover:bg-neutral-100 rounded"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Taxonomy Name */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">
              {t('knowledge:taxonomyModal.taxonomyName', 'Taxonomy Name')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('knowledge:taxonomyModal.enterTaxonomyName', 'Enter taxonomy name')}
              required
            />
          </div>

          {/* Table Selection */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">
              {t('knowledge:taxonomyModal.table', 'Table')} <span className="text-red-500">*</span>
            </label>
            <CustomSelect
              value={selectedTable}
              onChange={(value) => setSelectedTable(value)}
              options={[
                { value: '', label: t('knowledge:taxonomyModal.selectTable', 'Select a table') },
                ...Object.keys(tablesColumns).map((tableName) => ({
                  value: tableName,
                  label: tableName,
                })),
              ]}
              placeholder={t('knowledge:taxonomyModal.selectTable', 'Select a table')}
            />
          </div>

          {/* Column Selection */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">
              {t('knowledge:taxonomyModal.columns', 'Columns')} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Available Columns */}
              <div>
                <div className="text-xs text-neutral-500 mb-1">{t('knowledge:taxonomyModal.availableColumns', 'Available Columns')}</div>
                <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-2 min-h-[160px] max-h-[160px] overflow-y-auto">
                  {availableColumns.length > 0 ? (
                    <div className="space-y-1">
                      {availableColumns
                        .filter(col => !selectedColumns.includes(col))
                        .map((column) => (
                          <button
                            key={column}
                            type="button"
                            onClick={() => handleAddColumn(column)}
                            className="w-full text-left px-2 py-1.5 rounded text-sm text-neutral-600 hover:bg-neutral-200 transition-colors flex items-center justify-between group"
                          >
                            <span>{column}</span>
                            <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400" />
                          </button>
                        ))}
                    </div>
                  ) : (
                    <div className="text-neutral-400 text-sm text-center py-4">
                      {selectedTable ? t('knowledge:taxonomyModal.noColumnsAvailable', 'No columns available') : t('knowledge:taxonomyModal.selectTableFirst', 'Select a table first')}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Columns (Ordered) */}
              <div>
                <div className="text-xs text-neutral-500 mb-1">{t('knowledge:taxonomyModal.selectedColumns', 'Selected Columns (in order)')}</div>
                <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-2 min-h-[160px] max-h-[160px] overflow-y-auto">
                  {selectedColumns.length > 0 ? (
                    <div className="space-y-1">
                      {selectedColumns.map((column, index) => (
                        <div
                          key={column}
                          className="flex items-center justify-between px-2 py-1.5 rounded bg-white border border-neutral-200 text-sm text-neutral-700"
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-xs text-neutral-400">{index + 1}.</span>
                            {column}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveColumn(column)}
                            className="text-neutral-400 hover:text-red-500 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-neutral-400 text-sm text-center py-4">
                      {t('knowledge:taxonomyModal.noColumnsSelected', 'No columns selected')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">
              {t('knowledge:taxonomyModal.shortDescription', 'Short Description')}
            </label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('knowledge:taxonomyModal.briefTaxonomyDescription', 'Brief description of this taxonomy')}
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">
              {t('knowledge:taxonomyModal.detailedDescription', 'Detailed Description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder={t('knowledge:taxonomyModal.detailedTaxonomyDescription', 'Detailed description of this taxonomy (optional)')}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-neutral-200 bg-neutral-50">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            disabled={isLoading}
          >
            {t('knowledge:taxonomyModal.cancel', 'Cancel')}
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || !name || !selectedTable || selectedColumns.length === 0}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all",
              isLoading || !name || !selectedTable || selectedColumns.length === 0
                ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                : "bg-black text-white hover:bg-neutral-800"
            )}
          >
            {isLoading ? t('knowledge:taxonomyModal.adding', 'Adding...') : t('knowledge:taxonomyModal.addTaxonomyBtn', 'Add Taxonomy')}
          </button>
        </div>
      </div>
    </div>
  );
};