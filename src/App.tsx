import './App.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'
import SettingsPanel from './SettingsPanel'
import { Day, Language } from './days/Day'
import { isVisible } from './featureFlags'
import {
	Settings,
	DEFAULT_SETTINGS,
	loadSettings,
	saveSettings,
	applyTheme,
	preferredLanguage,
} from './settingsStore'
import { getAudioBlob, ensureCached, idbCount, idbClear } from './audioCache'
import { sunday } from './days/1'
import { monday } from './days/2'
import { tuesday } from './days/3'
import { wednesday } from './days/4'
import { thursday } from './days/5'
import { friday } from './days/6'
import { saturday } from './days/7'

const randomOf = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)]

// Order the days in week order (by day number), rotated so `firstDay` leads —
// e.g. firstDay '2' (Monday) gives 2,3,4,5,6,7,1.
function orderDays(days: Day[], firstDay: string): Day[] {
	const sorted = days.slice().sort((a, b) => a.code.localeCompare(b.code))
	const start = sorted.findIndex(d => d.code === firstDay)
	if (start <= 0) return sorted // firstDay is the first day already (or not found)
	return [...sorted.slice(start), ...sorted.slice(0, start)]
}

// short win/lose feedback sounds
function playFx(name: 'correct' | 'wrong' | 'giveup') {
	try {
		new Audio(`/sound/fx/${name}.aac`).play().catch(() => {})
	} catch {
		// ignore
	}
}

function App() {
	// everything the build supports (after the beta feature flag)
	const ALL_DAYS: Day[] = [sunday, monday, tuesday, wednesday, thursday, friday, saturday].filter(isVisible)
	const LANGUAGE_DEFS: { code: Language, display: string, beta?: boolean }[] = [
		{ code: 'en', display: 'English' },
		{ code: 'ar', display: 'عربي' },
		{ code: 'de', display: 'Deutsch' },
		{ code: 'sv', display: 'Svenska' },
	]
	const ALL_LANGUAGES = LANGUAGE_DEFS.filter(isVisible)

	// the sound currently playing, so starting a new one can stop it first
	const playingAudio = useRef<HTMLAudioElement | null>(null)
	// code of the day whose sound is playing, to show the play icon on its card
	const [playingCode, setPlayingCode] = useState<string | null>(null)
	// true while flight-mode downloads are in progress, to show it on the toggle
	const [caching, setCaching] = useState(false)
	// how many sound files are currently in the cache, shown in settings
	const [cachedCount, setCachedCount] = useState(0)

	// pending "play the next prompt" timer during the game, so it can be cancelled
	// if the game ends (or is stopped) before it fires — otherwise a late timer
	// would start a sound after the game is already over
	const promptTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

	const stopSound = useCallback(() => {
		if (promptTimer.current) {
			clearTimeout(promptTimer.current)
			promptTimer.current = null
		}
		if (playingAudio.current) {
			playingAudio.current.pause()
			URL.revokeObjectURL(playingAudio.current.src)
			playingAudio.current = null
		}
		setPlayingCode(null)
	}, [])

	// user settings (theme + which languages/days to show on the main screen)
	const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
	useEffect(() => {
		let loaded = loadSettings()

		// URL param for a shareable/deep-linked view:
		//   ?l=en,ar   -> only these languages are visible; the first is selected
		// Order in the param does not affect the on-screen order.
		const params = new URLSearchParams(window.location.search)

		const lParam = params.get('l')
		if (lParam !== null) {
			const valid = new Set(ALL_LANGUAGES.map(l => l.code))
			const want = lParam.split(',').map(s => s.trim()).filter(c => valid.has(c as Language))
			const hiddenLanguages = ALL_LANGUAGES.map(l => l.code).filter(c => !want.includes(c))
			loaded = { ...loaded, hiddenLanguages }
			if (want.length > 0) setLang(want[0] as Language) // first listed = selected
		}

		setSettings(loaded)
		applyTheme(loaded.theme)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// language of the displayed and spoken day name; defaults to the browser's
	// preferred language on first load (the fallback effect below keeps it visible)
	const [lang, setLang] = useState<Language>(() => preferredLanguage())
	const [name, setName] = useState('')

	const refreshCacheCount = useCallback(async () => {
		try {
			setCachedCount(await idbCount())
		} catch {
			// leave the previous count
		}
	}, [])
	useEffect(() => {
		refreshCacheCount()
	}, [refreshCacheCount])

	// delete only the downloaded sound files (settings stay); not allowed in flight mode
	const clearSoundCache = useCallback(async () => {
		try {
			await idbClear()
		} catch {
			// ignore
		}
		setCachedCount(0)
	}, [])

	// Flight mode: download the given sounds into the cache, showing the busy state.
	const cacheAudioUrls = useCallback(async (audioUrls: string[]) => {
		setCaching(true)
		try {
			await ensureCached(audioUrls)
		} finally {
			setCaching(false)
			refreshCacheCount()
		}
	}, [refreshCacheCount])

	const updateSettings = (next: Settings) => {
		// stop playback when the selected language just got hidden —
		// otherwise the sound would keep playing with no card left to stop it
		if (next.hiddenLanguages.includes(lang)) {
			stopSound()
		}

		// flight mode: download the sounds for every visible language (all seven
		// days are always shown, so only the language set can change)
		const visibleLangs = ALL_LANGUAGES.filter(l => !next.hiddenLanguages.includes(l.code))
		const urlsFor = (langs: typeof visibleLangs) =>
			langs.flatMap(l => ALL_DAYS.map(d => `/sound/lang/${l.code}/${d.code}.aac`))
		if (next.flightMode && !settings.flightMode) {
			// just switched on: cache everything currently visible
			cacheAudioUrls(urlsFor(visibleLangs))
		} else if (next.flightMode) {
			// already on: cache only the languages that just became visible
			const newLangs = visibleLangs.filter(l => settings.hiddenLanguages.includes(l.code))
			if (newLangs.length > 0) {
				cacheAudioUrls(urlsFor(newLangs))
			}
		}

		setSettings(next)
		saveSettings(next)
		applyTheme(next.theme)
	}

	// choose which day the week starts on
	const setFirstDay = (code: string) => updateSettings({ ...settings, firstDay: code })

	const LANGUAGES = ALL_LANGUAGES.filter(l => !settings.hiddenLanguages.includes(l.code))
	// what the main screen shows: all seven days in week order, rotated to start
	// on the chosen first day
	const DAYS = orderDays(ALL_DAYS, settings.firstDay)

	// if the selected language gets hidden in settings, fall back to the first visible one
	useEffect(() => {
		if (LANGUAGES.length > 0 && !LANGUAGES.some(l => l.code === lang)) {
			setLang(LANGUAGES[0].code)
			setName('')
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [settings.hiddenLanguages])

	const playSound = useCallback(async (code: string) => {
		try {
			const blob = await getAudioBlob(`/sound/lang/${lang}/${code}.aac`)
			if (!blob) return
			const objectUrl = URL.createObjectURL(blob)
			if (playingAudio.current) {
				playingAudio.current.pause()
				URL.revokeObjectURL(playingAudio.current.src)
			}
			const audio = new Audio(objectUrl)
			audio.onended = () => {
				URL.revokeObjectURL(objectUrl)
				setPlayingCode(null)
			}
			playingAudio.current = audio
			await audio.play()
			setPlayingCode(code)
			refreshCacheCount() // playing may have added the file to the cache
		} catch (e) {
			console.error(e)
		}
	}, [lang, refreshCacheCount])

	// play a day sound without touching the play-icon UI (used by the game).
	// Reads from the cache (IndexedDB, works in Safari Lockdown) or the network.
	const playFile = useCallback(async (url: string) => {
		try {
			const blob = await getAudioBlob(url)
			if (!blob) return
			const objectUrl = URL.createObjectURL(blob)
			if (playingAudio.current) {
				playingAudio.current.pause()
				URL.revokeObjectURL(playingAudio.current.src)
			}
			const audio = new Audio(objectUrl)
			audio.onended = () => URL.revokeObjectURL(objectUrl)
			playingAudio.current = audio
			await audio.play()
		} catch (e) {
			console.error(e)
		}
	}, [])

	// ---- Game mode ----
	const [gameOn, setGameOn] = useState(false)
	const [gameDays, setGameDays] = useState<Day[]>([]) // the board for this game (days in week order)
	const [target, setTarget] = useState<string | null>(null)  // day code to find
	const [solved, setSolved] = useState<string[]>([])         // codes already played (guessed or given up)
	const [wrongGuesses, setWrongGuesses] = useState<string[]>([]) // wrong cards for the CURRENT target (temporarily disabled)
	const [mistakes, setMistakes] = useState(0)      // wrong taps this game
	const [giveUps, setGiveUps] = useState(0)        // days given up on this game
	const [gaveUpCodes, setGaveUpCodes] = useState<string[]>([]) // codes given up on, to mark them 🤷‍♂️
	const gameStart = useRef(0)                       // Date.now() when the game began
	const [result, setResult] = useState<{ played: number, total: number, mistakes: number, giveUps: number, ms: number } | null>(null)
	const [feedback, setFeedback] = useState<{ emoji: string, id: number } | null>(null)
	const feedbackId = useRef(0)
	const [preparing, setPreparing] = useState(false) // downloading game sounds before start

	const canPlayGame = LANGUAGES.length > 0 && DAYS.length > 0

	const formatDuration = (ms: number) => {
		const total = Math.round(ms / 1000)
		const m = Math.floor(total / 60)
		const s = total % 60
		return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`
	}

	const flashFeedback = (emoji: string) => {
		feedbackId.current += 1
		const id = feedbackId.current
		setFeedback({ emoji, id })
		setTimeout(() => setFeedback(f => (f && f.id === id ? null : f)), 700)
	}

	const startGame = async () => {
		if (!canPlayGame || preparing) return
		stopSound()
		// the board keeps the days in week order (no shuffle) — only the prompts are random
		const board = DAYS
		// pre-load every prompt sound before the game begins, so gameplay never waits
		// on the network (cached in IndexedDB, which also works in Safari Lockdown)
		setPreparing(true)
		await ensureCached(board.map(d => `/sound/lang/${lang}/${d.code}.aac`))
		refreshCacheCount()
		setPreparing(false)
		const first = randomOf(board)
		setGameDays(board)
		setSolved([])
		setWrongGuesses([])
		setMistakes(0)
		setGiveUps(0)
		setGaveUpCodes([])
		setResult(null)
		setName('')
		gameStart.current = Date.now()
		setTarget(first.code)
		setGameOn(true)
		playFile(`/sound/lang/${lang}/${first.code}.aac`)
	}

	const endGame = () => {
		stopSound()
		setGameOn(false)
		setTarget(null)
		setWrongGuesses([])
		setFeedback(null)
		// show the result for the days played so far
		setResult({
			played: solved.length,
			total: gameDays.length,
			mistakes,
			giveUps,
			ms: Date.now() - gameStart.current,
		})
	}

	// mark the target day played and move on (or finish). mistakesTotal and
	// giveUpsTotal are the running counts to record if this was the last day.
	const advance = (code: string, mistakesTotal: number, giveUpsTotal: number) => {
		// cancel any not-yet-fired next-prompt timer (e.g. the player answered the
		// last day before the previous prompt was scheduled to play)
		if (promptTimer.current) {
			clearTimeout(promptTimer.current)
			promptTimer.current = null
		}
		// reaching the correct answer re-enables the cards marked wrong this round
		setWrongGuesses([])
		const nextSolved = [...solved, code]
		setSolved(nextSolved)
		const remaining = gameDays.filter(d => !nextSolved.includes(d.code))
		if (remaining.length === 0) {
			// all visible days played — game over.
			stopSound()
			setGameOn(false)
			setTarget(null)
			setResult({
				played: nextSolved.length,
				total: gameDays.length,
				mistakes: mistakesTotal,
				giveUps: giveUpsTotal,
				ms: Date.now() - gameStart.current,
			})
		} else {
			const next = randomOf(remaining)
			setTarget(next.code)
			// let the feedback land before the next prompt
			promptTimer.current = setTimeout(() => playFile(`/sound/lang/${lang}/${next.code}.aac`), 650)
		}
	}

	const guessDay = (code: string) => {
		if (target === null || solved.includes(code) || wrongGuesses.includes(code)) return
		if (code === target) {
			playFx('correct')
			flashFeedback('👍')
			advance(code, mistakes, giveUps)
		} else {
			// temporarily disable this wrong card (with a 👎 marker) until the round is won
			setWrongGuesses(w => (w.includes(code) ? w : [...w, code]))
			setMistakes(m => m + 1)
			playFx('wrong')
			flashFeedback('👎')
		}
	}

	// give up on the current day: counts as played and as a give-up (not a mistake)
	const giveUp = () => {
		if (target === null) return
		const nextGiveUps = giveUps + 1
		setGiveUps(nextGiveUps)
		setGaveUpCodes(g => (g.includes(target) ? g : [...g, target]))
		playFx('giveup')
		flashFeedback('🤷‍♂️')
		advance(target, mistakes, nextGiveUps)
	}

	const board = gameOn ? gameDays : DAYS

	return (
		<div className="Week">
			<div className="top-controls">
				<button
					className={(gameOn ? 'game-toggle on' : 'game-toggle') + (preparing ? ' busy' : '')}
					aria-label={gameOn ? 'End game' : 'Start game'}
					aria-pressed={gameOn}
					title={
						gameOn
							? 'End game'
							: (canPlayGame ? 'Start game' : 'Select at least one language and day to play')
					}
					disabled={(!gameOn && !canPlayGame) || preparing}
					onClick={() => (gameOn ? endGame() : startGame())}
				>
					🎮
				</button>
				<select
					className="language-select"
					title="Language of the day name"
					value={lang}
					disabled={gameOn}
					onChange={(e) => {
						setLang(e.target.value as Language)
						setName('')
						stopSound()
					}}
				>
					{LANGUAGES.map(l => (
						<option key={`lang-${l.code}`} value={l.code}>{l.display}</option>
					))}
				</select>
				<SettingsPanel
					settings={settings}
					languages={ALL_LANGUAGES}
					dayOptions={orderDays(ALL_DAYS, '1').map(d => ({
						code: d.code,
						label: LANGUAGES.length > 0 ? d.name[lang] : `Day ${d.code}`,
					}))}
					caching={caching}
					cachedCount={cachedCount}
					locked={gameOn}
					onChange={updateSettings}
					onSetFirstDay={setFirstDay}
					onClearCache={clearSoundCache}
				/>
			</div>
			<hgroup>
				{board.map(d => {
					const isGivenUp = gameOn && gaveUpCodes.includes(d.code)
					const isSolved = gameOn && solved.includes(d.code) && !isGivenUp
					const isWrong = gameOn && wrongGuesses.includes(d.code)
					return (
						<button
							key={`day-${d.code}`}
							className={'button-day' + (playingCode === d.code ? ' playing' : '') + (isWrong ? ' wrong' : '')}
							title={gameOn ? '' : (LANGUAGES.length > 0 ? d.name[lang] : '🤷‍♂️')}
							disabled={isSolved || isGivenUp || isWrong}
							onClick={() => {
								if (gameOn) {
									guessDay(d.code)
								} else if (playingCode === d.code) {
									stopSound()
								} else if (LANGUAGES.length === 0) {
									// every language is hidden: nothing to say
									setName('🤷‍♂️')
								} else {
									setResult(null)
									setName(d.name[lang])
									playSound(d.code)
								}
							}}
						>
							<span className="day-number">{d.code}</span>
							{playingCode === d.code && <span className="play-icon">▶</span>}
							{isSolved && <span className="swatch-mark">👍</span>}
							{isGivenUp && <span className="swatch-mark">🤷‍♂️</span>}
							{isWrong && <span className="swatch-mark">👎</span>}
						</button>
					)
				})}
			</hgroup>
			<hgroup>
				{!gameOn && result ? (
					<div className="game-result">
						<span title="Days played">🏁 {result.played} / {result.total}</span>
						<span title="Mistakes">❌ {result.mistakes}</span>
						<span title="Give-ups">🤷‍♂️ {result.giveUps}</span>
						<span title="Time">⏱️ {formatDuration(result.ms)}</span>
					</div>
				) : (
					<h1>
						{preparing ? '⏳' : gameOn ? `${solved.length} / ${gameDays.length}` : name}
					</h1>
				)}
			</hgroup>
			{gameOn && (
				<button
					className="game-giveup"
					aria-label="Give up"
					title="Give up: reveal this one and move on"
					onClick={giveUp}
				>
					🤷‍♂️
				</button>
			)}
			{feedback && (
				<div key={feedback.id} className="game-feedback" aria-hidden="true">
					{feedback.emoji}
				</div>
			)}
			<Analytics/>
		</div>
	)
}

export default App
