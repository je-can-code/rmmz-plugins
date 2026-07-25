//region plugins/abs/ext/targeting/_models/jabs-targeting-sentinel-action.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_TargetingSentinelAction (direct src import)', () =>
{
  let JABS_TargetingSentinelAction;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.Game_Character = class
    {
      locate(x, y)
      {
        this.x = x;
        this.y = y;
      }

      screenX()
      {
        return (this.x ?? 0) * 48;
      }

      screenY()
      {
        return (this.y ?? 0) * 48;
      }
    };

    globalThis.JABS_Engine = {
      resolveMeleeOriginPixelOffsetsForFacing: vi.fn(() => ({ ox: 5, oy: 3 })),
      resolveMeleeVerticalLiftPxForFacing: vi.fn(() => 7),
    };

    ({ default: JABS_TargetingSentinelAction } = await import(
      '../../../../../../src/plugins/abs/ext/targeting/_models/JABS_TargetingSentinelAction.js'
    ));
  });

  let sentinel;

  beforeEach(() =>
  {
    sentinel = new JABS_TargetingSentinelAction();
    vi.clearAllMocks();
    globalThis.JABS_Engine.resolveMeleeOriginPixelOffsetsForFacing.mockReturnValue({ ox: 5, oy: 3 });
    globalThis.JABS_Engine.resolveMeleeVerticalLiftPxForFacing.mockReturnValue(7);
  });

  describe('set / getJabsAction / reset', () =>
  {
    it('getJabsAction is null before any action is set', () =>
    {
      expect(sentinel.getJabsAction()).toBeNull();
    });

    it('set assigns the real action this sentinel stands in for', () =>
    {
      // Arrange
      const action = { direction: () => 2 };

      // Act
      sentinel.set(action);

      // Assert
      expect(sentinel.getJabsAction()).toBe(action);
    });

    it('reset clears the assigned action', () =>
    {
      // Arrange
      sentinel.set({ direction: () => 2 });

      // Act
      sentinel.reset();

      // Assert
      expect(sentinel.getJabsAction()).toBeNull();
    });

    it('reset also clears the vertical center offset', () =>
    {
      // Arrange
      sentinel.set({ direction: () => 2 });
      sentinel.setVerticalCenterOffset(20);
      sentinel.setPosition(1, 1);

      // Act
      sentinel.reset();
      sentinel.set({ direction: () => 2 });

      // Assert- with the offset reset to 0, screenY loses the 20px lift.
      expect(sentinel.screenY()).toBe((1 * 48) + 7 - 3 - 0);
    });
  });

  describe('setPosition / groundScreenPosition', () =>
  {
    it('reflects the located world position via the wrapped headless character', () =>
    {
      // Arrange
      sentinel.setPosition(3, 4);

      // Act
      const result = sentinel.groundScreenPosition();

      // Assert
      expect(result).toEqual({ x: 3 * 48, y: 4 * 48 });
    });
  });

  describe('screenX', () =>
  {
    it('cancels out the melee origin x offset for the action\'s facing', () =>
    {
      // Arrange
      sentinel.setPosition(2, 0);
      sentinel.set({ direction: () => 6 });

      // Act
      const result = sentinel.screenX();

      // Assert
      expect(result).toBe((2 * 48) - 5);
      expect(globalThis.JABS_Engine.resolveMeleeOriginPixelOffsetsForFacing).toHaveBeenCalledWith(6);
    });
  });

  describe('screenY', () =>
  {
    it('cancels the melee origin y offset and applies the vertical lift and center offset', () =>
    {
      // Arrange
      sentinel.setPosition(0, 2);
      sentinel.set({ direction: () => 8 });
      sentinel.setVerticalCenterOffset(10);

      // Act
      const result = sentinel.screenY();

      // Assert- character screenY (96) + lift (7) - oy (3) - centerOffset (10).
      expect(result).toBe((2 * 48) + 7 - 3 - 10);
      expect(globalThis.JABS_Engine.resolveMeleeOriginPixelOffsetsForFacing).toHaveBeenCalledWith(8);
      expect(globalThis.JABS_Engine.resolveMeleeVerticalLiftPxForFacing).toHaveBeenCalledWith(8);
    });
  });
});
//endregion plugins/abs/ext/targeting/_models/jabs-targeting-sentinel-action.test.js
