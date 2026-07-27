//region plugins/prof/core/managers/_component/text-manager.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('TextManager prof augments (direct src import)', () =>
{
  let TextManager;

  beforeAll(async () =>
  {
    globalThis.TextManager = {};

    await import('../../../../../../src/plugins/prof/core/managers/TextManager.js');
    ({ TextManager } = globalThis);
  });

  it('provides the proficiency bonus label', () =>
  {
    expect(TextManager.proficiencyBonus()).toEqual('Proficiency+');
  });

  it('provides the proficiency bonus description', () =>
  {
    expect(TextManager.proficiencyDescription()).toEqual([
      'The numeric bonus of proficiency gained when gaining proficiency.',
      'Higher amounts of this means achieving proficiency mastery faster.',
    ]);
  });
});
//endregion plugins/prof/core/managers/_component/text-manager.test.js
