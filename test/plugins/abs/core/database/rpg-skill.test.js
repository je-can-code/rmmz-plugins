//region plugins/abs/core/database/rpg-skill.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a real RPG_Skill-backed row carrying the given note.
 * @param {string} note
 * @returns {object}
 */
function buildSkill(note = '')
{
  const row = Object.create(globalThis.RPG_Skill.prototype);
  row.id = 7;
  row.note = note;
  row.meta = {};
  row._original = function() { return this; };
  return row;
}

describe('J-ABS RPG_Skill effects (direct src import)', () =>
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

    // patches globalThis.RPG_Skill.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/database/RPG_Skill.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  describe('simple scalar tags (present vs absent)', () =>
  {
    it.each([
      [ 'jabsRadius', '<radius:5>', 5, null ],
      [ 'jabsProximity', '<proximity:6>', 6, null ],
      [ 'jabsInnerRadius', '<innerRadius:1>', 1, null ],
      [ 'jabsActionId', '<actionId:3>', 3, null ],
      [ 'jabsDuration', '<duration:20>', 20, null ],
      [ 'jabsCastAnimation', '<castAnimation:40>', 40, null ],
      [ 'jabsCastTime', '<castTime:60>', 60, null ],
      [ 'jabsBonusAggro', '<aggro:5>', 5, null ],
      [ 'jabsAggroMultiplier', '<aggroMultiplier:1.5>', 1.5, null ],
      [ 'jabsAggroPercent', '<aggroPercent:-10>', -10, null ],
      [ 'jabsNotMyAggro', '<notMyAggro:-5>', -5, null ],
      [ 'jabsNotMyAggroPercent', '<notMyAggroPercent:15>', 15, null ],
      [ 'jabsKnockback', '<knockback:3>', 3, null ],
      [ 'jabsParry', '<parry:8>', 8, null ],
      [ 'jabsProjectile', '<projectile:2>', 2, null ],
      [ 'jabsDirectStateTarget', '<directStateTarget:12>', 12, null ],
      [ 'jabsSelfAnimationId', '<selfAnimationId:99>', 99, null ],
      [ 'jabsOnCastAnimationId', '<onCastAnimationId:88>', 88, null ],
      [ 'jabsIgnoreParry', '<ignoreParry:50>', 50, null ],
      [ 'jabsVisZ', '<visZ:12>', 12, null ],
      [ 'jabsBonusHitsFromSkillNote', '<bonus-hits:4>', 4, 0 ],
      [ 'jabsDodgeSteps', '<dodge:3>', 3, 0 ],
      [ 'jabsDodgeSpeed', '<dodgeSpeed:1.2>', 1.2, 0 ],
    ])('%s: present -> %j, absent -> %j', (prop, tag, present, absent) =>
    {
      expect(buildSkill(tag)[prop]).toBeCloseTo(present);
      expect(buildSkill('')[prop]).toBe(absent);
    });
  });

  describe('simple string tags', () =>
  {
    it('jabsShape parses <hitbox:SHAPE>', () =>
    {
      expect(buildSkill('<hitbox:circle>').jabsShape).toBe('circle');
      expect(buildSkill('').jabsShape).toBeNull();
    });

    it('jabsProjectileFormation parses <formation:TYPE>', () =>
    {
      expect(buildSkill('<formation:spray>').jabsProjectileFormation).toBe('spray');
      expect(buildSkill('').jabsProjectileFormation).toBeNull();
    });

    it('jabsMoveType parses <moveType:TYPE>', () =>
    {
      expect(buildSkill('<moveType:forward>').jabsMoveType).toBe('forward');
      expect(buildSkill('').jabsMoveType).toBeNull();
    });
  });

  describe('simple boolean presence tags', () =>
  {
    it.each([
      [ 'jabsIgnoreTerrain', '<ignoreTerrain>' ],
      [ 'jabsCannotMoveToInterrupt', '<cannotMoveToInterrupt>' ],
      [ 'jabsThisCannotBeInterrupted', '<thisCannotBeInterrupted>' ],
      [ 'jabsInvincibleDodge', '<invincibleDodge>' ],
      [ 'jabsFreeCombo', '<freeCombo>' ],
      [ 'jabsComboStarter', '<comboStarter>' ],
      [ 'jabsAiSkillExclusion', '<aiSkillExclusion>' ],
      [ 'jabsOffhandEligible', '<offhandEligible>' ],
    ])('%s is true with its tag present, false with it absent', (prop, tag) =>
    {
      expect(buildSkill(tag)[prop]).toBe(true);
      expect(buildSkill('')[prop]).toBe(false);
    });

    // these three pass nullIfEmpty:true explicitly, unlike the batch above- absent means null,
    // not the false sentinel.
    it.each([
      [ 'jabsUnparryable', '<unparryable>' ],
      [ 'jabsVisRotate', '<visRotate>' ],
      [ 'jabsVisDebug', '<visDebug>' ],
    ])('%s is true when tagged, null when absent', (prop, tag) =>
    {
      expect(buildSkill(tag)[prop]).toBe(true);
      expect(buildSkill('')[prop]).toBeNull();
    });
  });

  describe('jabsDirect (either <direct> or <directLock>)', () =>
  {
    it('is true with only <direct>', () =>
    {
      expect(buildSkill('<direct>').jabsDirect).toBe(true);
    });

    it('is true with only <directLock>', () =>
    {
      expect(buildSkill('<directLock>').jabsDirect).toBe(true);
    });

    it('is false with neither tag', () =>
    {
      expect(buildSkill('').jabsDirect).toBe(false);
    });
  });

  describe('jabsDirectLock', () =>
  {
    it('is true when tagged, null when absent', () =>
    {
      expect(buildSkill('<directLock>').jabsDirectLock).toBe(true);
      expect(buildSkill('').jabsDirectLock).toBeNull();
    });
  });

  describe('jabsLinger', () =>
  {
    it('parses the tag value when present', () =>
    {
      expect(buildSkill('<linger:25>').jabsLinger).toBe(25);
    });

    it('defaults to 10 when absent', () =>
    {
      expect(buildSkill('').jabsLinger).toBe(10);
    });
  });

  describe('jabsChannel', () =>
  {
    it('parses the [skillId, duration] pair', () =>
    {
      expect(buildSkill('<channel:[5, 300]>').jabsChannel).toEqual([ 5, 300 ]);
    });

    it('defaults to an empty array when absent', () =>
    {
      expect(buildSkill('').jabsChannel).toEqual([]);
    });
  });

  describe('jabsChannelTickSpeed', () =>
  {
    it('uses the tag value when present', () =>
    {
      expect(buildSkill('<channelTickSpeed:15>').jabsChannelTickSpeed).toBe(15);
    });

    it('falls back to the plugin default when absent', () =>
    {
      expect(buildSkill('').jabsChannelTickSpeed).toBe(globalThis.J.ABS.Metadata.DefaultChannelTickSpeed);
    });
  });

  describe('jabsOnChannelComplete', () =>
  {
    it('parses a list of skill ids', () =>
    {
      expect(buildSkill('<onChannelComplete:[1, 2, 3]>').jabsOnChannelComplete).toEqual([ 1, 2, 3 ]);
    });

    it('is an empty array when absent', () =>
    {
      expect(buildSkill('').jabsOnChannelComplete).toEqual([]);
    });
  });

  describe('jabsGuard', () =>
  {
    it('parses the [flat, percent] pair', () =>
    {
      expect(buildSkill('<guard:[10, 50]>').jabsGuard).toEqual([ 10, 50 ]);
    });

    it('is null when absent', () =>
    {
      expect(buildSkill('').jabsGuard).toBeNull();
    });
  });

  describe('jabsIFrames', () =>
  {
    it('parses the [start, end] pair', () =>
    {
      expect(buildSkill('<iframes:[5, 10]>').jabsIFrames).toEqual([ 5, 10 ]);
    });

    it('is null when absent', () =>
    {
      expect(buildSkill('').jabsIFrames).toBeNull();
    });
  });

  describe('jabsCounterGuard/jabsCounterParry', () =>
  {
    it('jabsCounterGuard parses a list of skill ids', () =>
    {
      expect(buildSkill('<counterGuard:[1, 2]>').jabsCounterGuard).toEqual([ 1, 2 ]);
    });

    it('jabsCounterGuard is an empty array when absent', () =>
    {
      expect(buildSkill('').jabsCounterGuard).toEqual([]);
    });

    it('jabsCounterParry parses a list of skill ids', () =>
    {
      expect(buildSkill('<counterParry:[3, 4]>').jabsCounterParry).toEqual([ 3, 4 ]);
    });
  });

  describe('jabsGuardData', () =>
  {
    it('builds a JABS_GuardData carrying every parsed field', () =>
    {
      // Arrange
      const note = '<guard:[10, 50]>\n<counterGuard:[1]>\n<counterParry:[2]>\n<parry:8>';
      const skill = buildSkill(note);

      // Act
      const guardData = skill.jabsGuardData;

      // Assert
      expect(guardData.skillId).toBe(7);
      expect(guardData.flatGuardReduction).toBe(10);
      expect(guardData.percGuardReduction).toBe(50);
      expect(guardData.counterGuardIds).toEqual([ 1 ]);
      expect(guardData.counterParryIds).toEqual([ 2 ]);
      expect(guardData.parryDuration).toBe(8);
    });
  });

  describe('piercing', () =>
  {
    it('jabsPiercingData parses the [count, delay] pair', () =>
    {
      expect(buildSkill('<pierce:[3, 6]>').jabsPiercingData).toEqual([ 3, 6 ]);
    });

    it('jabsPiercingData defaults to [1, 0] when absent', () =>
    {
      expect(buildSkill('').jabsPiercingData).toEqual([ 1, 0 ]);
    });

    it('jabsPierceCount reads the first element', () =>
    {
      expect(buildSkill('<pierce:[3, 6]>').jabsPierceCount).toBe(3);
    });

    it('jabsPierceDelay reads the second element, floored at 0', () =>
    {
      expect(buildSkill('<pierce:[3, 6]>').jabsPierceDelay).toBe(6);
    });

    it('jabsPierceDelay clamps a negative delay to 0', () =>
    {
      // pierce delay can't naturally be negative per the regex, but the clamp exists- verify directly.
      const skill = buildSkill('');
      Object.defineProperty(skill, 'jabsPiercingData', { get: () => [ 1, -5 ] });
      expect(skill.jabsPierceDelay).toBe(0);
    });
  });

  describe('combos', () =>
  {
    it('jabsComboAction parses [skillId, delay, expire]', () =>
    {
      expect(buildSkill('<combo:[10, 30, 120]>').jabsComboAction).toEqual([ 10, 30, 120 ]);
    });

    it('jabsComboAction is null when absent', () =>
    {
      expect(buildSkill('').jabsComboAction).toBeNull();
    });

    it('jabsComboSkillId reads the first element', () =>
    {
      expect(buildSkill('<combo:[10, 30]>').jabsComboSkillId).toBe(10);
    });

    it('jabsComboDelay reads the second element', () =>
    {
      expect(buildSkill('<combo:[10, 30]>').jabsComboDelay).toBe(30);
    });

    it('jabsComboDelay defaults to 0 when the second element is omitted', () =>
    {
      expect(buildSkill('<combo:[10]>').jabsComboDelay).toBe(0);
    });

    it('jabsComboExpire reads the third element', () =>
    {
      expect(buildSkill('<combo:[10, 30, 120]>').jabsComboExpire).toBe(120);
    });

    it('jabsComboExpire defaults to 0 when the third element is omitted', () =>
    {
      expect(buildSkill('<combo:[10, 30]>').jabsComboExpire).toBe(0);
    });

    describe('shouldRecurseForComboSkills', () =>
    {
      it('is false with no skill', () =>
      {
        expect(buildSkill('').shouldRecurseForComboSkills(null, 1)).toBe(false);
      });

      it('is false when the skill has no combo tag', () =>
      {
        const skill = buildSkill('');
        expect(skill.shouldRecurseForComboSkills(buildSkill(''), 1)).toBe(false);
      });

      it('is false when the combo target equals the last skill id (self-loop guard)', () =>
      {
        const skill = buildSkill('');
        const comboSkill = buildSkill('<combo:[5, 0]>');
        expect(skill.shouldRecurseForComboSkills(comboSkill, 5)).toBe(false);
      });

      it('is true when the skill has a combo tag pointing elsewhere', () =>
      {
        const skill = buildSkill('');
        const comboSkill = buildSkill('<combo:[5, 0]>');
        expect(skill.shouldRecurseForComboSkills(comboSkill, 1)).toBe(true);
      });
    });

    describe('recursivelyFindAllComboSkillIds / getComboSkillIdList', () =>
    {
      it('builds the full chain of combo skill ids, database-sourced', () =>
      {
        // Arrange: 1 -> 2 -> 3 -> (no combo).
        globalThis.$dataSkills = [
          null,
          buildSkill('<combo:[2, 0]>'),
          buildSkill('<combo:[3, 0]>'),
          buildSkill(''),
        ];
        const [ , skill, secondSkill, thirdSkill ] = globalThis.$dataSkills;
        skill.id = 1;
        secondSkill.id = 2;
        thirdSkill.id = 3;

        // Act
        const chain = skill.getComboSkillIdList();

        // Assert
        expect(chain).toEqual([ 2, 3 ]);
      });

      it('stops at a cycle instead of recursing forever', () =>
      {
        // Arrange: 1 -> 2 -> 1 (cycle).
        globalThis.$dataSkills = [
          null,
          buildSkill('<combo:[2, 0]>'),
          buildSkill('<combo:[1, 0]>'),
        ];
        const [ , skill, secondSkill ] = globalThis.$dataSkills;
        skill.id = 1;
        secondSkill.id = 2;

        // Act
        const chain = skill.getComboSkillIdList();

        // Assert- 1->2 adds 2 (list [2]); 2->1 adds 1 since 1 isn't in the list yet (list [2,1]);
        // 1->2 again is where the cycle guard finally fires, since 2 IS already in the list.
        expect(chain).toEqual([ 2, 1 ]);
      });

      it('sources skills from the given battler when one is provided', () =>
      {
        // Arrange- battler.skill is looked up by id at each recursion step, so the mock must
        // return the right row per id: skill 1 combos into 2; skill 2 has no further combo.
        const skillOneRow = buildSkill('<combo:[2, 0]>');
        skillOneRow.id = 1;
        const skillTwoRow = buildSkill('');
        skillTwoRow.id = 2;
        const battler = { skill: vi.fn(id => (id === 1 ? skillOneRow : skillTwoRow)) };
        const skill = buildSkill('<combo:[2, 0]>');
        skill.id = 1;

        // Act
        const chain = skill.getComboSkillIdList(battler);

        // Assert
        expect(chain).toEqual([ 2 ]);
        expect(battler.skill).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('delay', () =>
  {
    it('jabsDelayData parses [duration, triggerByTouch, radius]', () =>
    {
      expect(buildSkill('<delay:[30, true, 2]>').jabsDelayData).toEqual([ 30, true, 2 ]);
    });

    it('jabsDelayData defaults to [0, false] when absent', () =>
    {
      expect(buildSkill('').jabsDelayData).toEqual([ 0, false ]);
    });

    it('jabsDelayDuration reads the first element', () =>
    {
      expect(buildSkill('<delay:[30, true]>').jabsDelayDuration).toBe(30);
    });

    it('jabsDelayTriggerByTouch reads the second element', () =>
    {
      expect(buildSkill('<delay:[30, true]>').jabsDelayTriggerByTouch).toBe(true);
    });

    it('jabsDelayTriggerRadius reads the third element when present', () =>
    {
      expect(buildSkill('<delay:[30, true, 4]>').jabsDelayTriggerRadius).toBe(4);
    });

    it('jabsDelayTriggerRadius is null when the third element is omitted', () =>
    {
      expect(buildSkill('<delay:[30, true]>').jabsDelayTriggerRadius).toBeNull();
    });
  });

  describe('visual metadata', () =>
  {
    it('jabsVisOffset parses the [x, y] pair', () =>
    {
      expect(buildSkill('<visOffset:[-6, -12]>').jabsVisOffset).toEqual([ -6, -12 ]);
    });

    it('jabsVisOffset defaults to [0, 0] when absent', () =>
    {
      expect(buildSkill('').jabsVisOffset).toEqual([ 0, 0 ]);
    });

    it('jabsVisAnchor parses and clamps values into 0..1', () =>
    {
      expect(buildSkill('<visAnchor:[0.5, 1]>').jabsVisAnchor).toEqual([ 0.5, 1 ]);
    });

    it('jabsVisAnchor is null when absent', () =>
    {
      expect(buildSkill('').jabsVisAnchor).toBeNull();
    });

    it('jabsVisScale parses the [x, y] pair', () =>
    {
      expect(buildSkill('<visScale:[1.25, 1.0]>').jabsVisScale).toEqual([ 1.25, 1.0 ]);
    });

    it('jabsVisScale is null when absent', () =>
    {
      expect(buildSkill('').jabsVisScale).toBeNull();
    });

    describe('directional offsets', () =>
    {
      it.each([
        [ 'jabsVisOffsetU', '<visOffsetU:[0, -24]>' ],
        [ 'jabsVisOffsetD', '<visOffsetD:[0, 24]>' ],
        [ 'jabsVisOffsetL', '<visOffsetL:[-6, -12]>' ],
        [ 'jabsVisOffsetR', '<visOffsetR:[6, -12]>' ],
        [ 'jabsVisOffsetUR', '<visOffsetUR:[6, -18]>' ],
        [ 'jabsVisOffsetUL', '<visOffsetUL:[-6, -18]>' ],
        [ 'jabsVisOffsetDR', '<visOffsetDR:[6, -10]>' ],
        [ 'jabsVisOffsetDL', '<visOffsetDL:[-6, -10]>' ],
      ])('%s parses its own offset tag', (prop, tag) =>
      {
        expect(buildSkill(tag)[prop]).not.toBeNull();
        expect(buildSkill('')[prop]).toBeNull();
      });
    });

    describe('getJabsVisOffsetFor', () =>
    {
      it.each([
        [ 8, '<visOffsetU:[1, 1]>', [ 1, 1 ] ],
        [ 2, '<visOffsetD:[2, 2]>', [ 2, 2 ] ],
        [ 4, '<visOffsetL:[3, 3]>', [ 3, 3 ] ],
        [ 6, '<visOffsetR:[4, 4]>', [ 4, 4 ] ],
      ])('cardinal direction %i prefers its own directional tag', (direction, tag, expected) =>
      {
        expect(buildSkill(tag).getJabsVisOffsetFor(direction)).toEqual(expected);
      });

      it.each([
        [ 9, '<visOffsetUR:[9, 9]>', [ 9, 9 ] ],
        [ 7, '<visOffsetUL:[7, 7]>', [ 7, 7 ] ],
        [ 3, '<visOffsetDR:[3, 3]>', [ 3, 3 ] ],
        [ 1, '<visOffsetDL:[1, 1]>', [ 1, 1 ] ],
      ])('diagonal direction %i prefers its own diagonal tag', (direction, tag, expected) =>
      {
        expect(buildSkill(tag).getJabsVisOffsetFor(direction)).toEqual(expected);
      });

      it('diagonal direction falls back to the U/D cardinal when no diagonal tag is present', () =>
      {
        expect(buildSkill('<visOffsetU:[5, 5]>').getJabsVisOffsetFor(9)).toEqual([ 5, 5 ]);
      });

      it('diagonal direction falls back to the L/R cardinal when neither diagonal nor U/D is present', () =>
      {
        expect(buildSkill('<visOffsetR:[6, 6]>').getJabsVisOffsetFor(9)).toEqual([ 6, 6 ]);
      });

      it.each([ 8, 2, 4, 6 ])('cardinal direction %i falls back to the default offset when its own tag is absent', (direction) =>
      {
        expect(buildSkill('<visOffset:[2, 2]>').getJabsVisOffsetFor(direction)).toEqual([ 2, 2 ]);
      });

      it.each([ 8, 2, 4, 6, 9, 7, 3, 1 ])('direction %i falls back to [0, 0] when nothing at all is tagged', (direction) =>
      {
        expect(buildSkill('').getJabsVisOffsetFor(direction)).toEqual([ 0, 0 ]);
      });

      it('UPPERLEFT falls back to the U cardinal when no UL diagonal tag is present', () =>
      {
        expect(buildSkill('<visOffsetU:[5, 5]>').getJabsVisOffsetFor(7)).toEqual([ 5, 5 ]);
      });

      it('UPPERLEFT falls back to the L cardinal when neither UL nor U is present', () =>
      {
        expect(buildSkill('<visOffsetL:[6, 6]>').getJabsVisOffsetFor(7)).toEqual([ 6, 6 ]);
      });

      it('LOWERRIGHT falls back to the D cardinal when no DR diagonal tag is present', () =>
      {
        expect(buildSkill('<visOffsetD:[5, 5]>').getJabsVisOffsetFor(3)).toEqual([ 5, 5 ]);
      });

      it('LOWERRIGHT falls back to the R cardinal when neither DR nor D is present', () =>
      {
        expect(buildSkill('<visOffsetR:[6, 6]>').getJabsVisOffsetFor(3)).toEqual([ 6, 6 ]);
      });

      it('LOWERLEFT falls back to the D cardinal when no DL diagonal tag is present', () =>
      {
        expect(buildSkill('<visOffsetD:[5, 5]>').getJabsVisOffsetFor(1)).toEqual([ 5, 5 ]);
      });

      it('LOWERLEFT falls back to the L cardinal when neither DL nor D is present', () =>
      {
        expect(buildSkill('<visOffsetL:[6, 6]>').getJabsVisOffsetFor(1)).toEqual([ 6, 6 ]);
      });

      it('an unknown direction code returns the default offset', () =>
      {
        expect(buildSkill('<visOffset:[3, 3]>').getJabsVisOffsetFor(5)).toEqual([ 3, 3 ]);
      });
    });
  });

  describe('purgeStates', () =>
  {
    it('parses the [type, allowDeath, count] tuple', () =>
    {
      expect(buildSkill('<purgeStates:[negative, false, 2]>').jabsPurgeStatesParams)
        .toEqual([ 'negative', false, 2 ]);
    });

    it('is null when absent', () =>
    {
      expect(buildSkill('').jabsPurgeStatesParams).toBeNull();
    });
  });

  describe('static merge-with-action-map-holder helpers', () =>
  {
    it('mergeJabsVisPairFromNotes prefers the skill note over the holder note', () =>
    {
      const skill = buildSkill('<visScale:[2, 2]>');
      const holder = { note: '<visScale:[9, 9]>' };
      expect(globalThis.RPG_Skill.mergeJabsVisPairFromNotes(skill, holder, globalThis.J.ABS.RegExp.VisScale))
        .toEqual([ 2, 2 ]);
    });

    it('mergeJabsVisPairFromNotes falls back to the holder note when the skill has none', () =>
    {
      const skill = buildSkill('');
      const holder = { note: '<visScale:[9, 9]>' };
      expect(globalThis.RPG_Skill.mergeJabsVisPairFromNotes(skill, holder, globalThis.J.ABS.RegExp.VisScale))
        .toEqual([ 9, 9 ]);
    });

    it('mergeJabsVisPairFromNotes is null with no holder and no skill tag', () =>
    {
      const skill = buildSkill('');
      expect(globalThis.RPG_Skill.mergeJabsVisPairFromNotes(skill, null, globalThis.J.ABS.RegExp.VisScale))
        .toBeNull();
    });

    it('mergeJabsVisPairNumberFromNotes prefers the skill over the holder', () =>
    {
      const skill = buildSkill('<visZ:5>');
      const holder = { note: '<visZ:9>' };
      expect(globalThis.RPG_Skill.mergeJabsVisPairNumberFromNotes(skill, holder, globalThis.J.ABS.RegExp.VisZ))
        .toBe(5);
    });

    it('mergeJabsVisPairNumberFromNotes falls back to the holder when the skill has none', () =>
    {
      const skill = buildSkill('');
      const holder = { note: '<visZ:9>' };
      expect(globalThis.RPG_Skill.mergeJabsVisPairNumberFromNotes(skill, holder, globalThis.J.ABS.RegExp.VisZ))
        .toBe(9);
    });

    it('mergeJabsVisPairBoolFromNotes prefers the skill over the holder', () =>
    {
      const skill = buildSkill('<visRotate>');
      const holder = { note: '' };
      expect(globalThis.RPG_Skill.mergeJabsVisPairBoolFromNotes(skill, holder, globalThis.J.ABS.RegExp.VisRotate))
        .toBe(true);
    });

    it('mergeJabsVisPairBoolFromNotes falls back to the holder when the skill has none', () =>
    {
      const skill = buildSkill('');
      const holder = { note: '<visRotate>' };
      expect(globalThis.RPG_Skill.mergeJabsVisPairBoolFromNotes(skill, holder, globalThis.J.ABS.RegExp.VisRotate))
        .toBe(true);
    });
  });

  describe('instance merge-for-action-map methods', () =>
  {
    it('getJabsVisAnchorMergedForActionMap returns null with no jabsAction and no skill tag', () =>
    {
      expect(buildSkill('').getJabsVisAnchorMergedForActionMap(null)).toBeNull();
    });

    it('getJabsVisAnchorMergedForActionMap clamps the merged pair into 0..1', () =>
    {
      const skill = buildSkill('<visAnchor:[0.5, 1]>');
      expect(skill.getJabsVisAnchorMergedForActionMap(null)).toEqual([ 0.5, 1 ]);
    });

    it('getJabsVisAnchorMergedForActionMap reads through a jabsAction\'s holder note', () =>
    {
      const skill = buildSkill('');
      const jabsAction = { getActionMapVisualNoteHolder: () => ({ note: '<visAnchor:[0, 0.5]>' }) };
      expect(skill.getJabsVisAnchorMergedForActionMap(jabsAction)).toEqual([ 0, 0.5 ]);
    });

    it('getJabsVisZMergedForActionMap delegates to the numeric merge helper', () =>
    {
      const skill = buildSkill('<visZ:7>');
      expect(skill.getJabsVisZMergedForActionMap(null)).toBe(7);
    });

    it('getJabsVisZMergedForActionMap reads through a jabsAction\'s holder note', () =>
    {
      const skill = buildSkill('');
      const jabsAction = { getActionMapVisualNoteHolder: () => ({ note: '<visZ:9>' }) };
      expect(skill.getJabsVisZMergedForActionMap(jabsAction)).toBe(9);
    });

    it('getJabsVisRotateMergedForActionMap defaults to false with nothing tagged', () =>
    {
      expect(buildSkill('').getJabsVisRotateMergedForActionMap(null)).toBe(false);
    });

    it('getJabsVisRotateMergedForActionMap is true when the skill is tagged', () =>
    {
      expect(buildSkill('<visRotate>').getJabsVisRotateMergedForActionMap(null)).toBe(true);
    });

    it('getJabsVisRotateMergedForActionMap reads through a jabsAction\'s holder note', () =>
    {
      const skill = buildSkill('');
      const jabsAction = { getActionMapVisualNoteHolder: () => ({ note: '<visRotate>' }) };
      expect(skill.getJabsVisRotateMergedForActionMap(jabsAction)).toBe(true);
    });

    it('getJabsVisScaleMergedForActionMap delegates to the array merge helper', () =>
    {
      const skill = buildSkill('<visScale:[3, 3]>');
      expect(skill.getJabsVisScaleMergedForActionMap(null)).toEqual([ 3, 3 ]);
    });

    it('getJabsVisScaleMergedForActionMap reads through a jabsAction\'s holder note', () =>
    {
      const skill = buildSkill('');
      const jabsAction = { getActionMapVisualNoteHolder: () => ({ note: '<visScale:[8, 8]>' }) };
      expect(skill.getJabsVisScaleMergedForActionMap(jabsAction)).toEqual([ 8, 8 ]);
    });

    it('getJabsVisDebugMergedForActionMap defaults to false with nothing tagged', () =>
    {
      expect(buildSkill('').getJabsVisDebugMergedForActionMap(null)).toBe(false);
    });

    it('getJabsVisDebugMergedForActionMap is true when the skill is tagged', () =>
    {
      expect(buildSkill('<visDebug>').getJabsVisDebugMergedForActionMap(null)).toBe(true);
    });

    it('getJabsVisDebugMergedForActionMap reads through a jabsAction\'s holder note', () =>
    {
      const skill = buildSkill('');
      const jabsAction = { getActionMapVisualNoteHolder: () => ({ note: '<visDebug>' }) };
      expect(skill.getJabsVisDebugMergedForActionMap(jabsAction)).toBe(true);
    });

    describe('getJabsVisOffsetForMergedActionMap', () =>
    {
      it('delegates to getJabsVisOffsetFor when there is no jabsAction holder', () =>
      {
        const skill = buildSkill('<visOffset:[2, 2]>');
        expect(skill.getJabsVisOffsetForMergedActionMap(null, 8)).toEqual([ 2, 2 ]);
      });

      it('prefers the skill\'s own directional tag over the holder\'s when both are present', () =>
      {
        const skill = buildSkill('<visOffsetU:[1, 1]>');
        const jabsAction = { getActionMapVisualNoteHolder: () => ({ note: '<visOffsetU:[9, 9]>' }) };
        expect(skill.getJabsVisOffsetForMergedActionMap(jabsAction, 8)).toEqual([ 1, 1 ]);
      });

      it('falls back to the holder\'s directional tag when the skill has none', () =>
      {
        const skill = buildSkill('');
        const jabsAction = { getActionMapVisualNoteHolder: () => ({ note: '<visOffsetU:[9, 9]>' }) };
        expect(skill.getJabsVisOffsetForMergedActionMap(jabsAction, 8)).toEqual([ 9, 9 ]);
      });

      it('falls back to the holder\'s default offset when neither has a directional tag', () =>
      {
        const skill = buildSkill('');
        const jabsAction = { getActionMapVisualNoteHolder: () => ({ note: '<visOffset:[5, 5]>' }) };
        expect(skill.getJabsVisOffsetForMergedActionMap(jabsAction, 8)).toEqual([ 5, 5 ]);
      });

      it('resolves a diagonal direction through merged UR/U/R fallback chain', () =>
      {
        const skill = buildSkill('<visOffsetR:[4, 4]>');
        const jabsAction = { getActionMapVisualNoteHolder: () => ({ note: '' }) };
        expect(skill.getJabsVisOffsetForMergedActionMap(jabsAction, 9)).toEqual([ 4, 4 ]);
      });

      it.each([
        [ 2, '<visOffsetD:[2, 2]>', [ 2, 2 ] ],
        [ 4, '<visOffsetL:[3, 3]>', [ 3, 3 ] ],
        [ 6, '<visOffsetR:[4, 4]>', [ 4, 4 ] ],
      ])('cardinal direction %i resolves its own merged directional tag', (direction, tag, expected) =>
      {
        const skill = buildSkill(tag);
        const jabsAction = { getActionMapVisualNoteHolder: () => ({ note: '' }) };
        expect(skill.getJabsVisOffsetForMergedActionMap(jabsAction, direction)).toEqual(expected);
      });

      it.each([
        [ 7, '<visOffsetUL:[7, 7]>', [ 7, 7 ] ],
        [ 3, '<visOffsetDR:[3, 3]>', [ 3, 3 ] ],
        [ 1, '<visOffsetDL:[1, 1]>', [ 1, 1 ] ],
      ])('diagonal direction %i resolves its own merged diagonal tag', (direction, tag, expected) =>
      {
        const skill = buildSkill(tag);
        const jabsAction = { getActionMapVisualNoteHolder: () => ({ note: '' }) };
        expect(skill.getJabsVisOffsetForMergedActionMap(jabsAction, direction)).toEqual(expected);
      });

      it.each([ 8, 2, 4, 6, 9, 7, 3, 1 ])(
        'falls back to [0, 0] when nothing at all is tagged anywhere (direction %i)', (direction) =>
        {
          const skill = buildSkill('');
          const jabsAction = { getActionMapVisualNoteHolder: () => ({ note: '' }) };
          expect(skill.getJabsVisOffsetForMergedActionMap(jabsAction, direction)).toEqual([ 0, 0 ]);
        });

      it.each([ 2, 4, 6 ])(
        'cardinal direction %i falls all the way back to the merged default offset', (direction) =>
        {
          const skill = buildSkill('<visOffset:[2, 2]>');
          const jabsAction = { getActionMapVisualNoteHolder: () => ({ note: '' }) };
          expect(skill.getJabsVisOffsetForMergedActionMap(jabsAction, direction)).toEqual([ 2, 2 ]);
        });

      it('UPPERRIGHT falls back to the merged U tag when no UR tag is present', () =>
      {
        const skill = buildSkill('<visOffsetU:[5, 5]>');
        const jabsAction = { getActionMapVisualNoteHolder: () => ({ note: '' }) };
        expect(skill.getJabsVisOffsetForMergedActionMap(jabsAction, 9)).toEqual([ 5, 5 ]);
      });

      it('UPPERLEFT falls back to the merged UL, then U, then L tags in order', () =>
      {
        const skill = buildSkill('<visOffsetU:[5, 5]>');
        const jabsAction = { getActionMapVisualNoteHolder: () => ({ note: '' }) };
        expect(skill.getJabsVisOffsetForMergedActionMap(jabsAction, 7)).toEqual([ 5, 5 ]);
      });

      it('UPPERLEFT falls back to the merged L tag when neither UL nor U is present', () =>
      {
        const skill = buildSkill('<visOffsetL:[6, 6]>');
        const jabsAction = { getActionMapVisualNoteHolder: () => ({ note: '' }) };
        expect(skill.getJabsVisOffsetForMergedActionMap(jabsAction, 7)).toEqual([ 6, 6 ]);
      });

      it('LOWERRIGHT falls back to the merged D, then R tags in order', () =>
      {
        const skill = buildSkill('<visOffsetD:[5, 5]>');
        const jabsAction = { getActionMapVisualNoteHolder: () => ({ note: '' }) };
        expect(skill.getJabsVisOffsetForMergedActionMap(jabsAction, 3)).toEqual([ 5, 5 ]);
      });

      it('LOWERRIGHT falls back to the merged R tag when neither DR nor D is present', () =>
      {
        const skill = buildSkill('<visOffsetR:[6, 6]>');
        const jabsAction = { getActionMapVisualNoteHolder: () => ({ note: '' }) };
        expect(skill.getJabsVisOffsetForMergedActionMap(jabsAction, 3)).toEqual([ 6, 6 ]);
      });

      it('LOWERLEFT falls back to the merged D, then L tags in order', () =>
      {
        const skill = buildSkill('<visOffsetD:[5, 5]>');
        const jabsAction = { getActionMapVisualNoteHolder: () => ({ note: '' }) };
        expect(skill.getJabsVisOffsetForMergedActionMap(jabsAction, 1)).toEqual([ 5, 5 ]);
      });

      it('LOWERLEFT falls back to the merged L tag when neither DL nor D is present', () =>
      {
        const skill = buildSkill('<visOffsetL:[6, 6]>');
        const jabsAction = { getActionMapVisualNoteHolder: () => ({ note: '' }) };
        expect(skill.getJabsVisOffsetForMergedActionMap(jabsAction, 1)).toEqual([ 6, 6 ]);
      });

      it('an unknown direction code returns the merged default offset', () =>
      {
        const skill = buildSkill('<visOffset:[3, 3]>');
        const jabsAction = { getActionMapVisualNoteHolder: () => ({ note: '' }) };
        expect(skill.getJabsVisOffsetForMergedActionMap(jabsAction, 5)).toEqual([ 3, 3 ]);
      });
    });
  });
});
//endregion plugins/abs/core/database/rpg-skill.test.js
