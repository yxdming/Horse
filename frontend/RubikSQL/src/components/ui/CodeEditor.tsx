import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { python } from '@codemirror/lang-python';
import { StreamLanguage } from '@codemirror/language';
import { json as jsonLegacy } from '@codemirror/legacy-modes/mode/javascript';
import { cn } from '@/lib/utils';
import { copyToClipboard } from '@/lib/clipboard';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  className?: string;
  placeholder?: string;
  minHeight?: string;
  dark?: boolean;
  editable?: boolean;
}

const getLanguageExtension = (lang: string) => {
  if (!lang) return [];

  const normalizedLang = lang.toLowerCase();
  switch (normalizedLang) {
    case 'sql':
      return sql();
    case 'python':
    case 'py':
      return python();
    case 'json':
      return StreamLanguage.define(jsonLegacy);
    case 'text':
    default:
      // Return empty extension for text/plain
      return [];
  }
};

export const CodeEditor = ({
  value,
  onChange,
  language = 'text',
  className,
  placeholder = '',
  minHeight = '120px',
  dark = true,
  editable = true,
}: CodeEditorProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyToClipboard(value || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Ensure value is never null/undefined
  const safeValue = value || '';

  return (
    <div
      className={cn(
        'relative rounded-lg overflow-hidden border group',
        dark ? 'border-neutral-700 bg-[#1e1e1e]' : 'border-neutral-200 bg-white',
        className
      )}
      style={{ minHeight }}
    >
      {/* Copy button */}
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className={cn(
            "p-1 rounded shadow-sm transition-colors border",
            dark
              ? "bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-neutral-400"
              : "bg-white/80 backdrop-blur-sm border-neutral-200/50 hover:bg-white text-neutral-500"
          )}
          title="Copy code"
        >
          {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-inherit" />}
        </button>
      </div>

      <CodeMirror
        value={safeValue}
        onChange={onChange}
        extensions={[
          getLanguageExtension(language),
        ]}
        placeholder={placeholder}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          foldGutter: false,
          drawSelection: editable,
          dropCursor: editable,
          allowMultipleSelections: editable,
          indentOnInput: editable,
          bracketMatching: true,
          closeBrackets: editable,
          autocompletion: editable,
          rectangularSelection: editable,
          crosshairCursor: editable,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: editable,
          searchKeymap: true,
          foldKeymap: false,
          completionKeymap: editable,
          lintKeymap: false,
        }}
        theme={dark ? 'dark' : 'light'}
        height={minHeight}
        minHeight={minHeight}
        style={{
          fontSize: '0.75rem',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        }}
        readOnly={!editable}
      />
    </div>
  );
};
