import { useState, useEffect } from 'react';
import { Search, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { api, KnowledgeItem } from '@/lib/api';
import { useAppStore } from '@/stores/useAppStore';

interface KnowledgeListProps {
  type: string;
  onSelect: (item: KnowledgeItem) => void;
}

export const KnowledgeList = ({ type, onSelect }: KnowledgeListProps) => {
  const { activeConnectionId } = useAppStore();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (activeConnectionId && type) {
      fetchItems(true);
    }
  }, [activeConnectionId, type, search]);

  const fetchItems = async (reset: boolean = false) => {
    if (!activeConnectionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const currentPage = reset ? 1 : page;
      const response = await api.getKnowledgeList(activeConnectionId, type, currentPage, 20, search);
      
      if (reset) {
        setItems(response.items);
      } else {
        setItems(prev => [...prev, ...response.items]);
      }
      
      setHasMore(items.length + response.items.length < response.total);
      setPage(currentPage + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-neutral-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
          <input
            type="text"
            placeholder={`Search ${type}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-neutral-200 rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 text-neutral-900 placeholder:text-neutral-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4 text-red-500 flex items-center gap-2 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {items.length === 0 && !loading && !error && (
          <div className="p-8 text-center text-neutral-500 text-sm">
            No items found
          </div>
        )}

        <div className="divide-y divide-neutral-100">
          {items.map((item) => (
            <button
              key={item.id_str}
              onClick={() => onSelect(item)}
              className="w-full text-left p-4 hover:bg-neutral-50 transition-colors flex items-center justify-between group"
            >
              <div className="min-w-0">
                <div className="font-medium text-neutral-900 truncate">{item.name}</div>
                {item.short_description && (
                  <div className="text-xs text-neutral-500 truncate mt-1">{item.short_description}</div>
                )}
              </div>
              <ChevronRight size={16} className="text-neutral-400 group-hover:text-neutral-600 transition-colors" />
            </button>
          ))}
        </div>

        {loading && (
          <div className="p-4 flex justify-center">
            <Loader2 size={20} className="animate-spin text-blue-500" />
          </div>
        )}
        
        {!loading && hasMore && (
           <button 
             onClick={() => fetchItems(false)}
             className="w-full p-4 text-sm text-blue-600 hover:text-blue-700 transition-colors"
           >
             Load More
           </button>
        )}
      </div>
    </div>
  );
};
