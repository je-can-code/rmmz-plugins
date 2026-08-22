//region plugins/abs/ext/diag/objects/game-event.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Diagonal Game_Event (unit, all downstream dependencies mocked)', () =>
{
  /** @type {import('vitest').Mock} the "original" (aliased) prototype methods this file wraps- kept as
   *  stable variables and mutated in place via mockImplementation/mockReturnValue, never reassigned,
   *  since J.ABS.EXT.DIAG.Aliased.Game_Event captures a fixed reference to whichever function object
   *  sat on the prototype at import time. */
  let originalInitMembers;
  let originalMoveStraight;
  let originalMoveDiagonally;
  let originalTurn180;
  let originalTurnRight90;
  let originalTurnLeft90;
  let originalTurnRandom;

  beforeAll(async () =>
  {
    vi.resetModules();

    // minimal J.ABS.EXT.DIAG namespace- only the shape this one file reads/writes.
    globalThis.J = {
      ABS: {
        EXT: {
          DIAG: {
            Aliased: { Game_Event: new Map() },
          },
        },
      },
    };

    // $jabsEngine is a bare RMMZ-style singleton global; only normalizeActionDirection reaches for it.
    globalThis.$jabsEngine = { actionTravelDirectionToSpritePatternDirection: vi.fn() };

    // Math.randomInt is a vanilla RMMZ Math augmentation (not part of this file); stub it directly.
    globalThis.Math.randomInt = vi.fn();

    // Game_Event.prototype.<method> is aliased ("original") before this file overwrites each; stub
    // each with a canned return value rather than pulling in the real Game_Event/Game_Character chain.
    function Game_Event()
    {
    }

    originalInitMembers = vi.fn();
    originalMoveStraight = vi.fn();
    originalMoveDiagonally = vi.fn();
    originalTurn180 = vi.fn();
    originalTurnRight90 = vi.fn();
    originalTurnLeft90 = vi.fn();
    originalTurnRandom = vi.fn();
    Game_Event.prototype.initMembers = originalInitMembers;
    Game_Event.prototype.moveStraight = originalMoveStraight;
    Game_Event.prototype.moveDiagonally = originalMoveDiagonally;
    Game_Event.prototype.turn180 = originalTurn180;
    Game_Event.prototype.turnRight90 = originalTurnRight90;
    Game_Event.prototype.turnLeft90 = originalTurnLeft90;
    Game_Event.prototype.turnRandom = originalTurnRandom;
    globalThis.Game_Event = Game_Event;

    // the file under test- patches globalThis.Game_Event.prototype directly, no vm involved.
    await import('../../../../../../src/plugins/abs/ext/diag/objects/Game_Event.js');
  });

  beforeEach(() =>
  {
    // reset the SAME mock instances the Aliased map already holds a reference to.
    originalInitMembers.mockReset();
    originalMoveStraight.mockReset();
    originalMoveDiagonally.mockReset();
    originalTurn180.mockReset();
    originalTurnRight90.mockReset();
    originalTurnLeft90.mockReset();
    originalTurnRandom.mockReset();
    globalThis.$jabsEngine.actionTravelDirectionToSpritePatternDirection.mockReset();
    globalThis.Math.randomInt.mockReset();
  });

  /**
   * Builds a duck-typed Game_Event carrying the real patched prototype (moveStraight,
   * moveDiagonally, turn180, turnRight90, turnLeft90, turnRandom, and the brand-new diag methods),
   * plus per-test overrides for the collaborator methods this file leans on from elsewhere in the
   * abs/core chain (isJabsAction, direction, isDiagonalDirection, etc).
   * @param {object} [overrides]
   * @returns {object}
   */
  function buildEvent(overrides = {})
  {
    const event = Object.create(globalThis.Game_Event.prototype);
    event.initMembers();

    // vanilla-RMMZ-shaped collaborators with sane no-op defaults; overridden per test as needed.
    event.isJabsAction = () => false;
    event.isJabsBattler = () => false;
    event.isDirectionFixed = () => false;
    event.isDiagonalDirection = (dir) => [ 1, 3, 7, 9 ].includes(dir);
    event.isStraightDirection = (dir) => [ 2, 4, 6, 8 ].includes(dir);
    event.getDiagonalDirections = (dir) =>
    {
      const map = { 1: [ 4, 2 ], 3: [ 6, 2 ], 7: [ 4, 8 ], 9: [ 6, 8 ] };
      return map[dir];
    };
    event.reverseDir = (dir) => 10 - dir;
    event._direction = 2;
    event.direction = () => event._direction;
    event.setDirection = (dir) => { event._direction = dir; };
    event.findDiagonalDirectionTo = vi.fn(() => 2);
    event.getValidDirections = vi.fn(() => [ 2, 4, 6, 8 ]);

    return Object.assign(event, overrides);
  }

  describe('initMembers / initDiagMembers', () =>
  {
    it('calls the original initMembers then initializes the diag namespace', () =>
    {
      // Arrange
      const event = Object.create(globalThis.Game_Event.prototype);

      // Act
      event.initMembers();

      // Assert
      expect(originalInitMembers).toHaveBeenCalledTimes(1);
      expect(event._j._abs._diag._initialDirection).toBe(0);
    });
  });

  describe('setCustomDirection / getCustomDirection', () =>
  {
    it('sets the custom direction when direction is not fixed', () =>
    {
      // Arrange
      const event = buildEvent({ isDirectionFixed: () => false });

      // Act
      event.setCustomDirection(6);

      // Assert
      expect(event.getCustomDirection()).toBe(6);
    });

    it('does not set the custom direction when direction is fixed', () =>
    {
      // Arrange
      const event = buildEvent({ isDirectionFixed: () => true });

      // Act
      event.setCustomDirection(6);

      // Assert
      expect(event.getCustomDirection()).toBe(0);
    });
  });

  describe('moveStraight', () =>
  {
    it('defers to the original logic when this is not a jabs action', () =>
    {
      // Arrange- a diagonal custom direction is deliberately present; only the action check should
      // keep this event out of the diagonal movement path, since battler events can carry one too.
      originalMoveStraight.mockReturnValue('original-result');
      const event = buildEvent({ isJabsAction: () => false });
      event.moveDiagonally = vi.fn();
      event.setCustomDirection(9);

      // Act
      const result = event.moveStraight(6);

      // Assert
      expect(originalMoveStraight).toHaveBeenCalledWith(6);
      expect(event.moveDiagonally).not.toHaveBeenCalled();
      expect(result).toBe('original-result');
    });

    it('defers to the original logic when the custom direction is not diagonal', () =>
    {
      // Arrange
      originalMoveStraight.mockReturnValue('original-result');
      const event = buildEvent({ isJabsAction: () => true });
      event.setCustomDirection(2);

      // Act
      const result = event.moveStraight(2);

      // Assert
      expect(originalMoveStraight).toHaveBeenCalledWith(2);
      expect(result).toBe('original-result');
    });

    it('moves diagonally and returns the custom direction when it is a diagonal jabs action', () =>
    {
      // Arrange
      const event = buildEvent({ isJabsAction: () => true });
      event.moveDiagonally = vi.fn();
      event.setCustomDirection(9);

      // Act
      const result = event.moveStraight(6);

      // Assert
      expect(event.moveDiagonally).toHaveBeenCalledWith(6, 8);
      expect(originalMoveStraight).not.toHaveBeenCalled();
      expect(result).toBe(9);
    });
  });

  describe('moveDiagonally', () =>
  {
    it('performs the original logic and stops when this is not a jabs action', () =>
    {
      // Arrange
      const event = buildEvent({ isJabsAction: () => false, _direction: 9 });
      event.setDirection = vi.fn();

      // Act
      event.moveDiagonally(6, 8);

      // Assert
      expect(originalMoveDiagonally).toHaveBeenCalledWith(6, 8);
      expect(event.setDirection).not.toHaveBeenCalled();
    });

    it('performs the original logic and stops when the resulting direction is not diagonal', () =>
    {
      // Arrange
      const event = buildEvent({ isJabsAction: () => true, _direction: 2 });
      event.setDirection = vi.fn();

      // Act
      event.moveDiagonally(6, 8);

      // Assert
      expect(originalMoveDiagonally).toHaveBeenCalledWith(6, 8);
      expect(event.setDirection).not.toHaveBeenCalled();
    });

    it('normalizes and sets the facing direction when this is a diagonal jabs action', () =>
    {
      // Arrange
      const event = buildEvent({ isJabsAction: () => true, _direction: 9 });
      event.normalizeActionDirection = vi.fn(() => 8);
      event.setDirection = vi.fn();

      // Act
      event.moveDiagonally(6, 8);

      // Assert
      expect(originalMoveDiagonally).toHaveBeenCalledWith(6, 8);
      expect(event.normalizeActionDirection).toHaveBeenCalledTimes(1);
      expect(event.setDirection).toHaveBeenCalledWith(8);
    });
  });

  describe('normalizeActionDirection', () =>
  {
    it('returns the current direction unmodified when this is not a jabs action', () =>
    {
      // Arrange
      const event = buildEvent({ isJabsAction: () => false, _direction: 8 });

      // Act
      const result = event.normalizeActionDirection();

      // Assert
      expect(result).toBe(8);
      expect(globalThis.$jabsEngine.actionTravelDirectionToSpritePatternDirection).not.toHaveBeenCalled();
    });

    it('delegates to $jabsEngine when this is a jabs action', () =>
    {
      // Arrange
      globalThis.$jabsEngine.actionTravelDirectionToSpritePatternDirection.mockReturnValue(4);
      const event = buildEvent({ isJabsAction: () => true, _direction: 9 });
      event.getCastedDirection = () => 6;

      // Act
      const result = event.normalizeActionDirection();

      // Assert
      expect(globalThis.$jabsEngine.actionTravelDirectionToSpritePatternDirection).toHaveBeenCalledWith(9, 6);
      expect(result).toBe(4);
    });
  });

  describe('turn180', () =>
  {
    it('calls the original turn180 then reverses the custom direction', () =>
    {
      // Arrange
      const event = buildEvent();
      event.setCustomDirection(2);

      // Act
      event.turn180();

      // Assert
      expect(originalTurn180).toHaveBeenCalledTimes(1);
      expect(event.getCustomDirection()).toBe(8);
    });
  });

  describe('turnRight90', () =>
  {
    it('does not rotate the custom direction when there is none set', () =>
    {
      // Arrange
      const event = buildEvent();

      // Act
      event.turnRight90();

      // Assert
      expect(originalTurnRight90).toHaveBeenCalledTimes(1);
      expect(event.getCustomDirection()).toBe(0);
    });

    it.each([
      [ 1, 7 ],
      [ 3, 1 ],
      [ 7, 9 ],
      [ 9, 3 ],
    ])('rotates custom direction %i to %i', (initial, expected) =>
    {
      // Arrange
      const event = buildEvent();
      event.setCustomDirection(initial);

      // Act
      event.turnRight90();

      // Assert
      expect(event.getCustomDirection()).toBe(expected);
    });
  });

  describe('turnLeft90', () =>
  {
    it('does not rotate when there is no custom direction set', () =>
    {
      // Arrange- the main direction is one the rotation switch below does handle (3 becomes 9), so
      // the absence of a custom direction is the only thing that can leave it untouched.
      const event = buildEvent({ _direction: 3 });

      // Act
      event.turnLeft90();

      // Assert
      expect(originalTurnLeft90).toHaveBeenCalledTimes(1);
      expect(event._direction).toBe(3);
    });

    it.each([
      [ 1, 3 ],
      [ 3, 9 ],
      [ 7, 1 ],
      [ 9, 7 ],
    ])('rotates the main direction %i to %i once a custom direction is set', (initial, expected) =>
    {
      // Arrange- note: turnLeft90 gates on getCustomDirection() but switches/sets on the MAIN
      // direction, unlike turnRight90 which reads and writes the custom direction- this asserts the
      // as-written behavior, not a claim that it's the intended design (flagged separately).
      const event = buildEvent();
      event.setCustomDirection(1);
      event._direction = initial;

      // Act
      event.turnLeft90();

      // Assert
      expect(event._direction).toBe(expected);
    });
  });

  describe('turnRight45', () =>
  {
    it.each([
      [ 1, 4, 4 ],
      [ 2, 1, null ],
      [ 3, 2, 2 ],
      [ 4, 7, null ],
      [ 6, 3, null ],
      [ 7, 8, 8 ],
      [ 8, 9, null ],
      [ 9, 6, 6 ],
    ])('rotates custom direction %i to %i, setting main direction to %s', (initial, expectedCustom, expectedMain) =>
    {
      // Arrange
      const event = buildEvent();
      event.setCustomDirection(initial);
      const previousMain = event._direction;

      // Act
      event.turnRight45();

      // Assert
      expect(event.getCustomDirection()).toBe(expectedCustom);
      expect(event._direction).toBe(expectedMain ?? previousMain);
    });
  });

  describe('turnLeft45', () =>
  {
    it.each([
      [ 1, 2, 2 ],
      [ 2, 3, null ],
      [ 3, 6, 6 ],
      [ 4, 1, null ],
      [ 6, 9, null ],
      [ 7, 4, 4 ],
      [ 8, 7, null ],
      [ 9, 8, 8 ],
    ])('rotates custom direction %i to %i, setting main direction to %s', (initial, expectedCustom, expectedMain) =>
    {
      // Arrange
      const event = buildEvent();
      event.setCustomDirection(initial);
      const previousMain = event._direction;

      // Act
      event.turnLeft45();

      // Assert
      expect(event.getCustomDirection()).toBe(expectedCustom);
      expect(event._direction).toBe(expectedMain ?? previousMain);
    });
  });

  describe('turnRightOrLeft45', () =>
  {
    it('turns left when the random roll is truthy', () =>
    {
      // Arrange
      globalThis.Math.randomInt.mockReturnValue(1);
      const event = buildEvent();
      event.turnLeft45 = vi.fn();
      event.turnRight45 = vi.fn();

      // Act
      event.turnRightOrLeft45();

      // Assert
      expect(event.turnLeft45).toHaveBeenCalledTimes(1);
      expect(event.turnRight45).not.toHaveBeenCalled();
    });

    it('turns right when the random roll is falsy', () =>
    {
      // Arrange
      globalThis.Math.randomInt.mockReturnValue(0);
      const event = buildEvent();
      event.turnLeft45 = vi.fn();
      event.turnRight45 = vi.fn();

      // Act
      event.turnRightOrLeft45();

      // Assert
      expect(event.turnRight45).toHaveBeenCalledTimes(1);
      expect(event.turnLeft45).not.toHaveBeenCalled();
    });
  });

  describe('turnRandom', () =>
  {
    it('sets a custom direction excluding the currently-faced direction', () =>
    {
      // Arrange- the currently-faced direction leads the valid list, so dropping it is what shifts
      // the first pick along to the next direction rather than landing back on the same facing.
      const event = buildEvent({ _direction: 2 });
      event.getValidDirections = () => [ 2, 4, 6, 8 ];
      globalThis.Math.randomInt.mockReturnValue(0);

      // Act
      event.turnRandom();

      // Assert
      expect(originalTurnRandom).toHaveBeenCalledTimes(1);
      expect(event.getCustomDirection()).toBe(4);
    });
  });

  describe('homing movement', () =>
  {
    describe('homeIntoTarget', () =>
    {
      it('homes into the caster action target when this is a jabs action', () =>
      {
        // Arrange
        const target = { id: 'target' };
        const event = buildEvent({ isJabsAction: () => true });
        event.getJabsAction = () => ({ getCaster: () => ({ getTarget: () => target }) });
        event.homeIntoTargetBattler = vi.fn();

        // Act
        event.homeIntoTarget();

        // Assert
        expect(event.homeIntoTargetBattler).toHaveBeenCalledWith(target);
      });

      it('homes into the jabs battler target when this is a jabs battler', () =>
      {
        // Arrange
        const target = { id: 'target' };
        const event = buildEvent({ isJabsAction: () => false, isJabsBattler: () => true });
        event.getJabsBattler = () => ({ getTarget: () => target });
        event.homeIntoTargetBattler = vi.fn();

        // Act
        event.homeIntoTarget();

        // Assert
        expect(event.homeIntoTargetBattler).toHaveBeenCalledWith(target);
      });

      it('moves straight when this is neither a jabs action nor a jabs battler', () =>
      {
        // Arrange
        const event = buildEvent({ isJabsAction: () => false, isJabsBattler: () => false, _direction: 8 });
        event.moveStraight = vi.fn();

        // Act
        event.homeIntoTarget();

        // Assert
        expect(event.moveStraight).toHaveBeenCalledWith(8);
      });
    });

    describe('homeIntoLastHit', () =>
    {
      it('homes into the caster last-hit battler when this is a jabs action', () =>
      {
        // Arrange
        const lastHit = { id: 'last-hit' };
        const event = buildEvent({ isJabsAction: () => true });
        event.getJabsAction = () => ({ getCaster: () => ({ getBattlerLastHit: () => lastHit }) });
        event.homeIntoLastHitBattler = vi.fn();

        // Act
        event.homeIntoLastHit();

        // Assert
        expect(event.homeIntoLastHitBattler).toHaveBeenCalledWith(lastHit);
      });

      it('homes into the jabs battler last-hit battler when this is a jabs battler', () =>
      {
        // Arrange
        const lastHit = { id: 'last-hit' };
        const event = buildEvent({ isJabsAction: () => false, isJabsBattler: () => true });
        event.getJabsBattler = () => ({ getBattlerLastHit: () => lastHit });
        event.homeIntoLastHitBattler = vi.fn();

        // Act
        event.homeIntoLastHit();

        // Assert
        expect(event.homeIntoLastHitBattler).toHaveBeenCalledWith(lastHit);
      });

      it('moves straight when this is neither a jabs action nor a jabs battler', () =>
      {
        // Arrange
        const event = buildEvent({ isJabsAction: () => false, isJabsBattler: () => false, _direction: 4 });
        event.moveStraight = vi.fn();

        // Act
        event.homeIntoLastHit();

        // Assert
        expect(event.moveStraight).toHaveBeenCalledWith(4);
      });
    });

    describe('homeIntoTargetBattler', () =>
    {
      it('moves straight when there is no target', () =>
      {
        // Arrange
        const event = buildEvent({ _direction: 6 });
        event.moveStraight = vi.fn();
        event.homeIntoBattler = vi.fn();

        // Act
        event.homeIntoTargetBattler(null);

        // Assert
        expect(event.moveStraight).toHaveBeenCalledWith(6);
        expect(event.homeIntoBattler).not.toHaveBeenCalled();
      });

      it('homes into the battler when a target is provided', () =>
      {
        // Arrange
        const target = { id: 'target' };
        const event = buildEvent();
        event.homeIntoBattler = vi.fn();

        // Act
        event.homeIntoTargetBattler(target);

        // Assert
        expect(event.homeIntoBattler).toHaveBeenCalledWith(target);
      });
    });

    describe('homeIntoLastHitBattler', () =>
    {
      it('seeks the target when there is no last-hit battler', () =>
      {
        // Arrange
        const event = buildEvent();
        event.homeIntoTarget = vi.fn();
        event.homeIntoBattler = vi.fn();

        // Act
        event.homeIntoLastHitBattler(null);

        // Assert
        expect(event.homeIntoTarget).toHaveBeenCalledTimes(1);
        expect(event.homeIntoBattler).not.toHaveBeenCalled();
      });

      it('homes into the battler when a last-hit battler is provided', () =>
      {
        // Arrange
        const lastHit = { id: 'last-hit' };
        const event = buildEvent();
        event.homeIntoBattler = vi.fn();

        // Act
        event.homeIntoLastHitBattler(lastHit);

        // Assert
        expect(event.homeIntoBattler).toHaveBeenCalledWith(lastHit);
      });
    });

    describe('homeIntoBattler', () =>
    {
      it('sets the custom (and main, if straight) direction toward the battler, then moves straight', () =>
      {
        // Arrange
        const battler = { getX: () => 5, getY: () => 5 };
        const event = buildEvent();
        event.findDiagonalDirectionTo = vi.fn(() => 8);
        event.isStraightDirection = () => true;
        event.moveStraight = vi.fn();

        // Act
        event.homeIntoBattler(battler);

        // Assert
        expect(event.findDiagonalDirectionTo).toHaveBeenCalledWith(5, 5);
        expect(event.getCustomDirection()).toBe(8);
        expect(event._direction).toBe(8);
        expect(event.moveStraight).toHaveBeenCalledWith(8);
      });

      it('does not touch the main direction when the resolved direction is diagonal', () =>
      {
        // Arrange
        const battler = { getX: () => 5, getY: () => 5 };
        const event = buildEvent({ _direction: 2 });
        event.findDiagonalDirectionTo = vi.fn(() => 9);
        event.isStraightDirection = () => false;
        event.moveStraight = vi.fn();

        // Act
        event.homeIntoBattler(battler);

        // Assert
        expect(event.getCustomDirection()).toBe(9);
        expect(event._direction).toBe(2);
        expect(event.moveStraight).toHaveBeenCalledWith(2);
      });
    });
  });

  describe('seeking movement', () =>
  {
    describe('seekTarget', () =>
    {
      it('seeks the caster action target when this is a jabs action', () =>
      {
        // Arrange
        const target = { id: 'target' };
        const event = buildEvent({ isJabsAction: () => true });
        event.getJabsAction = () => ({ getCaster: () => ({ getTarget: () => target }) });
        event.seekTargetBattler = vi.fn();

        // Act
        event.seekTarget();

        // Assert
        expect(event.seekTargetBattler).toHaveBeenCalledWith(target);
      });

      it('seeks the jabs battler target when this is a jabs battler', () =>
      {
        // Arrange
        const target = { id: 'target' };
        const event = buildEvent({ isJabsAction: () => false, isJabsBattler: () => true });
        event.getJabsBattler = () => ({ getTarget: () => target });
        event.seekTargetBattler = vi.fn();

        // Act
        event.seekTarget();

        // Assert
        expect(event.seekTargetBattler).toHaveBeenCalledWith(target);
      });

      it('moves straight when this is neither a jabs action nor a jabs battler', () =>
      {
        // Arrange
        const event = buildEvent({ isJabsAction: () => false, isJabsBattler: () => false, _direction: 4 });
        event.moveStraight = vi.fn();

        // Act
        event.seekTarget();

        // Assert
        expect(event.moveStraight).toHaveBeenCalledWith(4);
      });
    });

    describe('seekLastHit', () =>
    {
      it('seeks the caster last-hit battler when this is a jabs action', () =>
      {
        // Arrange
        const lastHit = { id: 'last-hit' };
        const event = buildEvent({ isJabsAction: () => true });
        event.getJabsAction = () => ({ getCaster: () => ({ getBattlerLastHit: () => lastHit }) });
        event.seekLastHitBattler = vi.fn();

        // Act
        event.seekLastHit();

        // Assert
        expect(event.seekLastHitBattler).toHaveBeenCalledWith(lastHit);
      });

      it('seeks the jabs battler last-hit battler when this is a jabs battler', () =>
      {
        // Arrange
        const lastHit = { id: 'last-hit' };
        const event = buildEvent({ isJabsAction: () => false, isJabsBattler: () => true });
        event.getJabsBattler = () => ({ getBattlerLastHit: () => lastHit });
        event.seekLastHitBattler = vi.fn();

        // Act
        event.seekLastHit();

        // Assert
        expect(event.seekLastHitBattler).toHaveBeenCalledWith(lastHit);
      });

      it('moves straight when this is neither a jabs action nor a jabs battler', () =>
      {
        // Arrange
        const event = buildEvent({ isJabsAction: () => false, isJabsBattler: () => false, _direction: 6 });
        event.moveStraight = vi.fn();

        // Act
        event.seekLastHit();

        // Assert
        expect(event.moveStraight).toHaveBeenCalledWith(6);
      });
    });

    describe('seekLastHitBattler', () =>
    {
      it('seeks the target when there is no last-hit battler', () =>
      {
        // Arrange
        const event = buildEvent();
        event.seekTarget = vi.fn();
        event.seekBattler = vi.fn();

        // Act
        event.seekLastHitBattler(null);

        // Assert
        expect(event.seekTarget).toHaveBeenCalledTimes(1);
        expect(event.seekBattler).not.toHaveBeenCalled();
      });

      it('seeks the battler when a last-hit battler is provided', () =>
      {
        // Arrange
        const lastHit = { id: 'last-hit' };
        const event = buildEvent();
        event.seekBattler = vi.fn();

        // Act
        event.seekLastHitBattler(lastHit);

        // Assert
        expect(event.seekBattler).toHaveBeenCalledWith(lastHit);
      });
    });

    describe('seekTargetBattler', () =>
    {
      it('moves straight when there is no target', () =>
      {
        // Arrange
        const event = buildEvent({ _direction: 8 });
        event.moveStraight = vi.fn();
        event.seekBattler = vi.fn();

        // Act
        event.seekTargetBattler(null);

        // Assert
        expect(event.moveStraight).toHaveBeenCalledWith(8);
        expect(event.seekBattler).not.toHaveBeenCalled();
      });

      it('seeks the battler when a target is provided', () =>
      {
        // Arrange
        const target = { id: 'target' };
        const event = buildEvent();
        event.seekBattler = vi.fn();

        // Act
        event.seekTargetBattler(target);

        // Assert
        expect(event.seekBattler).toHaveBeenCalledWith(target);
      });
    });

    describe('seekBattler', () =>
    {
      it('gradually rotates toward the resolved direction, then moves straight in the current direction', () =>
      {
        // Arrange
        const battler = { getX: () => 3, getY: () => 3 };
        const event = buildEvent({ _direction: 2 });
        event.setCustomDirection(6);
        event.findDiagonalDirectionTo = vi.fn(() => 8);
        event.gradualRotateToDirection = vi.fn();
        event.moveStraight = vi.fn();

        // Act
        event.seekBattler(battler);

        // Assert
        expect(event.findDiagonalDirectionTo).toHaveBeenCalledWith(3, 3);
        expect(event.gradualRotateToDirection).toHaveBeenCalledWith(6, 8);
        expect(event.moveStraight).toHaveBeenCalledWith(2);
      });
    });

    describe('gradualRotateToDirection', () =>
    {
      it('does nothing when already facing the final direction', () =>
      {
        // Arrange
        const event = buildEvent();
        event.turnLeft45 = vi.fn();
        event.turnRight45 = vi.fn();

        // Act
        event.gradualRotateToDirection(6, 6);

        // Assert
        expect(event.turnLeft45).not.toHaveBeenCalled();
        expect(event.turnRight45).not.toHaveBeenCalled();
      });

      it.each([
        [ 1, 2 ], [ 1, 3 ], [ 1, 6 ],
        [ 2, 3 ], [ 2, 6 ], [ 2, 9 ],
        [ 3, 6 ], [ 3, 9 ], [ 3, 8 ],
        [ 4, 1 ], [ 4, 2 ], [ 4, 3 ],
        [ 6, 9 ], [ 6, 8 ], [ 6, 7 ],
        [ 7, 4 ], [ 7, 1 ], [ 7, 2 ],
        [ 8, 7 ], [ 8, 4 ], [ 8, 1 ],
        [ 9, 8 ], [ 9, 7 ], [ 9, 4 ],
      ])('turns left when rotating from %i toward %i', (current, final) =>
      {
        // Arrange
        const event = buildEvent();
        event.turnLeft45 = vi.fn();
        event.turnRight45 = vi.fn();

        // Act
        event.gradualRotateToDirection(current, final);

        // Assert
        expect(event.turnLeft45).toHaveBeenCalledTimes(1);
        expect(event.turnRight45).not.toHaveBeenCalled();
      });

      it('turns right when the final direction is not in the needLeft set', () =>
      {
        // Arrange
        const event = buildEvent();
        event.turnLeft45 = vi.fn();
        event.turnRight45 = vi.fn();

        // Act- from 1, needLeft is [2, 3, 6]; 9 is not in that set.
        event.gradualRotateToDirection(1, 9);

        // Assert
        expect(event.turnRight45).toHaveBeenCalledTimes(1);
        expect(event.turnLeft45).not.toHaveBeenCalled();
      });
    });
  });
});
//endregion plugins/abs/ext/diag/objects/game-event.test.js
