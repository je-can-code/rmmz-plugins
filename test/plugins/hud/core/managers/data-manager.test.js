//region plugins/hud/core/managers/data-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('DataManager ext (direct src import)', () =>
{
  let FakeHudManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    // stub out the real (570-line) HudManager entirely; this file only cares that DataManager's
    // patch constructs one and calls setup() on it at the right lifecycle points.
    FakeHudManager = vi.fn(function()
    {
      this.setup = vi.fn();
    });
    vi.doMock('../../../../../src/plugins/hud/core/managers/HudManager.js', () => ({ default: FakeHudManager }));

    globalThis.J = { HUD: { Aliased: { DataManager: new Map() } } };

    globalThis.DataManager = {
      createGameObjects: vi.fn(),
      extractSaveContents: vi.fn(),
      setupNewGame: vi.fn(),
    };

    await import('../../../../../src/plugins/hud/core/managers/DataManager.js');
  });

  beforeEach(() =>
  {
    globalThis.$hudManager = null;
    vi.clearAllMocks();
  });

  describe('createGameObjects', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange/Act
      globalThis.DataManager.createGameObjects();

      // Assert
      expect(globalThis.J.HUD.Aliased.DataManager.get('createGameObjects')).toHaveBeenCalled();
    });

    it('creates a new global hud manager when one is missing', () =>
    {
      // Arrange
      globalThis.$hudManager = null;

      // Act
      globalThis.DataManager.createGameObjects();

      // Assert
      expect(FakeHudManager).toHaveBeenCalled();
      expect(globalThis.$hudManager).toBeInstanceOf(FakeHudManager);
    });

    it('does not replace an existing global hud manager', () =>
    {
      // Arrange
      const existing = new FakeHudManager();
      FakeHudManager.mockClear();
      globalThis.$hudManager = existing;

      // Act
      globalThis.DataManager.createGameObjects();

      // Assert
      expect(FakeHudManager).not.toHaveBeenCalled();
      expect(globalThis.$hudManager).toBe(existing);
    });
  });

  describe('extractSaveContents', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      globalThis.$hudManager = new FakeHudManager();
      const contents = {};

      // Act
      globalThis.DataManager.extractSaveContents(contents);

      // Assert
      expect(globalThis.J.HUD.Aliased.DataManager.get('extractSaveContents')).toHaveBeenCalledWith(contents);
    });

    it('sets up the hud manager after extracting save contents', () =>
    {
      // Arrange
      const hudManager = new FakeHudManager();
      globalThis.$hudManager = hudManager;

      // Act
      globalThis.DataManager.extractSaveContents({});

      // Assert
      expect(hudManager.setup).toHaveBeenCalled();
    });
  });

  describe('setupNewGame', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      globalThis.$hudManager = new FakeHudManager();

      // Act
      globalThis.DataManager.setupNewGame();

      // Assert
      expect(globalThis.J.HUD.Aliased.DataManager.get('setupNewGame')).toHaveBeenCalled();
    });

    it('sets up the hud manager for a new game', () =>
    {
      // Arrange
      const hudManager = new FakeHudManager();
      globalThis.$hudManager = hudManager;

      // Act
      globalThis.DataManager.setupNewGame();

      // Assert
      expect(hudManager.setup).toHaveBeenCalled();
    });
  });
});
//endregion plugins/hud/core/managers/data-manager.test.js
