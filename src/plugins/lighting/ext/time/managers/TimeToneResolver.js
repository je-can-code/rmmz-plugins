//region TimeToneResolver
/**
 * Resolves what the sky looks like at a given hour of the day.
 *
 * This is deliberately free of any state at all- hand it an hour and a curve, get back a value.
 * Everything about *when* that value gets applied, whether the sky has been frozen, and how it
 * reaches the screen stays outside.
 *
 * How the day is divided is not decided here either. That belongs to the clock, which surfaces the
 * same six buckets to events as time-of-day ids, so this reads `TimePhases` rather than keeping a
 * second copy that could drift from the one authors write conditionals against.
 *
 * Each phase *begins* on its own value and spends its four hours travelling toward the next one's.
 * That alignment is the whole reason {@link rateIntoPhase} lives here rather than with the rest of
 * the phase maths: it is a statement about how a curve is read, not about how the day is divided,
 * and the clock has no opinion on it.
 */
class TimeToneResolver
{
  /**
   * How far through its own phase a given hour sits, as a fraction.
   *
   * A phase's first hour sits exactly on that phase's own value, which is what makes the hours named
   * Night actually look like night rather than spending themselves still fading out of evening. The
   * fraction therefore starts at 0 and stops short of 1 - the value it would be travelling toward is
   * the next phase's, and the next phase opens by sitting on it.
   * @param {number} hours The hour of the day, 0 through 23.
   * @returns {number} The fraction of the way across, 0 up to but never including 1.
   */
  static rateIntoPhase(hours)
  {
    const hoursIntoPhase = hours % TimePhases.hoursPerPhase;

    return hoursIntoPhase / TimePhases.hoursPerPhase;
  }

  /**
   * Resolves the tone belonging to a given hour of the day.
   * @param {number} hours The hour of the day, 0 through 23.
   * @param {number[][]} toneSequence The tone each phase settles on, in the order they cycle.
   * @returns {[number, number, number, number]} The tone for that hour.
   */
  static toneOfHour(hours, toneSequence)
  {
    // an hour off the clock has no tone of its own, so it gets a neutral one. built fresh each call
    // rather than shared from a constant, because callers treat the result as theirs to keep.
    if (TimePhases.isClockHour(hours) === false) return [ 0, 0, 0, 0 ];

    const phase = TimePhases.phaseOfHour(hours);
    const destination = toneSequence.at(phase + 1);
    const rate = this.rateIntoPhase(hours);

    return this.between(toneSequence.at(phase), destination, rate);
  }

  /**
   * Resolves how much light the sky has taken away at a given hour of the day.
   * @param {number} hours The hour of the day, 0 through 23.
   * @param {number[]} darknessSequence The darkness each phase settles on, in the order they cycle.
   * @returns {number} The darkness for that hour, 0 through 1.
   */
  static darknessOfHour(hours, darknessSequence)
  {
    // an hour off the clock takes no light away, the same way it casts no colour.
    if (TimePhases.isClockHour(hours) === false) return 0;

    const phase = TimePhases.phaseOfHour(hours);
    const destination = darknessSequence.at(phase + 1);
    const rate = this.rateIntoPhase(hours);
    const origin = darknessSequence.at(phase);

    // darkness is a single fraction rather than four channels, so it simply travels in a line.
    return origin + ((destination - origin) * rate);
  }

  /**
   * Calculates the tone a given fraction of the way between two tones.
   *
   * Order matters- this travels from the first tone toward the second, so swapping the arguments
   * does not produce the same result unless the rate is exactly half.
   * @param {[number, number, number, number]} fromTone The tone being left behind.
   * @param {[number, number, number, number]} toTone The tone being approached.
   * @param {number} rate The decimal fraction of the way across, 0 through 1.
   * @returns {[number, number, number, number]}
   */
  static between(fromTone, toTone, rate)
  {
    // the gap between two channel values, regardless of which way round they sit.
    const distance = (from, to) => (from > to
      ? from - to
      : to - from);

    const blended = [];

    // walk the channels in lockstep, moving each one its own share of the way toward the target.
    fromTone.forEach((fromChannel, index) =>
    {
      const toChannel = toTone[index];

      // how far this channel travels at the given rate, rounded since tones are whole numbers.
      const travelled = Math.round(distance(fromChannel, toChannel) * rate);

      // move toward the target, which may mean up or down depending on which is brighter.
      blended.push(toChannel > fromChannel
        ? fromChannel + travelled
        : fromChannel - travelled);
    });

    return blended;
  }

  /**
   * Compares two tones channel by channel to see whether they are the same.
   * @param {[number, number, number, number]} currentTone The tone presently in effect.
   * @param {[number, number, number, number]} targetTone The tone being compared against.
   * @returns {boolean}
   */
  static isSameTone(currentTone, targetTone)
  {
    // anything short of a full rgba quad cannot match, which is how a tone that was never set always
    // reads as different and therefore always gets applied.
    if (currentTone.length < 4) return false;

    // a single differing channel is enough to make the whole tone different.
    return currentTone.every((channel, index) => channel === targetTone[index]);
  }
}

export default TimeToneResolver;
//endregion TimeToneResolver