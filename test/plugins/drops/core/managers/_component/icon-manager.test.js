//region plugins/drops/core/managers/_component/icon-manager.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('IconManager drops augments (direct src import)', () =>
{
  let IconManager;

  beforeAll(async () =>
  {
    globalThis.IconManager = {};

    await import('../../../../../../src/plugins/drops/core/managers/IconManager.js');
    ({ IconManager } = globalThis);
  });

  it('provides the gold rate icon index', () =>
  {
    expect(IconManager.goldRate()).toEqual(314);
  });

  it('provides the drop rate icon index', () =>
  {
    expect(IconManager.dropRate()).toEqual(210);
  });
});
//endregion plugins/drops/core/managers/_component/icon-manager.test.js
