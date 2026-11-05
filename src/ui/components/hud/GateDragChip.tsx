import { toolBus } from '../../../game/toolBus';

interface GateDragChipProps {
  /** Seret hanya boleh saat alat belum terkunci (simulasi belum dimulai). */
  editable: boolean;
}

/**
 * Chip yang diseret ke pintu aula di arena untuk memasang Gerbang Kartu
 * (semaphore). Hanya memancarkan event seret lewat toolBus; sasaran lepas dan
 * rentang gerbang ditentukan arena (game/gateDrag.ts). Mode klik slot di toolbox
 * tetap menjadi alternatif untuk touchpad dan aksesibilitas.
 */
export function GateDragChip({ editable }: GateDragChipProps) {
  return (
    <span
      draggable={editable}
      title="Seret ke pintu aula di arena (atau pakai klik slot)"
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', 'kartu-akses');
        event.dataTransfer.effectAllowed = 'copy';
        toolBus.emit('dragStart', { kind: 'semaphore' });
      }}
      onDragEnd={() => toolBus.emit('dragEnd', null)}
      className={`select-none rounded border border-teal-400 bg-navy-700 px-2 py-1 text-xs ${
        editable ? 'cursor-grab' : 'cursor-not-allowed opacity-50'
      }`}
    >
      Seret Kartu Akses
    </span>
  );
}