//region plugins/natural/metadata.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_NATURAL_PLUGIN_PARAMS,
  loadNaturalGrowthPluginVm,
  resetNaturalGrowthPluginSandbox,
} from './natural-vm.js';

describe('J-NaturalGrowth metadata (out/J-NaturalGrowth.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadNaturalGrowthPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    resetNaturalGrowthPluginSandbox(sandbox);
  });

  it('maps PluginManager parameters into J.NATURAL.Metadata base TP fields', () =>
  {
    expect(sandbox.J.NATURAL.Metadata.BaseTpMaxActors).toBe(Number(DEFAULT_NATURAL_PLUGIN_PARAMS.actorBaseTp));
    expect(sandbox.J.NATURAL.Metadata.BaseTpMaxEnemies).toBe(Number(DEFAULT_NATURAL_PLUGIN_PARAMS.enemyBaseTp));
  });
});
//endregion plugins/natural/metadata.test.js
