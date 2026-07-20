//region plugins/abs/core/managers/icon-manager.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-ABS IconManager augments (direct src import)', () =>
{
  beforeAll(async () =>
  {
    globalThis.IconManager = {};
    await import('../../../../../src/plugins/abs/core/managers/IconManager.js');
  });

  it('cdr returns the icon index for the cooldown rate parameter', () =>
  {
    expect(globalThis.IconManager.cdr()).toBe(962);
  });

  it('per returns the icon index for the parry extension rate parameter', () =>
  {
    expect(globalThis.IconManager.per()).toBe(962);
  });
});
//endregion plugins/abs/core/managers/icon-manager.test.js
