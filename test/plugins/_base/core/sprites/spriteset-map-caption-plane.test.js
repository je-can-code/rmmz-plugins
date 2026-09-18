//region plugins/_base/core/sprites/spriteset-map-caption-plane.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { installMinimalDatabase, installRmmzViewLayer } from '../../../../setup/rmmz-view-harness.js';

/**
 * The caption plane, tested against the real display tree rather than a described one.
 *
 * Everything this file covers is a seam: where the plane is attached, what the plane is holding,
 * and what a caption copies off the character it describes. None of it is logic that could be
 * extracted somewhere measurable - it is two objects meeting, and a fake on either side would make
 * every assertion circular. The harness gives real PIXI containers, so `addChild` really parents
 * and `children` really is the draw order.
 *
 * The placement cases are the whole reason the plane exists, and there are two of them because
 * there are two kinds of dark. `_baseColorFilter` grades the base sprite's subtree, so "is the
 * plane inside `_baseSprite`" and "do nameplates go blue at midnight" are one question. The ambient
 * mask multiplies against the scene above that, so "is the plane below the mask" and "does an
 * unlit corner still hide what is standing in it" are another. The plane has to answer the first
 * one yes and the second one yes, and those pull in opposite directions.
 */
describe('Spriteset_Map caption plane', () =>
{
  /** @type {typeof import('../../../../../src/plugins/_base/core/sprites/Sprite_CharacterOverlay.js').default} */
  let Sprite_CharacterOverlay;

  beforeAll(async () =>
  {
    // the real view layer, so the spriteset, the sprites and the containers are all genuine.
    installRmmzViewLayer();
    installMinimalDatabase();

    globalThis.J = {
      BASE: {
        Aliased: {
          Spriteset_Map: new Map(),
          Sprite_Character: new Map(),
        },
      },
    };

    await import('../../../../../src/plugins/_base/core/sprites/Spriteset_Map.js');
    ({ default: Sprite_CharacterOverlay } =
      await import('../../../../../src/plugins/_base/core/sprites/Sprite_CharacterOverlay.js'));
  });

  /**
   * Builds a spriteset carrying the engine's base sprite, its weather, and our caption plane.
   *
   * Constructed as a `Sprite` and then given the real `Spriteset_Map` prototype, because the two
   * halves have to come from different places: a spriteset's container internals - `children`, the
   * transform, everything `addChild` writes into - only exist if PIXI's constructor actually ran,
   * while `Spriteset_Map`'s own `initialize` wants a loaded map, a tileset and a party to build a
   * tilemap out of. This is the real prototype over real container internals, which is every part
   * the tree below is asserted against.
   *
   * The weather is built because the plane indexes off it, which makes it load-bearing here rather
   * than scenery.
   * @returns {Spriteset_Map} The spriteset, with its base sprite, weather and caption plane built.
   */
  const buildSpriteset = () =>
  {
    const spriteset = new globalThis.Sprite();
    Object.setPrototypeOf(spriteset, globalThis.Spriteset_Map.prototype);

    spriteset.createBaseSprite();
    spriteset.createWeather();
    spriteset.createCaptionPlane();

    return spriteset;
  };

  /**
   * Inserts a stand-in ambient mask exactly where J-Lighting inserts the real one.
   *
   * The placement rule is copied rather than imported, deliberately: loading J-Lighting to test
   * J-Base would make this an integration test of two ships, and the thing worth pinning is that
   * the plane survives *that rule* rather than that those two files currently agree.
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

  /**
   * Builds a stand-in character sprite paired with a real caption.
   * @returns {{characterSprite: Object, caption: Sprite_CharacterOverlay}}
   */
  const buildCaptionedCharacter = () =>
  {
    const caption = new Sprite_CharacterOverlay();
    const characterSprite = { characterOverlay: () => caption };

    caption.setCharacterSprite(characterSprite);

    return {
      characterSprite,
      caption,
    };
  };

  describe('createCaptionPlane', () =>
  {
    it('attaches the plane to the spriteset itself', () =>
    {
      // Arrange & Act.
      const spriteset = buildSpriteset();

      // Assert.
      expect(spriteset.children)
        .toContain(spriteset.captionPlane());
    });

    it('keeps the plane out of the base sprite that carries the screen tone', () =>
    {
      // Arrange & Act - the base sprite is built first, exactly as the engine builds it.
      const spriteset = buildSpriteset();

      // Assert - the tone filter owns the base sprite's subtree and nothing else, so a plane
      // parented anywhere under it is a plane that gets tinted.
      expect(spriteset._baseSprite.children)
        .not
        .toContain(spriteset.captionPlane());
      expect(spriteset.captionPlane().parent)
        .toBe(spriteset);
    });

    it('draws the plane after the base sprite rather than before it', () =>
    {
      // Arrange & Act.
      const spriteset = buildSpriteset();

      // Assert - a plane that landed first would be painted over by the entire world.
      const planeIndex = spriteset.children.indexOf(spriteset.captionPlane());
      const baseSpriteIndex = spriteset.children.indexOf(spriteset._baseSprite);

      expect(planeIndex)
        .toBeGreaterThan(baseSpriteIndex);
    });

    it('leaves the plane below an ambient mask inserted after it', () =>
    {
      // Arrange - the plane is built, then the mask arrives, which is the order when J-Lighting
      // loads after J-Base.
      const spriteset = buildSpriteset();

      // Act.
      const mask = insertAmbientMask(spriteset);

      // Assert - captions are meant to be taken away by darkness, unlike the tone above.
      const planeIndex = spriteset.children.indexOf(spriteset.captionPlane());
      const maskIndex = spriteset.children.indexOf(mask);

      expect(planeIndex)
        .toBeLessThan(maskIndex);
    });
  });

  describe('reconcileCaptions', () =>
  {
    /** @type {Sprite_CaptionPlane} */
    let plane;

    beforeEach(() =>
    {
      plane = buildSpriteset()
        .captionPlane();
    });

    it('admits the caption of a character sprite that has arrived', () =>
    {
      // Arrange - two characters on the map, so admitting is a selection rather than a sweep.
      const first = buildCaptionedCharacter();
      const second = buildCaptionedCharacter();

      // Act.
      plane.reconcileCaptions([ first.characterSprite, second.characterSprite ]);

      // Assert.
      expect(plane.children)
        .toEqual([ first.caption, second.caption ]);
    });

    it('evicts the caption of a character sprite that has left', () =>
    {
      // Arrange - both captions admitted, then one character leaves the map.
      const staying = buildCaptionedCharacter();
      const departing = buildCaptionedCharacter();
      plane.reconcileCaptions([ staying.characterSprite, departing.characterSprite ]);

      // Act.
      plane.reconcileCaptions([ staying.characterSprite ]);

      // Assert - the departed caption is detached and the bystander is still drawn.
      expect(plane.children)
        .toEqual([ staying.caption ]);
      expect(departing.caption.parent)
        .toBeNull();
    });

    it('does not re-admit a caption it is already holding', () =>
    {
      // Arrange.
      const settled = buildCaptionedCharacter();
      plane.reconcileCaptions([ settled.characterSprite ]);

      // Act - the same character sprite reported again on the following frame.
      plane.reconcileCaptions([ settled.characterSprite ]);

      // Assert - one entry, not two, which a plane that admitted blindly would produce.
      expect(plane.children)
        .toHaveLength(1);
    });
  });

  describe('Sprite_CharacterOverlay.updateFromCharacterSprite', () =>
  {
    it('copies across the position, depth, visibility and opacity of its character', () =>
    {
      // Arrange - a character somewhere specific, mid-fade, on the upper priority tier.
      const caption = new Sprite_CharacterOverlay();
      caption.setCharacterSprite({
        x: 144,
        y: 288,
        z: 5,
        visible: true,
        opacity: 96,
      });

      // Act.
      caption.updateFromCharacterSprite();

      // Assert.
      expect(caption.x)
        .toBe(144);
      expect(caption.y)
        .toBe(288);
      expect(caption.z)
        .toBe(5);
      expect(caption.visible)
        .toBe(true);
      expect(caption.opacity)
        .toBe(96);
    });

    it('goes invisible along with a character that stopped being drawn', () =>
    {
      // Arrange - a transparent event, which the engine renders by clearing `visible`.
      const caption = new Sprite_CharacterOverlay();
      caption.visible = true;
      caption.setCharacterSprite({
        x: 0,
        y: 0,
        z: 3,
        visible: false,
        opacity: 255,
      });

      // Act.
      caption.updateFromCharacterSprite();

      // Assert - a caption that ignored this would be a name floating over nothing.
      expect(caption.visible)
        .toBe(false);
    });

    it('never inherits the scale or rotation the character is animating', () =>
    {
      // Arrange - a character mid-spin and mid-squash, which is the exact case this layer exists
      // for: a nameplate must neither rotate with the body nor stretch with it.
      const caption = new Sprite_CharacterOverlay();
      caption.setCharacterSprite({
        x: 10,
        y: 20,
        z: 3,
        visible: true,
        opacity: 255,
        scale: {
          x: 2.5,
          y: 0.4,
        },
        rotation: 1.25,
      });

      // Act.
      caption.updateFromCharacterSprite();

      // Assert - untouched at rest, while the position proves the copy actually ran.
      expect(caption.scale.x)
        .toBe(1);
      expect(caption.scale.y)
        .toBe(1);
      expect(caption.rotation)
        .toBe(0);
      expect(caption.x)
        .toBe(10);
    });
  });
});
//endregion plugins/_base/core/sprites/spriteset-map-caption-plane.test.js