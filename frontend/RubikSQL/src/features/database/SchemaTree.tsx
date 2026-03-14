import { useState } from 'react';
import { SchemaNode } from '@/types';
import { ChevronRight, ChevronDown, Table, Database, Columns } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SchemaTreeProps {
  data: SchemaNode[];
  onTableSelect?: (tableName: string) => void;
  selectedTable?: string | null;
  width?: number;
  isResizing?: boolean;
}

const TreeNode = ({ 
  node, 
  level = 0,
  onTableSelect,
  selectedTable
}: { 
  node: SchemaNode; 
  level?: number;
  onTableSelect?: (tableName: string) => void;
  selectedTable?: string | null;
}) => {
  // Schema (level 0) is open by default, tables (level 1+) are folded
  const [isOpen, setIsOpen] = useState(level === 0);
  const hasChildren = node.children && node.children.length > 0;
  const isTable = node.type === 'table';
  const isSelected = isTable && node.name === selectedTable;

  const Icon = node.type === 'schema' ? Database : node.type === 'table' ? Table : Columns;

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
    if (isTable && onTableSelect) {
      onTableSelect(node.name);
    }
  };

  return (
    <div>
      <div 
        className={cn(
          "flex items-center gap-2 py-1 px-2 hover:bg-neutral-100 cursor-pointer text-sm select-none rounded whitespace-nowrap",
          level > 0 && "ml-4",
          isSelected && "bg-neutral-200 font-medium"
        )}
        onClick={handleClick}
      >
        <span className="text-neutral-400 w-4 h-4 flex items-center justify-center shrink-0">
          {hasChildren && (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          )}
        </span>
        <Icon size={14} className={cn("text-neutral-500 shrink-0", isSelected && "text-neutral-700")} />
        <span className={cn("text-neutral-700", isSelected && "text-neutral-900")}>{node.name}</span>
        {node.dataType && (
          <span className="text-xs text-neutral-400 ml-auto shrink-0">{node.dataType}</span>
        )}
      </div>
      {isOpen && hasChildren && (
        <div>
          {node.children!.map((child, i) => (
            <TreeNode 
              key={i} 
              node={child} 
              level={level + 1}
              onTableSelect={onTableSelect}
              selectedTable={selectedTable}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const SchemaTree = ({ data, onTableSelect, selectedTable, width, isResizing }: SchemaTreeProps) => {
  return (
    <div 
      className={cn(
        "h-full overflow-hidden bg-neutral-50 shrink-0 relative",
        isResizing && "select-none"
      )}
      style={{ width: width ? `${width}px` : '256px' }}
    >
      <div className={cn(
        "h-full overflow-y-auto overflow-x-hidden p-2",
        isResizing && "pointer-events-none"
      )}>
        {data.map((node, i) => (
          <TreeNode 
            key={i} 
            node={node}
            onTableSelect={onTableSelect}
            selectedTable={selectedTable}
          />
        ))}
      </div>
      {/* Fading overlay - pointer-events-none so it doesn't block interactions */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ 
          background: 'linear-gradient(to right, transparent 85%, rgb(250, 250, 250) 100%)'
        }}
      />
    </div>
  );
};
