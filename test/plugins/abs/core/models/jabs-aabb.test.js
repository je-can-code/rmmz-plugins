//region plugins/abs/core/models/jabs-aabb.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * JABS_Aabb.js has zero imports- a pure, self-contained geometry class- so this file dynamically
 * imports it directly with no mocking required.
 */
describe('JABS_Aabb (unit, pure/no dependencies)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/models/JABS_Aabb.js').default} */
  let JABS_Aabb;

  beforeAll(async () =>
  {
    ({ default: JABS_Aabb } = await import('../../../../../src/plugins/abs/core/models/JABS_Aabb.js'));
  });

  describe('constructor', () =>
  {
    it('derives the center coordinates from position and size', () =>
    {
      const box = new JABS_Aabb(10, 20, 4, 6);

      expect(box.cx).toEqual(12);
      expect(box.cy).toEqual(23);
    });
  });

  describe('fromFeet()', () =>
  {
    it('builds a rect anchored above the feet origin', () =>
    {
      const box = JABS_Aabb.fromFeet(100, 100, 20, 40);

      expect(box.x).toEqual(90);
      expect(box.y).toEqual(60);
      expect(box.w).toEqual(20);
      expect(box.h).toEqual(40);
    });
  });

  describe('centerSized()', () =>
  {
    it('builds a rect centered at the given point', () =>
    {
      const box = JABS_Aabb.centerSized(50, 50, 10, 10);

      expect(box.x).toEqual(45);
      expect(box.y).toEqual(45);
    });
  });

  describe('intersectsRect()', () =>
  {
    it('returns true when rects overlap', () =>
    {
      const a = new JABS_Aabb(0, 0, 10, 10);
      const b = new JABS_Aabb(5, 5, 10, 10);

      expect(a.intersectsRect(b)).toEqual(true);
    });

    it('returns false when the other rect is entirely to the right', () =>
    {
      const a = new JABS_Aabb(0, 0, 10, 10);
      const b = new JABS_Aabb(20, 0, 10, 10);

      expect(a.intersectsRect(b)).toEqual(false);
    });

    it('returns false when the other rect is entirely to the left', () =>
    {
      const a = new JABS_Aabb(20, 0, 10, 10);
      const b = new JABS_Aabb(0, 0, 10, 10);

      expect(a.intersectsRect(b)).toEqual(false);
    });

    it('returns false when the other rect is entirely below', () =>
    {
      const a = new JABS_Aabb(0, 0, 10, 10);
      const b = new JABS_Aabb(0, 20, 10, 10);

      expect(a.intersectsRect(b)).toEqual(false);
    });

    it('returns false when the other rect is entirely above', () =>
    {
      const a = new JABS_Aabb(0, 20, 10, 10);
      const b = new JABS_Aabb(0, 0, 10, 10);

      expect(a.intersectsRect(b)).toEqual(false);
    });
  });

  describe('intersectsCircle()', () =>
  {
    it('returns true when the circle overlaps the rect', () =>
    {
      const box = new JABS_Aabb(0, 0, 10, 10);

      expect(box.intersectsCircle(5, 5, 1)).toEqual(true);
    });

    it('returns true when the circle just touches the rect edge', () =>
    {
      const box = new JABS_Aabb(0, 0, 10, 10);

      expect(box.intersectsCircle(15, 5, 5)).toEqual(true);
    });

    it('returns false when the circle is far from the rect', () =>
    {
      const box = new JABS_Aabb(0, 0, 10, 10);

      expect(box.intersectsCircle(100, 100, 1)).toEqual(false);
    });
  });

  describe('expanded()', () =>
  {
    it('returns a new, larger rect padded on all sides', () =>
    {
      const box = new JABS_Aabb(10, 10, 10, 10);
      const expandedBox = box.expanded(2, 3);

      expect(expandedBox.x).toEqual(8);
      expect(expandedBox.y).toEqual(7);
      expect(expandedBox.w).toEqual(14);
      expect(expandedBox.h).toEqual(16);
    });
  });
});
//endregion plugins/abs/core/models/jabs-aabb.test.js
