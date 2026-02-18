'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface PostContentProps {
  content: string;
  contentType?: string;
}

/**
 * Component to display post content with proper translations
 * Translates special content types (photo changes) based on user's language
 */
export function PostContent({ content, contentType }: PostContentProps) {
  const { translation } = useLanguage();

  // For photo change posts, translate the content based on the content type
  if (contentType === 'profilePhotoChange') {
    // Extract username from content (format: "Username updated their profile photo")
    const match = content.match(/^(.+?)\s+updated their profile photo$/);
    if (match) {
      const username = match[1];
      return <>{username} {translation.profile?.updateProfilePhotoPost || 'updated their profile photo'}</>;
    }
  }

  if (contentType === 'coverPhotoChange') {
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
