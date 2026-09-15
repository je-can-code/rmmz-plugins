//region TimePhases
/**
 * How the day is divided, and which part of it a given hour belongs to.
 *
 * A day is six four-hour phases. That division is a clock concept rather than a presentational one -
 * it is surfaced to events through the time-of-day variable and the time conditionals, so anything
 * an author writes against "is it evening" is written against this.
 *
 * What a phase *looks* like is deliberately not here. Colour and darkness belong to whatever is
 * presenting the time, and this class stays useful with nothing presenting it at all.
 */
class TimePhases
{
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
   * this is simply integer division- but it is spelled out because the phase ids are a published
   * contract, surfaced to events through the time-of-day variable.
   * @param {number} hours The hour of the day, 0 through 23.
   * @returns {number} The phase id 0-5, or {@link unknownPhase} for an hour off the clock.
   */
  static phaseOfHour(hours)
  {
    // an hour that isn't a whole number on the clock face belongs to no phase.
    if (this.isClockHour(hours) === false) return this.unknownPhase;

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
}

export default TimePhases;
//endregion TimePhases