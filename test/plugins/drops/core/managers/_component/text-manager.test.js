//region plugins/drops/core/managers/_component/text-manager.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('TextManager drops augments (direct src import)', () =>
{
  let TextManager;

  beforeAll(async () =>
  {
    globalThis.TextManager = {};

    await import('../../../../../../src/plugins/drops/core/managers/TextManager.js');
    ({ TextManager } = globalThis);
  });

  it('provides a gold rate label', () =>
  {
    expect(TextManager.goldRate()).toEqual('Gold UP');
  });

  it('provides a gold rate description', () =>
  {
    expect(TextManager.goldRateDescription()).toEqual([
      'Bonus multiplier applied to gold rewards.',
      'Higher values yield more gold from battles and chests.',
    ]);
  });

  it('provides a drop rate label', () =>
  {
    expect(TextManager.dropRate()).toEqual('Drops UP');
  });

  it('provides a drop rate description', () =>
  {
    expect(TextManager.dropRateDescription()).toEqual([
      'Bonus multiplier applied to item drop chances.',
      'Higher values improve the odds of extra loot.',
    ]);
  });
});
//endregion plugins/drops/core/managers/_component/text-manager.test.js
