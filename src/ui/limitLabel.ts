// Penanda batas untuk parameter angka. Dipisah dari komponen agar bisa dites
// dan agar angka yang mentok tidak hanya dibedakan lewat warna tombol.
export function limitLabel(
  value: number,
  min: number,
  max: number,
): '' | 'MIN' | 'MAKS' {
  if (value <= min) return 'MIN';
  if (value >= max) return 'MAKS';
  return '';
}
