/**
 * Generate a Dicebear avatar URL based on user preferences
 * Uses gender-appropriate styles when avatar is not provided
 */
export function generateAvatarUrl(
  realAvatar: string | null | undefined,
  userFullName: string | null | undefined,
  userId: string,
  gender: string | null | undefined
): string {
  // If user has a real avatar, use it
  if (realAvatar) {
    return realAvatar;
  }

  const seed = encodeURIComponent(userFullName || userId);

  // Generate gender-appropriate avatar
  switch (gender?.toLowerCase()) {
    case 'female':
    case 'feminin':
    case 'f':
      return `https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=${seed}&backgroundColor=random`;
    
    case 'male':
    case 'masculin':
    case 'm':
      return `https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=${seed}&backgroundColor=random`;
    
    default:
      // Generic avatar for unknown/other gender
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  }
}
