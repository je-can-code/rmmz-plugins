//region plugins/natural/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_NATURAL_PLUGIN_PARAMS,
  installNaturalHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJNatural,
} from './fixtures/install-natural-host-globals.js';

describe('J-NaturalGrowth metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installNaturalHostGlobals();

    setPluginContextToJBase();
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJNatural();
    await import('../../../src/plugins/natural/core/_metadata/initialization.js');
  });

  it('initializes PluginMetadata name and version', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.NATURAL.Metadata.name).toBe('J-NaturalGrowth');
  });

  it('maps PluginManager parameters into J.NATURAL.Metadata base TP fields', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.NATURAL.Metadata.BaseTpMaxActors).toBe(Number(DEFAULT_NATURAL_PLUGIN_PARAMS.actorBaseTp));
    expect(globalThis.J.NATURAL.Metadata.BaseTpMaxEnemies).toBe(Number(DEFAULT_NATURAL_PLUGIN_PARAMS.enemyBaseTp));
  });
});
//endregion plugins/natural/metadata.test.js
