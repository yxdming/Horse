import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = ({ children, className, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        'bg-white rounded-[0.5rem] border border-[#E5E7EB]',
        'transition-all duration-150 hover:border-[#D1D5DB] hover:shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className, ...props }: CardProps) => {
  return (
    <div
      className={cn('px-6 py-4 border-b border-[#E5E7EB]', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardContent = ({ children, className, ...props }: CardProps) => {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className, ...props }: CardProps) => {
  return (
    <div
      className={cn('px-6 py-4 border-t border-[#E5E7EB] bg-[#F9FAFB]', className)}
      {...props}
    >
      {children}
    </div>
  );
};