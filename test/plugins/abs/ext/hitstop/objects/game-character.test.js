//region plugins/abs/ext/hitstop/objects/game-character.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Hitstop Game_Character (unit, all downstream dependencies mocked)', () =>
{
  /** @type {import('vitest').Mock} the "original" (aliased) prototype methods this file wraps. */
  let originalInitMembers;
  let originalUpdate;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: {
          HITSTOP: {
            Aliased: { Game_Character: new Map() },
          },
        },
      },
    };

    // JABS_HitstopData is a downstream dependency (a sibling model file); mock it with a minimal
    // duck-typed stand-in so this file's own wiring/lazy-init logic is what's tested.
    vi.doMock('../../../../../../src/plugins/abs/ext/hitstop/_models/JABS_HitstopData.js', () => ({
      default: vi.fn(function()
      {
        this._active = false;
        this.isActive = () => this._active;
        this.setActive = (value) => { this._active = value; };
        this.tick = vi.fn();
      }),
    }));

    function Game_Character()
    {
    }

    originalInitMembers = vi.fn();
    originalUpdate = vi.fn();
    Game_Character.prototype.initMembers = originalInitMembers;
    Game_Character.prototype.update = originalUpdate;
    globalThis.Game_Character = Game_Character;

    // the file under test- patches globalThis.Game_Character.prototype directly, no vm involved.
    await import('../../../../../../src/plugins/abs/ext/hitstop/objects/Game_Character.js');
  });

  beforeEach(() =>
  {
    originalInitMembers.mockReset();
    originalUpdate.mockReset();
  });

  function buildCharacter()
  {
    return Object.create(globalThis.Game_Character.prototype);
  }

  describe('initMembers / initHitstopMembers', () =>
  {
    it('calls the original initMembers then initializes hitstop members', () =>
    {
      // Arrange
      const character = buildCharacter();

      // Act
      character.initMembers();

      // Assert
      expect(originalInitMembers).toHaveBeenCalledTimes(1);
      expect(character._j._abs._hitstop._data.isActive()).toBe(false);
    });
  });

  describe('getHitstopData', () =>
  {
    it('lazily initializes hitstop members when the _j._abs namespace exists but hitstop was never added (e.g. stale save data predating this extension)', () =>
    {
      // Arrange- real characters always have initMembers run their _j._abs namespace into being
      // before anything else touches them; the only reachable "missing" case is this namespace
      // existing without the hitstop branch specifically.
      const character = buildCharacter();
      character._j = { _abs: {} };

      // Act
      const data = character.getHitstopData();

      // Assert
      expect(data).toBeDefined();
      expect(character._j._abs._hitstop._data).toBe(data);
    });

    it('returns the same data instance on repeated calls', () =>
    {
      // Arrange
      const character = buildCharacter();
      character.initMembers();

      // Act
      const first = character.getHitstopData();
      const second = character.getHitstopData();

      // Assert
      expect(second).toBe(first);
    });
  });

  describe('isHitstopped', () =>
  {
    it('reflects the hitstop data active flag', () =>
    {
      // Arrange
      const character = buildCharacter();
      character.initMembers();

      // Act / Assert
      expect(character.isHitstopped()).toBe(false);

      // Act
      character.getHitstopData()
        .setActive(true);

      // Assert
      expect(character.isHitstopped()).toBe(true);
    });
  });

  describe('update', () =>
  {
    it('ticks the hitstop timer and skips the original update while hitstopped', () =>
    {
      // Arrange
      const character = buildCharacter();
      character.initMembers();
      character.getHitstopData()
        .setActive(true);

      // Act
      character.update();

      // Assert
      expect(character.getHitstopData().tick).toHaveBeenCalledTimes(1);
      expect(originalUpdate).not.toHaveBeenCalled();
    });

    it('performs the original update when not hitstopped', () =>
    {
      // Arrange
      const character = buildCharacter();
      character.initMembers();

      // Act
      character.update();

      // Assert
      expect(originalUpdate).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/abs/ext/hitstop/objects/game-character.test.js
