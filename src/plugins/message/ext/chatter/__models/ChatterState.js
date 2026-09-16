//region ChatterState
/**
 * Everything the chatter system remembers about one character.
 *
 * A state outlives any line the character says. It is created when a page declares chatter and it
 * survives every line, every cooldown and every trip out of earshot, because the timers are the
 * whole point - a character who has just spoken has to keep being the character who has just spoken
 * for the next ten seconds.
 */
class ChatterState
{
  /**
   * The delay value meaning no wait has been rolled yet.
   *
   * Distinct from a rolled wait of zero, which means "speak on the very next frame you are able to".
   * A single number covers both because a wait is never legitimately negative.
   * @type {number}
   */
  static NoDelay = -1;

  /**
   * This character's settled chatter profile.
   * @type {ChatterProfile}
   */
  #profile = null;

  /**
   * How many frames are left of this character's rolled wait.
   * @type {number}
   */
  #delayRemaining = ChatterState.NoDelay;

  /**
   * How many frames are left before this character may speak again.
   * @type {number}
   */
  #cooldownRemaining = 0;

  /**
   * The line this character is saying right now, if any.
   * @type {?ChatterSession}
   */
  #session = null;

  /**
   * The last thing this character said.
   *
   * Kept so the picker can avoid repeating it. It survives the session that said it on purpose - the
   * repeat worth avoiding is the one a player hears back to back, and by the time a third line comes
   * around the first is long out of earshot of memory.
   * @type {string}
   */
  #lastLine = String.empty;

  /**
   * Constructor.
   * @param {ChatterProfile} profile This character's settled chatter profile.
   */
  constructor(profile)
  {
    this.#profile = profile;
  }

  /**
   * This character's settled chatter profile.
   * @returns {ChatterProfile}
   */
  profile()
  {
    return this.#profile;
  }

  /**
   * Sets this character's settled chatter profile.
   * @param {ChatterProfile} profile The newly-settled profile.
   */
  setProfile(profile)
  {
    this.#profile = profile;
  }

  /**
   * How many frames are left of this character's rolled wait.
   * @returns {number}
   */
  delayRemaining()
  {
    return this.#delayRemaining;
  }

  /**
   * Sets how many frames are left of this character's rolled wait.
   * @param {number} frames The frames remaining, or {@link ChatterState.NoDelay} to ask for a
   * fresh roll.
   */
  setDelayRemaining(frames)
  {
    this.#delayRemaining = frames;
  }

  /**
   * Whether this character is due a freshly-rolled wait.
   * @returns {boolean}
   */
  isAwaitingDelayRoll()
  {
    return this.#delayRemaining === ChatterState.NoDelay;
  }

  /**
   * How many frames are left before this character may speak again.
   * @returns {number}
   */
  cooldownRemaining()
  {
    return this.#cooldownRemaining;
  }

  /**
   * Sets how many frames are left before this character may speak again.
   * @param {number} frames The frames remaining.
   */
  setCooldownRemaining(frames)
  {
    this.#cooldownRemaining = frames;
  }

  /**
   * The line this character is saying right now.
   * @returns {?ChatterSession} The live line, or null when this character is quiet.
   */
  session()
  {
    return this.#session;
  }

  /**
   * Sets the line this character is saying right now.
   * @param {?ChatterSession} session The line, or null to make them quiet.
   */
  setSession(session)
  {
    this.#session = session;
  }

  /**
   * Whether this character is saying something right now.
   * @returns {boolean}
   */
  isSpeaking()
  {
    return this.#session !== null;
  }

  /**
   * The last thing this character said.
   * @returns {string}
   */
  lastLine()
  {
    return this.#lastLine;
  }

  /**
   * Sets the last thing this character said.
   * @param {string} line The line just chosen.
   */
  setLastLine(line)
  {
    this.#lastLine = line;
  }
}

export default ChatterState;
//endregion ChatterState