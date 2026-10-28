import type { DragEventHandler, ReactNode } from 'react';

interface PlayLayoutProps {
  /** Kanvas Phaser; mengisi seluruh layar di lapisan paling bawah. */
  canvas: ReactNode;
  topLeft?: ReactNode;
  topRight?: ReactNode;
  bottomLeft?: ReactNode;
  bottomCenter?: ReactNode;
  bottomRight?: ReactNode;
  /** Dialog (mis. ResultDialog); dirender paling akhir agar di atas HUD. */
  overlay?: ReactNode;
  /** Seret-lepas alat ke arena (U-061); diteruskan oleh PlayScreen. */
  onDragOver?: DragEventHandler<HTMLDivElement>;
  onDrop?: DragEventHandler<HTMLDivElement>;
}

type SlotName =
  'top-left' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

const hasContent = (node: ReactNode): boolean =>
  node !== undefined && node !== null && node !== false;

interface CellProps {
  name: SlotName;
  justify: string;
  children: ReactNode;
}

/**
 * Satu sel tata letak. Selnya tembus klik (mewarisi pointer-events-none dari
 * lapisan HUD) dan hanya isinya yang menangkap klik, supaya area kosong tetap
 * meneruskan masukan ke kanvas (penting untuk seret-lepas di U-061).
 */
function Cell({ name, justify, children }: CellProps) {
  return (
    <div className={`flex ${justify}`}>
      {hasContent(children) && (
        <div data-hud-slot={name} className="pointer-events-auto">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Kerangka layar Arena (PRD 17.1): kanvas memenuhi layar, HUD React ditumpuk
 * di atasnya pada lima posisi tetap. Tidak mengenal Phaser maupun controller.
 */
export function PlayLayout({
  canvas,
  topLeft,
  topRight,
  bottomLeft,
  bottomCenter,
  bottomRight,
  overlay,
  onDragOver,
  onDrop,
}: PlayLayoutProps) {
  return (
    <div
      className="relative h-screen w-full overflow-hidden bg-navy-900 text-ink-100"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div data-hud-slot="canvas" className="absolute inset-0">
        {canvas}
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3">
        <div className="flex items-start justify-between gap-3">
          <Cell name="top-left" justify="justify-start">
            {topLeft}
          </Cell>
          <Cell name="top-right" justify="justify-end">
            {topRight}
          </Cell>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
          <Cell name="bottom-left" justify="justify-start">
            {bottomLeft}
          </Cell>
          <Cell name="bottom-center" justify="justify-center">
            {bottomCenter}
          </Cell>
          <Cell name="bottom-right" justify="justify-end">
            {bottomRight}
          </Cell>
        </div>
      </div>

      {overlay}
    </div>
  );
}
