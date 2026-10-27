import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PauseMenu } from '../components/hud/PauseMenu';
import { StatusLegend } from '../components/hud/StatusLegend';
import { ROBOT_STATES } from '../guideContent';

const noop = (): void => {};

describe('StatusLegend', () => {
  it('memuat setiap status beserta artinya', () => {
    const html = renderToStaticMarkup(<StatusLegend />);
    for (const info of ROBOT_STATES) {
      expect(html).toContain(info.state);
    }
    expect(html).toContain('Arti status robot');
  });

  it('tertutup secara default', () => {
    const html = renderToStaticMarkup(<StatusLegend />);
    expect(html).not.toMatch(/<details[^>]*\sopen=""/);
  });

  it('tersedia di dalam Menu Jeda', () => {
    const html = renderToStaticMarkup(
      <PauseMenu
        onResume={noop}
        onRestart={noop}
        onMap={noop}
        onSettings={noop}
      />,
    );
    expect(html).toContain('Arti status robot');
  });
});
