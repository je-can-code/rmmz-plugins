//region lighting-render-layer.test
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { repoRoot } from '../../../../setup/repo-root.js';
import { installMinimalDatabase, installRmmzViewLayer } from '../../../../setup/rmmz-view-harness.js';

/**
 * The light mask is the one part of this plugin that cannot be judged by logic alone.
 *
 * Everything else here is arithmetic - what colour, how dark, whose claim wins - and arithmetic can be
 * checked against a number. A sprite cannot. Handing a `Bitmap` to a sprite is not a property
 * assignment, and getting it wrong produces nothing a service-level test can see: the composer still
 * resolves the right lights, the declarations are still correct, and the game dies on its first frame
 * inside PIXI with a type error naming none of it.
 *
 * That is precisely the seam this harness exists for, and skipping it because the sprite layer is
 * excluded from coverage is how a plugin ships green and crashes on the title screen.
 */
describe('LightingRenderLayer (real view layer)', () =>
{
  beforeAll(() =>
  {
    // Arrange: the real engine and real PIXI, then J-Base, then lighting on top of it.
    installRmmzViewLayer();
    installMinimalDatabase();

    globalThis.$plugins = [];

    const realParameters = globalThis.PluginManager.parameters.bind(globalThis.PluginManager);

    globalThis.PluginManager.parameters = name =>
    {
      const found = globalThis.$plugins.find(plugin => plugin.name === name);

      return found
        ? found.parameters
        : realParameters(name);
    };

    /**
     * Evaluates one freshly built plugin bundle the way the game's index.html would.
     *
     * Read from `out/` rather than `project/js/plugins/`: the suite runs before the build is copied
     * across, so the committed mirror is a build behind during a `hotfix` and would happily pass a
     * test against code that no longer exists.
     * @param {string} relative The repo-relative path of the bundle.
     */
    const loadBundle = relative =>
    {
      const bundle = path.join(repoRoot, relative);

      vm.runInThisContext(fs.readFileSync(bundle, 'utf-8'), { filename: bundle });
    };

    loadBundle('out/base/J-Base.js');

    // the stub goes in *after* J-Base and *before* the plugin that reads through it. J-Base brings the
    // real loader with it, so installing this any earlier is installing something J-Base then replaces
    // - and the real one reaches for the consuming game's disk, which is not this repo.
    globalThis.ExternalJsonConfigLoader = {
      load: () => ({
        light: {
          radius: 5,
          color: '#FFFFFF',
          intensity: 0,
          effects: {
            flicker: { depth: 0.2, period: 40, chance: 0, variance: 0.18 },
            pulse: { depth: 0.45, period: 165, chance: 0, variance: 0.22 },
            glitch: { depth: 0.85, period: 55, chance: 0.28, variance: 0.12 },
          },
        },
        ambient: { color: '#000000' },
      }),
    };

    loadBundle('out/lighting/J-Lighting.js');

    // a light measured in tiles asks the map how wide one is, and only a real `Game_Map` reads that
    // from `$dataSystem` the way the running game does.
    globalThis.DataManager.createGameObjects();
  });

  beforeEach(() =>
  {
    globalThis.LightTextureCache.clear();
  });

  /**
   * A character standing somewhere, which is all a light needs from one.
   * @param {number} x Where it is, horizontally.
   * @param {number} y Where it is, vertically.
   * @returns {Object}
   */
  const aCharacterAt = (x, y) => ({
    screenX: () => x,
    screenY: () => y,
  });

  /**
   * Everything the composer would have resolved for one frame.
   * @param {LightDeclaration[]} lights Whatever is burning.
   * @param {number} darkness How much light is gone.
   * @returns {LightingComposition}
   */
  const aComposition = (lights, darkness = 0.85) =>
    new globalThis.LightingComposition([ 0, 0, 0, 0 ], darkness, [ 0, 0, 0 ], lights);

  it('gives a light a texture PIXI can actually render', () =>
  {
    // Arrange
    const layer = new globalThis.LightingRenderLayer(912, 720, 48);
    const torch = new globalThis.LightDeclaration(4, '#ffbb73', 0, 'steady', aCharacterAt(100, 200), 'page:1');

    // Act
    layer.syncTo(aComposition([ torch ]));
    const [ , sprite ] = layer.children;

    // Assert
    // a `Bitmap` is not a `Texture`, and PIXI reads straight through `texture.baseTexture` on the very
    // first frame - so a sprite carrying the wrong kind of thing throws before anything is drawn.
    expect(sprite.texture).toBeDefined();
    expect(sprite.texture.baseTexture).toBeDefined();
  });

  it('sizes the light to the picture it was given rather than to nothing', () =>
  {
    // Arrange
    const layer = new globalThis.LightingRenderLayer(912, 720, 48);
    const torch = new globalThis.LightDeclaration(4, '#ffbb73', 0, 'steady', aCharacterAt(0, 0), 'page:1');

    // Act
    layer.syncTo(aComposition([ torch ]));
    const [ , sprite ] = layer.children;

    // Assert
    // four tiles is 192px of reach, so a 384px picture; a frame left at zero renders an invisible
    // light and no error at all.
    expect(sprite.width).toBe(384);
    expect(sprite.height).toBe(384);
  });

  it('puts a light where its character is standing, offset by the overdrawn margin', () =>
  {
    // Arrange
    const layer = new globalThis.LightingRenderLayer(912, 720, 48);
    const torch = new globalThis.LightDeclaration(4, '#ffbb73', 0, 'steady', aCharacterAt(100, 200), 'page:1');

    // Act
    layer.syncTo(aComposition([ torch ]));
    const [ , sprite ] = layer.children;

    // Assert
    expect(sprite.x).toBe(148);
    expect(sprite.y).toBe(248);
  });

  it('blends lights additively, so two overlapping pools brighten where they meet', () =>
  {
    // Arrange
    const layer = new globalThis.LightingRenderLayer(912, 720, 48);
    const torch = new globalThis.LightDeclaration(4, '#ffbb73', 0, 'steady', aCharacterAt(0, 0), 'page:1');

    // Act
    layer.syncTo(aComposition([ torch ]));
    const [ , sprite ] = layer.children;

    // Assert
    expect(sprite.blendMode).toBe(globalThis.PIXI.BLEND_MODES.ADD);
  });

  it('darkens the sheet behind the lights rather than leaving it white', () =>
  {
    // Arrange
    const layer = new globalThis.LightingRenderLayer(912, 720, 48);

    // Act
    layer.syncTo(aComposition([], 1));
    const [ fill ] = layer.children;

    // Assert
    // total darkness in plain black keeps none of the light, which multiplies the world away entirely.
    expect(fill.tint).toBe(0x000000);
  });

  it('leaves the sheet untouched where nothing said it was dark', () =>
  {
    // Arrange
    const layer = new globalThis.LightingRenderLayer(912, 720, 48);

    // Act
    layer.syncTo(aComposition([], 0));
    const [ fill ] = layer.children;

    // Assert
    expect(fill.tint).toBe(0xffffff);
  });

  it('builds one sprite per declared light', () =>
  {
    // Arrange
    const layer = new globalThis.LightingRenderLayer(912, 720, 48);
    const first = new globalThis.LightDeclaration(4, '#ffbb73', 0, 'steady', aCharacterAt(0, 0), 'page:1');
    const second = new globalThis.LightDeclaration(6, '#ffffff', 0, 'flicker', aCharacterAt(50, 50), 'page:2');

    // Act
    layer.syncTo(aComposition([ first, second ]));

    // Assert
    // the ambient sheet plus one sprite each.
    expect(layer.children).toHaveLength(3);
  });

  it('walks a light smoothly through its cycle when nothing around it changes', () =>
  {
    // Arrange
    const layer = new globalThis.LightingRenderLayer(912, 720, 48);
    const torch = new globalThis.LightDeclaration(4, '#ffbb73', 0, 'pulse', aCharacterAt(100, 200), 'page:1');
    const alphas = [];

    // Act
    for (let frame = 0; frame < 90; frame++)
    {
      globalThis.Graphics.frameCount = frame;
      layer.syncTo(aComposition([ torch ]));
      const [ , torchSprite ] = layer.children;
      alphas.push(torchSprite.alpha);
    }

    // Assert
    // this is the control for the case below: it establishes that a frame-to-frame jump of any size
    // is abnormal, so a large one there cannot be explained away as how a pulse simply looks.
    const jumps = alphas.slice(1)
      .map((alpha, index) => Math.abs(alpha - alphas.at(index)));

    expect(Math.max(...jumps)).toBeLessThan(0.02);
  });

  it('keeps a lit torch in its own cycle while things spawn and die beside it', () =>
  {
    // Arrange
    const layer = new globalThis.LightingRenderLayer(912, 720, 48);
    const torch = new globalThis.LightDeclaration(4, '#ffbb73', 0, 'pulse', aCharacterAt(100, 200), 'page:1');
    const projectile = new globalThis.LightDeclaration(3, '#ff5a2a', 0, 'pulse', aCharacterAt(300, 400), 'page:0');
    const torchAlphas = [];

    // Act
    // a fireball spawning and dying beside a torch, which is what three enemies firing crosses of
    // projectiles does to the light count sixty times a second.
    for (let frame = 0; frame < 90; frame++)
    {
      globalThis.Graphics.frameCount = frame;
      const alsoBurning = frame % 2 === 0
        ? [ torch ]
        : [ torch, projectile ];
      layer.syncTo(aComposition(alsoBurning));
      const [ , torchSprite ] = layer.children;
      torchAlphas.push(torchSprite.alpha);
    }

    // Assert
    // a pulse of this period moves by a tiny fraction per frame, so a larger jump than that means
    // the torch was thrown to a fresh point in its cycle rather than allowed to travel through it.
    const jumps = torchAlphas.slice(1)
      .map((alpha, index) => Math.abs(alpha - torchAlphas.at(index)));

    expect(Math.max(...jumps)).toBeLessThan(0.02);
  });

  it('drops the sprite of a light that has gone out', () =>
  {
    // Arrange
    const layer = new globalThis.LightingRenderLayer(912, 720, 48);
    const torch = new globalThis.LightDeclaration(4, '#ffbb73', 0, 'steady', aCharacterAt(0, 0), 'page:1');
    layer.syncTo(aComposition([ torch ]));

    // Act
    layer.syncTo(aComposition([]));

    // Assert
    expect(layer.children).toHaveLength(1);
  });
});
//endregion lighting-render-layer.test