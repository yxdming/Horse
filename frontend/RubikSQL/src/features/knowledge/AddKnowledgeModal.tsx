import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { addTask, completeTaskByType } from '@/services/TaskQueueManager';

interface AddKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  dbId: string;
}

export const AddKnowledgeModal = ({ isOpen, onClose, onSuccess, dbId }: AddKnowledgeModalProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [newSynonym, setNewSynonym] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSynonym = () => {
    if (newSynonym.trim() && !synonyms.includes(newSynonym.trim())) {
      setSynonyms([...synonyms, newSynonym.trim()]);
      setNewSynonym('');
    }
  };

  const handleRemoveSynonym = (synonym: string) => {
    setSynonyms(synonyms.filter(s => s !== synonym));
  };

  const handleSynonymKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSynonym();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !content) {
      setError(t('knowledge:knowledgeModal.fillRequiredFields', 'Please fill in the required fields'));
      return;
    }

    setIsLoading(true);
    setError(null);

    // Add task to queue
    addTask(
      'add-knowledge',
      t('knowledge:adding', 'Adding knowledge "{{name}}"...', { name }),
      { databaseId: dbId, name }
    );

    try {
      await api.addKnowledge(dbId, {
        name,
        content,
        synonyms: synonyms.length > 0 ? synonyms : undefined,
        short_description: shortDescription || undefined,
        description: description || undefined,
      });

      // Complete the task successfully
      completeTaskByType('add-knowledge', { databaseId: dbId }, 'completed', t('knowledge:knowledgeAdded', 'Knowledge "{{name}}" added successfully', { name }));

      // Reset form
      setName('');
      setContent('');
      setSynonyms([]);
      setNewSynonym('');
      setShortDescription('');
      setDescription('');

      onSuccess();
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('knowledge:knowledgeModal.failed', 'Failed to add knowledge');
      // Complete the task with error
      completeTaskByType('add-knowledge', { databaseId: dbId }, 'error', errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setName('');
      setContent('');
      setSynonyms([]);
      setNewSynonym('');
      setShortDescription('');
      setDescription('');
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
          <h2 className="text-lg font-medium text-neutral-900">{t('knowledge:knowledgeModal.title', 'Add Knowledge')}</h2>
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

          {/* Knowledge Name */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">
              {t('knowledge:knowledgeModal.knowledgeName', 'Knowledge Name')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('knowledge:knowledgeModal.enterKnowledgeName', 'Enter knowledge name')}
              required
            />
          </div>

          {/* Knowledge Content */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">
              {t('knowledge:knowledgeModal.knowledgeContent', 'Knowledge Content')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder={t('knowledge:knowledgeModal.enterKnowledgeContent', 'Enter the knowledge content')}
              required
            />
          </div>

          {/* Synonyms */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">
              {t('knowledge:knowledgeModal.synonyms', 'Synonyms')}
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {synonyms.map((synonym) => (
                <span
                  key={synonym}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded group"
                >
                  {synonym}
                  <button
                    type="button"
                    onClick={() => handleRemoveSynonym(synonym)}
                    className="hover:text-red-500 transition-colors"
                  >
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
                onKeyDown={handleSynonymKeyPress}
                className="flex-1 px-3 py-1.5 text-sm border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('knowledge:knowledgeModal.addSynonymHint', 'Add synonym (press Enter)')}
              />
              <button
                type="button"
                onClick={handleAddSynonym}
                disabled={!newSynonym.trim() || synonyms.includes(newSynonym.trim())}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                {t('common:add', 'Add')}
              </button>
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">
              {t('knowledge:knowledgeModal.shortDescription', 'Short Description')}
            </label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('knowledge:knowledgeModal.briefKnowledgeDescription', 'Brief description of this knowledge')}
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase mb-1">
              {t('knowledge:knowledgeModal.detailedDescription', 'Detailed Description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder={t('knowledge:knowledgeModal.detailedKnowledgeDescription', 'Detailed description of this knowledge (optional)')}
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
            {t('knowledge:knowledgeModal.cancel', 'Cancel')}
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || !name || !content}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all",
              isLoading || !name || !content
                ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                : "bg-black text-white hover:bg-neutral-800"
            )}
          >
            {isLoading ? t('knowledge:knowledgeModal.adding', 'Adding...') : t('knowledge:knowledgeModal.addKnowledgeBtn', 'Add Knowledge')}
          </button>
        </div>
      </div>
    </div>
  );
};