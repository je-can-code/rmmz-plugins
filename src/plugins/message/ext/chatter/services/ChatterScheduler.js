//region ChatterScheduler
/**
 * Decides whether a character speaks, and how fast the words arrive when they do.
 *
 * Every answer here is a function of its arguments and nothing else, which is the point: the rules
 * about earshot and waiting are the part of chatter most likely to be argued with later, and keeping
 * them out of the manager means they can be argued with in a test rather than in a playtest.
 *
 * The random source is injected for the same reason. `Math.random` is the real one, and a fixed
 * source is what lets "the wait lands somewhere inside the range" be an assertion instead of a hope.
 */
class ChatterScheduler
{
  /**
   * Whether the player is close enough to hear this character.
   *
   * Walls do not enter into it. Nothing in this project treats a radius as anything other than the
   * distance between two points, and chatter is not going to be the one system that does.
   * @param {number} distance How many tiles apart the player and the character are.
   * @param {ChatterProfile} profile The character's settled chatter profile.
   * @returns {boolean}
   */
  static isWithinEarshot(distance, profile)
  {
    return distance <= profile.radius();
  }

  /**
   * Rolls how long this character waits before starting their next line.
   *
   * Somewhere between saying it immediately and waiting the whole configured delay. A fixed wait
   * would have every shopkeeper on a street speak in lockstep forever, which reads as a mechanism
   * rather than as a town - and the whole effect depends on the player not noticing the mechanism.
   * @param {ChatterProfile} profile The character's settled chatter profile.
   * @param {function(): number} random A source of numbers from zero up to but excluding one.
   * @returns {number} The wait, in frames.
   */
  static rollDelay(profile, random)
  {
    const longest = profile.delay();

    // inclusive of the longest wait: a source answering just under one has to be able to produce it,
    // or the configured number is a value the game can never actually wait.
    return Math.floor(random() * (longest + 1));
  }

  /**
   * Whether the moment has come for this character to speak.
   *
   * Deliberately says nothing about whether they have anything *to* say. That is the caller's
   * question, because the caller is the one holding the pool and about to pick from it - and asking
   * it in both places would leave whichever copy ran second unable to change any outcome.
   * @param {number} distance How many tiles apart the player and the character are.
   * @param {ChatterProfile} profile The character's settled chatter profile.
   * @param {number} delayRemaining How many frames of their rolled wait are left.
   * @returns {boolean}
   */
  static shouldSpeak(distance, profile, delayRemaining)
  {
    if (ChatterScheduler.isWithinEarshot(distance, profile) === false) return false;

    return delayRemaining <= 0;
  }

  /**
   * How many characters of a line are visible after a given number of frames.
   *
   * Counted from the frames a bubble has been open rather than accumulated per character, so a
   * dropped frame costs the reveal nothing and two bubbles opened together stay in step.
   * @param {number} frames How many frames the line has been revealing for.
   * @param {number} speed How many frames each character takes to appear.
   * @param {number} total How many characters the line has in total.
   * @returns {number}
   */
  static revealedCount(frames, speed, total)
  {
    // a speed of zero is "all at once", which is the only sensible reading of asking for no frames
    // per character - and it is the setting somebody reaches for when they want chatter to behave
    // the way it did before it typed itself out.
    if (speed <= 0) return total;

    const revealed = Math.floor(frames / speed);

    return Math.min(revealed, total);
  }
}

export default ChatterScheduler;
//endregion ChatterScheduler