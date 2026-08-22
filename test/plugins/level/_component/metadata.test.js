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

  beforeAll(async () =>
  {
    vi.resetModules();

    installLevelHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

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

  it('maps useSharedActorLevel from the config when it is on', () =>
  {
    // Arrange & Act
    const result = globalThis.J.LEVEL.Metadata.useSharedActorLevel;

    // Assert
    expect(result).toBe(true);
  });

  describe('boolean flag translation', () =>
  {
    it('reads the scaling toggle as off when the config says so', async () =>
    {
      // Arrange & Act
      const metadata = await buildWithConfig({ useScaling: false }, 'J-LevelMaster-ScalingOff');

      // Assert- `false` is also what an unparsed config would produce, so the canonical exp basis
      // anchors the claim that this instance genuinely read a config at all.
      expect(metadata.enabled).toBe(false);
      expect(metadata.canonicalExpBasis).toBe(30);
    });

    it('reads the shared actor level toggle as off when the config says so', async () =>
    {
      // Arrange & Act
      const metadata = await buildWithConfig({ useSharedActorLevel: false }, 'J-LevelMaster-PerClassLevels');

      // Assert- same anchoring concern as the scaling toggle above.
      expect(metadata.useSharedActorLevel).toBe(false);
      expect(metadata.canonicalExpBasis).toBe(30);
    });
  });

  describe('reward multiplier fallbacks', () =>
  {
    it('falls back to the combat minimum when the reward minimum is left null', () =>
    {
      // Arrange & Act- the shipped config leaves both reward multipliers null, so this is the
      // path every real project takes. `Number(null)` is 0, not NaN, so the finite-check below
      // does not catch a null slipping past the emptiness test.
      const result = globalThis.J.LEVEL.Metadata.rewardMinimumMultiplier;

      // Assert
      expect(result).toBe(0.1);
    });

    it('falls back to the combat minimum when the reward minimum is an empty string', async () =>
    {
      // Arrange & Act- `Number('')` is also 0 rather than NaN, so emptiness must be caught here
      // rather than left to the finite-check.
      const metadata = await buildWithConfig({ rewardMinMultiplier: '' }, 'J-LevelMaster-EmptyRewardMin');

      // Assert
      expect(metadata.rewardMinimumMultiplier).toBe(0.1);
    });

    it('falls back to the combat maximum when the reward maximum is an empty string', async () =>
    {
      // Arrange & Act
      const metadata = await buildWithConfig({ rewardMaxMultiplier: '' }, 'J-LevelMaster-EmptyRewardMax');

      // Assert
      expect(metadata.rewardMaximumMultiplier).toBe(2);
    });

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
