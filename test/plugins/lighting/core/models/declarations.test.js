//region plugins/lighting/core/models/declarations.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installLightingHostGlobals } from '../../fixtures/install-lighting-host-globals.js';

describe('lighting declarations', () =>
{
  let AmbientDeclaration;
  let LightDeclaration;
  let ToneDeclaration;

  // stand-ins for two different characters. identity is all these need to carry, and using two of
  // them is what lets a test tell "the same light on somebody else" apart from "the same light".
  const torch = { id: 'torch' };
  const otherTorch = { id: 'otherTorch' };

  beforeAll(async () =>
  {
    vi.resetModules();
    installLightingHostGlobals();

    ({ default: AmbientDeclaration } =
      await import('../../../../../src/plugins/lighting/core/models/AmbientDeclaration.js'));
    ({ default: LightDeclaration } =
      await import('../../../../../src/plugins/lighting/core/models/LightDeclaration.js'));
    ({ default: ToneDeclaration } =
      await import('../../../../../src/plugins/lighting/core/models/ToneDeclaration.js'));
  });

  describe('AmbientDeclaration', () =>
  {
    it('reports everything it was built with', () =>
    {
      // Arrange
      // Act
      const declaration = new AmbientDeclaration(0.85, [ 10, 42, 42 ], true, 'map');

      // Assert
      expect(declaration.darkness()).toBe(0.85);
      expect(declaration.color()).toEqual([ 10, 42, 42 ]);
      expect(declaration.hasDeclaredColor()).toBe(true);
      expect(declaration.sourceKey()).toBe('map');
    });

    it('matches an identical declaration, so re-arriving on a map changes nothing', () =>
    {
      // Arrange
      const first = new AmbientDeclaration(0.6, [ 0, 0, 0 ], false, 'map');
      const second = new AmbientDeclaration(0.6, [ 0, 0, 0 ], false, 'map');

      // Act
      const result = first.matches(second);

      // Assert
      expect(result).toBe(true);
    });

    it('does not match a declaration asking for a different darkness', () =>
    {
      // Arrange
      const first = new AmbientDeclaration(0.6, [ 0, 0, 0 ], false, 'map');
      const second = new AmbientDeclaration(0.85, [ 0, 0, 0 ], false, 'map');

      // Act
      const result = first.matches(second);

      // Assert
      expect(result).toBe(false);
    });

    it('does not match the same darkness declared by somebody else', () =>
    {
      // Arrange
      const first = new AmbientDeclaration(0.6, [ 0, 0, 0 ], false, 'map');
      const second = new AmbientDeclaration(0.6, [ 0, 0, 0 ], false, 'time');

      // Act
      const result = first.matches(second);

      // Assert
      expect(result).toBe(false);
    });

    it('does not match when one states a colour and the other merely defaulted to it', () =>
    {
      // Arrange
      const stated = new AmbientDeclaration(0.6, [ 0, 0, 0 ], true, 'map');
      const defaulted = new AmbientDeclaration(0.6, [ 0, 0, 0 ], false, 'map');

      // Act
      const result = stated.matches(defaulted);

      // Assert
      expect(result).toBe(false);
    });

    it('does not match a declaration whose dark is a different colour', () =>
    {
      // Arrange
      const first = new AmbientDeclaration(0.6, [ 10, 42, 42 ], true, 'map');
      const second = new AmbientDeclaration(0.6, [ 42, 42, 10 ], true, 'map');

      // Act
      const result = first.matches(second);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('LightDeclaration', () =>
  {
    it('reports everything it was built with', () =>
    {
      // Arrange
      // Act
      const declaration = new LightDeclaration(6, '#ffbb73', 0, 'flicker', torch, 'page:7');

      // Assert
      expect(declaration.radius()).toBe(6);
      expect(declaration.color()).toBe('#ffbb73');
      expect(declaration.effect()).toBe('flicker');
      expect(declaration.character()).toBe(torch);
      expect(declaration.sourceKey()).toBe('page:7');
    });

    it('keys its texture on the two things that shape the picture', () =>
    {
      // Arrange
      // Act
      const declaration = new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1');

      // Assert
      expect(declaration.textureKey()).toBe('4:#ffbb73:0');
    });

    it('shares a texture key with an identical light on a different character', () =>
    {
      // Arrange
      const first = new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1');
      const second = new LightDeclaration(4, '#ffbb73', 0, 'steady', otherTorch, 'page:2');

      // Act
      const result = first.textureKey() === second.textureKey();

      // Assert
      // this is the whole performance claim: forty-seven identical torches cost one drawing.
      expect(result).toBe(true);
    });

    it('keys a guttering light the same as a steady one of the same appearance', () =>
    {
      // Arrange
      const steady = new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1');
      const guttering = new LightDeclaration(4, '#ffbb73', 0, 'flicker', torch, 'page:1');

      // Act
      const result = steady.textureKey() === guttering.textureKey();

      // Assert
      // flicker is animated by changing a sprite's alpha, so both are the same picture.
      expect(result).toBe(true);
    });

    it('matches an identical declaration, so a page refresh changes nothing', () =>
    {
      // Arrange
      const first = new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1');
      const second = new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1');

      // Act
      const result = first.matches(second);

      // Assert
      expect(result).toBe(true);
    });

    it('does not match a light of a different size', () =>
    {
      // Arrange
      const first = new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1');
      const second = new LightDeclaration(6, '#ffbb73', 0, 'steady', torch, 'page:1');

      // Act
      const result = first.matches(second);

      // Assert
      expect(result).toBe(false);
    });

    it('does not match when one gutters and the other burns steadily', () =>
    {
      // Arrange
      const steady = new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1');
      const guttering = new LightDeclaration(4, '#ffbb73', 0, 'flicker', torch, 'page:1');

      // Act
      const result = steady.matches(guttering);

      // Assert
      expect(result).toBe(false);
    });

    it('does not match a light of a different intensity', () =>
    {
      // Arrange
      const soft = new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1');
      const hard = new LightDeclaration(4, '#ffbb73', 1, 'steady', torch, 'page:1');

      // Act
      const result = soft.matches(hard);

      // Assert
      expect(result).toBe(false);
    });

    it('does not match a light that behaves differently', () =>
    {
      // Arrange
      const steady = new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1');
      const pulsing = new LightDeclaration(4, '#ffbb73', 0, 'pulse', torch, 'page:1');

      // Act
      const result = steady.matches(pulsing);

      // Assert
      expect(result).toBe(false);
    });

    it('keys its texture on intensity too, since that changes the picture', () =>
    {
      // Arrange
      // Act
      const declaration = new LightDeclaration(4, '#ffbb73', 0.5, 'pulse', torch, 'page:1');

      // Assert
      expect(declaration.textureKey()).toBe('4:#ffbb73:0.5');
    });

    it('keeps its behaviour out of the texture key, since that changes nothing drawn', () =>
    {
      // Arrange
      const steady = new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1');
      const pulsing = new LightDeclaration(4, '#ffbb73', 0, 'pulse', torch, 'page:2');

      // Act
      const result = steady.textureKey() === pulsing.textureKey();

      // Assert
      expect(result).toBe(true);
    });

    it('does not match the same light burning on somebody else', () =>
    {
      // Arrange
      const first = new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1');
      const second = new LightDeclaration(4, '#ffbb73', 0, 'steady', otherTorch, 'page:1');

      // Act
      const result = first.matches(second);

      // Assert
      expect(result).toBe(false);
    });

    it('does not match the same light declared by somebody else', () =>
    {
      // Arrange
      const first = new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1');
      const second = new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'player');

      // Act
      const result = first.matches(second);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('ToneDeclaration', () =>
  {
    it('reports everything it was built with', () =>
    {
      // Arrange
      // Act
      const declaration = new ToneDeclaration([ 68, -34, -34, 0 ], 60, 'command');

      // Assert
      expect(declaration.tone()).toEqual([ 68, -34, -34, 0 ]);
      expect(declaration.durationFrames()).toBe(60);
      expect(declaration.sourceKey()).toBe('command');
    });

    it('reads a tone with every channel at rest as a withdrawal', () =>
    {
      // Arrange
      // Act
      const declaration = new ToneDeclaration([ 0, 0, 0, 0 ], 60, 'command');

      // Assert
      expect(declaration.isNeutral()).toBe(true);
    });

    it('does not read a tone with a single live channel as a withdrawal', () =>
    {
      // Arrange
      // Act
      const declaration = new ToneDeclaration([ 0, 0, 0, 1 ], 60, 'command');

      // Assert
      expect(declaration.isNeutral()).toBe(false);
    });

    it('matches an identical declaration, so re-tinting the same colour changes nothing', () =>
    {
      // Arrange
      const first = new ToneDeclaration([ 68, -34, -34, 0 ], 60, 'command');
      const second = new ToneDeclaration([ 68, -34, -34, 0 ], 60, 'command');

      // Act
      const result = first.matches(second);

      // Assert
      expect(result).toBe(true);
    });

    it('does not match the same colour asked for over a different span of frames', () =>
    {
      // Arrange
      const first = new ToneDeclaration([ 68, -34, -34, 0 ], 60, 'command');
      const second = new ToneDeclaration([ 68, -34, -34, 0 ], 300, 'command');

      // Act
      const result = first.matches(second);

      // Assert
      expect(result).toBe(false);
    });

    it('does not match the same request from somebody else', () =>
    {
      // Arrange
      const first = new ToneDeclaration([ 68, -34, -34, 0 ], 60, 'command');
      const second = new ToneDeclaration([ 68, -34, -34, 0 ], 60, 'time');

      // Act
      const result = first.matches(second);

      // Assert
      expect(result).toBe(false);
    });

    it('does not match a journey toward a different colour', () =>
    {
      // Arrange
      const first = new ToneDeclaration([ 68, -34, -34, 0 ], 60, 'command');
      const second = new ToneDeclaration([ 68, -34, -34, 9 ], 60, 'command');

      // Act
      const result = first.matches(second);

      // Assert
      expect(result).toBe(false);
    });
  });
});
//endregion plugins/lighting/core/models/declarations.test.js