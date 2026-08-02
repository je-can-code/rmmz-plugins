//region TimeToneResolver
/**
 * Resolves the screen tone that belongs to a given hour of the day.
 *
 * This is deliberately free of any state at all- hand it an hour, get back a tone. Everything about
 * *when* a tone gets applied, whether the player has locked it, and how it reaches the screen stays
 * with {@link Game_Time}; this only answers "what colour is this hour?".
 *
 * A day is divided into six four-hour phases, each fading from the previous phase's tone into its
 * own. The first three hours of a phase are partway through that fade and the fourth has arrived,
 * which is why an hour resolves to either an interpolation or a phase tone exactly.
 */
class TimeToneResolver
{
  /**
   * The tone each phase of the day settles on, as `[red, green, blue, grey]`.
   *
   * Grey is constrained to 0-255 by the engine while the colour channels span -255 to 255.
   */
  static toneOfDay = {
    Night: [ -100, -100, -30, 100 ],
    Dawn: [ -30, -15, 15, 64 ],
    Morning: [ 0, 0, 0, 0 ],
    Afternoon: [ 10, 10, 10, 10 ],
    Evening: [ 0, -30, -30, -30 ],
    Twilight: [ -68, -68, 0, 68 ],
  };

  /**
   * The tones of day in the order a full day cycles through them.
   *
   * Twilight appears at both ends deliberately: the day opens partway through the twilight-to-night
   * fade and closes having just arrived back at twilight, so bookending it lets one lookup serve
   * every hour without a wraparound special case. Phase `n` starts at index `n` and arrives at
   * index `n + 1`.
   * @type {[number, number, number, number][]}
   */
  static toneSequence = [
    this.toneOfDay.Twilight,
    this.toneOfDay.Night,
    this.toneOfDay.Dawn,
    this.toneOfDay.Morning,
    this.toneOfDay.Afternoon,
    this.toneOfDay.Evening,
    this.toneOfDay.Twilight,
  ];

  /**
   * How many hours each phase of the day occupies before the next takes over.
   * @type {number}
   */
  static hoursPerPhase = 4;

  /**
   * The phase id handed back for an hour that isn't on the 24-hour clock.
   * @type {number}
   */
  static unknownPhase = -1;

  /**
   * Buckets an hour into the phase of day it belongs to.
   *
   * The boundaries are arranged so each phase owns exactly {@link hoursPerPhase} hours, which means
   * this is simply integer division- but it is spelled out as comparisons because the phase ids are
   * a published contract, surfaced to events through the time-of-day variable.
   * @param {number} hours The hour of the day, 0 through 23.
   * @returns {number} The phase id 0-5, or {@link unknownPhase} for an hour off the clock.
   */
  static phaseOfHour(hours)
  {
    // an hour that isn't a whole number on the clock face belongs to no phase.
    if (!this.isClockHour(hours)) return this.unknownPhase;

    // every phase is the same width, so which one an hour falls in is just how many fit beneath it.
    return Math.floor(hours / this.hoursPerPhase);
  }

  /**
   * Determines the hour a given phase of the day begins on.
   * @param {number} phaseId The id of the phase.
   * @returns {number} The hour that phase starts at.
   */
  static startOfPhase(phaseId)
  {
    // phases tile the day end to end, so the nth one starts n widths in.
    return phaseId * this.hoursPerPhase;
  }

  /**
   * Determines whether a value is a real hour on the 24-hour clock.
   *
   * The clock can genuinely hold something else: setting the time and the time-losing plugin
   * commands both write the hour straight through without constraining it to a valid range.
   * @param {number} hours The value to check.
   * @returns {boolean}
   */
  static isClockHour(hours)
  {
    return Number.isInteger(hours) && hours >= 0 && hours <= 23;
  }

  /**
   * Resolves the tone belonging to a given hour of the day.
   * @param {number} hours The hour of the day, 0 through 23.
   * @returns {[number, number, number, number]} The tone for that hour.
   */
  static toneOfHour(hours)
  {
    // an hour off the clock has no tone of its own, so it gets a neutral one. built fresh each call
    // rather than shared from a constant, because callers treat the result as theirs to keep.
    if (!this.isClockHour(hours)) return [ 0, 0, 0, 0 ];

    // which four-hour block of the day we are in.
    const phase = this.phaseOfHour(hours);

    // how far into that block we have travelled, as a whole number of hours.
    const hoursIntoPhase = hours % this.hoursPerPhase;

    // the tone this block is fading toward.
    const destination = this.toneSequence[phase + 1];

    // the final hour of a block has finished fading, so it is the destination tone exactly.
    if (hoursIntoPhase === this.hoursPerPhase - 1) return destination;

    // every other hour sits a fraction of the way along the fade.
    const rate = (hoursIntoPhase + 1) / this.hoursPerPhase;

    return this.between(this.toneSequence[phase], destination, rate);
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
    // anything short of a full rgba quad cannot match- this is how a freshly initialized tone, which
    // starts out empty, always reads as different and therefore always gets applied.
    if (currentTone.length < 4) return false;

    // a single differing channel is enough to make the whole tone different.
    return currentTone.every((channel, index) => channel === targetTone[index]);
  }
}

export default TimeToneResolver;
//endregion TimeToneResolver
