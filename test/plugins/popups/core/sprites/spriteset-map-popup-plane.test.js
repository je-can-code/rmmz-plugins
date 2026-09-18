//region plugins/popups/core/sprites/spriteset-map-popup-plane.test.js
import { beforeAll, describe, expect, it } from 'vitest';

import { installMinimalDatabase, installRmmzViewLayer } from '../../../../setup/rmmz-view-harness.js';

/**
 * Where damage popups are parented, which is a design decision rather than a detail.
 *
 * Captions obey the dark on purpose: a nameplate is something you see, and an unlit corner is meant
 * to hide whatever is standing in it. A damage number is the opposite kind of information. It
 * reports a hit that already landed, and a hit is *felt* - you can tell how hard you connected with
 * something without being able to make out what you connected with. So popups sit above everything
 * that takes light away, and this file is what stops that decision being undone by an ordering
 * change nobody noticed.
 */
describe('Spriteset_Map popup plane', () =>
{
  beforeAll(async () =>
  {
    // the real view layer, so the spriteset and its containers are genuine.
    installRmmzViewLayer();
    installMinimalDatabase();

    globalThis.J = {
      BASE: {
        Aliased: {
          Spriteset_Map: new Map(),
          Sprite_Character: new Map(),
        },
      },
      POPUPS: {
        Aliased: {
          Spriteset_Map: new Map(),
        },
      },
    };

    // J-Base first, so the caption plane exists to be ordered against.
    await import('../../../../../src/plugins/_base/core/sprites/Spriteset_Map.js');
    await import('../../../../../src/plugins/popups/core/sprites/Spriteset_Map.js');
  });

  /**
   * Builds a spriteset carrying the base sprite, the weather, and both planes.
   *
   * Constructed as a `Sprite` and then given the real `Spriteset_Map` prototype: the container
   * internals have to come from PIXI's own constructor, while `Spriteset_Map.initialize` wants a
   * loaded map and party it has no business needing here.
   * @returns {Spriteset_Map} The spriteset, fully built.
   */
  const buildSpriteset = () =>
  {
    const spriteset = new globalThis.Sprite();
    Object.setPrototypeOf(spriteset, globalThis.Spriteset_Map.prototype);

    spriteset.createBaseSprite();
    spriteset.createWeather();
    spriteset.createCaptionPlane();
    spriteset.createPopupPlane();

    return spriteset;
  };

  /**
   * Inserts a stand-in ambient mask exactly where J-Lighting inserts the real one.
   * @param {Spriteset_Map} spriteset The spriteset to insert into.
   * @returns {Sprite} The stand-in mask.
   */
  const insertAmbientMask = spriteset =>
  {
    const mask = new globalThis.Sprite();
    const weatherIndex = spriteset.getChildIndex(spriteset.weather());

    spriteset.addChildAt(mask, weatherIndex + 1);

    return mask;
  };

  it('keeps popups above an ambient mask that takes the world away', () =>
  {
    // Arrange.
    const spriteset = buildSpriteset();

    // Act.
    const mask = insertAmbientMask(spriteset);

    // Assert - a hit landed in the dark still reports itself.
    const popupPlaneIndex = spriteset.children.indexOf(spriteset.popupPlane());
    const maskIndex = spriteset.children.indexOf(mask);

    expect(popupPlaneIndex)
      .toBeGreaterThan(maskIndex);
  });

  it('keeps popups above the captions, which the same mask does take away', () =>
  {
    // Arrange & Act - both planes built, with the mask between them.
    const spriteset = buildSpriteset();
    const mask = insertAmbientMask(spriteset);

    // Assert - the two planes sit on opposite sides of the mask, which is the entire split.
    const popupPlaneIndex = spriteset.children.indexOf(spriteset.popupPlane());
    const captionPlaneIndex = spriteset.children.indexOf(spriteset.captionPlane());
    const maskIndex = spriteset.children.indexOf(mask);

    expect(captionPlaneIndex)
      .toBeLessThan(maskIndex);
    expect(popupPlaneIndex)
      .toBeGreaterThan(maskIndex);
  });

  it('keeps popups out of the base sprite that carries the screen tone', () =>
  {
    // Arrange & Act.
    const spriteset = buildSpriteset();

    // Assert - a damage number was never meant to go blue at midnight either.
    expect(spriteset._baseSprite.children)
      .not
      .toContain(spriteset.popupPlane());
    expect(spriteset.popupPlane().parent)
      .toBe(spriteset);
  });
});
//endregion plugins/popups/core/sprites/spriteset-map-popup-plane.test.js