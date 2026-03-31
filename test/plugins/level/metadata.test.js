//region plugins/level/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DEFAULT_LEVEL_PLUGIN_PARAMS } from './fixtures/engine-stubs.js';
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

  it('maps plugin parameters onto J.LEVEL.Metadata', () =>
  {
    expect(sandbox.J.LEVEL.Metadata.name).toBe('J-LevelMaster');
    expect(sandbox.J.LEVEL.Metadata.enabled).toBe(true);
    expect(sandbox.J.LEVEL.Metadata.minimumMultiplier).toBe(Number(DEFAULT_LEVEL_PLUGIN_PARAMS.minMultiplier));
    expect(sandbox.J.LEVEL.Metadata.maximumMultiplier).toBe(Number(DEFAULT_LEVEL_PLUGIN_PARAMS.maxMultiplier));
    expect(sandbox.J.LEVEL.Metadata.growthMultiplier).toBe(Number(DEFAULT_LEVEL_PLUGIN_PARAMS.growthMultiplier));
    expect(sandbox.J.LEVEL.Metadata.trueMaxLevel).toBe(Number(DEFAULT_LEVEL_PLUGIN_PARAMS.trueMaxLevel));
  });
});
//endregion plugins/level/metadata.test.js
