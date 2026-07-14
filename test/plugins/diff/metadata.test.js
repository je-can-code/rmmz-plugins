//region plugins/diff/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_DIFF_PLUGIN_PARAMS,
  installDiffHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJDiff,
} from './fixtures/install-diff-host-globals.js';

describe('J-Difficulty metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installDiffHostGlobals();

    setPluginContextToJBase();
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJDiff();
    await import('../../../src/plugins/diff/core/_metadata/initialization.js');
  });

  it('loads external config into J.DIFFICULTY.Metadata.allMetadatas', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.DIFFICULTY.Metadata.name).toBe('J-Difficulty');
    expect(globalThis.J.DIFFICULTY.Metadata.initialPoints).toBe(Number(DEFAULT_DIFF_PLUGIN_PARAMS.initialPoints));
    expect(globalThis.J.DIFFICULTY.Metadata.defaultKey).toBe(DEFAULT_DIFF_PLUGIN_PARAMS.defaultDifficulty);
    expect(globalThis.J.DIFFICULTY.Metadata.allMetadatas.size).toBe(2);

    const meta = globalThis.J.DIFFICULTY.Metadata.allMetadatas.get('vitest_diff');
    expect(meta).toBeDefined();
    expect(meta.key).toBe('vitest_diff');
    expect(meta.actorEffects.bparams[0]).toBe(80);

    const hard = globalThis.J.DIFFICULTY.Metadata.allMetadatas.get('vitest_hard');
    expect(hard).toBeDefined();
    expect(hard.enemyEffects.bparams[0]).toBe(50);
  });
});
//endregion plugins/diff/metadata.test.js
