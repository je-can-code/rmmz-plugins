//region plugins/passive/ext/conditional/managers/passive-gate-evaluator.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('PassiveGateEvaluator (direct src import)', () =>
{
  let PassiveGateEvaluator;
  let FakePassiveRuleJabsAccess;

  beforeAll(async () =>
  {
    vi.resetModules();

    FakePassiveRuleJabsAccess = {
      nearbyEnemies: vi.fn().mockReturnValue([]),
      nearbyAlliesExcludingSelf: vi.fn().mockReturnValue([]),
      enemiesTargetingMe: vi.fn().mockReturnValue([]),
      allAlliedBattlersIncludingSelf: vi.fn().mockReturnValue([]),
      alliedBattlersWithinRange: vi.fn().mockReturnValue([]),
      opposingBattlersWithinRange: vi.fn().mockReturnValue([]),
      getJabsBattler: vi.fn().mockReturnValue(null),
      defaultProximity: vi.fn().mockReturnValue(5),
      resolveSlotKey: vi.fn(slotParam => slotParam),
    };
    vi.doMock('../../../../../../src/plugins/passive/ext/conditional/helpers/PassiveRuleJabsAccess.js', () => ({ default: FakePassiveRuleJabsAccess }));

    globalThis.Graphics = { frameCount: 1000 };

    ({ default: PassiveGateEvaluator } = await import('../../../../../../src/plugins/passive/ext/conditional/managers/PassiveGateEvaluator.js'));
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([]);
    FakePassiveRuleJabsAccess.nearbyAlliesExcludingSelf.mockReturnValue([]);
    FakePassiveRuleJabsAccess.enemiesTargetingMe.mockReturnValue([]);
    FakePassiveRuleJabsAccess.allAlliedBattlersIncludingSelf.mockReturnValue([]);
    FakePassiveRuleJabsAccess.alliedBattlersWithinRange.mockReturnValue([]);
    FakePassiveRuleJabsAccess.opposingBattlersWithinRange.mockReturnValue([]);
    FakePassiveRuleJabsAccess.getJabsBattler.mockReturnValue(null);
    FakePassiveRuleJabsAccess.defaultProximity.mockReturnValue(5);
    FakePassiveRuleJabsAccess.resolveSlotKey.mockImplementation(slotParam => slotParam);
    globalThis.Graphics.frameCount = 1000;
  });

  /** Builds a minimal resource-bearing battler for threshold gates. */
  function makeResourceBattler(overrides = {})
  {
    return {
      hp: 50, mhp: 100, mp: 25, mmp: 50, tp: 10, maxTp: () => 100,
      parameter: () => 0,
      ...overrides,
    };
  }

  function makeBattler()
  {
    return {};
  }

  describe('enemiesNearby', () =>
  {
    it('fails when fewer opposing battlers are in range than the required count', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([]);

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, 'enemiesNearby', [ 1 ]);

      // Assert
      expect(result).toEqual(false);
    });

    it('passes when at least the required count of opposing battlers are in range', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([ {}, {} ]);

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, 'enemiesNearby', [ 2 ]);

      // Assert
      expect(result).toEqual(true);
    });

    it('forwards an explicit radius param to the proximity lookup', () =>
    {
      // Arrange
      const battler = makeBattler();

      // Act
      PassiveGateEvaluator.evaluate(battler, 'enemiesNearby', [ 1, 3 ]);

      // Assert
      expect(FakePassiveRuleJabsAccess.nearbyEnemies).toHaveBeenCalledWith(battler, 3);
    });
  });

  describe('enemiesNearbyBelow', () =>
  {
    it('passes when zero enemies are in range and the threshold is 1 (melee-range emptiness)', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([]);

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, 'enemiesNearbyBelow', [ 1, 1 ]);

      // Assert
      expect(result).toEqual(true);
    });

    it('fails once the number of nearby enemies meets the threshold', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.nearbyEnemies.mockReturnValue([ {} ]);

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, 'enemiesNearbyBelow', [ 1, 1 ]);

      // Assert
      expect(result).toEqual(false);
    });

    it('forwards an explicit radius param to the proximity lookup', () =>
    {
      // Arrange
      const battler = makeBattler();

      // Act
      PassiveGateEvaluator.evaluate(battler, 'enemiesNearbyBelow', [ 1, 1 ]);

      // Assert
      expect(FakePassiveRuleJabsAccess.nearbyEnemies).toHaveBeenCalledWith(battler, 1);
    });

    it('resolves scope to null when omitted', () =>
    {
      // Arrange
      const battler = makeBattler();

      // Act
      PassiveGateEvaluator.evaluate(battler, 'enemiesNearbyBelow', [ 1 ]);

      // Assert
      expect(FakePassiveRuleJabsAccess.nearbyEnemies).toHaveBeenCalledWith(battler, null);
    });
  });

  describe('alliesNearby', () =>
  {
    it('fails when fewer allied battlers are in range than the required count', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.nearbyAlliesExcludingSelf.mockReturnValue([]);

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, 'alliesNearby', [ 1 ]);

      // Assert
      expect(result).toEqual(false);
    });

    it('passes when at least the required count of allied battlers are in range', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.nearbyAlliesExcludingSelf.mockReturnValue([ {} ]);

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, 'alliesNearby', [ 1 ]);

      // Assert
      expect(result).toEqual(true);
    });

    it('forwards an explicit radius param to the proximity lookup', () =>
    {
      // Arrange
      const battler = makeBattler();

      // Act
      PassiveGateEvaluator.evaluate(battler, 'alliesNearby', [ 1, 8 ]);

      // Assert
      expect(FakePassiveRuleJabsAccess.nearbyAlliesExcludingSelf).toHaveBeenCalledWith(battler, 8);
    });
  });

  describe('alliesNearbyBelow', () =>
  {
    it('passes when fewer allied battlers are in range than the threshold', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.nearbyAlliesExcludingSelf.mockReturnValue([]);

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, 'alliesNearbyBelow', [ 1 ]);

      // Assert
      expect(result).toEqual(true);
    });

    it('fails once the number of nearby allies meets the threshold', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.nearbyAlliesExcludingSelf.mockReturnValue([ {} ]);

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, 'alliesNearbyBelow', [ 1 ]);

      // Assert
      expect(result).toEqual(false);
    });

    it('forwards an explicit radius param to the proximity lookup', () =>
    {
      // Arrange
      const battler = makeBattler();

      // Act
      PassiveGateEvaluator.evaluate(battler, 'alliesNearbyBelow', [ 1, 8 ]);

      // Assert
      expect(FakePassiveRuleJabsAccess.nearbyAlliesExcludingSelf).toHaveBeenCalledWith(battler, 8);
    });
  });

  describe('enemiesTargetingMe', () =>
  {
    it('fails when fewer opposing battlers are targeting this battler than the required count', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.enemiesTargetingMe.mockReturnValue([]);

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, 'enemiesTargetingMe', [ 1 ]);

      // Assert
      expect(result).toEqual(false);
    });

    it('passes when at least the required count of opposing battlers are targeting this battler', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.enemiesTargetingMe.mockReturnValue([ {}, {} ]);

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, 'enemiesTargetingMe', [ 2 ]);

      // Assert
      expect(result).toEqual(true);
    });

    it('never forwards a radius param- this kind is not proximity-scoped', () =>
    {
      // Arrange
      const battler = makeBattler();

      // Act
      PassiveGateEvaluator.evaluate(battler, 'enemiesTargetingMe', [ 1, 3 ]);

      // Assert
      expect(FakePassiveRuleJabsAccess.enemiesTargetingMe).toHaveBeenCalledWith(battler);
    });
  });

  describe('enemiesTargetingMeBelow', () =>
  {
    it('passes when zero enemies are targeting this battler and the threshold is 1', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.enemiesTargetingMe.mockReturnValue([]);

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, 'enemiesTargetingMeBelow', [ 1 ]);

      // Assert
      expect(result).toEqual(true);
    });

    it('fails once the number of enemies targeting this battler meets the threshold', () =>
    {
      // Arrange
      const battler = makeBattler();
      FakePassiveRuleJabsAccess.enemiesTargetingMe.mockReturnValue([ {} ]);

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, 'enemiesTargetingMeBelow', [ 1 ]);

      // Assert
      expect(result).toEqual(false);
    });
  });

  describe('single-resource threshold gates (hpAbove/hpBelow/mpAbove/mpBelow/tpAbove/tpBelow)', () =>
  {
    it('hpAbove passes at exactly the threshold (self scope, default)', () =>
    {
      // Arrange
      const battler = makeResourceBattler({ hp: 50, mhp: 100 });

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate(battler, 'hpAbove', [ 50 ])).toBe(true);
    });

    it('hpBelow fails above the threshold', () =>
    {
      // Arrange
      const battler = makeResourceBattler({ hp: 90, mhp: 100 });

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate(battler, 'hpBelow', [ 25 ])).toBe(false);
    });

    it('mpAbove/mpBelow read the mp resource', () =>
    {
      // Arrange
      const battler = makeResourceBattler({ mp: 40, mmp: 50 });

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate(battler, 'mpAbove', [ 80 ])).toBe(true);
      expect(PassiveGateEvaluator.evaluate(battler, 'mpBelow', [ 80 ])).toBe(true);
    });

    it('tpAbove/tpBelow read the tp resource', () =>
    {
      // Arrange
      const battler = makeResourceBattler({ tp: 10, maxTp: () => 100 });

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate(battler, 'tpAbove', [ 10 ])).toBe(true);
      expect(PassiveGateEvaluator.evaluate(battler, 'tpBelow', [ 10 ])).toBe(true);
    });

    it('resolves an anyAlly scope to allied battlers within the given (or default) range', () =>
    {
      // Arrange
      const ally = makeResourceBattler({ hp: 100, mhp: 100 });
      FakePassiveRuleJabsAccess.alliedBattlersWithinRange.mockReturnValue([ { getBattler: () => ally } ]);
      const battler = makeResourceBattler({ hp: 0, mhp: 100 });

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, 'hpAbove', [ 100, 'anyAlly' ]);

      // Assert- anyAlly passes when at least one target satisfies it, ignoring the evaluator's own hp.
      expect(FakePassiveRuleJabsAccess.alliedBattlersWithinRange).toHaveBeenCalledWith(battler, 5);
      expect(result).toBe(true);
    });

    it('forwards an explicit range for a scoped threshold instead of the plugin default', () =>
    {
      // Arrange
      const battler = makeResourceBattler();

      // Act
      PassiveGateEvaluator.evaluate(battler, 'hpAbove', [ 0, 'anyAlly', 9 ]);

      // Assert
      expect(FakePassiveRuleJabsAccess.alliedBattlersWithinRange).toHaveBeenCalledWith(battler, 9);
    });

    it('resolves an allAllies scope requiring every ally to satisfy the threshold', () =>
    {
      // Arrange
      const healthyAlly = makeResourceBattler({ hp: 100, mhp: 100 });
      const woundedAlly = makeResourceBattler({ hp: 10, mhp: 100 });
      FakePassiveRuleJabsAccess.alliedBattlersWithinRange.mockReturnValue([
        { getBattler: () => healthyAlly }, { getBattler: () => woundedAlly },
      ]);
      const battler = makeResourceBattler({ hp: 100, mhp: 100 });

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate(battler, 'hpAbove', [ 50, 'allAllies' ])).toBe(false);
    });

    it('resolves an anyEnemy scope from opposing battlers within range', () =>
    {
      // Arrange
      const enemy = makeResourceBattler({ hp: 100, mhp: 100 });
      FakePassiveRuleJabsAccess.opposingBattlersWithinRange.mockReturnValue([ { getBattler: () => enemy } ]);
      const battler = makeResourceBattler();

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, 'hpAbove', [ 50, 'anyEnemy' ]);

      // Assert
      expect(FakePassiveRuleJabsAccess.opposingBattlersWithinRange).toHaveBeenCalledWith(battler, 5);
      expect(result).toBe(true);
    });

    it('resolves an allEnemies scope requiring every opposing battler to satisfy the threshold', () =>
    {
      // Arrange
      const enemy = makeResourceBattler({ hp: 10, mhp: 100 });
      FakePassiveRuleJabsAccess.opposingBattlersWithinRange.mockReturnValue([ { getBattler: () => enemy } ]);
      const battler = makeResourceBattler();

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate(battler, 'hpAbove', [ 50, 'allEnemies' ])).toBe(false);
    });

    it('filters out an allied/opposing jabs wrapper with no resolvable Game_Battler', () =>
    {
      // Arrange
      FakePassiveRuleJabsAccess.alliedBattlersWithinRange.mockReturnValue([ { getBattler: () => null } ]);
      const battler = makeResourceBattler({ hp: 100, mhp: 100 });

      // Act & Assert- no valid targets means .every() vacuously passes.
      expect(PassiveGateEvaluator.evaluate(battler, 'hpAbove', [ 50, 'allAllies' ])).toBe(true);
    });
  });

  describe('anyAbove/anyBelow/allAbove/allBelow', () =>
  {
    it('anyAbove passes when at least one of hp/mp/tp satisfies the threshold', () =>
    {
      // Arrange- hp is low, but tp is high enough to pass.
      const battler = makeResourceBattler({ hp: 1, mhp: 100, mp: 1, mmp: 100, tp: 90, maxTp: () => 100 });

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate(battler, 'anyAbove', [ 80 ])).toBe(true);
    });

    it('anyBelow passes when at least one of hp/mp/tp satisfies the threshold', () =>
    {
      // Arrange
      const battler = makeResourceBattler({ hp: 5, mhp: 100, mp: 90, mmp: 100, tp: 90, maxTp: () => 100 });

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate(battler, 'anyBelow', [ 10 ])).toBe(true);
    });

    it('allAbove requires every one of hp/mp/tp to satisfy the threshold', () =>
    {
      // Arrange- tp fails the threshold, so the gate must fail overall.
      const battler = makeResourceBattler({ hp: 90, mhp: 100, mp: 90, mmp: 100, tp: 1, maxTp: () => 100 });

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate(battler, 'allAbove', [ 80 ])).toBe(false);
    });

    it('allBelow requires every one of hp/mp/tp to satisfy the threshold', () =>
    {
      // Arrange
      const battler = makeResourceBattler({ hp: 1, mhp: 100, mp: 1, mmp: 100, tp: 1, maxTp: () => 100 });

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate(battler, 'allBelow', [ 10 ])).toBe(true);
    });

    it('anyAbove forwards an explicit range instead of the plugin default', () =>
    {
      // Arrange
      const battler = makeResourceBattler();

      // Act
      PassiveGateEvaluator.evaluate(battler, 'anyAbove', [ 50, 'anyAlly', 12 ]);

      // Assert
      expect(FakePassiveRuleJabsAccess.alliedBattlersWithinRange).toHaveBeenCalledWith(battler, 12);
    });

    it('allAbove forwards an explicit range instead of the plugin default', () =>
    {
      // Arrange
      const battler = makeResourceBattler();

      // Act
      PassiveGateEvaluator.evaluate(battler, 'allAbove', [ 50, 'anyAlly', 13 ]);

      // Assert
      expect(FakePassiveRuleJabsAccess.alliedBattlersWithinRange).toHaveBeenCalledWith(battler, 13);
    });
  });

  describe('hasState / negativeStateCount', () =>
  {
    it('hasState delegates to battler.isStateAffected', () =>
    {
      // Arrange
      const battler = { isStateAffected: vi.fn(() => true) };

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, 'hasState', [ 14 ]);

      // Assert
      expect(battler.isStateAffected).toHaveBeenCalledWith(14);
      expect(result).toBe(true);
    });

    it('negativeStateCount counts only negative-typed states currently affecting the battler', () =>
    {
      // Arrange
      const battler = {
        allStates: () => [
          { isNegativeType: () => true }, { isNegativeType: () => false }, null,
        ],
      };

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, 'negativeStateCount', [ 1 ]);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('countNegativeStates', () =>
  {
    it('counts negative states, skipping null entries', () =>
    {
      // Arrange
      const battler = {
        allStates: () => [ null, { isNegativeType: () => true }, { isNegativeType: () => true } ],
      };

      // Act & Assert
      expect(PassiveGateEvaluator.countNegativeStates(battler)).toBe(2);
    });
  });

  describe('slotOnCooldown / slotOffCooldown', () =>
  {
    it('slotOnCooldown is false when the battler is off-map', () =>
    {
      // Arrange
      FakePassiveRuleJabsAccess.getJabsBattler.mockReturnValue(null);

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate({}, 'slotOnCooldown', [ 'mainhand' ])).toBe(false);
    });

    it('slotOnCooldown is true when the resolved slot is not cooldown-ready', () =>
    {
      // Arrange
      const jabsBattler = { isSkillTypeCooldownReady: vi.fn(() => false) };
      FakePassiveRuleJabsAccess.getJabsBattler.mockReturnValue(jabsBattler);
      FakePassiveRuleJabsAccess.resolveSlotKey.mockReturnValue('Main');

      // Act
      const result = PassiveGateEvaluator.evaluate({}, 'slotOnCooldown', [ 'mainhand' ]);

      // Assert
      expect(jabsBattler.isSkillTypeCooldownReady).toHaveBeenCalledWith('Main');
      expect(result).toBe(true);
    });

    it('slotOffCooldown is true when the battler is off-map (never on cooldown reads as off cooldown)', () =>
    {
      // Arrange
      FakePassiveRuleJabsAccess.getJabsBattler.mockReturnValue(null);

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate({}, 'slotOffCooldown', [ 'mainhand' ])).toBe(true);
    });

    it('slotOffCooldown is true when the resolved slot is cooldown-ready', () =>
    {
      // Arrange
      const jabsBattler = { isSkillTypeCooldownReady: vi.fn(() => true) };
      FakePassiveRuleJabsAccess.getJabsBattler.mockReturnValue(jabsBattler);

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate({}, 'slotOffCooldown', [ 'mainhand' ])).toBe(true);
    });
  });

  describe('allOnCooldown / allOffCooldown', () =>
  {
    /** Builds a minimal skill-slot-shaped stub. */
    function makeSlot(key, isEmpty, ready)
    {
      return { key, isEmpty: () => isEmpty, __ready: ready };
    }

    it('allOnCooldown is false when off-map', () =>
    {
      // Arrange
      FakePassiveRuleJabsAccess.getJabsBattler.mockReturnValue(null);

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate({}, 'allOnCooldown')).toBe(false);
    });

    it('allOnCooldown is false when the jabs battler has no slot manager', () =>
    {
      // Arrange
      FakePassiveRuleJabsAccess.getJabsBattler.mockReturnValue({
        getBattler: () => ({ getSkillSlotManager: () => null }),
      });

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate({}, 'allOnCooldown')).toBe(false);
    });

    it('allOnCooldown is false when no combat slots are assigned', () =>
    {
      // Arrange
      const slotManager = { getAllSecondarySlots: () => [ makeSlot('CombatSkill1', true, false) ] };
      FakePassiveRuleJabsAccess.getJabsBattler.mockReturnValue({
        getBattler: () => ({ getSkillSlotManager: () => slotManager }),
      });

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate({}, 'allOnCooldown')).toBe(false);
    });

    it('allOnCooldown is true only when every assigned combat slot is on cooldown', () =>
    {
      // Arrange
      const slots = [ makeSlot('CombatSkill1', false, false), makeSlot('CombatSkill2', false, false) ];
      const slotManager = { getAllSecondarySlots: () => slots };
      const jabsBattler = {
        getBattler: () => ({ getSkillSlotManager: () => slotManager }),
        isSkillTypeCooldownReady: (key) => slots.find(s => s.key === key).__ready,
      };
      FakePassiveRuleJabsAccess.getJabsBattler.mockReturnValue(jabsBattler);

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate({}, 'allOnCooldown')).toBe(true);
    });

    it('allOnCooldown is false when at least one assigned combat slot is ready', () =>
    {
      // Arrange
      const slots = [ makeSlot('CombatSkill1', false, false), makeSlot('CombatSkill2', false, true) ];
      const slotManager = { getAllSecondarySlots: () => slots };
      const jabsBattler = {
        getBattler: () => ({ getSkillSlotManager: () => slotManager }),
        isSkillTypeCooldownReady: (key) => slots.find(s => s.key === key).__ready,
      };
      FakePassiveRuleJabsAccess.getJabsBattler.mockReturnValue(jabsBattler);

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate({}, 'allOnCooldown')).toBe(false);
    });

    it('allOffCooldown is false when off-map', () =>
    {
      // Arrange
      FakePassiveRuleJabsAccess.getJabsBattler.mockReturnValue(null);

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate({}, 'allOffCooldown')).toBe(false);
    });

    it('allOffCooldown is false when the jabs battler has no slot manager', () =>
    {
      // Arrange
      FakePassiveRuleJabsAccess.getJabsBattler.mockReturnValue({
        getBattler: () => ({ getSkillSlotManager: () => null }),
      });

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate({}, 'allOffCooldown')).toBe(false);
    });

    it('allOffCooldown is true when no combat slots are assigned (nothing to wait for)', () =>
    {
      // Arrange
      const slotManager = { getAllSecondarySlots: () => [ makeSlot('CombatSkill1', true, false) ] };
      FakePassiveRuleJabsAccess.getJabsBattler.mockReturnValue({
        getBattler: () => ({ getSkillSlotManager: () => slotManager }),
      });

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate({}, 'allOffCooldown')).toBe(true);
    });

    it('allOffCooldown is true only when every assigned combat slot is ready', () =>
    {
      // Arrange
      const slots = [ makeSlot('CombatSkill1', false, true), makeSlot('CombatSkill2', false, true) ];
      const slotManager = { getAllSecondarySlots: () => slots };
      const jabsBattler = {
        getBattler: () => ({ getSkillSlotManager: () => slotManager }),
        isSkillTypeCooldownReady: (key) => slots.find(s => s.key === key).__ready,
      };
      FakePassiveRuleJabsAccess.getJabsBattler.mockReturnValue(jabsBattler);

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate({}, 'allOffCooldown')).toBe(true);
    });

    it('allOffCooldown is false when at least one assigned combat slot is still cooling down', () =>
    {
      // Arrange
      const slots = [ makeSlot('CombatSkill1', false, true), makeSlot('CombatSkill2', false, false) ];
      const slotManager = { getAllSecondarySlots: () => slots };
      const jabsBattler = {
        getBattler: () => ({ getSkillSlotManager: () => slotManager }),
        isSkillTypeCooldownReady: (key) => slots.find(s => s.key === key).__ready,
      };
      FakePassiveRuleJabsAccess.getJabsBattler.mockReturnValue(jabsBattler);

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate({}, 'allOffCooldown')).toBe(false);
    });
  });

  describe('timing gates (sinceLast*/*Within/onHeal*)', () =>
  {
    it('sinceLastMoved passes once enough frames have elapsed since the last stamp', () =>
    {
      // Arrange
      const battler = { getPassiveRuleLastMovedFrame: () => 900 };
      globalThis.Graphics.frameCount = 1000;

      // Act & Assert- 100 frames elapsed, meets the 100-frame requirement.
      expect(PassiveGateEvaluator.evaluate(battler, 'sinceLastMoved', [ 100 ])).toBe(true);
    });

    it('sinceLastHit treats a never-stamped frame (0) as "since forever"', () =>
    {
      // Arrange
      const battler = { getPassiveRuleLastHitFrame: () => 0 };
      globalThis.Graphics.frameCount = 500;

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate(battler, 'sinceLastHit', [ 100 ])).toBe(true);
    });

    it('sinceLastAttacked fails when not enough frames have elapsed', () =>
    {
      // Arrange
      const battler = { getPassiveRuleLastAttackedFrame: () => 950 };
      globalThis.Graphics.frameCount = 1000;

      // Act & Assert- only 50 frames elapsed, short of the 100-frame requirement.
      expect(PassiveGateEvaluator.evaluate(battler, 'sinceLastAttacked', [ 100 ])).toBe(false);
    });

    it('movedWithin passes while inside the window', () =>
    {
      // Arrange
      const battler = { getPassiveRuleLastMovedFrame: () => 980 };
      globalThis.Graphics.frameCount = 1000;

      // Act & Assert- 20 frames elapsed, within the 100-frame window.
      expect(PassiveGateEvaluator.evaluate(battler, 'movedWithin', [ 100 ])).toBe(true);
    });

    it('hitWithin fails once outside the window', () =>
    {
      // Arrange
      const battler = { getPassiveRuleLastHitFrame: () => 500 };
      globalThis.Graphics.frameCount = 1000;

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate(battler, 'hitWithin', [ 100 ])).toBe(false);
    });

    it('attackedWithin passes at exactly the window boundary (inclusive)', () =>
    {
      // Arrange
      const battler = { getPassiveRuleLastAttackedFrame: () => 900 };
      globalThis.Graphics.frameCount = 1000;

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate(battler, 'attackedWithin', [ 100 ])).toBe(true);
    });

    it('onHealHp passes while within the window since the last hp heal', () =>
    {
      // Arrange
      const battler = { getPassiveRuleLastHpHealFrame: () => 950 };
      globalThis.Graphics.frameCount = 1000;

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate(battler, 'onHealHp', [ 100 ])).toBe(true);
    });

    it('onHealMp passes while within the window since the last mp heal', () =>
    {
      // Arrange
      const battler = { getPassiveRuleLastMpHealFrame: () => 950 };
      globalThis.Graphics.frameCount = 1000;

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate(battler, 'onHealMp', [ 100 ])).toBe(true);
    });

    it('onHealTp fails once outside the window since the last tp heal', () =>
    {
      // Arrange
      const battler = { getPassiveRuleLastTpHealFrame: () => 800 };
      globalThis.Graphics.frameCount = 1000;

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate(battler, 'onHealTp', [ 100 ])).toBe(false);
    });
  });

  describe('default fallthrough to threshold parsing', () =>
  {
    it('resolves an allAllies-prefixed kind through the threshold parser', () =>
    {
      // Arrange
      const ally = makeResourceBattler({ hp: 100, mhp: 100 });
      FakePassiveRuleJabsAccess.allAlliedBattlersIncludingSelf.mockReturnValue([ ally ]);

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate({}, 'allAlliesHpAbove', [ 50 ])).toBe(true);
    });

    it('resolves a non-switch, non-allAllies threshold kind (e.g. a max-resource gate)', () =>
    {
      // Arrange- mhpAbove isn't one of the explicit switch cases, so it falls through to the
      // threshold parser; mhp routes through MAX_RESOURCE_KEYS/battler.parameter(), not the registry.
      const battler = makeResourceBattler({ parameter: (key) => (key === 'mhp' ? 150 : 0) });

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate(battler, 'mhpAbove', [ 100 ])).toBe(true);
    });

    it('fails closed for a completely unrecognized kind', () =>
    {
      // Act & Assert
      expect(PassiveGateEvaluator.evaluate({}, 'notARealGateKind', [ 1 ])).toBe(false);
    });
  });
});
//endregion plugins/passive/ext/conditional/managers/passive-gate-evaluator.test.js
