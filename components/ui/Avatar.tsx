import React, { useState } from 'react';
import Image from 'next/image';
import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  isOnline?: boolean;
  showOnline?: boolean;
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  className,
  onClick,
  isOnline,
  showOnline = true,
}: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0',
        sizes[size],
        onClick && 'cursor-pointer hover:ring-2 hover:ring-primary-dark transition-all',
        className
      )}
      onClick={onClick}
    >
      {src && !errored ? (
        // If the image is a locally uploaded avatar, render a plain <img>
        // to avoid Next.js image optimization/resizing so original bytes are preserved.
        (src.startsWith?.('/uploads/avatars/') ? (
          // browser will scale/display the image without server-side re-encoding
          // we keep object-cover so it crops to the circular container visually,
          // but the file served remains the original
          // eslint-disable-next-line jsx-a11y/alt-text
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="object-cover w-full h-full"
            onError={() => setErrored(true)}
          />
        ) : (
          <Image
            src={src}
            alt={alt || name || 'Avatar'}
            width={size === 'xl' ? 96 : size === 'lg' ? 64 : size === 'md' ? 48 : 32}
            height={size === 'xl' ? 96 : size === 'lg' ? 64 : size === 'md' ? 48 : 32}
            className="object-cover w-full h-full"
            onError={() => setErrored(true)}
          />
        ))
      ) : (
        <span className={cn(
          'font-semibold text-gray-600',
          size === 'xl' ? 'text-2xl' : size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-sm'
        )}>
          {name ? getInitials(name) : '?'}
        </span>
      )}
      {/* Online presence dot */}
      {showOnline && isOnline && (
        <span className="absolute right-0 bottom-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800" />
      )}
    </div>
  );
}