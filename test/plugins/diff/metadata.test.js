//region plugins/diff/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DEFAULT_DIFF_PLUGIN_PARAMS } from './fixtures/engine-stubs.js';
import { loadDiffPluginVm } from './diff-vm.js';

describe('J-Difficulty metadata (out/J-Difficulty.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadDiffPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('loads external config into J.DIFFICULTY.Metadata.allMetadatas', () =>
  {
    expect(sandbox.J.DIFFICULTY.Metadata.name).toBe('J-Difficulty');
    expect(sandbox.J.DIFFICULTY.Metadata.initialPoints).toBe(Number(DEFAULT_DIFF_PLUGIN_PARAMS.initialPoints));
    expect(sandbox.J.DIFFICULTY.Metadata.defaultKey).toBe(DEFAULT_DIFF_PLUGIN_PARAMS.defaultDifficulty);

    expect(sandbox.J.DIFFICULTY.Metadata.allMetadatas.size).toBe(2);

    const meta = sandbox.J.DIFFICULTY.Metadata.allMetadatas.get('vitest_diff');
    expect(meta).toBeDefined();
    expect(meta.key).toBe('vitest_diff');
    expect(meta.actorEffects.bparams[0]).toBe(80);

    const hard = sandbox.J.DIFFICULTY.Metadata.allMetadatas.get('vitest_hard');
    expect(hard).toBeDefined();
    expect(hard.enemyEffects.bparams[0]).toBe(50);
  });
});
//endregion plugins/diff/metadata.test.js
