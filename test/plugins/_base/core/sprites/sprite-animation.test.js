//region plugins/_base/core/sprites/sprite-animation.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The coordinate conversions that keep Effekseer animations placed once the renderer runs above a
 * resolution of one.
 *
 * Effekseer is handed a raw WebGL viewport rather than anything PIXI mediates, so it is the one
 * place in the engine that has to be told about framebuffer pixels by hand. Vanilla mixes stage
 * coordinates and framebuffer coordinates in the same sum without noticing, because at a resolution
 * of one they are the same number - which means every case here has to be exercised at a resolution
 * that is *not* one, or the test agrees with the bug.
 */
describe('Sprite_Animation device resolution (direct src import)', () =>
{
  /** @type {Function} */
  let originalTargetSpritePosition;

  /** @type {Object} */
  let sprite;

  /** @type {Object} */
  let renderer;

  beforeAll(async () =>
  {
    globalThis.J = { BASE: { Aliased: { Sprite_Animation: new Map() } } };

    function Sprite_Animation()
    {
    }

    originalTargetSpritePosition = vi.fn();
    Sprite_Animation.prototype.targetSpritePosition = originalTargetSpritePosition;

    // vanilla's own averaging loop, which is what the augment expects to be wrapping.
    Sprite_Animation.prototype.targetPosition = function()
    {
      const first = this.targetSpritePosition(this._targets[0]);

      return { x: first.x, y: first.y };
    };
    globalThis.Sprite_Animation = Sprite_Animation;

    globalThis.Graphics = {
      deviceScale: 1.5,
      effekseer: { setProjectionMatrix: vi.fn() },
    };

    await import('../../../../../src/plugins/_base/core/sprites/Sprite_Animation.js');
  });

  beforeEach(() =>
  {
    originalTargetSpritePosition.mockReset();
    globalThis.Graphics.effekseer.setProjectionMatrix.mockReset();

    renderer = {
      gl: { viewport: vi.fn() },
      view: { width: 2880, height: 1200 },
    };

    sprite = Object.create(globalThis.Sprite_Animation.prototype);
    sprite._viewportSize = 400;
    sprite._mirror = false;
    sprite._animation = { displayType: 1, offsetX: 40, offsetY: 20 };
  });

  describe('viewportSize', () =>
  {
    it('hands back the size of the square the animation renders into', () =>
    {
      // Arrange - done in beforeEach.

      // Act.
      const result = sprite.viewportSize();

      // Assert.
      expect(result).toBe(400);
    });
  });

  describe('mirror', () =>
  {
    it('hands back whether the animation is flipped', () =>
    {
      // Arrange.
      sprite._mirror = true;

      // Act.
      const result = sprite.mirror();

      // Assert.
      expect(result).toBe(true);
    });
  });

  describe('targetSpritePosition', () =>
  {
    it('converts a target sprite position out of stage pixels and into framebuffer ones', () =>
    {
      // Arrange - a sprite's worldTransform is stage space, which the renderer's resolution does
      // not touch.
      originalTargetSpritePosition.mockReturnValue({ x: 100, y: 200 });

      // Act.
      const result = sprite.targetSpritePosition({ name: 'a-target' });

      // Assert.
      expect(result).toEqual({ x: 150, y: 300 });
    });

    it('is the seam the conversion lives on, so a replaced targetPosition still gets scaled', () =>
    {
      // Arrange - exactly what J-ABS does: reimplement the averaging loop rather than delegate,
      // which is why a correction placed in `targetPosition` would never run for a map animation.
      originalTargetSpritePosition.mockReturnValue({ x: 100, y: 200 });
      globalThis.Sprite_Animation.prototype.targetPosition = function(activeRenderer)
      {
        const first = this.targetSpritePosition(this._targets[0]);

        return { x: first.x, y: first.y, renderer: activeRenderer };
      };
      sprite._targets = [ { name: 'a-target' } ];

      // Act.
      const result = sprite.targetPosition(renderer);

      // Assert - the reimplementation never scaled anything, and the position is scaled anyway.
      expect(result.x).toBe(150);
      expect(result.y).toBe(300);
    });
  });

  describe('setViewport', () =>
  {
    it('scales every term of the viewport box into framebuffer pixels', () =>
    {
      // Arrange - a target-anchored animation, whose position is converted on its way through
      // `targetSpritePosition`.
      originalTargetSpritePosition.mockReturnValue({ x: 100, y: 200 });
      sprite._targets = [ { name: 'a-target' } ];

      // Act.
      sprite.setViewport(renderer);

      // Assert - a 400 box at 1.5 is 600 wide; the offsets and the target scale with it.
      expect(renderer.gl.viewport).toHaveBeenCalledWith(-90, 30, 600, 600);
    });
  });

  describe('setProjectionMatrix', () =>
  {
    it('scales the viewport size so the perspective ratio survives the resolution', () =>
    {
      // Arrange - done in beforeEach; the view height is already a framebuffer size.

      // Act.
      sprite.setProjectionMatrix(renderer);

      // Assert - 400 scaled to 600 over a 1200 framebuffer is the same ratio vanilla had at 1:1.
      expect(globalThis.Graphics.effekseer.setProjectionMatrix).toHaveBeenCalledWith([
        1, 0, 0, 0,
        0, -1, 0, 0,
        0, 0, 1, -0.5,
        0, 0, 0, 1,
      ]);
    });

    it('flips the horizontal term for a mirrored animation', () =>
    {
      // Arrange.
      sprite._mirror = true;

      // Act.
      sprite.setProjectionMatrix(renderer);

      // Assert - only the first term differs, which is what mirroring means here.
      expect(globalThis.Graphics.effekseer.setProjectionMatrix).toHaveBeenCalledWith([
        -1, 0, 0, 0,
        0, -1, 0, 0,
        0, 0, 1, -0.5,
        0, 0, 0, 1,
      ]);
    });
  });
});
//endregion plugins/_base/core/sprites/sprite-animation.test.js