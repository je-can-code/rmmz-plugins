//region plugins/extend/core/managers/overlay-manager-extension.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installExtendHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJExtend,
} from '../../_component/fixtures/install-extend-host-globals.js';

/**
 * Builds a skill-shaped stand-in carrying RMMZ defaults, so each test only states the fields it is
 * actually about. `_clone` mirrors the real RPG_Base deep-copy contract the overlay path relies on.
 * @param {object} [overrides] Fields to replace.
 * @returns {object}
 */
function buildSkill(overrides = {})
{
  const skill = {
    id: 1,
    name: 'base',
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
    note: '',
    meta: {},
    effects: [],
    damage: { type: 0, critical: false, elementId: 0, variance: 20, formula: '0' },

    isExtension: false,
    getExtensions: [],
    getExtensionTypes: [],
    types: () => [],
  };

  Object.assign(skill, overrides);

  // a shallow spread would let overlays mutate the caller's damage object, which is exactly the bug
  // the real _clone exists to prevent.
  skill._clone = function()
  {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this, {
      damage: { ...this.damage },
      meta: { ...this.meta },
      effects: [ ...this.effects ],
    });
  };

  return skill;
}

/**
 * Builds a state-shaped stand-in carrying RMMZ defaults.
 * @param {object} [overrides] Fields to replace.
 * @returns {object}
 */
function buildState(overrides = {})
{
  const state = {
    id: 1,
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
    message1: '',
    message2: '',
    message3: '',
    message4: '',
    traits: [],
    note: '',
    meta: {},

    isExtension: false,
    getExtensions: [],
    getExtensionTypes: [],
    types: () => [],
  };

  Object.assign(state, overrides);

  state._clone = function()
  {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this, {
      meta: { ...this.meta },
      traits: [ ...this.traits ],
    });
  };

  return state;
}

describe('OverlayManager skill and state extension (direct src import)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/extend/core/managers/OverlayManager.js').default} */
  let OverlayManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    installExtendHostGlobals();

    ({ default: globalThis.JCache } = await import('../../../../../src/plugins/_base/core/core/JCache.js'));
    ({ default: globalThis.ArrayHelper } = await import('../../../../../src/plugins/_base/core/_utilities/ArrayHelper.js'));
    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));
    ({ default: globalThis.TraitResolver } = await import('../../../../../src/plugins/_base/core/managers/TraitResolver.js'));

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJExtend();
    await import('../../../../../src/plugins/extend/core/_metadata/initialization.js');

    ({ default: OverlayManager } = await import('../../../../../src/plugins/extend/core/managers/OverlayManager.js'));

    // add-state effects are identified by this RMMZ effect code.
    globalThis.Game_Action.EFFECT_ADD_STATE = 21;
  });

  beforeEach(() =>
  {
    globalThis.$dataSkills = [];
    globalThis.$dataStates = [];
    OverlayManager.clearCache();
  });

  describe('extendGeneral', () =>
  {
    it('takes the overlay mp cost when it differs', () =>
    {
      // Arrange
      const base = buildSkill({ mpCost: 10 });
      const overlay = buildSkill({ mpCost: 25 });

      // Act
      OverlayManager.extendGeneral(base, overlay);

      // Assert
      expect(base.mpCost).toBe(25);
    });

    it('leaves the mp cost alone when both agree', () =>
    {
      // Arrange
      const base = buildSkill({ mpCost: 10 });
      const overlay = buildSkill({ mpCost: 10 });

      // Act
      OverlayManager.extendGeneral(base, overlay);

      // Assert
      expect(base.mpCost).toBe(10);
    });

    it('takes the overlay tp cost when it differs', () =>
    {
      // Arrange
      const base = buildSkill({ tpCost: 5 });
      const overlay = buildSkill({ tpCost: 15 });

      // Act
      OverlayManager.extendGeneral(base, overlay);

      // Assert
      expect(base.tpCost).toBe(15);
    });

    it('leaves the tp cost alone when both agree', () =>
    {
      // Arrange
      const base = buildSkill({ tpCost: 5 });
      const overlay = buildSkill({ tpCost: 5 });

      // Act
      OverlayManager.extendGeneral(base, overlay);

      // Assert
      expect(base.tpCost).toBe(5);
    });

    it('takes the overlay scope when both declare one and they differ', () =>
    {
      // Arrange
      const base = buildSkill({ scope: 1 });
      const overlay = buildSkill({ scope: 2 });

      // Act
      OverlayManager.extendGeneral(base, overlay);

      // Assert
      expect(base.scope).toBe(2);
    });

    it('keeps the base scope when the overlay declares none', () =>
    {
      // Arrange- scope 0 means "none", which reads as "this overlay has no opinion" rather than as an
      // instruction to make the skill target nothing.
      const base = buildSkill({ scope: 1 });
      const overlay = buildSkill({ scope: 0 });

      // Act
      OverlayManager.extendGeneral(base, overlay);

      // Assert
      expect(base.scope).toBe(1);
    });

    it('keeps the base scope when the base itself declares none', () =>
    {
      // Arrange
      const base = buildSkill({ scope: 0 });
      const overlay = buildSkill({ scope: 2 });

      // Act
      OverlayManager.extendGeneral(base, overlay);

      // Assert
      expect(base.scope).toBe(0);
    });

    it('keeps the scope when both declare the same one', () =>
    {
      // Arrange
      const base = buildSkill({ scope: 2 });
      const overlay = buildSkill({ scope: 2 });

      // Act
      OverlayManager.extendGeneral(base, overlay);

      // Assert
      expect(base.scope).toBe(2);
    });
  });

  describe('extendDamage', () =>
  {
    it('contributes nothing when the overlay declares no damage type', () =>
    {
      // Arrange- a pure utility overlay must not blank out the base skill's damage.
      const base = buildSkill({ damage: { type: 1, critical: true, elementId: 3, variance: 20, formula: 'a.atk' } });
      const overlay = buildSkill({ damage: { type: 0, critical: false, elementId: 0, variance: 0, formula: '' } });

      // Act
      OverlayManager.extendDamage(base, overlay);

      // Assert
      expect(base.damage).toEqual({ type: 1, critical: true, elementId: 3, variance: 20, formula: 'a.atk' });
    });

    it('takes the overlay critical toggle when it differs', () =>
    {
      // Arrange
      const base = buildSkill({ damage: { type: 1, critical: false, elementId: 0, variance: 20, formula: '0' } });
      const overlay = buildSkill({ damage: { type: 1, critical: true, elementId: 0, variance: 20, formula: '0' } });

      // Act
      OverlayManager.extendDamage(base, overlay);

      // Assert
      expect(base.damage.critical).toBe(true);
    });

    it('leaves the critical toggle alone when both agree', () =>
    {
      // Arrange
      const base = buildSkill({ damage: { type: 1, critical: true, elementId: 0, variance: 20, formula: '0' } });
      const overlay = buildSkill({ damage: { type: 1, critical: true, elementId: 0, variance: 20, formula: '0' } });

      // Act
      OverlayManager.extendDamage(base, overlay);

      // Assert
      expect(base.damage.critical).toBe(true);
    });

    it('takes the overlay element when it differs', () =>
    {
      // Arrange
      const base = buildSkill({ damage: { type: 1, critical: false, elementId: 1, variance: 20, formula: '0' } });
      const overlay = buildSkill({ damage: { type: 1, critical: false, elementId: 4, variance: 20, formula: '0' } });

      // Act
      OverlayManager.extendDamage(base, overlay);

      // Assert
      expect(base.damage.elementId).toBe(4);
    });

    it('leaves the element alone when both agree', () =>
    {
      // Arrange
      const base = buildSkill({ damage: { type: 1, critical: false, elementId: 4, variance: 20, formula: '0' } });
      const overlay = buildSkill({ damage: { type: 1, critical: false, elementId: 4, variance: 20, formula: '0' } });

      // Act
      OverlayManager.extendDamage(base, overlay);

      // Assert
      expect(base.damage.elementId).toBe(4);
    });

    it('upgrades hp damage into hp drain', () =>
    {
      // Arrange- this is the one damage-type transition the merger deliberately allows.
      const base = buildSkill({ damage: { type: 1, critical: false, elementId: 0, variance: 20, formula: '0' } });
      const overlay = buildSkill({ damage: { type: 5, critical: false, elementId: 0, variance: 20, formula: '0' } });

      // Act
      OverlayManager.extendDamage(base, overlay);

      // Assert
      expect(base.damage.type).toBe(5);
    });

    it('upgrades mp damage into mp drain', () =>
    {
      // Arrange
      const base = buildSkill({ damage: { type: 2, critical: false, elementId: 0, variance: 20, formula: '0' } });
      const overlay = buildSkill({ damage: { type: 6, critical: false, elementId: 0, variance: 20, formula: '0' } });

      // Act
      OverlayManager.extendDamage(base, overlay);

      // Assert
      expect(base.damage.type).toBe(6);
    });

    it('leaves an unrelated damage-type change unapplied', () =>
    {
      // Arrange- turning a healing skill into a damaging one is not a supported upgrade path, so the
      // base type survives even though the two differ.
      const base = buildSkill({ damage: { type: 3, critical: false, elementId: 0, variance: 20, formula: '0' } });
      const overlay = buildSkill({ damage: { type: 1, critical: false, elementId: 0, variance: 20, formula: '0' } });

      // Act
      OverlayManager.extendDamage(base, overlay);

      // Assert
      expect(base.damage.type).toBe(3);
    });

    it('leaves the damage type alone when both agree', () =>
    {
      // Arrange
      const base = buildSkill({ damage: { type: 1, critical: false, elementId: 0, variance: 20, formula: '0' } });
      const overlay = buildSkill({ damage: { type: 1, critical: false, elementId: 0, variance: 20, formula: '0' } });

      // Act
      OverlayManager.extendDamage(base, overlay);

      // Assert
      expect(base.damage.type).toBe(1);
    });

    it('takes the overlay variance when it differs', () =>
    {
      // Arrange
      const base = buildSkill({ damage: { type: 1, critical: false, elementId: 0, variance: 20, formula: '0' } });
      const overlay = buildSkill({ damage: { type: 1, critical: false, elementId: 0, variance: 0, formula: '0' } });

      // Act
      OverlayManager.extendDamage(base, overlay);

      // Assert
      expect(base.damage.variance).toBe(0);
    });

    it('leaves the variance alone when both agree', () =>
    {
      // Arrange
      const base = buildSkill({ damage: { type: 1, critical: false, elementId: 0, variance: 20, formula: '0' } });
      const overlay = buildSkill({ damage: { type: 1, critical: false, elementId: 0, variance: 20, formula: '0' } });

      // Act
      OverlayManager.extendDamage(base, overlay);

      // Assert
      expect(base.damage.variance).toBe(20);
    });

    it('takes the overlay formula when it provides a different one', () =>
    {
      // Arrange
      const base = buildSkill({ damage: { type: 1, critical: false, elementId: 0, variance: 20, formula: 'a.atk' } });
      const overlay = buildSkill({ damage: { type: 1, critical: false, elementId: 0, variance: 20, formula: 'a.atk * 2' } });

      // Act
      OverlayManager.extendDamage(base, overlay);

      // Assert
      expect(base.damage.formula).toBe('a.atk * 2');
    });

    it('keeps the base formula when the overlay supplies a blank one', () =>
    {
      // Arrange- a blank formula is an absent opinion, not an instruction to deal no damage.
      const base = buildSkill({ damage: { type: 1, critical: false, elementId: 0, variance: 20, formula: 'a.atk' } });
      const overlay = buildSkill({ damage: { type: 1, critical: false, elementId: 0, variance: 20, formula: '' } });

      // Act
      OverlayManager.extendDamage(base, overlay);

      // Assert
      expect(base.damage.formula).toBe('a.atk');
    });

    it('keeps the formula when both agree', () =>
    {
      // Arrange
      const base = buildSkill({ damage: { type: 1, critical: false, elementId: 0, variance: 20, formula: 'a.atk' } });
      const overlay = buildSkill({ damage: { type: 1, critical: false, elementId: 0, variance: 20, formula: 'a.atk' } });

      // Act
      OverlayManager.extendDamage(base, overlay);

      // Assert
      expect(base.damage.formula).toBe('a.atk');
    });
  });

  describe('extendEffects', () =>
  {
    it('contributes nothing when the overlay declares no effects', () =>
    {
      // Arrange
      const base = buildSkill({ effects: [ { code: 11, dataId: 0, value1: 1 } ] });
      const overlay = buildSkill({ effects: [] });

      // Act
      OverlayManager.extendEffects(base, overlay);

      // Assert
      expect(base.effects).toEqual([ { code: 11, dataId: 0, value1: 1 } ]);
    });

    it('concatenates effects that are not add-state', () =>
    {
      // Arrange
      const base = buildSkill({ effects: [ { code: 11, dataId: 0, value1: 1 } ] });
      const overlay = buildSkill({ effects: [ { code: 12, dataId: 0, value1: 2 } ] });

      // Act
      OverlayManager.extendEffects(base, overlay);

      // Assert
      expect(base.effects).toHaveLength(2);
    });

    it('replaces a base add-state entry the overlay also declares', () =>
    {
      // Arrange- two entries for the same state would roll application twice, so an overlay
      // upgrading a 50% chance to a guaranteed one must supersede rather than stack.
      const base = buildSkill({ effects: [ { code: 21, dataId: 4, value1: 0.5 } ] });
      const overlay = buildSkill({ effects: [ { code: 21, dataId: 4, value1: 1.0 } ] });

      // Act
      OverlayManager.extendEffects(base, overlay);

      // Assert
      expect(base.effects).toEqual([ { code: 21, dataId: 4, value1: 1.0 } ]);
    });

    it('keeps base add-state entries for states the overlay does not mention', () =>
    {
      // Arrange
      const base = buildSkill({ effects: [ { code: 21, dataId: 4, value1: 0.5 } ] });
      const overlay = buildSkill({ effects: [ { code: 21, dataId: 9, value1: 1.0 } ] });

      // Act
      OverlayManager.extendEffects(base, overlay);

      // Assert
      expect(base.effects).toHaveLength(2);
    });

    it('leaves non-add-state base effects untouched while replacing add-states', () =>
    {
      // Arrange- the strip pass must be surgical, not a wholesale clear.
      const base = buildSkill({
        effects: [ { code: 11, dataId: 0, value1: 1 }, { code: 21, dataId: 4, value1: 0.5 } ],
      });
      const overlay = buildSkill({ effects: [ { code: 21, dataId: 4, value1: 1.0 } ] });

      // Act
      OverlayManager.extendEffects(base, overlay);

      // Assert
      expect(base.effects).toEqual([
        { code: 11, dataId: 0, value1: 1 },
        { code: 21, dataId: 4, value1: 1.0 },
      ]);
    });
  });

  describe('extendInvocation', () =>
  {
    it('adds the overlay speed onto the base', () =>
    {
      // Arrange
      const base = buildSkill({ speed: 10 });
      const overlay = buildSkill({ speed: 5 });

      // Act
      OverlayManager.extendInvocation(base, overlay);

      // Assert
      expect(base.speed).toBe(15);
    });

    it('leaves speed untouched when the overlay declares none', () =>
    {
      // Arrange
      const base = buildSkill({ speed: 10 });
      const overlay = buildSkill({ speed: 0 });

      // Act
      OverlayManager.extendInvocation(base, overlay);

      // Assert
      expect(base.speed).toBe(10);
    });

    it('adds the overlay repeats beyond the default single hit', () =>
    {
      // Arrange- repeats are one-based, so an overlay of 3 contributes two extra hits.
      const base = buildSkill({ repeats: 2 });
      const overlay = buildSkill({ repeats: 3 });

      // Act
      OverlayManager.extendInvocation(base, overlay);

      // Assert
      expect(base.repeats).toBe(4);
    });

    it('leaves repeats untouched when the overlay uses the default', () =>
    {
      // Arrange
      const base = buildSkill({ repeats: 2 });
      const overlay = buildSkill({ repeats: 1 });

      // Act
      OverlayManager.extendInvocation(base, overlay);

      // Assert
      expect(base.repeats).toBe(2);
    });

    it('adds a declared overlay success rate that differs from the base', () =>
    {
      // Arrange- an overlay that deliberately states an accuracy contribution stacks onto the base.
      const base = buildSkill({ successRate: 80 });
      const overlay = buildSkill({ successRate: 15 });

      // Act
      OverlayManager.extendInvocation(base, overlay);

      // Assert
      expect(base.successRate).toBe(95);
    });

    it('ignores an overlay success rate left at the default', () =>
    {
      // Arrange- 100 is the RMMZ default and means "this overlay has no opinion on accuracy". Adding
      // it would hand a flat +100 to any skill that was authored to sometimes miss.
      const base = buildSkill({ successRate: 80 });
      const overlay = buildSkill({ successRate: 100 });

      // Act
      OverlayManager.extendInvocation(base, overlay);

      // Assert
      expect(base.successRate).toBe(80);
    });

    it('ignores an overlay success rate identical to the base', () =>
    {
      // Arrange- matching values carry no new information and must not double up.
      const base = buildSkill({ successRate: 80 });
      const overlay = buildSkill({ successRate: 80 });

      // Act
      OverlayManager.extendInvocation(base, overlay);

      // Assert
      expect(base.successRate).toBe(80);
    });

    it('leaves two default success rates untouched', () =>
    {
      // Arrange- the overwhelmingly common case: neither side says anything about accuracy.
      const base = buildSkill({ successRate: 100 });
      const overlay = buildSkill({ successRate: 100 });

      // Act
      OverlayManager.extendInvocation(base, overlay);

      // Assert
      expect(base.successRate).toBe(100);
    });

    it('accumulates tp gain unconditionally', () =>
    {
      // Arrange
      const base = buildSkill({ tpGain: 5 });
      const overlay = buildSkill({ tpGain: 3 });

      // Act
      OverlayManager.extendInvocation(base, overlay);

      // Assert
      expect(base.tpGain).toBe(8);
    });

    it('takes the overlay hit type when both declare a non-certain one', () =>
    {
      // Arrange
      const base = buildSkill({ hitType: 1 });
      const overlay = buildSkill({ hitType: 2 });

      // Act
      OverlayManager.extendInvocation(base, overlay);

      // Assert
      expect(base.hitType).toBe(2);
    });

    it('keeps the base hit type when the overlay is certain-hit', () =>
    {
      // Arrange- hit type 0 is the default and reads as "no opinion".
      const base = buildSkill({ hitType: 1 });
      const overlay = buildSkill({ hitType: 0 });

      // Act
      OverlayManager.extendInvocation(base, overlay);

      // Assert
      expect(base.hitType).toBe(1);
    });

    it('keeps the base hit type when the base is certain-hit', () =>
    {
      // Arrange
      const base = buildSkill({ hitType: 0 });
      const overlay = buildSkill({ hitType: 2 });

      // Act
      OverlayManager.extendInvocation(base, overlay);

      // Assert
      expect(base.hitType).toBe(0);
    });

    it('takes the overlay animation when it declares a different one', () =>
    {
      // Arrange
      const base = buildSkill({ animationId: 5 });
      const overlay = buildSkill({ animationId: 9 });

      // Act
      OverlayManager.extendInvocation(base, overlay);

      // Assert
      expect(base.animationId).toBe(9);
    });

    it('keeps the base animation when the overlay declares none', () =>
    {
      // Arrange- an overlay that only changes damage should not silently blank the visual.
      const base = buildSkill({ animationId: 5 });
      const overlay = buildSkill({ animationId: 0 });

      // Act
      OverlayManager.extendInvocation(base, overlay);

      // Assert
      expect(base.animationId).toBe(5);
    });

    it('keeps the animation when both declare the same one', () =>
    {
      // Arrange
      const base = buildSkill({ animationId: 5 });
      const overlay = buildSkill({ animationId: 5 });

      // Act
      OverlayManager.extendInvocation(base, overlay);

      // Assert
      expect(base.animationId).toBe(5);
    });
  });

  describe('extendMessage', () =>
  {
    it('takes a non-blank overlay first message', () =>
    {
      // Arrange
      const base = buildSkill({ message1: 'attacks!' });
      const overlay = buildSkill({ message1: 'unleashes!' });

      // Act
      OverlayManager.extendMessage(base, overlay);

      // Assert
      expect(base.message1).toBe('unleashes!');
    });

    it('keeps the base first message when the overlay is blank', () =>
    {
      // Arrange
      const base = buildSkill({ message1: 'attacks!' });
      const overlay = buildSkill({ message1: '' });

      // Act
      OverlayManager.extendMessage(base, overlay);

      // Assert
      expect(base.message1).toBe('attacks!');
    });

    it('keeps the first message when both agree', () =>
    {
      // Arrange
      const base = buildSkill({ message1: 'attacks!' });
      const overlay = buildSkill({ message1: 'attacks!' });

      // Act
      OverlayManager.extendMessage(base, overlay);

      // Assert
      expect(base.message1).toBe('attacks!');
    });

    it('takes a non-blank overlay second message', () =>
    {
      // Arrange
      const base = buildSkill({ message2: 'and again!' });
      const overlay = buildSkill({ message2: 'and harder!' });

      // Act
      OverlayManager.extendMessage(base, overlay);

      // Assert
      expect(base.message2).toBe('and harder!');
    });

    it('keeps the base second message when the overlay is blank', () =>
    {
      // Arrange
      const base = buildSkill({ message2: 'and again!' });
      const overlay = buildSkill({ message2: '' });

      // Act
      OverlayManager.extendMessage(base, overlay);

      // Assert
      expect(base.message2).toBe('and again!');
    });

    it('keeps the second message when both agree', () =>
    {
      // Arrange
      const base = buildSkill({ message2: 'and again!' });
      const overlay = buildSkill({ message2: 'and again!' });

      // Act
      OverlayManager.extendMessage(base, overlay);

      // Assert
      expect(base.message2).toBe('and again!');
    });
  });

  describe('extendMetadata', () =>
  {
    it('merges the overlay meta over the base meta', () =>
    {
      // Arrange
      const base = buildSkill({ meta: { a: 1, b: 2 } });
      const overlay = buildSkill({ meta: { b: 3, c: 4 } });

      // Act
      OverlayManager.extendMetadata(base, overlay);

      // Assert- the overlay wins on conflict, and base-only keys survive.
      expect(base.meta).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('merges the notes through the key-aware note merger', () =>
    {
      // Arrange
      const base = buildSkill({ note: '<range:1>' });
      const overlay = buildSkill({ note: '<range:5>' });

      // Act
      OverlayManager.extendMetadata(base, overlay);

      // Assert- blind concatenation would leave both tags present and the first one winning.
      expect(base.note).toBe('<range:5>');
    });

    it('invalidates the cached note parse for the mutated skill', () =>
    {
      // Arrange- RPGManager memoizes tag parses per object; a stale entry would keep serving the
      // pre-overlay note forever.
      const invalidateSpy = vi.spyOn(globalThis.RPGManager, 'invalidate');
      const base = buildSkill();
      const overlay = buildSkill();

      // Act
      OverlayManager.extendMetadata(base, overlay);

      // Assert
      expect(invalidateSpy).toHaveBeenCalledWith(base);

      invalidateSpy.mockRestore();
    });
  });

  describe('sanitizeExtensions', () =>
  {
    it('strips the extension tags out of the note', () =>
    {
      // Arrange- leaving them in would let the extended result re-trigger its own extension forever.
      const base = buildSkill({ note: '<extend:[2]>\n<range:5>' });

      // Act
      OverlayManager.sanitizeExtensions(base);

      // Assert
      expect(base.note).not.toContain('extend');
      expect(base.note).toContain('<range:5>');
    });

    it('strips the extension-type tag out of the note', () =>
    {
      // Arrange
      const base = buildSkill({ note: '<extendType:fire>\n<range:5>' });

      // Act
      OverlayManager.sanitizeExtensions(base);

      // Assert
      expect(base.note).not.toContain('extendType');
    });

    it('removes the extension keys from the metadata', () =>
    {
      // Arrange
      const base = buildSkill({ meta: { extend: '[2]', extendType: 'fire', keep: 1 } });

      // Act
      OverlayManager.sanitizeExtensions(base);

      // Assert
      expect(base.meta).toEqual({ keep: 1 });
    });

    it('collapses the blank lines left behind by tag removal', () =>
    {
      // Arrange- deleting a tag mid-note leaves an empty line that would otherwise accumulate on
      // every link of a long extension chain.
      const base = buildSkill({ note: '<a:1>\n<extend:[2]>\n<b:1>' });

      // Act
      OverlayManager.sanitizeExtensions(base);

      // Assert
      expect(base.note).not.toContain('\n\n');
    });
  });

  describe('state extension', () =>
  {
    it('takes the overlay restriction when it declares one', () =>
    {
      // Arrange
      const base = buildState({ restriction: 0 });
      const overlay = buildState({ restriction: 4 });

      // Act
      OverlayManager.extendStateGeneral(base, overlay);

      // Assert
      expect(base.restriction).toBe(4);
    });

    it('keeps the base restriction when the overlay declares none', () =>
    {
      // Arrange
      const base = buildState({ restriction: 4 });
      const overlay = buildState({ restriction: 0 });

      // Act
      OverlayManager.extendStateGeneral(base, overlay);

      // Assert
      expect(base.restriction).toBe(4);
    });

    it('takes a non-default overlay priority', () =>
    {
      // Arrange
      const base = buildState({ priority: 50 });
      const overlay = buildState({ priority: 90 });

      // Act
      OverlayManager.extendStateGeneral(base, overlay);

      // Assert
      expect(base.priority).toBe(90);
    });

    it('keeps the base priority when the overlay uses the default', () =>
    {
      // Arrange
      const base = buildState({ priority: 90 });
      const overlay = buildState({ priority: 50 });

      // Act
      OverlayManager.extendStateGeneral(base, overlay);

      // Assert
      expect(base.priority).toBe(90);
    });

    it('takes a declared overlay icon', () =>
    {
      // Arrange
      const base = buildState({ overlay: 0 });
      const overlay = buildState({ overlay: 3 });

      // Act
      OverlayManager.extendStateGeneral(base, overlay);

      // Assert
      expect(base.overlay).toBe(3);
    });

    it('keeps the base icon when the overlay declares none', () =>
    {
      // Arrange
      const base = buildState({ overlay: 3 });
      const overlay = buildState({ overlay: 0 });

      // Act
      OverlayManager.extendStateGeneral(base, overlay);

      // Assert
      expect(base.overlay).toBe(3);
    });

    it('takes a declared overlay battler motion', () =>
    {
      // Arrange
      const base = buildState({ motion: 0 });
      const overlay = buildState({ motion: 2 });

      // Act
      OverlayManager.extendStateGeneral(base, overlay);

      // Assert
      expect(base.motion).toBe(2);
    });

    it('keeps the base motion when the overlay declares none', () =>
    {
      // Arrange
      const base = buildState({ motion: 2 });
      const overlay = buildState({ motion: 0 });

      // Act
      OverlayManager.extendStateGeneral(base, overlay);

      // Assert
      expect(base.motion).toBe(2);
    });

    it('takes a declared overlay auto-removal timing', () =>
    {
      // Arrange
      const base = buildState({ autoRemovalTiming: 0 });
      const overlay = buildState({ autoRemovalTiming: 2 });

      // Act
      OverlayManager.extendStateRemoval(base, overlay);

      // Assert
      expect(base.autoRemovalTiming).toBe(2);
    });

    it('keeps the base auto-removal timing when the overlay declares none', () =>
    {
      // Arrange
      const base = buildState({ autoRemovalTiming: 2 });
      const overlay = buildState({ autoRemovalTiming: 0 });

      // Act
      OverlayManager.extendStateRemoval(base, overlay);

      // Assert
      expect(base.autoRemovalTiming).toBe(2);
    });

    it('takes non-default overlay turn bounds', () =>
    {
      // Arrange
      const base = buildState({ minTurns: 1, maxTurns: 1 });
      const overlay = buildState({ minTurns: 3, maxTurns: 5 });

      // Act
      OverlayManager.extendStateRemoval(base, overlay);

      // Assert
      expect(base.minTurns).toBe(3);
      expect(base.maxTurns).toBe(5);
    });

    it('keeps base turn bounds when the overlay uses the defaults', () =>
    {
      // Arrange
      const base = buildState({ minTurns: 3, maxTurns: 5 });
      const overlay = buildState({ minTurns: 1, maxTurns: 1 });

      // Act
      OverlayManager.extendStateRemoval(base, overlay);

      // Assert
      expect(base.minTurns).toBe(3);
      expect(base.maxTurns).toBe(5);
    });

    it('lets the overlay win outright on every boolean removal flag', () =>
    {
      // Arrange- these are last-wins by design, so an overlay can turn a flag back off.
      const base = buildState({
        removeAtBattleEnd: true,
        removeByRestriction: true,
        removeByDamage: true,
        removeByWalking: true,
      });
      const overlay = buildState();

      // Act
      OverlayManager.extendStateRemoval(base, overlay);

      // Assert
      expect(base.removeAtBattleEnd).toBe(false);
      expect(base.removeByRestriction).toBe(false);
      expect(base.removeByDamage).toBe(false);
      expect(base.removeByWalking).toBe(false);
    });

    it('takes non-default overlay damage-removal odds and step counts', () =>
    {
      // Arrange
      const base = buildState({ chanceByDamage: 100, stepsToRemove: 100 });
      const overlay = buildState({ chanceByDamage: 25, stepsToRemove: 50 });

      // Act
      OverlayManager.extendStateRemoval(base, overlay);

      // Assert
      expect(base.chanceByDamage).toBe(25);
      expect(base.stepsToRemove).toBe(50);
    });

    it('keeps base damage-removal odds and step counts when the overlay uses defaults', () =>
    {
      // Arrange
      const base = buildState({ chanceByDamage: 25, stepsToRemove: 50 });
      const overlay = buildState({ chanceByDamage: 100, stepsToRemove: 100 });

      // Act
      OverlayManager.extendStateRemoval(base, overlay);

      // Assert
      expect(base.chanceByDamage).toBe(25);
      expect(base.stepsToRemove).toBe(50);
    });

    it('takes each non-empty overlay state message', () =>
    {
      // Arrange
      const base = buildState({ message1: 'a', message2: 'b', message3: 'c', message4: 'd' });
      const overlay = buildState({ message1: 'w', message2: 'x', message3: 'y', message4: 'z' });

      // Act
      OverlayManager.extendStateMessages(base, overlay);

      // Assert
      expect([ base.message1, base.message2, base.message3, base.message4 ]).toEqual([ 'w', 'x', 'y', 'z' ]);
    });

    it('keeps base state messages the overlay leaves blank', () =>
    {
      // Arrange
      const base = buildState({ message1: 'a', message2: 'b', message3: 'c', message4: 'd' });
      const overlay = buildState();

      // Act
      OverlayManager.extendStateMessages(base, overlay);

      // Assert
      expect([ base.message1, base.message2, base.message3, base.message4 ]).toEqual([ 'a', 'b', 'c', 'd' ]);
    });

    it('overlays traits through the shared trait resolver', () =>
    {
      // Arrange- delegating keeps trait precedence identical to every other overlay site.
      const overlaySpy = vi.spyOn(globalThis.TraitResolver, 'overlayTraits').mockReturnValue([ 'merged' ]);
      const base = buildState({ traits: [ 'base' ] });
      const overlay = buildState({ traits: [ 'overlay' ] });

      // Act
      OverlayManager.extendStateTraits(base, overlay);

      // Assert
      expect(overlaySpy).toHaveBeenCalledWith([ 'base' ], [ 'overlay' ]);
      expect(base.traits).toEqual([ 'merged' ]);

      overlaySpy.mockRestore();
    });

    it('strips the extension tags out of a state note', () =>
    {
      // Arrange
      const base = buildState({ note: '<extend:[2]>\n<extendType:burn>\n<keep:1>' });

      // Act
      OverlayManager.sanitizeStateExtensions(base);

      // Assert
      expect(base.note).not.toContain('extend');
      expect(base.note).toContain('<keep:1>');
    });

    it('runs every stage when extending a state end to end', () =>
    {
      // Arrange
      const base = buildState({ restriction: 0, priority: 50, note: '<extend:[2]>' });
      const overlay = buildState({ restriction: 4, priority: 90, note: '<range:5>' });

      // Act
      const result = OverlayManager.extendState(base, overlay);

      // Assert
      expect(result).toBe(base);
      expect(base.restriction).toBe(4);
      expect(base.priority).toBe(90);
      expect(base.note).toContain('<range:5>');
      expect(base.note).not.toContain('extend:');
    });
  });

  describe('cache lifecycle', () =>
  {
    it('invalidates both the skill and state caches for one battler', () =>
    {
      // Arrange- skills and states are cached separately but a single learn/forget must clear both.
      const skillSpy = vi.spyOn(OverlayManager._skillCache, 'invalidate');
      const stateSpy = vi.spyOn(OverlayManager._stateCache, 'invalidate');
      const battler = {};

      // Act
      OverlayManager.invalidate(battler);

      // Assert
      expect(skillSpy).toHaveBeenCalledWith(battler);
      expect(stateSpy).toHaveBeenCalledWith(battler);

      skillSpy.mockRestore();
      stateSpy.mockRestore();
    });

    it('clears both caches wholesale', () =>
    {
      // Arrange
      const skillSpy = vi.spyOn(OverlayManager._skillCache, 'clear');
      const stateSpy = vi.spyOn(OverlayManager._stateCache, 'clear');

      // Act
      OverlayManager.clearCache();

      // Assert
      expect(skillSpy).toHaveBeenCalled();
      expect(stateSpy).toHaveBeenCalled();

      skillSpy.mockRestore();
      stateSpy.mockRestore();
    });
  });
});
//endregion plugins/extend/core/managers/overlay-manager-extension.test.js
