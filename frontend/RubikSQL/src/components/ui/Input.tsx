import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
            {label}
          </label>
        )}
        <input
          className={cn(
            'w-full px-3 py-2 bg-white',
            'border border-[#E5E7EB] rounded-[0.375rem]',
            'text-[#1A1A1A] placeholder-[#9CA3AF]',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent',
            'hover:border-[#D1D5DB]',
            'disabled:bg-[#F9FAFB] disabled:cursor-not-allowed',
            error && 'border-[#EF4444] focus:ring-[#EF4444]',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-[#EF4444]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';