# Food Stars (Version 2)

A playful, parent-friendly web app for nutrition, hydration, and weekly meal planning for children (about ages 5–10). It combines onboarding, a nutrition-aware weekly planner, gamified daily tracking with stars and streaks, and a lightweight parent analytics view.

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Tech stack

- **Vite + React + TypeScript**
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **React Router** for navigation
- **Persistence**: `localStorage` by default, optional **Google Sheets** via **Google Apps Script** (free)

## Project layout

| Path | Role |
|------|------|
| `src/types/models.ts` | Domain types (profile, week plan, logs) — analytics-friendly |
| `src/data/foodDatabase.ts` | Tagged sample foods for rotation and balance |
| `src/engine/timetableEngine.ts` | Smart week/day/meal generation and swap suggestions |
| `src/services/sheetsClient.ts` | Optional Apps Script bridge + inline setup comments |
| `src/services/storageService.ts` | `localStorage` load/save + merge with remote |
| `src/context/AppDataContext.tsx` | App state, persistence side-effects |
| `src/components/**` | UI: onboarding, timetable, stars, analytics |
| `public/sample-profile.json` | Mock profile snippet for demos |

## Environment variables

Copy `.env.example` to `.env` and set:

- `VITE_GOOGLE_APPS_SCRIPT_URL` — your deployed Apps Script web app URL (optional).
- `VITE_GOOGLE_SHEET_ID` — optional; only sent to your script if you use it server-side.

If the URL is unset or requests fail, the app **falls back to local storage only**.

## Google Sheets + Apps Script (free backend)

1. Create a spreadsheet with tabs: **ChildProfile**, **WeeklyPlans**, **DailyLogs**, **Rewards** (and optionally **FoodDatabase**).
2. Create an Apps Script project bound to the sheet (or standalone) with a `doPost(e)` handler that parses JSON: `{ action, payload }`.
3. Return JSON with `ContentService` and allow CORS for your dev origin if needed (see comments in `src/services/sheetsClient.ts`).
4. Deploy as **Web app** → execute as you → access **Anyone** (or restrict and add auth later).
5. Put the deployment URL in `.env` as `VITE_GOOGLE_APPS_SCRIPT_URL`.

### Minimal script shape (outline)

```javascript
function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;
  const payload = body.payload || {};
  const out = { ok: true };

  if (action === 'ping') {
    out.pong = true;
  } else if (action === 'loadAll') {
    out.data = {
      profile: readJson_('ChildProfile'),
      currentWeekPlan: readJson_('WeeklyPlans'),
      dailyLogs: readLogsMap_('DailyLogs'),
      achievements: readJson_('Rewards'),
    };
  } else if (action === 'saveProfile') {
    writeJson_('ChildProfile', payload.profile);
  } else if (action === 'saveWeekPlan') {
    writeJson_('WeeklyPlans', payload.weekPlan);
  } else if (action === 'saveDailyLog') {
    upsertLog_('DailyLogs', payload.date, payload.dailyLog);
  } else if (action === 'saveAchievements') {
    writeJson_('Rewards', payload.achievements);
  }

  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/** Implement readJson_/writeJson_/upsertLog_* with your sheet rows. */
```

Map sheet rows however you prefer; the app only needs the JSON shapes in `src/types/models.ts`.

## Features (v2)

- **Onboarding**: child profile, favorites, dislikes, diet type, water goal, school rhythm.
- **Planner**: weekly grid, per-meal regenerate, full-day / full-week regenerate, swap with suggestions.
- **Today’s Stars**: day picker (current plan week), meal check-offs, water (+250 / +500 ml), stars, streak, optional sounds.
- **Analytics**: stars/day, water/day, completion %, skipped slots, fruit diversity for the current plan, achievements.

## Star rules (positive only)

Defined in `src/utils/stars.ts`: breakfast and both snacks and lunch = **1** star each when completed, dinner = **2**, water goal = **2**, all meals completed = **bonus** stars. Nothing is taken away for “missing” items.

## Clearing data

Remove the browser key `tanvi_food_stars_v2` in DevTools → Application → Local Storage, or use a fresh browser profile.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## License

Private / project use — adjust as needed for your family or product.
