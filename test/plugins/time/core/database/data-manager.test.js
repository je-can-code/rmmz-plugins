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

    // JsonEx restores saved data back onto the real prototype, so a clock coming out of a save
    // arrives with its full method set. the stand-in has to offer the same, since extraction now
    // backfills members and recomputes the tone on whatever it loaded.
    FakeGameTime.prototype.initMembers = vi.fn();
    FakeGameTime.prototype.updateCurrentTone = vi.fn();
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

    it('leaves backfilling members to the codec seed rather than re-running it here', () =>
    {
      // Arrange
      const contents = { time: new FakeGameTime() };

      // Act
      globalThis.DataManager.extractSaveContents(contents);

      // Assert- `Game_Time` registers with no explicit seed, so its codec derives one from
      // `initMembers` and runs it on the bare instance *before* any field from the file lands.
      // Re-running it here would have been a second pass over an object already decoded, and one
      // that only worked because every member was assigned with `??=`.
      expect(FakeGameTime.prototype.initMembers).not.toHaveBeenCalled();
    });

    it('leaves the screen tone alone, since $dataMap is not yet the map being loaded into', () =>
    {
      // Arrange
      const contents = { time: new FakeGameTime() };

      // Act
      globalThis.DataManager.extractSaveContents(contents);

      // Assert- the tone is resolved by `Scene_Map#onMapLoaded` instead, which is the first point
      // where the map about to be entered is the one the tone gets asked about.
      expect(FakeGameTime.prototype.updateCurrentTone).not.toHaveBeenCalled();
      expect(globalThis.$gameTime).toBe(contents.time);
    });

    it('skips backfilling when there was no clock in the save to begin with', () =>
    {
      // Arrange
      const contents = { time: null };

      // Act
      globalThis.DataManager.extractSaveContents(contents);

      // Assert
      // the freshly constructed clock initialized itself in its own constructor; running the backfill
      // on top of that would be redundant work against a brand new object.
      expect(FakeGameTime.prototype.initMembers).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/time/core/database/data-manager.test.js
