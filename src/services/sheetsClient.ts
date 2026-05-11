/**
 * Google Sheets / Apps Script bridge (optional remote persistence).
 *
 * ---------------------------------------------------------------------------
 * HOW TO CONNECT GOOGLE SHEETS (free, no paid APIs)
 * ---------------------------------------------------------------------------
 *
 * 1) Create a Google Spreadsheet with tabs named exactly:
 *    - ChildProfile
 *    - WeeklyPlans
 *    - DailyLogs
 *    - Rewards
 *    - FoodDatabase   (optional mirror; app ships its own DB but you can sync)
 *
 * 2) Extensions → Apps Script → paste a script that implements `doPost(e)`
 *    returning JSON and sets:
 *      ContentService.createTextOutput(JSON.stringify(obj))
 *        .setMimeType(ContentService.MimeType.JSON);
 *
 *    For CORS from localhost / your domain, include:
 *      function doOptions() {
 *        return ContentService.createTextOutput('')
 *          .setMimeType(ContentService.MimeType.TEXT)
 *          .setHeaders({
 *            'Access-Control-Allow-Origin': '*',
 *            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
 *            'Access-Control-Allow-Headers': 'Content-Type',
 *          });
 *      }
 *
 * 3) Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone (or Anyone with Google account — then your fetch must send auth)
 *
 * 4) Copy the Web App URL and put it in `.env`:
 *      VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfyc.../exec
 *
 * 5) Optional: set spreadsheet id for server-side logging only:
 *      VITE_GOOGLE_SHEET_ID=<your sheet id from the URL>
 *    (The browser does not read the Sheet directly — only your script does.)
 *
 * This client sends `{ action, payload }` JSON. Map actions in Apps Script to
 * read/write the appropriate tab rows. See README for a minimal script outline.
 *
 * If `VITE_GOOGLE_APPS_SCRIPT_URL` is unset or a request fails, the app uses
 * localStorage only (see `storageService.ts`).
 */

export type SheetAction =
  | 'ping'
  | 'loadAll'
  | 'saveProfile'
  | 'saveWeekPlan'
  | 'saveDailyLog'
  | 'saveAchievements'

export interface SheetPayload {
  /** Spreadsheet id if your script requires it (optional). */
  sheetId?: string
  profile?: unknown
  weekPlan?: unknown
  dailyLog?: unknown
  date?: string
  achievements?: unknown
}

const getUrl = (): string | undefined => {
  const u = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL as string | undefined
  return u && u.startsWith('http') ? u : undefined
}

export async function sheetsRequest<T = unknown>(
  action: SheetAction,
  payload: SheetPayload = {},
): Promise<T | null> {
  const url = getUrl()
  if (!url) return null

  try {
    const res = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export function isSheetsConfigured(): boolean {
  return Boolean(getUrl())
}
