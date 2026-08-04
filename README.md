> [!IMPORTANT]
> **This repository has moved.**
>
> Week now lives in the [**sawt**](https://github.com/amerharb/sawt)
> monorepo, at [`apps/week`](https://github.com/amerharb/sawt/tree/main/apps/week),
> alongside its four sister apps and a shared landing page.
>
> This repository is archived and read-only. It keeps the history up to the
> move; everything after it happens in `sawt`.

[![Version](https://img.shields.io/badge/version-0.18.0-blue.svg)](https://github.com/amerharb/week)
# Week

Small react project to show the days of the week (as numbered cards) and display
the day name in the selected language. Sister project of
[Flags](https://github.com/amerharb/flags) and
[Colors](https://github.com/amerharb/colors).

## Days supported
- Sunday `1`
- Monday `2`
- Tuesday `3`
- Wednesday `4`
- Thursday `5`
- Friday `6`
- Saturday `7`

Days are numbered 1–7 starting on Sunday; the number is the card face and the
sound file name.

## Languages supported
Spoken (what you hear and guess):
- English
- Arabic
- German
- Swedish
- Ukrainian
- Hebrew

The interface is separately available in eight languages: English, Arabic,
German, Greek, Swedish, Thai, Turkish and Simplified Chinese.

## How it works
One dropdown in the top right picks the **sound language** — what is spoken when
you click a card (and what you guess in the game), plus the name written under
the cards on click.

The day names on the cards follow the **interface language** instead, chosen in
settings (👁️). So you can read the days in English while hearing and learning
them in German. Click a day card to hear its name and see it written below;
click the card again (▶ while it plays) to stop. If every sound language is
hidden, no sound plays.

When the interface language is right-to-left (Arabic), the day cards are laid
out right-to-left as well, so the week reads in that language's direction — the
first day of the week on the right.

- Mute (🔊/🔇, right of 🕹️): silences everything — names, game prompts and
  feedback sounds — until clicked again.
- Settings (⚙️ top right): theme (system / light / dark, system is the default),
  a language checklist to show/hide languages (with ✅/⬜ select-all/deselect-all
  buttons), a "first day of the week" dropdown (📅) that rotates the cards to
  start on the chosen day, a flight mode toggle (✈️), and cache info (🔊 count
  and a 🗑️ clear button). Saved in localStorage, remembered between visits.
- Flight mode (✈️): downloads all visible sounds into the browser's cache
  (IndexedDB) so they play offline; anything newly shown while it is on is
  downloaded right away. Turning it off keeps the cached files (🗑️ clears them).
- Game (🕹️ in the top bar): start a guessing game — a random day name is spoken
  in the sound language and you tap the matching card (which shows the display
  language) — 👍 correct, 👎 wrong. The cards stay in week order (they are not
  shuffled). Stuck? The give-up button (🤷‍♂️) reveals it and
  plays a give-up sound (tracked separately from mistakes). It runs through every
  day, with your progress (played,
  mistakes, give-ups, time) shown live in the app bar next to the round
  buttons. The prompted name is also written in the display segment (even
  while muted), and the 👂 button plays it again. When every day has been played the round is over — the clock
  freezes and the score stays — but game mode stays on: ⏹️ stops a round that is
  running and ▶️ starts the next, and pressing 🕹️ again leaves game mode. Theme, first day and flight mode stay changeable
  mid-game; the language list is locked, and the selected languages can be
  changed only between rounds (after ⏹️ or when a round finishes). Needs at
  least one language visible.
- First visit: the starting language and which languages are shown come from your
  browser's language settings.

## URL parameters
For a shareable/deep-linked view:
- `l` — which languages are shown, with the first one selected, e.g. `?l=en,ar`.

List order does not affect the on-screen order.

## How to contribute
### Media files
Each day has one sound file in AAC format per language, with the spoken day name.
Audio files live under `public/sound/lang/<lang>/<code>.aac`, for example
`public/sound/lang/en/1.aac` for Sunday in English (the `<code>` is the day's
number, 1–7).

### Coding
Week is an open source project built on Vite, React 19, TypeScript v6.x and npm.
All the code is Frontend, no backend needed.

To add a day (already all seven, but for reference):
1. Create `src/days/<code>.ts` exporting a `Day` (`code`, `name`) with the name
   in every supported language.
2. Import it and add it to the `ALL_DAYS` array in `src/App.tsx`.
3. Drop the audio files at `public/sound/lang/<lang>/<code>.aac`.

To add a language:
1. Add its code to the `Language` type in `src/days/Day.ts` — TypeScript will then
   point out every day file missing the new name.
2. Add it to the `LANGUAGE_DEFS` array in `src/App.tsx` and to `SPOKEN_LANGUAGES`
   in `src/settingsStore.ts`.
3. Drop the audio files at `public/sound/lang/<lang>/<code>.aac`.

#### Setup environment
- Node 20.19 or above
- npm 9.x or above
- Install `npm install`
- Build: `npm run build` (output in `dist/`)
- Start dev server: `npm start`
- Preview production build: `npm run preview`

## Credits
### For sound
Day name pronunciations synthesized with Microsoft Edge neural text-to-speech
voices: English (Ava), Arabic (Amany), German (Katja), Swedish (Sofie),
Ukrainian (Polina) and Hebrew (Hila).
The game's correct/wrong/give-up feedback sounds are shared with the
[Colors](https://github.com/amerharb/colors) and
[Flags](https://github.com/amerharb/flags) sister projects.
