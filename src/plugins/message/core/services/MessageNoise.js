//region MessageNoise
/**
 * Randomness that is not random, for the two places a message needs something to look unpredictable.
 *
 * A trembling letter and a wobbling voice both want to seem unplanned, and both have to be perfectly
 * reproducible: the renderer may ask for the same glyph on the same frame more than once, and
 * anything reaching for `Math.random` would shimmer rather than tremble and would be untestable
 * besides. Same seed, same answer, every time and forever.
 *
 * The mixing step below is the part that is easy to leave out and impossible to spot afterward.
 * Callers pick a bucket with a remainder, which reads the *low* bits of the hash and nothing else,
 * while two adjacent seeds differ almost entirely in the high bits. Without an avalanche, "random"
 * values for neighbouring glyphs come out nearly equal - a line that trembles in unison, or a voice
 * that drifts smoothly instead of wobbling.
 */
class MessageNoise
{
  /**
   * The multiplier in the avalanche step, taken from a standard integer finalizer.
   * @type {number}
   */
  static Mixer = 2246822507;

  /**
   * How many buckets a hash is reduced to before being scaled.
   *
   * A thousand is finer than any consumer here can resolve, and keeps the arithmetic in integers
   * until the last possible step.
   * @type {number}
   */
  static Buckets = 1000;

  /**
   * Scrambles an integer so that its low bits no longer reflect the structure of its inputs.
   * @param {number} value The raw hash.
   * @returns {number} The scrambled hash, as an unsigned integer.
   */
  static avalanche(value)
  {
    let mixed = value ^ (value >>> 15);
    mixed = Math.imul(mixed, MessageNoise.Mixer);
    mixed ^= mixed >>> 13;

    return mixed >>> 0;
  }

  /**
   * A reproducible value from a seed, spread evenly across the full swing either side of zero.
   * @param {number} seed The seed to derive from.
   * @returns {number} A value from -1 up to just under 1.
   */
  static signedUnit(seed)
  {
    const hashed = MessageNoise.avalanche(seed);
    const unitPosition = (hashed % MessageNoise.Buckets) / MessageNoise.Buckets;

    return (unitPosition * 2) - 1;
  }
}

export default MessageNoise;
//endregion MessageNoise