/**
 * Server-side translation utility
 * Used to translate strings when creating posts, notifications, etc.
 */

const translations: Record<string, Record<string, string>> = {
  fr: {
    updateProfilePhotoPost: 'a changé sa photo de profil',
    updateCoverPhotoPost: 'a changé sa photo de couverture',
  },
  en: {
    updateProfilePhotoPost: 'updated their profile photo',
    updateCoverPhotoPost: 'updated their cover photo',
  },
  ch: {
    updateProfilePhotoPost: 'updated their profile photo',
    updateCoverPhotoPost: 'updated their cover photo',
  },
};

/**
 * Get translation for a key in a specific language
 * @param key - Translation key
 * @param language - Language code (defaults to 'en')
 * @returns Translated string
 */
export function getServerTranslation(key: string, language: string = 'en'): string {
  const lang = language.toLowerCase();
  return translations[lang]?.[key] || translations['en']?.[key] || key;
}

/**
 * Format activity message with user name
 * @param messageKey - Translation key for the message
 * @param userName - User's full name or username
 * @param language - Language code (defaults to 'en')
 * @returns Formatted message: "{userName} {translated_message}"
 */
export function formatActivityMessage(
  messageKey: string,
  userName: string,
  language: string = 'en'
): string {
  const message = getServerTranslation(messageKey, language);
  return `${userName} ${message}`;
}
