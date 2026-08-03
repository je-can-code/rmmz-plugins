//region plugins/abs/core/_component/game-character-base-move-speed-and-jump.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a real Game_CharacterBase-backed instance for the move-speed/jump tests.
 * @returns {object}
 */
function buildCharacter()
{
  const character = Object.create(globalThis.Game_CharacterBase.prototype);
  character.initMembers();
  return character;
}

describe('J-ABS Game_CharacterBase move speed / dodge / jump (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_CharacterBase.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_CharacterBase.js');
  });

  beforeEach(() =>
  {
    // the fixture's bare Game_CharacterBase placeholder has no real initMembers/setMoveSpeed/
    // jump/jumpHeight of its own, so the "original logic" this file's aliased overrides call
    // through to needs a real stub- reset to fresh no-op/passthrough stubs before every test.
    globalThis.J.ABS.Aliased.Game_CharacterBase.set('initMembers', () => {});
    // eslint-disable-next-line prefer-arrow-callback -- needs its own `this` as the instance.
    globalThis.J.ABS.Aliased.Game_CharacterBase.set('setMoveSpeed', function(moveSpeed)
    {
      this._moveSpeed = moveSpeed;
    });
    globalThis.J.ABS.Aliased.Game_CharacterBase.set('jump', vi.fn());
    globalThis.J.ABS.Aliased.Game_CharacterBase.set('jumpHeight', () => 12);
  });

  describe('initMembers', () =>
  {
    it('seeds the JABS move-speed/dodge/jump-arc namespace with defaults', () =>
    {
      const character = buildCharacter();
      expect(character._j._abs._realMoveSpeed).toBe(4);
      expect(character._j._abs._dodgeBoost).toBe(0);
      expect(character._j._abs._noJumpArc).toBe(false);
    });

    it('performs the original logic first', () =>
    {
      const originalInitMembers = vi.fn();
      globalThis.J.ABS.Aliased.Game_CharacterBase.set('initMembers', originalInitMembers);
      buildCharacter();
      expect(originalInitMembers).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRealMoveSpeed / realMoveSpeed', () =>
  {
    it('getRealMoveSpeed returns the raw stored base speed', () =>
    {
      const character = buildCharacter();
      expect(character.getRealMoveSpeed()).toBe(4);
    });

    it('realMoveSpeed is just the base speed when neither dashing nor dodging', () =>
    {
      const character = buildCharacter();
      character.isDashing = () => false;
      character.isDodging = () => false;
      expect(character.realMoveSpeed()).toBe(4);
    });

    it('realMoveSpeed adds the dash boost while dashing', () =>
    {
      const character = buildCharacter();
      character.isDashing = () => true;
      character.isDodging = () => false;
      character.getDashSpeedBoost = () => 2;
      expect(character.realMoveSpeed()).toBe(6);
    });

    it('realMoveSpeed adds the dodge modifier while dodging', () =>
    {
      const character = buildCharacter();
      character.isDashing = () => false;
      character.isDodging = () => true;
      character.getDodgeSpeedModifier = () => 3;
      expect(character.realMoveSpeed()).toBe(7);
    });

    it('realMoveSpeed adds both boosts when dashing and dodging simultaneously', () =>
    {
      const character = buildCharacter();
      character.isDashing = () => true;
      character.isDodging = () => true;
      character.getDashSpeedBoost = () => 2;
      character.getDodgeSpeedModifier = () => 3;
      expect(character.realMoveSpeed()).toBe(9);
    });
  });

  describe('getDashSpeedBoost', () =>
  {
    it('is the configured dash speed while dashing', () =>
    {
      const character = buildCharacter();
      character.isDashing = () => true;
      character.dashSpeed = () => 2;
      expect(character.getDashSpeedBoost()).toBe(2);
    });

    it('is 0 while not dashing', () =>
    {
      const character = buildCharacter();
      character.isDashing = () => false;
      expect(character.getDashSpeedBoost()).toBe(0);
    });
  });

  describe('getDodgeSpeedModifier', () =>
  {
    it('is the configured dodge modifier while dodging', () =>
    {
      const character = buildCharacter();
      character.isDodging = () => true;
      character.dodgeModifier = () => 3;
      expect(character.getDodgeSpeedModifier()).toBe(3);
    });

    it('is 0 while not dodging', () =>
    {
      const character = buildCharacter();
      character.isDodging = () => false;
      expect(character.getDodgeSpeedModifier()).toBe(0);
    });
  });

  it('dashSpeed reads the plugin-configured dash speed boost', () =>
  {
    const character = buildCharacter();
    const original = globalThis.J.ABS.Metadata.DashSpeedBoost;
    globalThis.J.ABS.Metadata.DashSpeedBoost = 5;
    expect(character.dashSpeed()).toBe(5);
    globalThis.J.ABS.Metadata.DashSpeedBoost = original;
  });

  describe('setMoveSpeed', () =>
  {
    it('performs original logic and updates the JABS real move speed', () =>
    {
      const originalSetMoveSpeed = vi.fn();
      globalThis.J.ABS.Aliased.Game_CharacterBase.set('setMoveSpeed', originalSetMoveSpeed);
      const character = buildCharacter();

      character.setMoveSpeed(6);

      expect(originalSetMoveSpeed).toHaveBeenCalledWith(6);
      expect(character.getRealMoveSpeed()).toBe(6);
    });
  });

  describe('dodgeModifier / setDodgeModifier', () =>
  {
    it('round-trips the dodge boost value', () =>
    {
      const character = buildCharacter();
      character.setDodgeModifier(7);
      expect(character.dodgeModifier()).toBe(7);
    });
  });

  describe('isDodging', () =>
  {
    it('is false when there is no linked JABS battler', () =>
    {
      const character = buildCharacter();
      character.getJabsBattler = () => null;
      expect(character.isDodging()).toBe(false);
    });

    it('delegates to the linked battler\'s own dodge state when one exists', () =>
    {
      const character = buildCharacter();
      character.getJabsBattler = () => ({ isDodging: () => true });
      expect(character.isDodging()).toBe(true);
    });

    it('reflects a linked battler that is not currently dodging', () =>
    {
      const character = buildCharacter();
      character.getJabsBattler = () => ({ isDodging: () => false });
      expect(character.isDodging()).toBe(false);
    });
  });

  describe('canPassTerrainOnly', () =>
  {
    function buildMap(overrides = {})
    {
      return {
        roundXWithDirection: (x) => x,
        roundYWithDirection: (y) => y,
        isValid: () => true,
        ...overrides,
      };
    }

    it('is false for a step off the edge of the map', () =>
    {
      globalThis.$gameMap = buildMap({ isValid: () => false });
      const character = buildCharacter();
      expect(character.canPassTerrainOnly(0, 0, 2)).toBe(false);
    });

    it('is true unconditionally while through', () =>
    {
      globalThis.$gameMap = buildMap();
      const character = buildCharacter();
      character.isThrough = () => true;
      character.isDebugThrough = () => false;
      expect(character.canPassTerrainOnly(0, 0, 2)).toBe(true);
    });

    it('is true unconditionally while debug-through', () =>
    {
      globalThis.$gameMap = buildMap();
      const character = buildCharacter();
      character.isThrough = () => false;
      character.isDebugThrough = () => true;
      expect(character.canPassTerrainOnly(0, 0, 2)).toBe(true);
    });

    it('defers to the map\'s own terrain passability rules otherwise', () =>
    {
      globalThis.$gameMap = buildMap();
      const character = buildCharacter();
      character.isThrough = () => false;
      character.isDebugThrough = () => false;
      character.isMapPassable = () => true;
      expect(character.canPassTerrainOnly(0, 0, 2)).toBe(true);

      character.isMapPassable = () => false;
      expect(character.canPassTerrainOnly(0, 0, 2)).toBe(false);
    });
  });

  describe('canPassDiagonallyTerrainOnly', () =>
  {
    it('is true via the vertical-then-horizontal path when that corner is clear', () =>
    {
      globalThis.$gameMap = { roundXWithDirection: (x) => x, roundYWithDirection: (y) => y };
      const character = buildCharacter();
      character.canPassTerrainOnly = (x, y, d) => d === 8 || d === 6;

      expect(character.canPassDiagonallyTerrainOnly(0, 0, 6, 8)).toBe(true);
    });

    it('is true via the horizontal-then-vertical path when the other corner is clear', () =>
    {
      // Arrange: the vertical-then-horizontal path is checked first, so failing only its very
      // first call (by call order, since this map stub's identity rounding makes every call's
      // x/y/direction combination otherwise indistinguishable) forces that path to short-circuit,
      // leaving the horizontal-then-vertical path as the one that must succeed.
      globalThis.$gameMap = { roundXWithDirection: (x) => x, roundYWithDirection: (y) => y };
      const character = buildCharacter();
      let callCount = 0;
      character.canPassTerrainOnly = () =>
      {
        callCount += 1;
        return callCount > 1;
      };

      expect(character.canPassDiagonallyTerrainOnly(0, 0, 6, 8)).toBe(true);
    });

    it('is false when both corner-cut paths are blocked', () =>
    {
      globalThis.$gameMap = { roundXWithDirection: (x) => x, roundYWithDirection: (y) => y };
      const character = buildCharacter();
      character.canPassTerrainOnly = () => false;

      expect(character.canPassDiagonallyTerrainOnly(0, 0, 6, 8)).toBe(false);
    });
  });

  describe('canReachTileDelta', () =>
  {
    beforeEach(() =>
    {
      globalThis.$gameMap = {
        roundXWithDirection: (x, d) =>
        {
          if (d === globalThis.J.ABS.Directions.RIGHT) return x + 1;
          if (d === globalThis.J.ABS.Directions.LEFT) return x - 1;
          return x;
        },
        roundYWithDirection: (y, d) =>
        {
          if (d === globalThis.J.ABS.Directions.DOWN) return y + 1;
          if (d === globalThis.J.ABS.Directions.UP) return y - 1;
          return y;
        },
      };
    });

    it('is true immediately when the delta is [0, 0] (nothing to walk)', () =>
    {
      const character = buildCharacter();
      character.x = 0;
      character.y = 0;
      expect(character.canReachTileDelta(0, 0)).toBe(true);
    });

    it('is true when every diagonal and straight step along the path is passable', () =>
    {
      const character = buildCharacter();
      character.x = 0;
      character.y = 0;
      character.canPassDiagonallyTerrainOnly = () => true;
      character.canPassTerrainOnly = () => true;

      expect(character.canReachTileDelta(2, 3)).toBe(true);
    });

    it('is false when a diagonal corner along the path is blocked', () =>
    {
      const character = buildCharacter();
      character.x = 0;
      character.y = 0;
      character.canPassDiagonallyTerrainOnly = () => false;

      expect(character.canReachTileDelta(2, 2)).toBe(false);
    });

    it('finishes out a pure horizontal path with straight steps once the diagonal axis is exhausted (dy=0)', () =>
    {
      const character = buildCharacter();
      character.x = 0;
      character.y = 0;
      character.canPassTerrainOnly = vi.fn(() => true);

      const result = character.canReachTileDelta(3, 0);

      expect(result).toBe(true);
      expect(character.canPassTerrainOnly).toHaveBeenCalledWith(0, 0, globalThis.J.ABS.Directions.RIGHT);
    });

    it('finishes out a pure vertical path with straight steps once the diagonal axis is exhausted (dx=0)', () =>
    {
      const character = buildCharacter();
      character.x = 0;
      character.y = 0;
      character.canPassTerrainOnly = vi.fn(() => true);

      const result = character.canReachTileDelta(0, 3);

      expect(result).toBe(true);
      expect(character.canPassTerrainOnly).toHaveBeenCalledWith(0, 0, globalThis.J.ABS.Directions.DOWN);
    });

    it('is false when a straight finishing step (X axis) is blocked', () =>
    {
      const character = buildCharacter();
      character.x = 0;
      character.y = 0;
      character.canPassTerrainOnly = () => false;

      expect(character.canReachTileDelta(3, 0)).toBe(false);
    });

    it('is false when a straight finishing step (Y axis) is blocked', () =>
    {
      const character = buildCharacter();
      character.x = 0;
      character.y = 0;
      character.canPassTerrainOnly = () => false;

      expect(character.canReachTileDelta(0, 3)).toBe(false);
    });

    it('walks negative deltas (left/up) correctly', () =>
    {
      const character = buildCharacter();
      character.x = 5;
      character.y = 5;
      character.canPassDiagonallyTerrainOnly = () => true;
      character.canPassTerrainOnly = () => true;

      expect(character.canReachTileDelta(-2, -2)).toBe(true);
    });

    it('rounds fractional deltas to whole tiles before probing', () =>
    {
      const character = buildCharacter();
      character.x = 0;
      character.y = 0;
      character.canPassTerrainOnly = vi.fn(() => true);

      character.canReachTileDelta(2.6, 0);

      // rounds to 3 whole tiles- 3 straight-step calls expected.
      expect(character.canPassTerrainOnly).toHaveBeenCalledTimes(3);
    });
  });

  describe('jump / jumpHeight / glideTo', () =>
  {
    it('jump resets arc suppression before delegating to the original logic', () =>
    {
      const character = buildCharacter();
      character._j._abs._noJumpArc = true;
      const originalJump = vi.fn();
      globalThis.J.ABS.Aliased.Game_CharacterBase.set('jump', originalJump);

      character.jump(1, 1);

      expect(character._j._abs._noJumpArc).toBe(false);
      expect(originalJump).toHaveBeenCalledWith(1, 1);
    });

    it('jumpHeight reports 0 while arc suppression is active', () =>
    {
      const character = buildCharacter();
      character._j._abs._noJumpArc = true;
      expect(character.jumpHeight()).toBe(0);
    });

    it('jumpHeight defers to the original logic while arc suppression is inactive', () =>
    {
      const character = buildCharacter();
      character._j._abs._noJumpArc = false;
      globalThis.J.ABS.Aliased.Game_CharacterBase.set('jumpHeight', () => 20);
      expect(character.jumpHeight()).toBe(20);
    });

    it('glideTo jumps then suppresses the arc for that jump only', () =>
    {
      const character = buildCharacter();
      const jumpSpy = vi.spyOn(character, 'jump');

      character.glideTo(2, 3);

      expect(jumpSpy).toHaveBeenCalledWith(2, 3);
      expect(character._j._abs._noJumpArc).toBe(true);
    });
  });
});
//endregion plugins/abs/core/_component/game-character-base-move-speed-and-jump.test.js
