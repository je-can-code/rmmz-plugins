//region plugins/resources/_component/color-icon-text-manager-direct.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('ColorManager / IconManager / TextManager hcr extensions (resources core, direct src import)', () =>
{
  beforeEach(async () =>
  {
    vi.resetModules();

    // ColorManager is a bare host global; only textColor() is read by hpCostColor().
    globalThis.ColorManager = { textColor: vi.fn(index => `color-${index}`) };
    globalThis.IconManager = {};
    globalThis.TextManager = {};

    await import('../../../../src/plugins/resources/core/managers/ColorManager.js');
    await import('../../../../src/plugins/resources/core/managers/IconManager.js');
    await import('../../../../src/plugins/resources/core/managers/TextManager.js');
  });

  it('ColorManager.hpCostColor delegates to textColor(18)', () =>
  {
    expect(globalThis.ColorManager.hpCostColor()).toBe('color-18');
    expect(globalThis.ColorManager.textColor).toHaveBeenCalledWith(18);
  });

  it('IconManager.hcr returns the fixed icon index 964', () =>
  {
    expect(globalThis.IconManager.hcr()).toBe(964);
  });

  it('TextManager.hcr and hcrDescription return their fixed display text', () =>
  {
    expect(globalThis.TextManager.hcr()).toBe('Life Cost');
    expect(globalThis.TextManager.hcrDescription()).toEqual([
      'Percent reduction applied to HP skill costs.',
      'Higher values make life-cost skills cheaper to use.',
    ]);
  });
});
//endregion plugins/resources/_component/color-icon-text-manager-direct.test.js
