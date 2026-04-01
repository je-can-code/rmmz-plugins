//region plugins/regions/ext/skills/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadRegionsSkillsStackVm } from '../../regions-vm.js';

describe('J-Regions-Skills stack metadata (out/regions/ext/J-Regions-Skills.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadRegionsSkillsStackVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('exposes skills extension metadata delay', () =>
  {
    expect(Number(sandbox.J.REGIONS.EXT.SKILLS.Metadata.delayBetweenExecutions)).toBe(60);
  });
});
//endregion plugins/regions/ext/skills/metadata.test.js
