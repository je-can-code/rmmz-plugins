//region plugins/abs/core/_component/game-action-damage-rate-pierce.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a minimal skill/note-source stub with the given notetag string.
 * @param {string} note
 * @returns {object}
 */
function buildSkill(note)
{
  const skill = Object.create(globalThis.RPG_Skill.prototype);
  skill.id = 1;
  skill.note = note;
  skill.meta = {};
  skill._original = function() { return this; };
  return skill;
}

/**
 * Builds a minimal caster stub whose getAllNotes returns the given note sources.
 * @param {object[]} noteSources
 * @returns {object}
 */
function buildCaster(noteSources = [])
{
  return {
    getAllNotes()
    {
      return noteSources;
    },
  };
}

/**
 * Builds a Game_Action stub cast by the given caster, landing as the given hit type.
 * @param {object} caster
 * @param {string} hitType Either 'physical' or 'magical'.
 * @returns {object}
 */
function buildAction(caster, hitType)
{
  const action = Object.create(globalThis.Game_Action.prototype);
  action.subject = () => caster;
  action.isPhysical = () => hitType === 'physical';
  action.isMagical = () => hitType === 'magical';
  return action;
}

/**
 * Builds a target with the given damage rates, carrying one active state per list of type classifiers.
 * @param {{ pdr: number, mdr: number }} rates
 * @param {string[][]} stateTypeLists
 * @returns {object}
 */
function buildTarget(rates, stateTypeLists)
{
  return {
    pdr: rates.pdr,
    mdr: rates.mdr,
    states: () => stateTypeLists.map(types => ({ types: () => types })),
  };
}

describe('J-ABS Game_Action damage-rate pierce (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));
    ({ default: globalThis.RPG_Skill } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Skill.js'));

    // J-Base defines the damage-rate seam J-ABS extends; without it the alias would capture nothing.
    await import('../../../../../src/plugins/_base/core/objects/Game_Action.js');

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Action.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Action.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  describe('damageRateAgainst, as J-ABS extends it', () =>
  {
    it('leaves a heal at the target\'s own rate, even against a target it would pierce', () =>
    {
      // Arrange
      const caster = buildCaster([ buildSkill('<pierceDamageRateIfStateType:cc>') ]);
      const action = buildAction(caster, 'physical');
      const target = buildTarget({ pdr: 0.5, mdr: 0.5 }, [ [ 'cc' ] ]);

      // Act
      const result = action.damageRateAgainst(target, false);

      // Assert
      expect(result).toBe(0.5);
    });

    it('leaves a resisted rate alone when the caster carries no pierce tag', () =>
    {
      // Arrange
      const caster = buildCaster([ buildSkill('<bonusDamageIfStateType:[cc, 20]>') ]);
      const action = buildAction(caster, 'physical');
      const target = buildTarget({ pdr: 0.5, mdr: 0.5 }, [ [ 'cc' ] ]);

      // Act
      const result = action.damageRateAgainst(target, true);

      // Assert
      expect(result).toBe(0.5);
    });

    it('lifts a resisted magical rate to 1 against a target carrying a state of the pierced type', () =>
    {
      // Arrange
      const caster = buildCaster([ buildSkill('<pierceDamageRateIfStateType:cc>') ]);
      const action = buildAction(caster, 'magical');
      const target = buildTarget({ pdr: 2, mdr: 0.25 }, [ [ 'negative', 'cc' ] ]);

      // Act
      const result = action.damageRateAgainst(target, true);

      // Assert
      expect(result).toBe(1);
    });

    it('keeps a vulnerable rate above 1 when pierced', () =>
    {
      // Arrange
      const caster = buildCaster([ buildSkill('<pierceDamageRateIfStateType:cc>') ]);
      const action = buildAction(caster, 'physical');
      const target = buildTarget({ pdr: 1.5, mdr: 0.5 }, [ [ 'cc' ] ]);

      // Act
      const result = action.damageRateAgainst(target, true);

      // Assert
      expect(result).toBe(1.5);
    });
  });

  describe('isDamageRatePierced', () =>
  {
    it('is false when the caster carries no pierce tag', () =>
    {
      // Arrange
      const caster = buildCaster([ buildSkill('<bonusDamageIfStateType:[cc, 20]>') ]);
      const action = buildAction(caster, 'physical');
      const target = buildTarget({ pdr: 0.5, mdr: 0.5 }, [ [ 'cc' ] ]);

      // Act
      const result = action.isDamageRatePierced(target);

      // Assert
      expect(result).toBe(false);
    });

    it('is false when the target carries only states of other types', () =>
    {
      // Arrange
      const caster = buildCaster([ buildSkill('<pierceDamageRateIfStateType:cc>') ]);
      const action = buildAction(caster, 'physical');
      const target = buildTarget({ pdr: 0.5, mdr: 0.5 }, [ [ 'poison' ], [ 'negative', 'slow' ] ]);

      // Act
      const result = action.isDamageRatePierced(target);

      // Assert
      expect(result).toBe(false);
    });

    it('is true when the target carries a state of the pierced type, matched case-insensitively', () =>
    {
      // Arrange
      const caster = buildCaster([ buildSkill('<pierceDamageRateIfStateType:cc>') ]);
      const action = buildAction(caster, 'physical');
      const target = buildTarget({ pdr: 0.5, mdr: 0.5 }, [ [ 'poison' ], [ 'CC' ] ]);

      // Act
      const result = action.isDamageRatePierced(target);

      // Assert
      expect(result).toBe(true);
    });

    it('is true when any one of several pierce tags names a type the target carries', () =>
    {
      // Arrange
      const caster = buildCaster([
        buildSkill('<pierceDamageRateIfStateType:poison>'),
        buildSkill('<pierceDamageRateIfStateType:cc>'),
      ]);
      const action = buildAction(caster, 'physical');
      const target = buildTarget({ pdr: 0.5, mdr: 0.5 }, [ [ 'cc' ] ]);

      // Act
      const result = action.isDamageRatePierced(target);

      // Assert
      expect(result).toBe(true);
    });
  });
});
//endregion plugins/abs/core/_component/game-action-damage-rate-pierce.test.js