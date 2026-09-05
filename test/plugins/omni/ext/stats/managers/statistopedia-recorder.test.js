//region plugins/omni/ext/stats/managers/statistopedia-recorder.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';

import StatistopediaRecorder
  from '../../../../../../src/plugins/omni/ext/stats/managers/StatistopediaRecorder.js';

describe('StatistopediaRecorder', () =>
{
  /**
   * The stand-in for the party's records, spying on every call the recorder makes.
   * @type {object}
   */
  let records;

  /**
   * Builds a stand-in JABS battler.
   * @param {{uuid?: string, hp?: number, hpDamage?: number, inanimate?: boolean, battlerId?: number}=} options
   * How the battler should be shaped.
   * @returns {object} The stubbed battler.
   */
  const buildBattler = (options = {}) =>
  {
    const {
      uuid = 'battler-1',
      hp = 100,
      hpDamage = 0,
      inanimate = false,
      battlerId = 88,
    } = options;

    return {
      getUuid: () => uuid,
      isInanimate: () => inanimate,
      battlerId: () => battlerId,
      getBattler: () => ({
        hp,
        result: () => ({ hpDamage }),
        weapons: () => [],
      }),
    };
  };

  beforeEach(() =>
  {
    StatistopediaRecorder.preHitHp.clear();

    records = {
      addHitLanded: vi.fn(),
      addHitTaken: vi.fn(),
      recordOverkill: vi.fn(),
      recordHpSurvived: vi.fn(),
      addDamageForWeapon: vi.fn(),
      addKillForEnemy: vi.fn(),
      addKillForMap: vi.fn(),
      addDeathForMap: vi.fn(),
      extendKillStreak: vi.fn(),
      breakKillStreak: vi.fn(),
      addUsageForSkill: vi.fn(),
      addVisitedMap: vi.fn(),
    };

    globalThis.$gameParty = { getStatistopediaRecords: () => records };
    globalThis.$gameMap = { mapId: () => 7 };
  });

  describe('preHitHp', () =>
  {
    it('hands back what was remembered for a battler', () =>
    {
      // Arrange.
      const target = buildBattler({ uuid: 'a', hp: 340 });
      StatistopediaRecorder.rememberPreHitHp(target);

      // Act.
      const remembered = StatistopediaRecorder.takePreHitHp(target);

      // Assert.
      expect(remembered).toBe(340);
    });

    it('forgets a reading once it has been taken', () =>
    {
      // Arrange.
      const target = buildBattler({ uuid: 'a', hp: 340 });
      StatistopediaRecorder.rememberPreHitHp(target);
      StatistopediaRecorder.takePreHitHp(target);

      // Act.
      const second = StatistopediaRecorder.takePreHitHp(target);

      // Assert: a second read must not report the first hit's hp all over again.
      expect(second).toBe(0);
    });

    it('hands back zero for a battler with nothing remembered', () =>
    {
      // Arrange: a sibling reading that has to survive being missed by the wrong uuid.
      const remembered = buildBattler({ uuid: 'a', hp: 340 });
      const unremembered = buildBattler({ uuid: 'b' });
      StatistopediaRecorder.rememberPreHitHp(remembered);

      // Act.
      const taken = StatistopediaRecorder.takePreHitHp(unremembered);

      // Assert.
      expect(taken).toBe(0);
      expect(StatistopediaRecorder.preHitHp.get('a')).toBe(340);
    });
  });

  describe('trackHitLanded', () =>
  {
    /**
     * Builds a stand-in action.
     * @param {{isPlayer?: boolean, weapons?: object[], skillId?: number}=} options How to shape it.
     * @returns {object} The stubbed action.
     */
    const buildAction = (options = {}) =>
    {
      const {
        isPlayer = false,
        weapons = [],
        skillId = 41,
      } = options;

      return {
        getBaseSkill: () => ({ id: skillId }),
        getCaster: () => ({
          isPlayer: () => isPlayer,
          getBattler: () => ({ weapons: () => weapons }),
        }),
      };
    };

    it('counts the hit and records how far past lethal it went', () =>
    {
      // Arrange: 500 damage onto a target standing on 120 overshoots by 380.
      const target = buildBattler({ uuid: 'a', hp: 120, hpDamage: 500 });
      StatistopediaRecorder.rememberPreHitHp(target);

      // Act.
      StatistopediaRecorder.trackHitLanded(buildAction(), target);

      // Assert.
      expect(records.addHitLanded).toHaveBeenCalledTimes(1);
      expect(records.recordOverkill).toHaveBeenCalledWith(380);
    });

    it('records no overkill for a hit the target survived', () =>
    {
      // Arrange: 80 damage onto a target standing on 120 kills nothing.
      const target = buildBattler({ uuid: 'a', hp: 120, hpDamage: 80 });
      StatistopediaRecorder.rememberPreHitHp(target);

      // Act.
      StatistopediaRecorder.trackHitLanded(buildAction(), target);

      // Assert.
      expect(records.addHitLanded).toHaveBeenCalledTimes(1);
      expect(records.recordOverkill).not.toHaveBeenCalled();
    });

    it('attributes the damage to the weapon the player was holding', () =>
    {
      // Arrange: two equipped weapons, only the first of which may be credited.
      const target = buildBattler({ uuid: 'a', hp: 900, hpDamage: 250 });
      StatistopediaRecorder.rememberPreHitHp(target);
      const action = buildAction({
        isPlayer: true,
        weapons: [ { id: 12 }, { id: 13 } ],
      });

      // Act.
      StatistopediaRecorder.trackHitLanded(action, target);

      // Assert.
      expect(records.addDamageForWeapon).toHaveBeenCalledWith(12, 250);
    });

    it('attributes nothing when the caster is not the player', () =>
    {
      // Arrange: an ally landing a hit with a weapon equipped.
      const target = buildBattler({ uuid: 'a', hp: 900, hpDamage: 250 });
      StatistopediaRecorder.rememberPreHitHp(target);
      const action = buildAction({
        isPlayer: false,
        weapons: [ { id: 12 } ],
      });

      // Act.
      StatistopediaRecorder.trackHitLanded(action, target);

      // Assert: the hit still counts, only the weapon credit does not.
      expect(records.addHitLanded).toHaveBeenCalledTimes(1);
      expect(records.addDamageForWeapon).not.toHaveBeenCalled();
    });

    it('attributes nothing when the player is swinging unarmed', () =>
    {
      // Arrange.
      const target = buildBattler({ uuid: 'a', hp: 900, hpDamage: 250 });
      StatistopediaRecorder.rememberPreHitHp(target);
      const action = buildAction({
        isPlayer: true,
        weapons: [],
      });

      // Act.
      StatistopediaRecorder.trackHitLanded(action, target);

      // Assert.
      expect(records.addHitLanded).toHaveBeenCalledTimes(1);
      expect(records.addDamageForWeapon).not.toHaveBeenCalled();
    });
  });

  describe('trackHitTaken', () =>
  {
    it('counts the hit and offers what the player was left standing on', () =>
    {
      // Arrange.
      const target = buildBattler({ uuid: 'a', hp: 9 });
      StatistopediaRecorder.rememberPreHitHp(target);

      // Act.
      StatistopediaRecorder.trackHitTaken(target);

      // Assert.
      expect(records.addHitTaken).toHaveBeenCalledTimes(1);
      expect(records.recordHpSurvived).toHaveBeenCalledWith(9);
    });

    it('consumes the pre-hit reading so it cannot leak into a later hit', () =>
    {
      // Arrange.
      const target = buildBattler({ uuid: 'a', hp: 9 });
      StatistopediaRecorder.rememberPreHitHp(target);

      // Act.
      StatistopediaRecorder.trackHitTaken(target);

      // Assert.
      expect(StatistopediaRecorder.preHitHp.has('a')).toBe(false);
    });
  });

  describe('trackDefeatedEnemy', () =>
  {
    it('files the kill against the enemy, the map, and the streak', () =>
    {
      // Arrange.
      const defeated = buildBattler({ battlerId: 88, inanimate: false });

      // Act.
      StatistopediaRecorder.trackDefeatedEnemy(defeated);

      // Assert.
      expect(records.addKillForEnemy).toHaveBeenCalledWith(88);
      expect(records.addKillForMap).toHaveBeenCalledWith(7);
      expect(records.extendKillStreak).toHaveBeenCalledTimes(1);
    });

    it('files nothing for scenery the player broke', () =>
    {
      // Arrange: a chopped tree is not an opponent, and must not feed a kill streak.
      const defeated = buildBattler({ battlerId: 3, inanimate: true });

      // Act.
      StatistopediaRecorder.trackDefeatedEnemy(defeated);

      // Assert.
      expect(records.addKillForEnemy).not.toHaveBeenCalled();
      expect(records.addKillForMap).not.toHaveBeenCalled();
      expect(records.extendKillStreak).not.toHaveBeenCalled();
    });
  });

  describe('trackDefeatedPlayer', () =>
  {
    it('files the death against the map and ends the streak', () =>
    {
      // Arrange & Act.
      StatistopediaRecorder.trackDefeatedPlayer();

      // Assert.
      expect(records.addDeathForMap).toHaveBeenCalledWith(7);
      expect(records.breakKillStreak).toHaveBeenCalledTimes(1);
    });
  });

  describe('trackSkillUsage', () =>
  {
    it('files the execution against the skill that was used', () =>
    {
      // Arrange.
      const action = { getBaseSkill: () => ({ id: 42 }) };

      // Act.
      StatistopediaRecorder.trackSkillUsage(action);

      // Assert.
      expect(records.addUsageForSkill).toHaveBeenCalledWith(42);
    });
  });

  describe('trackVisitedMap', () =>
  {
    it('files the map as somewhere the party has been', () =>
    {
      // Arrange & Act.
      StatistopediaRecorder.trackVisitedMap(19);

      // Assert.
      expect(records.addVisitedMap).toHaveBeenCalledWith(19);
    });
  });

  describe('constructor', () =>
  {
    it('refuses to be built, being a static class', () =>
    {
      // Arrange.
      const build = () => new StatistopediaRecorder();

      // Act & Assert.
      expect(build).toThrow('This is a static class.');
    });
  });
});
//endregion plugins/omni/ext/stats/managers/statistopedia-recorder.test.js
