//region plugins/motion/ext/abs/_component/presence-hooks.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { installDeathMetadata, installMotionAbsGlobals } from '../fixtures/install-motion-abs-globals.js';

describe('J-Motion-ABS presence hooks (direct src import)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/motion/ext/abs/managers/PresenceMotionCoordinator.js').default} */
  let PresenceMotionCoordinator;

  /** @type {typeof import('../../../../../../src/plugins/motion/core/managers/CharacterMotionComposer.js').default} */
  let CharacterMotionComposer;

  /** @type {typeof import('../../../../../../src/plugins/motion/core/core/MotionChannels.js').default} */
  let MotionChannels;

  /**
   * What the stubbed J-ABS originals were asked, in order.
   * @type {Array<Array<any>>}
   */
  const originalCalls = [];

  /**
   * What the stubbed J-ABS original of `deferPageChange` answers.
   * @type {boolean}
   */
  let originalDefers = false;

  /**
   * What the stubbed J-ABS original of `addEnemyToMap` hands back.
   * @type {Object|undefined}
   */
  let originalSpawn;

  beforeAll(async () =>
  {
    installMotionAbsGlobals();

    globalThis.J.MOTION.EXT.ABS.Aliased = {
      Game_Battler: new Map(),
      Game_Event: new Map(),
      JABS_Engine: new Map(),
      Sprite_Character: new Map(),
    };

    // the J-ABS seams and the engine heartbeat this extension augments, in the shapes it finds them.
    globalThis.Game_Event = function()
    {
    };
    globalThis.Game_Event.prototype.deferPageChange = function(newPageIndex)
    {
      originalCalls.push([ 'deferPageChange', newPageIndex ]);

      return originalDefers;
    };
    globalThis.Game_Event.prototype.onPageChanged = function(previousPageIndex)
    {
      originalCalls.push([ 'onPageChanged', previousPageIndex ]);
    };
    globalThis.Game_Event.prototype.update = function()
    {
      originalCalls.push([ 'update' ]);
    };

    // the J-ABS engine methods a respawn and a spawn announce themselves through.
    globalThis.JABS_Engine = function()
    {
    };
    globalThis.JABS_Engine.prototype.processRespawnAnimation = function(freshEvent)
    {
      originalCalls.push([ 'processRespawnAnimation', freshEvent ]);
    };
    globalThis.JABS_Engine.prototype.addEnemyToMap = function(x, y, enemyCloneEventId)
    {
      originalCalls.push([ 'addEnemyToMap', x, y, enemyCloneEventId ]);

      return originalSpawn;
    };

    // literal import paths, so Stryker can map mutants in these files back to this test file.
    await import('../../../../../../src/plugins/motion/ext/abs/core/registerFoldMotionTypes.js');
    ({ default: PresenceMotionCoordinator } =
      await import('../../../../../../src/plugins/motion/ext/abs/managers/PresenceMotionCoordinator.js'));
    ({ default: CharacterMotionComposer } =
      await import('../../../../../../src/plugins/motion/core/managers/CharacterMotionComposer.js'));
    ({ default: MotionChannels } =
      await import('../../../../../../src/plugins/motion/core/core/MotionChannels.js'));
    await import('../../../../../../src/plugins/motion/ext/abs/objects/Game_Event.js');
    await import('../../../../../../src/plugins/motion/ext/abs/managers/JABS_Engine.js');
  });

  beforeEach(() =>
  {
    installDeathMetadata();
    originalCalls.length = 0;
    originalDefers = false;
    originalSpawn = undefined;
  });

  afterEach(() =>
  {
    vi.restoreAllMocks();
  });

  /**
   * Builds an event carrying a battler, on the real (augmented) prototype.
   * @param {boolean} hasBattler Whether a battler is standing on the event.
   * @returns {Object} The event.
   */
  const anEvent = (hasBattler = true) =>
  {
    const event = new globalThis.Game_Event();
    const battler = {
      waits: [],
      invincible: false,
      isDying: () => false,
      isDead: () => false,
      isInvincible()
      {
        return this.invincible;
      },
      setInvincible(invincible)
      {
        this.invincible = invincible;
      },
      setWaitCountdown(wait)
      {
        this.waits.push(wait);
      },
    };

    event.battler = hasBattler ? battler : null;
    event.refreshes = 0;
    event.animations = [];
    event.respawnAnimationId = () => 154;
    event.requestAnimation = animationId => event.animations.push(animationId);
    event.hasJabsBattler = () => event.battler !== null;
    event.getJabsBattler = () => event.battler;
    event.getJabsBattlerUuid = () => (event.battler === null ? '' : 'uuid-1');
    event.refresh = () =>
    {
      event.refreshes++;
      event.battler = null;
    };

    return event;
  };

  describe('Game_Event#deferPageChange', () =>
  {
    it('still asks J-ABS first, with the page that was asked for', () =>
    {
      // Arrange
      const event = anEvent(false);

      // Act
      event.deferPageChange(3);

      // Assert
      expect(originalCalls).toEqual([ [ 'deferPageChange', 3 ] ]);
    });

    it('holds a live battler\'s page back while it folds away', () =>
    {
      // Arrange
      const event = anEvent();

      // Act
      const deferred = event.deferPageChange(1);

      // Assert
      expect(deferred).toBe(true);
      expect(PresenceMotionCoordinator.isDeparting(event)).toBe(true);
    });

    it('lets the page change through when nobody is standing on the event', () =>
    {
      // Arrange
      const event = anEvent(false);

      // Act
      const deferred = event.deferPageChange(1);

      // Assert
      expect(deferred).toBe(false);
      expect(PresenceMotionCoordinator.isDeparting(event)).toBe(false);
    });

    it('defers to a hold something before it already placed, without starting a fold of its own', () =>
    {
      // Arrange- the battler is eligible, so only the earlier hold can explain no fold starting.
      originalDefers = true;
      const event = anEvent();

      // Act
      const deferred = event.deferPageChange(1);

      // Assert
      expect(deferred).toBe(true);
      expect(PresenceMotionCoordinator.isDeparting(event)).toBe(false);
      expect(event.battler.waits).toEqual([]);
    });
  });

  describe('Game_Event#onPageChanged', () =>
  {
    it('still performs J-ABS\'s own announcement', () =>
    {
      // Arrange
      const event = anEvent();

      // Act
      event.onPageChanged(-2);

      // Assert
      expect(originalCalls).toEqual([ [ 'onPageChanged', -2 ] ]);
    });

    it('unfolds a battler the new page brought onto the map', () =>
    {
      // Arrange
      const event = anEvent();

      // Act
      event.onPageChanged(-1);
      let composition = null;
      for (let frame = 0; frame < 15; frame++)
      {
        composition = CharacterMotionComposer.compose(event);
      }

      // Assert
      expect(event.battler.waits).toEqual([ 30 ]);
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(0.7071067811865476, 10);
    });
  });

  describe('Game_Event#update', () =>
  {
    it('still performs the engine\'s own update every frame', () =>
    {
      // Arrange
      const event = anEvent();

      // Act
      event.update();
      event.update();

      // Assert
      expect(originalCalls).toEqual([ [ 'update' ], [ 'update' ] ]);
    });

    it('lets a held page through once the fold has had its frames', () =>
    {
      // Arrange
      const event = anEvent();
      event.deferPageChange(1);

      // Act
      for (let frame = 0; frame < 30; frame++)
      {
        event.update();
      }

      // Assert
      expect(event.refreshes).toBe(1);
      expect(PresenceMotionCoordinator.isDeparting(event)).toBe(false);
    });
  });

  describe('JABS_Engine#processRespawnAnimation', () =>
  {
    it('still lets J-ABS play the respawn animation itself', () =>
    {
      // Arrange
      const engine = new globalThis.JABS_Engine();
      const freshEvent = anEvent();

      // Act
      engine.processRespawnAnimation(freshEvent);

      // Assert
      expect(originalCalls).toEqual([ [ 'processRespawnAnimation', freshEvent ] ]);
    });

    it('unfolds the returning battler beneath the animation, without adding a second one', () =>
    {
      // Arrange
      const engine = new globalThis.JABS_Engine();
      const freshEvent = anEvent();

      // Act
      engine.processRespawnAnimation(freshEvent);
      let composition = null;
      for (let frame = 0; frame < 15; frame++)
      {
        composition = CharacterMotionComposer.compose(freshEvent);
      }

      // Assert
      expect(freshEvent.battler.waits).toEqual([ 30 ]);
      expect(freshEvent.animations).toEqual([]);
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(0.7071067811865476, 10);
    });
  });

  describe('JABS_Engine#addEnemyToMap', () =>
  {
    it('hands back the spawned enemy after unfolding it into view', () =>
    {
      // Arrange
      const engine = new globalThis.JABS_Engine();
      const spawned = anEvent();
      originalSpawn = spawned;

      // Act
      const result = engine.addEnemyToMap(7, 9, 3);

      // Assert
      expect(result).toBe(spawned);
      expect(originalCalls).toEqual([ [ 'addEnemyToMap', 7, 9, 3 ] ]);
      expect(spawned.battler.waits).toEqual([ 30 ]);
      expect(CharacterMotionComposer.hasMotion(spawned)).toBe(true);
    });

    it('hands back nothing, and welcomes nobody, when the clone id named no event', () =>
    {
      // Arrange
      const engine = new globalThis.JABS_Engine();
      const welcome = vi.spyOn(PresenceMotionCoordinator, 'welcomeNewBattler');

      // Act
      const result = engine.addEnemyToMap(7, 9, 999);

      // Assert
      expect(result).toBeUndefined();
      expect(welcome).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/motion/ext/abs/_component/presence-hooks.test.js