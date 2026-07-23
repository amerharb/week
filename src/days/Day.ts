export type Language = 'en' | 'ar' | 'de' | 'sv' | 'uk' | 'he'

export type Day = {
    // '1'..'7', Sunday = 1 … Saturday = 7 (used as the sound file name and the card face)
    code: string,
    name: Record<Language, string>,
    // when true, only shown in development / beta builds, hidden in production
    beta?: boolean,
}
