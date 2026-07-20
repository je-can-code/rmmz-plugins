//region plugins/abs/core/models/jabs-location-builder.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_LocationBuilder (direct src import)', () =>
{
  let JABS_LocationBuilder;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        Directions: {
          UP: 8, DOWN: 2, LEFT: 4, RIGHT: 6,
          LOWERLEFT: 1, LOWERRIGHT: 3, UPPERLEFT: 7, UPPERRIGHT: 9,
        },
      },
    };

    ({ default: JABS_LocationBuilder } = await import('../../../../../src/plugins/abs/core/models/JABS_LocationBuilder.js'));
  });

  let builder;

  beforeEach(() =>
  {
    builder = new JABS_LocationBuilder();
  });

  describe('build/clear', () =>
  {
    it('builds a JABS_Location carrying the set x/y/direction', () =>
    {
      // Arrange
      builder.setX(3)
        .setY(4)
        .setDirection(2);

      // Act
      const location = builder.build();

      // Assert
      expect(location.x).toBe(3);
      expect(location.y).toBe(4);
      expect(location.d).toBe(2);
    });

    it('clears the internal state after building', () =>
    {
      // Arrange
      builder.setX(3)
        .setY(4)
        .setDirection(2);
      builder.build();

      // Act
      const second = builder.build();

      // Assert
      expect(second.x).toBeNull();
      expect(second.y).toBeNull();
      expect(second.d).toBeNull();
    });

    it('clear returns the builder itself for chaining', () =>
    {
      expect(builder.clear()).toBe(builder);
    });
  });

  describe('setX/setY/setDirection', () =>
  {
    it('each returns the builder itself for fluent chaining', () =>
    {
      expect(builder.setX(1)).toBe(builder);
      expect(builder.setY(1)).toBe(builder);
      expect(builder.setDirection(1)).toBe(builder);
    });
  });

  describe('facing* helpers', () =>
  {
    it.each([
      [ 'facingUp', 8 ],
      [ 'facingUpperLeft', 7 ],
      [ 'facingUpperRight', 9 ],
      [ 'facingLeft', 4 ],
      [ 'facingRight', 6 ],
      [ 'facingLowerLeft', 1 ],
      [ 'facingLowerRight', 3 ],
      [ 'facingDown', 2 ],
    ])('%s sets direction to %i and returns the builder', (method, expectedDirection) =>
    {
      const result = builder[method]();
      expect(result).toBe(builder);
      expect(builder.build().d).toBe(expectedDirection);
    });
  });

  describe('faceSame', () =>
  {
    it('copies the target location\'s facing', () =>
    {
      const target = { d: 6 };
      builder.faceSame(target);
      expect(builder.build().d).toBe(6);
    });
  });

  describe('faceReverse', () =>
  {
    it.each([
      [ 'LOWERLEFT', 9 ],
      [ 'DOWN', 8 ],
      [ 'LOWERRIGHT', 7 ],
      [ 'LEFT', 6 ],
      [ 'RIGHT', 4 ],
      [ 'UPPERLEFT', 3 ],
      [ 'UP', 2 ],
      [ 'UPPERRIGHT', 1 ],
    ])('reverses %s to the opposite direction', (directionKey, expectedReverse) =>
    {
      const target = { d: globalThis.J.ABS.Directions[directionKey] };
      builder.faceReverse(target);
      expect(builder.build().d).toBe(expectedReverse);
    });

    it('warns and defaults to facing up when the target direction is null', () =>
    {
      const warnSpy = vi.spyOn(console, 'warn')
        .mockImplementation(() => {});
      const target = { d: null };

      builder.faceReverse(target);

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(builder.build().d).toBe(8);
      warnSpy.mockRestore();
    });
  });
});
//endregion plugins/abs/core/models/jabs-location-builder.test.js
