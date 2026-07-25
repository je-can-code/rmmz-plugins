//region plugins/abs/core/objects/game-character.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Game_Character.js is a prototype-patch file (aliases and adds methods onto the real RMMZ
 * `Game_Character.prototype`), so this file direct-imports it against bare placeholder engine
 * globals rather than nesting a vm context. Every sibling model/manager it imports is mocked per
 * the "unit tier mocks all downstream file-external dependencies" convention. Aliased-original
 * hooks are captured as `vi.fn()`s (not plain functions) so tests can reconfigure their behavior
 * per-case via `.mockImplementation()`- reassigning `Game_Character.prototype[key]` after import
 * would NOT affect the aliased reference already captured at import time.
 */
describe('J-ABS Game_Character (unit, all downstream dependencies mocked)', () =>
{
  let originalInitMembers;
  let originalIsMovementSucceeded;
  let getBattlerByUuidMock;
  let getBattlerAabbModelMock;

  beforeAll(async () =>
  {
    vi.resetModules();

    // vanilla RMMZ core prototype extension (rmmz_core.js), not part of this plugin- stubbed
    // explicitly rather than relying on another test file having already mutated the prototype.
    Array.prototype.contains = function(element)
    {
      return this.indexOf(element) !== -1;
    };

    globalThis.J = { ABS: { Aliased: { Game_Character: new Map() } } };

    function Game_Character()
    {
    }
    originalInitMembers = vi.fn();
    originalIsMovementSucceeded = vi.fn(() => true);
    Game_Character.prototype.initMembers = originalInitMembers;
    Game_Character.prototype.isMovementSucceeded = originalIsMovementSucceeded;
    globalThis.Game_Character = Game_Character;

    // sibling model/manager dependencies- mocked entirely per the unit-tier convention.
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_LootDrop.js', () => ({ default: class {} }));
    getBattlerAabbModelMock = vi.fn();
    vi.doMock('../../../../../src/plugins/abs/core/managers/JABS_Engine.js', () => ({
      default: class
      {
        static getBattlerAabbModel(character)
        {
          return getBattlerAabbModelMock(character);
        }
      },
    }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Battler.js', () => ({ default: class {} }));
    getBattlerByUuidMock = vi.fn();
    vi.doMock('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js', () => ({
      default: class
      {
        static getBattlerByUuid(uuid)
        {
          return getBattlerByUuidMock(uuid);
        }
      },
    }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Action.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Aabb.js', () => ({ default: class {} }));

    await import('../../../../../src/plugins/abs/core/objects/Game_Character.js');
  });

  beforeEach(() =>
  {
    originalInitMembers.mockClear();
    originalIsMovementSucceeded.mockClear().mockReturnValue(true);
    getBattlerByUuidMock.mockReset();
    getBattlerAabbModelMock.mockReset();
    globalThis.$gameTemp = { requestAnimation: vi.fn() };
  });

  /**
   * Builds a real Game_Character-prototype-backed instance with `initJabsMembers()` already run.
   * @param {object} [overrides] Instance-level overrides.
   * @returns {object} A stubbed Game_Character instance.
   */
  function buildCharacter(overrides = {})
  {
    const character = Object.create(globalThis.Game_Character.prototype);
    character.initJabsMembers();
    Object.assign(character, overrides);
    return character;
  }

  //region initialization
  describe('initMembers()/initJabsMembers()', () =>
  {
    it('performs the original logic then initializes the jabs namespace', () =>
    {
      const character = Object.create(globalThis.Game_Character.prototype);

      character.initMembers();

      expect(originalInitMembers).toHaveBeenCalled();
      expect(character._j._abs._action.actionData).toBeNull();
      expect(character._j._abs._battler._needsAdding).toEqual(false);
      expect(character._j._abs._loot._data).toBeNull();
    });
  });
  //endregion initialization

  //region JABS action
  describe('getJabsAction()/setJabsAction()/isJabsAction()', () =>
  {
    it('defaults to no action', () =>
    {
      const character = buildCharacter();

      expect(character.getJabsAction()).toBeNull();
      expect(character.isJabsAction()).toEqual(false);
    });

    it('round-trips an assigned action', () =>
    {
      const character = buildCharacter();
      const action = { tag: 'action' };
      character.setJabsAction(action);

      expect(character.getJabsAction()).toEqual(action);
      expect(character.isJabsAction()).toEqual(true);
    });
  });

  describe('getJabsActionNeedsRemoving()', () =>
  {
    it('returns false when this is not an action', () =>
    {
      const character = buildCharacter();

      expect(character.getJabsActionNeedsRemoving()).toEqual(false);
    });

    it('delegates to the action needs-removal flag', () =>
    {
      const character = buildCharacter();
      character.setJabsAction({ getNeedsRemoval: () => true });

      expect(character.getJabsActionNeedsRemoving()).toEqual(true);
    });
  });

  describe('getJabsActionUuid()', () =>
  {
    it('returns an empty string when there is no action', () =>
    {
      const character = buildCharacter();

      expect(character.getJabsActionUuid()).toEqual(String.empty);
    });

    it('returns the underlying action uuid', () =>
    {
      const character = buildCharacter();
      character.setJabsAction({ getUuid: () => 'action-uuid' });

      expect(character.getJabsActionUuid()).toEqual('action-uuid');
    });
  });

  describe('action sprite needsAdding/needsRemoving flags', () =>
  {
    it('defaults both flags to false', () =>
    {
      const character = buildCharacter();

      expect(character.getActionSpriteNeedsAdding()).toEqual(false);
      expect(character.getActionSpriteNeedsRemoving()).toEqual(false);
    });

    it('sets needsAdding, defaulting the parameter to true', () =>
    {
      const character = buildCharacter();
      character.setActionSpriteNeedsAdding();

      expect(character.getActionSpriteNeedsAdding()).toEqual(true);
    });

    it('sets needsAdding to an explicit value', () =>
    {
      const character = buildCharacter();
      character.setActionSpriteNeedsAdding(false);

      expect(character.getActionSpriteNeedsAdding()).toEqual(false);
    });

    it('sets needsRemoving, defaulting the parameter to true', () =>
    {
      const character = buildCharacter();
      character.setActionSpriteNeedsRemoving();

      expect(character.getActionSpriteNeedsRemoving()).toEqual(true);
    });
  });
  //endregion JABS action

  //region JABS battler
  describe('getJabsBattlerUuid()/setJabsBattlerUuid()', () =>
  {
    it('round-trips the battler uuid', () =>
    {
      const character = buildCharacter();
      character.setJabsBattlerUuid('battler-uuid');

      expect(character.getJabsBattlerUuid()).toEqual('battler-uuid');
    });
  });

  describe('hasJabsBattler()', () =>
  {
    it('returns false when there is no uuid at all', () =>
    {
      const character = buildCharacter();

      expect(character.hasJabsBattler()).toEqual(false);
    });

    it('clears the uuid and returns false when the tracked battler cannot be found', () =>
    {
      getBattlerByUuidMock.mockReturnValue(undefined);
      const character = buildCharacter();
      character.setJabsBattlerUuid('stale-uuid');

      expect(character.hasJabsBattler()).toEqual(false);
      expect(character.getJabsBattlerUuid()).toEqual(String.empty);
    });

    it('returns true when the tracked battler is found', () =>
    {
      getBattlerByUuidMock.mockReturnValue({ tag: 'battler' });
      const character = buildCharacter();
      character.setJabsBattlerUuid('live-uuid');

      expect(character.hasJabsBattler()).toEqual(true);
    });
  });

  describe('getJabsBattler()', () =>
  {
    it('resolves the tracked battler by uuid', () =>
    {
      const battler = { tag: 'battler' };
      getBattlerByUuidMock.mockReturnValue(battler);
      const character = buildCharacter();
      character.setJabsBattlerUuid('live-uuid');

      expect(character.getJabsBattler()).toEqual(battler);
      expect(getBattlerByUuidMock).toHaveBeenCalledWith('live-uuid');
    });
  });

  describe('battler sprite needsAdding flag', () =>
  {
    it('defaults to false, flags true, then clears', () =>
    {
      const character = buildCharacter();

      expect(character.doesBattlerNeedAdding()).toEqual(false);

      character.flagBattlerForAdding();
      expect(character.doesBattlerNeedAdding()).toEqual(true);

      character.removeFlagForAddingBattler();
      expect(character.doesBattlerNeedAdding()).toEqual(false);
    });
  });

  describe('getJabsAabb()', () =>
  {
    it('delegates to the engine helper', () =>
    {
      const aabb = { tag: 'aabb' };
      getBattlerAabbModelMock.mockReturnValue(aabb);
      const character = buildCharacter();

      expect(character.getJabsAabb()).toEqual(aabb);
      expect(getBattlerAabbModelMock).toHaveBeenCalledWith(character);
    });
  });
  //endregion JABS battler

  //region JABS loot
  describe('getJabsLoot()/setJabsLoot()/isJabsLoot()', () =>
  {
    it('defaults to no loot', () =>
    {
      const character = buildCharacter();

      expect(character.getJabsLoot()).toBeNull();
      expect(character.isJabsLoot()).toEqual(false);
    });

    it('round-trips assigned loot', () =>
    {
      const character = buildCharacter();
      const loot = { tag: 'loot' };
      character.setJabsLoot(loot);

      expect(character.getJabsLoot()).toEqual(loot);
      expect(character.isJabsLoot()).toEqual(true);
    });
  });

  describe('loot needsAdding/needsRemoving flags', () =>
  {
    it('defaults both flags to false', () =>
    {
      const character = buildCharacter();

      expect(character.getLootNeedsAdding()).toEqual(false);
      expect(character.getLootNeedsRemoving()).toEqual(false);
    });

    it('sets needsAdding, defaulting the parameter to true', () =>
    {
      const character = buildCharacter();
      character.setLootNeedsAdding();

      expect(character.getLootNeedsAdding()).toEqual(true);
    });

    it('sets needsRemoving, defaulting the parameter to true', () =>
    {
      const character = buildCharacter();
      character.setLootNeedsRemoving();

      expect(character.getLootNeedsRemoving()).toEqual(true);
    });
  });
  //endregion JABS loot

  describe('requestAnimation()', () =>
  {
    it('requests the animation for just this character', () =>
    {
      const character = buildCharacter();
      character.requestAnimation(5);

      expect(globalThis.$gameTemp.requestAnimation).toHaveBeenCalledWith([ character ], 5);
    });
  });

  describe('isMovementSucceeded()', () =>
  {
    it('performs the original logic when there is no jabs battler', () =>
    {
      const character = buildCharacter();

      expect(character.isMovementSucceeded()).toEqual(true);
    });

    it('performs the original logic when the battler can move', () =>
    {
      getBattlerByUuidMock.mockReturnValue({ canBattlerMove: () => true });
      const character = buildCharacter();
      character.setJabsBattlerUuid('live-uuid');

      expect(character.isMovementSucceeded()).toEqual(true);
    });

    it('returns false when the jabs battler cannot move', () =>
    {
      getBattlerByUuidMock.mockReturnValue({ canBattlerMove: () => false });
      const character = buildCharacter();
      character.setJabsBattlerUuid('live-uuid');

      expect(character.isMovementSucceeded()).toEqual(false);
    });
  });

  //region findDiagonalDirectionToHeuristic
  describe('findDiagonalDirectionToHeuristic()', () =>
  {
    /**
     * Builds a character stubbed with the given delta-x/delta-y from goal.
     * @param {number} dx The delta-x from the goal.
     * @param {number} dy The delta-y from the goal.
     * @returns {object} A stubbed character.
     */
    function buildDeltaCharacter(dx, dy)
    {
      return buildCharacter({ deltaXFrom: () => dx, deltaYFrom: () => dy });
    }

    it('returns 0 when already at the goal (within axis-snap)', () =>
    {
      expect(buildDeltaCharacter(0.1, 0.1).findDiagonalDirectionToHeuristic(0, 0)).toEqual(0);
    });

    it.each([
      [ 5, 0, 4 ], [ 5, 5, 7 ], [ 5, -5, 1 ], [ -5, 0, 6 ], [ -5, 5, 9 ], [ -5, -5, 3 ],
      [ 0, 5, 8 ], [ 0, -5, 2 ],
    ])('resolves dx=%i dy=%i to direction %i', (dx, dy, expected) =>
    {
      expect(buildDeltaCharacter(dx, dy).findDiagonalDirectionToHeuristic(0, 0)).toEqual(expected);
    });

    it.each([
      [ 10, 5, 7 ], [ 10, -5, 1 ], [ -10, 5, 9 ], [ -10, -5, 3 ],
    ])('resolves the x-dominant diagonal dx=%i dy=%i to direction %i', (dx, dy, expected) =>
    {
      expect(buildDeltaCharacter(dx, dy).findDiagonalDirectionToHeuristic(0, 0)).toEqual(expected);
    });

    it('snaps sub-tile noise on the x axis to zero', () =>
    {
      expect(buildDeltaCharacter(0.1, 5).findDiagonalDirectionToHeuristic(0, 0)).toEqual(8);
    });

    it('snaps sub-tile noise on the y axis to zero', () =>
    {
      expect(buildDeltaCharacter(5, 0.1).findDiagonalDirectionToHeuristic(0, 0)).toEqual(4);
    });
  });
  //endregion findDiagonalDirectionToHeuristic

  //region findDiagonalDirectionTo
  describe('findDiagonalDirectionTo()', () =>
  {
    it('delegates to the heuristic while passing through walls', () =>
    {
      const character = buildCharacter({
        isThrough: () => true,
        isDebugThrough: () => false,
        deltaXFrom: () => 5,
        deltaYFrom: () => 0,
      });

      expect(character.findDiagonalDirectionTo(0, 0)).toEqual(4);
    });

    it('delegates to the heuristic while debug-through is active', () =>
    {
      const character = buildCharacter({
        isThrough: () => false,
        isDebugThrough: () => true,
        deltaXFrom: () => 0,
        deltaYFrom: () => 5,
      });

      expect(character.findDiagonalDirectionTo(0, 0)).toEqual(8);
    });

    it('returns 0 when already standing on the rounded goal tile', () =>
    {
      globalThis.$gameMap = { width: () => 10 };
      const character = buildCharacter({
        isThrough: () => false,
        isDebugThrough: () => false,
        x: 3,
        y: 4,
        searchLimit: () => 12,
      });

      expect(character.findDiagonalDirectionTo(3, 4)).toEqual(0);
    });

    it('finds a direct straight-line path on an open map', () =>
    {
      globalThis.$gameMap = {
        width: () => 10,
        distance: (x1, y1, x2, y2) => Math.abs(x2 - x1) + Math.abs(y2 - y1),
        roundXWithDirection: (x, dir) =>
        {
          if (dir === 6) return x + 1;
          if (dir === 4) return x - 1;
          return x;
        },
        roundYWithDirection: (y, dir) =>
        {
          if (dir === 2) return y + 1;
          if (dir === 8) return y - 1;
          return y;
        },
        deltaX: (a, b) => a - b,
        deltaY: (a, b) => a - b,
      };
      const character = buildCharacter({
        isThrough: () => false,
        isDebugThrough: () => false,
        x: 0,
        y: 0,
        searchLimit: () => 12,
        isDiagonalDirection: (dir) => [ 1, 3, 7, 9 ].includes(dir),
        isStraightDirection: (dir) => [ 2, 4, 6, 8 ].includes(dir),
        getDiagonalDirections: () => [ 6, 2 ],
        canPass: () => true,
        canPassDiagonally: () => true,
      });

      // moving straight right toward (3,0) should resolve to the "right" direction.
      expect(character.findDiagonalDirectionTo(3, 0)).toEqual(6);
    });

    describe('resolves every 8-direction outcome from a real pathfind', () =>
    {
      /**
       * Builds a fully-decomposed diagonal-aware $gameMap mock (real per-direction handling,
       * unlike the oversimplified always-southeast mock used by the sibling straight-line test).
       * @returns {object}
       */
      function buildRealisticGameMap()
      {
        return {
          width: () => 20,
          distance: (x1, y1, x2, y2) => Math.abs(x2 - x1) + Math.abs(y2 - y1),
          roundXWithDirection: (x, dir) =>
          {
            if (dir === 6) return x + 1;
            if (dir === 4) return x - 1;
            return x;
          },
          roundYWithDirection: (y, dir) =>
          {
            if (dir === 2) return y + 1;
            if (dir === 8) return y - 1;
            return y;
          },
          deltaX: (a, b) => a - b,
          deltaY: (a, b) => a - b,
        };
      }

      /**
       * Maps a numpad diagonal direction to its [horz, vert] straight-direction components.
       * @param {1|3|7|9} dir
       * @returns {[number, number]}
       */
      function diagonalComponents(dir)
      {
        return {
          1: [ 4, 2 ], 3: [ 6, 2 ], 7: [ 4, 8 ], 9: [ 6, 8 ],
        }[dir];
      }

      it.each([
        [ 1, 1, 3 ], [ -1, 1, 1 ], [ 1, -1, 9 ], [ -1, -1, 7 ], [ -3, 0, 4 ],
        [ 0, 1, 2 ], [ 0, -1, 8 ],
      ])('one tile away at dx=%i dy=%i resolves to direction %i', (dx, dy, expected) =>
      {
        globalThis.$gameMap = buildRealisticGameMap();
        const character = buildCharacter({
          isThrough: () => false,
          isDebugThrough: () => false,
          x: 0,
          y: 0,
          searchLimit: () => 12,
          isDiagonalDirection: (dir) => [ 1, 3, 7, 9 ].includes(dir),
          isStraightDirection: (dir) => [ 2, 4, 6, 8 ].includes(dir),
          getDiagonalDirections: diagonalComponents,
          canPass: () => true,
          canPassDiagonally: () => true,
        });

        expect(character.findDiagonalDirectionTo(dx, dy)).toEqual(expected);
      });

      it('finds a path to a farther diagonal goal, revisiting an already-open node with a cheaper route', () =>
      {
        globalThis.$gameMap = buildRealisticGameMap();
        const character = buildCharacter({
          isThrough: () => false,
          isDebugThrough: () => false,
          x: 0,
          y: 0,
          searchLimit: () => 20,
          isDiagonalDirection: (dir) => [ 1, 3, 7, 9 ].includes(dir),
          isStraightDirection: (dir) => [ 2, 4, 6, 8 ].includes(dir),
          getDiagonalDirections: diagonalComponents,
          canPass: () => true,
          canPassDiagonally: () => true,
        });

        expect(character.findDiagonalDirectionTo(2, 2)).toEqual(3);
      });

      it('finds a path to a farther straight goal, revisiting an already-open node with a cheaper route', () =>
      {
        globalThis.$gameMap = buildRealisticGameMap();
        const character = buildCharacter({
          isThrough: () => false,
          isDebugThrough: () => false,
          x: 0,
          y: 0,
          searchLimit: () => 20,
          isDiagonalDirection: (dir) => [ 1, 3, 7, 9 ].includes(dir),
          isStraightDirection: (dir) => [ 2, 4, 6, 8 ].includes(dir),
          getDiagonalDirections: diagonalComponents,
          canPass: () => true,
          canPassDiagonally: () => true,
        });

        expect(character.findDiagonalDirectionTo(4, 0)).toEqual(6);
      });

      it('reopens a node already sitting in the open list once a cheaper path to it is found', () =>
      {
        globalThis.$gameMap = buildRealisticGameMap();
        // the manhattan-distance heuristic overestimates the true cost of diagonal steps, so the
        // straight-line detour around (1,0) and (3,0) is explored first and reaches (2,-1) before
        // the diagonal route does; the diagonal route then arrives at the same (2,-1) tile with a
        // strictly lower g, forcing the search to mutate the already-queued node in place instead
        // of pushing a new one (the `index2 >= 0` branch at Game_Character.js).
        const character = buildCharacter({
          isThrough: () => false,
          isDebugThrough: () => false,
          x: 0,
          y: 0,
          searchLimit: () => 20,
          isDiagonalDirection: (dir) => [ 1, 3, 7, 9 ].includes(dir),
          isStraightDirection: (dir) => [ 2, 4, 6, 8 ].includes(dir),
          getDiagonalDirections: diagonalComponents,
          canPass: (x, y, dir) =>
          {
            const x2 = $gameMap.roundXWithDirection(x, dir);
            const y2 = $gameMap.roundYWithDirection(y, dir);
            return !((x2 === 1 && y2 === 0) || (x2 === 3 && y2 === 0));
          },
          canPassDiagonally: () => true,
        });

        expect(character.findDiagonalDirectionTo(4, 0)).toEqual(3);
      });

      it('stops expanding once a node hits the search limit, falling back to the best node found', () =>
      {
        globalThis.$gameMap = buildRealisticGameMap();
        const character = buildCharacter({
          isThrough: () => false,
          isDebugThrough: () => false,
          x: 0,
          y: 0,
          searchLimit: () => 0,
          deltaXFrom: () => 3,
          deltaYFrom: () => 0,
          isDiagonalDirection: (dir) => [ 1, 3, 7, 9 ].includes(dir),
          isStraightDirection: (dir) => [ 2, 4, 6, 8 ].includes(dir),
          getDiagonalDirections: diagonalComponents,
          canPass: () => true,
          canPassDiagonally: () => true,
        });

        // with a zero search limit, the algorithm never expands past the start node, so it
        // falls through to the no-parent-chain case and defers to the heuristic.
        expect(character.findDiagonalDirectionTo(3, 0)).toEqual(4);
      });

      it('skips a straight-direction neighbor blocked by canPass', () =>
      {
        globalThis.$gameMap = buildRealisticGameMap();
        const character = buildCharacter({
          isThrough: () => false,
          isDebugThrough: () => false,
          x: 0,
          y: 0,
          searchLimit: () => 12,
          isDiagonalDirection: (dir) => [ 1, 3, 7, 9 ].includes(dir),
          isStraightDirection: (dir) => [ 2, 4, 6, 8 ].includes(dir),
          getDiagonalDirections: diagonalComponents,
          // block the direct rightward step so the search must detour around it.
          canPass: (x, y, dir) => !(x === 0 && y === 0 && dir === 6),
          canPassDiagonally: () => true,
        });

        expect(() => character.findDiagonalDirectionTo(2, 0)).not.toThrow();
      });

      it('skips a diagonal-direction neighbor blocked by canPassDiagonally', () =>
      {
        globalThis.$gameMap = buildRealisticGameMap();
        const character = buildCharacter({
          isThrough: () => false,
          isDebugThrough: () => false,
          x: 0,
          y: 0,
          searchLimit: () => 12,
          isDiagonalDirection: (dir) => [ 1, 3, 7, 9 ].includes(dir),
          isStraightDirection: (dir) => [ 2, 4, 6, 8 ].includes(dir),
          getDiagonalDirections: diagonalComponents,
          canPass: () => true,
          // block every diagonal step so the search must fall back to straight moves only.
          canPassDiagonally: () => false,
        });

        expect(character.findDiagonalDirectionTo(2, 2)).toEqual(2);
      });
    });

    it('falls back to the heuristic when no path is found (fully blocked map)', () =>
    {
      globalThis.$gameMap = {
        width: () => 10,
        distance: (x1, y1, x2, y2) => Math.abs(x2 - x1) + Math.abs(y2 - y1),
        roundXWithDirection: (x) => x,
        roundYWithDirection: (y) => y,
        deltaX: () => 0,
        deltaY: () => 0,
      };
      const character = buildCharacter({
        isThrough: () => false,
        isDebugThrough: () => false,
        x: 0,
        y: 0,
        searchLimit: () => 12,
        isDiagonalDirection: () => false,
        isStraightDirection: () => true,
        getDiagonalDirections: () => [ 6, 2 ],
        canPass: () => false,
        canPassDiagonally: () => false,
        deltaXFrom: () => 3,
        deltaYFrom: () => 0,
      });

      expect(character.findDiagonalDirectionTo(3, 0)).toEqual(4);
    });
  });
  //endregion findDiagonalDirectionTo
});
//endregion plugins/abs/core/objects/game-character.test.js
