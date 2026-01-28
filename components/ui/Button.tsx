import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  asChild?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  asChild = false,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-dark text-white hover:bg-primary-light focus:ring-primary-dark',
    secondary: 'bg-accent-dark text-white hover:bg-accent-light focus:ring-accent-dark',
    outline: 'border-2 border-primary-dark text-primary-dark hover:bg-primary-dark hover:text-white focus:ring-primary-dark',
    ghost: 'text-primary-dark hover:bg-primary-dark/10 focus:ring-primary-dark',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const buttonClasses = cn(baseStyles, variants[variant], sizes[size], className);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: cn(buttonClasses, children.props.className),
      ...props,
    });
  }

  return (
    <button
      className={buttonClasses}
      {...props}
    >
      {children}
    </button>
  );
}