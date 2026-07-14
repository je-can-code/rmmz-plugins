//region plugins/abs/ext/charge/_models/jabs-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Charge JABS_Battler (unit, all downstream dependencies mocked)', () =>
{
  /** @type {import('vitest').Mock} the "original" (aliased) prototype methods this file wraps. */
  let originalInitBattleInfo;
  let originalUpdate;

  /** duck-typed stand-in constructed by JABS_ChargingTier when this file needs a real instance. */
  class FakeChargingTier
  {
    constructor(tier, maxDuration, skillId, whileChargingAnimationId, chargeTierCompleteAnimationId)
    {
      this.tier = tier;
      this.maxDuration = maxDuration;
      this.skillId = skillId;
      this.whileChargingAnimationId = whileChargingAnimationId;
      this.chargeTierCompleteAnimationId = chargeTierCompleteAnimationId;
      this.duration = 0;
      this.completed = false;
    }

    static defaultTier(fillerTier = 1)
    {
      return new FakeChargingTier(fillerTier, 30, 0, 0, 0);
    }

    update()
    {
      this.duration++;
      if (this.duration >= this.maxDuration) this.completed = true;
    }
  }

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: {
          CHARGE: {
            Aliased: { JABS_Battler: new Map() },
            Metadata: {
              DefaultFullyChargedAnimationId: 0,
              DefaultChargingAnimationId: 0,
              DefaultTierCompleteAnimationId: 0,
              UseTierCompleteSE: false,
              AllowTierCompleteSEandAnimation: false,
            },
          },
        },
      },
    };

    globalThis.SoundManager = { playChargeTierCompleteSE: vi.fn(), playMaxChargeReadySE: vi.fn() };

    vi.doMock('../../../../../../src/plugins/abs/ext/charge/_models/JABS_ChargingTier.js', () => ({
      default: FakeChargingTier,
    }));

    function JABS_Battler()
    {
    }

    originalInitBattleInfo = vi.fn();
    originalUpdate = vi.fn();
    JABS_Battler.prototype.initBattleInfo = originalInitBattleInfo;
    JABS_Battler.prototype.update = originalUpdate;
    globalThis.JABS_Battler = JABS_Battler;

    await import('../../../../../../src/plugins/abs/ext/charge/_models/JABS_Battler.js');
  });

  beforeEach(() =>
  {
    originalInitBattleInfo.mockReset();
    originalUpdate.mockReset();
    globalThis.SoundManager.playChargeTierCompleteSE.mockReset();
    globalThis.SoundManager.playMaxChargeReadySE.mockReset();
    globalThis.J.ABS.EXT.CHARGE.Metadata.DefaultFullyChargedAnimationId = 0;
    globalThis.J.ABS.EXT.CHARGE.Metadata.DefaultChargingAnimationId = 0;
    globalThis.J.ABS.EXT.CHARGE.Metadata.DefaultTierCompleteAnimationId = 0;
    globalThis.J.ABS.EXT.CHARGE.Metadata.UseTierCompleteSE = false;
    globalThis.J.ABS.EXT.CHARGE.Metadata.AllowTierCompleteSEandAnimation = false;
  });

  /** Builds a duck-typed JABS_Battler carrying the real patched prototype. */
  function buildBattler(overrides = {})
  {
    const battler = Object.create(globalThis.JABS_Battler.prototype);
    battler.showAnimation = vi.fn();
    battler.initBattleInfo();
    return Object.assign(battler, overrides);
  }

  describe('initBattleInfo / initChargeData', () =>
  {
    it('calls the original then defaults all charge members', () =>
    {
      // Arrange
      const battler = Object.create(globalThis.JABS_Battler.prototype);

      // Act
      battler.initBattleInfo();

      // Assert
      expect(originalInitBattleInfo).toHaveBeenCalledTimes(1);
      expect(battler.isCharging()).toBe(false);
      expect(battler.getChargingSlot()).toBeNull();
      expect(battler.getChargingTierData()).toEqual([]);
    });
  });

  describe('property getters/setters', () =>
  {
    it('isCharging/beginCharging/stopCharging track the charging flag', () =>
    {
      const battler = buildBattler();
      expect(battler.isCharging()).toBe(false);
      battler.beginCharging();
      expect(battler.isCharging()).toBe(true);
      battler.stopCharging();
      expect(battler.isCharging()).toBe(false);
    });

    it('getChargingSlot/setChargingSlot track the current slot', () =>
    {
      const battler = buildBattler();
      battler.setChargingSlot('mainhand');
      expect(battler.getChargingSlot()).toBe('mainhand');
    });

    it('getChargingTierData/setChargingTierData/hasChargingTierData track the tier list', () =>
    {
      const battler = buildBattler();
      expect(battler.hasChargingTierData()).toBe(false);
      battler.setChargingTierData([ new FakeChargingTier(1, 10, 5, 0, 0) ]);
      expect(battler.hasChargingTierData()).toBe(true);
    });
  });

  describe('getCurrentChargingTier', () =>
  {
    it('returns null when there is no tier data', () =>
    {
      const battler = buildBattler();
      expect(battler.getCurrentChargingTier()).toBeNull();
    });

    it('returns null when every tier is already completed', () =>
    {
      const battler = buildBattler();
      const tier = new FakeChargingTier(1, 10, 5, 0, 0);
      tier.completed = true;
      battler.setChargingTierData([ tier ]);
      expect(battler.getCurrentChargingTier()).toBeNull();
    });

    it('returns the lowest-numbered incomplete tier', () =>
    {
      const battler = buildBattler();
      const tier1 = new FakeChargingTier(1, 10, 5, 0, 0);
      tier1.completed = true;
      const tier2 = new FakeChargingTier(2, 10, 6, 0, 0);
      const tier3 = new FakeChargingTier(3, 10, 7, 0, 0);
      battler.setChargingTierData([ tier3, tier2, tier1 ]);
      expect(battler.getCurrentChargingTier()).toBe(tier2);
    });
  });

  describe('getHighestChargedTier', () =>
  {
    it('returns null when there is no tier data', () =>
    {
      const battler = buildBattler();
      expect(battler.getHighestChargedTier()).toBeNull();
    });

    it('returns null when no tiers are completed', () =>
    {
      const battler = buildBattler();
      battler.setChargingTierData([ new FakeChargingTier(1, 10, 5, 0, 0) ]);
      expect(battler.getHighestChargedTier()).toBeNull();
    });

    it('returns the highest-numbered completed tier', () =>
    {
      const battler = buildBattler();
      const tier1 = new FakeChargingTier(1, 10, 5, 0, 0);
      tier1.completed = true;
      const tier2 = new FakeChargingTier(2, 10, 6, 0, 0);
      tier2.completed = true;
      battler.setChargingTierData([ tier1, tier2 ]);
      expect(battler.getHighestChargedTier()).toBe(tier2);
    });
  });

  describe('getHighestChargedTierWithSkillId', () =>
  {
    it('returns null when there is no tier data', () =>
    {
      const battler = buildBattler();
      expect(battler.getHighestChargedTierWithSkillId()).toBeNull();
    });

    it('skips completed tiers with no skill id', () =>
    {
      const battler = buildBattler();
      const tier1 = new FakeChargingTier(1, 10, 0, 0, 0);
      tier1.completed = true;
      battler.setChargingTierData([ tier1 ]);
      expect(battler.getHighestChargedTierWithSkillId()).toBeNull();
    });

    it('returns the highest-numbered completed tier that has a skill id', () =>
    {
      const battler = buildBattler();
      const tier1 = new FakeChargingTier(1, 10, 5, 0, 0);
      tier1.completed = true;
      const tier2 = new FakeChargingTier(2, 10, 0, 0, 0);
      tier2.completed = true;
      battler.setChargingTierData([ tier1, tier2 ]);
      expect(battler.getHighestChargedTierWithSkillId()).toBe(tier1);
    });
  });

  describe('resetChargeData', () =>
  {
    it('clears the slot, tier data, and stops charging', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setChargingSlot('mainhand');
      battler.setChargingTierData([ new FakeChargingTier(1, 10, 5, 0, 0) ]);
      battler.beginCharging();

      // Act
      battler.resetChargeData();

      // Assert
      expect(battler.getChargingSlot()).toBeNull();
      expect(battler.getChargingTierData()).toEqual([]);
      expect(battler.isCharging()).toBe(false);
    });
  });

  describe('canChargeSlot', () =>
  {
    function buildSlotBattler(overrides = {})
    {
      const skillSlot = { id: 5 };
      const rawBattler = {
        getSkillSlotManager: () => ({ getSkillSlotByKey: () => skillSlot }),
        hasSkill: () => true,
        meetsSkillConditions: () => true,
        skill: () => ({ id: 5 }),
      };
      const battler = buildBattler({ getBattler: () => rawBattler, getChargingTiers: () => null });
      return Object.assign(battler, overrides);
    }

    it('cannot charge when no slot is provided', () =>
    {
      const battler = buildSlotBattler();
      expect(battler.canChargeSlot(null)).toBe(false);
    });

    it('cannot charge when the slot has no equipped skill', () =>
    {
      const battler = buildBattler({
        getBattler: () => ({ getSkillSlotManager: () => ({ getSkillSlotByKey: () => null }) }),
      });
      expect(battler.canChargeSlot('mainhand')).toBe(false);
    });

    it('cannot charge a skill the battler does not know', () =>
    {
      const battler = buildSlotBattler({
        getBattler: () => ({
          getSkillSlotManager: () => ({ getSkillSlotByKey: () => ({ id: 5 }) }),
          hasSkill: () => false,
        }),
      });
      expect(battler.canChargeSlot('mainhand')).toBe(false);
    });

    it('cannot charge when no charging tier is affordable', () =>
    {
      const tier = new FakeChargingTier(1, 10, 5, 0, 0);
      const battler = buildSlotBattler({
        getChargingTiers: () => [ tier ],
        getBattler: () => ({
          getSkillSlotManager: () => ({ getSkillSlotByKey: () => ({ id: 5 }) }),
          hasSkill: () => true,
          meetsSkillConditions: () => false,
          skill: () => ({ id: 5 }),
        }),
      });
      expect(battler.canChargeSlot('mainhand')).toBe(false);
    });

    it('can charge when the slot is equipped, known, and affordable', () =>
    {
      const tier = new FakeChargingTier(1, 10, 5, 0, 0);
      const battler = buildSlotBattler({ getChargingTiers: () => [ tier ] });
      expect(battler.canChargeSlot('mainhand')).toBe(true);
    });

    it('can charge when there are no charging tiers to check at all', () =>
    {
      const battler = buildSlotBattler({ getChargingTiers: () => null });
      expect(battler.canChargeSlot('mainhand')).toBe(true);
    });
  });

  describe('setupCharging', () =>
  {
    it('does nothing if already charging', () =>
    {
      const battler = buildBattler();
      battler.beginCharging();
      battler.setupCharging('mainhand', [ new FakeChargingTier(1, 10, 5, 0, 0) ]);
      expect(battler.getChargingSlot()).toBeNull();
    });

    it('assigns the slot, tier data, and begins charging', () =>
    {
      const battler = buildBattler();
      const tiers = [ new FakeChargingTier(1, 10, 5, 0, 0) ];
      battler.setupCharging('mainhand', tiers);
      expect(battler.getChargingSlot()).toBe('mainhand');
      expect(battler.getChargingTierData()).toBe(tiers);
      expect(battler.isCharging()).toBe(true);
    });
  });

  describe('executeChargeAction', () =>
  {
    function buildActionBattler(overrides = {})
    {
      const battler = buildBattler({ canChargeSlot: () => true });
      battler.getChargingTiers = () => [ new FakeChargingTier(1, 10, 5, 0, 0) ];
      battler.setupCharging = vi.fn(battler.setupCharging.bind(battler));
      battler.endCharging = vi.fn();
      return Object.assign(battler, overrides);
    }

    it('does nothing when the slot cannot be charged', () =>
    {
      const battler = buildActionBattler({ canChargeSlot: () => false });
      battler.executeChargeAction('mainhand', true);
      expect(battler.setupCharging).not.toHaveBeenCalled();
    });

    it('ignores a different slot trying to cancel this slot\'s charge', () =>
    {
      const battler = buildActionBattler();
      battler.setupCharging('mainhand', battler.getChargingTiers());
      battler.setupCharging.mockClear();

      battler.executeChargeAction('offhand', false);

      expect(battler.endCharging).not.toHaveBeenCalled();
      expect(battler.isCharging()).toBe(true);
    });

    it('ends charging when releasing the currently-charged slot', () =>
    {
      const battler = buildActionBattler();
      battler.setupCharging('mainhand', battler.getChargingTiers());

      battler.executeChargeAction('mainhand', false);

      expect(battler.endCharging).toHaveBeenCalledTimes(1);
    });

    it('does nothing when not charging and not requesting to charge', () =>
    {
      const battler = buildActionBattler();
      battler.executeChargeAction('mainhand', false);
      expect(battler.setupCharging).not.toHaveBeenCalled();
    });

    it('makes no changes when already charging the same slot', () =>
    {
      const battler = buildActionBattler();
      battler.setupCharging('mainhand', battler.getChargingTiers());
      battler.setupCharging.mockClear();

      battler.executeChargeAction('mainhand', true);

      expect(battler.setupCharging).not.toHaveBeenCalled();
      expect(battler.endCharging).not.toHaveBeenCalled();
    });

    it('ends the current charge when switching to charge a different slot', () =>
    {
      const battler = buildActionBattler();
      battler.setupCharging('mainhand', battler.getChargingTiers());
      battler.setupCharging.mockClear();

      battler.executeChargeAction('offhand', true);

      expect(battler.endCharging).toHaveBeenCalledTimes(1);
      expect(battler.setupCharging).not.toHaveBeenCalled();
    });

    it('does nothing when starting fresh but there are no charging tiers for the slot', () =>
    {
      const battler = buildActionBattler({ getChargingTiers: () => null });
      battler.executeChargeAction('mainhand', true);
      expect(battler.setupCharging).not.toHaveBeenCalled();
    });

    it('sets up charging fresh when not currently charging and requesting to charge', () =>
    {
      const battler = buildActionBattler();
      battler.executeChargeAction('mainhand', true);
      expect(battler.setupCharging).toHaveBeenCalledWith('mainhand', battler.getChargingTiers());
    });
  });

  describe('endCharging / releaseHighestChargedSkill', () =>
  {
    it('does nothing when there is no highest charged tier', () =>
    {
      const battler = buildBattler();
      battler.setDecidedAction = vi.fn();
      battler.endCharging();
      expect(battler.setDecidedAction).not.toHaveBeenCalled();
    });

    it('does nothing when the charged skill cannot actually be released', () =>
    {
      const battler = buildBattler({ canReleaseChargedSkill: () => false });
      const tier = new FakeChargingTier(1, 10, 5, 0, 0);
      tier.completed = true;
      battler.setChargingTierData([ tier ]);
      battler.setDecidedAction = vi.fn();
      battler.endCharging();
      expect(battler.setDecidedAction).not.toHaveBeenCalled();
    });

    it('decides the released skill action and sets the cast countdown, then resets charge data', () =>
    {
      const action = { getCastTime: () => 42 };
      const battler = buildBattler({
        canReleaseChargedSkill: () => true,
        createJabsActionFromSkill: () => [ action ],
      });
      const tier = new FakeChargingTier(1, 10, 5, 0, 0);
      tier.completed = true;
      battler.setChargingTierData([ tier ]);
      battler.setDecidedAction = vi.fn();
      battler.setCastCountdown = vi.fn();

      battler.endCharging();

      expect(battler.setDecidedAction).toHaveBeenCalledWith([ action ]);
      expect(battler.setCastCountdown).toHaveBeenCalledWith(42);
      expect(battler.getChargingTierData()).toEqual([]);
    });
  });

  describe('canReleaseChargedSkill', () =>
  {
    it('returns false when the battler does not know the skill', () =>
    {
      const battler = buildBattler({ getBattler: () => ({ hasSkill: () => false }) });
      expect(battler.canReleaseChargedSkill(5)).toBe(false);
    });

    it('returns false when the skill conditions are not met', () =>
    {
      const battler = buildBattler({
        getBattler: () => ({ hasSkill: () => true, skill: () => ({ id: 5 }), meetsSkillConditions: () => false }),
      });
      expect(battler.canReleaseChargedSkill(5)).toBe(false);
    });

    it('returns true when the skill is known and its conditions are met', () =>
    {
      const battler = buildBattler({
        getBattler: () => ({ hasSkill: () => true, skill: () => ({ id: 5 }), meetsSkillConditions: () => true }),
      });
      expect(battler.canReleaseChargedSkill(5)).toBe(true);
    });
  });

  describe('getChargingTiers', () =>
  {
    function buildTierBattler(overrides = {})
    {
      const skill = { id: 5, jabsChargeData: [ [ 1, 30, 6, 0, 0 ] ] };
      const rawBattler = {
        getEquippedSkillId: () => 5,
        skill: () => skill,
      };
      const battler = buildBattler({ getLastUsedSkillId: () => 0, getBattler: () => rawBattler });
      return Object.assign(battler, overrides);
    }

    it('returns null when there is no skill id from last-used or equipped slot', () =>
    {
      const battler = buildTierBattler({
        getBattler: () => ({ getEquippedSkillId: () => 0 }),
      });
      expect(battler.getChargingTiers('mainhand')).toBeNull();
    });

    it('prefers the last-used skill id over the equipped slot', () =>
    {
      const skill = { id: 9, jabsChargeData: [ [ 1, 30, 6, 0, 0 ] ] };
      const battler = buildTierBattler({
        getLastUsedSkillId: () => 9,
        getBattler: () => ({ getEquippedSkillId: () => 5, skill: () => skill }),
      });
      const result = battler.getChargingTiers('mainhand');
      expect(result[0].skillId).toBe(6);
    });

    it('returns null when the skill has no charge data', () =>
    {
      const battler = buildTierBattler({
        getBattler: () => ({ getEquippedSkillId: () => 5, skill: () => ({ id: 5, jabsChargeData: null }) }),
      });
      expect(battler.getChargingTiers('mainhand')).toBeNull();
    });

    it('converts raw tuples into normalized JABS_ChargingTier instances', () =>
    {
      const battler = buildTierBattler();
      const result = battler.getChargingTiers('mainhand');
      expect(result).toHaveLength(1);
      expect(result[0].tier).toBe(1);
      expect(result[0].skillId).toBe(6);
    });
  });

  describe('normalizeChargeTierData', () =>
  {
    it('inserts a filler tier 1 when the first defined tier is not tier 1', () =>
    {
      const battler = buildBattler();
      const tiers = [ new FakeChargingTier(2, 30, 6, 0, 0) ];
      const result = battler.normalizeChargeTierData(tiers);
      expect(result[0].tier).toBe(1);
      expect(result[0].skillId).toBe(0);
      expect(result[1].tier).toBe(2);
    });

    it('fills gaps between non-contiguous tiers', () =>
    {
      const battler = buildBattler();
      const tiers = [ new FakeChargingTier(1, 30, 5, 0, 0), new FakeChargingTier(3, 30, 6, 0, 0) ];
      const result = battler.normalizeChargeTierData(tiers);
      expect(result.map(t => t.tier)).toEqual([ 1, 2, 3 ]);
      expect(result[1].skillId).toBe(0);
    });

    it('applies the default fully-charged animation to the final tier when it has none', () =>
    {
      globalThis.J.ABS.EXT.CHARGE.Metadata.DefaultFullyChargedAnimationId = 99;
      const battler = buildBattler();
      const tiers = [ new FakeChargingTier(1, 30, 5, 0, 0) ];
      const result = battler.normalizeChargeTierData(tiers);
      expect(result.at(-1).chargeTierCompleteAnimationId).toBe(99);
    });

    it('does not overwrite the final tier animation when it already has one', () =>
    {
      globalThis.J.ABS.EXT.CHARGE.Metadata.DefaultFullyChargedAnimationId = 99;
      const battler = buildBattler();
      const tiers = [ new FakeChargingTier(1, 30, 5, 0, 7) ];
      const result = battler.normalizeChargeTierData(tiers);
      expect(result.at(-1).chargeTierCompleteAnimationId).toBe(7);
    });
  });

  describe('update / updateCharging', () =>
  {
    it('performs the original logic then updates charging', () =>
    {
      const battler = buildBattler();
      battler.updateCharging = vi.fn();
      battler.update();
      expect(originalUpdate).toHaveBeenCalledTimes(1);
      expect(battler.updateCharging).toHaveBeenCalledTimes(1);
    });

    it('does nothing when charging cannot be updated', () =>
    {
      const battler = buildBattler({ canUpdateCharging: () => false });
      battler.preUpdateCharging = vi.fn();
      battler.updateCharging();
      expect(battler.preUpdateCharging).not.toHaveBeenCalled();
    });

    it('runs the pre-update hook, ticks the tier, then the post-update hook', () =>
    {
      const tier = new FakeChargingTier(1, 10, 5, 0, 0);
      const battler = buildBattler({ canUpdateCharging: () => true, getCurrentChargingTier: () => tier });
      battler.preUpdateCharging = vi.fn();
      battler.postUpdateCharging = vi.fn();

      battler.updateCharging();

      expect(battler.preUpdateCharging).toHaveBeenCalledWith(tier);
      expect(tier.duration).toBe(1);
      expect(battler.postUpdateCharging).toHaveBeenCalledWith(tier);
    });
  });

  describe('canUpdateCharging', () =>
  {
    it('is false when not charging', () =>
    {
      const battler = buildBattler({ isCharging: () => false });
      expect(battler.canUpdateCharging()).toBe(false);
    });

    it('is false when there is no current charging tier', () =>
    {
      const battler = buildBattler({ isCharging: () => true, getCurrentChargingTier: () => null });
      expect(battler.canUpdateCharging()).toBe(false);
    });

    it('is true when charging and a current tier exists', () =>
    {
      const battler = buildBattler({ isCharging: () => true, getCurrentChargingTier: () => ({ tier: 1 }) });
      expect(battler.canUpdateCharging()).toBe(true);
    });
  });

  describe('preUpdateCharging / canShowPreChargingAnimation', () =>
  {
    it('does not show an animation when there is none configured and no default', () =>
    {
      const battler = buildBattler();
      const tier = new FakeChargingTier(1, 10, 5, 0, 0);
      battler.preUpdateCharging(tier);
      expect(battler.showAnimation).not.toHaveBeenCalled();
    });

    it('does not show an animation off-cadence (not a multiple of 15 frames)', () =>
    {
      const battler = buildBattler();
      const tier = new FakeChargingTier(1, 10, 5, 3, 0);
      tier.duration = 5;
      battler.preUpdateCharging(tier);
      expect(battler.showAnimation).not.toHaveBeenCalled();
    });

    it('shows the tier-specific animation on cadence', () =>
    {
      const battler = buildBattler();
      const tier = new FakeChargingTier(1, 10, 5, 3, 0);
      tier.duration = 15;
      battler.preUpdateCharging(tier);
      expect(battler.showAnimation).toHaveBeenCalledWith(3);
    });

    it('falls back to the default charging animation when the tier has none', () =>
    {
      globalThis.J.ABS.EXT.CHARGE.Metadata.DefaultChargingAnimationId = 11;
      const battler = buildBattler();
      const tier = new FakeChargingTier(1, 10, 5, 0, 0);
      tier.duration = 0;
      battler.preUpdateCharging(tier);
      expect(battler.showAnimation).toHaveBeenCalledWith(11);
    });
  });

  describe('postUpdateCharging', () =>
  {
    it('processes the max-charge hook when there is no next tier remaining', () =>
    {
      const tier = new FakeChargingTier(1, 10, 5, 0, 0);
      const battler = buildBattler({ getCurrentChargingTier: () => null });
      battler.onMaxCharge = vi.fn();
      battler.onChargeTierComplete = vi.fn();

      battler.postUpdateCharging(tier);

      expect(battler.onMaxCharge).toHaveBeenCalledWith(tier);
      expect(battler.onChargeTierComplete).not.toHaveBeenCalled();
    });

    it('does nothing further when the current tier is still incomplete', () =>
    {
      const tier = new FakeChargingTier(1, 10, 5, 0, 0);
      const nextTier = new FakeChargingTier(2, 10, 6, 0, 0);
      const battler = buildBattler({ getCurrentChargingTier: () => nextTier });
      battler.onMaxCharge = vi.fn();
      battler.onChargeTierComplete = vi.fn();

      battler.postUpdateCharging(tier);

      expect(battler.onMaxCharge).not.toHaveBeenCalled();
      expect(battler.onChargeTierComplete).not.toHaveBeenCalled();
    });

    it('fires the charge-tier-complete hook when a new tier has become current', () =>
    {
      const tier = new FakeChargingTier(1, 10, 5, 0, 0);
      tier.completed = true;
      const nextTier = new FakeChargingTier(2, 10, 6, 0, 0);
      const battler = buildBattler({ getCurrentChargingTier: () => nextTier });
      battler.onMaxCharge = vi.fn();
      battler.onChargeTierComplete = vi.fn();

      battler.postUpdateCharging(tier);

      expect(battler.onChargeTierComplete).toHaveBeenCalledWith(tier, nextTier);
      expect(battler.onMaxCharge).not.toHaveBeenCalled();
    });
  });

  describe('canShowTierCompletionAnimation', () =>
  {
    it('is false with no tagged animation and no default', () =>
    {
      const battler = buildBattler();
      const tier = new FakeChargingTier(1, 10, 5, 0, 0);
      expect(battler.canShowTierCompletionAnimation(tier)).toBe(false);
    });

    it('is true when a default is configured even without a tagged animation', () =>
    {
      globalThis.J.ABS.EXT.CHARGE.Metadata.DefaultTierCompleteAnimationId = 5;
      const battler = buildBattler();
      const tier = new FakeChargingTier(1, 10, 5, 0, 0);
      expect(battler.canShowTierCompletionAnimation(tier)).toBe(true);
    });

    it('is true when the tier has its own tagged animation', () =>
    {
      const battler = buildBattler();
      const tier = new FakeChargingTier(1, 10, 5, 0, 7);
      expect(battler.canShowTierCompletionAnimation(tier)).toBe(true);
    });
  });

  describe('onMaxCharge', () =>
  {
    it('shows the animation and plays the SE together when both are enabled', () =>
    {
      globalThis.J.ABS.EXT.CHARGE.Metadata.DefaultTierCompleteAnimationId = 5;
      globalThis.J.ABS.EXT.CHARGE.Metadata.UseTierCompleteSE = true;
      globalThis.J.ABS.EXT.CHARGE.Metadata.AllowTierCompleteSEandAnimation = true;
      const battler = buildBattler();
      const tier = new FakeChargingTier(1, 10, 5, 0, 0);

      battler.onMaxCharge(tier);

      expect(battler.showAnimation).toHaveBeenCalledWith(5);
      expect(globalThis.SoundManager.playMaxChargeReadySE).toHaveBeenCalledTimes(1);
    });

    it('shows only the animation when SE-with-animation is disallowed', () =>
    {
      globalThis.J.ABS.EXT.CHARGE.Metadata.DefaultTierCompleteAnimationId = 5;
      globalThis.J.ABS.EXT.CHARGE.Metadata.UseTierCompleteSE = true;
      globalThis.J.ABS.EXT.CHARGE.Metadata.AllowTierCompleteSEandAnimation = false;
      const battler = buildBattler();
      const tier = new FakeChargingTier(1, 10, 5, 0, 0);

      battler.onMaxCharge(tier);

      expect(battler.showAnimation).toHaveBeenCalledWith(5);
      expect(globalThis.SoundManager.playMaxChargeReadySE).not.toHaveBeenCalled();
    });

    it('plays only the SE when the animation cannot be shown', () =>
    {
      globalThis.J.ABS.EXT.CHARGE.Metadata.UseTierCompleteSE = true;
      const battler = buildBattler();
      const tier = new FakeChargingTier(1, 10, 5, 0, 0);

      battler.onMaxCharge(tier);

      expect(battler.showAnimation).not.toHaveBeenCalled();
      expect(globalThis.SoundManager.playMaxChargeReadySE).toHaveBeenCalledTimes(1);
    });

    it('does nothing audibly or visibly when neither is enabled', () =>
    {
      const battler = buildBattler();
      const tier = new FakeChargingTier(1, 10, 5, 0, 0);

      battler.onMaxCharge(tier);

      expect(battler.showAnimation).not.toHaveBeenCalled();
      expect(globalThis.SoundManager.playMaxChargeReadySE).not.toHaveBeenCalled();
    });
  });

  describe('onChargeTierComplete', () =>
  {
    it('shows the animation and plays the SE together when both are enabled', () =>
    {
      globalThis.J.ABS.EXT.CHARGE.Metadata.DefaultTierCompleteAnimationId = 5;
      globalThis.J.ABS.EXT.CHARGE.Metadata.UseTierCompleteSE = true;
      globalThis.J.ABS.EXT.CHARGE.Metadata.AllowTierCompleteSEandAnimation = true;
      const battler = buildBattler();
      const completed = new FakeChargingTier(1, 10, 5, 0, 0);
      const next = new FakeChargingTier(2, 10, 6, 0, 0);

      battler.onChargeTierComplete(completed, next);

      expect(battler.showAnimation).toHaveBeenCalledWith(5);
      expect(globalThis.SoundManager.playChargeTierCompleteSE).toHaveBeenCalledTimes(1);
    });

    it('plays only the SE when the animation cannot be shown', () =>
    {
      globalThis.J.ABS.EXT.CHARGE.Metadata.UseTierCompleteSE = true;
      const battler = buildBattler();
      const completed = new FakeChargingTier(1, 10, 5, 0, 0);
      const next = new FakeChargingTier(2, 10, 6, 0, 0);

      battler.onChargeTierComplete(completed, next);

      expect(battler.showAnimation).not.toHaveBeenCalled();
      expect(globalThis.SoundManager.playChargeTierCompleteSE).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/abs/ext/charge/_models/jabs-battler.test.js
