//region plugins/abs/ext/shield/managers/color-manager.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Shield ColorManager (unit, all downstream dependencies mocked)', () =>
{
  beforeAll(async () =>
  {
    globalThis.ColorManager = { textColor: vi.fn((id) => `color-${id}`) };
    await import('../../../../../../src/plugins/abs/ext/shield/managers/ColorManager.js');
  });

  it('shieldGauge1 reads text color 7', () =>
  {
    expect(globalThis.ColorManager.shieldGauge1()).toBe('color-7');
  });

  it('shieldGauge2 reads text color 8', () =>
  {
    expect(globalThis.ColorManager.shieldGauge2()).toBe('color-8');
  });
});
//endregion plugins/abs/ext/shield/managers/color-manager.test.js
