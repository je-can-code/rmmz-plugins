//region plugins/resources/_component/abs-icon-text-manager-direct.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('IconManager / TextManager drain-stat extensions (resources ext/abs, direct src import)', () =>
{
  beforeEach(async () =>
  {
    vi.resetModules();

    globalThis.IconManager = {};
    globalThis.TextManager = {};

    await import('../../../../src/plugins/resources/ext/abs/managers/IconManager.js');
    await import('../../../../src/plugins/resources/ext/abs/managers/TextManager.js');
  });

  it('IconManager exposes fixed icon indices for lst/mst/tst', () =>
  {
    expect(globalThis.IconManager.lst()).toBe(928);
    expect(globalThis.IconManager.mst()).toBe(929);
    expect(globalThis.IconManager.tst()).toBe(930);
  });

  it('TextManager exposes fixed labels and descriptions for lst/mst/tst', () =>
  {
    expect(globalThis.TextManager.lst()).toBe('Lifesteal');
    expect(globalThis.TextManager.mst()).toBe('Magisteal');
    expect(globalThis.TextManager.tst()).toBe('Techsteal');

    expect(globalThis.TextManager.lstDescription()).toEqual([
      'Percent of HP damage dealt recovered as HP on a successful hit.',
      'Stacks with on-attack skill resource tags.',
    ]);
    expect(globalThis.TextManager.mstDescription()).toEqual([
      'Percent of HP damage dealt recovered as MP on a successful hit.',
      'Stacks with on-attack skill resource tags.',
    ]);
    expect(globalThis.TextManager.tstDescription()).toEqual([
      'Percent of HP damage dealt recovered as TP on a successful hit.',
      'Stacks with on-attack skill resource tags.',
    ]);
  });
});
//endregion plugins/resources/_component/abs-icon-text-manager-direct.test.js
