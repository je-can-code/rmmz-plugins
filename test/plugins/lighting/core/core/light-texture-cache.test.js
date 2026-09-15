//region plugins/lighting/core/core/light-texture-cache.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { installLightingHostGlobals } from '../../fixtures/install-lighting-host-globals.js';

describe('LightTextureCache', () =>
{
  let LightTextureCache;
  let LightDeclaration;
  let drawnGradients;

  const torch = { id: 'torch' };

  /**
   * Installs a `Bitmap` that records what was drawn into it rather than drawing anything.
   *
   * The real one needs a canvas. What matters here is not the pixels but the calls: which colour
   * stops were asked for, and whether the texture was told it had changed.
   */
  const installRecordingBitmap = () =>
  {
    drawnGradients = [];

    globalThis.Bitmap = class
    {
      constructor(width, height)
      {
        this.width = width;
        this.height = height;
        this.updateCount = 0;
        this.baseTexture = { update: () => { this.updateCount += 1; } };

        const stops = [];
        this.context = {
          createRadialGradient: (...args) =>
          {
            const gradient = { args, stops };
            drawnGradients.push(gradient);

            return { addColorStop: (offset, color) => stops.push({ offset, color }) };
          },
          fillRect: () => {},
        };
      }
    };
  };

  beforeAll(async () =>
  {
    vi.resetModules();
    installLightingHostGlobals();
    installRecordingBitmap();

    ({ default: LightTextureCache } =
      await import('../../../../../src/plugins/lighting/core/core/LightTextureCache.js'));
    ({ default: LightDeclaration } =
      await import('../../../../../src/plugins/lighting/core/models/LightDeclaration.js'));
  });

  beforeEach(() =>
  {
    LightTextureCache.clear();
    drawnGradients = [];
  });

  it('draws a light the first time one of its appearance is asked for', () =>
  {
    // Arrange
    const declaration = new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1');

    // Act
    const result = LightTextureCache.forDeclaration(declaration);

    // Assert
    expect(result).toBeDefined();
    expect(LightTextureCache.size()).toBe(1);
  });

  it('sizes the picture to the full width of the light, converted from tiles', () =>
  {
    // Arrange
    const declaration = new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1');

    // Act
    const result = LightTextureCache.forDeclaration(declaration);

    // Assert
    expect(result.width).toBe(384);
    expect(result.height).toBe(384);
  });

  it('tells the texture it changed, or the light renders as an empty square', () =>
  {
    // Arrange
    const declaration = new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1');

    // Act
    const result = LightTextureCache.forDeclaration(declaration);

    // Assert
    // drawing through the raw context bypasses every Bitmap method that would have done this.
    expect(result.updateCount).toBe(1);
  });

  it('falls off from the light colour to black, so the corners add nothing', () =>
  {
    // Arrange
    const declaration = new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1');

    // Act
    LightTextureCache.forDeclaration(declaration);
    const [ gradient ] = drawnGradients;

    // Assert
    expect(gradient.stops.at(0)).toEqual({ offset: 0, color: '#ffbb73' });
    expect(gradient.stops.at(-1)).toEqual({ offset: 1, color: '#000000' });
  });

  it('bends the falloff with a midpoint, rather than running straight to black', () =>
  {
    // Arrange
    const declaration = new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1');

    // Act
    LightTextureCache.forDeclaration(declaration);
    const [ gradient ] = drawnGradients;

    // Assert
    // a gradient in one step reads as a flat disc with a hard edge.
    expect(gradient.stops).toHaveLength(3);
    expect(gradient.stops.at(1).color).toBe('rgb(89,65,40)');
  });

  it('hands back the same picture for a second light of identical appearance', () =>
  {
    // Arrange
    const first = new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1');
    const second = new LightDeclaration(4, '#ffbb73', 0, 'flicker', { id: 'other' }, 'page:2');

    // Act
    const firstTexture = LightTextureCache.forDeclaration(first);
    const secondTexture = LightTextureCache.forDeclaration(second);

    // Assert
    // this is the entire performance claim; an assertion that only checked the picture looked right
    // would pass just as happily if it had been drawn twice.
    expect(secondTexture).toBe(firstTexture);
    expect(LightTextureCache.size()).toBe(1);
    expect(drawnGradients).toHaveLength(1);
  });

  it('draws a second picture for a light of a different radius', () =>
  {
    // Arrange
    const first = new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1');
    const second = new LightDeclaration(6, '#ffbb73', 0, 'steady', torch, 'page:2');

    // Act
    LightTextureCache.forDeclaration(first);
    LightTextureCache.forDeclaration(second);

    // Assert
    expect(LightTextureCache.size()).toBe(2);
  });

  it('draws a second picture for a light of a different colour', () =>
  {
    // Arrange
    const first = new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1');
    const second = new LightDeclaration(4, '#ff7572', 0, 'steady', torch, 'page:2');

    // Act
    LightTextureCache.forDeclaration(first);
    LightTextureCache.forDeclaration(second);

    // Assert
    expect(LightTextureCache.size()).toBe(2);
  });

  it('draws a second picture for a light of a different intensity', () =>
  {
    // Arrange
    const soft = new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1');
    const hard = new LightDeclaration(4, '#ffbb73', 1, 'steady', torch, 'page:2');

    // Act
    LightTextureCache.forDeclaration(soft);
    LightTextureCache.forDeclaration(hard);

    // Assert
    // intensity decides the falloff, so two lights differing in it are genuinely different pictures.
    expect(LightTextureCache.size()).toBe(2);
  });

  it('shares one picture between lights that differ only in how they animate', () =>
  {
    // Arrange
    const steady = new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1');
    const guttering = new LightDeclaration(4, '#ffbb73', 0, 'flicker', torch, 'page:2');

    // Act
    LightTextureCache.forDeclaration(steady);
    LightTextureCache.forDeclaration(guttering);

    // Assert
    // an effect moves a sprite's alpha and never touches the texture, which is the whole reason it
    // is kept out of the key.
    expect(LightTextureCache.size()).toBe(1);
  });

  it('flattens the falloff as intensity rises', () =>
  {
    // Arrange
    LightTextureCache.forDeclaration(new LightDeclaration(4, '#ffffff', 0, 'steady', torch, 'page:1'));
    const [ soft ] = drawnGradients;
    drawnGradients = [];

    // Act
    LightTextureCache.forDeclaration(new LightDeclaration(4, '#ffffff', 1, 'steady', torch, 'page:2'));
    const [ hard ] = drawnGradients;

    // Assert
    // a flat disc holds full brightness almost to the rim; a soft pool gives it up halfway.
    expect(hard.stops.at(1).offset).toBeGreaterThan(soft.stops.at(1).offset);
    expect(hard.stops.at(1).color).toBe('rgb(255,255,255)');
  });

  describe('clear', () =>
  {
    it('forgets every picture it had drawn', () =>
    {
      // Arrange
      LightTextureCache.forDeclaration(new LightDeclaration(4, '#ffbb73', 0, 'steady', torch, 'page:1'));

      // Act
      LightTextureCache.clear();

      // Assert
      expect(LightTextureCache.size()).toBe(0);
    });
  });
});
//endregion plugins/lighting/core/core/light-texture-cache.test.js