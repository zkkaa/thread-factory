/**
 * Mode debug arena: bila alamat halaman memuat `?debug`, view menggambar titik
 * layout di atas latar supaya koordinat mudah disetel dengan mata.
 * `search` bisa disuntik agar bisa dites di Node tanpa browser.
 */
export function isDebugArena(
  search: string = typeof location === 'undefined' ? '' : location.search,
): boolean {
  return new URLSearchParams(search).has('debug');
}