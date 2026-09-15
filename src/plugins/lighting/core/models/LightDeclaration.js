//region LightDeclaration
/**
 * A statement that something is giving off light, and who said so.
 *
 * What a light *is* and what a light *does* are separate things here, and the split is load-bearing
 * rather than merely tidy. Reach, colour and intensity decide what gets drawn, so they belong to the
 * cached picture. The effect decides what happens to that picture over time, so it belongs to the
 * sprite's alpha and must stay out of the cache key - which is why a guttering torch and a steady
 * one of the same size and colour share a single drawing between them.
 *
 * A declaration carries no sprite and no phase. The composer owns both, so that withdrawing a light
 * is dropping a declaration rather than hunting down whatever it built.
 */
class LightDeclaration
{
  /**
   * How far the light reaches, in tiles.
   *
   * Tiles rather than pixels because that is the unit every other distance in the ecosystem is
   * written in - `<sight:5>`, `<proximityText:2>`, JABS's `<radius:1>` - and because an author
   * thinks in tiles. Fractions are allowed: a two-and-a-half tile lamp is a reasonable thing to
   * want, and refusing it would only push people back toward counting pixels.
   * @type {number}
   */
  #radius = 0;

  /**
   * The colour of the light, as a hex string.
   *
   * Kept as authored rather than parsed into channels, because this doubles as part of the texture
   * cache's key and a string compares in one operation where a triplet compares in three.
   * @type {string}
   */
  #color = String.empty;

  /**
   * How evenly the circle is filled, from `0` for a soft pool to `1` for a flat disc.
   *
   * This is a property of the picture rather than of its brightness. At `0` the light is brightest
   * at its heart and fades away to nothing, which is what a flame in the open looks like. At `1` the
   * whole circle burns at full strength and stops dead at the rim, which is what a spotlight looks
   * like. Everything between is a matter of how hard the edge is.
   * @type {number}
   */
  #intensity = 0;

  /**
   * How this light animates, if it animates at all.
   * @type {string}
   */
  #effect = String.empty;

  /**
   * The character carrying this light around.
   *
   * A light is always attached to something in the world - a torch event, the player, a follower -
   * because there is nowhere else for it to be. The screen position is deliberately *not* stored:
   * the character already knows where it is every frame, and a light that cached its own coordinates
   * would be wrong the instant the map scrolled.
   * @type {Game_CharacterBase}
   */
  #character = null;

  /**
   * Who declared this light, and therefore who can remove it.
   * @type {string}
   */
  #sourceKey = String.empty;

  /**
   * Constructor.
   * @param {number} radius How far the light reaches, in tiles.
   * @param {string} color The colour of the light, as a hex string.
   * @param {number} intensity How evenly the circle is filled, 0 through 1.
   * @param {string} effect How the light animates, from {@link LightingEffects}.
   * @param {Game_CharacterBase} character The character carrying the light.
   * @param {string} sourceKey Who declared this light.
   */
  constructor(radius, color, intensity, effect, character, sourceKey)
  {
    this.#radius = radius;
    this.#color = color;
    this.#intensity = intensity;
    this.#effect = effect;
    this.#character = character;
    this.#sourceKey = sourceKey;
  }

  /**
   * Gets how far this light reaches, in tiles.
   * @returns {number} The radius.
   */
  radius()
  {
    // hand back the radius as the author wrote it.
    return this.#radius;
  }

  /**
   * How far this light reaches in pixels, which is the only unit a texture can be drawn in.
   *
   * The conversion lives here rather than at the point of authoring so that the declaration keeps
   * saying what was actually written. It asks the map rather than assuming 48, because the tile size
   * is a project setting and a game that changed it would otherwise get lights of the wrong size
   * with nothing anywhere reporting a problem.
   * @returns {number}
   */
  radiusInPixels()
  {
    return this.#radius * $gameMap.tileWidth();
  }

  /**
   * Gets the colour of this light.
   * @returns {string} The color.
   */
  color()
  {
    // hand back the colour.
    return this.#color;
  }

  /**
   * Gets how evenly this light fills its circle.
   * @returns {number} The intensity.
   */
  intensity()
  {
    // hand back the fill evenness.
    return this.#intensity;
  }

  /**
   * Gets how this light animates.
   * @returns {string} The effect.
   */
  effect()
  {
    // hand back the animation behaviour.
    return this.#effect;
  }

  /**
   * Gets the character carrying this light.
   * @returns {Game_CharacterBase} The character.
   */
  character()
  {
    // hand back whoever is holding this light.
    return this.#character;
  }

  /**
   * Gets the source key.
   * @returns {string} The sourceKey.
   */
  sourceKey()
  {
    // hand back the source key.
    return this.#sourceKey;
  }

  /**
   * The key under which this light's texture is cached.
   *
   * Reach, colour and intensity are exactly the three things that decide what a light *looks* like,
   * so every light in the game agreeing on all three shares one drawing. Everything else is
   * deliberately absent: the effect is animated by changing a sprite's alpha, and the character is
   * where the light is rather than what it looks like. A guttering torch and a steady one of the
   * same size, colour and edge are the same picture shown at different brightnesses.
   * @returns {string}
   */
  textureKey()
  {
    // build the appearance key from the only three things that shape the picture.
    return `${this.#radius}:${this.#color}:${this.#intensity}`;
  }

  /**
   * Determines whether another declaration says exactly the same thing as this one.
   * @param {LightDeclaration} other The declaration to compare against.
   * @returns {boolean}
   */
  matches(other)
  {
    // a different size, colour or edge entirely.
    if (this.textureKey() !== other.textureKey()) return false;

    // the same picture behaving differently is a different light.
    if (this.effect() !== other.effect()) return false;

    // the same light on somebody else is a different light, however alike they look.
    if (this.character() !== other.character()) return false;

    // the same light asked for by someone else is not the same declaration.
    return this.sourceKey() === other.sourceKey();
  }
}

export default LightDeclaration;
//endregion LightDeclaration