//region plugins/regions/ext/states/objects/_component/game-character.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installRegionsStatesStackHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJRegions,
  setPluginContextToJRegionsStates,
} from '../../../../_component/fixtures/install-regions-host-globals.js';

/**
 * The per-frame machinery that turns standing on a tagged region into a state being applied.
 *
 * The sibling skills pack does the same job for skills and its tests read almost identically; the two
 * differ in exactly the places worth checking. This one gates on visibility as well as vehicles, and
 * it re-checks affected status per success so a second proc within one roll deepens an existing state
 * instead of re-adding a fresh one.
 */
describe('J-Regions-States Game_Character', () =>
{
  /**
   * The number of times a proc should resolve to, which is what `RPGManager` is asked for.
   * @type {number}
   */
  let procCount;

  /**
   * Everything the battler was asked to do about its states.
   * @type {{added: object[], reset: object[]}}
   */
  let stateCalls;

  /**
   * Builds the battler standing on the region.
   * @param {object=} overrides Which answers to change.
   * @returns {object} The battler stand-in.
   */
  const buildBattler = (overrides = {}) => ({
    stateRate: () => 1,
    isStateAffected: stateId => stateCalls.added.some(entry => entry.stateId === stateId),
    addState: (stateId, attacker) => stateCalls.added.push({
      stateId,
      attacker,
    }),
    resetStateCounts: (stateId, attacker) => stateCalls.reset.push({
      stateId,
      attacker,
    }),
    getPositiveRollsForSkill: () => 0,
    getNegativeRollsForSkill: () => 0,
    ...overrides,
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
      isVisible: () => true,
      hasJabsBattler: () => true,
      getJabsBattler: () => ({ getBattler: () => buildBattler() }),
      regionId: () => 1,
      requestAnimation: vi.fn(),
      ...overrides,
    });

    return character;
  };

  /**
   * Points the map at one region state for region 1.
   * @param {object=} overrides Fields of the region state data to change.
   */
  const tagRegionWithState = (overrides = {}) =>
  {
    const regionStateData = {
      regionId: 1,
      stateId: 3,
      chance: 100,
      animationId: 0,
      ...overrides,
    };

    globalThis.$gameMap = { getRegionStatesByRegionId: regionId => (regionId === 1
      ? [ regionStateData ]
      : []) };
  };

  beforeAll(async () =>
  {
    vi.resetModules();

    installRegionsStatesStackHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import(
      '../../../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    setPluginContextToJRegions();
    await import('../../../../../../../src/plugins/regions/core/_metadata/initialization.js');
    await import('../../../../../../../src/plugins/regions/core/objects/Game_Map.js');

    setPluginContextToJRegionsStates();
    await import('../../../../../../../src/plugins/regions/ext/states/_metadata/initialization.js');

    await import('../../../../../../../src/plugins/regions/ext/states/objects/Game_Map.js');
    await import('../../../../../../../src/plugins/regions/ext/states/objects/Game_Character.js');
  });

  beforeEach(() =>
  {
    procCount = 1;

    stateCalls = {
      added: [],
      reset: [],
    };

    globalThis.$dataStates = [ null, { id: 1 }, { id: 2 }, { id: 3 } ];

    // the proc roll itself belongs to J-Base and is covered there; what matters here is that this
    // file asks for a count and then honors it exactly.
    globalThis.RPGManager.resolveProcCount = () => procCount;

    globalThis.$gameMap = { getRegionStatesByRegionId: () => [] };
  });

  //region the state the timer lives in
  describe('initRegionStatesMembers()', () =>
  {
    it('seeds a timer wound to the configured cadence', () =>
    {
      // Arrange
      // Act
      const character = buildCharacter();

      // Assert
      expect(character.getRegionStatesTimer())
        .toBeDefined();
    });

    it('keeps the running timer across a re-init rather than rewinding it', () =>
    {
      // Arrange: `initMembers` runs again whenever a character is refreshed, and rebuilding the timer
      // there would reset the cadence every refresh - a region state that never quite lands.
      const character = buildCharacter();
      const timer = character.getRegionStatesTimer();

      // Act
      character.initRegionStatesMembers();

      // Assert
      expect(character.getRegionStatesTimer())
        .toBe(timer);
    });
  });
  //endregion the state the timer lives in

  //region who is allowed to receive a region state
  describe('canHandleRegionStates()', () =>
  {
    it('allows an ordinary visible character carrying a battler', () =>
    {
      // Arrange
      const character = buildCharacter();

      // Act
      const canHandle = character.canHandleRegionStates();

      // Assert
      expect(canHandle)
        .toBe(true);
    });

    it('refuses a vehicle, which nothing should be able to poison by sailing over it', () =>
    {
      // Arrange
      const character = buildCharacter({ isVehicle: () => true });

      // Act
      const canHandle = character.canHandleRegionStates();

      // Assert
      expect(canHandle)
        .toBe(false);
    });

    it('refuses an invisible character, since a state on one is a status nobody can see arriving', () =>
    {
      // Arrange
      const character = buildCharacter({ isVisible: () => false });

      // Act
      const canHandle = character.canHandleRegionStates();

      // Assert
      expect(canHandle)
        .toBe(false);
    });

    it('refuses a character with no battler, since there is nothing to hold the state', () =>
    {
      // Arrange
      const character = buildCharacter({ hasJabsBattler: () => false });

      // Act
      const canHandle = character.canHandleRegionStates();

      // Assert
      expect(canHandle)
        .toBe(false);
    });
  });
  //endregion who is allowed to receive a region state

  //region the cadence
  describe('handleRegionStates()', () =>
  {
    it('does not even advance the timer for a character that cannot receive region states', () =>
    {
      // Arrange
      const character = buildCharacter({ isVehicle: () => true });
      const update = vi.spyOn(character.getRegionStatesTimer(), 'update');

      // Act
      character.handleRegionStates();

      // Assert
      expect(update)
        .not.toHaveBeenCalled();

      update.mockRestore();
    });

    it('advances the timer without applying while the cadence is still running', () =>
    {
      // Arrange
      tagRegionWithState();
      const character = buildCharacter();
      const timer = character.getRegionStatesTimer();
      vi.spyOn(timer, 'isTimerComplete')
        .mockReturnValue(false);
      const update = vi.spyOn(timer, 'update');

      // Act
      character.handleRegionStates();

      // Assert
      expect(update)
        .toHaveBeenCalled();
      expect(stateCalls.added.length)
        .toBe(0);

      vi.restoreAllMocks();
    });

    it('applies and rewinds the timer once the cadence completes', () =>
    {
      // Arrange
      tagRegionWithState();
      const character = buildCharacter();
      const timer = character.getRegionStatesTimer();
      vi.spyOn(timer, 'isTimerComplete')
        .mockReturnValue(true);
      const reset = vi.spyOn(timer, 'reset');

      // Act
      character.handleRegionStates();

      // Assert: without the reset the timer stays complete and the state re-applies every frame.
      expect(reset)
        .toHaveBeenCalled();
      expect(stateCalls.added.length)
        .toBe(1);

      vi.restoreAllMocks();
    });
  });

  describe('update()', () =>
  {
    it('runs the region state handling as part of the ordinary character update', () =>
    {
      // Arrange
      const character = buildCharacter();
      const handleRegionStates = vi.spyOn(character, 'handleRegionStates');

      // Act
      character.update();

      // Assert
      expect(handleRegionStates)
        .toHaveBeenCalled();

      handleRegionStates.mockRestore();
    });
  });
  //endregion the cadence

  //region the application itself
  describe('applyRegionStates()', () =>
  {
    it('does nothing at all on a region nothing is tagged to', () =>
    {
      // Arrange
      const character = buildCharacter();

      // Act
      character.applyRegionStates();

      // Assert
      expect(stateCalls.added.length)
        .toBe(0);
    });

    it('applies the tagged state to the walker', () =>
    {
      // Arrange
      tagRegionWithState();
      const character = buildCharacter();

      // Act
      character.applyRegionStates();

      // Assert
      expect(stateCalls.added.map(entry => entry.stateId))
        .toEqual([ 3 ]);
    });

    it('applies nothing when the roll came up short', () =>
    {
      // Arrange
      tagRegionWithState();
      procCount = 0;
      const character = buildCharacter();

      // Act
      character.applyRegionStates();

      // Assert
      expect(stateCalls.added.length)
        .toBe(0);
    });

    it('deepens an already-affected state instead of re-adding it fresh', () =>
    {
      // Arrange: two successes within one roll should stack, and adding fresh would instead restart
      // the duration each time - a state that can never actually build up.
      tagRegionWithState();
      procCount = 2;
      const character = buildCharacter();

      // Act
      character.applyRegionStates();

      // Assert
      expect(stateCalls.added.length)
        .toBe(1);
      expect(stateCalls.reset.length)
        .toBe(1);
    });

    it('plays the animation the tag named', () =>
    {
      // Arrange
      tagRegionWithState({ animationId: 42 });
      const character = buildCharacter();

      // Act
      character.applyRegionStates();

      // Assert
      expect(character.requestAnimation)
        .toHaveBeenCalledWith(42);
    });

    it('plays nothing when the tag named no animation', () =>
    {
      // Arrange: zero is the "none" sentinel, and requesting it would flash the engine's first
      // animation on every proc.
      tagRegionWithState({ animationId: 0 });
      const character = buildCharacter();

      // Act
      character.applyRegionStates();

      // Assert
      expect(character.requestAnimation)
        .not.toHaveBeenCalled();
    });
  });
  //endregion the application itself

  //region reading the map
  describe('getRegionStatesByCurrentRegionId()', () =>
  {
    it('asks the map about the region the character is standing on', () =>
    {
      // Arrange
      tagRegionWithState();
      const character = buildCharacter({ regionId: () => 1 });

      // Act
      const found = character.getRegionStatesByCurrentRegionId();

      // Assert
      expect(found.length)
        .toBe(1);
    });

    it('finds nothing while standing on an untagged region', () =>
    {
      // Arrange
      tagRegionWithState();
      const character = buildCharacter({ regionId: () => 2 });

      // Act
      const found = character.getRegionStatesByCurrentRegionId();

      // Assert
      expect(found)
        .toEqual([]);
    });
  });
  //endregion reading the map
});
//endregion plugins/regions/ext/states/objects/_component/game-character.test.js