//region plugins/abs/ext/tools/_component/pull-forward.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installAbsHostGlobals, setPluginContextToJAbs, setPluginContextToJBase } from '../../../_component/fixtures/install-abs-host-globals.js';
import { setPluginContextToJabsTools } from './fixtures/install-abs-tools-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

/**
 * Builds a minimal note-source stub carrying the given tag string, backed by the real
 * RPG_Skill prototype so `jabsPullForward`/`jabsIgnoreTerrain`/`jabsRespectTerrain` parse for real.
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
 * Builds a plain duck-typed "character" carrying only what pull-forward touches: a position,
 * an effective radius, a controllable passability predicate, and jump/isJumping tracking.
 * @param {object} [overrides]
 * @returns {object}
 */
function buildCharacter(overrides = {})
{
  const character = {
    x: 0,
    y: 0,
    _jumping: false,
    lastJump: null,
    getEffectiveRadius: () => 0,
    isJumping()
    {
      return this._jumping;
    },
    jump(dx, dy)
    {
      this.lastJump = [ dx, dy ];
      this.x += dx;
      this.y += dy;
    },
    canPass: () => true,
    deltaXFrom(x0)
    {
      return this.x - x0;
    },
    deltaYFrom(y0)
    {
      return this.y - y0;
    },
    walkInDirectionClamped: globalThis.Game_CharacterBase.prototype.walkInDirectionClamped,
    ...overrides,
  };

  return character;
}

/**
 * Builds a plain duck-typed "JABS_Battler" carrying only what pull-forward touches.
 * @param {object} character
 * @param {string[]} [notes]
 * @returns {object}
 */
function buildJabsBattler(character, notes = [])
{
  return {
    getCharacter: () => character,
    getX: () => character.x,
    getY: () => character.y,
    getBattler: () => ({
      getAllNotes: () => notes.map(note => buildSkillRow(note)),
    }),
    resolvePullVector: globalThis.JABS_Battler.prototype.resolvePullVector,
    pullToCaster: globalThis.JABS_Battler.prototype.pullToCaster,
  };
}

describe('J-ABS-Tools pull-forward (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../../src/plugins/_base/core/managers/RPGManager.js'));
    ({ default: globalThis.RPG_Skill } = await import('../../../../../../src/plugins/_base/core/database/implementations/RPG_Skill.js'));

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    await import('../../../../../../src/plugins/abs/core/objects/Game_CharacterBase.js');
    await import('../../../../../../src/plugins/abs/core/database/RPG_Skill.js');
    ({ default: globalThis.JABS_Battler } = await import('../../../../../../src/plugins/abs/core/models/JABS_Battler.js'));

    // J-ABS-Tools requires its own plugin parameters (grabThrowEnabled/directionFixAlways).
    installPluginManagerWithParams(globalThis, 'J-ABS-Tools', {});

    setPluginContextToJabsTools();
    await import('../../../../../../src/plugins/abs/ext/tools/_metadata/initialization.js');

    // patches globalThis.JABS_Battler.prototype with resolvePullVector/pullToCaster, no vm involved.
    await import('../../../../../../src/plugins/abs/ext/tools/_models/JABS_Battler.js');

    // patches globalThis.RPG_Skill.prototype with jabsPullForward/jabsRespectTerrain getters.
    await import('../../../../../../src/plugins/abs/ext/tools/database/RPG_Skill.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();

    // resolvePullVector needs real sqrt; the shared fixture's Math stub omits it for determinism
    // elsewhere, so patch it in for this file only.
    globalThis.Math.sqrt = Math.sqrt;
  });

  describe('RPG_Skill tag getters', () =>
  {
    it('jabsPullForward reads the tile magnitude', () =>
    {
      // Arrange
      const skill = buildSkillRow('<pullForward:4>');

      // Act
      const result = skill.jabsPullForward;

      // Assert
      expect(result).toBe(4);
    });

    it('jabsPullForward is null when absent', () =>
    {
      // Arrange
      const skill = buildSkillRow('<knockback:4>');

      // Act
      const result = skill.jabsPullForward;

      // Assert
      expect(result).toBeNull();
    });

    it('jabsRespectTerrain is true when tagged', () =>
    {
      // Arrange
      const skill = buildSkillRow('<respectTerrain>');

      // Act
      const result = skill.jabsRespectTerrain;

      // Assert
      expect(result).toBe(true);
    });

    it('jabsRespectTerrain is false when not tagged', () =>
    {
      // Arrange
      const skill = buildSkillRow('<gapClose:foo>');

      // Act
      const result = skill.jabsRespectTerrain;

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('resolvePullVector', () =>
  {
    it('points the unit vector from the target toward the caster', () =>
    {
      // Arrange
      const target = buildCharacter({ x: 0, y: 0 });
      const jabsTarget = buildJabsBattler(target);
      const caster = buildCharacter({ x: 5, y: 0 });
      const jabsCaster = buildJabsBattler(caster);

      // Act
      const { unitX, unitY } = jabsTarget.resolvePullVector(jabsCaster);

      // Assert
      expect(unitX).toBeCloseTo(1);
      expect(unitY).toBeCloseTo(0);
    });

    it('clamps maxPullDistance short of the caster edge, never past it', () =>
    {
      // Arrange- distance 3, minus both 0.5 radii, minus the 0.05 buffer.
      const target = buildCharacter({ x: 0, y: 0, getEffectiveRadius: () => 0.5 });
      const jabsTarget = buildJabsBattler(target);
      const caster = buildCharacter({ x: 3, y: 0, getEffectiveRadius: () => 0.5 });
      const jabsCaster = buildJabsBattler(caster);

      // Act
      const { maxPullDistance } = jabsTarget.resolvePullVector(jabsCaster);

      // Assert
      expect(maxPullDistance).toBeCloseTo(1.95);
    });

    it('never returns a negative maxPullDistance when already adjacent', () =>
    {
      // Arrange
      const target = buildCharacter({ x: 0, y: 0, getEffectiveRadius: () => 1 });
      const jabsTarget = buildJabsBattler(target);
      const caster = buildCharacter({ x: 1, y: 0, getEffectiveRadius: () => 1 });
      const jabsCaster = buildJabsBattler(caster);

      // Act
      const { maxPullDistance } = jabsTarget.resolvePullVector(jabsCaster);

      // Assert
      expect(maxPullDistance).toBe(0);
    });

    it('yields a zero unit vector when the target and caster share the exact same tile (zero magnitude)', () =>
    {
      // Arrange
      const target = buildCharacter({ x: 3, y: 3 });
      const jabsTarget = buildJabsBattler(target);
      const caster = buildCharacter({ x: 3, y: 3 });
      const jabsCaster = buildJabsBattler(caster);

      // Act
      const { unitX, unitY } = jabsTarget.resolvePullVector(jabsCaster);

      // Assert
      expect(unitX).toBe(0);
      expect(unitY).toBe(0);
    });
  });

  describe('pullToCaster', () =>
  {
    it('does nothing when the skill has no <pullForward> tag', () =>
    {
      // Arrange
      const target = buildCharacter({ x: 0, y: 0 });
      const jabsTarget = buildJabsBattler(target);
      const jabsCaster = buildJabsBattler(buildCharacter({ x: 5, y: 0 }));
      const action = { getBaseSkill: () => buildSkillRow('<knockback:5>') };

      // Act
      jabsTarget.pullToCaster(action, jabsCaster);

      // Assert
      expect(target.lastJump).toBeNull();
    });

    it('does nothing when already being displaced', () =>
    {
      // Arrange
      const target = buildCharacter({ x: 0, y: 0, _jumping: true });
      const jabsTarget = buildJabsBattler(target);
      const jabsCaster = buildJabsBattler(buildCharacter({ x: 5, y: 0 }));
      const action = { getBaseSkill: () => buildSkillRow('<pullForward:3>') };

      // Act
      jabsTarget.pullToCaster(action, jabsCaster);

      // Assert
      expect(target.lastJump).toBeNull();
    });

    it('pulls the target toward the caster by the tagged magnitude', () =>
    {
      // Arrange
      const target = buildCharacter({ x: 0, y: 0 });
      const jabsTarget = buildJabsBattler(target);
      const jabsCaster = buildJabsBattler(buildCharacter({ x: 10, y: 0 }));
      const action = { getBaseSkill: () => buildSkillRow('<pullForward:3>') };

      // Act
      jabsTarget.pullToCaster(action, jabsCaster);

      // Assert
      expect(target.lastJump).toEqual([ 3, 0 ]);
    });

    it('clamps the pull so the target cannot overshoot past the caster', () =>
    {
      // Arrange- caster is only 2 tiles away with nonzero hitbox radii on both sides; a pull of 50
      // must stop flush against the caster's edge, never reaching or passing its tile.
      // distance 2, minus both 0.5 radii, minus the 0.05 buffer = 0.95, rounded to 1 tile.
      const target = buildCharacter({ x: 0, y: 0, getEffectiveRadius: () => 0.5 });
      const jabsTarget = buildJabsBattler(target);
      const caster = buildCharacter({ x: 2, y: 0, getEffectiveRadius: () => 0.5 });
      const jabsCaster = buildJabsBattler(caster);
      const action = { getBaseSkill: () => buildSkillRow('<pullForward:50>') };

      // Act
      jabsTarget.pullToCaster(action, jabsCaster);

      // Assert
      expect(target.lastJump).toEqual([ 1, 0 ]);
    });

    it('is dampened by knockbackResist on the target', () =>
    {
      // Arrange
      const target = buildCharacter({ x: 0, y: 0 });
      const jabsTarget = buildJabsBattler(target, [ '<knockbackResist:50>' ]);
      const jabsCaster = buildJabsBattler(buildCharacter({ x: 10, y: 0 }));
      const action = { getBaseSkill: () => buildSkillRow('<pullForward:4>') };

      // Act
      jabsTarget.pullToCaster(action, jabsCaster);

      // Assert
      expect(target.lastJump).toEqual([ 2, 0 ]);
    });

    it('is fully negated by 100 knockbackResist', () =>
    {
      // Arrange
      const target = buildCharacter({ x: 0, y: 0 });
      const jabsTarget = buildJabsBattler(target, [ '<knockbackResist:100>' ]);
      const jabsCaster = buildJabsBattler(buildCharacter({ x: 10, y: 0 }));
      const action = { getBaseSkill: () => buildSkillRow('<pullForward:4>') };

      // Act
      jabsTarget.pullToCaster(action, jabsCaster);

      // Assert
      expect(target.lastJump).toBeNull();
    });

    it('stops at the last passable tile by default', () =>
    {
      // Arrange
      const target = buildCharacter({ x: 0, y: 0, canPass: (x) => x < 2 });
      const jabsTarget = buildJabsBattler(target);
      const jabsCaster = buildJabsBattler(buildCharacter({ x: 10, y: 0 }));
      const action = { getBaseSkill: () => buildSkillRow('<pullForward:5>') };

      // Act
      jabsTarget.pullToCaster(action, jabsCaster);

      // Assert
      expect(target.lastJump).toEqual([ 1, 0 ]);
    });

    it('sails through blocked tiles when the skill carries <ignoreTerrain>', () =>
    {
      // Arrange
      const target = buildCharacter({ x: 0, y: 0, canPass: () => false });
      const jabsTarget = buildJabsBattler(target);
      const jabsCaster = buildJabsBattler(buildCharacter({ x: 10, y: 0 }));
      const action = { getBaseSkill: () => buildSkillRow('<pullForward:5>\n<ignoreTerrain>') };

      // Act
      jabsTarget.pullToCaster(action, jabsCaster);

      // Assert
      expect(target.lastJump).toEqual([ 5, 0 ]);
    });

    it('does nothing when already flush against the caster (clamped distance is zero)', () =>
    {
      // Arrange
      const target = buildCharacter({ x: 0, y: 0, getEffectiveRadius: () => 1 });
      const jabsTarget = buildJabsBattler(target);
      const jabsCaster = buildJabsBattler(buildCharacter({ x: 1, y: 0, getEffectiveRadius: () => 1 }));
      const action = { getBaseSkill: () => buildSkillRow('<pullForward:10>') };

      // Act
      jabsTarget.pullToCaster(action, jabsCaster);

      // Assert
      expect(target.lastJump).toBeNull();
    });

    it('pulls horizontally leftward when the caster is to the left', () =>
    {
      // Arrange
      const target = buildCharacter({ x: 10, y: 0 });
      const jabsTarget = buildJabsBattler(target);
      const jabsCaster = buildJabsBattler(buildCharacter({ x: 0, y: 0 }));
      const action = { getBaseSkill: () => buildSkillRow('<pullForward:3>') };

      // Act
      jabsTarget.pullToCaster(action, jabsCaster);

      // Assert
      expect(target.lastJump).toEqual([ -3, 0 ]);
    });

    it('pulls vertically downward when the caster is below and vertical dominates', () =>
    {
      // Arrange
      const target = buildCharacter({ x: 0, y: 0 });
      const jabsTarget = buildJabsBattler(target);
      const jabsCaster = buildJabsBattler(buildCharacter({ x: 0, y: 10 }));
      const action = { getBaseSkill: () => buildSkillRow('<pullForward:3>') };

      // Act
      jabsTarget.pullToCaster(action, jabsCaster);

      // Assert
      expect(target.lastJump).toEqual([ 0, 3 ]);
    });

    it('pulls vertically upward when the caster is above and vertical dominates', () =>
    {
      // Arrange
      const target = buildCharacter({ x: 0, y: 10 });
      const jabsTarget = buildJabsBattler(target);
      const jabsCaster = buildJabsBattler(buildCharacter({ x: 0, y: 0 }));
      const action = { getBaseSkill: () => buildSkillRow('<pullForward:3>') };

      // Act
      jabsTarget.pullToCaster(action, jabsCaster);

      // Assert
      expect(target.lastJump).toEqual([ 0, -3 ]);
    });
  });
});
//endregion plugins/abs/ext/tools/_component/pull-forward.test.js
