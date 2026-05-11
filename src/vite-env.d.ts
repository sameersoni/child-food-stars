/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Google Apps Script Web App URL for Sheet sync (optional). */
  readonly VITE_GOOGLE_APPS_SCRIPT_URL?: string
  /** Optional: echoed to your script for logging; not read from Sheets in-browser. */
  readonly VITE_GOOGLE_SHEET_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
