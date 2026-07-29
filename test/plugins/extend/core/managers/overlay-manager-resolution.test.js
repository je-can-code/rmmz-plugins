//region plugins/extend/core/managers/overlay-manager-resolution.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installExtendHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJExtend,
} from '../../_component/fixtures/install-extend-host-globals.js';

/**
 * Builds a database-row stand-in for either a skill or a state.
 *
 * Only the members the resolution path actually reads are present: the extension declarations, the
 * type classifiers, and a `_clone` matching RPG_Base's deep-copy contract.
 *
 * @param {number} id The database id.
 * @param {object} [overrides] Fields to replace.
 * @returns {object}
 */
function buildRow(id, overrides = {})
{
  const row = {
    id,
    name: `row-${id}`,
    mpCost: 0,
    tpCost: 0,
    scope: 1,
    speed: 0,
    successRate: 100,
    repeats: 1,
    tpGain: 0,
    hitType: 0,
    animationId: 0,
    message1: '',
    message2: '',
    message3: '',
    message4: '',
    note: '',
    meta: {},
    effects: [],
    traits: [],
    damage: { type: 0, critical: false, elementId: 0, variance: 20, formula: '0' },
    restriction: 0,
    priority: 50,
    overlay: 0,
    motion: 0,
    autoRemovalTiming: 0,
    minTurns: 1,
    maxTurns: 1,
    removeAtBattleEnd: false,
    removeByRestriction: false,
    removeByDamage: false,
    removeByWalking: false,
    chanceByDamage: 100,
    stepsToRemove: 100,

    isExtension: false,
    getExtensions: [],
    getExtensionTypes: [],
    types: () => [],
  };

  Object.assign(row, overrides);

  row._clone = function()
  {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this, {
      damage: { ...this.damage },
      meta: { ...this.meta },
      effects: [ ...this.effects ],
      traits: [ ...this.traits ],
    });
  };

  return row;
}

describe('OverlayManager extension resolution (direct src import)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/extend/core/managers/OverlayManager.js').default} */
  let OverlayManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    installExtendHostGlobals();

    ({ default: globalThis.JCache } = await import('../../../../../src/plugins/_base/core/JCache.js'));
    ({ default: globalThis.ArrayHelper } = await import('../../../../../src/plugins/_base/_utilities/ArrayHelper.js'));
    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.TraitResolver } = await import('../../../../../src/plugins/_base/managers/TraitResolver.js'));

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJExtend();
    await import('../../../../../src/plugins/extend/core/_metadata/initialization.js');

    ({ default: OverlayManager } = await import('../../../../../src/plugins/extend/core/managers/OverlayManager.js'));

    globalThis.Game_Action.EFFECT_ADD_STATE = 21;
  });

  beforeEach(() =>
  {
    globalThis.$dataSkills = [];
    globalThis.$dataStates = [];

    // the caches are static and battler-scoped; without a wipe a later test would silently read an
    // earlier test's resolved skill for the same id.
    OverlayManager.clearCache();
  });

  /**
   * Builds a caster exposing the learned-skill list the skill resolver walks.
   * @param {number[]} skillIds The skill ids this caster knows.
   * @returns {object}
   */
  const buildCaster = skillIds => ({ skillIds: () => skillIds });

  /**
   * Builds a battler exposing the raw state-id list the state resolver walks.
   * @param {number[]} stateIds The state ids currently on this battler.
   * @returns {object}
   */
  const buildBattler = stateIds => ({ allStateIds: () => stateIds });

  describe('getExtendedSkill', () =>
  {
    it('rejects a non-positive skill id outright', () =>
    {
      // Arrange- a zero or negative id is bad data, not a recoverable miss.
      const caster = buildCaster([]);

      // Act & Assert
      expect(() => OverlayManager.getExtendedSkill(caster, 0)).toThrow('Invalid skill extension id.');
    });

    it('returns the raw database skill when there is no caster', () =>
    {
      // Arrange- extension is defined relative to who is casting, so with nobody casting there is
      // nothing to overlay.
      globalThis.$dataSkills[1] = buildRow(1);

      // Act
      const result = OverlayManager.getExtendedSkill(null, 1);

      // Assert
      expect(result).toBe(globalThis.$dataSkills[1]);
    });

    it('returns the untouched database skill when the caster knows no overlays', () =>
    {
      // Arrange- skipping the clone entirely is a deliberate fast path.
      globalThis.$dataSkills[1] = buildRow(1);
      const caster = buildCaster([ 1 ]);

      // Act
      const result = OverlayManager.getExtendedSkill(caster, 1);

      // Assert
      expect(result).toBe(globalThis.$dataSkills[1]);
    });

    it('applies an id-based overlay the caster has learned', () =>
    {
      // Arrange- skill 2 declares that it extends skill 1.
      globalThis.$dataSkills[1] = buildRow(1, { mpCost: 10 });
      globalThis.$dataSkills[2] = buildRow(2, { mpCost: 30, isExtension: true, getExtensions: [ 1 ] });
      const caster = buildCaster([ 1, 2 ]);

      // Act
      const result = OverlayManager.getExtendedSkill(caster, 1);

      // Assert- the result is a clone, so the database row must be left intact.
      expect(result.mpCost).toBe(30);
      expect(globalThis.$dataSkills[1].mpCost).toBe(10);
    });

    it('ignores an overlay the caster has not learned', () =>
    {
      // Arrange- unlike states, a skill overlay only applies if the caster actually knows it.
      globalThis.$dataSkills[1] = buildRow(1, { mpCost: 10 });
      globalThis.$dataSkills[2] = buildRow(2, { mpCost: 30, isExtension: true, getExtensions: [ 1 ] });
      const caster = buildCaster([ 1 ]);

      // Act
      const result = OverlayManager.getExtendedSkill(caster, 1);

      // Assert
      expect(result.mpCost).toBe(10);
    });

    it('ignores a known skill that is not an extension', () =>
    {
      // Arrange
      globalThis.$dataSkills[1] = buildRow(1, { mpCost: 10 });
      globalThis.$dataSkills[2] = buildRow(2, { mpCost: 30, isExtension: false, getExtensions: [ 1 ] });
      const caster = buildCaster([ 1, 2 ]);

      // Act
      const result = OverlayManager.getExtendedSkill(caster, 1);

      // Assert
      expect(result.mpCost).toBe(10);
    });

    it('ignores a known skill id with no database row behind it', () =>
    {
      // Arrange- a forgotten or deleted database entry must not crash resolution.
      globalThis.$dataSkills[1] = buildRow(1, { mpCost: 10 });
      const caster = buildCaster([ 1, 99 ]);

      // Act
      const result = OverlayManager.getExtendedSkill(caster, 1);

      // Assert
      expect(result.mpCost).toBe(10);
    });

    it('applies a type-based overlay when the classifiers intersect', () =>
    {
      // Arrange- familial overlays apply to a whole family of skills without listing ids.
      globalThis.$dataSkills[1] = buildRow(1, { mpCost: 10, types: () => [ 'fire' ] });
      globalThis.$dataSkills[2] = buildRow(2, {
        mpCost: 40,
        isExtension: true,
        getExtensionTypes: [ 'fire' ],
      });
      const caster = buildCaster([ 1, 2 ]);

      // Act
      const result = OverlayManager.getExtendedSkill(caster, 1);

      // Assert
      expect(result.mpCost).toBe(40);
    });

    it('ignores a type-based overlay whose classifiers do not intersect', () =>
    {
      // Arrange
      globalThis.$dataSkills[1] = buildRow(1, { mpCost: 10, types: () => [ 'fire' ] });
      globalThis.$dataSkills[2] = buildRow(2, {
        mpCost: 40,
        isExtension: true,
        getExtensionTypes: [ 'ice' ],
      });
      const caster = buildCaster([ 1, 2 ]);

      // Act
      const result = OverlayManager.getExtendedSkill(caster, 1);

      // Assert
      expect(result.mpCost).toBe(10);
    });

    it('applies type-based overlays before id-based ones', () =>
    {
      // Arrange- familial first, specific second, so the specific overlay gets the last word. Both
      // set mpCost, and whichever applies last is the value that survives.
      globalThis.$dataSkills[1] = buildRow(1, { mpCost: 10, types: () => [ 'fire' ] });
      globalThis.$dataSkills[2] = buildRow(2, { mpCost: 20, isExtension: true, getExtensionTypes: [ 'fire' ] });
      globalThis.$dataSkills[3] = buildRow(3, { mpCost: 30, isExtension: true, getExtensions: [ 1 ] });
      const caster = buildCaster([ 1, 2, 3 ]);

      // Act
      const result = OverlayManager.getExtendedSkill(caster, 1);

      // Assert
      expect(result.mpCost).toBe(30);
    });

    it('applies overlays within a bucket in ascending id order', () =>
    {
      // Arrange- ordering has to be deterministic regardless of the order skills were learned.
      globalThis.$dataSkills[1] = buildRow(1, { mpCost: 10 });
      globalThis.$dataSkills[5] = buildRow(5, { mpCost: 50, isExtension: true, getExtensions: [ 1 ] });
      globalThis.$dataSkills[9] = buildRow(9, { mpCost: 90, isExtension: true, getExtensions: [ 1 ] });
      const caster = buildCaster([ 9, 5, 1 ]);

      // Act
      const result = OverlayManager.getExtendedSkill(caster, 1);

      // Assert- the highest id applies last and therefore wins.
      expect(result.mpCost).toBe(90);
    });

    it('applies type-based overlays within their own bucket in ascending id order', () =>
    {
      // Arrange- the id-ordering case above only ever fills the id bucket, leaving the type bucket
      // with a single entry and its ordering unexercised. two familial overlays put the type bucket
      // through the same ordering guarantee.
      globalThis.$dataSkills[1] = buildRow(1, {
        mpCost: 10,
        types: () => [ 'fire' ],
      });
      globalThis.$dataSkills[5] = buildRow(5, {
        mpCost: 50,
        isExtension: true,
        getExtensionTypes: [ 'fire' ],
      });
      globalThis.$dataSkills[9] = buildRow(9, {
        mpCost: 90,
        isExtension: true,
        getExtensionTypes: [ 'fire' ],
      });
      const caster = buildCaster([ 9, 5, 1 ]);

      // Act
      const result = OverlayManager.getExtendedSkill(caster, 1);

      // Assert- learned back to front, yet the highest id still applies last and wins.
      expect(result.mpCost).toBe(90);
    });

    it('resolves a chained overlay to its own extended form first', () =>
    {
      // Arrange- skill 3 extends skill 2, and skill 2 extends skill 1. Skill 2 must arrive already
      // carrying skill 3's changes before it is applied to skill 1.
      globalThis.$dataSkills[1] = buildRow(1, { mpCost: 10 });
      globalThis.$dataSkills[2] = buildRow(2, { mpCost: 20, isExtension: true, getExtensions: [ 1 ] });
      globalThis.$dataSkills[3] = buildRow(3, { mpCost: 99, isExtension: true, getExtensions: [ 2 ] });
      const caster = buildCaster([ 1, 2, 3 ]);

      // Act
      const result = OverlayManager.getExtendedSkill(caster, 1);

      // Assert
      expect(result.mpCost).toBe(99);
    });

    it('throws on a circular extension chain rather than recursing forever', () =>
    {
      // Arrange- skill 1 and skill 2 each declare the other as their extension target.
      globalThis.$dataSkills[1] = buildRow(1, { isExtension: true, getExtensions: [ 2 ] });
      globalThis.$dataSkills[2] = buildRow(2, { isExtension: true, getExtensions: [ 1 ] });
      const caster = buildCaster([ 1, 2 ]);

      // Act & Assert
      expect(() => OverlayManager.getExtendedSkill(caster, 1))
        .toThrow(/Circular skill extension detected on skill 1/);
    });

    it('leaves the guard clean enough for a later call to succeed after a cycle throws', () =>
    {
      // Arrange- the in-flight marker is cleared in a finally block precisely so one piece of bad
      // data does not poison every subsequent resolution for that caster.
      globalThis.$dataSkills[1] = buildRow(1, { isExtension: true, getExtensions: [ 2 ] });
      globalThis.$dataSkills[2] = buildRow(2, { isExtension: true, getExtensions: [ 1 ] });
      globalThis.$dataSkills[7] = buildRow(7, { mpCost: 7 });
      const caster = buildCaster([ 1, 2, 7 ]);

      // Act
      expect(() => OverlayManager.getExtendedSkill(caster, 1)).toThrow();
      const result = OverlayManager.getExtendedSkill(caster, 7);

      // Assert
      expect(result.mpCost).toBe(7);
    });

    it('serves a repeat lookup from cache without re-walking the caster skill list', () =>
    {
      // Arrange
      globalThis.$dataSkills[1] = buildRow(1, { mpCost: 10 });
      globalThis.$dataSkills[2] = buildRow(2, { mpCost: 30, isExtension: true, getExtensions: [ 1 ] });
      const skillIdsSpy = vi.fn(() => [ 1, 2 ]);
      const caster = { skillIds: skillIdsSpy };

      // Act- the first resolution necessarily walks the list more than once, because resolving the
      // overlay skill is itself a full resolution. What matters is that the *second* lookup of the
      // same id adds no walks at all.
      const first = OverlayManager.getExtendedSkill(caster, 1);
      const walksAfterFirstResolution = skillIdsSpy.mock.calls.length;
      const second = OverlayManager.getExtendedSkill(caster, 1);

      // Assert- identical object back, and no further walking.
      expect(second).toBe(first);
      expect(skillIdsSpy).toHaveBeenCalledTimes(walksAfterFirstResolution);
    });

    it('re-resolves after the caster cache is invalidated', () =>
    {
      // Arrange- learning or forgetting a skill changes which overlays apply, so the cached answer
      // must not survive it.
      globalThis.$dataSkills[1] = buildRow(1, { mpCost: 10 });
      const caster = buildCaster([ 1 ]);
      OverlayManager.getExtendedSkill(caster, 1);

      // Act
      OverlayManager.invalidate(caster);
      globalThis.$dataSkills[2] = buildRow(2, { mpCost: 30, isExtension: true, getExtensions: [ 1 ] });
      caster.skillIds = () => [ 1, 2 ];
      const result = OverlayManager.getExtendedSkill(caster, 1);

      // Assert
      expect(result.mpCost).toBe(30);
    });

    it('throws for a missing target skill even when nothing extends it', () =>
    {
      // Arrange- a dangling id is a data error however it is reached, so the no-overlay fast path
      // must not quietly hand back nothing.
      const caster = buildCaster([]);

      // Act & Assert
      expect(() => OverlayManager.getExtendedSkill(caster, 50))
        .toThrow('Extension targets a skill id that does not exist: 50. Check your <extend:> data.');
    });

    it('throws for a missing target skill when overlays are pointed at it', () =>
    {
      // Arrange- a known skill declares `<extend:[50]>` while skill 50 no longer exists.
      globalThis.$dataSkills[2] = buildRow(2, { isExtension: true, getExtensions: [ 50 ] });
      const caster = buildCaster([ 2 ]);

      // Act & Assert- the same named error either way, rather than an opaque TypeError on _clone.
      expect(() => OverlayManager.getExtendedSkill(caster, 50))
        .toThrow('Extension targets a skill id that does not exist: 50. Check your <extend:> data.');
    });

    it('throws for a missing target skill when there is no caster at all', () =>
    {
      // Arrange- the casterless path is still a database read for an id that does not exist.
      // Act & Assert
      expect(() => OverlayManager.getExtendedSkill(null, 50))
        .toThrow('Extension targets a skill id that does not exist: 50. Check your <extend:> data.');
    });
  });

  describe('getExtendedState', () =>
  {
    it('rejects a non-positive state id outright', () =>
    {
      // Arrange
      const battler = buildBattler([]);

      // Act & Assert
      expect(() => OverlayManager.getExtendedState(battler, 0)).toThrow('Invalid state id for extension.');
    });

    it('returns the raw database state when there is no battler', () =>
    {
      // Arrange
      globalThis.$dataStates[1] = buildRow(1);

      // Act
      const result = OverlayManager.getExtendedState(null, 1);

      // Assert
      expect(result).toBe(globalThis.$dataStates[1]);
    });

    it('returns the untouched database state when no overlays apply', () =>
    {
      // Arrange
      globalThis.$dataStates[1] = buildRow(1);
      const battler = buildBattler([ 1 ]);

      // Act
      const result = OverlayManager.getExtendedState(battler, 1);

      // Assert
      expect(result).toBe(globalThis.$dataStates[1]);
    });

    it('applies an id-based state overlay the battler currently carries', () =>
    {
      // Arrange
      globalThis.$dataStates[1] = buildRow(1, { priority: 50 });
      globalThis.$dataStates[2] = buildRow(2, { priority: 90, isExtension: true, getExtensions: [ 1 ] });
      const battler = buildBattler([ 1, 2 ]);

      // Act
      const result = OverlayManager.getExtendedState(battler, 1);

      // Assert
      expect(result.priority).toBe(90);
      expect(globalThis.$dataStates[1].priority).toBe(50);
    });

    it('applies a type-based state overlay when the classifiers intersect', () =>
    {
      // Arrange
      globalThis.$dataStates[1] = buildRow(1, { priority: 50, types: () => [ 'burn' ] });
      globalThis.$dataStates[2] = buildRow(2, {
        priority: 90,
        isExtension: true,
        getExtensionTypes: [ 'burn' ],
      });
      const battler = buildBattler([ 1, 2 ]);

      // Act
      const result = OverlayManager.getExtendedState(battler, 1);

      // Assert
      expect(result.priority).toBe(90);
    });

    it('ignores a carried state that is not an extension', () =>
    {
      // Arrange
      globalThis.$dataStates[1] = buildRow(1, { priority: 50 });
      globalThis.$dataStates[2] = buildRow(2, { priority: 90, isExtension: false, getExtensions: [ 1 ] });
      const battler = buildBattler([ 1, 2 ]);

      // Act
      const result = OverlayManager.getExtendedState(battler, 1);

      // Assert
      expect(result.priority).toBe(50);
    });

    it('ignores a carried state id with no database row behind it', () =>
    {
      // Arrange
      globalThis.$dataStates[1] = buildRow(1, { priority: 50 });
      const battler = buildBattler([ 1, 99 ]);

      // Act
      const result = OverlayManager.getExtendedState(battler, 1);

      // Assert
      expect(result.priority).toBe(50);
    });

    it('applies state overlays within a bucket in ascending id order', () =>
    {
      // Arrange
      globalThis.$dataStates[1] = buildRow(1, { priority: 10 });
      globalThis.$dataStates[5] = buildRow(5, { priority: 55, isExtension: true, getExtensions: [ 1 ] });
      globalThis.$dataStates[9] = buildRow(9, { priority: 99, isExtension: true, getExtensions: [ 1 ] });
      const battler = buildBattler([ 9, 5, 1 ]);

      // Act
      const result = OverlayManager.getExtendedState(battler, 1);

      // Assert
      expect(result.priority).toBe(99);
    });

    it('applies type-based state overlays within their own bucket in ascending id order', () =>
    {
      // Arrange- the ordering case above fills only the id bucket, so the type bucket's ordering
      // goes unexercised on the state side exactly as it did on the skill side.
      globalThis.$dataStates[1] = buildRow(1, {
        priority: 10,
        types: () => [ 'burn' ],
      });
      globalThis.$dataStates[5] = buildRow(5, {
        priority: 55,
        isExtension: true,
        getExtensionTypes: [ 'burn' ],
      });
      globalThis.$dataStates[9] = buildRow(9, {
        priority: 99,
        isExtension: true,
        getExtensionTypes: [ 'burn' ],
      });
      const battler = buildBattler([ 9, 5, 1 ]);

      // Act
      const result = OverlayManager.getExtendedState(battler, 1);

      // Assert
      expect(result.priority).toBe(99);
    });

    it('throws on a circular state extension chain', () =>
    {
      // Arrange
      globalThis.$dataStates[1] = buildRow(1, { isExtension: true, getExtensions: [ 2 ] });
      globalThis.$dataStates[2] = buildRow(2, { isExtension: true, getExtensions: [ 1 ] });
      const battler = buildBattler([ 1, 2 ]);

      // Act & Assert
      expect(() => OverlayManager.getExtendedState(battler, 1))
        .toThrow(/Circular state extension detected on state 1/);
    });

    it('serves a repeat state lookup from cache', () =>
    {
      // Arrange
      globalThis.$dataStates[1] = buildRow(1, { priority: 50 });
      globalThis.$dataStates[2] = buildRow(2, { priority: 90, isExtension: true, getExtensions: [ 1 ] });
      const allStateIdsSpy = vi.fn(() => [ 1, 2 ]);
      const battler = { allStateIds: allStateIdsSpy };

      // Act- as with skills, resolving the overlay is itself a resolution, so only the *second*
      // lookup of the same id is expected to add nothing.
      const first = OverlayManager.getExtendedState(battler, 1);
      const walksAfterFirstResolution = allStateIdsSpy.mock.calls.length;
      const second = OverlayManager.getExtendedState(battler, 1);

      // Assert
      expect(second).toBe(first);
      expect(allStateIdsSpy).toHaveBeenCalledTimes(walksAfterFirstResolution);
    });

    it('applies a duplicated overlay stack once per stack', () =>
    {
      // Arrange- unlike the skill path, the state list deliberately preserves duplicates so that two
      // stacks of the same passive each contribute. Every field the state merger touches is
      // last-wins, so stacking is invisible in the output; counting applications is the only way to
      // observe it.
      globalThis.$dataStates[1] = buildRow(1, { priority: 50 });
      globalThis.$dataStates[2] = buildRow(2, { priority: 90, isExtension: true, getExtensions: [ 1 ] });
      const extendStateSpy = vi.spyOn(OverlayManager, 'extendState');
      const battler = buildBattler([ 1, 2, 2 ]);

      // Act
      OverlayManager.getExtendedState(battler, 1);

      // Assert
      expect(extendStateSpy).toHaveBeenCalledTimes(2);

      extendStateSpy.mockRestore();
    });

    it('throws for a missing target state even when nothing extends it', () =>
    {
      // Arrange
      const battler = buildBattler([]);

      // Act & Assert
      expect(() => OverlayManager.getExtendedState(battler, 50))
        .toThrow('Extension targets a state id that does not exist: 50. Check your <extend:> data.');
    });

    it('throws for a missing target state when overlays are pointed at it', () =>
    {
      // Arrange- mirrors the skill-side case.
      globalThis.$dataStates[2] = buildRow(2, { isExtension: true, getExtensions: [ 50 ] });
      const battler = buildBattler([ 2 ]);

      // Act & Assert
      expect(() => OverlayManager.getExtendedState(battler, 50))
        .toThrow('Extension targets a state id that does not exist: 50. Check your <extend:> data.');
    });

    it('throws for a missing target state when there is no battler at all', () =>
    {
      // Arrange & Act & Assert
      expect(() => OverlayManager.getExtendedState(null, 50))
        .toThrow('Extension targets a state id that does not exist: 50. Check your <extend:> data.');
    });
  });

  describe('extendSkill', () =>
  {
    it('merges the overlay and strips the extension tags in one pass', () =>
    {
      // Arrange- sanitizing inside the merge is what stops an extended skill from re-extending itself
      // the next time it is resolved.
      const base = buildRow(1, { mpCost: 10, note: '<extend:[2]>\n<range:1>' });
      const overlay = buildRow(2, { mpCost: 30, note: '<range:5>' });

      // Act
      const result = OverlayManager.extendSkill(base, overlay);

      // Assert
      expect(result).toBe(base);
      expect(base.mpCost).toBe(30);
      expect(base.note).toContain('<range:5>');
      expect(base.note).not.toContain('extend:');
    });
  });
});
//endregion plugins/extend/core/managers/overlay-manager-resolution.test.js
