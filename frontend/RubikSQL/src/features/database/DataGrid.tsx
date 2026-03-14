import { useEffect, useState, useCallback } from 'react';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef, SortingState, getSortedRowModel } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { copyToClipboard } from '@/lib/clipboard';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Loader2, Info, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface DataGridProps {
  dbId: string | null;
  tableName: string | null;
}

interface TableData {
  columns: string[];
  columnTypes: Record<string, string>;
  rows: any[][];
  total: number;
  limit: number;
  offset: number;
}

// Cell component with copy functionality
const CopyableCell = ({ value, clickToCopyLabel }: { value: any; clickToCopyLabel: string }) => {
  const [copied, setCopied] = useState(false);
  
  const displayValue = value === null 
    ? <span className="text-neutral-400 italic">NULL</span>
    : typeof value === 'object' 
      ? JSON.stringify(value) 
      : String(value);
  
  const copyValue = value === null ? 'NULL' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  
  const handleCopy = async () => {
    try {
      await copyToClipboard(copyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };
  
  return (
    <div 
      className="group/cell flex items-center gap-1 cursor-pointer"
      onClick={handleCopy}
      title={clickToCopyLabel}
    >
      <span className="truncate">{displayValue}</span>
      <span className="opacity-0 group-hover/cell:opacity-100 transition-opacity shrink-0">
        {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} className="text-neutral-400" />}
      </span>
    </div>
  );
};

export const DataGrid = ({ dbId, tableName }: DataGridProps) => {
  const { t } = useTranslation(['database']);
  const [data, setData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Fetch table data
  const fetchData = useCallback(async () => {
    if (!dbId || !tableName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const sortBy = sorting.length > 0 ? sorting[0].id : undefined;
      const sortOrder = sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : undefined;
      
      const result = await api.getTableData(
        dbId,
        tableName,
        pageSize,
        page * pageSize,
        sortBy,
        sortOrder
      );
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dbId, tableName, page, pageSize, sorting]);

  // Reset page when table changes
  useEffect(() => {
    setPage(0);
    setSorting([]);
  }, [dbId, tableName]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get clickToCopy label for cells
  const clickToCopyLabel = t('clickToCopy');

  // Build columns dynamically
  const columns: ColumnDef<any>[] = data?.columns.map((col, index) => ({
    id: col,
    accessorFn: (row: any[]) => row[index],
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      const colType = data?.columnTypes?.[col] || 'unknown';
      return (
        <div className="flex items-center gap-1">
          <button
            className="flex items-center gap-1 hover:text-neutral-900 transition-colors"
            onClick={() => column.toggleSorting()}
          >
            {col}
            {isSorted === 'asc' ? (
              <ArrowUp size={14} />
            ) : isSorted === 'desc' ? (
              <ArrowDown size={14} />
            ) : (
              <ArrowUpDown size={14} className="opacity-30" />
            )}
          </button>
          <div className="relative group/info">
            <Info size={12} className="text-neutral-300 hover:text-neutral-500 cursor-help" />
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 bg-neutral-800 text-white text-xs rounded opacity-0 group-hover/info:opacity-100 pointer-events-none whitespace-nowrap z-[100] transition-opacity">
              {colType}
            </div>
          </div>
        </div>
      );
    },
    cell: ({ getValue }) => {
      const value = getValue();
      return <CopyableCell value={value} clickToCopyLabel={clickToCopyLabel} />;
    },
  })) ?? [];

  // Convert row arrays to objects for table
  const tableData = data?.rows ?? [];
  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true, // We handle sorting on the server
  });

  // Empty state
  if (!dbId || !tableName) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-white">
        <div className="text-center text-neutral-400">
          <p className="text-sm">{t('selectTable')}</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-white">
        <div className="text-center text-red-500">
          <p className="text-sm">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-2 text-xs text-neutral-500 hover:text-neutral-700 underline"
          >
            {t('common:retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="p-3 border-b border-neutral-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-neutral-600">{tableName}</span>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />}
        </div>
        <div className="text-xs text-neutral-400">
          {data ? `${data.total.toLocaleString()} ${t('common:rows')}` : ''}
        </div>
      </div>
      
      {/* Table */}
      <div 
        className="flex-1 overflow-auto"
        style={{ 
          maskImage: 'linear-gradient(to bottom, black 90%, transparent 100%)', 
          WebkitMaskImage: 'linear-gradient(to bottom, black 90%, transparent 100%)' 
        }}
      >
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-neutral-50 sticky top-0 z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-4 py-2 font-medium text-neutral-500 border-b border-neutral-200 whitespace-nowrap">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-neutral-50 border-b border-neutral-100">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-2 text-neutral-700 max-w-xs truncate">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-3 border-t border-neutral-200 flex items-center justify-between bg-neutral-50 shrink-0">
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <span>{t('rowsPerPage')}:</span>
          <CustomSelect
            value={pageSize}
            onChange={(value) => {
              setPageSize(value);
              setPage(0);
            }}
            options={[25, 50, 100].map(size => ({ value: size, label: String(size) }))}
            className="w-20"
            buttonClassName="py-1.5"
            menuClassName="left-0 bottom-full mb-1"
          />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-sm text-neutral-600 mr-2">
            {t('page')} {page + 1} {t('of')} {totalPages || 1} {t('total')}
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
    </div>
  );
};
