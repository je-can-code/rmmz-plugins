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
});
//endregion plugins/level/_component/metadata.test.js
