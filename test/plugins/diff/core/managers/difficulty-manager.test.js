//region plugins/diff/core/managers/difficulty-manager.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DifficultyManager from '../../../../../src/plugins/diff/core/managers/DifficultyManager.js';

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

  describe('availableDifficulties', () =>
  {
    it('excludes hidden layers', () =>
    {
      // Arrange
      const hidden = makeLayer({ isHidden: vi.fn().mockReturnValue(true) });
      const visible = makeLayer();
      globalThis.$gameTemp.getAllDifficultyLayers.mockReturnValue([ hidden, visible ]);

      // Act
      const result = DifficultyManager.availableDifficulties();

      // Assert
      expect(result).toEqual([ visible ]);
    });

    it('excludes locked layers', () =>
    {
      // Arrange
      const locked = makeLayer({ isUnlocked: vi.fn().mockReturnValue(false) });
      const unlocked = makeLayer();
      globalThis.$gameTemp.getAllDifficultyLayers.mockReturnValue([ locked, unlocked ]);

      // Act
      const result = DifficultyManager.availableDifficulties();

      // Assert
      expect(result).toEqual([ unlocked ]);
    });

    it('includes visible, unlocked layers', () =>
    {
      // Arrange
      const layer = makeLayer();
      globalThis.$gameTemp.getAllDifficultyLayers.mockReturnValue([ layer ]);

      // Act
      const result = DifficultyManager.availableDifficulties();

      // Assert
      expect(result).toEqual([ layer ]);
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

      // Assert
      expect(consoleWarnSpy).toHaveBeenCalled();
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
      expect(consoleWarnSpy).toHaveBeenCalled();
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
      expect(consoleWarnSpy).toHaveBeenCalled();
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
      expect(consoleWarnSpy).toHaveBeenCalled();
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
      expect(consoleWarnSpy).toHaveBeenCalled();
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
      expect(consoleWarnSpy).toHaveBeenCalled();
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
//endregion plugins/diff/core/managers/difficulty-manager.test.js
