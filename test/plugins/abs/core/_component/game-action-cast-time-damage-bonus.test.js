//region plugins/abs/core/_component/game-action-cast-time-damage-bonus.test.js
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
function buildSkill(note = '')
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
 * Builds a minimal Game_Action stub backed by the given caster and skill.
 * @param {object} caster
 * @param {object} skill
 * @returns {object}
 */
function buildAction(caster, skill)
{
  const action = Object.create(globalThis.Game_Action.prototype);
  action.subject = () => caster;
  action.item = () => skill;
  action.isSkill = () => true;
  return action;
}

describe('J-ABS Game_Action cast time damage bonus (direct src import)', () =>
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

    // patches globalThis.Game_Action.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Action.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  describe('setResolvedCastTimeFrames / getResolvedCastTimeFrames', () =>
  {
    it('is 0 before anything is ever stamped', () =>
    {
      const action = buildAction(buildCaster(), buildSkill());
      expect(action.getResolvedCastTimeFrames()).toBe(0);
    });

    it('rounds and clamps the stamped value to never go below zero', () =>
    {
      // Arrange
      const action = buildAction(buildCaster(), buildSkill());

      // Act
      action.setResolvedCastTimeFrames(-45.6);

      // Assert
      expect(action.getResolvedCastTimeFrames()).toBe(0);
    });

    it('rounds a positive stamped value to the nearest frame', () =>
    {
      // Arrange
      const action = buildAction(buildCaster(), buildSkill());

      // Act
      action.setResolvedCastTimeFrames(30.6);

      // Assert
      expect(action.getResolvedCastTimeFrames()).toBe(31);
    });
  });

  describe('calculateThisCastTimeDamageBonusPctPerSec', () =>
  {
    it('sums the tag from the executing skill\'s own note', () =>
    {
      const action = buildAction(buildCaster(), buildSkill('<thisCastTimeDamageBonus:20>'));
      expect(action.calculateThisCastTimeDamageBonusPctPerSec()).toBe(20);
    });

    it('is 0 with no matching tag', () =>
    {
      const action = buildAction(buildCaster(), buildSkill(''));
      expect(action.calculateThisCastTimeDamageBonusPctPerSec()).toBe(0);
    });
  });

  describe('calculateGeneralCastTimeDamageBonusPctPerSec', () =>
  {
    it('sums the tag across the caster\'s full note stack', () =>
    {
      const caster = buildCaster([ buildSkill('<castTimeDamageBonus:10>'), buildSkill('<castTimeDamageBonus:5>') ]);
      const action = buildAction(caster, buildSkill(''));
      expect(action.calculateGeneralCastTimeDamageBonusPctPerSec()).toBe(15);
    });

    it('is 0 with no matching tags', () =>
    {
      const action = buildAction(buildCaster([]), buildSkill(''));
      expect(action.calculateGeneralCastTimeDamageBonusPctPerSec()).toBe(0);
    });
  });

  describe('applyCastTimeDamageBonus', () =>
  {
    it('returns non-positive damage unchanged without evaluating anything else', () =>
    {
      // Arrange
      const action = buildAction(buildCaster(), buildSkill(''));
      action.isSkill = vi.fn();

      // Act & Assert
      expect(action.applyCastTimeDamageBonus(0)).toBe(0);
      expect(action.applyCastTimeDamageBonus(-5)).toBe(-5);
      expect(action.isSkill).not.toHaveBeenCalled();
    });

    it('returns damage unchanged when the action is not a skill', () =>
    {
      // Arrange
      const action = buildAction(buildCaster(), buildSkill(''));
      action.isSkill = () => false;

      // Act & Assert
      expect(action.applyCastTimeDamageBonus(100)).toBe(100);
    });

    it.each([ 0, 3, 4 ])('returns damage unchanged for a disqualifying damage type (%i)', (damageType) =>
    {
      // Arrange
      const action = buildAction(buildCaster(), buildSkill(''));
      action.item = () => ({ damage: { type: damageType } });

      // Act & Assert
      expect(action.applyCastTimeDamageBonus(100)).toBe(100);
    });

    it.each([ 1, 2 ])('qualifies hp/mp damage types (%i) to continue past the type gate', (damageType) =>
    {
      // Arrange
      const action = buildAction(buildCaster(), buildSkill(''));
      action.item = () => ({ damage: { type: damageType } });
      action.getResolvedCastTimeFrames = () => 0;

      // Act & Assert- instant (0 cast frames) still returns unchanged, but via the later gate.
      expect(action.applyCastTimeDamageBonus(100)).toBe(100);
    });

    it('returns damage unchanged when the resolved cast duration is instant (0 frames)', () =>
    {
      // Arrange
      const action = buildAction(buildCaster(), buildSkill(''));
      action.item = () => ({ damage: { type: 1 } });
      action.getResolvedCastTimeFrames = () => 0;

      // Act & Assert
      expect(action.applyCastTimeDamageBonus(100)).toBe(100);
    });

    it('returns damage unchanged when neither bonus source contributes a rate', () =>
    {
      // Arrange
      const action = buildAction(buildCaster(), buildSkill(''));
      action.item = () => ({ damage: { type: 1 } });
      action.getResolvedCastTimeFrames = () => 120;
      action.calculateThisCastTimeDamageBonusPctPerSec = () => 0;
      action.calculateGeneralCastTimeDamageBonusPctPerSec = () => 0;

      // Act & Assert
      expect(action.applyCastTimeDamageBonus(100)).toBe(100);
    });

    it('scales damage by the combined percent-per-second rate times the cast duration in seconds', () =>
    {
      // Arrange- 60 frames = 1 second; 10%/sec combined -> +10% -> 110.
      const action = buildAction(buildCaster(), buildSkill(''));
      action.item = () => ({ damage: { type: 1 } });
      action.getResolvedCastTimeFrames = () => 60;
      action.calculateThisCastTimeDamageBonusPctPerSec = () => 6;
      action.calculateGeneralCastTimeDamageBonusPctPerSec = () => 4;

      // Act & Assert
      expect(action.applyCastTimeDamageBonus(100)).toBe(110);
    });

    it('rounds the final scaled damage to the nearest integer', () =>
    {
      // Arrange- 30 frames = 0.5s; 10%/sec -> +5% -> 105 * 1.05 = 110.25 -> 110.
      const action = buildAction(buildCaster(), buildSkill(''));
      action.item = () => ({ damage: { type: 2 } });
      action.getResolvedCastTimeFrames = () => 30;
      action.calculateThisCastTimeDamageBonusPctPerSec = () => 10;
      action.calculateGeneralCastTimeDamageBonusPctPerSec = () => 0;

      // Act & Assert
      expect(action.applyCastTimeDamageBonus(105)).toBe(110);
    });
  });
});
//endregion plugins/abs/core/_component/game-action-cast-time-damage-bonus.test.js
