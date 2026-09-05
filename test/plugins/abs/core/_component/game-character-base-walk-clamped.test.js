//region plugins/abs/core/_component/game-character-base-walk-clamped.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a minimal note-source stub carrying the given tag string, backed by the real
 * RPG_Skill prototype so its `jabsIgnoreTerrain`/`jabsKnockback` getters parse for real.
 * @param {string} note
 * @returns {object}
 */
function buildSkillRow(note)
{
  const row = Object.create(globalThis.RPG_Skill.prototype);
  row.id = 1;
  row.note = note;
  row.meta = {};
  row._original = function() { return this; };
  return row;
}

/**
 * Builds a plain duck-typed "character" carrying only what the walker touches: a position
 * and a controllable passability predicate. The real method is borrowed via `.call()` so no
 * actual Game_CharacterBase construction (and its vanilla RMMZ dependencies) is needed.
 * @param {(x: number, y: number, direction: number) => boolean} canPassImpl
 * @returns {object}
 */
function buildWalker(canPassImpl)
{
  return {
    x: 0,
    y: 0,
    canPass: canPassImpl,
    walkInDirectionClamped: globalThis.Game_CharacterBase.prototype.walkInDirectionClamped,
  };
}

describe('J-ABS Game_CharacterBase.walkInDirectionClamped (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));
    ({ default: globalThis.RPG_Skill } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Skill.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_CharacterBase.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_CharacterBase.js');

    // patches globalThis.RPG_Skill.prototype with jabsIgnoreTerrain/jabsKnockback getters.
    await import('../../../../../src/plugins/abs/core/database/RPG_Skill.js');
  });

  it('walks the full distance when nothing blocks the way', () =>
  {
    // Arrange
    const walker = buildWalker(() => true);

    // Act
    const [ dx, dy ] = walker.walkInDirectionClamped(globalThis.J.ABS.Directions.RIGHT, 5);

    // Assert
    expect([ dx, dy ]).toEqual([ 5, 0 ]);
  });

  describe('compass directions', () =>
  {
    it('walks up (negative y)', () =>
    {
      // Arrange
      const walker = buildWalker(() => true);

      // Act
      const result = walker.walkInDirectionClamped(globalThis.J.ABS.Directions.UP, 3);

      // Assert
      expect(result).toEqual([ 0, -3 ]);
    });

    it('walks down (positive y)', () =>
    {
      // Arrange
      const walker = buildWalker(() => true);

      // Act
      const result = walker.walkInDirectionClamped(globalThis.J.ABS.Directions.DOWN, 3);

      // Assert
      expect(result).toEqual([ 0, 3 ]);
    });

    it('walks left (negative x)', () =>
    {
      // Arrange
      const walker = buildWalker(() => true);

      // Act
      const result = walker.walkInDirectionClamped(globalThis.J.ABS.Directions.LEFT, 3);

      // Assert
      expect(result).toEqual([ -3, 0 ]);
    });

    it('walks right (positive x)', () =>
    {
      // Arrange
      const walker = buildWalker(() => true);

      // Act
      const result = walker.walkInDirectionClamped(globalThis.J.ABS.Directions.RIGHT, 3);

      // Assert
      expect(result).toEqual([ 3, 0 ]);
    });
  });

  it('stops at the last passable tile when something blocks midway', () =>
  {
    // Arrange- refuse the step out of x=2, making x=3 the wall and x=1/x=2 walkable.
    const walker = buildWalker((x) => x < 2);

    // Act
    const [ dx, dy ] = walker.walkInDirectionClamped(globalThis.J.ABS.Directions.RIGHT, 10);

    // Assert
    expect([ dx, dy ]).toEqual([ 2, 0 ]);
  });

  it('refuses a landing tile whose own entry is blocked, even when the step beyond it is clear', () =>
  {
    // Arrange- only the step out of the origin is refused; every step further along is allowed,
    // which is what a probe taken from the destination tile would have consulted instead.
    const walker = buildWalker((x) => x !== 0);

    // Act
    const [ dx, dy ] = walker.walkInDirectionClamped(globalThis.J.ABS.Directions.RIGHT, 4);

    // Assert
    expect([ dx, dy ]).toEqual([ 0, 0 ]);
  });

  it('probes each step from the tile currently stood on', () =>
  {
    // Arrange- record every origin the walk consults across a three tile trip.
    const probed = [];
    const walker = buildWalker((x, y, direction) =>
    {
      probed.push([ x, y, direction ]);
      return true;
    });

    // Act
    walker.walkInDirectionClamped(globalThis.J.ABS.Directions.DOWN, 3);

    // Assert
    expect(probed).toEqual([
      [ 0, 0, globalThis.J.ABS.Directions.DOWN ],
      [ 0, 1, globalThis.J.ABS.Directions.DOWN ],
      [ 0, 2, globalThis.J.ABS.Directions.DOWN ],
    ]);
  });

  it('returns [0, 0] when immediately blocked', () =>
  {
    // Arrange
    const walker = buildWalker(() => false);

    // Act
    const [ dx, dy ] = walker.walkInDirectionClamped(globalThis.J.ABS.Directions.DOWN, 5);

    // Assert
    expect([ dx, dy ]).toEqual([ 0, 0 ]);
  });

  it('backs off and returns [0, 0] when immediately blocked moving up', () =>
  {
    // Arrange
    const walker = buildWalker(() => false);

    // Act
    const [ dx, dy ] = walker.walkInDirectionClamped(globalThis.J.ABS.Directions.UP, 5);

    // Assert
    expect([ dx, dy ]).toEqual([ 0, 0 ]);
  });

  it('backs off and returns [0, 0] when immediately blocked moving left', () =>
  {
    // Arrange
    const walker = buildWalker(() => false);

    // Act
    const [ dx, dy ] = walker.walkInDirectionClamped(globalThis.J.ABS.Directions.LEFT, 5);

    // Assert
    expect([ dx, dy ]).toEqual([ 0, 0 ]);
  });

  it('rounds a fractional distance before walking', () =>
  {
    // Arrange
    const walker = buildWalker(() => true);

    // Act
    const [ dx, dy ] = walker.walkInDirectionClamped(globalThis.J.ABS.Directions.RIGHT, 2.6);

    // Assert
    expect([ dx, dy ]).toEqual([ 3, 0 ]);
  });

  it('walks zero tiles when distance is zero', () =>
  {
    // Arrange
    const walker = buildWalker(() => true);

    // Act
    const [ dx, dy ] = walker.walkInDirectionClamped(globalThis.J.ABS.Directions.RIGHT, 0);

    // Assert
    expect([ dx, dy ]).toEqual([ 0, 0 ]);
  });

  describe('RPG_Skill.jabsIgnoreTerrain', () =>
  {
    it('is true when the skill carries <ignoreTerrain>', () =>
    {
      // Arrange
      const skill = buildSkillRow('<ignoreTerrain>');

      // Act
      const result = skill.jabsIgnoreTerrain;

      // Assert
      expect(result).toBe(true);
    });

    it('is false when the tag is absent', () =>
    {
      // Arrange
      const skill = buildSkillRow('<knockback:5>');

      // Act
      const result = skill.jabsIgnoreTerrain;

      // Assert
      expect(result).toBe(false);
    });
  });
});
//endregion plugins/abs/core/_component/game-character-base-walk-clamped.test.js
