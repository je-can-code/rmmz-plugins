//region plugins/regions/ext/skills/objects/_component/game-character.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installRegionsSkillsStackHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJRegions,
  setPluginContextToJRegionsSkills,
} from '../../../../_component/fixtures/install-regions-host-globals.js';

/**
 * The per-frame machinery that turns standing on a tagged region into a skill going off.
 *
 * Nearly all of it is gates. A character updates sixty times a second and every one of those updates
 * walks this path, so each guard is what keeps a region skill from firing on a boat, on a corpse, or
 * sixty times a second instead of once a cadence. A wrong answer in any of them is not a crash - it
 * is a skill that fires constantly or never, and neither announces itself.
 */
describe('J-Regions-Skills Game_Character', () =>
{
  /**
   * Everything `$jabsEngine` was asked to do, so a test can assert on the casts that came out.
   * @type {object}
   */
  let jabsEngine;

  /**
   * The number of times a proc should resolve to, which is what `RPGManager` is asked for.
   * @type {number}
   */
  let procCount;

  /**
   * Builds the battler standing on the region - both the roller and the recipient of the roll.
   * @returns {object} The JABS battler stand-in.
   */
  const buildJabsBattler = () => ({
    getBattler: () => ({
      getPositiveRollsForSkill: () => 0,
      getNegativeRollsForSkill: () => 0,
    }),
    getTeam: () => 1,
    getX: () => 4,
    getY: () => 5,
  });

  /**
   * Builds a character standing on a region, with the engine surface the guards read.
   * @param {object=} overrides Which of those answers to change.
   * @returns {Game_Character} The character under test.
   */
  const buildCharacter = (overrides = {}) =>
  {
    const character = new globalThis.Game_Character();
    character.initMembers();

    Object.assign(character, {
      isVehicle: () => false,
      hasJabsBattler: () => true,
      getJabsBattler: buildJabsBattler,
      regionId: () => 1,
      ...overrides,
    });

    return character;
  };

  /**
   * Builds the dummy caster `$jabsEngine` hands back for the map to damage through.
   * @param {number} battlerId The enemy id the dummy is standing in for.
   * @param {boolean} friendly Whether the dummy reads as friendly to the walker's team.
   * @returns {object} The dummy battler.
   */
  const buildDummyCaster = (battlerId, friendly) => ({
    getBattlerId: () => battlerId,
    isFriendlyTeam: () => friendly,
  });

  beforeAll(async () =>
  {
    vi.resetModules();

    installRegionsSkillsStackHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import(
      '../../../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    setPluginContextToJRegions();
    await import('../../../../../../../src/plugins/regions/core/_metadata/initialization.js');
    await import('../../../../../../../src/plugins/regions/core/objects/Game_Map.js');

    setPluginContextToJRegionsSkills();
    await import('../../../../../../../src/plugins/regions/ext/skills/_metadata/initialization.js');

    await import('../../../../../../../src/plugins/regions/ext/skills/objects/Game_Map.js');
    await import('../../../../../../../src/plugins/regions/ext/skills/objects/Game_Character.js');
  });

  beforeEach(() =>
  {
    procCount = 1;

    jabsEngine = {
      dummyCaster: buildDummyCaster(7, true),
      setMapDamageBattler: vi.fn(),
      forceMapAction: vi.fn(),
      getMapDamageBattler()
      {
        return this.dummyCaster;
      },
    };

    globalThis.$jabsEngine = jabsEngine;
    globalThis.$dataSkills = [ null, { id: 1 }, { id: 2 } ];

    // the proc roll itself belongs to J-Base and is covered there; what matters here is that this
    // file asks for a count and then honors it exactly.
    globalThis.RPGManager.resolveProcCount = () => procCount;

    // by default the character stands on a region nothing is tagged to.
    globalThis.$gameMap = { getRegionSkillsByRegionId: () => [] };
  });

  /**
   * Points the map at one region skill for region 1.
   * @param {object=} overrides Fields of the region skill data to change.
   */
  const tagRegionWithSkill = (overrides = {}) =>
  {
    const regionSkillData = {
      regionId: 1,
      skillId: 2,
      chance: 100,
      casterId: 7,
      isFriendly: true,
      ...overrides,
    };

    globalThis.$gameMap = { getRegionSkillsByRegionId: regionId => (regionId === 1
      ? [ regionSkillData ]
      : []) };
  };

  //region the state the timer lives in
  describe('initRegionSkillsMembers()', () =>
  {
    it('seeds a timer wound to the configured cadence', () =>
    {
      // Arrange
      // Act
      const character = buildCharacter();

      // Assert: without a timer here the first update would throw, and every character on the map
      // runs this path.
      expect(character.getRegionSkillsTimer())
        .toBeDefined();
    });
  });
  //endregion the state the timer lives in

  //region who is allowed to trigger a region skill
  describe('canHandleRegionSkills()', () =>
  {
    it('allows an ordinary character carrying a battler', () =>
    {
      // Arrange
      const character = buildCharacter();

      // Act
      const canHandle = character.canHandleRegionSkills();

      // Assert
      expect(canHandle)
        .toBe(true);
    });

    it('refuses a vehicle, which nothing should be able to poison by sailing over it', () =>
    {
      // Arrange
      const character = buildCharacter({ isVehicle: () => true });

      // Act
      const canHandle = character.canHandleRegionSkills();

      // Assert
      expect(canHandle)
        .toBe(false);
    });

    it('refuses a character with no battler, since there is nothing to cast at', () =>
    {
      // Arrange
      const character = buildCharacter({ hasJabsBattler: () => false });

      // Act
      const canHandle = character.canHandleRegionSkills();

      // Assert
      expect(canHandle)
        .toBe(false);
    });
  });
  //endregion who is allowed to trigger a region skill

  //region the cadence
  describe('handleRegionSkills()', () =>
  {
    it('does not even advance the timer for a character that cannot trigger region skills', () =>
    {
      // Arrange
      const character = buildCharacter({ isVehicle: () => true });
      const update = vi.spyOn(character.getRegionSkillsTimer(), 'update');

      // Act
      character.handleRegionSkills();

      // Assert
      expect(update)
        .not.toHaveBeenCalled();

      update.mockRestore();
    });

    it('advances the timer without firing while the cadence is still running', () =>
    {
      // Arrange
      tagRegionWithSkill();
      const character = buildCharacter();
      const timer = character.getRegionSkillsTimer();
      vi.spyOn(timer, 'isTimerComplete')
        .mockReturnValue(false);
      const update = vi.spyOn(timer, 'update');

      // Act
      character.handleRegionSkills();

      // Assert
      expect(update)
        .toHaveBeenCalled();
      expect(jabsEngine.forceMapAction)
        .not.toHaveBeenCalled();

      vi.restoreAllMocks();
    });

    it('fires and rewinds the timer once the cadence completes', () =>
    {
      // Arrange
      tagRegionWithSkill();
      const character = buildCharacter();
      const timer = character.getRegionSkillsTimer();
      vi.spyOn(timer, 'isTimerComplete')
        .mockReturnValue(true);
      const reset = vi.spyOn(timer, 'reset');

      // Act
      character.handleRegionSkills();

      // Assert: without the reset the timer stays complete and the skill fires every frame after.
      expect(reset)
        .toHaveBeenCalled();
      expect(jabsEngine.forceMapAction)
        .toHaveBeenCalled();

      vi.restoreAllMocks();
    });
  });

  describe('update()', () =>
  {
    it('runs the region skill handling as part of the ordinary character update', () =>
    {
      // Arrange
      const character = buildCharacter();
      const handleRegionSkills = vi.spyOn(character, 'handleRegionSkills');

      // Act
      character.update();

      // Assert
      expect(handleRegionSkills)
        .toHaveBeenCalled();

      handleRegionSkills.mockRestore();
    });
  });
  //endregion the cadence

  //region the cast itself
  describe('executeRegionSkills()', () =>
  {
    it('does nothing at all on a region nothing is tagged to', () =>
    {
      // Arrange
      const character = buildCharacter();

      // Act
      character.executeRegionSkills();

      // Assert
      expect(jabsEngine.forceMapAction)
        .not.toHaveBeenCalled();
    });

    it('casts the tagged skill at the walker\'s own coordinates', () =>
    {
      // Arrange: the proc is purely self-scoped - whoever stepped on the region is the target.
      tagRegionWithSkill();
      const character = buildCharacter();

      // Act
      character.executeRegionSkills();

      // Assert
      expect(jabsEngine.forceMapAction)
        .toHaveBeenCalledWith(jabsEngine.dummyCaster, 2, false, 4, 5, true);
    });

    it('casts nothing when the roll came up short', () =>
    {
      // Arrange
      tagRegionWithSkill();
      procCount = 0;
      const character = buildCharacter();

      // Act
      character.executeRegionSkills();

      // Assert
      expect(jabsEngine.forceMapAction)
        .not.toHaveBeenCalled();
    });

    it('does not even rebuild the dummy caster for a roll that came up short', () =>
    {
      // Arrange: a failed roll must abandon the whole proc, not just the cast. The standing dummy is
      // deliberately the wrong caster here, so nothing but the failed roll is left to stop the
      // rebuild - and rebuilding one per frame for procs that never fire is pure churn on a path
      // every character walks sixty times a second.
      tagRegionWithSkill({ casterId: 99 });
      procCount = 0;
      const character = buildCharacter();

      // Act
      character.executeRegionSkills();

      // Assert
      expect(jabsEngine.setMapDamageBattler)
        .not.toHaveBeenCalled();
      expect(jabsEngine.forceMapAction)
        .not.toHaveBeenCalled();
    });

    it('casts once per success when the roll accumulated several', () =>
    {
      // Arrange
      tagRegionWithSkill();
      procCount = 3;
      const character = buildCharacter();

      // Act
      character.executeRegionSkills();

      // Assert
      expect(jabsEngine.forceMapAction)
        .toHaveBeenCalledTimes(3);
    });

    it('reuses the standing dummy caster when it already matches the tag', () =>
    {
      // Arrange
      tagRegionWithSkill({
        casterId: 7,
        isFriendly: true,
      });
      const character = buildCharacter();

      // Act
      character.executeRegionSkills();

      // Assert: rebuilding a dummy that is already correct would throw away its state every frame.
      expect(jabsEngine.setMapDamageBattler)
        .not.toHaveBeenCalled();
    });

    it('rebuilds the dummy caster when the standing one is the wrong caster', () =>
    {
      // Arrange
      tagRegionWithSkill({ casterId: 99 });
      const character = buildCharacter();

      // Act
      character.executeRegionSkills();

      // Assert
      expect(jabsEngine.setMapDamageBattler)
        .toHaveBeenCalledWith(99, true);
    });

    it('rebuilds the dummy caster when the standing one is on the wrong side', () =>
    {
      // Arrange: same enemy id, opposite allegiance - a healing region and a damaging one can share
      // a caster id, and only the team tells them apart.
      tagRegionWithSkill({
        casterId: 7,
        isFriendly: false,
      });
      const character = buildCharacter();

      // Act
      character.executeRegionSkills();

      // Assert
      expect(jabsEngine.setMapDamageBattler)
        .toHaveBeenCalledWith(7, false);
    });

    it('builds a dummy caster when there is not one standing at all', () =>
    {
      // Arrange
      tagRegionWithSkill();
      jabsEngine.dummyCaster = null;
      jabsEngine.setMapDamageBattler = vi.fn(() =>
      {
        jabsEngine.dummyCaster = buildDummyCaster(7, true);
      });
      const character = buildCharacter();

      // Act
      character.executeRegionSkills();

      // Assert
      expect(jabsEngine.setMapDamageBattler)
        .toHaveBeenCalledWith(7, true);
    });
  });
  //endregion the cast itself

  //region reading the map
  describe('getRegionSkillsByCurrentRegionId()', () =>
  {
    it('asks the map about the region the character is standing on', () =>
    {
      // Arrange
      tagRegionWithSkill();
      const character = buildCharacter({ regionId: () => 1 });

      // Act
      const found = character.getRegionSkillsByCurrentRegionId();

      // Assert
      expect(found.length)
        .toBe(1);
    });

    it('finds nothing while standing on an untagged region', () =>
    {
      // Arrange
      tagRegionWithSkill();
      const character = buildCharacter({ regionId: () => 2 });

      // Act
      const found = character.getRegionSkillsByCurrentRegionId();

      // Assert
      expect(found)
        .toEqual([]);
    });
  });
  //endregion reading the map
});
//endregion plugins/regions/ext/skills/objects/_component/game-character.test.js