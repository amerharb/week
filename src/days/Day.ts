import { UiLanguage } from '../i18n'

// the languages the day names are *spoken* in
export type Language = 'en' | 'ar' | 'de' | 'sv' | 'uk' | 'he'

export type Day = {
    // '1'..'7', Sunday = 1 … Saturday = 7 (used as the sound file name and the card face)
    code: string,
    // the card face follows the interface language, so a name is required for
    // every UI language; content languages that aren't UI languages are optional
    name: Record<UiLanguage, string> & Partial<Record<Language, string>>,
    // when true, only shown in development / beta builds, hidden in production
    beta?: boolean,
}
