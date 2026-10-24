/**
 * Mengubah teks isian seed menjadi bilangan bulat tak negatif.
 * @returns angkanya, atau null bila isian kosong atau bukan bilangan bulat yang valid.
 */
export function parseSeed(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isSafeInteger(value) ? value : null;
}
