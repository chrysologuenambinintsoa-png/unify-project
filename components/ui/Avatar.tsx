import React from 'react';
import Image from 'next/image';
import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  className,
  onClick,
}: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div
      className={cn(
        'rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0',
        sizes[size],
        onClick && 'cursor-pointer hover:ring-2 hover:ring-primary-dark transition-all',
        className
      )}
      onClick={onClick}
    >
      {src ? (
        <Image
          src={src}
          alt={alt || name || 'Avatar'}
          width={size === 'xl' ? 96 : size === 'lg' ? 64 : size === 'md' ? 48 : 32}
          height={size === 'xl' ? 96 : size === 'lg' ? 64 : size === 'md' ? 48 : 32}
          className="object-cover w-full h-full"
        />
      ) : (
        <span className={cn(
          'font-semibold text-gray-600',
          size === 'xl' ? 'text-2xl' : size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-sm'
        )}>
          {name ? getInitials(name) : '?'}
        </span>
      )}
    </div>
  );
}