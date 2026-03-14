import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all',
        'duration-150 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // Primary - Single blue accent, white text
        variant === 'primary' && 'bg-[#3B82F6] text-white hover:bg-[#2563EB] shadow-sm',
        // Secondary - White background with subtle border
        variant === 'secondary' && 'bg-white text-[#1A1A1A] border border-[#E5E7EB] hover:bg-[#F9FAFB]',
        // Size variants
        size === 'sm' && 'px-3 py-1.5 text-sm rounded-[0.25rem]',
        size === 'md' && 'px-4 py-2 text-base rounded-[0.375rem]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};