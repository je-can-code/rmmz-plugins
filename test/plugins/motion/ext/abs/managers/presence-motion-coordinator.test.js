//region plugins/motion/ext/abs/managers/presence-motion-coordinator.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { installDeathMetadata, installMotionAbsGlobals } from '../fixtures/install-motion-abs-globals.js';

describe('PresenceMotionCoordinator', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/motion/ext/abs/managers/PresenceMotionCoordinator.js').default} */
  let PresenceMotionCoordinator;

  /** @type {typeof import('../../../../../../src/plugins/motion/core/managers/CharacterMotionComposer.js').default} */
  let CharacterMotionComposer;

  /** @type {typeof import('../../../../../../src/plugins/motion/core/core/MotionChannels.js').default} */
  let MotionChannels;

  beforeAll(async () =>
  {
    installMotionAbsGlobals();

    // literal import paths, so Stryker can map mutants in these files back to this test file.
    await import('../../../../../../src/plugins/motion/ext/abs/core/registerFoldMotionTypes.js');
    ({ default: PresenceMotionCoordinator } =
      await import('../../../../../../src/plugins/motion/ext/abs/managers/PresenceMotionCoordinator.js'));
    ({ default: CharacterMotionComposer } =
      await import('../../../../../../src/plugins/motion/core/managers/CharacterMotionComposer.js'));
    ({ default: MotionChannels } =
      await import('../../../../../../src/plugins/motion/core/core/MotionChannels.js'));
  });

  beforeEach(() =>
  {
    installDeathMetadata();
  });

  afterEach(() =>
  {
    vi.restoreAllMocks();
  });

  /**
   * Builds a JABS battler stand-in that records what was done to it.
   * @param {Object=} overrides Anything a particular test wants to differ.
   * @returns {Object} The battler.
   */
  const aBattler = (overrides = {}) =>
  {
    const battler = {
      invincible: overrides.invincible ?? false,
      waits: [],
      isDying: () => overrides.dying ?? false,
      isDead: () => overrides.dead ?? false,
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

    return battler;
  };

  /**
   * Builds an event stand-in carrying a battler, whose refresh does whatever a test asks of it.
   * @param {Object|null} battler The battler on the event, or null for none.
   * @returns {Object} The event.
   */
  const anEvent = (battler = aBattler()) =>
  {
    const event = {
      battler,
      uuid: battler === null ? '' : 'uuid-1',
      refreshes: 0,
      animationId: 154,
      animations: [],
      onRefresh: () => {},
      respawnAnimationId()
      {
        return this.animationId;
      },
      requestAnimation(animationId)
      {
        this.animations.push(animationId);
      },
      hasJabsBattler()
      {
        return this.battler !== null;
      },
      getJabsBattler()
      {
        return this.battler;
      },
      getJabsBattlerUuid()
      {
        return this.uuid;
      },
      refresh()
      {
        this.refreshes++;
        this.onRefresh();
      },
    };

    return event;
  };

  /**
   * Makes an event's next refresh take its battler off the map, the way an emptied page does.
   * @param {Object} event The event whose page is going away.
   */
  const pageGoesAway = event =>
  {
    event.onRefresh = () =>
    {
      event.battler = null;
      event.uuid = '';
    };
  };

  /**
   * Composes an event for a number of frames.
   * @param {Object} event The event being drawn.
   * @param {number} frames How many frames to run.
   * @returns {Object} The final composition.
   */
  const composeFor = (event, frames) =>
  {
    let composition = null;
    for (let index = 0; index < frames; index++)
    {
      composition = CharacterMotionComposer.compose(event);
    }

    return composition;
  };

  /**
   * Updates an event's departure for a number of frames.
   * @param {Object} event The event being updated.
   * @param {number} frames How many frames to run.
   */
  const updateFor = (event, frames) =>
  {
    for (let index = 0; index < frames; index++)
    {
      PresenceMotionCoordinator.updateDeparture(event);
    }
  };

  describe('holdPageChange', () =>
  {
    it('holds the page and starts a live battler folding away', () =>
    {
      // Arrange
      const event = anEvent();

      // Act
      const held = PresenceMotionCoordinator.holdPageChange(event);
      const composition = composeFor(event, 15);

      // Assert
      expect(held).toBe(true);
      expect(PresenceMotionCoordinator.isDeparting(event)).toBe(true);
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(0.7071067811865476, 10);
    });

    it('freezes the leaving battler for exactly as long as the fold takes', () =>
    {
      // Arrange
      installDeathMetadata({ departureDuration: 24 });
      const battler = aBattler();
      const event = anEvent(battler);

      // Act
      PresenceMotionCoordinator.holdPageChange(event);

      // Assert
      expect(battler.invincible).toBe(true);
      expect(battler.waits).toEqual([ 24 ]);
    });

    it('plays the battler\'s respawn animation as it starts to fold away', () =>
    {
      // Arrange
      const event = anEvent();
      event.animationId = 120;

      // Act
      PresenceMotionCoordinator.holdPageChange(event);

      // Assert
      expect(event.animations).toEqual([ 120 ]);
    });

    it('plays no animation on the way out for a battler that asks for none', () =>
    {
      // Arrange
      const event = anEvent();
      event.animationId = 0;

      // Act
      const held = PresenceMotionCoordinator.holdPageChange(event);

      // Assert- the fold itself still happens; only the flourish is skipped.
      expect(held).toBe(true);
      expect(event.animations).toEqual([]);
    });

    it('lets the page change straight through when there is no battler on the event', () =>
    {
      // Arrange
      const event = anEvent(null);

      // Act
      const held = PresenceMotionCoordinator.holdPageChange(event);

      // Assert
      expect(held).toBe(false);
      expect(PresenceMotionCoordinator.isDeparting(event)).toBe(false);
    });

    it('lets the page change straight through for a battler that cannot bow out', () =>
    {
      // Arrange
      const battler = aBattler({ dying: true });
      const event = anEvent(battler);

      // Act
      const held = PresenceMotionCoordinator.holdPageChange(event);

      // Assert
      expect(held).toBe(false);
      expect(PresenceMotionCoordinator.isDeparting(event)).toBe(false);
      expect(battler.invincible).toBe(false);
    });

    it('keeps holding a departure already underway, without starting it over', () =>
    {
      // Arrange- ten frames into a thirty frame fold, another refresh asks to change the page.
      const event = anEvent();
      PresenceMotionCoordinator.holdPageChange(event);
      updateFor(event, 10);

      // Act
      const held = PresenceMotionCoordinator.holdPageChange(event);
      updateFor(event, 19);
      const refreshesBeforeTheEnd = event.refreshes;
      updateFor(event, 1);

      // Assert- the original thirty frames still decide when it lets go.
      expect(held).toBe(true);
      expect(refreshesBeforeTheEnd).toBe(0);
      expect(event.refreshes).toBe(1);
    });

    it('lets its own page change through while it is releasing it', () =>
    {
      // Arrange- the refresh that ends a departure reaches back in here, exactly as J-ABS's would.
      const event = anEvent();
      const answers = [];
      event.onRefresh = () => answers.push(PresenceMotionCoordinator.holdPageChange(event));
      PresenceMotionCoordinator.holdPageChange(event);

      // Act
      updateFor(event, 30);

      // Assert
      expect(answers).toEqual([ false ]);
    });
  });

  describe('canDepart', () =>
  {
    it('allows a living, healthy battler to bow out', () =>
    {
      // Arrange
      const battler = aBattler();

      // Act
      const result = PresenceMotionCoordinator.canDepart(battler);

      // Assert
      expect(result).toBe(true);
    });

    it('refuses when departures are configured to take no time at all', () =>
    {
      // Arrange
      installDeathMetadata({ departureDuration: 0 });
      const battler = aBattler();

      // Act
      const result = PresenceMotionCoordinator.canDepart(battler);

      // Assert
      expect(result).toBe(false);
    });

    it('refuses a battler that is already dying', () =>
    {
      // Arrange
      const battler = aBattler({ dying: true });

      // Act
      const result = PresenceMotionCoordinator.canDepart(battler);

      // Assert
      expect(result).toBe(false);
    });

    it('refuses a battler with no life left that has not started dying yet', () =>
    {
      // Arrange
      const battler = aBattler({ dead: true });

      // Act
      const result = PresenceMotionCoordinator.canDepart(battler);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('updateDeparture', () =>
  {
    it('does nothing for an event that is not leaving', () =>
    {
      // Arrange
      const event = anEvent();

      // Act
      updateFor(event, 60);

      // Assert
      expect(event.refreshes).toBe(0);
      expect(PresenceMotionCoordinator.isDeparting(event)).toBe(false);
    });

    it('keeps holding the page until the fold has run its full length', () =>
    {
      // Arrange
      const event = anEvent();
      PresenceMotionCoordinator.holdPageChange(event);

      // Act
      updateFor(event, 29);

      // Assert
      expect(event.refreshes).toBe(0);
      expect(PresenceMotionCoordinator.isDeparting(event)).toBe(true);
    });

    it('lets the held page through on the frame the fold finishes', () =>
    {
      // Arrange
      const event = anEvent();
      pageGoesAway(event);
      PresenceMotionCoordinator.holdPageChange(event);

      // Act
      updateFor(event, 30);

      // Assert
      expect(event.refreshes).toBe(1);
      expect(PresenceMotionCoordinator.isDeparting(event)).toBe(false);
    });
  });

  describe('completeDeparture', () =>
  {
    it('withdraws the finished fold once the page it was holding has gone', () =>
    {
      // Arrange
      const event = anEvent();
      pageGoesAway(event);
      PresenceMotionCoordinator.holdPageChange(event);
      composeFor(event, 30);

      // Act
      updateFor(event, 30);
      composeFor(event, 1);

      // Assert
      expect(CharacterMotionComposer.hasMotion(event)).toBe(false);
    });

    it('leaves a replacement battler fully visible when arrivals are switched off', () =>
    {
      // Arrange- the next page carries another battler, which has no unfold to replace the fold.
      installDeathMetadata({ arrivalDuration: 0 });
      const event = anEvent();
      event.onRefresh = () =>
      {
        event.battler = aBattler();
        event.uuid = 'uuid-2';
        PresenceMotionCoordinator.welcomeArrival(event, 0);
      };
      PresenceMotionCoordinator.holdPageChange(event);
      composeFor(event, 30);

      // Act
      updateFor(event, 30);
      const composition = composeFor(event, 1);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBe(1);
      expect(composition.valueFor(MotionChannels.OPACITY)).toBe(1);
    });

    it('unfolds a replacement battler from edge-on rather than from the finished fold', () =>
    {
      // Arrange
      const replacement = aBattler();
      const event = anEvent();
      event.onRefresh = () =>
      {
        event.battler = replacement;
        event.uuid = 'uuid-2';
        PresenceMotionCoordinator.welcomeArrival(event, 0);
      };
      PresenceMotionCoordinator.holdPageChange(event);
      composeFor(event, 30);

      // Act
      updateFor(event, 30);
      const composition = composeFor(event, 15);

      // Assert
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(0.7071067811865476, 10);
      expect(replacement.waits).toEqual([ 30 ]);
    });

    it('turns a battler back around when the page it was leaving came back', () =>
    {
      // Arrange- nothing about the page changes by the time the fold ends, so the refresh keeps it.
      const battler = aBattler();
      const event = anEvent(battler);
      PresenceMotionCoordinator.holdPageChange(event);
      composeFor(event, 30);

      // Act
      updateFor(event, 30);
      const composition = composeFor(event, 15);

      // Assert- it went out with a flourish and comes back with another.
      expect(battler.invincible).toBe(false);
      expect(battler.waits).toEqual([ 30, 30 ]);
      expect(event.animations).toEqual([ 154, 154 ]);
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(0.7071067811865476, 10);
    });

    it('puts back an invincibility the battler had before it started to leave', () =>
    {
      // Arrange
      const battler = aBattler({ invincible: true });
      const event = anEvent(battler);
      PresenceMotionCoordinator.holdPageChange(event);

      // Act
      updateFor(event, 30);

      // Assert
      expect(battler.invincible).toBe(true);
      expect(battler.waits).toEqual([ 30, 30 ]);
    });
  });

  describe('welcomeArrival', () =>
  {
    it('unfolds a battler that a page change just brought onto the map', () =>
    {
      // Arrange
      const battler = aBattler();
      const event = anEvent(battler);

      // Act
      PresenceMotionCoordinator.welcomeArrival(event, -1);
      const composition = composeFor(event, 15);

      // Assert
      expect(battler.waits).toEqual([ 30 ]);
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(0.7071067811865476, 10);
      expect(composition.valueFor(MotionChannels.OPACITY)).toBe(0.75);
    });

    it('leaves a battler alone when its event is being built as the map loads', () =>
    {
      // Arrange
      const battler = aBattler();
      const event = anEvent(battler);

      // Act
      PresenceMotionCoordinator.welcomeArrival(event, -2);

      // Assert
      expect(battler.waits).toEqual([]);
      expect(CharacterMotionComposer.hasMotion(event)).toBe(false);
    });

    it('does nothing when the new page brought no battler with it', () =>
    {
      // Arrange
      const event = anEvent(null);

      // Act
      PresenceMotionCoordinator.welcomeArrival(event, 0);

      // Assert
      expect(CharacterMotionComposer.hasMotion(event)).toBe(false);
    });
  });

  describe('welcomeNewBattler', () =>
  {
    it('unfolds a battler created outright, without playing a second animation over its own', () =>
    {
      // Arrange
      const battler = aBattler();
      const event = anEvent(battler);

      // Act
      PresenceMotionCoordinator.welcomeNewBattler(event);
      const composition = composeFor(event, 15);

      // Assert
      expect(battler.waits).toEqual([ 30 ]);
      expect(composition.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(0.7071067811865476, 10);
      expect(event.animations).toEqual([]);
    });

    it('leaves a new event alone when its page declared no battler', () =>
    {
      // Arrange
      const event = anEvent(null);

      // Act
      PresenceMotionCoordinator.welcomeNewBattler(event);

      // Assert
      expect(CharacterMotionComposer.hasMotion(event)).toBe(false);
    });

    it('plays nothing when arrivals are configured to take no time at all', () =>
    {
      // Arrange
      installDeathMetadata({ arrivalDuration: 0 });
      const battler = aBattler();
      const event = anEvent(battler);

      // Act
      PresenceMotionCoordinator.welcomeNewBattler(event);

      // Assert
      expect(battler.waits).toEqual([]);
      expect(CharacterMotionComposer.hasMotion(event)).toBe(false);
    });
  });

  describe('beginArrival', () =>
  {
    it('withdraws itself once it has played, leaving the sprite at rest', () =>
    {
      // Arrange
      installDeathMetadata({ arrivalDuration: 20 });
      const event = anEvent();

      // Act
      PresenceMotionCoordinator.beginArrival(event);
      const midway = composeFor(event, 10);
      composeFor(event, 10);

      // Assert
      expect(midway.valueFor(MotionChannels.SCALE_X)).toBeCloseTo(0.7071067811865476, 10);
      expect(CharacterMotionComposer.hasMotion(event)).toBe(false);
    });

    it('plays the battler\'s respawn animation as it starts to unfold', () =>
    {
      // Arrange
      const event = anEvent();
      event.animationId = 120;

      // Act
      PresenceMotionCoordinator.beginArrival(event);

      // Assert
      expect(event.animations).toEqual([ 120 ]);
    });

    it('plays nothing when arrivals are configured to take no time at all', () =>
    {
      // Arrange
      installDeathMetadata({ arrivalDuration: 0 });
      const battler = aBattler();
      const event = anEvent(battler);

      // Act
      PresenceMotionCoordinator.beginArrival(event);

      // Assert
      expect(battler.waits).toEqual([]);
      expect(event.animations).toEqual([]);
      expect(CharacterMotionComposer.hasMotion(event)).toBe(false);
    });
  });
});
//endregion plugins/motion/ext/abs/managers/presence-motion-coordinator.test.js