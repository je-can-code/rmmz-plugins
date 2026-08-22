//region plugins/abs/core/database/rpg-state.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a real RPG_State-backed row carrying the given note.
 * @param {string} note
 * @returns {object}
 */
function buildState(note = '')
{
  const row = Object.create(globalThis.RPG_State.prototype);
  row.id = 7;
  row.note = note;
  row.meta = {};
  row.stepsToRemove = 0;
  row._original = function() { return this; };
  return row;
}

describe('J-ABS RPG_State effects (direct src import)', () =>
{
  let JABS_StateExpireData;

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));
    ({ default: globalThis.RPG_State } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_State.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.RPG_State.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/database/RPG_State.js');

    ({ default: JABS_StateExpireData } = await import('../../../../../src/plugins/abs/core/models/JABS_StateExpireData.js'));
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  describe('crowd-control tags (nullIfEmpty booleans)', () =>
  {
    it.each([
      [ 'jabsParalyzed', '<paralyzed>' ],
      [ 'jabsRooted', '<rooted>' ],
      [ 'jabsMuted', '<muted>' ],
      [ 'jabsDisarmed', '<disabled>' ],
      [ 'jabsAggroLock', '<aggroLock>' ],
    ])('%s is true when tagged, null when absent', (prop, tag) =>
    {
      expect(buildState(tag)[prop]).toBe(true);
      expect(buildState('')[prop]).toBeNull();
    });
  });

  describe('isNegativeType', () =>
  {
    it('is true when a negative classifier sits among other classifiers', () =>
    {
      // the elemental classifier is a near-miss sibling: it must be walked past, not matched.
      const state = buildState('<type:elemental>\n<type:negative>');
      expect(state.isNegativeType()).toBe(true);
    });

    it('is false when only non-negative classifiers are present', () =>
    {
      // a state that carries classifiers but none of them negative is the case that separates
      // "matches negative" from "matches anything at all"- ai healing must leave these alone.
      const state = buildState('<type:elemental>\n<type:positive>');
      expect(state.isNegativeType()).toBe(false);
    });

    it('is false when no classifiers are present at all', () =>
    {
      expect(buildState('').isNegativeType()).toBe(false);
    });

    it('matches the negative classifier regardless of authored casing', () =>
    {
      expect(buildState('<type:NEGATIVE>').isNegativeType()).toBe(true);
    });
  });

  describe('aggro amplifiers', () =>
  {
    it('jabsAggroInAmp reads the tag value, null when absent', () =>
    {
      expect(buildState('<aggroInAmp:2>').jabsAggroInAmp).toBe(2);
      expect(buildState('').jabsAggroInAmp).toBeNull();
    });

    it('jabsAggroOutAmp reads the tag value, null when absent', () =>
    {
      expect(buildState('<aggroOutAmp:3>').jabsAggroOutAmp).toBe(3);
      expect(buildState('').jabsAggroOutAmp).toBeNull();
    });
  });

  describe('jabsSkillTransforms', () =>
  {
    it('parses a list of [base, transformed] pairs', () =>
    {
      const state = buildState('<skillTransform:[1, 2]>\n<skillTransform:[3, 4]>');
      expect(state.jabsSkillTransforms).toEqual([ [ 1, 2 ], [ 3, 4 ] ]);
    });

    it('is an empty array when absent', () =>
    {
      expect(buildState('').jabsSkillTransforms).toEqual([]);
    });
  });

  describe('jabsStateReapplyType', () =>
  {
    it.each([ 'refresh', 'extend', 'stack' ])('accepts the recognized "%s" type', (type) =>
    {
      expect(buildState(`<stackType:${type}>`).jabsStateReapplyType).toBe(type);
    });

    it('is null when the tag is absent (empty string does not match any type)', () =>
    {
      expect(buildState('').jabsStateReapplyType).toBeNull();
    });
  });

  describe('jabsStacksConvertToState', () =>
  {
    it('is null when no tag is present', () =>
    {
      expect(buildState('').jabsStacksConvertToState).toBeNull();
    });

    it('wraps the first [stateId, stacksRequired] pair in a plain object', () =>
    {
      const state = buildState('<stacksConvertToState:[5, 3]>');
      expect(state.jabsStacksConvertToState).toEqual({ stateId: 5, stacksRequired: 3 });
    });
  });

  describe('jabsSpreadRule', () =>
  {
    it('is null when no tag is present', () =>
    {
      expect(buildState('').jabsSpreadRule).toBeNull();
    });

    it('wraps the [chance, range] pair in a plain object when both are positive', () =>
    {
      const state = buildState('<spread:[50, 2]>');
      expect(state.jabsSpreadRule).toEqual({ chance: 50, range: 2 });
    });

    it('is null when the chance is zero', () =>
    {
      expect(buildState('<spread:[0, 2]>').jabsSpreadRule).toBeNull();
    });

    it('is null when the range is zero', () =>
    {
      expect(buildState('<spread:[50, 0]>').jabsSpreadRule).toBeNull();
    });
  });

  describe('applyStateOnExpire', () =>
  {
    it('is null when no tag is present', () =>
    {
      expect(buildState('').jabsApplyStateOnExpire).toBeNull();
    });

    it('wraps the first [stateId, chance] pair in a JABS_StateExpireData', () =>
    {
      const state = buildState('<applyStateOnExpire:[5, 50]>');
      const result = state.jabsApplyStateOnExpire;

      expect(result).toBeInstanceOf(JABS_StateExpireData);
      expect(result.stateId).toBe(5);
      expect(result.chance).toBe(50);
    });

    it('respects only the first tag when multiple are present', () =>
    {
      const state = buildState('<applyStateOnExpire:[5, 50]>\n<applyStateOnExpire:[6, 60]>');
      expect(state.jabsApplyStateOnExpire.stateId).toBe(5);
    });
  });

  describe('slip hp/mp/tp flat/percent/formula', () =>
  {
    it.each([
      [ 'jabsSlipHpFlat', '<hpFlat:10>', 10 ],
      [ 'jabsSlipHpPercent', '<hpPercent:5>', 5 ],
      [ 'jabsSlipMpFlat', '<mpFlat:8>', 8 ],
      [ 'jabsSlipMpPercent', '<mpPercent:3>', 3 ],
      [ 'jabsSlipTpFlat', '<tpFlat:6>', 6 ],
      [ 'jabsSlipTpPercent', '<tpPercent:2>', 2 ],
    ])('%s reads its numeric tag', (prop, tag, expected) =>
    {
      expect(buildState(tag)[prop]).toBe(expected);
    });

    it.each([
      [ 'jabsSlipHpFormula', '<hpFormula:[a.mhp / 10]>' ],
      [ 'jabsSlipMpFormula', '<mpFormula:[a.mmp / 10]>' ],
      [ 'jabsSlipTpFormula', '<tpFormula:[100]>' ],
    ])('%s reads its formula string tag', (prop, tag) =>
    {
      expect(buildState(tag)[prop]).not.toBeNull();
    });

    it('all slip getters default to their sentinel when absent', () =>
    {
      const state = buildState('');
      expect(state.jabsSlipHpFlat).toBe(0);
      expect(state.jabsSlipHpPercent).toBe(0);
      expect(state.jabsSlipHpFormula).toBe('');
    });
  });

  describe('jabsNoLogs', () =>
  {
    it('is true when tagged', () =>
    {
      expect(buildState('<noLogs>').jabsNoLogs).toBe(true);
    });

    it('is false when absent (nullIfEmpty defaults false, sentinel is false)', () =>
    {
      expect(buildState('').jabsNoLogs).toBe(false);
    });
  });

  describe('jabsStateHasMapTimer', () =>
  {
    it('is false when jabsIndefiniteState is set, regardless of duration tags', () =>
    {
      expect(buildState('<indefiniteState>\n<stateDuration:100>').jabsStateHasMapTimer).toBe(false);
    });

    it('is true when a positive frame duration tag is present', () =>
    {
      expect(buildState('<stateDuration:100>').jabsStateHasMapTimer).toBe(true);
    });

    it('is true when a positive seconds duration tag is present (no frame tag)', () =>
    {
      expect(buildState('<stateDurationSec:2>').jabsStateHasMapTimer).toBe(true);
    });

    it('is false with no duration tags at all', () =>
    {
      expect(buildState('').jabsStateHasMapTimer).toBe(false);
    });

    it('is false when the frame duration tag is present but zero', () =>
    {
      // an authored zero is a present tag, so the null check alone lets it through- only the
      // positivity check stops a zero-frame timer from being started and expiring the same frame.
      // the indefinite tag and the seconds tag are both absent, so neither can be why this is false.
      expect(buildState('<stateDuration:0>').jabsStateHasMapTimer).toBe(false);
    });

    it('is false when the seconds duration tag is present but zero', () =>
    {
      // same authored-zero case on the seconds path, with the frame tag absent so the frame
      // branch cannot be the one producing the answer.
      expect(buildState('<stateDurationSec:0>').jabsStateHasMapTimer).toBe(false);
    });
  });

  describe('jabsStateDurationFrames', () =>
  {
    it('uses the frame tag directly when present and positive', () =>
    {
      expect(buildState('<stateDuration:150>').jabsStateDurationFrames).toBe(150);
    });

    it('converts the seconds tag to frames (x60) when no frame tag is present', () =>
    {
      expect(buildState('<stateDurationSec:2>').jabsStateDurationFrames).toBe(120);
    });

    it('falls back to stepsToRemove when neither duration tag is present', () =>
    {
      const state = buildState('');
      state.stepsToRemove = 42;
      expect(state.jabsStateDurationFrames).toBe(42);
    });

    it('falls back to stepsToRemove when the frame tag is present but zero', () =>
    {
      // stepsToRemove has to be something other than zero here: a zero frame tag returned as-is
      // is indistinguishable from the fallback when both are zero, and the fallback is the claim.
      const state = buildState('<stateDuration:0>');
      state.stepsToRemove = 300;
      expect(state.jabsStateDurationFrames).toBe(300);
    });

    it('falls back to stepsToRemove when the seconds tag is present but zero', () =>
    {
      // same reasoning on the seconds path- zero seconds converted to frames is still zero, so
      // only a distinctive stepsToRemove proves the fallback is what answered.
      const state = buildState('<stateDurationSec:0>');
      state.stepsToRemove = 300;
      expect(state.jabsStateDurationFrames).toBe(300);
    });
  });

  describe('jabsStateExtendAmount / jabsStateExtendMax', () =>
  {
    it('jabsStateExtendAmount reads the tag value when present', () =>
    {
      expect(buildState('<stackExtendAmount:30>').jabsStateExtendAmount).toBe(30);
    });

    it('jabsStateExtendAmount falls back to the configured default when absent', () =>
    {
      expect(buildState('').jabsStateExtendAmount).toBe(globalThis.J.ABS.Metadata.DefaultStateExtendAmount);
    });

    it('jabsStateExtendMax reads the tag value when present', () =>
    {
      expect(buildState('<stackExtendMax:600>').jabsStateExtendMax).toBe(600);
    });

    it('jabsStateExtendMax falls back to the configured default when absent', () =>
    {
      expect(buildState('').jabsStateExtendMax).toBe(globalThis.J.ABS.Metadata.DefaultStateExtendMax);
    });
  });

  describe('jabsThisStateDurationBoost', () =>
  {
    it('sums flat, percent, and formula boosts scoped to this state\'s own note', () =>
    {
      // flat 10 + percent 20% of 100 (=20) + formula (50) = 80.
      const state = buildState('<thisStateDurationFlat:10>\n<thisStateDurationPerc:20>\n<thisStateDurationFormula:[50]>');
      expect(state.jabsThisStateDurationBoost(100)).toBeCloseTo(80);
    });

    it('is 0 with no matching tags', () =>
    {
      expect(buildState('').jabsThisStateDurationBoost(100)).toBe(0);
    });
  });
});
//endregion plugins/abs/core/database/rpg-state.test.js
