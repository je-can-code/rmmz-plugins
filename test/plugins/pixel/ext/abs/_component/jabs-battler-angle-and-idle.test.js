//region plugins/pixel/ext/abs/_component/jabs-battler-angle-and-idle.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installPixelAbsExtHostGlobals,
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
  setPluginContextToJPixelAbsExt,
} from '../../../_component/fixtures/install-pixel-host-globals.js';

describe('J-ABS-Pixelistics JABS_Battler angle math and idle wander (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJPixel();
    await import('../../../../../../src/plugins/pixel/core/_metadata/initialization.js');

    ({ default: globalThis.PIXEL_CollisionManager } = await import('../../../../../../src/plugins/pixel/core/managers/PIXEL_CollisionManager.js'));
    globalThis.PIXEL_CollisionManager.initConfig();
    globalThis.PIXEL_CollisionManager.setupCollision();

    installPixelAbsExtHostGlobals();

    setPluginContextToJPixelAbsExt();
    await import('../../../../../../src/plugins/pixel/ext/abs/_metadata/initialization.js');

    // patches the fake JABS_Battler stand-in directly, no vm involved.
    await import('../../../../../../src/plugins/pixel/ext/abs/objects/JABS_Battler.js');
  });

  describe('calculateAngle', () =>
  {
    /**
     * Positions a battler at the origin so the angle to any target reduces to atan2 of the target
     * coordinates alone, keeping each expectation readable.
     * @returns {JABS_Battler}
     */
    const battlerAtOrigin = () =>
    {
      const battler = new globalThis.JABS_Battler();
      battler.getCharacter = () => ({ x: 0, y: 0 });

      return battler;
    };

    it('returns 0 degrees for a target directly to the right', () =>
    {
      // Arrange
      const battler = battlerAtOrigin();

      // Act
      const angle = battler.calculateAngle(5, 0);

      // Assert
      expect(angle).toBe(0);
    });

    it('returns 90 degrees for a target directly below, because map space is Y-down', () =>
    {
      // Arrange
      const battler = battlerAtOrigin();

      // Act
      const angle = battler.calculateAngle(0, 5);

      // Assert
      expect(angle).toBe(90);
    });

    it('returns -90 degrees for a target directly above', () =>
    {
      // Arrange
      const battler = battlerAtOrigin();

      // Act
      const angle = battler.calculateAngle(0, -5);

      // Assert
      expect(angle).toBe(-90);
    });

    it('returns 180 degrees for a target directly to the left', () =>
    {
      // Arrange
      const battler = battlerAtOrigin();

      // Act
      const angle = battler.calculateAngle(-5, 0);

      // Assert
      expect(angle).toBe(180);
    });

    it('measures from the battler position rather than from the map origin', () =>
    {
      // Arrange- offsetting the battler must shift the result, proving the delta is target-minus-self
      // rather than a bare atan2 of the target.
      const battler = new globalThis.JABS_Battler();
      battler.getCharacter = () => ({ x: 10, y: 10 });

      // Act
      const angle = battler.calculateAngle(15, 10);

      // Assert
      expect(angle).toBe(0);
    });
  });

  describe('angleToDirection', () =>
  {
    let battler;

    beforeEach(() =>
    {
      battler = new globalThis.JABS_Battler();
    });

    // each sector is 45 degrees wide, with the boundary sitting at the half-open upper edge.
    const sectorCentres = [
      [ 0, 'RIGHT', 6 ],
      [ 45, 'LOWERRIGHT', 3 ],
      [ 90, 'DOWN', 2 ],
      [ 135, 'LOWERLEFT', 1 ],
      [ 180, 'LEFT', 4 ],
      [ -135, 'UPPERLEFT', 7 ],
      [ -90, 'UP', 8 ],
      [ -45, 'UPPERRIGHT', 9 ],
    ];

    for (const [ angle, name, expected ] of sectorCentres)
    {
      it(`maps the centre of the ${name} sector (${angle} degrees) to direction ${expected}`, () =>
      {
        // Arrange & Act
        const direction = battler.angleToDirection(angle);

        // Assert
        expect(direction).toBe(expected);
      });
    }

    it('treats a sector boundary as belonging to the lower sector', () =>
    {
      // Arrange- 22.5 is the RIGHT/LOWERRIGHT boundary, and every comparison is `> lower && <= upper`,
      // so the boundary value itself must fall to RIGHT rather than LOWERRIGHT.
      // Act
      const atBoundary = battler.angleToDirection(22.5);
      const justPast = battler.angleToDirection(22.6);

      // Assert
      expect(atBoundary).toBe(6);
      expect(justPast).toBe(3);
    });

    it('folds angles above 180 degrees back into the signed range', () =>
    {
      // Arrange- Game_Player#dir8ToAngle emits 0..315 for keyboard input, so UP arrives as 270 rather
      // than -90. Without the fold it would land in the LEFT bucket and shots would fire sideways.
      // Act
      const direction = battler.angleToDirection(270);

      // Assert
      expect(direction).toBe(8);
    });

    it('folds angles at or below -180 degrees back into the signed range', () =>
    {
      // Arrange- -180 is exactly the `<= -180` edge, so it wraps to +180 and resolves as LEFT.
      // Act
      const direction = battler.angleToDirection(-180);

      // Assert
      expect(direction).toBe(4);
    });

    it('maps the negative half of the LEFT sector to LEFT', () =>
    {
      // Arrange- LEFT is the one sector that straddles the wrap point, so it is described by two
      // separate comparisons rather than one range. Every other test in this block lands on the
      // positive side of it; -170 is on the negative side, and without that half of the condition it
      // falls past every remaining sector and comes back as the no-direction sentinel.
      // Act
      const direction = battler.angleToDirection(-170);

      // Assert
      expect(direction).toBe(4);
    });

    it('resolves every dir8ToAngle output to the direction it came from', () =>
    {
      // Arrange- this is the contract that matters in play: the keyboard angle producer and this
      // consumer must round-trip, or projectile aim disagrees with the direction pressed.
      const dir8ToAngleOutputs = [
        [ 0, 6 ],
        [ 45, 3 ],
        [ 90, 2 ],
        [ 135, 1 ],
        [ 180, 4 ],
        [ 225, 7 ],
        [ 270, 8 ],
        [ 315, 9 ],
      ];

      // Act & Assert
      for (const [ angle, expectedDirection ] of dir8ToAngleOutputs)
      {
        expect(battler.angleToDirection(angle)).toBe(expectedDirection);
      }
    });

    it('returns 0 when the angle is not a number at all', () =>
    {
      // Arrange- NaN fails every sector comparison, which is the only way to reach the final fallback.
      // It arrives here when calculateAngle is handed a non-finite coordinate.
      // Act
      const direction = battler.angleToDirection(Number.NaN);

      // Assert
      expect(direction).toBe(0);
    });
  });

  describe('canDirectionalDodgeStepPass', () =>
  {
    let battler;

    beforeEach(() =>
    {
      battler = new globalThis.JABS_Battler();
    });

    it('probes diagonal passability for a diagonal direction', () =>
    {
      // Arrange
      const character = {
        isDiagonalDirection: () => true,
        canPassDiagonalByDirection: vi.fn(() => true),
        canPassStraight: vi.fn(() => false),
      };

      // Act
      const result = battler.canDirectionalDodgeStepPass(character, 1);

      // Assert- the straight probe must not be consulted, since it cannot describe a diagonal step.
      expect(result).toBe(true);
      expect(character.canPassDiagonalByDirection).toHaveBeenCalledWith(1);
      expect(character.canPassStraight).not.toHaveBeenCalled();
    });

    it('probes straight passability for a cardinal direction', () =>
    {
      // Arrange
      const character = {
        isDiagonalDirection: () => false,
        canPassDiagonalByDirection: vi.fn(() => true),
        canPassStraight: vi.fn(() => false),
      };

      // Act
      const result = battler.canDirectionalDodgeStepPass(character, 2);

      // Assert
      expect(result).toBe(false);
      expect(character.canPassStraight).toHaveBeenCalledWith(2);
      expect(character.canPassDiagonalByDirection).not.toHaveBeenCalled();
    });
  });

  describe('_rollIdleWaitDuration', () =>
  {
    let battler;
    let randomIntSpy;

    beforeEach(() =>
    {
      battler = new globalThis.JABS_Battler();
    });

    afterEach(() =>
    {
      // spies on bare globals survive into later tests in the same file unless restored by hand.
      randomIntSpy?.mockRestore();
      randomIntSpy = undefined;
    });

    it('returns the lowest duration when the roll comes up minimum', () =>
    {
      // Arrange- randomInt(7) yields 0..6, so the floor of the multiplier is 4.
      randomIntSpy = vi.spyOn(globalThis.Math, 'randomInt').mockReturnValue(0);

      // Act
      const frames = battler._rollIdleWaitDuration();

      // Assert- 4 * 30 frames is two seconds at 60fps.
      expect(frames).toBe(120);
    });

    it('returns the highest duration when the roll comes up maximum', () =>
    {
      // Arrange
      randomIntSpy = vi.spyOn(globalThis.Math, 'randomInt').mockReturnValue(6);

      // Act
      const frames = battler._rollIdleWaitDuration();

      // Assert- 10 * 30 frames is five seconds at 60fps.
      expect(frames).toBe(300);
    });

    it('always returns a whole multiple of 30 frames', () =>
    {
      // Arrange & Act & Assert- the duration is consumed as a frame countdown, so a fractional value
      // would never reach exactly zero on the decrementing path in updatePixelIdleWander.
      for (let roll = 0; roll < 7; roll++)
      {
        randomIntSpy?.mockRestore();
        randomIntSpy = vi.spyOn(globalThis.Math, 'randomInt').mockReturnValue(roll);

        expect(battler._rollIdleWaitDuration() % 30).toBe(0);
      }
    });
  });

  describe('_rollIdleDestination', () =>
  {
    let battler;
    let randomSpy;
    let previousGameMap;

    beforeEach(() =>
    {
      battler = new globalThis.JABS_Battler();
      battler.getHomeX = () => 10;
      battler.getHomeY = () => 20;

      previousGameMap = globalThis.$gameMap;
    });

    afterEach(() =>
    {
      randomSpy?.mockRestore();
      randomSpy = undefined;
      globalThis.$gameMap = previousGameMap;
    });

    it('returns a destination on the first attempt when the tile is passable', () =>
    {
      // Arrange- a midpoint roll of 0.5 produces a zero offset, landing exactly on home.
      randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
      globalThis.$gameMap = { isPassable: vi.fn(() => true) };

      // Act
      const destination = battler._rollIdleDestination();

      // Assert
      expect(destination).toEqual({ x: 10, y: 20 });
    });

    it('returns null once every attempt lands on impassable terrain', () =>
    {
      // Arrange- a battler walled in on all sides must give up rather than loop.
      randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
      globalThis.$gameMap = { isPassable: vi.fn(() => false) };

      // Act
      const destination = battler._rollIdleDestination();

      // Assert- five attempts, each probing all four cardinal directions before rejecting the tile.
      expect(destination).toBe(null);
      expect(globalThis.$gameMap.isPassable).toHaveBeenCalledTimes(20);
    });

    it('accepts a tile that is passable in only one direction', () =>
    {
      // Arrange- passability is an OR across all four cardinals, so a tile reachable from a single
      // side still counts as a valid wander target.
      randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
      globalThis.$gameMap = { isPassable: (x, y, direction) => direction === 8 };

      // Act
      const destination = battler._rollIdleDestination();

      // Assert
      expect(destination).toEqual({ x: 10, y: 20 });
    });

    it('stops rolling as soon as an attempt succeeds', () =>
    {
      // Arrange- the third probed tile is the first passable one.
      randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
      let tilesProbed = 0;
      globalThis.$gameMap = {
        isPassable: () =>
        {
          tilesProbed++;

          // the first two attempts probe four directions each before being rejected.
          return tilesProbed > 8;
        },
      };

      // Act
      const destination = battler._rollIdleDestination();

      // Assert- a fourth attempt would have pushed the probe count past 12.
      expect(destination).not.toBe(null);
      expect(tilesProbed).toBe(9);
    });

    it('keeps the fractional offset rather than snapping the destination to the probed tile', () =>
    {
      // Arrange- rolling 1.0 drives the offset to the positive edge of the wander radius. The tile
      // *probe* rounds to whole coordinates, but the stored destination must stay fractional or pixel
      // movement would quantise back to tile-locked wandering.
      randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.9);
      globalThis.$gameMap = { isPassable: () => true };
      const radius = globalThis.J.PIXEL.EXT.ABS.Metadata.IdleWanderRadius;

      // Act
      const destination = battler._rollIdleDestination();

      // Assert
      const expectedOffset = (0.9 * radius * 2) - radius;
      expect(destination.x).toBeCloseTo(10 + expectedOffset, 10);
      expect(destination.y).toBeCloseTo(20 + expectedOffset, 10);
    });
  });

  describe('setDodgeSteps', () =>
  {
    let previousStepCount;

    beforeEach(() =>
    {
      previousStepCount = globalThis.PIXEL_CollisionManager.collisionStepCount;
    });

    afterEach(() =>
    {
      globalThis.PIXEL_CollisionManager.collisionStepCount = previousStepCount;
    });

    it('scales the requested step count by the collision subcell density', () =>
    {
      // Arrange- pixel movement advances in subcells, so a dodge asking for 4 "steps" has to be
      // multiplied up or it would cover a quarter of the intended distance.
      globalThis.PIXEL_CollisionManager.collisionStepCount = 4;
      const battler = new globalThis.JABS_Battler();

      // Act
      battler.setDodgeSteps(3);

      // Assert
      expect(battler.__lastDodgeSteps).toBe(12);
    });

    it('initializes the collision config first when it has never been set up', () =>
    {
      // Arrange- a dodge can fire before anything else has touched the collision manager on a freshly
      // loaded map, which would otherwise multiply the step count by undefined and yield NaN steps.
      delete globalThis.PIXEL_CollisionManager.collisionStepCount;
      const initConfigSpy = vi.spyOn(globalThis.PIXEL_CollisionManager, 'initConfig');
      const battler = new globalThis.JABS_Battler();

      // Act
      battler.setDodgeSteps(3);

      // Assert- the config is populated on demand and the resulting step count is a real number.
      expect(initConfigSpy).toHaveBeenCalled();
      expect(Number.isNaN(battler.__lastDodgeSteps)).toBe(false);

      initConfigSpy.mockRestore();
    });

    it('leaves an already configured collision manager alone', () =>
    {
      // Arrange- the guard exists to make initialization happen once, not every dodge. Re-running it
      // would rebuild collision configuration mid-combat, and because the rebuild lands on the same
      // defaults the scaled step count would look correct while the work happened anyway. Only the
      // call count can tell the two apart.
      globalThis.PIXEL_CollisionManager.collisionStepCount = 4;
      const initConfigSpy = vi.spyOn(globalThis.PIXEL_CollisionManager, 'initConfig');
      const battler = new globalThis.JABS_Battler();

      // Act
      battler.setDodgeSteps(3);

      // Assert- the scaling still happened, which is what proves the method ran at all.
      expect(initConfigSpy).not.toHaveBeenCalled();
      expect(battler.__lastDodgeSteps).toBe(12);

      initConfigSpy.mockRestore();
    });
  });
});
//endregion plugins/pixel/ext/abs/_component/jabs-battler-angle-and-idle.test.js
