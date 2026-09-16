//region ChatterSession
/**
 * One line a character is saying right now.
 *
 * It holds the line and the clock, and deliberately not the bubble. The bubble is rebuilt from this
 * by whichever layer happens to be on screen, exactly as a spent bubble is rebuilt from its entry -
 * so a scene torn down and remade loses nothing a player would notice.
 *
 * **The duration clock does not start when the bubble appears; it starts when the line finishes
 * typing itself out.** Otherwise a long line would be readable for less time than a short one, which
 * is precisely backwards. The reveal itself is drawn by the sprite, so the sprite is what says when
 * it finished - this only knows that it has.
 */
class ChatterSession
{
  /**
   * What this character is saying.
   * @type {string}
   */
  #line = String.empty;

  /**
   * The settled profile this line is being said under.
   * @type {ChatterProfile}
   */
  #profile = null;

  /**
   * Whether this line was demanded by a plugin command rather than chosen by the character.
   *
   * A forced line ignores the rules that exist to keep idle chatter out of the way - earshot and
   * cooldown both - because somebody wrote it into a scene deliberately, and a scene is allowed to
   * say things the ambient system would not.
   * @type {boolean}
   */
  #forced = false;

  /**
   * Whether this line stays up even while its speaker is delivering a real message.
   *
   * Off by default, and deliberately separate from being forced. A character cannot ordinarily be
   * muttering and speaking dialogue at once - the two bubbles would land in the same place - so
   * keeping both is something an author opts into, having decided where each one goes.
   *
   * What it buys is a character thinking one thing while saying another, which is a scene that
   * cannot be written any other way: a thought bubble over their head and their spoken line at their
   * feet, both on screen, neither interrupting the other.
   * @type {boolean}
   */
  #persistent = false;

  /**
   * Whether the line has finished typing itself out.
   * @type {boolean}
   */
  #revealed = false;

  /**
   * How many frames this line stays on screen once it has finished revealing.
   * @type {number}
   */
  #durationRemaining = 0;

  /**
   * Constructor.
   * @param {string} line What this character is saying.
   * @param {ChatterProfile} profile The settled profile it is being said under.
   * @param {boolean} forced Whether a plugin command demanded this line.
   * @param {number} duration How many frames it stays up once it has finished revealing.
   * @param {boolean} persistent Whether it survives a message opening above the same character.
   */
  constructor(line, profile, forced, duration, persistent)
  {
    this.#line = line;
    this.#profile = profile;
    this.#forced = forced;
    this.#durationRemaining = duration;
    this.#persistent = persistent;
  }

  /**
   * What this character is saying.
   * @returns {string}
   */
  line()
  {
    return this.#line;
  }

  /**
   * The settled profile this line is being said under.
   * @returns {ChatterProfile}
   */
  profile()
  {
    return this.#profile;
  }

  /**
   * Whether a plugin command demanded this line.
   * @returns {boolean}
   */
  isForced()
  {
    return this.#forced;
  }

  /**
   * Whether this line stays up while its speaker delivers a real message.
   * @returns {boolean}
   */
  isPersistent()
  {
    return this.#persistent;
  }

  /**
   * Whether the line has finished typing itself out.
   * @returns {boolean}
   */
  hasRevealed()
  {
    return this.#revealed;
  }

  /**
   * Declares that the line has finished typing itself out.
   */
  flagRevealed()
  {
    this.#revealed = true;
  }

  /**
   * How many frames this line has left on screen.
   * @returns {number}
   */
  durationRemaining()
  {
    return this.#durationRemaining;
  }

  /**
   * Sets how many frames this line has left on screen.
   * @param {number} frames The frames remaining.
   */
  setDurationRemaining(frames)
  {
    this.#durationRemaining = frames;
  }

  /**
   * Whether this line has been on screen long enough and should come down.
   *
   * A line that has not finished revealing is never finished, however long it has taken - which is
   * what makes the duration a measure of reading time rather than of total time.
   * @returns {boolean}
   */
  isFinished()
  {
    if (this.#revealed === false) return false;

    return this.#durationRemaining <= 0;
  }
}

export default ChatterSession;
//endregion ChatterSession