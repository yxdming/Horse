import React from 'react';
import { cn } from '@/lib/utils';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export const Tag = ({ children, variant = 'default', className, ...props }: TagProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 text-sm rounded-[0.25rem] border',
        // Default - Minimal gray
        variant === 'default' && 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]',
        // Success - Green
        variant === 'success' && 'bg-[#F0FDF4] text-[#22C55E] border-[#BBF7D0]',
        // Warning - Yellow
        variant === 'warning' && 'bg-[#FFFBEB] text-[#F59E0B] border-[#FDE68A]',
        // Error - Red
        variant === 'error' && 'bg-[#FEF2F2] text-[#EF4444] border-[#FECACA]',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};