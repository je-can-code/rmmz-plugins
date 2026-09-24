//region GaugeTrail
/**
 * The trail that shows recent change on a gauge, the way many action games show it: a loss snaps the bar down
 * and leaves a chunk of the old amount behind that drains away, and a gain puts a chunk of the new amount up
 * ahead of the bar that the bar then fills into.<br/>
 * It is the numbers only- where the bar's fill ends, where the trail ends, and which way things are going. The
 * gauge that owns it decides how to draw that.
 */
class GaugeTrail
{
  /**
   * Which way the gauge is moving, which decides the trail's color.
   */
  static Trends = {
    /**
     * Nothing to show: the fill and the trail agree.
     */
    Steady: 'steady',

    /**
     * The value dropped: the fill already sits at it, and the trail drains down after it.
     */
    Loss: 'loss',

    /**
     * The value rose: the trail already sits at it, and the fill grows up into it.
     */
    Gain: 'gain',
  };

  /**
   * How much of the remaining gap the moving end closes each frame- one tenth, so it closes fast at first and
   * eases in at the end.
   * @type {number}
   */
  static CatchUpDivisor = 10;

  /**
   * How small the gap has to get, as a fraction of the gauge's max, before the trail settles. A tenth of a
   * percent of the bar is under a pixel on all but the widest gauges, so settling there is never seen as a jump.
   * @type {number}
   */
  static SettleFraction = 0.001;

  /**
   * The latest true value the gauge was given.
   * @type {number}
   */
  #value = 0;

  /**
   * Where the gauge's fill ends.
   * @type {number}
   */
  #fill = 0;

  /**
   * Where the trail ends. Never short of the fill.
   * @type {number}
   */
  #trail = 0;

  /**
   * The gauge's max. Not a number until the first value arrives, which is how a cleared trail knows to take
   * its first value as it is instead of animating toward it.
   * @type {number}
   */
  #max = NaN;

  /**
   * Which way the gauge is moving.
   * @type {string}
   */
  #trend = GaugeTrail.Trends.Steady;

  /**
   * Forgets everything, so the next value the trail is given is taken as it is, with nothing to animate.<br/>
   * A gauge does this when it starts showing a different battler- that battler's value was never on the bar,
   * so there is no change to show.
   */
  clear()
  {
    this.#value = 0;
    this.#fill = 0;
    this.#trail = 0;
    this.#max = NaN;
    this.#trend = GaugeTrail.Trends.Steady;
  }

  /**
   * Gives the trail the gauge's value for this frame, then moves the trail one frame along.<br/>
   * Meant to be called once per frame with whatever the gauge currently holds; a value that has not changed
   * just lets the trail keep moving.
   * @param {number} value The gauge's current value.
   * @param {number} max The gauge's current max.
   */
  track(value, max)
  {
    // the first value after a clear is taken as it is- there is no earlier value to show a change from.
    if (!this.hasObserved())
    {
      this.#adopt(value, max);
      return;
    }

    // the max can change on its own, like when a buff raises max hp.
    this.#max = max;

    // only a new value changes where the ends sit; an unchanged one just lets the trail keep moving.
    if (value !== this.#value)
    {
      this.#observe(value);
    }

    // move the trail one frame along.
    this.#step();
  }

  /**
   * Takes a value as it is, with nothing to animate.
   * @param {number} value The value to adopt.
   * @param {number} max The max to adopt.
   */
  #adopt(value, max)
  {
    this.#value = value;
    this.#fill = value;
    this.#trail = value;
    this.#max = max;
    this.#trend = GaugeTrail.Trends.Steady;
  }

  /**
   * Moves the ends to show a new value.
   * @param {number} value The new value.
   */
  #observe(value)
  {
    // a value below the bar's fill is a loss.
    if (value < this.#fill)
    {
      this.#observeLoss(value);
    }
    // anything else is at or above the fill- a gain, or a smaller gain than the one already showing.
    else
    {
      this.#observeGain(value);
    }

    // remember the value for the next frame's comparison.
    this.#value = value;
  }

  /**
   * Shows a loss: the fill drops straight to the new value, and the trail marks what was on the bar before it.
   * @param {number} value The new, lower value.
   */
  #observeLoss(value)
  {
    // a gain still filling in never made it onto the bar, so the loss is measured from what the bar did show.
    // A drain already underway keeps going from wherever it has got to.
    if (this.#trend === GaugeTrail.Trends.Gain)
    {
      this.#trail = this.#fill;
    }

    // the fill drops straight to the new value.
    this.#fill = value;

    // and the trail drains down after it.
    this.#trend = GaugeTrail.Trends.Loss;
  }

  /**
   * Shows a gain: the trail jumps straight to the new value, and the fill grows up into it.
   * @param {number} value The new value, at or above the fill.
   */
  #observeGain(value)
  {
    // the trail marks the new value- replacing whatever it was marking, so a gain in the middle of a drain
    // shows the gain rather than the loss before it.
    this.#trail = value;

    // with the value exactly at the fill there is nothing left to show; above it, the fill grows up into it.
    this.#trend = value > this.#fill
      ? GaugeTrail.Trends.Gain
      : GaugeTrail.Trends.Steady;
  }

  /**
   * Moves the trail one frame along: whichever end is moving closes part of the gap, and the two settle
   * together once the gap is too small to see.
   */
  #step()
  {
    // nothing moves while the two ends agree.
    if (this.#trend === GaugeTrail.Trends.Steady) return;

    // close part of the gap from whichever end is moving.
    const catchUp = (this.#trail - this.#fill) / GaugeTrail.CatchUpDivisor;
    if (this.#trend === GaugeTrail.Trends.Loss)
    {
      this.#trail -= catchUp;
    }
    else
    {
      this.#fill += catchUp;
    }

    // once what is left is too small to see, the two ends meet at the value.
    const settleGap = this.#max * GaugeTrail.SettleFraction;
    if ((this.#trail - this.#fill) <= settleGap)
    {
      this.#fill = this.#value;
      this.#trail = this.#value;
      this.#trend = GaugeTrail.Trends.Steady;
    }
  }

  /**
   * Whether the trail has been given a value since it was made or last cleared.
   * @returns {boolean}
   */
  hasObserved()
  {
    return !Number.isNaN(this.#max);
  }

  /**
   * Whether the fill and the trail agree, with nothing left to show.
   * @returns {boolean}
   */
  isSettled()
  {
    return this.#trend === GaugeTrail.Trends.Steady;
  }

  /**
   * Which way the gauge is moving.
   * @returns {string}
   */
  trend()
  {
    return this.#trend;
  }

  /**
   * How far along the gauge its fill reaches, from 0 to 1.
   * @returns {number}
   */
  fillRate()
  {
    return this.#rateOf(this.#fill);
  }

  /**
   * How far along the gauge its trail reaches, from 0 to 1.
   * @returns {number}
   */
  trailRate()
  {
    return this.#rateOf(this.#trail);
  }

  /**
   * How far along the gauge an amount reaches, from 0 to 1.<br/>
   * A gauge without a max to measure against- nothing given yet, or a max of 0- reaches nowhere.
   * @param {number} amount The amount to measure.
   * @returns {number}
   */
  #rateOf(amount)
  {
    // with a max to measure against, the amount reaches its share of it.
    if (this.#max > 0) return amount / this.#max;

    // with nothing to measure against- no value given yet, or a max of 0- it reaches nowhere.
    return 0;
  }
}

export default GaugeTrail;
//endregion GaugeTrail