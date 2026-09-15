//region ToneDeclaration
/**
 * A statement that the scene should be cast in some colour, and how long it should take to get there.
 *
 * Tone is the one channel that arrives with a duration attached, because the engine's own
 * `Game_Screen.startTint` has always taken one and every cutscene in the game was authored against
 * that. The duration is carried here rather than acted on here - the composer owns the easing, since
 * it is the only thing that knows what tone the screen is actually showing right now.
 *
 * **A declaration states a destination, never a current value.** Reading a live interpolation as a
 * declaration is the mistake this design exists to avoid: partway through a fade the live tone
 * matches nobody's intent, and composing against it makes the screen lurch toward a colour no source
 * ever asked for.
 */
class ToneDeclaration
{
  /**
   * The colour being travelled toward, as `[r, g, b, grey]`.
   * @type {number[]}
   */
  #tone = [ 0, 0, 0, 0 ];

  /**
   * How many frames the journey there should take.
   * @type {number}
   */
  #durationFrames = 0;

  /**
   * Who declared this tone, and therefore who can remove it.
   * @type {string}
   */
  #sourceKey = String.empty;

  /**
   * Constructor.
   * @param {number[]} tone The colour being travelled toward, as `[r, g, b, grey]`.
   * @param {number} durationFrames How many frames the journey should take.
   * @param {string} sourceKey Who declared this tone.
   */
  constructor(tone, durationFrames, sourceKey)
  {
    this.#tone = tone;
    this.#durationFrames = durationFrames;
    this.#sourceKey = sourceKey;
  }

  /**
   * Gets the colour being travelled toward.
   * @returns {number[]} The tone.
   */
  tone()
  {
    // hand back the destination colour.
    return this.#tone;
  }

  /**
   * Gets how many frames the journey should take.
   * @returns {number} The durationFrames.
   */
  durationFrames()
  {
    // hand back the duration.
    return this.#durationFrames;
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
   * Determines whether this declaration is asking for no colour at all.
   *
   * A neutral destination is how the engine has always spelled "I am finished" - an event's Tint
   * Screen back to `[0,0,0,0]` means the cutscene is handing the screen back, not that the world is
   * supposed to become colourless. Treating it as a withdrawal is what lets the clock's night take
   * over again afterward instead of being wiped flat.
   * @returns {boolean}
   */
  isNeutral()
  {
    // every channel at rest means nothing is being asked for.
    return this.#tone.every(channel => channel === 0);
  }

  /**
   * Determines whether another declaration says exactly the same thing as this one.
   * @param {ToneDeclaration} other The declaration to compare against.
   * @returns {boolean}
   */
  matches(other)
  {
    // the same tone asked for by someone else is not the same declaration.
    if (this.sourceKey() !== other.sourceKey()) return false;

    // a different journey length is a different request, even to the same colour.
    if (this.durationFrames() !== other.durationFrames()) return false;

    // every channel has to agree for the destination to be the same destination.
    const otherTone = other.tone();

    return this.#tone.every((channel, index) => channel === otherTone.at(index));
  }
}

export default ToneDeclaration;
//endregion ToneDeclaration