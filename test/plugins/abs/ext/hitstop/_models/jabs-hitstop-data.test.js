//region plugins/abs/ext/hitstop/_models/jabs-hitstop-data.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Hitstop JABS_HitstopData (unit, all downstream dependencies mocked)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/hitstop/_models/JABS_HitstopData.js').default} */
  let JABS_HitstopData;

  beforeAll(async () =>
  {
    vi.resetModules();

    // SerializableRegistry is a downstream dependency (a _base file); it's only touched at
    // module-load time to register the class for JsonEx save/load, not by any behavior under test.
    globalThis.SerializableRegistry = { register: vi.fn() };

    ({ default: JABS_HitstopData } = await import('../../../../../../src/plugins/abs/ext/hitstop/_models/JABS_HitstopData.js'));
  });

  it('registers itself with the serializable registry on module load', () =>
  {
    expect(globalThis.SerializableRegistry.register).toHaveBeenCalledWith(JABS_HitstopData);
  });

  describe('initMembers (via constructor)', () =>
  {
    it('starts with zero frames and no flurry windows', () =>
    {
      // Arrange / Act
      const data = new JABS_HitstopData();

      // Assert
      expect(data.getFrames()).toBe(0);
      expect(data.isActive()).toBe(false);
    });
  });

  describe('setFrames / getFrames', () =>
  {
    it('floors and clamps negative values to zero', () =>
    {
      // Arrange
      const data = new JABS_HitstopData();

      // Act
      data.setFrames(-5.7);

      // Assert
      expect(data.getFrames()).toBe(0);
    });

    it('floors positive fractional values', () =>
    {
      // Arrange
      const data = new JABS_HitstopData();

      // Act
      data.setFrames(4.9);

      // Assert
      expect(data.getFrames()).toBe(4);
    });
  });

  describe('isActive', () =>
  {
    it('is false when there are no remaining frames', () =>
    {
      const data = new JABS_HitstopData();
      expect(data.isActive()).toBe(false);
    });

    it('is true when there are remaining frames', () =>
    {
      const data = new JABS_HitstopData();
      data.setFrames(3);
      expect(data.isActive()).toBe(true);
    });
  });

  describe('tick', () =>
  {
    it('does not decrement below zero', () =>
    {
      // Arrange
      const data = new JABS_HitstopData();

      // Act
      data.tick();

      // Assert
      expect(data.getFrames()).toBe(0);
    });

    it('decrements the frame counter by one', () =>
    {
      // Arrange
      const data = new JABS_HitstopData();
      data.setFrames(3);

      // Act
      data.tick();

      // Assert
      expect(data.getFrames()).toBe(2);
    });

    it('decrements active flurry windows and removes them once elapsed', () =>
    {
      // Arrange
      const data = new JABS_HitstopData();
      data.flagFlurryWindow('action-1', 1);

      // Act
      data.tick();

      // Assert
      expect(data.isInFlurryWindow('action-1')).toBe(false);
    });

    it('persists a flurry window that has not yet elapsed', () =>
    {
      // Arrange
      const data = new JABS_HitstopData();
      data.flagFlurryWindow('action-1', 5);

      // Act
      data.tick();

      // Assert
      expect(data.isInFlurryWindow('action-1')).toBe(true);
    });
  });

  describe('flagFlurryWindow / isInFlurryWindow', () =>
  {
    it('flags an action uuid as within its flurry window', () =>
    {
      // Arrange
      const data = new JABS_HitstopData();

      // Act
      data.flagFlurryWindow('action-1', 10);

      // Assert
      expect(data.isInFlurryWindow('action-1')).toBe(true);
      expect(data.isInFlurryWindow('action-2')).toBe(false);
    });
  });
});
//endregion plugins/abs/ext/hitstop/_models/jabs-hitstop-data.test.js
