import { GameObjects, Scene } from 'phaser';
import type { MutexSnapshot, ThreadId } from '../../engine/types';
import {
  COLORS,
  DOOR_PANEL,
  DOOR_STYLE,
  TEXT_STYLE,
  TILE_SIZE,
  TILE_TEXT_STYLE,
} from '../theme';

/** Letak satu gerbang: titik tengah batang pada tepi kanan ubin LOCK. */
export interface DoorGate {
  x: number;
  y: number;
}

/** Cara mengubah id thread menjadi nama tampilan (mis. 'A' -> 'Robot A'). */
export type NameOf = (id: ThreadId) => string;

interface GateView {
  bar: GameObjects.Rectangle;
  label: GameObjects.Text;
}

/**
 * Tampilan satu pintu kunci (mutex).
 *
 * - Gerbang: batang tipis di tepi kanan tiap ubin LOCK. Robot yang menunggu
 *   mutex berhenti di ubin LOCK, jadi ia terlihat menunggu tepat di depan pintu.
 * - Panel: status pintu, pemegangnya, dan antreannya, di sisi kanan arena.
 *
 * Warna (hijau/merah) selalu disertai label teks BEBAS/TERKUNCI. View ini
 * hanya menggambar MutexSnapshot; siapa yang memegang dan mengantre
 * ditentukan oleh engine.
 */
export class DoorView {
  readonly mutexId: string;
  private readonly gates: GateView[];
  private readonly panel: GameObjects.Rectangle;
  private readonly panelText: GameObjects.Text;
  private readonly title: string;

  constructor(
    scene: Scene,
    mutex: MutexSnapshot,
    title: string,
    gates: readonly DoorGate[],
    panelY: number,
    nameOf: NameOf,
  ) {
    this.mutexId = mutex.id;
    this.title = title;

    this.gates = gates.map((gate) => ({
      bar: scene.add.rectangle(
        gate.x,
        gate.y,
        8,
        TILE_SIZE - 8,
        DOOR_STYLE.free.color,
      ),
      label: scene.add
        .text(gate.x, gate.y - TILE_SIZE / 2 - 10, '', TILE_TEXT_STYLE)
        .setOrigin(0.5),
    }));

    this.panel = scene.add
      .rectangle(
        DOOR_PANEL.x,
        panelY,
        DOOR_PANEL.width,
        DOOR_PANEL.height,
        COLORS.tile,
      )
      .setStrokeStyle(3, DOOR_STYLE.free.color);
    this.panelText = scene.add
      .text(DOOR_PANEL.x, panelY, '', {
        ...TEXT_STYLE,
        wordWrap: { width: DOOR_PANEL.width - 16 },
      })
      .setOrigin(0.5);

    this.update(mutex, nameOf);
  }

  /** Menyesuaikan warna dan teks dengan keadaan mutex pada snapshot. */
  update(mutex: MutexSnapshot, nameOf: NameOf): void {
    const locked = mutex.owner !== null;
    const style = locked ? DOOR_STYLE.locked : DOOR_STYLE.free;

    for (const gate of this.gates) {
      gate.bar.setFillStyle(style.color);
      gate.label.setText(style.label);
    }

    this.panel.setStrokeStyle(3, style.color);
    const lines = [`Pintu Kunci: ${this.title}`, style.label];
    if (mutex.owner !== null) lines.push(`Dipegang: ${nameOf(mutex.owner)}`);
    if (mutex.queue.length > 0)
      lines.push(`Antre: ${mutex.queue.map(nameOf).join(', ')}`);
    this.panelText.setText(lines.join('\n'));
  }

  destroy(): void {
    for (const gate of this.gates) {
      gate.bar.destroy();
      gate.label.destroy();
    }
    this.panel.destroy();
    this.panelText.destroy();
  }
}
