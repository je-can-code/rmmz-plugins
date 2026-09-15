//region AmbientDeclaration
/**
 * A statement that some place has lost some of its light, and who said so.
 *
 * Darkness and the colour of that darkness live on one declaration rather than two because they are
 * authored as one thought - `<ambient:[85, #0a2a2a]>` is a single decision about what this cave is
 * like. Splitting them would let a source withdraw half of its own opinion.
 *
 * A declaration carries no behavior and no animation state. It is the authored intent, and the
 * composer is what turns a pile of them into a number the renderer can use.
 */
class AmbientDeclaration
{
  /**
   * How much light is gone, as a fraction where `0` is untouched and `1` is pitch black.
   * @type {number}
   */
  #darkness = 0;

  /**
   * What colour the darkness is, as `[r, g, b]`.
   * @type {number[]}
   */
  #color = [ 0, 0, 0 ];

  /**
   * Whether the author actually said what colour the dark should be.
   *
   * This is the difference between `<ambient:[60]>` and `<ambient:[60, #000000]>`, which produce the
   * same colour and mean entirely different things. The first has no opinion and should lose the
   * colour to anything that does; the second insists, and a source that merely knows how dark it is
   * has no business overruling it.
   *
   * Without this the clock would win every argument about what colour a cave is, purely because it
   * outranks the cave on the question of *how* dark - and a teal grotto would quietly render black.
   * @type {boolean}
   */
  #declaresColor = false;

  /**
   * Who declared this ambient, and therefore who can remove it.
   * @type {string}
   */
  #sourceKey = String.empty;

  /**
   * Constructor.
   * @param {number} darkness The fraction of light removed, 0 through 1.
   * @param {number[]} color The colour of the darkness, as `[r, g, b]`.
   * @param {boolean} declaresColor Whether the author stated that colour themselves.
   * @param {string} sourceKey Who declared this ambient.
   */
  constructor(darkness, color, declaresColor, sourceKey)
  {
    this.#darkness = darkness;
    this.#color = color;
    this.#declaresColor = declaresColor;
    this.#sourceKey = sourceKey;
  }

  /**
   * Gets the fraction of light this declaration removes.
   * @returns {number} The darkness.
   */
  darkness()
  {
    // hand back the darkness fraction.
    return this.#darkness;
  }

  /**
   * Gets the colour of the darkness.
   * @returns {number[]} The color.
   */
  color()
  {
    // hand back the darkness colour.
    return this.#color;
  }

  /**
   * Gets whether the author stated the colour of the dark themselves.
   * @returns {boolean} The declaresColor.
   */
  hasDeclaredColor()
  {
    // hand back whether a colour was actually asked for.
    return this.#declaresColor;
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
   * Determines whether another declaration says exactly the same thing as this one.
   *
   * This is what lets a map's ambient be re-declared without disturbing anything. Arriving on a map
   * re-reads its note on every transfer, every save load and every return from the menu, and without
   * a value comparison each of those would count as a change and restart whatever the composer is
   * easing.
   * @param {AmbientDeclaration} other The declaration to compare against.
   * @returns {boolean}
   */
  matches(other)
  {
    // a different amount of dark entirely.
    if (this.darkness() !== other.darkness()) return false;

    // the same darkness asked for by someone else is not the same declaration.
    if (this.sourceKey() !== other.sourceKey()) return false;

    // one of them has an opinion about the colour and the other does not.
    if (this.hasDeclaredColor() !== other.hasDeclaredColor()) return false;

    // every colour channel has to agree for the dark to be the same dark.
    const otherColor = other.color();

    return this.#color.every((channel, index) => channel === otherColor.at(index));
  }
}

export default AmbientDeclaration;
//endregion AmbientDeclaration