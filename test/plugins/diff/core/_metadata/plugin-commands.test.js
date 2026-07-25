//region plugins/diff/core/_metadata/plugin-commands.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-Difficulty plugin commands (direct src import)', () =>
{
  let handlers;
  let FakeDifficultyManager;
  let FakeSceneDifficulty;

  beforeAll(async () =>
  {
    vi.resetModules();

    FakeDifficultyManager = {
      lockDifficulty: vi.fn(),
      unlockDifficulty: vi.fn(),
      hideDifficulty: vi.fn(),
      unhideDifficulty: vi.fn(),
      enableDifficulty: vi.fn(),
      disableDifficulty: vi.fn(),
    };
    vi.doMock('../../../../../src/plugins/diff/core/managers/DifficultyManager.js', () => ({ default: FakeDifficultyManager }));

    // Scene_Difficulty.js is a UI scene, low test value and irrelevant to this command-wiring test.
    FakeSceneDifficulty = { callScene: vi.fn() };
    vi.doMock('../../../../../src/plugins/diff/core/scenes/Scene_Difficulty.js', () => ({ default: FakeSceneDifficulty }));

    globalThis.J = { DIFFICULTY: { Metadata: { name: 'J-Difficulty' } } };

    handlers = {};
    globalThis.PluginManager = {
      registerCommand: vi.fn((pluginName, commandName, handler) =>
      {
        handlers[commandName] = handler;
      }),
    };

    await import('../../../../../src/plugins/diff/core/_metadata/pluginCommands.js');
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.$gameSystem = { modLayerPointMax: vi.fn() };
  });

  it('registers all eight commands under the J-Difficulty plugin name', () =>
  {
    // Arrange/Act (registration happened in beforeAll)

    // Assert
    expect(Object.keys(handlers)).toEqual([
      'callDifficultyMenu', 'lockDifficulty', 'unlockDifficulty', 'hideDifficulty',
      'unhideDifficulty', 'enableDifficulty', 'disableDifficulty', 'modifyLayerMax',
    ]);
  });

  it('callDifficultyMenu calls the difficulty scene', () =>
  {
    // Arrange/Act
    handlers.callDifficultyMenu();

    // Assert
    expect(FakeSceneDifficulty.callScene).toHaveBeenCalled();
  });

  it('lockDifficulty locks each parsed key', () =>
  {
    // Arrange
    const args = { keys: JSON.stringify([ 'easy', 'hard' ]) };

    // Act
    handlers.lockDifficulty(args);

    // Assert
    expect(FakeDifficultyManager.lockDifficulty).toHaveBeenCalledWith('easy');
    expect(FakeDifficultyManager.lockDifficulty).toHaveBeenCalledWith('hard');
  });

  it('unlockDifficulty unlocks each parsed key', () =>
  {
    // Arrange
    const args = { keys: JSON.stringify([ 'easy' ]) };

    // Act
    handlers.unlockDifficulty(args);

    // Assert
    expect(FakeDifficultyManager.unlockDifficulty).toHaveBeenCalledWith('easy');
  });

  it('hideDifficulty hides each parsed key', () =>
  {
    // Arrange
    const args = { keys: JSON.stringify([ 'easy' ]) };

    // Act
    handlers.hideDifficulty(args);

    // Assert
    expect(FakeDifficultyManager.hideDifficulty).toHaveBeenCalledWith('easy');
  });

  it('unhideDifficulty unhides each parsed key', () =>
  {
    // Arrange
    const args = { keys: JSON.stringify([ 'easy' ]) };

    // Act
    handlers.unhideDifficulty(args);

    // Assert
    expect(FakeDifficultyManager.unhideDifficulty).toHaveBeenCalledWith('easy');
  });

  it('enableDifficulty enables each parsed key', () =>
  {
    // Arrange
    const args = { keys: JSON.stringify([ 'easy' ]) };

    // Act
    handlers.enableDifficulty(args);

    // Assert
    expect(FakeDifficultyManager.enableDifficulty).toHaveBeenCalledWith('easy');
  });

  it('disableDifficulty disables each parsed key', () =>
  {
    // Arrange
    const args = { keys: JSON.stringify([ 'easy' ]) };

    // Act
    handlers.disableDifficulty(args);

    // Assert
    expect(FakeDifficultyManager.disableDifficulty).toHaveBeenCalledWith('easy');
  });

  it('modifyLayerMax parses and applies the amount to the max layer points', () =>
  {
    // Arrange
    const args = { amount: '5' };

    // Act
    handlers.modifyLayerMax(args);

    // Assert
    expect(globalThis.$gameSystem.modLayerPointMax).toHaveBeenCalledWith(5);
  });
});
//endregion plugins/diff/core/_metadata/plugin-commands.test.js
