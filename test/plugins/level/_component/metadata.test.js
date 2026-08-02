//region plugins/level/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { DEFAULT_LEVEL_CONFIG } from './fixtures/engine-stubs.js';
import {
  installLevelHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJLevel,
} from './fixtures/install-level-host-globals.js';

describe('J-LevelMaster metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installLevelHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJLevel();
    await import('../../../../src/plugins/level/core/_metadata/initialization.js');
  });

  it('maps data/config.level.json name/enabled onto J.LEVEL.Metadata', () =>
  {
    // Arrange & Act
    const metadata = globalThis.J.LEVEL.Metadata;

    // Assert
    expect(metadata.name).toBe('J-LevelMaster');
    expect(metadata.enabled).toBe(true);
  });

  it('maps minimumMultiplier from the config', () =>
  {
    // Arrange & Act
    const result = globalThis.J.LEVEL.Metadata.minimumMultiplier;

    // Assert
    expect(result).toBe(DEFAULT_LEVEL_CONFIG.minMultiplier);
  });

  it('maps maximumMultiplier from the config', () =>
  {
    // Arrange & Act
    const result = globalThis.J.LEVEL.Metadata.maximumMultiplier;

    // Assert
    expect(result).toBe(DEFAULT_LEVEL_CONFIG.maxMultiplier);
  });

  it('maps growthMultiplier from the config', () =>
  {
    // Arrange & Act
    const result = globalThis.J.LEVEL.Metadata.growthMultiplier;

    // Assert
    expect(result).toBe(DEFAULT_LEVEL_CONFIG.growthMultiplier);
  });

  it('maps trueMaxLevel from the config', () =>
  {
    // Arrange & Act
    const result = globalThis.J.LEVEL.Metadata.trueMaxLevel;

    // Assert
    expect(result).toBe(DEFAULT_LEVEL_CONFIG.trueMaxLevel);
  });

  describe('reward multiplier fallbacks', () =>
  {
    /**
     * Builds a second metadata instance against a doctored config. PluginMetadata keeps a static
     * name registry that rejects duplicates, so each variation introduces itself under a name of
     * its own; only the registry key and the parameter lookup care about the name.
     * @param {object} overrides Config fields layered over the default level configuration.
     * @param {string} name The plugin name this instance registers under.
     */
    const buildWithConfig = async (overrides, name) =>
    {
      const { default: LevelPluginMetadata } =
        await import('../../../../src/plugins/level/core/_metadata/_pluginMetadata.js');
      globalThis.StorageManager.fsReadFile = () => JSON.stringify({ ...DEFAULT_LEVEL_CONFIG, ...overrides });

      return new LevelPluginMetadata(name, '1.4.0');
    };

    it('falls back to the combat minimum when the reward minimum is unreadable', async () =>
    {
      // Arrange & Act- a non-numeric value parses to NaN, which would otherwise poison every
      // reward calculation downstream rather than failing visibly.
      const metadata = await buildWithConfig({ rewardMinMultiplier: 'not-a-number' }, 'J-LevelMaster-BadRewardMin');

      // Assert
      expect(metadata.rewardMinimumMultiplier).toBe(DEFAULT_LEVEL_CONFIG.minMultiplier);
    });

    it('falls back to the combat maximum when the reward maximum is unreadable', async () =>
    {
      // Arrange & Act
      const metadata = await buildWithConfig({ rewardMaxMultiplier: 'not-a-number' }, 'J-LevelMaster-BadRewardMax');

      // Assert
      expect(metadata.rewardMaximumMultiplier).toBe(DEFAULT_LEVEL_CONFIG.maxMultiplier);
    });

    it('uses a configured reward range when it is readable', async () =>
    {
      // Arrange & Act- the fallbacks must not swallow a legitimately configured range.
      const metadata = await buildWithConfig(
        { rewardMinMultiplier: 0.5, rewardMaxMultiplier: 3 },
        'J-LevelMaster-GoodRewardRange');

      // Assert
      expect(metadata.rewardMinimumMultiplier).toBe(0.5);
      expect(metadata.rewardMaximumMultiplier).toBe(3);
    });
  });
});
//endregion plugins/level/_component/metadata.test.js
