export interface ToolboxTab {
  id: string;
  label: string;
}

/**
 * Memilih tab aktif. Bila pilihan pemain tidak ada lagi (mis. level berganti),
 * jatuh ke tab pertama; tanpa tab mengembalikan null.
 */
export function resolveActiveTab(
  tabs: readonly ToolboxTab[],
  selected: string | null,
): string | null {
  if (tabs.length === 0) return null;
  if (selected !== null && tabs.some((tab) => tab.id === selected)) {
    return selected;
  }
  return tabs[0]?.id ?? null;
}