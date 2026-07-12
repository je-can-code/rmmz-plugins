//region plugins/level/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DEFAULT_LEVEL_CONFIG } from './fixtures/engine-stubs.js';
import { loadLevelPluginVm } from './level-vm.js';

describe('J-LevelMaster metadata (out/J-LevelMaster.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadLevelPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('maps data/config.level.json onto J.LEVEL.Metadata', () =>
  {
    expect(sandbox.J.LEVEL.Metadata.name).toBe('J-LevelMaster');
    expect(sandbox.J.LEVEL.Metadata.enabled).toBe(true);
    expect(sandbox.J.LEVEL.Metadata.minimumMultiplier).toBe(DEFAULT_LEVEL_CONFIG.minMultiplier);
    expect(sandbox.J.LEVEL.Metadata.maximumMultiplier).toBe(DEFAULT_LEVEL_CONFIG.maxMultiplier);
    expect(sandbox.J.LEVEL.Metadata.growthMultiplier).toBe(DEFAULT_LEVEL_CONFIG.growthMultiplier);
    expect(sandbox.J.LEVEL.Metadata.trueMaxLevel).toBe(DEFAULT_LEVEL_CONFIG.trueMaxLevel);
  });
});
//endregion plugins/level/metadata.test.js
