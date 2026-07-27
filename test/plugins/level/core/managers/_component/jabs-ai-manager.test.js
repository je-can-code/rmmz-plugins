//region plugins/level/core/managers/_component/jabs-ai-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_AiManager level augments (direct src import)', () =>
{
  let JABS_AiManager;
  let originalPostConvertMutate;

  beforeAll(async () =>
  {
    vi.resetModules();

    originalPostConvertMutate = vi.fn();

    globalThis.J = { LEVEL: { Aliased: { JABS_AiManager: new Map() } } };

    globalThis.JABS_AiManager = { postConvertMutate: originalPostConvertMutate };

    await import('../../../../../../src/plugins/level/core/managers/JABS_AiManager.js');
    ({ JABS_AiManager } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    delete globalThis.J.NATURAL;
  });

  function makeJabsBattler(levelOverride)
  {
    const character = { getLevelOverrides: vi.fn().mockReturnValue(levelOverride) };
    return { getCharacter: vi.fn().mockReturnValue(character) };
  }

  it('calls through to original logic', () =>
  {
    // Arrange
    const battler = { setCachedLevelOverride: vi.fn() };
    const jabsBattler = makeJabsBattler(null);

    // Act
    JABS_AiManager.postConvertMutate(battler, jabsBattler);

    // Assert
    expect(originalPostConvertMutate).toHaveBeenCalledWith(battler, jabsBattler);
  });

  it('does not cache a level override when the character has none', () =>
  {
    // Arrange
    const battler = { setCachedLevelOverride: vi.fn() };
    const jabsBattler = makeJabsBattler(null);

    // Act
    JABS_AiManager.postConvertMutate(battler, jabsBattler);

    // Assert
    expect(battler.setCachedLevelOverride).not.toHaveBeenCalled();
  });

  it('caches the level override without refreshing param buffs when J-Natural is not loaded', () =>
  {
    // Arrange
    const battler = { setCachedLevelOverride: vi.fn() };
    const jabsBattler = makeJabsBattler(15);

    // Act
    JABS_AiManager.postConvertMutate(battler, jabsBattler);

    // Assert
    expect(battler.setCachedLevelOverride).toHaveBeenCalledWith(15);
  });

  it('caches the level override and refreshes param buffs when J-Natural is loaded', () =>
  {
    // Arrange
    globalThis.J.NATURAL = true;
    const battler = { setCachedLevelOverride: vi.fn(), refreshAllParameterBuffs: vi.fn() };
    const jabsBattler = makeJabsBattler(15);

    // Act
    JABS_AiManager.postConvertMutate(battler, jabsBattler);

    // Assert
    expect(battler.setCachedLevelOverride).toHaveBeenCalledWith(15);
    expect(battler.refreshAllParameterBuffs).toHaveBeenCalled();
  });
});
//endregion plugins/level/core/managers/_component/jabs-ai-manager.test.js
