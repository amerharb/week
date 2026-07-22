# Changelog

## [0.16.0] 2026-07-20
### Added
- Localize the interface: all UI text (button tooltips, the "select a language
  and day to play" hint, settings labels, game score/actions) now lives in
  `src/i18n/*.json` and follows the selected display language (English, Arabic,
  German, Swedish translated; others fall back to English)
### Changed
- In game mode with the round stopped (finished or ✋), the selected language
  can be changed again — the next 🔄 round uses it. It stays locked while a
  round is running, and showing or hiding languages/items in settings stays
  locked for the whole game mode
- Internal refactor (no behaviour change): App.tsx is split into focused
  modules shared verbatim with the sister projects — `useAudio` (playback,
  mute, feedback sounds), `useGame` (the round state machine), `GameHud` (the
  score and action segments) and `useFitText` (the display shrink-to-fit) —
  cutting App.tsx from ~615 to ~360 lines

## 0.15.0
### Fixed
- Pressed and selected controls are now clearly visible in dark mode: a new
  shared `--active-bg` accent (the steel blue Flags already used) backs the
  game and mute toggles, the open settings gear, selected segments and the
  flight-mode toggle. They previously used `--surface-hover`, which in dark
  mode is nearly identical to the normal button background
### Added
- Add a mute toggle (🔊/🔇) in the toolbar, right of the game button: while
  muted nothing plays — names, game prompts or feedback sounds — and whatever
  is playing at that moment stops
- During a round, the prompted day's name is written in the display
  segment (muted or not), so the game can also be played by reading
- Add a replay button (👂) to the game actions: plays the current prompt
  again; disabled while muted or between rounds
- Add `vercel.json` (framework Vite, output directory `dist`) so the Vercel
  deployment configuration is explicit and versioned, like the sister project
  Arqaam
### Changed
- Change the game toggle emoji from 🎮 to 🕹️ (the classic joystick)
- Restructure the top of the app into one sticky app bar with four segments,
  right-to-left: toolbar (🕹️ game, 🔊 mute, language, ⚙️ settings), display
  (the spoken name), live game score (🏁 played 👎 mistakes 🤷‍♂️ give-ups
  ⏱️ time, ticking every second) and game actions. The game segments anchor
  to the left, the toolbar to the right, and the display stretches between
  them — a long name first shrinks its font (down to a limit) and only then
  auto-scrolls back and forth. The game segments only appear in game mode,
  unfolding with a smooth transition; on narrow screens the bar stacks the
  segments top-to-bottom in the same order, with the display on a full row
- The game no longer ends by itself: when every day has been played the
  round is over — the clock freezes and the score stays — but game mode
  stays on. New round actions sit next to the give-up button (🤷‍♂️): stop
  (✋) ends the current round early and restart (🔄) starts a fresh one;
  clicking 🕹️ again leaves game mode and hides the game score and actions
- In the game result, show the mistakes count with 👎 instead of ❌, matching
  the marker shown on a wrong guess
- Redraw the favicon in the sister projects' shared flat style: a flat
  calendar page with a red header, binder rings and a bold 7 (for the seven
  days), replacing the old white-and-blue outline calendar

## 0.14.0
- Initial release, versioned 0.14.0 to align with the sister projects
  [Colors](https://github.com/amerharb/colors) and
  [Flags](https://github.com/amerharb/flags).
### Added
- Days of the week as cards (1–7, starting on Sunday). Click a card to hear its
  name spoken and see it written; click again (▶ while it plays) to stop.
- Two independent language dropdowns in the top right: a display language (👁️)
  that sets the day name shown on each card (falling back to the plain day number
  1–7 when no language is visible), and a sound language (🗣️) that sets what is
  spoken on click / in the game and the name written under the cards. They can be
  the same or different (e.g. read the days in English while hearing German).
- When the display language is right-to-left (Arabic), the day cards are laid out
  right-to-left too, so the week reads in the language's direction (the first day
  on the right).
- Languages: English, Arabic, German and Swedish (spoken day names as AAC files
  under `public/sound/lang/`).
- Settings (⚙️): theme (system / light / dark, system is the default), plus a
  language show/hide checklist (with ✅/⬜ select-all/deselect-all buttons),
  persisted in localStorage.
- A "first day of the week" dropdown (📅): pick which day the week starts on and
  the seven cards rotate to lead with it (default Sunday). The days are always
  in week order.
- Support a URL parameter for a shareable view: `l` sets which languages are
  shown with the first one selected (e.g. `?l=en,ar`). List order does not
  affect the on-screen order.
- Flight mode (✈️): caches all visible sound files in the browser (IndexedDB, so
  it also works in Safari Lockdown Mode) for offline playback, with a cache count
  (🔊) and clear button (🗑️); newly shown languages are cached immediately,
  and turning it off keeps the cached files.
- Game mode (🎮): a random day name is spoken and you tap the matching card
  (👍 correct, 👎 wrong). The cards stay in week order (they are not shuffled).
  A wrong card is temporarily disabled with a 👎 marker until you find the
  correct one. The give-up button (🤷‍♂️) reveals the current day, marks it 🤷‍♂️
  and plays a give-up sound (tracked separately from mistakes). Runs through
  every day, then shows played / mistakes / give-ups / time. The language list
  locks during a game; theme, first day and flight mode stay changeable. Prompt
  sounds are pre-loaded so gameplay never waits on the network.
- On first visit, the starting language and which languages are shown come from
  the browser's language settings (navigator.language / navigator.languages).
