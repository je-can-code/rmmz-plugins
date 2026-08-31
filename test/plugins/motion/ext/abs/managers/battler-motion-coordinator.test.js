//region plugins/motion/ext/abs/managers/battler-motion-coordinator.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearMapBattlers,
  installDeathMetadata,
  installMotionAbsGlobals,
  registerMapBattler,
} from '../fixtures/install-motion-abs-globals.js';

describe('BattlerMotionCoordinator', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/motion/ext/abs/managers/BattlerMotionCoordinator.js').default} */
  let BattlerMotionCoordinator;

  /** @type {typeof import('../../../../../../src/plugins/motion/core/managers/CharacterMotionComposer.js').default} */
  let CharacterMotionComposer;

  /** @type {typeof import('../../../../../../src/plugins/motion/core/core/MotionChannels.js').default} */
  let MotionChannels;

  beforeAll(async () =>
  {
    installMotionAbsGlobals();

    // literal import paths, so Stryker can map mutants in these files back to this test file.
    await import('../../../../../../src/plugins/motion/ext/abs/core/registerCollapseMotionType.js');
    ({ default: BattlerMotionCoordinator } =
      await import('../../../../../../src/plugins/motion/ext/abs/managers/BattlerMotionCoordinator.js'));
    ({ default: CharacterMotionComposer } =
      await import('../../../../../../src/plugins/motion/core/managers/CharacterMotionComposer.js'));
    ({ default: MotionChannels } =
      await import('../../../../../../src/plugins/motion/core/core/MotionChannels.js'));
  });

  /** @type {Object} */
  let character;

  beforeEach(() =>
  {
    installDeathMetadata();
    character = { name: 'an-enemy-sprite' };
  });

  afterEach(() =>
  {
    CharacterMotionComposer.forget(character);
    clearMapBattlers();
    vi.restoreAllMocks();
  });

  /**
   * Builds a battler that is present on the map, wired to the shared character.
   * @param {Object[]} states The states it carries, each with an id and a note.
   * @param {string} enemyNote Its own note.
   * @returns {Object} The Game_Battler stand-in.
   */
  const aMapBattler = (states = [], enemyNote = '') =>
  {
    const battler = {
      getUuid: () => 'uuid-1',
      state: stateId => states.find(candidate => candidate.id === stateId),
      states: () => states,
      isStateAffected: stateId => states.some(candidate => candidate.id === stateId),
      databaseData: () => ({ note: enemyNote }),
    };

    registerMapBattler('uuid-1', {
      getCharacter: () => character,
      getBattler: () => battler,
    });

    return battler;
  };

  /**
   * Builds a battler that exists but is nowhere on the map.
   * @returns {Object} The Game_Battler stand-in.
   */
  const anOffMapBattler = () => ({
    getUuid: () => 'uuid-nowhere',
    state: () => null,
    states: () => [],
    // the state really did land on this battler. Saying otherwise would let the "not on the map"
    // tests pass because the state was rejected, which is a different guard entirely.
    isStateAffected: () => true,
    databaseData: () => ({ note: '' }),
  });

  /**
   * Composes the shared character for a number of frames.
   * @param {number} frames How many frames to run.
   * @returns {Object} The final composition.
   */
  const composeFor = frames =>
  {
    let composition = null;
    for (let index = 0; index < frames; index++)
    {
      composition = CharacterMotionComposer.compose(character);
    }

    return composition;
  };

  describe('refreshLeaderStateMotions', () =>
  {
    /**
     * Puts a battler in the leader's chair.
     * @param {Object} battler The battler now leading.
     */
    const leadWith = battler =>
    {
      globalThis.$gameParty = { leader: () => battler };
    };

    afterEach(() =>
    {
      delete globalThis.$gameParty;
    });

    it('drops the state motions belonging to whoever was leading before', () =>
    {
      // Arrange- the outgoing leader's bleed is declared on the character the player drives, which
      // is the same character the incoming leader will be driving a moment later.
      const bleeding = { id: 4, note: '<motion:[sway, 8, 100, sync]>' };
      const outgoing = aMapBattler([ bleeding ]);
      BattlerMotionCoordinator.applyStateMotions(outgoing, 4);
      leadWith(aMapBattler([]));

      // Act
      BattlerMotionCoordinator.refreshLeaderStateMotions();
      composeFor(1);

      // Assert
      expect(CharacterMotionComposer.hasMotion(character)).toBe(false);
    });

    it('starts the state motions belonging to whoever is leading now', () =>
    {
      // Arrange
      const cursed = { id: 5, note: '<motion:[float, 20, 100, sync]>' };
      leadWith(aMapBattler([ cursed ]));

      // Act
      BattlerMotionCoordinator.refreshLeaderStateMotions();
      const composition = composeFor(25);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).toBeCloseTo(-10, 10);
    });

    it('leaves motions that did not come from a state alone', () =>
    {
      // Arrange- the near-miss. Cycling changes who the character stands for, which says nothing
      // about a motion the map itself put there.
      const declaration = new globalThis.MotionDeclaration('sway', [ 8, 100, 'sync' ], 'page');
      CharacterMotionComposer.declare(character, 'page', [ declaration ]);
      leadWith(aMapBattler([]));

      // Act
      BattlerMotionCoordinator.refreshLeaderStateMotions();
      const composition = composeFor(25);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBeCloseTo(8, 10);
    });

    it('changes nothing when the new leader is not on the map', () =>
    {
      // Arrange- a party wipe leaves nobody drivable between the last death and the game over.
      const bleeding = { id: 4, note: '<motion:[sway, 8, 100, sync]>' };
      const outgoing = aMapBattler([ bleeding ]);
      BattlerMotionCoordinator.applyStateMotions(outgoing, 4);
      leadWith(anOffMapBattler());

      // Act
      BattlerMotionCoordinator.refreshLeaderStateMotions();
      const composition = composeFor(25);

      // Assert- the previous leader's motion is still running, untouched.
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBeCloseTo(8, 10);
    });
  });

  describe('applyStateMotions', () =>
  {
    it('declares whatever the state asks for', () =>
    {
      // Arrange
      const bleeding = { id: 4, note: '<motion:[sway, 8, 100, sync]>' };
      const battler = aMapBattler([ bleeding ]);

      // Act
      BattlerMotionCoordinator.applyStateMotions(battler, 4);
      const composition = composeFor(25);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBeCloseTo(8, 10);
    });

    it('declares nothing for a state that was resisted and never actually landed', () =>
    {
      // Arrange- the battler carries state 4 and is immune to state 9. J-ABS drops a resisted
      // application but still runs this hook, and nothing will ever remove a state that was never
      // added, so a motion declared here would run for the rest of the battler's life. State 4 is
      // the near-miss: it is present, it does declare, and it must not be what decides this.
      const bleeding = { id: 4, note: '<motion:[sway, 8, 100, sync]>' };
      const battler = aMapBattler([ bleeding ]);

      // Act
      BattlerMotionCoordinator.applyStateMotions(battler, 9);

      // Assert
      expect(CharacterMotionComposer.hasMotion(character)).toBe(false);
    });

    it('declares several motions from one state', () =>
    {
      // Arrange
      const cursed = { id: 5, note: '<motion:[sway, 8, 100, sync]>\n<motion:[float, 20, 100, sync]>' };
      const battler = aMapBattler([ cursed ]);

      // Act
      BattlerMotionCoordinator.applyStateMotions(battler, 5);
      const composition = composeFor(25);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBeCloseTo(8, 10);
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).toBeCloseTo(-10, 10);
    });

    it('declares nothing for a state that says nothing about motion', () =>
    {
      // Arrange
      const poison = { id: 6, note: '<slipHp:-20>' };
      const battler = aMapBattler([ poison ]);

      // Act
      BattlerMotionCoordinator.applyStateMotions(battler, 6);

      // Assert
      expect(CharacterMotionComposer.hasMotion(character)).toBe(false);
    });

    it('does nothing at all for a battler that is not on the map', () =>
    {
      // Arrange
      const battler = anOffMapBattler();

      // Act
      const applying = () => BattlerMotionCoordinator.applyStateMotions(battler, 4);

      // Assert
      expect(applying).not.toThrow();
      expect(CharacterMotionComposer.hasMotion(character)).toBe(false);
    });

    it('files each state separately, so one does not overwrite another', () =>
    {
      // Arrange
      const bleeding = { id: 4, note: '<motion:[sway, 8, 100, sync]>' };
      const cursed = { id: 5, note: '<motion:[float, 20, 100, sync]>' };
      const battler = aMapBattler([ bleeding, cursed ]);

      // Act
      BattlerMotionCoordinator.applyStateMotions(battler, 4);
      BattlerMotionCoordinator.applyStateMotions(battler, 5);
      const composition = composeFor(25);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBeCloseTo(8, 10);
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).toBeCloseTo(-10, 10);
    });
  });

  describe('removeStateMotions', () =>
  {
    it('withdraws what that state had declared', () =>
    {
      // Arrange
      const bleeding = { id: 4, note: '<motion:[sway, 8, 100, sync]>' };
      const battler = aMapBattler([ bleeding ]);
      BattlerMotionCoordinator.applyStateMotions(battler, 4);
      composeFor(25);

      // Act
      BattlerMotionCoordinator.removeStateMotions(battler, 4);
      const composition = composeFor(1);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBe(0);
    });

    it('leaves another state\'s motions running', () =>
    {
      // Arrange
      const bleeding = { id: 4, note: '<motion:[sway, 8, 100, sync]>' };
      const cursed = { id: 5, note: '<motion:[float, 20, 100, sync]>' };
      const battler = aMapBattler([ bleeding, cursed ]);
      BattlerMotionCoordinator.applyStateMotions(battler, 4);
      BattlerMotionCoordinator.applyStateMotions(battler, 5);

      // Act
      BattlerMotionCoordinator.removeStateMotions(battler, 4);
      const composition = composeFor(25);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBe(0);
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).toBeCloseTo(-10, 10);
    });

    it('does nothing at all for a battler that is not on the map', () =>
    {
      // Arrange
      const battler = anOffMapBattler();

      // Act
      const removing = () => BattlerMotionCoordinator.removeStateMotions(battler, 4);

      // Assert
      expect(removing).not.toThrow();
    });
  });

  describe('beginDeath', () =>
  {
    /**
     * Builds the JABS battler wrapper the death path is handed.
     * @param {Object[]} states The states the battler carries.
     * @param {string} enemyNote Its own note.
     * @returns {Object}
     */
    const aDyingBattler = (states = [], enemyNote = '') =>
    {
      const battler = aMapBattler(states, enemyNote);

      return {
        getCharacter: () => character,
        getBattler: () => battler,
      };
    };

    it('reports how long the default death needs', () =>
    {
      // Arrange
      const dying = aDyingBattler();

      // Act
      const duration = BattlerMotionCoordinator.beginDeath(dying);

      // Assert
      expect(duration).toBe(30);
    });

    it('reports the longer duration a slower death needs', () =>
    {
      // Arrange
      const dying = aDyingBattler([], '<deathMotion:slow>');

      // Act
      const duration = BattlerMotionCoordinator.beginDeath(dying);

      // Assert
      expect(duration).toBe(120);
    });

    it('declares the collapse so the sprite actually animates', () =>
    {
      // Arrange
      const dying = aDyingBattler();

      // Act
      BattlerMotionCoordinator.beginDeath(dying);
      const composition = composeFor(30);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_Y)).toBe(0);
      expect(composition.valueFor(MotionChannels.OPACITY)).toBe(0);
    });

    it('lets the collapse take over from whatever the enemy was doing', () =>
    {
      // Arrange
      const bleeding = { id: 4, note: '<motion:[float, 20, 100, sync]>' };
      const dying = aDyingBattler([ bleeding ]);
      BattlerMotionCoordinator.applyStateMotions(dying.getBattler(), 4);

      // Act
      BattlerMotionCoordinator.beginDeath(dying);
      const composition = composeFor(50);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_Y)).toBe(0);
    });

    it('declares nothing and asks for no delay when the battler opts out', () =>
    {
      // Arrange
      const dying = aDyingBattler([], '<noDeathMotion>');

      // Act
      const duration = BattlerMotionCoordinator.beginDeath(dying);

      // Assert
      expect(duration).toBe(0);
      expect(CharacterMotionComposer.hasMotion(character)).toBe(false);
    });

    it('still buries a battler whose death style is a typo, and says so', () =>
    {
      // Arrange
      const warned = vi.spyOn(console, 'warn')
        .mockImplementation(() =>
        {
        });
      const dying = aDyingBattler([], '<deathMotion:spectacular>');

      // Act
      const duration = BattlerMotionCoordinator.beginDeath(dying);

      // Assert
      expect(duration).toBe(30);
      expect(warned.mock.calls.at(0)
        .at(0)).toContain('spectacular');
    });

    it('says nothing when the style is one it knows', () =>
    {
      // Arrange
      const warned = vi.spyOn(console, 'warn')
        .mockImplementation(() =>
        {
        });
      const dying = aDyingBattler([], '<deathMotion:moderate>');

      // Act
      BattlerMotionCoordinator.beginDeath(dying);

      // Assert
      expect(warned).not.toHaveBeenCalled();
    });
  });

  describe('sourceKeyForState', () =>
  {
    it('gives each state its own key, so similar ids cannot be confused', () =>
    {
      // Assert
      expect(BattlerMotionCoordinator.sourceKeyForState(4)).toBe('state:4');
      expect(BattlerMotionCoordinator.sourceKeyForState(41)).toBe('state:41');
    });
  });

  describe('declarationsFromNote', () =>
  {
    it('reads a motion written among other tags on other lines', () =>
    {
      // Arrange
      const state = { note: '<slipHp:-20>\n<motion:[flicker]>\n<stateDuration:300>' };

      // Act
      const declarations = BattlerMotionCoordinator.declarationsFromNote(state, 'state:4');

      // Assert
      expect(declarations).toHaveLength(1);
      expect(declarations.at(0)
        .type()).toBe('flicker');
    });

    it('stamps the declarations with the source it was given', () =>
    {
      // Arrange
      const state = { note: '<motion:[flicker]>' };

      // Act
      const declarations = BattlerMotionCoordinator.declarationsFromNote(state, 'state:9');

      // Assert
      expect(declarations.at(0)
        .sourceKey()).toBe('state:9');
    });

    it('finds nothing in a note that mentions no motions', () =>
    {
      // Arrange
      const state = { note: '<slipHp:-20>' };

      // Act
      const declarations = BattlerMotionCoordinator.declarationsFromNote(state, 'state:4');

      // Assert
      expect(declarations).toEqual([]);
    });
  });

  describe('characterFor', () =>
  {
    it('finds the sprite of a battler that is on the map', () =>
    {
      // Arrange
      const battler = aMapBattler();

      // Act
      const found = BattlerMotionCoordinator.characterFor(battler);

      // Assert
      expect(found).toBe(character);
    });

    it('reports nothing for a battler with no presence on the map', () =>
    {
      // Arrange
      const battler = anOffMapBattler();

      // Act
      const found = BattlerMotionCoordinator.characterFor(battler);

      // Assert
      expect(found).toBeNull();
    });
  });
});
//endregion plugins/motion/ext/abs/managers/battler-motion-coordinator.test.js