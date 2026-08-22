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

    // Both comparisons are inclusive, so a threshold sitting exactly on the resource's percentage
    // answers true for above and below alike - which is what the two cases below establish, and
    // also what makes them unable to tell the two gates apart. Every case in this block used such
    // a threshold, so the whole above/below distinction, and the choice of which resource to read,
    // could have collapsed with nothing going red. The cases after them sit off the boundary,
    // where the gates disagree.
    it('treats a threshold exactly on the resource percentage as satisfying both directions', () =>
    {
      // Arrange: forty of fifty mp is eighty percent.
      const battler = makeResourceBattler({ mp: 40, mmp: 50 });

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate(battler, 'mpAbove', [ 80 ])).toBe(true);
      expect(PassiveGateEvaluator.evaluate(battler, 'mpBelow', [ 80 ])).toBe(true);
    });

    it('separates mpAbove from mpBelow once the threshold is off the boundary', () =>
    {
      // Arrange
      const battler = makeResourceBattler({ mp: 40, mmp: 50 });

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate(battler, 'mpAbove', [ 50 ])).toBe(true);
      expect(PassiveGateEvaluator.evaluate(battler, 'mpBelow', [ 50 ])).toBe(false);
    });

    it('separates tpAbove from tpBelow once the threshold is off the boundary', () =>
    {
      // Arrange
      const battler = makeResourceBattler({ tp: 10, maxTp: () => 100 });

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate(battler, 'tpAbove', [ 50 ])).toBe(false);
      expect(PassiveGateEvaluator.evaluate(battler, 'tpBelow', [ 50 ])).toBe(true);
    });

    it('reads the resource each gate names rather than whichever one is handy', () =>
    {
      // Arrange: the three resources deliberately disagree at this threshold - hp is at it, mp is
      // well over it, tp is far under. A gate that had stopped honouring its own resource would
      // have to answer the same for all three.
      const battler = makeResourceBattler({
        hp: 50, mhp: 100, mp: 40, mmp: 50, tp: 10, maxTp: () => 100,
      });

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate(battler, 'hpAbove', [ 50 ])).toBe(true);
      expect(PassiveGateEvaluator.evaluate(battler, 'mpAbove', [ 50 ])).toBe(true);
      expect(PassiveGateEvaluator.evaluate(battler, 'tpAbove', [ 50 ])).toBe(false);
    });

    it('resolves an anyAlly scope to allied battlers within the given (or default) range', () =>
    {
      // Arrange- one ally clears the threshold and one does not, so "any" and "all" semantics
      // disagree here and the result proves which one the scope selected.
      const healthyAlly = makeResourceBattler({ hp: 100, mhp: 100 });
      const woundedAlly = makeResourceBattler({ hp: 10, mhp: 100 });
      FakePassiveRuleJabsAccess.alliedBattlersWithinRange.mockReturnValue([
        { getBattler: () => healthyAlly }, { getBattler: () => woundedAlly },
      ]);
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
      // Arrange- one enemy clears the threshold and one does not, so a scope that quietly
      // demanded every enemy satisfy it would come back false instead.
      const healthyEnemy = makeResourceBattler({ hp: 100, mhp: 100 });
      const woundedEnemy = makeResourceBattler({ hp: 10, mhp: 100 });
      FakePassiveRuleJabsAccess.opposingBattlersWithinRange.mockReturnValue([
        { getBattler: () => healthyEnemy }, { getBattler: () => woundedEnemy },
      ]);
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

    it('keeps every aggregate gate apart from its neighbour on a fully-stocked battler', () =>
    {
      // Arrange: all three resources comfortably above the bar. This is the arrangement where the
      // "above" gates and the "below" gates that follow them in the dispatch answer oppositely -
      // on a mixed battler both of a pair can be true at once, which leaves either able to stand
      // in for the other.
      const battler = makeResourceBattler({
        hp: 90, mhp: 100, mp: 90, mmp: 100, tp: 90, maxTp: () => 100,
      });

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate(battler, 'anyAbove', [ 50 ])).toBe(true);
      expect(PassiveGateEvaluator.evaluate(battler, 'anyBelow', [ 50 ])).toBe(false);
      expect(PassiveGateEvaluator.evaluate(battler, 'allAbove', [ 50 ])).toBe(true);
      expect(PassiveGateEvaluator.evaluate(battler, 'allBelow', [ 50 ])).toBe(false);
    });

    it('keeps tpBelow apart from the aggregate gate that follows it', () =>
    {
      // Arrange: every resource under the bar, so a single-resource "below" answers true while
      // "at least one above" answers false - which is what separates the two.
      const battler = makeResourceBattler({
        hp: 10, mhp: 100, mp: 10, mmp: 100, tp: 10, maxTp: () => 100,
      });

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate(battler, 'tpBelow', [ 50 ])).toBe(true);
      expect(PassiveGateEvaluator.evaluate(battler, 'anyAbove', [ 50 ])).toBe(false);
    });

    it('keeps the four aggregate gates apart on a battler where they disagree', () =>
    {
      // Arrange: each of the four cases above gets its own fixture and is asked only about itself,
      // so nothing ever compared them and any one could have resolved to another's answer. This
      // battler is high on two resources and low on the third, which is exactly where "at least
      // one" and "every one" part company in both directions.
      const battler = makeResourceBattler({
        hp: 90, mhp: 100, mp: 90, mmp: 100, tp: 10, maxTp: () => 100,
      });

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate(battler, 'anyAbove', [ 50 ])).toBe(true);
      expect(PassiveGateEvaluator.evaluate(battler, 'allAbove', [ 50 ])).toBe(false);
      expect(PassiveGateEvaluator.evaluate(battler, 'anyBelow', [ 50 ])).toBe(true);
      expect(PassiveGateEvaluator.evaluate(battler, 'allBelow', [ 50 ])).toBe(false);
    });

    it('anyAbove falls back to the plugin proximity when no range is authored', () =>
    {
      // Arrange
      const battler = makeResourceBattler();

      // Act
      PassiveGateEvaluator.evaluate(battler, 'anyAbove', [ 50, 'anyAlly' ]);

      // Assert- an omitted range must resolve to the plugin default, never to NaN tiles.
      expect(FakePassiveRuleJabsAccess.alliedBattlersWithinRange).toHaveBeenCalledWith(battler, 5);
    });

    it('allAbove falls back to the plugin proximity when no range is authored', () =>
    {
      // Arrange
      const battler = makeResourceBattler();

      // Act
      PassiveGateEvaluator.evaluate(battler, 'allAbove', [ 50, 'anyAlly' ]);

      // Assert- an omitted range must resolve to the plugin default, never to NaN tiles.
      expect(FakePassiveRuleJabsAccess.alliedBattlersWithinRange).toHaveBeenCalledWith(battler, 5);
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

    it('negativeStateCount fails while the battler carries fewer negatives than the threshold', () =>
    {
      // Arrange- one negative state against a threshold of three.
      const battler = {
        allStates: () => [
          { isNegativeType: () => true }, { isNegativeType: () => false },
        ],
      };

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, 'negativeStateCount', [ 3 ]);

      // Assert
      expect(result).toBe(false);
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

    it('slotOffCooldown is false while the resolved slot is still cooling down', () =>
    {
      // Arrange- the inverse of slotOnCooldown: a slot JABS reports as not ready.
      const jabsBattler = { isSkillTypeCooldownReady: vi.fn(() => false) };
      FakePassiveRuleJabsAccess.getJabsBattler.mockReturnValue(jabsBattler);

      // Act & Assert
      expect(PassiveGateEvaluator.evaluate({}, 'slotOffCooldown', [ 'mainhand' ])).toBe(false);
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
    // Each of the nine timing gates below was watched from one side only - some only ever
    // passing, some only ever failing - and a comparison seen answering one way is satisfied by
    // one that always answers that way. Nine gates each need both arms, which is what this table
    // supplies: the elapsed frame count is put on either side of the same hundred-frame bar.
    // The `sinceLast` family wants at least that many frames to have passed; the `within` and
    // `onHeal` families want at most that many.
    it.each([
      [ 'sinceLastMoved', 'getPassiveRuleLastMovedFrame', 900, true ],
      [ 'sinceLastMoved', 'getPassiveRuleLastMovedFrame', 950, false ],
      [ 'sinceLastHit', 'getPassiveRuleLastHitFrame', 900, true ],
      [ 'sinceLastHit', 'getPassiveRuleLastHitFrame', 950, false ],
      [ 'sinceLastAttacked', 'getPassiveRuleLastAttackedFrame', 900, true ],
      [ 'sinceLastAttacked', 'getPassiveRuleLastAttackedFrame', 950, false ],
      [ 'movedWithin', 'getPassiveRuleLastMovedFrame', 950, true ],
      [ 'movedWithin', 'getPassiveRuleLastMovedFrame', 800, false ],
      [ 'hitWithin', 'getPassiveRuleLastHitFrame', 950, true ],
      [ 'hitWithin', 'getPassiveRuleLastHitFrame', 800, false ],
      [ 'attackedWithin', 'getPassiveRuleLastAttackedFrame', 950, true ],
      [ 'attackedWithin', 'getPassiveRuleLastAttackedFrame', 800, false ],
      [ 'onHealHp', 'getPassiveRuleLastHpHealFrame', 950, true ],
      [ 'onHealHp', 'getPassiveRuleLastHpHealFrame', 800, false ],
      [ 'onHealMp', 'getPassiveRuleLastMpHealFrame', 950, true ],
      [ 'onHealMp', 'getPassiveRuleLastMpHealFrame', 800, false ],
      [ 'onHealTp', 'getPassiveRuleLastTpHealFrame', 950, true ],
      [ 'onHealTp', 'getPassiveRuleLastTpHealFrame', 800, false ],
    ])('%s with a stamp at frame %i answers %s', (gate, getterName, stampFrame, expected) =>
    {
      // Arrange
      const battler = { [ getterName ]: () => stampFrame };
      globalThis.Graphics.frameCount = 1000;

      // Act
      const result = PassiveGateEvaluator.evaluate(battler, gate, [ 100 ]);

      // Assert
      expect(result).toBe(expected);
    });

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
