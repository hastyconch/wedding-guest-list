/**
 * Accepts a raw spreadsheet ID or a full Google Sheets URL and returns the ID.
 * @see https://developers.google.com/sheets/api/guides/concepts#spreadsheet_id
 */
export function normalizeSpreadsheetId(input: string): string {
  const trimmed = input.trim()
  const fromUrl = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/.exec(trimmed)
  if (fromUrl?.[1]) return fromUrl[1]
  return trimmed
}
