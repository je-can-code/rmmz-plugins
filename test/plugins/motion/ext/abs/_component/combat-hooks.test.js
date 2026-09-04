//region plugins/motion/ext/abs/_component/combat-hooks.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearMapBattlers,
  installDeathMetadata,
  installMotionAbsGlobals,
  registerMapBattler,
} from '../fixtures/install-motion-abs-globals.js';

describe('J-Motion-ABS combat hooks (direct src import)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/motion/core/managers/CharacterMotionComposer.js').default} */
  let CharacterMotionComposer;

  /** @type {typeof import('../../../../../../src/plugins/motion/core/core/MotionChannels.js').default} */
  let MotionChannels;

  /** @type {string[]} */
  const engineCalls = [];

  beforeAll(async () =>
  {
    installMotionAbsGlobals();

    globalThis.J.MOTION.EXT.ABS.Aliased = {
      Game_Battler: new Map(),
      JABS_Engine: new Map(),
      Sprite_Character: new Map(),
    };

    // the engine surfaces this extension augments, in the shapes it actually augments them in.
    globalThis.Game_Battler = function()
    {
    };
    globalThis.Game_Battler.prototype.addState = function(stateId)
    {
      this.appliedStates.push(stateId);
    };
    globalThis.Game_Battler.prototype.removeState = function(stateId)
    {
      this.appliedStates = this.appliedStates.filter(candidate => candidate !== stateId);
    };

    globalThis.JABS_Engine = function()
    {
    };
    globalThis.JABS_Engine.prototype.handleDefeatedEnemy = function()
    {
      engineCalls.push('original');
    };
    globalThis.JABS_Engine.prototype.postPartyCycling = function()
    {
      engineCalls.push('original-post-party-cycling');
    };

    globalThis.Sprite_Character = function()
    {
    };
    globalThis.Sprite_Character.prototype.handleLootDuration = function()
    {
      engineCalls.push('original-handle-loot-duration');
    };

    // literal import paths, so Stryker can map mutants in these files back to this test file.
    await import('../../../../../../src/plugins/motion/ext/abs/core/registerCollapseMotionType.js');
    ({ default: CharacterMotionComposer } =
      await import('../../../../../../src/plugins/motion/core/managers/CharacterMotionComposer.js'));
    ({ default: MotionChannels } =
      await import('../../../../../../src/plugins/motion/core/core/MotionChannels.js'));
    await import('../../../../../../src/plugins/motion/ext/abs/objects/Game_Battler.js');
    await import('../../../../../../src/plugins/motion/ext/abs/managers/JABS_Engine.js');
    await import('../../../../../../src/plugins/motion/ext/abs/sprites/Sprite_Character.js');
  });

  /** @type {Object} */
  let character;

  beforeEach(() =>
  {
    installDeathMetadata();
    engineCalls.length = 0;
    character = { name: 'an-enemy-sprite' };
  });

  afterEach(() =>
  {
    CharacterMotionComposer.forget(character);
    clearMapBattlers();
    vi.restoreAllMocks();
  });

  /**
   * Builds a battler present on the map, carrying the given states.
   * @param {Object[]} states The states it carries.
   * @param {string} enemyNote Its own note.
   * @returns {Object} The battler.
   */
  const aMapBattler = (states = [], enemyNote = '') =>
  {
    const battler = new globalThis.Game_Battler();
    battler.appliedStates = [];
    battler.getUuid = () => 'uuid-1';
    battler.state = stateId => states.find(candidate => candidate.id === stateId);
    battler.states = () => states;
    battler.isStateAffected = stateId => states.some(candidate => candidate.id === stateId);
    battler.databaseData = () => ({ note: enemyNote });

    registerMapBattler('uuid-1', {
      getCharacter: () => character,
      getBattler: () => battler,
    });

    return battler;
  };

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

  describe('Game_Battler#addState', () =>
  {
    it('still performs the engine\'s own state application', () =>
    {
      // Arrange
      const bleeding = { id: 4, note: '<motion:[sway, 8, 100, sync]>' };
      const battler = aMapBattler([ bleeding ]);

      // Act
      battler.addState(4);

      // Assert
      expect(battler.appliedStates).toEqual([ 4 ]);
    });

    it('starts the motion the state asks for', () =>
    {
      // Arrange
      const bleeding = { id: 4, note: '<motion:[sway, 8, 100, sync]>' };
      const battler = aMapBattler([ bleeding ]);

      // Act
      battler.addState(4);
      const composition = composeFor(25);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBeCloseTo(8, 10);
    });

    it('leaves a state with no motion entirely alone', () =>
    {
      // Arrange
      const poison = { id: 6, note: '<slipHp:-20>' };
      const battler = aMapBattler([ poison ]);

      // Act
      battler.addState(6);

      // Assert
      expect(battler.appliedStates).toEqual([ 6 ]);
      expect(CharacterMotionComposer.hasMotion(character)).toBe(false);
    });
  });

  describe('Game_Battler#removeState', () =>
  {
    it('still performs the engine\'s own state removal', () =>
    {
      // Arrange
      const bleeding = { id: 4, note: '<motion:[sway, 8, 100, sync]>' };
      const battler = aMapBattler([ bleeding ]);
      battler.addState(4);

      // Act
      battler.removeState(4);

      // Assert
      expect(battler.appliedStates).toEqual([]);
    });

    it('stops the motion that state had started', () =>
    {
      // Arrange
      const bleeding = { id: 4, note: '<motion:[sway, 8, 100, sync]>' };
      const battler = aMapBattler([ bleeding ]);
      battler.addState(4);
      composeFor(25);

      // Act
      battler.removeState(4);
      const composition = composeFor(1);

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBe(0);
    });
  });

  describe('JABS_Engine#handleDefeatedEnemy', () =>
  {
    /**
     * Builds the defeated-target wrapper the engine hands to its defeat handler.
     * @param {Object[]} states The states the battler carries.
     * @param {string} enemyNote Its own note.
     * @returns {Object}
     */
    const aDefeatedTarget = (states = [], enemyNote = '') =>
    {
      const battler = aMapBattler(states, enemyNote);

      return {
        getCharacter: () => character,
        getBattler: () => battler,
        waitFrames: 0,
        setWaitCountdown(frames)
        {
          this.waitFrames = frames;
        },
      };
    };

    it('still performs the engine\'s own defeat handling', () =>
    {
      // Arrange
      const engine = new globalThis.JABS_Engine();
      const defeated = aDefeatedTarget();

      // Act
      engine.handleDefeatedEnemy(defeated, null);

      // Assert
      expect(engineCalls).toEqual([ 'original' ]);
    });

    it('holds the corpse on the map for exactly as long as the collapse needs', () =>
    {
      // Arrange
      const engine = new globalThis.JABS_Engine();
      const defeated = aDefeatedTarget([], '<deathMotion:moderate>');

      // Act
      engine.handleDefeatedEnemy(defeated, null);

      // Assert
      expect(defeated.waitFrames).toBe(60);
    });

    it('starts the collapse itself', () =>
    {
      // Arrange
      const engine = new globalThis.JABS_Engine();
      const defeated = aDefeatedTarget();

      // Act
      engine.handleDefeatedEnemy(defeated, null);
      const composition = composeFor(30);

      // Assert
      expect(composition.valueFor(MotionChannels.OPACITY)).toBe(0);
    });

    it('holds nothing open for a battler that opted out', () =>
    {
      // Arrange- spying rather than reading the resulting frame count, because a wait of zero frames
      // and never having been asked to wait leave the battler in exactly the same state. The point
      // of opting out is that its timer is not touched at all.
      const engine = new globalThis.JABS_Engine();
      const defeated = aDefeatedTarget([], '<noDeathMotion>');
      const waiting = vi.spyOn(defeated, 'setWaitCountdown');

      // Act
      engine.handleDefeatedEnemy(defeated, null);

      // Assert
      expect(waiting).not.toHaveBeenCalled();
      expect(CharacterMotionComposer.hasMotion(character)).toBe(false);
    });

    it('does ask a battler that did not opt out to wait', () =>
    {
      // Arrange
      const engine = new globalThis.JABS_Engine();
      const defeated = aDefeatedTarget();
      const waiting = vi.spyOn(defeated, 'setWaitCountdown');

      // Act
      engine.handleDefeatedEnemy(defeated, null);

      // Assert
      expect(waiting).toHaveBeenCalledWith(30);
    });

    it('still runs the engine\'s defeat handling for a battler that opted out', () =>
    {
      // Arrange
      const engine = new globalThis.JABS_Engine();
      const defeated = aDefeatedTarget([], '<noDeathMotion>');

      // Act
      engine.handleDefeatedEnemy(defeated, null);

      // Assert
      expect(engineCalls).toEqual([ 'original' ]);
    });
  });

  describe('JABS_Engine#postPartyCycling', () =>
  {
    afterEach(() =>
    {
      delete globalThis.$gameParty;
    });

    it('still performs the engine\'s own party cycling', () =>
    {
      // Arrange
      const engine = new globalThis.JABS_Engine();
      globalThis.$gameParty = { leader: () => aMapBattler([]) };

      // Act
      engine.postPartyCycling();

      // Assert
      expect(engineCalls).toEqual([ 'original-post-party-cycling' ]);
    });

    it('hands the shared character over to whoever is leading now', () =>
    {
      // Arrange- `$gamePlayer` is one character standing in for whichever actor leads, so a cycle
      // gives it to somebody else without a single state having been added or removed. Left alone,
      // the outgoing leader's motions keep playing on the incoming one.
      const engine = new globalThis.JABS_Engine();
      const bleeding = { id: 4, note: '<motion:[sway, 8, 100, sync]>' };
      const outgoing = aMapBattler([ bleeding ]);
      outgoing.addState(4);
      const incoming = aMapBattler([]);
      globalThis.$gameParty = { leader: () => incoming };

      // Act
      engine.postPartyCycling();
      composeFor(1);

      // Assert
      expect(CharacterMotionComposer.hasMotion(character)).toBe(false);
    });
  });

  describe('handleLootDuration', () =>
  {
    /**
     * Builds a loot sprite stand-in wired to the shared character.
     * @param {number} duration How many frames of life the drop has left.
     * @returns {Object} The Sprite_Character stand-in.
     */
    const aLootSprite = duration =>
    {
      character.getJabsLoot = () => ({
        isWaiting: () => true,
        canExpire: () => true,
        duration: () => duration,
      });

      const sprite = new globalThis.Sprite_Character();
      sprite.character = () => character;

      return sprite;
    };

    it('still performs J-ABS\'s own duration handling', () =>
    {
      // Arrange- the countdown and the removal it triggers are J-ABS's business and stay that way;
      // this extension only adds something to look at on the way there.
      const sprite = aLootSprite(900);

      // Act
      sprite.handleLootDuration();

      // Assert
      expect(engineCalls).toEqual([ 'original-handle-loot-duration' ]);
    });

    it('starts a drop fading once it is close to timing out', () =>
    {
      // Arrange- 40 frames left, well inside the fixture's 300 frame warning window.
      const sprite = aLootSprite(40);

      // Act
      sprite.handleLootDuration();

      // Assert
      expect(CharacterMotionComposer.hasMotion(character)).toBe(true);
    });

    it('leaves a drop with time in hand alone', () =>
    {
      // Arrange- the same sprite in every respect but its remaining life.
      const sprite = aLootSprite(900);

      // Act
      sprite.handleLootDuration();

      // Assert
      expect(CharacterMotionComposer.hasMotion(character)).toBe(false);
    });
  });
});
//endregion plugins/motion/ext/abs/_component/combat-hooks.test.js