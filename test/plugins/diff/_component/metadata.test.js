//region plugins/diff/_component/metadata.test.js
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
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJDiff();
    await import('../../../../src/plugins/diff/core/_metadata/initialization.js');
  });

  it('parses the starting difficulty point budget out of the plugin parameters', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.DIFFICULTY.Metadata.initialPoints).toBe(Number(DEFAULT_DIFF_PLUGIN_PARAMS.initialPoints));
  });

  it('parses the default difficulty key out of the plugin parameters', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.DIFFICULTY.Metadata.defaultKey).toBe(DEFAULT_DIFF_PLUGIN_PARAMS.defaultDifficulty);
  });

  it('loads every difficulty in the external config into the metadata map', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.DIFFICULTY.Metadata.allMetadatas.size).toBe(2);
  });

  it('keys each loaded difficulty by its own key and keeps its actor effects', () =>
  {
    // Arrange & Act
    const meta = globalThis.J.DIFFICULTY.Metadata.allMetadatas.get('vitest_diff');

    // Assert
    expect(meta.key).toBe('vitest_diff');
    expect(meta.actorEffects.bparams[0]).toBe(80);
  });

  it('keeps the enemy effects of a loaded difficulty distinct from its actor effects', () =>
  {
    // Arrange & Act
    const hard = globalThis.J.DIFFICULTY.Metadata.allMetadatas.get('vitest_hard');

    // Assert
    expect(hard.enemyEffects.bparams[0]).toBe(50);
  });

  it('throws when J-Base does not satisfy the minimum required version', async () =>
  {
    // Arrange: drop the already-installed J-Base metadata below this plugin's floor.
    vi.resetModules();
    const originalVersion = globalThis.J.BASE.Metadata.Version;
    globalThis.J.BASE.Metadata.Version = '0.0.1';
    setPluginContextToJDiff();

    // Act & Assert
    await expect(import('../../../../src/plugins/diff/core/_metadata/initialization.js'))
      .rejects.toThrow(/missing J-Base/);

    // restore the satisfying version so later tests in this file are unaffected.
    globalThis.J.BASE.Metadata.Version = originalVersion;
  });
});
//endregion plugins/diff/_component/metadata.test.js
