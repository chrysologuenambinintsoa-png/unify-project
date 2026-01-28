import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-md border border-gray-200',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn('p-6 border-b border-gray-200', className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn('p-6', className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardProps) {
  return (
    <div className={cn('p-6 border-t border-gray-200', className)}>
      {children}
    </div>
  );
}