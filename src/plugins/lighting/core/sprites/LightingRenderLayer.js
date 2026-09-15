//region LightingRenderLayer
import LightTextureCache from '../core/LightTextureCache.js';
import LightingColor from '../core/LightingColor.js';
import LightingEasing from '../core/LightingEasing.js';

/**
 * The offscreen scene the light mask is composited from, never shown to anybody directly.
 *
 * Two stages are needed rather than one, and the reason is a property of how blending works: a
 * container has no blend mode of its own in PIXI 5, and even if it had, its children would each
 * blend against whatever is behind the container rather than against each other first. A white light
 * blended into the world by multiplication does nothing at all, and a black ambient sheet blended
 * the same way turns the world off. Overlapping torches have to be added *together* before the
 * result is multiplied *into* the scene, and nothing but a separate render target can do that.
 *
 * The plugin this replaces reached the same conclusion and composited onto a 2D canvas, which cost a
 * full-screen texture upload every frame. This composites on the GPU, where the pixels already live.
 */
class LightingRenderLayer
  extends PIXI.Container
{
  /**
   * The sheet of darkness every light is punched out of.
   * @type {PIXI.Sprite}
   */
  #ambientFill = null;

  /**
   * Everything being drawn for one light, kept under that light's own identity.
   *
   * Keyed by identity rather than held in an array alongside the declarations, because a light's
   * place in that list is not a property of the light. A torch is the fourth thing burning until a
   * projectile spawns, and then it is the fifth - and if its phase and its tempo live at index four,
   * the torch inherits somebody else's cycle the instant anything appears beside it.
   *
   * That is not a hypothetical: a handful of enemies firing projectiles changes the light count
   * almost every frame, which under an index-keyed scheme re-seeded every light on the screen sixty
   * times a second. Nothing could complete a cycle, so nothing pulsed - it only jittered between the
   * right two bounds.
   * @type {Map<string, {sprite: PIXI.Sprite, phase: number, rate: number, textureKey: string}>}
   */
  #lightsByKey = new Map();

  /**
   * How far the layer extends past the screen on every side, in pixels.
   * @type {number}
   */
  #margin = 0;

  /**
   * The darkness the ambient fill is currently painted for.
   * @type {number}
   */
  #paintedDarkness = -1;

  /**
   * The colour the ambient fill is currently painted for.
   * @type {number[]}
   */
  #paintedColor = [ -1, -1, -1 ];

  /**
   * Constructor.
   * @param {number} width How wide the layer is, including its margins.
   * @param {number} height How tall the layer is, including its margins.
   * @param {number} margin How far the layer extends past the screen on every side.
   */
  constructor(width, height, margin)
  {
    super();

    this.#margin = margin;
    this.#ambientFill = LightingRenderLayer.#buildAmbientFill(width, height);
    this.addChild(this.#ambientFill);
  }

  /**
   * Brings the layer into agreement with what the composer says the screen should look like.
   * @param {LightingComposition} composition What every source, taken together, is asking for.
   */
  syncTo(composition)
  {
    this.#syncAmbient(composition);
    this.#syncLights(composition);
  }

  /**
   * Repaints the sheet of darkness, but only when the darkness has actually changed.
   *
   * The render pass itself runs every frame regardless, because torches move with the camera - but
   * the fill behind them is a solid colour that changes only when the hour turns or the player walks
   * into somewhere darker, which is a few times an hour rather than sixty times a second.
   * @param {LightingComposition} composition What is being asked for.
   */
  #syncAmbient(composition)
  {
    const darkness = composition.darkness();
    const color = composition.ambientColor();

    // nothing about the dark has changed, so the sheet already says the right thing.
    if (this.#isAmbientPainted(darkness, color) === true) return;

    this.#paintedDarkness = darkness;
    this.#paintedColor = color;
    this.#ambientFill.tint = LightingRenderLayer.#maskTintFor(darkness, color);
  }

  /**
   * Determines whether the ambient fill is already painted for a given darkness.
   * @param {number} darkness The darkness being asked for.
   * @param {number[]} color The colour being asked for.
   * @returns {boolean}
   */
  #isAmbientPainted(darkness, color)
  {
    if (this.#paintedDarkness !== darkness) return false;

    return this.#paintedColor.every((channel, index) => channel === color.at(index));
  }

  /**
   * Brings the drawn lights into agreement with the declared ones, and moves them where they belong.
   * @param {LightingComposition} composition What is being asked for.
   */
  #syncLights(composition)
  {
    const declarations = composition.lights();
    const identities = LightingRenderLayer.#identitiesOf(declarations);

    this.#retireLightsOtherThan(identities);

    declarations.forEach((declaration, index) => this.#placeLight(declaration, identities.at(index)), this);
  }

  /**
   * Names every declared light in a way that survives the list around it changing.
   *
   * A source key alone is not enough - one event may declare several lights, and the player's
   * equipment routinely declares more than one - so each light is numbered within its own source.
   * That pairing is stable for exactly as long as the light is: a torch keeps its name while
   * anything at all spawns or dies elsewhere on the map.
   * @param {LightDeclaration[]} declarations Every light being asked for this frame.
   * @returns {string[]} One identity per declaration, in the same order.
   */
  static #identitiesOf(declarations)
  {
    const seenPerSource = new Map();

    return declarations.map(declaration =>
    {
      const sourceKey = declaration.sourceKey();
      const ordinal = seenPerSource.get(sourceKey) ?? 0;

      seenPerSource.set(sourceKey, ordinal + 1);

      return `${sourceKey}#${ordinal}`;
    });
  }

  /**
   * Takes down the sprite of every light that is no longer being asked for.
   *
   * Withdrawing one light must leave every other one exactly as it was, which is the whole reason
   * this removes by name instead of rebuilding the set. A projectile expiring beside a torch is not
   * a reason for the torch to start its cycle again.
   * @param {string[]} identities The names of every light that should still exist.
   */
  #retireLightsOtherThan(identities)
  {
    const wanted = new Set(identities);

    this.#lightsByKey.forEach((entry, key) =>
    {
      if (wanted.has(key) === true) return;

      this.removeChild(entry.sprite);
      this.#lightsByKey.delete(key);
    }, this);
  }

  /**
   * Moves one light to wherever its character currently is, and sets how brightly it is burning.
   * @param {LightDeclaration} declaration The light being placed.
   * @param {string} identity What this light is called.
   */
  #placeLight(declaration, identity)
  {
    const entry = this.#entryFor(declaration, identity);
    const character = declaration.character();

    // the character already knows where it is this frame; the light simply goes there.
    entry.sprite.x = character.screenX() + this.#margin;
    entry.sprite.y = character.screenY() + this.#margin;
    entry.sprite.alpha = this.#strengthOf(declaration, entry);
  }

  /**
   * Everything being drawn for one light, built on first sight and kept for as long as it burns.
   *
   * A light that changes what it looks like - a page swapping a small flame for a bonfire under the
   * same event - keeps its identity and therefore its place in its cycle, and is simply handed the
   * new picture. Only a genuinely new light rolls a fresh phase.
   * @param {LightDeclaration} declaration The light being drawn.
   * @param {string} identity What this light is called.
   * @returns {{sprite: PIXI.Sprite, phase: number, rate: number, textureKey: string}}
   */
  #entryFor(declaration, identity)
  {
    const existing = this.#lightsByKey.get(identity);

    if (existing !== undefined)
    {
      // the same light wearing a different face; swap the picture and leave its cycle alone.
      if (existing.textureKey !== declaration.textureKey())
      {
        existing.sprite.bitmap = LightTextureCache.forDeclaration(declaration);
        existing.textureKey = declaration.textureKey();
      }

      return existing;
    }

    return this.#buildEntry(declaration, identity);
  }

  /**
   * Builds the sprite and the cycle a newly-appeared light will live by.
   * @param {LightDeclaration} declaration The light being drawn.
   * @param {string} identity What this light is called.
   * @returns {{sprite: PIXI.Sprite, phase: number, rate: number, textureKey: string}}
   */
  #buildEntry(declaration, identity)
  {
    // the engine's own Sprite rather than a bare PIXI one, because a Bitmap is not a texture and
    // the conversion is not a property assignment. Handing `bitmap` over gets the frame sized to
    // the picture and the base texture swapped in once it is ready; assigning `baseTexture`
    // straight onto `texture` instead type-errors inside PIXI on the very first frame.
    const sprite = new Sprite();
    sprite.bitmap = LightTextureCache.forDeclaration(declaration);
    sprite.blendMode = PIXI.BLEND_MODES.ADD;
    sprite.anchor.set(0.5, 0.5);
    this.addChild(sprite);

    const tuning = J.LIGHTING.Metadata.tuningFor(declaration.effect());

    // its own place in its own cycle, so a wall of torches never burns in formation - and its own
    // tempo, because a shared one would hold any two lights in the same relationship forever.
    const entry = {
      sprite,
      phase: LightingEasing.randomPhase(),
      rate: LightingEasing.randomRate(tuning.variance),
      textureKey: declaration.textureKey(),
    };

    this.#lightsByKey.set(identity, entry);

    return entry;
  }

  /**
   * How brightly a light should be burning this frame.
   *
   * This is the only place a light's effect is ever felt: it moves the sprite's alpha and nothing
   * else. The picture underneath is untouched, which is what lets a guttering torch and a steady one
   * of the same appearance go on sharing a single cached texture between them.
   * @param {LightDeclaration} declaration The light being judged.
   * @param {{phase: number, rate: number}} entry The cycle this particular light is living by.
   * @returns {number}
   */
  #strengthOf(declaration, entry)
  {
    const effect = declaration.effect();
    const tuning = J.LIGHTING.Metadata.tuningFor(effect);

    return LightingEasing.strengthFor(effect, Graphics.frameCount, entry.phase, tuning, entry.rate);
  }

  /**
   * Builds the full-bleed sheet that the darkness is painted onto.
   * @param {number} width How wide the sheet is.
   * @param {number} height How tall the sheet is.
   * @returns {PIXI.Sprite}
   */
  static #buildAmbientFill(width, height)
  {
    const fill = new PIXI.Sprite(PIXI.Texture.WHITE);
    fill.width = width;
    fill.height = height;

    return fill;
  }

  /**
   * The colour the darkness sheet has to be for a given darkness and colour of dark.
   *
   * The mask is multiplied into the scene, so each channel of this colour is the fraction of that
   * channel the world gets to keep. White keeps everything and is what "not dark" means; black keeps
   * nothing. A coloured dark keeps *more of some channels than others*, which is how a cave can be
   * nearly black and still unmistakably teal - multiplication can take light away unevenly, which is
   * the one thing the engine's additive screen tone was never able to do.
   * @param {number} darkness How much light is gone, 0 through 1.
   * @param {number[]} color What colour the dark is, as `[r, g, b]`.
   * @returns {number} The colour as `0xRRGGBB`.
   */
  static #maskTintFor(darkness, color)
  {
    const light = 1 - darkness;
    const channels = color.map(channel =>
    {
      const kept = light + (darkness * (channel / 255));

      return Math.round(kept * 255);
    });

    return LightingColor.toTintNumber(channels);
  }
}

export default LightingRenderLayer;
//endregion LightingRenderLayer