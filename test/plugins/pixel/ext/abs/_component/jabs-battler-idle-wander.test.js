//region plugins/pixel/ext/abs/_component/jabs-battler-idle-wander.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installPixelAbsExtHostGlobals,
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
  setPluginContextToJPixelAbsExt,
} from '../../../_component/fixtures/install-pixel-host-globals.js';

describe('J-ABS-Pixelistics JABS_Battler idle wander state machine (direct src import)', () =>
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

    await import('../../../../../../src/plugins/pixel/ext/abs/objects/JABS_Battler.js');
  });

  /** @type {JABS_Battler} */
  let battler;

  beforeEach(() =>
  {
    battler = new globalThis.JABS_Battler();

    // park the battler at the origin so distances to a destination are trivially readable.
    battler.getCharacter = () => ({ x: 0, y: 0 });

    // the wander machine delegates the actual stepping; stubbing it keeps these tests about state
    // transitions rather than about pathfinding, which is covered separately.
    battler.smartMoveTowardCoordinates = vi.fn();
    battler._rollIdleWaitDuration = vi.fn(() => 150);
    battler._rollIdleDestination = vi.fn(() => ({ x: 3, y: 4 }));
  });

  describe('property seeding', () =>
  {
    it('seeds all three wander properties when they are absent', () =>
    {
      // Arrange- a save file written before this plugin existed has none of these fields, so the
      // machine has to tolerate them being undefined on the very first frame.
      battler._rollIdleDestination = vi.fn(() => null);

      // Act
      battler.updatePixelIdleWander();

      // Assert
      expect(battler._pixelIdleStuckFrames).toBe(0);
      expect(battler._pixelIdleWait).toBe(150);
    });

    it('preserves an existing wait value rather than reseeding it', () =>
    {
      // Arrange- the nullish assignment must not clobber in-flight state on every frame.
      battler._pixelIdleWait = 7;
      battler._pixelIdleDest = null;
      battler._pixelIdleStuckFrames = 3;

      // Act
      battler.updatePixelIdleWander();

      // Assert- the wait ticked down from its existing value instead of being replaced.
      expect(battler._pixelIdleWait).toBe(6);
    });
  });

  describe('waiting state', () =>
  {
    it('ticks the wait counter down and holds position', () =>
    {
      // Arrange
      battler._pixelIdleWait = 5;
      battler._pixelIdleDest = { x: 3, y: 4 };

      // Act
      battler.updatePixelIdleWander();

      // Assert- waiting outranks traveling, so no movement happens even with a destination set.
      expect(battler._pixelIdleWait).toBe(4);
      expect(battler.smartMoveTowardCoordinates).not.toHaveBeenCalled();
    });

    it('stops waiting once the counter reaches zero', () =>
    {
      // Arrange- the final tick leaves the counter at zero, which releases the machine next frame.
      battler._pixelIdleWait = 1;
      battler._pixelIdleDest = null;

      // Act
      battler.updatePixelIdleWander();

      // Assert
      expect(battler._pixelIdleWait).toBe(0);
      expect(battler._rollIdleDestination).not.toHaveBeenCalled();
    });
  });

  describe('traveling state', () =>
  {
    it('steps toward the destination while still short of it', () =>
    {
      // Arrange- a destination three tiles away is well outside the arrival tolerance.
      battler._pixelIdleWait = 0;
      battler._pixelIdleDest = { x: 3, y: 4 };
      battler._pixelIdleStuckFrames = 0;

      // Act
      battler.updatePixelIdleWander();

      // Assert
      expect(battler.smartMoveTowardCoordinates).toHaveBeenCalledWith(3, 4);
      expect(battler._pixelIdleDest).toEqual({ x: 3, y: 4 });
    });

    it('counts a frame toward the stuck limit on every unsuccessful step', () =>
    {
      // Arrange
      battler._pixelIdleWait = 0;
      battler._pixelIdleDest = { x: 3, y: 4 };
      battler._pixelIdleStuckFrames = 10;

      // Act
      battler.updatePixelIdleWander();

      // Assert
      expect(battler._pixelIdleStuckFrames).toBe(11);
    });

    it('clears the destination and waits on arrival', () =>
    {
      // Arrange- inside a quarter tile counts as arrived.
      battler._pixelIdleWait = 0;
      battler._pixelIdleDest = { x: 0.1, y: 0.1 };
      battler._pixelIdleStuckFrames = 12;

      // Act
      battler.updatePixelIdleWander();

      // Assert
      expect(battler._pixelIdleDest).toBe(null);
      expect(battler._pixelIdleStuckFrames).toBe(0);
      expect(battler._pixelIdleWait).toBe(150);
      expect(battler.smartMoveTowardCoordinates).not.toHaveBeenCalled();
    });

    it('abandons a destination it has failed to reach for too long', () =>
    {
      // Arrange- one frame short of the limit, so this update crosses it. Without this escape a
      // battler wedged against geometry would twitch toward an unreachable point forever.
      battler._pixelIdleWait = 0;
      battler._pixelIdleDest = { x: 3, y: 4 };
      battler._pixelIdleStuckFrames = globalThis.JABS_Battler.pixelIdleStuckLimit - 1;

      // Act
      battler.updatePixelIdleWander();

      // Assert
      expect(battler._pixelIdleDest).toBe(null);
      expect(battler._pixelIdleStuckFrames).toBe(0);
      expect(battler._pixelIdleWait).toBe(150);
      expect(battler.smartMoveTowardCoordinates).not.toHaveBeenCalled();
    });

    it('keeps trying while still below the stuck limit', () =>
    {
      // Arrange- two frames short of the limit means this update increments but does not abandon.
      battler._pixelIdleWait = 0;
      battler._pixelIdleDest = { x: 3, y: 4 };
      battler._pixelIdleStuckFrames = globalThis.JABS_Battler.pixelIdleStuckLimit - 2;

      // Act
      battler.updatePixelIdleWander();

      // Assert
      expect(battler._pixelIdleDest).toEqual({ x: 3, y: 4 });
      expect(battler.smartMoveTowardCoordinates).toHaveBeenCalled();
    });
  });

  describe('choosing state', () =>
  {
    it('adopts a freshly rolled destination', () =>
    {
      // Arrange
      battler._pixelIdleWait = 0;
      battler._pixelIdleDest = null;
      battler._pixelIdleStuckFrames = 9;

      // Act
      battler.updatePixelIdleWander();

      // Assert- the stuck counter resets so the new destination gets a full allowance of frames.
      expect(battler._pixelIdleDest).toEqual({ x: 3, y: 4 });
      expect(battler._pixelIdleStuckFrames).toBe(0);
    });

    it('waits a cycle when no passable destination could be rolled', () =>
    {
      // Arrange- a battler boxed into impassable terrain gets a wait rather than a re-roll storm.
      battler._pixelIdleWait = 0;
      battler._pixelIdleDest = null;
      battler._rollIdleDestination = vi.fn(() => null);

      // Act
      battler.updatePixelIdleWander();

      // Assert
      expect(battler._pixelIdleDest).toBe(null);
      expect(battler._pixelIdleWait).toBe(150);
    });
  });
});
//endregion plugins/pixel/ext/abs/_component/jabs-battler-idle-wander.test.js
