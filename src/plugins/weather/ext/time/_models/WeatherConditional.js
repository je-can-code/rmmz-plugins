//region WeatherConditional
/**
 * One requirement an event page places on the weather.
 *
 * **Immutable, and built through the named factories rather than assembled field by field.** A
 * conditional exists for the length of one `meetsConditions` call and answers one question, so
 * there is nothing for a setter to be for - and a half-built conditional is a thing that can
 * silently mean "any weather at all".
 *
 * A single strength and a range are the same mechanism with the bounds set equal, which is what
 * keeps `isMet` three comparisons rather than a fork per tag shape.
 */
class WeatherConditional
{
  /**
   * The value a bound takes when it constrains nothing.
   *
   * Not zero, because zero is a real answer: it is what the weather reports when there is none,
   * and a page requiring "no weather" is a page somebody will eventually write.
   * @type {number}
   */
  static Any = -1;

  /**
   * The look this page requires, or {@link WeatherConditional.Any}.
   * @type {number}
   */
  #typeId = WeatherConditional.Any;

  /**
   * The weakest strength this page accepts, or {@link WeatherConditional.Any}.
   * @type {number}
   */
  #minIntensity = WeatherConditional.Any;

  /**
   * The strongest strength this page accepts, or {@link WeatherConditional.Any}.
   * @type {number}
   */
  #maxIntensity = WeatherConditional.Any;

  /**
   * Constructor.
   * @param {number} typeId The look required, or {@link WeatherConditional.Any}.
   * @param {number} minIntensity The weakest strength accepted, or {@link WeatherConditional.Any}.
   * @param {number} maxIntensity The strongest strength accepted, or {@link WeatherConditional.Any}.
   */
  constructor(typeId, minIntensity, maxIntensity)
  {
    this.#typeId = typeId;
    this.#minIntensity = minIntensity;
    this.#maxIntensity = maxIntensity;
  }

  /**
   * A requirement on the look, and nothing else.
   * @param {number} typeId The declared id of the look required.
   * @returns {WeatherConditional}
   */
  static forType(typeId)
  {
    return new WeatherConditional(typeId, WeatherConditional.Any, WeatherConditional.Any);
  }

  /**
   * A requirement on the strength, and nothing else.
   * @param {number} intensityId The declared id of the strength required.
   * @returns {WeatherConditional}
   */
  static forIntensity(intensityId)
  {
    return new WeatherConditional(WeatherConditional.Any, intensityId, intensityId);
  }

  /**
   * A requirement that the strength fall within a span, inclusive at both ends.
   * @param {number} minIntensity The declared id of the weakest strength accepted.
   * @param {number} maxIntensity The declared id of the strongest strength accepted.
   * @returns {WeatherConditional}
   */
  static forIntensityRange(minIntensity, maxIntensity)
  {
    return new WeatherConditional(WeatherConditional.Any, minIntensity, maxIntensity);
  }

  /**
   * Gets the look this page requires.
   * @returns {number} The typeId, or {@link WeatherConditional.Any}.
   */
  typeId()
  {
    // hand back the look required.
    return this.#typeId;
  }

  /**
   * Gets the weakest strength this page accepts.
   * @returns {number} The minIntensity, or {@link WeatherConditional.Any}.
   */
  minIntensity()
  {
    // hand back the lower bound.
    return this.#minIntensity;
  }

  /**
   * Gets the strongest strength this page accepts.
   * @returns {number} The maxIntensity, or {@link WeatherConditional.Any}.
   */
  maxIntensity()
  {
    // hand back the upper bound.
    return this.#maxIntensity;
  }

  /**
   * Whether the weather currently on screen satisfies this requirement.
   * @param {number} typeId The declared id of the look being drawn, or zero for none.
   * @param {number} intensityId The declared id of its strength, or zero for none.
   * @returns {boolean}
   */
  isMet(typeId, intensityId)
  {
    // a bound that constrains nothing is skipped rather than compared, which is what lets one tag
    // speak about the look and another about the strength without either implying the other.
    if (this.#typeId !== WeatherConditional.Any && this.#typeId !== typeId) return false;

    if (this.#minIntensity !== WeatherConditional.Any && intensityId < this.#minIntensity) return false;

    if (this.#maxIntensity !== WeatherConditional.Any && intensityId > this.#maxIntensity) return false;

    return true;
  }
}

export default WeatherConditional;
//endregion WeatherConditional