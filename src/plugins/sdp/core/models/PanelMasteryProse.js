//region PanelMasteryProse
/**
 * The player-facing description templates for a subgroup's mastery, one per act.
 * Serialized on each subgroup row in config.sdp.json as a nested `prose` object.
 *
 * A mastery's potency changes tier by tier, but its *mechanic* changes only at act boundaries, so the
 * prose is authored three times per subgroup rather than once per tier. Each template carries tokens
 * that the resolver fills from live data at draw time, which is what keeps a rebalance from leaving
 * the sentence describing a number that no longer exists.
 */
class PanelMasteryProse
{
  /**
   * The highest tier still considered part of the beginning act.
   * @type {number}
   */
  static BeginningActMaxTier = 2;

  /**
   * The highest tier still considered part of the middle act; anything beyond it is the capstone.
   * @type {number}
   */
  static MiddleActMaxTier = 4;

  /**
   * @param {string} beginning The beginning act template driving this step.
   * @param {string} middle The middle act template driving this step.
   * @param {string} end The end act template driving this step.
   */
  constructor(beginning, middle, end)
  {
    /**
     * The template describing the opening tiers through {@link PanelMasteryProse.BeginningActMaxTier},
     * where the base effect is established.
     * @type {string}
     */
    this.beginning = beginning;

    /**
     * The template describing the tiers above {@link PanelMasteryProse.BeginningActMaxTier} and through
     * {@link PanelMasteryProse.MiddleActMaxTier}, where potency ramps and behavior layers appear.
     * @type {string}
     */
    this.middle = middle;

    /**
     * The template describing the capstone tier above {@link PanelMasteryProse.MiddleActMaxTier},
     * usually a qualitative shift rather than a bigger number.
     * @type {string}
     */
    this.end = end;
  }

  /**
   * Whether any act of this subgroup has an authored template.
   * A subgroup with none falls through to the generated per-tag prose instead of rendering blank.
   * @returns {boolean}
   */
  hasProse()
  {
    if (this.beginning !== String.empty) return true;

    if (this.middle !== String.empty) return true;

    return this.end !== String.empty;
  }

  /**
   * The template describing the given tier, before token resolution.
   *
   * Falls back through the neighboring acts rather than returning blank, because a subgroup whose
   * mechanic never changes is authored once and left to cover the whole strip. `humanoid-orc` is the
   * standing example: every tier is the same cooldown reduction at a different number, so only the
   * beginning act is written and the remaining tiers resolve to it.
   * @param {number} tier The subgroup tier driving this step.
   * @returns {string}
   */
  forTier(tier)
  {
    if (tier <= PanelMasteryProse.BeginningActMaxTier)
    {
      return this.#firstAuthored(this.beginning, this.middle, this.end);
    }

    if (tier <= PanelMasteryProse.MiddleActMaxTier)
    {
      return this.#firstAuthored(this.middle, this.beginning, this.end);
    }

    return this.#firstAuthored(this.end, this.middle, this.beginning);
  }

  /**
   * The first of the given templates that was actually authored.
   * @param {string} preferred The act the tier actually belongs to.
   * @param {string} firstFallback The act to borrow from when the preferred one is blank.
   * @param {string} secondFallback The act to borrow from when both others are blank.
   * @returns {string}
   */
  #firstAuthored(preferred, firstFallback, secondFallback)
  {
    if (preferred !== String.empty) return preferred;

    if (firstFallback !== String.empty) return firstFallback;

    return secondFallback;
  }

  /**
   * An empty prose row for a subgroup whose masteries have no authored description.
   * @returns {PanelMasteryProse}
   */
  static none()
  {
    return new PanelMasteryProse(String.empty, String.empty, String.empty);
  }

  /**
   * Hydrates mastery prose from a parsed config.sdp.json subgroup row.
   * A row predating this field yields the empty prose rather than failing to load.
   * @param {object} parsedSubgroup The parsed subgroup driving this step.
   * @returns {PanelMasteryProse}
   */
  static fromConfigSubgroup(parsedSubgroup)
  {
    const nested = parsedSubgroup.prose;

    if (!nested) return PanelMasteryProse.none();

    return new PanelMasteryProse(
      nested.beginning ?? String.empty,
      nested.middle ?? String.empty,
      nested.end ?? String.empty
    );
  }

  /**
   * Serializes this prose row for config.sdp.json.
   * @returns {{ beginning: string, middle: string, end: string }}
   */
  toConfigJson()
  {
    return {
      beginning: this.beginning,
      middle: this.middle,
      end: this.end,
    };
  }
}

export default PanelMasteryProse;
//endregion PanelMasteryProse