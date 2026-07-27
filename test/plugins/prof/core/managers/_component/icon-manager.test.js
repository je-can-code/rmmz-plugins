//region plugins/prof/core/managers/_component/icon-manager.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('IconManager prof augments (direct src import)', () =>
{
  let IconManager;

  beforeAll(async () =>
  {
    globalThis.IconManager = {};

    await import('../../../../../../src/plugins/prof/core/managers/IconManager.js');
    ({ IconManager } = globalThis);
  });

  it('provides the proficiency boost icon index', () =>
  {
    expect(IconManager.proficiencyBoost()).toEqual(979);
  });
});
//endregion plugins/prof/core/managers/_component/icon-manager.test.js
