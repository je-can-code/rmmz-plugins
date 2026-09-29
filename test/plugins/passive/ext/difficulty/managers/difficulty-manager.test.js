//region plugins/passive/ext/difficulty/managers/difficulty-manager.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DifficultyManager from '../../../../../../src/plugins/passive/ext/difficulty/managers/DifficultyManager.js';

describe('DifficultyManager', () =>
{
  let consoleWarnSpy;

  beforeEach(() =>
  {
    globalThis.$gameTemp = {
      getAllDifficultyLayers: vi.fn(),
      findDifficultyLayerByKey: vi.fn(),
      refreshAppliedDifficulty: vi.fn(),
    };
    consoleWarnSpy = vi.spyOn(console, 'warn')
      .mockImplementation(() => {});
  });

  afterEach(() =>
  {
    consoleWarnSpy.mockRestore();
  });

  function makeLayer(overrides = {})
  {
    return {
      isHidden: vi.fn().mockReturnValue(false),
      isUnlocked: vi.fn().mockReturnValue(true),
      lock: vi.fn(),
      unlock: vi.fn(),
      hide: vi.fn(),
      unhide: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
      ...overrides,
    };
  }

  describe('allDifficulties', () =>
  {
    it('returns every difficulty layer from $gameTemp', () =>
    {
      // Arrange
      const layerA = makeLayer();
      const layerB = makeLayer();
      globalThis.$gameTemp.getAllDifficultyLayers.mockReturnValue([ layerA, layerB ]);

      // Act
      const result = DifficultyManager.allDifficulties();

      // Assert
      expect(result).toEqual([ layerA, layerB ]);
    });
  });

  describe('visibleDifficulties', () =>
  {
    it('leaves a hidden layer out', () =>
    {
      // Arrange- a visible sibling beside the hidden one, so leaving everything out cannot pass.
      const hidden = makeLayer({ isHidden: vi.fn().mockReturnValue(true) });
      const visible = makeLayer();
      globalThis.$gameTemp.getAllDifficultyLayers.mockReturnValue([ hidden, visible ]);

      // Act
      const result = DifficultyManager.visibleDifficulties();

      // Assert
      expect(result).toEqual([ visible ]);
    });

    it('keeps a locked layer, which the menu shows with its padlock', () =>
    {
      // Arrange- a locked layer beside an unlocked one, both visible, so dropping the locked one cannot pass.
      const locked = makeLayer({ isUnlocked: vi.fn().mockReturnValue(false) });
      const unlocked = makeLayer();
      globalThis.$gameTemp.getAllDifficultyLayers.mockReturnValue([ locked, unlocked ]);

      // Act
      const result = DifficultyManager.visibleDifficulties();

      // Assert
      expect(result).toEqual([ locked, unlocked ]);
    });
  });

  describe('lockDifficulty', () =>
  {
    it('locks the found difficulty', () =>
    {
      // Arrange
      const layer = makeLayer();
      globalThis.$gameTemp.findDifficultyLayerByKey.mockReturnValue(layer);

      // Act
      DifficultyManager.lockDifficulty('easy');

      // Assert
      expect(layer.lock).toHaveBeenCalled();
    });

    it('warns when no difficulty is found for the given key', () =>
    {
      // Arrange
      globalThis.$gameTemp.findDifficultyLayerByKey.mockReturnValue(undefined);

      // Act
      DifficultyManager.lockDifficulty('missing');

      // Assert- the message names the action that failed; its prefix is only the harness's plugin name.
      expect(consoleWarnSpy)
        .toHaveBeenCalledWith(expect.stringContaining('could not lock difficulty with key: [missing].'));
    });
  });

  describe('unlockDifficulty', () =>
  {
    it('unlocks the found difficulty', () =>
    {
      // Arrange
      const layer = makeLayer();
      globalThis.$gameTemp.findDifficultyLayerByKey.mockReturnValue(layer);

      // Act
      DifficultyManager.unlockDifficulty('easy');

      // Assert
      expect(layer.unlock).toHaveBeenCalled();
    });

    it('warns when no difficulty is found for the given key', () =>
    {
      // Arrange
      globalThis.$gameTemp.findDifficultyLayerByKey.mockReturnValue(undefined);

      // Act
      DifficultyManager.unlockDifficulty('missing');

      // Assert
      expect(consoleWarnSpy)
        .toHaveBeenCalledWith(expect.stringContaining('could not unlock difficulty with key: [missing].'));
    });
  });

  describe('hideDifficulty', () =>
  {
    it('hides the found difficulty', () =>
    {
      // Arrange
      const layer = makeLayer();
      globalThis.$gameTemp.findDifficultyLayerByKey.mockReturnValue(layer);

      // Act
      DifficultyManager.hideDifficulty('easy');

      // Assert
      expect(layer.hide).toHaveBeenCalled();
    });

    it('warns when no difficulty is found for the given key', () =>
    {
      // Arrange
      globalThis.$gameTemp.findDifficultyLayerByKey.mockReturnValue(undefined);

      // Act
      DifficultyManager.hideDifficulty('missing');

      // Assert
      expect(consoleWarnSpy)
        .toHaveBeenCalledWith(expect.stringContaining('could not hide difficulty with key: [missing].'));
    });
  });

  describe('unhideDifficulty', () =>
  {
    it('unhides the found difficulty', () =>
    {
      // Arrange
      const layer = makeLayer();
      globalThis.$gameTemp.findDifficultyLayerByKey.mockReturnValue(layer);

      // Act
      DifficultyManager.unhideDifficulty('easy');

      // Assert
      expect(layer.unhide).toHaveBeenCalled();
    });

    it('warns when no difficulty is found for the given key', () =>
    {
      // Arrange
      globalThis.$gameTemp.findDifficultyLayerByKey.mockReturnValue(undefined);

      // Act
      DifficultyManager.unhideDifficulty('missing');

      // Assert
      expect(consoleWarnSpy)
        .toHaveBeenCalledWith(expect.stringContaining('could not unhide difficulty with key: [missing].'));
    });
  });

  describe('enableDifficulty', () =>
  {
    it('enables the found difficulty and refreshes the applied difficulty', () =>
    {
      // Arrange
      const layer = makeLayer();
      globalThis.$gameTemp.findDifficultyLayerByKey.mockReturnValue(layer);

      // Act
      DifficultyManager.enableDifficulty('easy');

      // Assert
      expect(layer.enable).toHaveBeenCalled();
      expect(globalThis.$gameTemp.refreshAppliedDifficulty).toHaveBeenCalled();
    });

    it('warns and does not refresh when no difficulty is found for the given key', () =>
    {
      // Arrange
      globalThis.$gameTemp.findDifficultyLayerByKey.mockReturnValue(undefined);

      // Act
      DifficultyManager.enableDifficulty('missing');

      // Assert
      expect(consoleWarnSpy)
        .toHaveBeenCalledWith(expect.stringContaining('could not enable difficulty with key: [missing].'));
      expect(globalThis.$gameTemp.refreshAppliedDifficulty).not.toHaveBeenCalled();
    });
  });

  describe('disableDifficulty', () =>
  {
    it('disables the found difficulty and refreshes the applied difficulty', () =>
    {
      // Arrange
      const layer = makeLayer();
      globalThis.$gameTemp.findDifficultyLayerByKey.mockReturnValue(layer);

      // Act
      DifficultyManager.disableDifficulty('easy');

      // Assert
      expect(layer.disable).toHaveBeenCalled();
      expect(globalThis.$gameTemp.refreshAppliedDifficulty).toHaveBeenCalled();
    });

    it('warns and does not refresh when no difficulty is found for the given key', () =>
    {
      // Arrange
      globalThis.$gameTemp.findDifficultyLayerByKey.mockReturnValue(undefined);

      // Act
      DifficultyManager.disableDifficulty('missing');

      // Assert
      expect(consoleWarnSpy)
        .toHaveBeenCalledWith(expect.stringContaining('could not disable difficulty with key: [missing].'));
      expect(globalThis.$gameTemp.refreshAppliedDifficulty).not.toHaveBeenCalled();
    });
  });

  describe('refreshAppliedDifficulty', () =>
  {
    it('delegates to $gameTemp.refreshAppliedDifficulty', () =>
    {
      // Act
      DifficultyManager.refreshAppliedDifficulty();

      // Assert
      expect(globalThis.$gameTemp.refreshAppliedDifficulty).toHaveBeenCalled();
    });
  });
});
//endregion plugins/passive/ext/difficulty/managers/difficulty-manager.test.js
