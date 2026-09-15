//region LightTextureCache
import LightingColor from './LightingColor.js';

/**
 * Every distinct light picture the game has needed so far, drawn once and handed out forever.
 *
 * A light's radius and colour never change - only where it is. That single observation is what
 * separates this from the plugin it replaces, which rasterised the entire screen onto a canvas every
 * frame and re-uploaded eight hundred kilobytes of texture sixty times a second to do it. Here a
 * torch is drawn once, and forty-seven torches sharing a radius and a colour share that one drawing.
 *
 * Nothing is ever evicted. The set of distinct light appearances in a game is small, bounded by what
 * authors actually wrote in tags, and a cache that can throw away a texture would have to be able to
 * rebuild it mid-frame - which is the cost this exists to avoid.
 */
class LightTextureCache
{
  /**
   * Every generated light picture, keyed by the appearance that produced it.
   * @type {Map<string, Bitmap>}
   */
  static #texturesByKey = new Map();

  /**
   * Where the midpoint colour stop sits on a light of the softest possible edge.
   *
   * A gradient running straight from full brightness to black in one step reads as a flat disc.
   * Bending it with a midpoint gives the pooled, lamp-like falloff that an open flame actually has,
   * without the expense of computing a real curve per pixel.
   * @type {number}
   */
  static SOFT_MIDPOINT = 0.45;

  /**
   * How much brightness survives to the midpoint on a light of the softest possible edge.
   * @type {number}
   */
  static SOFT_MIDPOINT_STRENGTH = 0.35;

  /**
   * Where the midpoint sits on a light of the hardest possible edge.
   *
   * Not quite the rim: leaving a sliver of gradient at the very edge is what keeps a hard circle
   * from looking like an aliased cut-out, while still reading as a spotlight rather than a haze.
   * @type {number}
   */
  static HARD_MIDPOINT = 0.97;

  /**
   * How much brightness survives to the midpoint on a light of the hardest possible edge.
   * @type {number}
   */
  static HARD_MIDPOINT_STRENGTH = 1;

  /**
   * Gets the picture for a light, drawing it only if this is the first one of its kind.
   * @param {LightDeclaration} declaration The light whose picture is wanted.
   * @returns {Bitmap} The cached picture.
   */
  static forDeclaration(declaration)
  {
    const key = declaration.textureKey();

    // some other light of exactly this appearance has already paid for this drawing.
    if (LightTextureCache.#texturesByKey.has(key) === true)
    {
      return LightTextureCache.#texturesByKey.get(key);
    }

    const generated = LightTextureCache.#generate(
      declaration.radiusInPixels(),
      declaration.color(),
      declaration.intensity());
    LightTextureCache.#texturesByKey.set(key, generated);

    return generated;
  }

  /**
   * Draws one light as a radial falloff from its own colour out to black.
   *
   * Black is the far stop rather than transparency because these pictures are composited additively:
   * a pixel of black adds nothing, which is exactly what "no light reaches here" should mean. It also
   * makes the square corners of the bitmap free - they are black, so they contribute nothing, and no
   * masking or clipping is needed to make a circle out of a rectangle.
   * Intensity is what decides the shape of that falloff. At zero the light is brightest at its
   * heart and fades away, which is an open flame. At one the whole circle burns evenly and stops at
   * the rim, which is a spotlight. Both are the same three gradient stops with the middle one slid
   * outward and brightened, which is why this costs nothing extra to draw.
   * @param {number} radius How far the light reaches, in pixels - already converted from tiles.
   * @param {string} color The colour of the light, as a hex string.
   * @param {number} intensity How evenly the circle is filled, 0 through 1.
   * @returns {Bitmap} The freshly drawn picture.
   */
  static #generate(radius, color, intensity)
  {
    const diameter = radius * 2;
    const bitmap = new Bitmap(diameter, diameter);
    const { context } = bitmap;

    const gradient = context.createRadialGradient(radius, radius, 0, radius, radius, radius);
    const midpoint = LightTextureCache.#between(
      LightTextureCache.SOFT_MIDPOINT, LightTextureCache.HARD_MIDPOINT, intensity);
    const strength = LightTextureCache.#between(
      LightTextureCache.SOFT_MIDPOINT_STRENGTH, LightTextureCache.HARD_MIDPOINT_STRENGTH, intensity);
    const midpointColor = LightTextureCache.#dim(color, strength);

    gradient.addColorStop(0, color);
    gradient.addColorStop(midpoint, midpointColor);
    gradient.addColorStop(1, '#000000');

    context.fillStyle = gradient;
    context.fillRect(0, 0, diameter, diameter);

    // drawing through the raw context bypasses every Bitmap method that would have done this, and
    // without it PIXI never learns the texture changed - the light renders as an empty square.
    bitmap.baseTexture.update();

    return bitmap;
  }

  /**
   * Slides a value between its softest and hardest settings.
   * @param {number} soft What this value is at an intensity of zero.
   * @param {number} hard What it is at an intensity of one.
   * @param {number} intensity Where between the two to land, 0 through 1.
   * @returns {number}
   */
  static #between(soft, hard, intensity)
  {
    return soft + ((hard - soft) * intensity);
  }

  /**
   * Scales a colour toward black by a given strength.
   * @param {string} hex The colour to dim, as a hex string.
   * @param {number} strength How much of the colour survives, 0 through 1.
   * @returns {string} The dimmed colour, as an `rgb()` string.
   */
  static #dim(hex, strength)
  {
    const rgb = LightingColor.toRgb(hex);
    const [ red, green, blue ] = rgb.map(channel => Math.round(channel * strength));

    return `rgb(${red},${green},${blue})`;
  }

  /**
   * Discards every generated picture.
   *
   * Nothing in the game needs this - a light appearance stays valid for the life of the process -
   * but a test that asserts a texture was generated exactly once needs somewhere to start from.
   */
  static clear()
  {
    LightTextureCache.#texturesByKey.clear();
  }

  /**
   * How many distinct light pictures have been drawn.
   *
   * Exists so a test can prove the sharing actually happens. Forty-seven torches of one appearance
   * producing one texture is the entire performance claim of this class, and an assertion that only
   * checks the picture looks right would pass just as happily if it had been drawn forty-seven times.
   * @returns {number}
   */
  static size()
  {
    return LightTextureCache.#texturesByKey.size;
  }
}

export default LightTextureCache;
//endregion LightTextureCache