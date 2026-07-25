//region plugins/abs/ext/shield/managers/text-manager.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-ABS-Shield TextManager (unit, no downstream dependencies)', () =>
{
  beforeAll(async () =>
  {
    globalThis.TextManager = {};
    await import('../../../../../../src/plugins/abs/ext/shield/managers/TextManager.js');
  });

  it('sar returns the shield amp label', () =>
  {
    expect(globalThis.TextManager.sar()).toBe('Shield Amp');
  });

  it('sarDescription returns two help lines', () =>
  {
    expect(globalThis.TextManager.sarDescription()).toHaveLength(2);
  });

  it('ser returns the shield efficiency label', () =>
  {
    expect(globalThis.TextManager.ser()).toBe('Shield Eff');
  });

  it('serDescription returns two help lines', () =>
  {
    expect(globalThis.TextManager.serDescription()).toHaveLength(2);
  });
});
//endregion plugins/abs/ext/shield/managers/text-manager.test.js
