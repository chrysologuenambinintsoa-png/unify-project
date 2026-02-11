import fr from './translations/fr.json';
import mg from './translations/mg.json';
import en from './translations/en.json';
import es from './translations/es.json';
import de from './translations/de.json';
import ch from './translations/ch.json';
import pt from './translations/pt.json';
import hi from './translations/hi.json';
import ar from './translations/ar.json';
import it from './translations/it.json';

export type Translation = any;
export type Language = 'fr' | 'mg' | 'en' | 'es' | 'de' | 'ch' | 'pt' | 'hi' | 'ar' | 'it';

const translations: Record<Language, Translation> = {
  fr,
  mg,
  en,
  es,
  de,
  ch,
  pt,
  hi,
  ar,
  it,
};

export function getTranslation(lang: Language = 'fr'): Translation {
  return translations[lang] || translations.fr;
}

export function t(
  lang: Language,
  key: string,
  fallback?: string
): string {
  const translation = getTranslation(lang);
  const keys = key.split('.');
  let value: any = translation;

  for (const k of keys) {
    value = value?.[k];
  }

  return value || fallback || key;
}

export const languages = [
  { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
  { code: 'mg' as Language, name: 'Malagasy', flag: '🇲🇬' },
  { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
  { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
  { code: 'de' as Language, name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ch' as Language, name: '中文', flag: '🇨🇳' },
  { code: 'pt' as Language, name: 'Português', flag: '🇵🇹' },
  { code: 'hi' as Language, name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ar' as Language, name: 'العربية', flag: '🇸🇦' },
  { code: 'it' as Language, name: 'Italiano', flag: '🇮🇹' },
];