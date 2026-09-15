//region plugins/lighting/core/models/lighting-composition.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('LightingComposition', () =>
{
  let LightingComposition;

  beforeAll(async () =>
  {
    vi.resetModules();

    ({ default: LightingComposition } =
      await import('../../../../../src/plugins/lighting/core/models/LightingComposition.js'));
  });

  it('reports the tone it was composed with', () =>
  {
    // Arrange
    // Act
    const composition = new LightingComposition([ -100, -100, -30, 100 ], 0.6, [ 10, 42, 42 ], []);

    // Assert
    expect(composition.tone()).toEqual([ -100, -100, -30, 100 ]);
  });

  it('reports the darkness it was composed with', () =>
  {
    // Arrange
    // Act
    const composition = new LightingComposition([ 0, 0, 0, 0 ], 0.6, [ 0, 0, 0 ], []);

    // Assert
    expect(composition.darkness()).toBe(0.6);
  });

  it('reports the colour of the dark it was composed with', () =>
  {
    // Arrange
    // Act
    const composition = new LightingComposition([ 0, 0, 0, 0 ], 0.6, [ 10, 42, 42 ], []);

    // Assert
    expect(composition.ambientColor()).toEqual([ 10, 42, 42 ]);
  });

  it('reports every light it was composed with', () =>
  {
    // Arrange
    const lights = [ { id: 'torch' }, { id: 'lantern' } ];

    // Act
    const composition = new LightingComposition([ 0, 0, 0, 0 ], 0.6, [ 0, 0, 0 ], lights);

    // Assert
    expect(composition.lights()).toBe(lights);
  });

  describe('hasMask', () =>
  {
    it('needs no mask when nowhere has said it is dark', () =>
    {
      // Arrange
      // Act
      const composition = new LightingComposition([ 0, 0, 0, 0 ], 0, [ 0, 0, 0 ], []);

      // Assert
      // every map authored before this plugin existed takes this exit.
      expect(composition.hasMask()).toBe(false);
    });

    it('still needs no mask when lights burn somewhere nobody called dark', () =>
    {
      // Arrange
      const lights = [ { id: 'torch' } ];

      // Act
      const composition = new LightingComposition([ 0, 0, 0, 0 ], 0, [ 0, 0, 0 ], lights);

      // Assert
      // a torch in a well-lit room has nothing to reveal, and must not put a glow on two hundred
      // existing events the moment this plugin is installed.
      expect(composition.hasMask()).toBe(false);
    });

    it('needs a mask as soon as any darkness at all is stated', () =>
    {
      // Arrange
      // Act
      const composition = new LightingComposition([ 0, 0, 0, 0 ], 0.01, [ 0, 0, 0 ], []);

      // Assert
      expect(composition.hasMask()).toBe(true);
    });

    it('needs a mask in total darkness', () =>
    {
      // Arrange
      // Act
      const composition = new LightingComposition([ 0, 0, 0, 0 ], 1, [ 0, 0, 0 ], []);

      // Assert
      expect(composition.hasMask()).toBe(true);
    });
  });
});
//endregion plugins/lighting/core/models/lighting-composition.test.js