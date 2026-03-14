import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption<T = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  className?: string;
}

interface CustomSelectProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  error?: boolean;
}

/**
 * A custom dropdown select component that works in both web and Tauri environments.
 * Uses button-based approach instead of native <select> for full compatibility.
 */
export function CustomSelect<T = string>({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  className,
  buttonClassName,
  menuClassName,
  error = false,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Dropdown trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-2 px-3 pr-10 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-left transition-all",
          disabled
            ? "opacity-60 cursor-not-allowed"
            : "hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-300 cursor-pointer",
          error && "border-red-300 bg-red-50",
          buttonClassName
        )}
        disabled={disabled}
      >
        {selectedOption ? (
          <>
            {selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>}
            <span className="flex-1 truncate">{selectedOption.label}</span>
          </>
        ) : (
          <span className="flex-1 text-neutral-400">{placeholder}</span>
        )}
      </button>
      <ChevronDown
        size={16}
        className={cn(
          "absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none transition-transform",
          isOpen && "rotate-180"
        )}
      />

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto",
            menuClassName
          )}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={String(option.value)}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors",
                  isSelected ? "bg-neutral-100" : "hover:bg-neutral-50",
                  option.className
                )}
              >
                {option.icon && <span className="shrink-0">{option.icon}</span>}
                <span className="flex-1 truncate">{option.label}</span>
                {isSelected && <Check size={16} className="text-neutral-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
