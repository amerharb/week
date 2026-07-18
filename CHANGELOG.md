# Changelog

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
