'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface PostContentProps {
  content: string;
  contentType?: string;
  isPostOwner?: boolean;
}

/**
 * Component to display post content with proper translations
 * Translates special content types (photo changes) based on user's language
 * Hides photo change message if it's the user's own post
 */
export function PostContent({ content, contentType, isPostOwner = false }: PostContentProps) {
  const { translation } = useLanguage();

  // For photo change posts, translate the content based on the content type
  // Don't show the message if it's the user's own post
  if (contentType === 'profilePhotoChange') {
    if (isPostOwner) {
      // Don't display anything for user's own profile photo change
      return null;
    }
    // Extract username from content (format: "Username updated their profile photo")
    const match = content.match(/^(.+?)\s+updated their profile photo$/);
    if (match) {
      const username = match[1];
      return <>{username} {translation.profile?.updateProfilePhotoPost || 'updated their profile photo'}</>;
    }
  }

  if (contentType === 'coverPhotoChange') {
    if (isPostOwner) {
      // Don't display anything for user's own cover photo change
      return null;
    }
    // Extract username from content (format: "Username updated their cover photo")
    const match = content.match(/^(.+?)\s+updated their cover photo$/);
    if (match) {
      const username = match[1];
      return <>{username} {translation.profile?.updateCoverPhotoPost || 'updated their cover photo'}</>;
    }
  }

  // For regular posts, just return the content as is
  return <>{content}</>;
}
