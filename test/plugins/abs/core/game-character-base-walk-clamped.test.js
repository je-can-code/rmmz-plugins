//region plugins/abs/core/game-character-base-walk-clamped.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../../setup/shipped-plugin-vm.js';
import { loadAbsPluginVm } from '../abs-vm.js';

/**
 * Builds a minimal note-source stub carrying the given tag string, backed by the real
 * RPG_Skill prototype so its `jabsIgnoreTerrain`/`jabsKnockback` getters parse for real.
 * @param {object} sandbox
 * @param {string} note
 * @returns {object}
 */
function buildSkillRow(sandbox, note)
{
  const row = Object.create(sandbox.RPG_Skill.prototype);
  row.id = 1;
  row.note = note;
  row.meta = {};
  row._original = function() { return this; };
  return row;
}

describe('J-ABS Game_CharacterBase.walkInDirectionClamped (out/abs/J-ABS.js)', () =>
{
  /** @type {object} */
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadAbsPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    clearRpgManagerCacheInVm(sandbox);
  });

  /**
   * Builds a plain duck-typed "character" carrying only what the walker touches: a position
   * and a controllable passability predicate. The real method is borrowed via `.call()` so no
   * actual Game_CharacterBase construction (and its vanilla RMMZ dependencies) is needed.
   * @param {object} sandbox
   * @param {(x: number, y: number, direction: number) => boolean} canPassImpl
   * @returns {object}
   */
  function buildWalker(sandboxRef, canPassImpl)
  {
    return {
      x: 0,
      y: 0,
      canPass: canPassImpl,
      walkInDirectionClamped: sandboxRef.Game_CharacterBase.prototype.walkInDirectionClamped,
    };
  }

  it('walks the full distance when nothing blocks the way', () =>
  {
    const walker = buildWalker(sandbox, () => true);

    const [ dx, dy ] = walker.walkInDirectionClamped(sandbox.J.ABS.Directions.RIGHT, 5);

    expect([ dx, dy ]).toEqual([ 5, 0 ]);
  });

  it('walks in all four compass directions', () =>
  {
    const { UP, DOWN, LEFT, RIGHT } = sandbox.J.ABS.Directions;

    expect(buildWalker(sandbox, () => true).walkInDirectionClamped(UP, 3)).toEqual([ 0, -3 ]);
    expect(buildWalker(sandbox, () => true).walkInDirectionClamped(DOWN, 3)).toEqual([ 0, 3 ]);
    expect(buildWalker(sandbox, () => true).walkInDirectionClamped(LEFT, 3)).toEqual([ -3, 0 ]);
    expect(buildWalker(sandbox, () => true).walkInDirectionClamped(RIGHT, 3)).toEqual([ 3, 0 ]);
  });

  it('stops at the last passable tile when something blocks midway', () =>
  {
    // block everything from x=3 onward, allowing tiles 1 and 2.
    const walker = buildWalker(sandbox, (x) => x < 3);

    const [ dx, dy ] = walker.walkInDirectionClamped(sandbox.J.ABS.Directions.RIGHT, 10);

    expect([ dx, dy ]).toEqual([ 2, 0 ]);
  });

  it('returns [0, 0] when immediately blocked', () =>
  {
    const walker = buildWalker(sandbox, () => false);

    const [ dx, dy ] = walker.walkInDirectionClamped(sandbox.J.ABS.Directions.DOWN, 5);

    expect([ dx, dy ]).toEqual([ 0, 0 ]);
  });

  it('rounds a fractional distance before walking', () =>
  {
    const walker = buildWalker(sandbox, () => true);

    const [ dx, dy ] = walker.walkInDirectionClamped(sandbox.J.ABS.Directions.RIGHT, 2.6);

    expect([ dx, dy ]).toEqual([ 3, 0 ]);
  });

  it('walks zero tiles when distance is zero', () =>
  {
    const walker = buildWalker(sandbox, () => true);

    const [ dx, dy ] = walker.walkInDirectionClamped(sandbox.J.ABS.Directions.RIGHT, 0);

    expect([ dx, dy ]).toEqual([ 0, 0 ]);
  });

  describe('RPG_Skill.jabsIgnoreTerrain', () =>
  {
    it('is true when the skill carries <ignoreTerrain>', () =>
    {
      const skill = buildSkillRow(sandbox, '<ignoreTerrain>');

      expect(skill.jabsIgnoreTerrain).toBe(true);
    });

    it('is false when the tag is absent', () =>
    {
      const skill = buildSkillRow(sandbox, '<knockback:5>');

      expect(skill.jabsIgnoreTerrain).toBe(false);
    });
  });
});
//endregion plugins/abs/core/game-character-base-walk-clamped.test.js
