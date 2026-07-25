//region plugins/abs/ext/shield/managers/icon-manager.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-ABS-Shield IconManager (unit, no downstream dependencies)', () =>
{
  beforeAll(async () =>
  {
    globalThis.IconManager = {};
    await import('../../../../../../src/plugins/abs/ext/shield/managers/IconManager.js');
  });

  it('sar returns the shield amplification icon index', () =>
  {
    expect(globalThis.IconManager.sar()).toBe(967);
  });

  it('ser returns the shield efficiency icon index', () =>
  {
    expect(globalThis.IconManager.ser()).toBe(968);
  });
});
//endregion plugins/abs/ext/shield/managers/icon-manager.test.js
