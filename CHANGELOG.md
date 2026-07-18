# Changelog

## 0.14.0
- Initial release, versioned 0.14.0 to align with the sister projects
  [Colors](https://github.com/amerharb/colors) and
  [Flags](https://github.com/amerharb/flags).
### Added
- Days of the week as numbered cards (1–7, starting on Sunday). Click a card to
  hear its name spoken and see it written in the selected language; click again
  (▶ while it plays) to stop.
- Languages: English, Arabic, German and Swedish, with a language dropdown in the
  top right (spoken day names as AAC files under `public/sound/lang/`).
- Settings (⚙️): theme (system / light / dark, system is the default), plus
  language and day show/hide checklists (with ✅/⬜ select-all/deselect-all
  buttons), persisted in localStorage.
- A day sort setting (⇵): by week order (📅, default), by the selected language's
  names (🗣️, so switching language re-sorts; falls back to week order when no
  language is selected), or random (🎲, reshuffles every time you choose it). The
  random order covers hidden days too, so each keeps its slot when shown.
- Support URL parameters for a shareable view: `d` sets which days are shown
  (e.g. `?d=1,2,3`) and `l` sets which languages are shown with the first one
  selected (e.g. `?l=en,ar`). List order does not affect the on-screen order.
- Flight mode (✈️): caches all visible sound files in the browser (IndexedDB, so
  it also works in Safari Lockdown Mode) for offline playback, with a cache count
  (🔊) and clear button (🗑️); newly shown languages/days are cached immediately,
  and turning it off keeps the cached files.
- Game mode (🎮): a random day name is spoken and you tap the matching card
  (👍 correct, 👎 wrong). A wrong card is temporarily disabled with a 👎 marker
  until you find the correct one. The give-up button (🤷‍♂️) reveals the current
  day, marks it 🤷‍♂️ and plays a give-up sound (tracked separately from
  mistakes). Runs through every visible day, then shows played / mistakes /
  give-ups / time. Language and day lists lock during a game; theme and flight
  mode stay changeable. Prompt sounds are pre-loaded so gameplay never waits on
  the network.
- On first visit, the starting language and which languages are shown come from
  the browser's language settings (navigator.language / navigator.languages).
