//region plugins/time/core/database/data-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('DataManager ext/time augments (direct src import)', () =>
{
  let FakeGameTime;

  beforeAll(async () =>
  {
    vi.resetModules();

    FakeGameTime = vi.fn(function()
    {
      this.isFake = true;
    });
    vi.doMock('../../../../../src/plugins/time/core/_models/Game_Time.js', () => ({ default: FakeGameTime }));

    globalThis.J = { TIME: { Aliased: { DataManager: new Map() } } };

    globalThis.DataManager = {
      createGameObjects: vi.fn(),
      makeSaveContents: vi.fn().mockReturnValue({}),
      extractSaveContents: vi.fn(),
    };

    await import('../../../../../src/plugins/time/core/database/DataManager.js');
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.$gameTime = null;
  });

  describe('createGameObjects', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange/Act
      globalThis.DataManager.createGameObjects();

      // Assert
      expect(globalThis.J.TIME.Aliased.DataManager.get('createGameObjects')).toHaveBeenCalled();
    });

    it('creates a new global game time instance', () =>
    {
      // Arrange/Act
      globalThis.DataManager.createGameObjects();

      // Assert
      expect(globalThis.$gameTime).toBeInstanceOf(FakeGameTime);
    });
  });

  describe('makeSaveContents', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange/Act
      globalThis.DataManager.makeSaveContents();

      // Assert
      expect(globalThis.J.TIME.Aliased.DataManager.get('makeSaveContents')).toHaveBeenCalled();
    });

    it('attaches the current game time onto the save contents', () =>
    {
      // Arrange
      globalThis.$gameTime = new FakeGameTime();

      // Act
      const contents = globalThis.DataManager.makeSaveContents();

      // Assert
      expect(contents.time).toBe(globalThis.$gameTime);
    });
  });

  describe('extractSaveContents', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const contents = { time: new FakeGameTime() };

      // Act
      globalThis.DataManager.extractSaveContents(contents);

      // Assert
      expect(globalThis.J.TIME.Aliased.DataManager.get('extractSaveContents2')).toHaveBeenCalledWith(contents);
    });

    it('restores the game time from the save contents when present', () =>
    {
      // Arrange
      const savedTime = new FakeGameTime();
      const contents = { time: savedTime };

      // Act
      globalThis.DataManager.extractSaveContents(contents);

      // Assert
      expect(globalThis.$gameTime).toBe(savedTime);
    });

    it('creates a fresh game time when the save has none (pre-J-Time save)', () =>
    {
      // Arrange
      const contents = { time: null };

      // Act
      globalThis.DataManager.extractSaveContents(contents);

      // Assert
      expect(globalThis.$gameTime).toBeInstanceOf(FakeGameTime);
    });
  });
});
//endregion plugins/time/core/database/data-manager.test.js
