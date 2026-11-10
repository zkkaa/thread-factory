import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { LevelNode } from '../levelMap';
import { LevelPedestal } from '../components/LevelPedestal';

function makeNode(overrides: Partial<LevelNode>): LevelNode {
  return {
    levelId: '1-5',
    title: 'Lini Gabungan',
    status: 'open',
    stars: 0,
    note: null,
    isNext: false,
    ...overrides,
  };
}

function render(node: LevelNode, selected: boolean): string {
  return renderToStaticMarkup(
    <LevelPedestal
      node={node}
      position={{ x: 50, y: 50 }}
      width={10}
      selected={selected}
      reduceMotion={false}
      onSelect={() => {}}
    />,
  );
}

describe('LevelPedestal: pin dan denyut', () => {
  it('pin muncul di level terpilih walau bukan level berikutnya', () => {
    const html = render(makeNode({ status: 'cleared', stars: 3 }), true);
    expect(html).toContain('Dipilih');
    expect(html).not.toContain('animate-pedestal-pulse');
  });

  it('level berikutnya yang tidak dipilih berdenyut tanpa pin', () => {
    const html = render(makeNode({ isNext: true }), false);
    expect(html).toContain('animate-pedestal-pulse');
    expect(html).not.toContain('Dipilih');
  });

  it('level berikutnya yang dipilih punya pin dan denyut', () => {
    const html = render(makeNode({ isNext: true }), true);
    expect(html).toContain('Dipilih');
    expect(html).toContain('animate-pedestal-pulse');
  });
});
