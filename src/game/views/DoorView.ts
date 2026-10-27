import { GameObjects, Scene } from 'phaser';
import type { MutexSnapshot, ThreadId } from '../../engine/types';
import type { DoorSpan } from '../doorSpans';
import { pointAt, type SampledPath } from '../pathMath';
import {
  COLORS,
  DEPTH,
  DOOR_GEOMETRY,
  DOOR_PANEL,
  DOOR_STYLE,
  ROAD,
  TEXT_STYLE,
  TILE_TEXT_STYLE,
} from '../theme';

/** Cara mengubah id thread menjadi nama tampilan (mis. 'A' -> 'Robot A'). */
export type NameOf = (id: ThreadId) => string;

interface GateView {
  kind: 'entry' | 'exit';
  bar: GameObjects.Rectangle;
  label: GameObjects.Text;
}

/**
 * Tampilan satu pintu kunci (mutex): pintu masuk (LOCK) dan pintu keluar
 * (UNLOCK) berupa batang melintang di jalan, segmen terlindungi di antaranya
 * diwarnai, plus panel status (pemegang dan antrean) di sisi kanan arena.
 *
 * Warna (hijau/merah) selalu disertai label teks BEBAS/TERKUNCI. View ini
 * hanya menggambar MutexSnapshot; siapa yang memegang dan mengantre
 * ditentukan oleh engine. Robot yang menunggu LOCK berhenti di pintu masuk
 * karena jangkarnya ada di sana (lihat anchors.ts).
 */
export class DoorView {
  readonly mutexId: string;
  private readonly path: SampledPath;
  private readonly spans: readonly DoorSpan[];
  private readonly title: string;
  private readonly segments: GameObjects.Graphics;
  private readonly locks: GameObjects.Graphics;
  private readonly gates: GateView[] = [];
  private readonly panel: GameObjects.Rectangle;
  private readonly panelText: GameObjects.Text;

  constructor(
    scene: Scene,
    mutex: MutexSnapshot,
    title: string,
    path: SampledPath,
    spans: readonly DoorSpan[],
    panelY: number,
    nameOf: NameOf,
  ) {
    this.mutexId = mutex.id;
    this.title = title;
    this.path = path;
    this.spans = spans;

    this.segments = scene.add.graphics().setDepth(DEPTH.segment);
    this.locks = scene.add.graphics().setDepth(DEPTH.lock);
    for (const span of spans) {
      this.gates.push(this.makeGate(scene, span.entry, 'entry'));
      this.gates.push(this.makeGate(scene, span.exit, 'exit'));
    }

    this.panel = scene.add
      .rectangle(
        DOOR_PANEL.x,
        panelY,
        DOOR_PANEL.width,
        DOOR_PANEL.height,
        COLORS.tile,
      )
      .setStrokeStyle(DOOR_GEOMETRY.panelStroke, DOOR_STYLE.free.color);
    this.panelText = scene.add
      .text(DOOR_PANEL.x, panelY, '', {
        ...TEXT_STYLE,
        wordWrap: { width: DOOR_PANEL.width - DOOR_PANEL.padding },
      })
      .setOrigin(0.5);

    this.update(mutex, nameOf);
  }

  /** Menyesuaikan warna dan teks dengan keadaan mutex pada snapshot. */
  update(mutex: MutexSnapshot, nameOf: NameOf): void {
    const locked = mutex.owner !== null;
    const style = locked ? DOOR_STYLE.locked : DOOR_STYLE.free;

    this.drawSegments(style.color);
    for (const gate of this.gates) {
      gate.bar.setFillStyle(style.color);
      gate.label.setText(
        gate.kind === 'entry' ? `MASUK · ${style.label}` : 'KELUAR',
      );
    }

    this.panel.setStrokeStyle(DOOR_GEOMETRY.panelStroke, style.color);
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
    this.segments.destroy();
    this.locks.destroy();
    this.panel.destroy();
    this.panelText.destroy();
  }

  /** Batang melintang jalan di posisi `fraction`, label di atasnya, dan gembok. */
  private makeGate(
    scene: Scene,
    fraction: number,
    kind: GateView['kind'],
  ): GateView {
    const p = pointAt(this.path, fraction, 0);
    const bar = scene.add
      .rectangle(
        p.x,
        p.y,
        ROAD.width,
        DOOR_GEOMETRY.barThickness,
        DOOR_STYLE.free.color,
      )
      .setRotation(p.angle + Math.PI / 2)
      .setDepth(DEPTH.gate);
    const label = scene.add
      .text(
        p.x,
        p.y - ROAD.width / 2 - DOOR_GEOMETRY.labelGap,
        '',
        TILE_TEXT_STYLE,
      )
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.gate);
    this.drawLock(p.x, p.y);
    return { kind, bar, label };
  }

  /** Ikon gembok sederhana (badan + gagang) di tengah batang. */
  private drawLock(x: number, y: number): void {
    const size = DOOR_GEOMETRY.lockSize;
    const g = this.locks;
    g.fillStyle(COLORS.robotBorder, 1);
    g.fillRect(x - size / 2, y - size / 4, size, size * 0.7);
    g.lineStyle(2, COLORS.robotBorder, 1);
    g.beginPath();
    g.arc(x, y - size / 4, size * 0.3, Math.PI, Math.PI * 2);
    g.strokePath();
  }

  /** Mewarnai jalan dari pintu masuk sampai pintu keluar. */
  private drawSegments(color: number): void {
    const g = this.segments;
    const steps = DOOR_GEOMETRY.segmentSteps;
    g.clear();
    g.lineStyle(ROAD.width, color, DOOR_GEOMETRY.segmentAlpha);
    for (const span of this.spans) {
      g.beginPath();
      for (let i = 0; i <= steps; i++) {
        const f = span.entry + ((span.exit - span.entry) * i) / steps;
        const p = pointAt(this.path, f, 0);
        if (i === 0) g.moveTo(p.x, p.y);
        else g.lineTo(p.x, p.y);
      }
      g.strokePath();
    }
  }
}
