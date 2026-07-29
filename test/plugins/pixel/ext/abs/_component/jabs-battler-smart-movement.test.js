//region plugins/pixel/ext/abs/_component/jabs-battler-smart-movement.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installPixelAbsExtHostGlobals,
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
  setPluginContextToJPixelAbsExt,
} from '../../../_component/fixtures/install-pixel-host-globals.js';

/**
 * Builds a character stand-in exposing every pixel-movement probe the smart movement routines call.
 *
 * Defaults are deliberately permissive- passable in all directions, no active micro-route- so each
 * test only has to describe the one condition it is actually about.
 *
 * @param {object} [overrides] Properties to replace on the built character.
 * @returns {object} The character stand-in.
 */
function buildCharacter(overrides = {})
{
  const character = {
    x: 0,
    y: 0,

    // pixel movement advances a fraction of a tile per frame; the diagonal step is the same
    // displacement resolved along both axes, matching the real distancePerFrame relationship.
    distancePerFrame: () => 0.25,
    diagonalDistancePerFrame: () => 0.25 / Math.SQRT2,

    // odd direction codes (1/3/7/9) are the diagonals in RMMZ's numpad direction scheme.
    isDiagonalDirection: direction => direction % 2 === 1,
    isStraightDirection: direction => direction % 2 === 0,

    canPassStraight: () => true,
    canPassDiagonalByDirection: () => true,

    isMicroRouting: () => false,
    getMicroRouteFrames: () => 0,
    getMicroRouteDirection: () => 0,
    clearMicroRoute: vi.fn(),
    decrementMicroRouteFrames: vi.fn(),
    setMicroRouteDirection: vi.fn(),
    setMicroRouteFrames: vi.fn(),

    pixelMoveByInput: vi.fn(),
    findDirectionTo: () => 0,

    direction: () => 2,
    isDirectionFixed: () => false,
    getVectorInputAngle: () => null,
  };

  return Object.assign(character, overrides);
}

describe('J-ABS-Pixelistics JABS_Battler smart movement (direct src import)', () =>
{
  /** @type {Function} the fixture's stubbed static, restored after tests that replace it. */
  let originalIsClose;
  /** @type {number} */
  let originalCloseDistance;

  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJPixel();
    await import('../../../../../../src/plugins/pixel/core/_metadata/initialization.js');

    ({ default: globalThis.PIXEL_CollisionManager } = await import('../../../../../../src/plugins/pixel/core/managers/PIXEL_CollisionManager.js'));
    globalThis.PIXEL_CollisionManager.initConfig();
    globalThis.PIXEL_CollisionManager.setupCollision();

    installPixelAbsExtHostGlobals();

    setPluginContextToJPixelAbsExt();
    await import('../../../../../../src/plugins/pixel/ext/abs/_metadata/initialization.js');

    await import('../../../../../../src/plugins/pixel/ext/abs/objects/JABS_Battler.js');

    originalIsClose = globalThis.JABS_Battler.isClose;
    originalCloseDistance = globalThis.JABS_Battler.closeDistance;
  });

  /**
   * Builds a battler wired to a given character, not dodging and not guarding.
   * @param {object} character The character stand-in to attach.
   * @returns {JABS_Battler}
   */
  const buildBattler = character =>
  {
    const battler = new globalThis.JABS_Battler();
    battler.getCharacter = () => character;
    battler.isDodging = () => false;
    battler.guarding = () => false;
    battler.setWaitCountdown = vi.fn();

    return battler;
  };

  afterEach(() =>
  {
    // these are statics on a bare global; leaving a test's override in place would silently change
    // the meaning of every later test in this file.
    globalThis.JABS_Battler.isClose = originalIsClose;
    globalThis.JABS_Battler.closeDistance = originalCloseDistance;
  });

  describe('smartMoveTowardCoordinates', () =>
  {
    it('does not move while dodging, because dodge movement owns the character', () =>
    {
      // Arrange- a dodge already drives displacement; steering here would stack on top of it and read
      // in play as an unexplained sprint.
      const character = buildCharacter();
      const battler = buildBattler(character);
      battler.isDodging = () => true;

      // Act
      battler.smartMoveTowardCoordinates(5, 5);

      // Assert
      expect(character.pixelMoveByInput).not.toHaveBeenCalled();
    });

    it('does not move while guarding', () =>
    {
      // Arrange
      const character = buildCharacter();
      const battler = buildBattler(character);
      battler.guarding = () => true;

      // Act
      battler.smartMoveTowardCoordinates(5, 5);

      // Assert
      expect(character.pixelMoveByInput).not.toHaveBeenCalled();
    });

    it('does nothing once inside the arrival tolerance', () =>
    {
      // Arrange- taxi distance below 0.1 counts as arrived, which stops the battler jittering on top
      // of its destination.
      const character = buildCharacter({ x: 0, y: 0 });
      const battler = buildBattler(character);

      // Act
      battler.smartMoveTowardCoordinates(0.04, 0.04);

      // Assert
      expect(character.pixelMoveByInput).not.toHaveBeenCalled();
    });

    it('continues an active micro-route without re-deciding direction', () =>
    {
      // Arrange- holding a direction for several frames is what stops the battler dithering between
      // two near-equal candidates every frame.
      const character = buildCharacter({
        getMicroRouteFrames: () => 4,
        getMicroRouteDirection: () => 6,
      });
      const battler = buildBattler(character);

      // Act
      battler.smartMoveTowardCoordinates(5, 0);

      // Assert
      expect(character.pixelMoveByInput).toHaveBeenCalledWith(6);
      expect(character.decrementMicroRouteFrames).toHaveBeenCalled();
      expect(character.setMicroRouteDirection).not.toHaveBeenCalled();
    });

    it('abandons a micro-route whose cached direction has become blocked', () =>
    {
      // Arrange- terrain changes and other battlers move, so a cached direction can stop being valid
      // partway through its hold. The target sits down-and-right so that dropping the blocked cardinal
      // still leaves the 45 degree diagonal available; otherwise the routine would correctly fall all
      // the way through to waiting and there would be no re-decision to observe.
      const character = buildCharacter({
        getMicroRouteFrames: () => 4,
        getMicroRouteDirection: () => 6,
        canPassStraight: direction => direction !== 6,
      });
      const battler = buildBattler(character);

      // Act
      battler.smartMoveTowardCoordinates(5, 5);

      // Assert- the route is dropped and a fresh direction is chosen in the same frame.
      expect(character.clearMicroRoute).toHaveBeenCalled();
      expect(character.pixelMoveByInput).toHaveBeenCalled();
      expect(character.pixelMoveByInput).not.toHaveBeenCalledWith(6);
    });

    it('validates a cached diagonal micro-route with the diagonal probe', () =>
    {
      // Arrange
      const character = buildCharacter({
        getMicroRouteFrames: () => 2,
        getMicroRouteDirection: () => 3,
        canPassDiagonalByDirection: vi.fn(() => true),
      });
      const battler = buildBattler(character);

      // Act
      battler.smartMoveTowardCoordinates(5, 5);

      // Assert
      expect(character.canPassDiagonalByDirection).toHaveBeenCalledWith(3);
      expect(character.pixelMoveByInput).toHaveBeenCalledWith(3);
    });

    it('steps in the primary direction implied by the angle when it is passable', () =>
    {
      // Arrange- a target due right resolves to a 0 degree angle and therefore direction 6.
      const character = buildCharacter({ x: 0, y: 0 });
      const battler = buildBattler(character);

      // Act
      battler.smartMoveTowardCoordinates(5, 0);

      // Assert
      expect(character.pixelMoveByInput).toHaveBeenCalledWith(6);
    });

    it('falls back to the vector diagonal when the primary direction is blocked', () =>
    {
      // Arrange- a target down and to the right gives a 45 degree primary of 3; blocking only the
      // straight probes leaves the diagonal candidate as the next choice.
      const character = buildCharacter({
        x: 0,
        y: 0,
        canPassStraight: () => false,
        canPassDiagonalByDirection: direction => direction === 3,
      });
      const battler = buildBattler(character);
      // force the primary to a blocked cardinal so the diagonal fallback is the branch under test.
      battler.angleToDirection = () => 6;

      // Act
      battler.smartMoveTowardCoordinates(5, 5);

      // Assert
      expect(character.pixelMoveByInput).toHaveBeenCalledWith(3);
    });

    it('falls back to cardinals when both the primary and the diagonal are blocked', () =>
    {
      // Arrange- with all diagonals impassable, the ordered cardinal list decides.
      const character = buildCharacter({
        x: 0,
        y: 0,
        canPassDiagonalByDirection: () => false,
        canPassStraight: direction => direction === 2,
      });
      const battler = buildBattler(character);

      // Act
      battler.smartMoveTowardCoordinates(5, 5);

      // Assert
      expect(character.pixelMoveByInput).toHaveBeenCalledWith(2);
    });

    it('prefers the horizontal cardinal when the horizontal delta is the larger one', () =>
    {
      // Arrange- the axis with more distance to cover is attempted first, so progress is maximised.
      const character = buildCharacter({
        x: 0,
        y: 0,
        canPassDiagonalByDirection: () => false,
        canPassStraight: () => true,
      });
      const battler = buildBattler(character);
      battler.angleToDirection = () => 0;

      // Act
      battler.smartMoveTowardCoordinates(10, 2);

      // Assert
      expect(character.pixelMoveByInput).toHaveBeenCalledWith(6);
    });

    it('prefers the vertical cardinal when the vertical delta is the larger one', () =>
    {
      // Arrange
      const character = buildCharacter({
        x: 0,
        y: 0,
        canPassDiagonalByDirection: () => false,
        canPassStraight: () => true,
      });
      const battler = buildBattler(character);
      battler.angleToDirection = () => 0;

      // Act
      battler.smartMoveTowardCoordinates(2, 10);

      // Assert
      expect(character.pixelMoveByInput).toHaveBeenCalledWith(2);
    });

    it('adopts the tile A* hint when no pixel-aware direction is available', () =>
    {
      // Arrange- boxed in on every pixel probe, the routine defers to vanilla tile pathfinding, which
      // can see around a corner that the immediate-neighbour probes cannot.
      const character = buildCharacter({
        canPassStraight: () => false,
        canPassDiagonalByDirection: () => false,
        findDirectionTo: vi.fn(() => 4),
      });
      const battler = buildBattler(character);

      // Act
      battler.smartMoveTowardCoordinates(5, 5);

      // Assert
      expect(character.findDirectionTo).toHaveBeenCalledWith(5, 5);
      expect(character.pixelMoveByInput).toHaveBeenCalledWith(4);
    });

    it('waits briefly when even the A* hint finds nothing', () =>
    {
      // Arrange- a short wait lets neighbouring battlers shuffle instead of tight-looping every frame.
      const character = buildCharacter({
        canPassStraight: () => false,
        canPassDiagonalByDirection: () => false,
        findDirectionTo: () => 0,
      });
      const battler = buildBattler(character);

      // Act
      battler.smartMoveTowardCoordinates(5, 5);

      // Assert
      expect(battler.setWaitCountdown).toHaveBeenCalledWith(2);
      expect(character.pixelMoveByInput).not.toHaveBeenCalled();
    });

    it('holds a new direction for one frame when the target is very close', () =>
    {
      // Arrange- taxi distance of 0.6 sits below the 1.5 threshold.
      const character = buildCharacter({ x: 0, y: 0 });
      const battler = buildBattler(character);

      // Act
      battler.smartMoveTowardCoordinates(0.3, 0.3);

      // Assert
      expect(character.setMicroRouteFrames).toHaveBeenCalledWith(1);
    });

    it('holds a new direction for eight frames at moderate range', () =>
    {
      // Arrange- taxi distance of 2 sits between the 1.5 and 3 thresholds.
      const character = buildCharacter({ x: 0, y: 0 });
      const battler = buildBattler(character);

      // Act
      battler.smartMoveTowardCoordinates(1, 1);

      // Assert
      expect(character.setMicroRouteFrames).toHaveBeenCalledWith(8);
    });

    it('holds a new direction for sixteen frames when the target is far away', () =>
    {
      // Arrange- committing longer at distance avoids re-deciding on every frame of a long approach.
      const character = buildCharacter({ x: 0, y: 0 });
      const battler = buildBattler(character);

      // Act
      battler.smartMoveTowardCoordinates(10, 10);

      // Assert
      expect(character.setMicroRouteFrames).toHaveBeenCalledWith(16);
    });
  });

  describe('smartMoveAwayFromTarget', () =>
  {
    /**
     * Restores the real closeness semantics from `abs/core`, which the shared pixel fixture stubs out
     * to a flat `false`. Retreat logic is meaningless without it.
     * @param {number} closeDistance The distance at or below which a battler counts as close.
     */
    const useRealClosenessRules = closeDistance =>
    {
      globalThis.JABS_Battler.closeDistance = closeDistance;
      globalThis.JABS_Battler.isClose = distance => distance <= closeDistance;
    };

    /**
     * Builds a battler with a target parked at a fixed spot.
     * @param {object} character The character stand-in for the retreating battler.
     * @param {{x: number, y: number}} targetPosition Where the threat is standing.
     * @returns {JABS_Battler}
     */
    const buildRetreatingBattler = (character, targetPosition) =>
    {
      const battler = buildBattler(character);
      battler.getTarget = () => ({
        getX: () => targetPosition.x,
        getY: () => targetPosition.y,
      });

      return battler;
    };

    it('does nothing when there is no target to retreat from', () =>
    {
      // Arrange
      const character = buildCharacter();
      const battler = buildBattler(character);
      battler.getTarget = () => null;

      // Act
      battler.smartMoveAwayFromTarget();

      // Assert
      expect(character.pixelMoveByInput).not.toHaveBeenCalled();
    });

    it('does nothing while dodging', () =>
    {
      // Arrange
      useRealClosenessRules(2);
      const character = buildCharacter();
      const battler = buildRetreatingBattler(character, { x: 0.5, y: 0 });
      battler.isDodging = () => true;

      // Act
      battler.smartMoveAwayFromTarget();

      // Assert
      expect(character.pixelMoveByInput).not.toHaveBeenCalled();
    });

    it('does nothing while guarding', () =>
    {
      // Arrange
      useRealClosenessRules(2);
      const character = buildCharacter();
      const battler = buildRetreatingBattler(character, { x: 0.5, y: 0 });
      battler.guarding = () => true;

      // Act
      battler.smartMoveAwayFromTarget();

      // Assert
      expect(character.pixelMoveByInput).not.toHaveBeenCalled();
    });

    it('does nothing when the target is already outside the close band', () =>
    {
      // Arrange- retreat only applies inside the close band; beyond it the battler holds its ground.
      useRealClosenessRules(1);
      const character = buildCharacter({ x: 0, y: 0 });
      const battler = buildRetreatingBattler(character, { x: 5, y: 0 });

      // Act
      battler.smartMoveAwayFromTarget();

      // Assert
      expect(character.pixelMoveByInput).not.toHaveBeenCalled();
    });

    it('steps away from the target when inside the close band', () =>
    {
      // Arrange- the threat is to the right, so the retreat must carry the battler left.
      useRealClosenessRules(2);
      const character = buildCharacter({ x: 0, y: 0 });
      const battler = buildRetreatingBattler(character, { x: 1, y: 0 });

      // Act
      battler.smartMoveAwayFromTarget();

      // Assert
      expect(character.pixelMoveByInput).toHaveBeenCalledWith(4);
    });

    it('honours an active retreat micro-route while it stays passable', () =>
    {
      // Arrange
      useRealClosenessRules(2);
      const character = buildCharacter({
        x: 0,
        y: 0,
        isMicroRouting: () => true,
        getMicroRouteDirection: () => 4,
      });
      const battler = buildRetreatingBattler(character, { x: 1, y: 0 });

      // Act
      battler.smartMoveAwayFromTarget();

      // Assert
      expect(character.pixelMoveByInput).toHaveBeenCalledWith(4);
      expect(character.decrementMicroRouteFrames).toHaveBeenCalled();
      expect(character.setMicroRouteDirection).not.toHaveBeenCalled();
    });

    it('drops a retreat micro-route whose direction has become blocked', () =>
    {
      // Arrange
      useRealClosenessRules(2);
      const character = buildCharacter({
        x: 0,
        y: 0,
        isMicroRouting: () => true,
        getMicroRouteDirection: () => 4,
        canPassStraight: direction => direction !== 4,
      });
      const battler = buildRetreatingBattler(character, { x: 1, y: 0 });

      // Act
      battler.smartMoveAwayFromTarget();

      // Assert
      expect(character.clearMicroRoute).toHaveBeenCalled();
    });

    it('validates a cached diagonal retreat route with the diagonal probe', () =>
    {
      // Arrange
      useRealClosenessRules(2);
      const character = buildCharacter({
        x: 0,
        y: 0,
        isMicroRouting: () => true,
        getMicroRouteDirection: () => 7,
        canPassDiagonalByDirection: vi.fn(() => true),
      });
      const battler = buildRetreatingBattler(character, { x: 1, y: 1 });

      // Act
      battler.smartMoveAwayFromTarget();

      // Assert
      expect(character.canPassDiagonalByDirection).toHaveBeenCalledWith(7);
      expect(character.pixelMoveByInput).toHaveBeenCalledWith(7);
    });

    it('skips candidate directions that are impassable', () =>
    {
      // Arrange- with only the leftward step open, that is the only candidate that can win even
      // though other directions would separate further.
      useRealClosenessRules(2);
      const character = buildCharacter({
        x: 0,
        y: 0,
        canPassStraight: direction => direction === 4,
        canPassDiagonalByDirection: () => false,
      });
      const battler = buildRetreatingBattler(character, { x: 1, y: 0 });

      // Act
      battler.smartMoveAwayFromTarget();

      // Assert
      expect(character.pixelMoveByInput).toHaveBeenCalledWith(4);
    });

    it('falls back to any passable diagonal when no direction increases separation', () =>
    {
      // Arrange- standing exactly on the target makes every simulated step equidistant, so no
      // candidate beats the epsilon and the corner-sliding fallback takes over.
      useRealClosenessRules(2);
      const character = buildCharacter({
        x: 0,
        y: 0,
        canPassStraight: () => false,
        canPassDiagonalByDirection: direction => direction === 3,
      });
      const battler = buildRetreatingBattler(character, { x: 0, y: 0 });

      // Act
      battler.smartMoveAwayFromTarget();

      // Assert
      expect(character.pixelMoveByInput).toHaveBeenCalledWith(3);
    });

    it('falls back to a cardinal when no diagonal is passable either', () =>
    {
      // Arrange
      useRealClosenessRules(2);
      const character = buildCharacter({
        x: 0,
        y: 0,
        canPassDiagonalByDirection: () => false,
        canPassStraight: direction => direction === 8,
      });
      const battler = buildRetreatingBattler(character, { x: 0, y: 0 });

      // Act
      battler.smartMoveAwayFromTarget();

      // Assert
      expect(character.pixelMoveByInput).toHaveBeenCalledWith(8);
    });

    it('waits instead of moving when the battler is boxed in entirely', () =>
    {
      // Arrange
      useRealClosenessRules(2);
      const character = buildCharacter({
        x: 0,
        y: 0,
        canPassStraight: () => false,
        canPassDiagonalByDirection: () => false,
      });
      const battler = buildRetreatingBattler(character, { x: 0, y: 0 });

      // Act
      battler.smartMoveAwayFromTarget();

      // Assert
      expect(battler.setWaitCountdown).toHaveBeenCalledWith(2);
      expect(character.pixelMoveByInput).not.toHaveBeenCalled();
    });

    it('holds the retreat direction for one frame at ordinary close range', () =>
    {
      // Arrange- taxi separation of 1.5 is at or above the 1.25 threshold.
      useRealClosenessRules(3);
      const character = buildCharacter({ x: 0, y: 0 });
      const battler = buildRetreatingBattler(character, { x: 1.5, y: 0 });

      // Act
      battler.smartMoveAwayFromTarget();

      // Assert
      expect(character.setMicroRouteFrames).toHaveBeenCalledWith(1);
    });

    it('holds the retreat direction for two frames when extremely close', () =>
    {
      // Arrange- below a taxi separation of 1.25 the battler commits for an extra frame, buying
      // enough space that it does not immediately re-enter the same decision.
      useRealClosenessRules(3);
      const character = buildCharacter({ x: 0, y: 0 });
      const battler = buildRetreatingBattler(character, { x: 1, y: 0 });

      // Act
      battler.smartMoveAwayFromTarget();

      // Assert
      expect(character.setMicroRouteFrames).toHaveBeenCalledWith(2);
    });
  });

  describe('getProjectileSpawnBaseDirection', () =>
  {
    let previousPlayer;

    beforeEach(() =>
    {
      previousPlayer = globalThis.$gamePlayer;
    });

    afterEach(() =>
    {
      globalThis.$gamePlayer = previousPlayer;
    });

    it('uses the vector input bearing for the party leader', () =>
    {
      // Arrange- vector movement keeps sprite facing cardinal for 4-direction sprites, so the true
      // travel bearing is what projectiles should follow.
      const character = buildCharacter({ getVectorInputAngle: () => 90 });
      globalThis.$gamePlayer = character;
      const battler = buildBattler(character);

      // Act
      const direction = battler.getProjectileSpawnBaseDirection();

      // Assert
      expect(direction).toBe(2);
    });

    it('falls back to map facing for the party leader while direction is fixed', () =>
    {
      // Arrange- JABS strafe locks facing; aiming by movement vector there would fire backwards
      // relative to how the character is drawn.
      const character = buildCharacter({
        isDirectionFixed: () => true,
        getVectorInputAngle: () => 90,
        direction: () => 4,
      });
      globalThis.$gamePlayer = character;
      const battler = buildBattler(character);

      // Act
      const direction = battler.getProjectileSpawnBaseDirection();

      // Assert
      expect(direction).toBe(4);
    });

    it('falls back to map facing for the party leader when there is no vector input', () =>
    {
      // Arrange- a null bearing means the stick is centred and only sprite facing remains.
      const character = buildCharacter({
        getVectorInputAngle: () => null,
        direction: () => 6,
      });
      globalThis.$gamePlayer = character;
      const battler = buildBattler(character);

      // Act
      const direction = battler.getProjectileSpawnBaseDirection();

      // Assert
      expect(direction).toBe(6);
    });

    it('uses map facing for any battler that is not the party leader', () =>
    {
      // Arrange- vector input is a player-only concept; enemies have no stick to read.
      const character = buildCharacter({
        getVectorInputAngle: () => 90,
        direction: () => 8,
      });
      globalThis.$gamePlayer = buildCharacter();
      const battler = buildBattler(character);

      // Act
      const direction = battler.getProjectileSpawnBaseDirection();

      // Assert
      expect(direction).toBe(8);
    });
  });

  describe('smartMoveTowardCoordinates direction candidates', () =>
  {
    /**
     * Builds a battler that cannot use its angle-derived primary direction, forcing the fallback
     * chain to run. Each test then varies only the target position, so the candidate builder is the
     * single thing under observation.
     * @param {object} [characterOverrides] Extra properties for the character stand-in.
     * @returns {{battler: JABS_Battler, character: object}}
     */
    const buildFallbackScenario = (characterOverrides = {}) =>
    {
      const character = buildCharacter(characterOverrides);
      const battler = buildBattler(character);

      // 0 is the routine's own "no direction" sentinel, so choosePrimaryIfPossible resolves to it and
      // decideDirection falls straight through to the vector-derived candidates- which is the code
      // actually under observation here.
      battler.angleToDirection = () => 0;

      return { battler, character };
    };

    const diagonalCases = [
      [ 'down and to the left', 5, 5, 1 ],
      [ 'down and to the right', -5, 5, 3 ],
      [ 'up and to the left', 5, -5, 7 ],
      [ 'up and to the right', -5, -5, 9 ],
    ];

    for (const [ description, startX, targetY, expectedDirection ] of diagonalCases)
    {
      it(`builds the ${description} diagonal candidate from the vector`, () =>
      {
        // Arrange- the battler starts offset so the delta to the origin-side target carries the sign
        // combination this case is about.
        const { battler, character } = buildFallbackScenario({ x: startX, y: 0 });

        // Act
        battler.smartMoveTowardCoordinates(0, targetY);

        // Assert
        expect(character.pixelMoveByInput).toHaveBeenCalledWith(expectedDirection);
      });
    }

    it('produces no diagonal candidate when the target shares an axis exactly', () =>
    {
      // Arrange- a target dead ahead has zero vertical intent, so no diagonal applies and the
      // cardinal list has to carry the decision.
      const { battler, character } = buildFallbackScenario({
        x: 0,
        y: 0,
        canPassDiagonalByDirection: () => false,
      });

      // Act
      battler.smartMoveTowardCoordinates(5, 0);

      // Assert
      expect(character.pixelMoveByInput).toHaveBeenCalledWith(6);
    });

    const cardinalCases = [
      [ 'rightward', 10, 1, 6 ],
      [ 'leftward', -10, 1, 4 ],
      [ 'downward', 1, 10, 2 ],
      [ 'upward', 1, -10, 8 ],
    ];

    for (const [ description, targetX, targetY, expectedDirection ] of cardinalCases)
    {
      it(`leads with the ${description} cardinal when that axis dominates`, () =>
      {
        // Arrange- with diagonals unavailable the ordered cardinal list decides, and the axis with
        // the larger remaining distance is attempted first so progress is maximised per frame.
        const { battler, character } = buildFallbackScenario({
          x: 0,
          y: 0,
          canPassDiagonalByDirection: () => false,
        });

        // Act
        battler.smartMoveTowardCoordinates(targetX, targetY);

        // Assert
        expect(character.pixelMoveByInput).toHaveBeenCalledWith(expectedDirection);
      });
    }

    it('appends the upward cardinal last when the horizontal axis dominates', () =>
    {
      // Arrange- horizontal dominates and the target is slightly above, so the ordered list is
      // RIGHT then UP. Blocking RIGHT forces the later entry to be the one taken, proving UP was
      // actually appended rather than dropped.
      const { battler, character } = buildFallbackScenario({
        x: 0,
        y: 0,
        canPassDiagonalByDirection: () => false,
        canPassStraight: direction => direction === 8,
      });

      // Act
      battler.smartMoveTowardCoordinates(10, -1);

      // Assert
      expect(character.pixelMoveByInput).toHaveBeenCalledWith(8);
    });

    it('appends the leftward cardinal last when the vertical axis dominates', () =>
    {
      // Arrange- mirror of the previous case on the other axis ordering.
      const { battler, character } = buildFallbackScenario({
        x: 0,
        y: 0,
        canPassDiagonalByDirection: () => false,
        canPassStraight: direction => direction === 4,
      });

      // Act
      battler.smartMoveTowardCoordinates(-1, 10);

      // Assert
      expect(character.pixelMoveByInput).toHaveBeenCalledWith(4);
    });

    it('omits both horizontal cardinals when the target shares the vertical axis exactly', () =>
    {
      // Arrange- a zero horizontal delta means neither left nor right is wanted, so the candidate
      // list contains only the vertical step. Blocking everything but LEFT proves the list really is
      // empty of horizontals: the routine waits rather than taking a step it never queued.
      const { battler, character } = buildFallbackScenario({
        x: 0,
        y: 0,
        canPassDiagonalByDirection: () => false,
        canPassStraight: direction => direction === 4,
        findDirectionTo: () => 0,
      });

      // Act
      battler.smartMoveTowardCoordinates(0, 10);

      // Assert
      expect(character.pixelMoveByInput).not.toHaveBeenCalled();
      expect(battler.setWaitCountdown).toHaveBeenCalledWith(2);
    });

    it('falls through to the secondary axis when the dominant cardinal is blocked', () =>
    {
      // Arrange- horizontal dominates, but only the vertical step is open.
      const { battler, character } = buildFallbackScenario({
        x: 0,
        y: 0,
        canPassDiagonalByDirection: () => false,
        canPassStraight: direction => direction === 2,
      });

      // Act
      battler.smartMoveTowardCoordinates(10, 1);

      // Assert
      expect(character.pixelMoveByInput).toHaveBeenCalledWith(2);
    });
  });

  describe('smartMoveAwayFromTarget fallback ordering', () =>
  {
    /**
     * Puts the battler in the only state that can reach the fallbacks: every *passable* direction
     * moves it closer to the threat rather than further away, so no candidate clears the improvement
     * epsilon and `bestDirection` is still 0 when the main loop ends. This is the cornered case the
     * fallbacks exist for- the battler would rather step toward the threat than stand still.
     * @param {object} characterOverrides Passability overrides describing the corner.
     * @returns {{battler: JABS_Battler, character: object}}
     */
    const buildCorneredScenario = characterOverrides =>
    {
      globalThis.JABS_Battler.closeDistance = 10;
      globalThis.JABS_Battler.isClose = distance => distance <= 10;

      const character = buildCharacter({ x: 0, y: 0, ...characterOverrides });
      const battler = buildBattler(character);

      // threat sits directly below, so any downward step closes the gap.
      battler.getTarget = () => ({ getX: () => 0, getY: () => 5 });

      return { battler, character };
    };

    it('keeps the first passable diagonal and ignores later ones', () =>
    {
      // Arrange- both downward diagonals are open and both move toward the threat, so neither wins
      // the main loop. The guard that stops a later iteration overwriting the choice is what makes
      // the outcome deterministic rather than "whichever ran last".
      const { battler, character } = buildCorneredScenario({
        canPassStraight: () => false,
        canPassDiagonalByDirection: direction => direction === 1 || direction === 3,
      });

      // Act
      battler.smartMoveAwayFromTarget();

      // Assert- LOWERLEFT is first in the fallback list.
      expect(character.pixelMoveByInput).toHaveBeenCalledWith(1);
      expect(character.pixelMoveByInput).toHaveBeenCalledTimes(1);
    });

    it('keeps the first passable cardinal and ignores later ones', () =>
    {
      // Arrange- RIGHT does technically increase separation, but only by 0.006 of a tile, which is
      // under the 0.01 epsilon; DOWN closes the gap outright. So the main loop finds nothing and both
      // remain available to the cardinal fallback, which must settle on the earlier of the two.
      const { battler, character } = buildCorneredScenario({
        canPassDiagonalByDirection: () => false,
        canPassStraight: direction => direction === 6 || direction === 2,
      });

      // Act
      battler.smartMoveAwayFromTarget();

      // Assert- the fallback order is LEFT, RIGHT, UP, DOWN; LEFT is blocked, so RIGHT wins and DOWN
      // is never taken despite also being passable.
      expect(character.pixelMoveByInput).toHaveBeenCalledWith(6);
      expect(character.pixelMoveByInput).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/pixel/ext/abs/_component/jabs-battler-smart-movement.test.js
