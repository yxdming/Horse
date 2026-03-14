import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Play, Loader2, Check, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { addTask, completeTaskByType } from '@/services/TaskQueueManager';
import { CodeEditor } from '@/components/ui/CodeEditor';

interface AddExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  dbId: string;
  initialQuestion?: string;
  initialSql?: string;
  autoExecute?: boolean;
}

export const AddExperienceModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  dbId,
  initialQuestion = '',
  initialSql = '',
  autoExecute = false,
}: AddExperienceModalProps) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState(initialQuestion);
  const [sql, setSql] = useState(initialSql);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPrettifying, setIsPrettifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sqlValid, setSqlValid] = useState<boolean | null>(null);
  const [executionResult, setExecutionResult] = useState<{
    columns: string[];
    rows: any[][];
  } | null>(null);
  const hasAutoExecuted = useRef(false);

  // Update state when initial values change (modal opens with new data)
  useEffect(() => {
    if (isOpen) {
      setQuestion(initialQuestion);
      setSql(initialSql);
      setSqlValid(null);
      setExecutionResult(null);
      setError(null);
      hasAutoExecuted.current = false;
    }
  }, [isOpen, initialQuestion, initialSql]);

  const handlePrettifySql = async (): Promise<string> => {
    if (!sql.trim()) return sql;
    
    setIsPrettifying(true);
    try {
      const result = await api.prettifySql(dbId, sql);
      if (result.success && result.sql) {
        setSql(result.sql);
        return result.sql;
      }
    } catch (err) {
      // On error, keep the original SQL
      console.warn('Prettify failed, using original SQL');
    } finally {
      setIsPrettifying(false);
    }
    return sql;
  };

  const handleExecuteSql = async (sqlToExecute?: string) => {
    const currentSql = sqlToExecute || sql;
    if (!currentSql.trim()) {
      setError(t('knowledge:experienceModal.sqlRequired', 'SQL is required'));
      return;
    }

    setIsExecuting(true);
    setError(null);
    setSqlValid(null);
    setExecutionResult(null);

    try {
      const result = await api.executeSql(dbId, currentSql);
      if (result.success) {
        setSqlValid(true);
        setExecutionResult({
          columns: result.columns,
          rows: result.rows,
        });
      } else {
        setSqlValid(false);
        setError(result.error || t('knowledge:experienceModal.sqlExecutionFailed', 'SQL execution failed'));
      }
    } catch (err) {
      setSqlValid(false);
      setError(err instanceof Error ? err.message : t('knowledge:experienceModal.sqlExecutionFailed', 'SQL execution failed'));
    } finally {
      setIsExecuting(false);
    }
  };

  // Auto-prettify and execute SQL when modal opens with autoExecute flag
  useEffect(() => {
    if (isOpen && autoExecute && initialSql && !hasAutoExecuted.current) {
      hasAutoExecuted.current = true;
      // Small delay to let the modal render first
      const timer = setTimeout(async () => {
        // First prettify, then execute
        const prettified = await handlePrettifySql();
        await handleExecuteSql(prettified);
      }, 100);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, autoExecute, initialSql]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim() || !sql.trim()) {
      setError(t('knowledge:experienceModal.fillRequiredFields', 'Please fill in question and SQL'));
      return;
    }

    if (!sqlValid) {
      setError(t('knowledge:experienceModal.executeSqlFirst', 'Please execute SQL successfully before saving'));
      return;
    }

    setIsSaving(true);
    setError(null);

    // Add task to queue
    addTask(
      'add-experience',
      t('knowledge:experienceModal.adding', 'Adding experience "{{question}}"...', { question: question.trim().slice(0, 30) + (question.trim().length > 30 ? "..." : "") }),
      { databaseId: dbId, question: question.trim() }
    );

    try {
      await api.addExperience(dbId, {
        question: question.trim(),
        sql: sql.trim(),
      });

      // Complete the task successfully
      completeTaskByType('add-experience', { databaseId: dbId }, 'completed', t('knowledge:experienceAdded', 'Experience saved successfully'));

      // Reset form
      setQuestion('');
      setSql('');
      setSqlValid(null);
      setExecutionResult(null);

      onSuccess();
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('knowledge:experienceModal.saveFailed', 'Failed to save experience');
      // Complete the task with error
      completeTaskByType('add-experience', { databaseId: dbId }, 'error', errorMsg);
      setError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving && !isExecuting) {
      setQuestion('');
      setSql('');
      setSqlValid(null);
      setExecutionResult(null);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h2 className="text-lg font-medium text-neutral-900">
            {t('knowledge:experienceModal.title', 'Add Experience')}
          </h2>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 hover:bg-neutral-100 rounded"
            disabled={isSaving || isExecuting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Question */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">
              {t('knowledge:experienceModal.question', 'Question')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('knowledge:experienceModal.questionPlaceholder', 'Enter the natural language question')}
              required
            />
          </div>

          {/* SQL Editor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-neutral-500 uppercase">
                {t('knowledge:experienceModal.sql', 'SQL')} <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                {sqlValid === true && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <Check size={12} />
                    {t('knowledge:experienceModal.sqlValid', 'Valid')}
                  </span>
                )}
                {sqlValid === false && (
                  <span className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {t('knowledge:experienceModal.sqlInvalid', 'Invalid')}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handlePrettifySql()}
                  disabled={isPrettifying || !sql.trim()}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1 text-xs font-medium rounded transition-all",
                    isPrettifying || !sql.trim()
                      ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                      : "bg-neutral-700 text-white hover:bg-neutral-600"
                  )}
                  title={t('knowledge:experienceModal.prettify', 'Prettify SQL')}
                >
                  {isPrettifying ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  {t('knowledge:experienceModal.prettify', 'Prettify')}
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteSql()}
                  disabled={isExecuting || !sql.trim()}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1 text-xs font-medium rounded transition-all",
                    isExecuting || !sql.trim()
                      ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  )}
                >
                  {isExecuting ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Play size={12} />
                  )}
                  {t('knowledge:experienceModal.execute', 'Execute')}
                </button>
              </div>
            </div>

            {/* SQL Editor */}
            <CodeEditor
              value={sql}
              onChange={(value) => {
                setSql(value);
                setSqlValid(null); // Reset validation on change
                setExecutionResult(null);
              }}
              language="sql"
              placeholder={t('knowledge:experienceModal.sqlPlaceholder', 'SELECT * FROM ...')}
              minHeight="120px"
              dark={true}
            />
          </div>

          {/* Execution Results */}
          {executionResult && executionResult.rows.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">
                {t('knowledge:experienceModal.results', 'Results')}
                <span className="ml-2 font-normal text-neutral-400">
                  ({executionResult.rows.length} {t('common.rows', 'rows')})
                </span>
              </label>
              <div className="border border-neutral-200 rounded-lg overflow-hidden max-h-[200px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-neutral-50 sticky top-0">
                    <tr>
                      {executionResult.columns.map((col, i) => (
                        <th key={i} className="px-3 py-2 text-left font-medium text-neutral-600 border-b border-neutral-200">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {executionResult.rows.slice(0, 20).map((row, i) => (
                      <tr key={i} className="hover:bg-neutral-50">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-1.5 border-b border-neutral-100 text-neutral-700 truncate max-w-[200px]">
                            {cell !== null ? String(cell) : <span className="text-neutral-400 italic">null</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {executionResult.rows.length > 20 && (
                  <div className="px-3 py-2 text-xs text-neutral-400 bg-neutral-50 border-t border-neutral-200">
                    {t('knowledge:experienceModal.showingFirst', 'Showing first 20 of {{count}} rows', { count: executionResult.rows.length })}
                  </div>
                )}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-neutral-200 bg-neutral-50">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            disabled={isSaving || isExecuting}
          >
            {t('common:cancel', 'Cancel')}
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSaving || !question.trim() || !sql.trim() || !sqlValid}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all",
              isSaving || !question.trim() || !sql.trim() || !sqlValid
                ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                : "bg-black text-white hover:bg-neutral-800"
            )}
          >
            {isSaving ? t('knowledge:experienceModal.saving', 'Saving...') : t('knowledge:experienceModal.save', 'Save Experience')}
          </button>
        </div>
      </div>
    </div>
  );
};
