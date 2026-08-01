/*
 * User settings, persisted in localStorage (not cookies: this is a front-end
 * only app, so there's no server that needs them, and localStorage avoids
 * sending the data on every request). Stored as one JSON blob under STORAGE_KEY
 * so new settings can be added over time without new storage keys.
 */
import { UiLanguage } from './i18n'
import { Language } from './days/Day'

export type Theme = 'system' | 'light' | 'dark'

export type Settings = {
	theme: Theme,
	// the interface language: the day names shown on the cards, the first-day
	// dropdown labels, the layout direction (RTL for Arabic) and every UI string.
	// Independent of the content (sound) language chosen in the toolbar.
	uiLanguage: UiLanguage,
	// language codes the user chose to hide from the main screen; empty = show
	// everything, so newly added languages are visible by default
	hiddenLanguages: Language[],
	// when on, all visible sounds are downloaded to the cache, and newly shown
	// languages are cached as soon as they are enabled
	flightMode: boolean,
	// day code ('1'..'7') the week starts on; the cards are shown in week order
	// rotated so this day leads (default '1' = Sunday)
	firstDay: string,
}

export const DEFAULT_SETTINGS: Settings = {
	theme: 'system',
	uiLanguage: 'en',
	hiddenLanguages: [],
	flightMode: false,
	firstDay: '1',
}

const STORAGE_KEY = 'week:settings'

// every content (sound) language a browser locale can match
const SPOKEN_LANGUAGES: Language[] = ['en', 'ar', 'de', 'sv', 'uk', 'he']
// the subset offered as interface languages (those with an i18n dictionary)
// map a BCP-47 tag to one of the interface languages, or null
function uiTagToCode(tag: string): UiLanguage | null {
	const primary = tag.toLowerCase().split('-')[0]
	return (UI_LANGUAGE_CODES as string[]).includes(primary) ? primary as UiLanguage : null
}

const UI_LANGUAGE_CODES: UiLanguage[] = ['en', 'ar', 'de', 'el', 'sv', 'th', 'tr', 'zh']

// map a BCP-47 tag (e.g. "en-US", "sv") to one of the given codes, or null
function tagToCode(tag: string, set: readonly Language[]): Language | null {
	const primary = tag.toLowerCase().split('-')[0]
	return (set as readonly string[]).includes(primary) ? primary as Language : null
}

// the browser's preferred content language, mapped to a supported code (falls back to English)
export function preferredLanguage(): Language {
	const tag = (typeof navigator !== 'undefined' && navigator.language) || ''
	return tagToCode(tag, SPOKEN_LANGUAGES) ?? 'en'
}

// the first-run interface language (restricted to the UI subset):
//   1) the browser's primary language, if a supported UI language
//   2) else the first of the browser's other languages that is a UI language
//   3) else the content-language pick if it is a UI language, else English
export function preferredUiLanguage(): UiLanguage {
	const primary = uiTagToCode((typeof navigator !== 'undefined' && navigator.language) || '')
	if (primary) return primary
	const tags = (typeof navigator !== 'undefined' && navigator.languages) || []
	for (const tag of tags) {
		const m = uiTagToCode(tag)
		if (m) return m
	}
	const content = preferredLanguage()
	return (UI_LANGUAGE_CODES as string[]).includes(content) ? content as UiLanguage : 'en'
}

// first-run settings: show only the browser's languages (navigator.languages) plus
// the preferred one; everything else starts hidden
function firstRunSettings(): Settings {
	const tags = (typeof navigator !== 'undefined' && navigator.languages) || []
	const visible = new Set<Language>(tags.map(t => tagToCode(t, SPOKEN_LANGUAGES)).filter(Boolean) as Language[])
	visible.add(preferredLanguage())
	const hiddenLanguages = SPOKEN_LANGUAGES.filter(code => !visible.has(code))
	return { ...DEFAULT_SETTINGS, uiLanguage: preferredUiLanguage(), hiddenLanguages }
}

export function loadSettings(): Settings {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (raw) {
			return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
		}
	} catch {
		// localStorage may be unavailable (e.g. private mode); fall back to defaults
	}
	// no saved settings: derive first-run visibility from the browser's languages
	return firstRunSettings()
}

export function saveSettings(settings: Settings): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
	} catch {
		// ignore: settings still apply for the current session
	}
}

// Drive the CSS `color-scheme` via the data-theme attribute on <html>.
export function applyTheme(theme: Theme): void {
	const root = document.documentElement
	if (theme === 'system') {
		root.removeAttribute('data-theme')
	} else {
		root.setAttribute('data-theme', theme)
	}
}
