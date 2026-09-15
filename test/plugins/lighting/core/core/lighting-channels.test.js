//region plugins/lighting/core/core/lighting-channels.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('LightingChannels', () =>
{
  let LightingChannels;

  beforeAll(async () =>
  {
    vi.resetModules();

    // the channel rules are pure- no metadata, no engine globals, nothing to install.
    ({ default: LightingChannels } =
      await import('../../../../../src/plugins/lighting/core/core/LightingChannels.js'));
  });

  describe('all', () =>
  {
    it('reports every channel a source is allowed to write', () =>
    {
      // Arrange
      // Act
      const result = LightingChannels.all();

      // Assert
      expect(result).toEqual([ 'tone', 'ambient', 'ambientColor' ]);
    });
  });

  describe('identityFor', () =>
  {
    it('hands back a full rgba quad for tone', () =>
    {
      // Arrange
      // Act
      const result = LightingChannels.identityFor(LightingChannels.TONE);

      // Assert
      expect(result).toEqual([ 0, 0, 0, 0 ]);
    });

    it('hands back an rgb triplet for the colour of the dark', () =>
    {
      // Arrange
      // Act
      const result = LightingChannels.identityFor(LightingChannels.AMBIENT_COLOR);

      // Assert
      expect(result).toEqual([ 0, 0, 0 ]);
    });

    it('hands back no darkness at all for ambient', () =>
    {
      // Arrange
      // Act
      const result = LightingChannels.identityFor(LightingChannels.AMBIENT);

      // Assert
      expect(result).toBe(0);
    });

    it('hands back a fresh array each time, so one frame cannot corrupt the next', () =>
    {
      // Arrange
      const first = LightingChannels.identityFor(LightingChannels.TONE);

      // Act
      first[0] = 12345;
      const second = LightingChannels.identityFor(LightingChannels.TONE);

      // Assert
      expect(second).toEqual([ 0, 0, 0, 0 ]);
    });
  });

  describe('combine', () =>
  {
    it('compounds darkness by multiplying the light each source leaves behind', () =>
    {
      // Arrange
      // Act
      const result = LightingChannels.combine(LightingChannels.AMBIENT, 0.3, 0.4);

      // Assert
      // 30% dark leaves 0.7, 40% dark leaves 0.6, and 0.7 x 0.6 is 0.42 of the light surviving.
      expect(result).toBeCloseTo(0.58, 10);
    });

    it('leaves darkness untouched when the incoming source takes nothing away', () =>
    {
      // Arrange
      // Act
      const result = LightingChannels.combine(LightingChannels.AMBIENT, 0.85, 0);

      // Assert
      expect(result).toBeCloseTo(0.85, 10);
    });

    it('never exceeds total darkness however much is piled on', () =>
    {
      // Arrange
      // Act
      const result = LightingChannels.combine(LightingChannels.AMBIENT, 1, 0.2);

      // Assert
      expect(result).toBe(1);
    });

    it('lets the incoming tone claim the channel outright rather than summing', () =>
    {
      // Arrange
      const accumulated = [ -100, -100, -30, 100 ];
      const contribution = [ 68, -34, -34, 0 ];

      // Act
      const result = LightingChannels.combine(LightingChannels.TONE, accumulated, contribution);

      // Assert
      // a red cutscene tint at night should read as red, not as red plus blue.
      expect(result).toEqual([ 68, -34, -34, 0 ]);
    });

    it('lets the incoming colour of dark claim the channel outright rather than blending', () =>
    {
      // Arrange
      const accumulated = [ 0, 0, 0 ];
      const contribution = [ 10, 42, 42 ];

      // Act
      const result = LightingChannels.combine(LightingChannels.AMBIENT_COLOR, accumulated, contribution);

      // Assert
      expect(result).toEqual([ 10, 42, 42 ]);
    });
  });
});
//endregion plugins/lighting/core/core/lighting-channels.test.js