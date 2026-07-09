//region plugins/abs/ext/tools/pull-forward.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../../../setup/shipped-plugin-vm.js';
import { loadAbsToolsPluginVm } from './tools-vm.js';

/**
 * Builds a minimal note-source stub carrying the given tag string, backed by the real
 * RPG_Skill prototype so `jabsPullForward`/`jabsIgnoreTerrain`/`jabsRespectTerrain` parse for real.
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

/**
 * Builds a plain duck-typed "character" carrying only what pull-forward touches: a position,
 * an effective radius, a controllable passability predicate, and jump/isJumping tracking.
 * @param {object} sandbox
 * @param {object} [overrides]
 * @returns {object}
 */
function buildCharacter(sandbox, overrides = {})
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
    walkInDirectionClamped: sandbox.Game_CharacterBase.prototype.walkInDirectionClamped,
    ...overrides,
  };

  return character;
}

/**
 * Builds a plain duck-typed "JABS_Battler" carrying only what pull-forward touches.
 * @param {object} character
 * @param {object} [battlerNotes]
 * @returns {object}
 */
function buildJabsBattler(sandbox, character, notes = [])
{
  return {
    getCharacter: () => character,
    getX: () => character.x,
    getY: () => character.y,
    getBattler: () => ({
      getAllNotes: () => notes.map(note => buildSkillRow(sandbox, note)),
    }),
    resolvePullVector: sandbox.JABS_Battler.prototype.resolvePullVector,
    pullToCaster: sandbox.JABS_Battler.prototype.pullToCaster,
  };
}

describe('J-ABS-Tools pull-forward (out/abs/ext/J-ABS-Tools.js)', () =>
{
  /** @type {object} */
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadAbsToolsPluginVm(sandbox);

    // the shared harness's Math stub is deliberately minimal (no sqrt) for determinism
    // elsewhere; resolvePullVector needs real sqrt, so patch it in for this sandbox only.
    sandbox.Math.sqrt = Math.sqrt;
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    clearRpgManagerCacheInVm(sandbox);
  });

  describe('RPG_Skill tag getters', () =>
  {
    it('jabsPullForward reads the tile magnitude', () =>
    {
      const skill = buildSkillRow(sandbox, '<pullForward:4>');

      expect(skill.jabsPullForward).toBe(4);
    });

    it('jabsPullForward is null when absent', () =>
    {
      const skill = buildSkillRow(sandbox, '<knockback:4>');

      expect(skill.jabsPullForward).toBeNull();
    });

    it('jabsRespectTerrain is true only when tagged', () =>
    {
      expect(buildSkillRow(sandbox, '<respectTerrain>').jabsRespectTerrain).toBe(true);
      expect(buildSkillRow(sandbox, '<gapClose:foo>').jabsRespectTerrain).toBe(false);
    });
  });

  describe('resolvePullVector', () =>
  {
    it('points the unit vector from the target toward the caster', () =>
    {
      const target = buildCharacter(sandbox, { x: 0, y: 0 });
      const jabsTarget = buildJabsBattler(sandbox, target);

      const caster = buildCharacter(sandbox, { x: 5, y: 0 });
      const jabsCaster = buildJabsBattler(sandbox, caster);

      const { unitX, unitY } = jabsTarget.resolvePullVector(jabsCaster);

      expect(unitX).toBeCloseTo(1);
      expect(unitY).toBeCloseTo(0);
    });

    it('clamps maxPullDistance short of the caster edge, never past it', () =>
    {
      const target = buildCharacter(sandbox, { x: 0, y: 0, getEffectiveRadius: () => 0.5 });
      const jabsTarget = buildJabsBattler(sandbox, target);

      const caster = buildCharacter(sandbox, { x: 3, y: 0, getEffectiveRadius: () => 0.5 });
      const jabsCaster = buildJabsBattler(sandbox, caster);

      const { maxPullDistance } = jabsTarget.resolvePullVector(jabsCaster);

      // distance 3, minus both 0.5 radii, minus the 0.05 buffer.
      expect(maxPullDistance).toBeCloseTo(1.95);
    });

    it('never returns a negative maxPullDistance when already adjacent', () =>
    {
      const target = buildCharacter(sandbox, { x: 0, y: 0, getEffectiveRadius: () => 1 });
      const jabsTarget = buildJabsBattler(sandbox, target);

      const caster = buildCharacter(sandbox, { x: 1, y: 0, getEffectiveRadius: () => 1 });
      const jabsCaster = buildJabsBattler(sandbox, caster);

      const { maxPullDistance } = jabsTarget.resolvePullVector(jabsCaster);

      expect(maxPullDistance).toBe(0);
    });
  });

  describe('pullToCaster', () =>
  {
    it('does nothing when the skill has no <pullForward> tag', () =>
    {
      const target = buildCharacter(sandbox, { x: 0, y: 0 });
      const jabsTarget = buildJabsBattler(sandbox, target);
      const jabsCaster = buildJabsBattler(sandbox, buildCharacter(sandbox, { x: 5, y: 0 }));

      const action = { getBaseSkill: () => buildSkillRow(sandbox, '<knockback:5>') };

      jabsTarget.pullToCaster(action, jabsCaster);

      expect(target.lastJump).toBeNull();
    });

    it('does nothing when already being displaced', () =>
    {
      const target = buildCharacter(sandbox, { x: 0, y: 0, _jumping: true });
      const jabsTarget = buildJabsBattler(sandbox, target);
      const jabsCaster = buildJabsBattler(sandbox, buildCharacter(sandbox, { x: 5, y: 0 }));

      const action = { getBaseSkill: () => buildSkillRow(sandbox, '<pullForward:3>') };

      jabsTarget.pullToCaster(action, jabsCaster);

      expect(target.lastJump).toBeNull();
    });

    it('pulls the target toward the caster by the tagged magnitude', () =>
    {
      const target = buildCharacter(sandbox, { x: 0, y: 0 });
      const jabsTarget = buildJabsBattler(sandbox, target);
      const jabsCaster = buildJabsBattler(sandbox, buildCharacter(sandbox, { x: 10, y: 0 }));

      const action = { getBaseSkill: () => buildSkillRow(sandbox, '<pullForward:3>') };

      jabsTarget.pullToCaster(action, jabsCaster);

      expect(target.lastJump).toEqual([ 3, 0 ]);
    });

    it('clamps the pull so the target cannot overshoot past the caster', () =>
    {
      // caster is only 2 tiles away with nonzero hitbox radii on both sides; a pull of 50
      // must stop flush against the caster's edge, never reaching or passing its tile.
      const target = buildCharacter(sandbox, { x: 0, y: 0, getEffectiveRadius: () => 0.5 });
      const jabsTarget = buildJabsBattler(sandbox, target);
      const caster = buildCharacter(sandbox, { x: 2, y: 0, getEffectiveRadius: () => 0.5 });
      const jabsCaster = buildJabsBattler(sandbox, caster);

      const action = { getBaseSkill: () => buildSkillRow(sandbox, '<pullForward:50>') };

      jabsTarget.pullToCaster(action, jabsCaster);

      // distance 2, minus both 0.5 radii, minus the 0.05 buffer = 0.95, rounded to 1 tile.
      expect(target.lastJump).toEqual([ 1, 0 ]);
    });

    it('is dampened by knockbackResist on the target', () =>
    {
      const target = buildCharacter(sandbox, { x: 0, y: 0 });
      const jabsTarget = buildJabsBattler(sandbox, target, [ '<knockbackResist:50>' ]);
      const jabsCaster = buildJabsBattler(sandbox, buildCharacter(sandbox, { x: 10, y: 0 }));

      const action = { getBaseSkill: () => buildSkillRow(sandbox, '<pullForward:4>') };

      jabsTarget.pullToCaster(action, jabsCaster);

      expect(target.lastJump).toEqual([ 2, 0 ]);
    });

    it('is fully negated by 100 knockbackResist', () =>
    {
      const target = buildCharacter(sandbox, { x: 0, y: 0 });
      const jabsTarget = buildJabsBattler(sandbox, target, [ '<knockbackResist:100>' ]);
      const jabsCaster = buildJabsBattler(sandbox, buildCharacter(sandbox, { x: 10, y: 0 }));

      const action = { getBaseSkill: () => buildSkillRow(sandbox, '<pullForward:4>') };

      jabsTarget.pullToCaster(action, jabsCaster);

      expect(target.lastJump).toBeNull();
    });

    it('stops at the last passable tile by default', () =>
    {
      const target = buildCharacter(sandbox, {
        x: 0,
        y: 0,
        canPass: (x) => x < 2,
      });
      const jabsTarget = buildJabsBattler(sandbox, target);
      const jabsCaster = buildJabsBattler(sandbox, buildCharacter(sandbox, { x: 10, y: 0 }));

      const action = { getBaseSkill: () => buildSkillRow(sandbox, '<pullForward:5>') };

      jabsTarget.pullToCaster(action, jabsCaster);

      expect(target.lastJump).toEqual([ 1, 0 ]);
    });

    it('sails through blocked tiles when the skill carries <ignoreTerrain>', () =>
    {
      const target = buildCharacter(sandbox, {
        x: 0,
        y: 0,
        canPass: () => false,
      });
      const jabsTarget = buildJabsBattler(sandbox, target);
      const jabsCaster = buildJabsBattler(sandbox, buildCharacter(sandbox, { x: 10, y: 0 }));

      const action = { getBaseSkill: () => buildSkillRow(sandbox, '<pullForward:5>\n<ignoreTerrain>') };

      jabsTarget.pullToCaster(action, jabsCaster);

      expect(target.lastJump).toEqual([ 5, 0 ]);
    });
  });
});
//endregion plugins/abs/ext/tools/pull-forward.test.js
