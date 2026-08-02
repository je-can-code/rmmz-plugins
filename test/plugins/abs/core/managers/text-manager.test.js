//region plugins/abs/core/managers/text-manager.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-ABS TextManager augments (direct src import)', () =>
{
  beforeAll(async () =>
  {
    globalThis.TextManager = {};
    await import('../../../../../src/plugins/abs/core/managers/TextManager.js');
  });

  it('cdr returns the display name for the cooldown rate parameter', () =>
  {
    expect(globalThis.TextManager.cdr()).toBe('Cooldown Rate');
  });

  it('cdrDescription returns the description lines for the cooldown rate parameter', () =>
  {
    expect(globalThis.TextManager.cdrDescription()).toEqual([
      'Reduces the duration of the global cooldown triggered after skill use.',
      'At 100, the global cooldown is eliminated entirely.',
    ]);
  });

  it('per returns the display name for the parry extension rate parameter', () =>
  {
    expect(globalThis.TextManager.per()).toBe('Grace');
  });

  it('perDescription returns the description lines for the parry extension rate parameter', () =>
  {
    expect(globalThis.TextManager.perDescription()).toEqual([
      'Extends the duration of the precise-parry window when raising guard.',
      'At 100, the parry window is doubled; stacks additively.',
    ]);
  });
});
//endregion plugins/abs/core/managers/text-manager.test.js
