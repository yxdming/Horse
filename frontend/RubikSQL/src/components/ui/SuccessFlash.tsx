import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface SuccessFlashProps {
  children: React.ReactNode;
  trigger: boolean;
  className?: string;
}

export const SuccessFlash = ({ children, trigger, className }: SuccessFlashProps) => {
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsFlashing(true);
      const timer = setTimeout(() => {
        setIsFlashing(false);
      }, 500); // Duration of the flash animation

      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div
      className={cn(
        isFlashing && 'animate-success-flash',
        className
      )}
    >
      {children}
    </div>
  );
};