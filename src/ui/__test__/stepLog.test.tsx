import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StepLogView } from '../components/StepLog';
import type { LogEntry } from '../eventLog';

const entry = (id: number, tick: number, kind: LogEntry['kind'], text: string, minor = false): LogEntry => ({
  id,
  tick,
  kind,
  text,
  minor,
});

describe('StepLogView', () => {
  it('kosong: menampilkan petunjuk', () => {
    const html = renderToStaticMarkup(<StepLogView entries={[]} />);
    expect(html).toContain('Belum ada kejadian');
    expect(html).not.toContain('<ol');
  });

  it('terbaru di atas', () => {
    const html = renderToStaticMarkup(
      <StepLogView
        entries={[
          entry(1, 1, 'instruction', 'Robot A menjalankan WORK'),
          entry(2, 2, 'lock', 'Robot A memegang kunci pintu "papan"'),
          entry(3, 3, 'blocked', 'Robot B menunggu (mutex:papan)'),
        ]}
      />,
    );
    const iNew = html.indexOf('Robot B menunggu');
    const iMid = html.indexOf('Robot A memegang');
    const iOld = html.indexOf('Robot A menjalankan WORK');
    expect(iNew).toBeGreaterThan(-1);
    expect(iNew).toBeLessThan(iMid);
    expect(iMid).toBeLessThan(iOld);
    expect(html).toContain('t3');
  });

  it('perpindahan READY/RUNNING (minor) disembunyikan secara default, kejadian lain tetap tampil', () => {
    const html = renderToStaticMarkup(
      <StepLogView
        entries={[
          entry(1, 1, 'state', 'Robot A: READY → RUNNING', true),
          entry(2, 1, 'state', 'Robot B: RUNNING → WAITING'),
        ]}
      />,
    );
    expect(html).not.toContain('READY → RUNNING');
    expect(html).toContain('RUNNING → WAITING');
    expect(html).toContain('Tampilkan perpindahan READY/RUNNING');
  });

  it('hanya 100 baris terbaru yang digambar', () => {
    const many = Array.from({ length: 150 }, (_, i) => entry(i + 1, i + 1, 'instruction', `kejadian-${i + 1}`));
    const html = renderToStaticMarkup(<StepLogView entries={many} />);
    expect(html.match(/<li /g)).toHaveLength(100);
    expect(html).toContain('kejadian-150>'.replace('>', '<'));
    expect(html).not.toContain('kejadian-50<');
  });
});