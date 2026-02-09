import frTranslations from './fr.json';
import enTranslations from './en.json';
import esTranslations from './es.json';
import deTranslations from './de.json';
import mgTranslations from './mg.json';
import chTranslations from './ch.json';
import ptTranslations from './pt.json';
import itTranslations from './it.json';
import arTranslations from './ar.json';
import hiTranslations from './hi.json';

export type Language = 'fr' | 'en' | 'es' | 'de' | 'mg' | 'ch' | 'pt' | 'it' | 'ar' | 'hi';

const translations: Record<Language, any> = {
  fr: frTranslations,
  en: enTranslations,
  es: esTranslations,
  de: deTranslations,
  mg: mgTranslations,
  ch: chTranslations,
  pt: ptTranslations,
  it: itTranslations,
  ar: arTranslations,
  hi: hiTranslations,
};

export function getTranslations(language: Language = 'fr') {
  return translations[language] || translations.fr;
}

export function getNotificationMessage(
  type: 'avatarChange' | 'coverChange' | 'storyCreated',
  actorName: string,
  language: Language = 'fr'
) {
  const trans = getTranslations(language);
  const actorDisplayName = actorName || 'Utilisateur';

  switch (type) {
    case 'avatarChange':
      return trans.notification?.avatarChangeText || `${actorDisplayName} a changé sa photo de profil`;
    case 'coverChange':
      return trans.notification?.coverChangeText || `${actorDisplayName} a changé sa photo de couverture`;
    case 'storyCreated':
      return trans.notification?.storyCreatedText || `${actorDisplayName} a publié une story`;
    default:
      return `${actorDisplayName} a effectué une action`;
  }
}

export function getNotificationTitle(
  type: 'avatarChange' | 'coverChange' | 'storyCreated',
  language: Language = 'fr'
) {
  const trans = getTranslations(language);

  switch (type) {
    case 'avatarChange':
      return trans.notification?.avatarChange || 'Photo de profil';
    case 'coverChange':
      return trans.notification?.coverChange || 'Photo de couverture';
    case 'storyCreated':
      return trans.notification?.storyCreated || 'Nouvelle story';
    default:
      return trans.notification?.notifications || 'Notification';
  }
}
