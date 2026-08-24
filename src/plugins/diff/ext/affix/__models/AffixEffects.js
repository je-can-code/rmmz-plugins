//region AffixEffects
/**
 * The affix biasing a single difficulty layer applies while it is enabled.
 *
 * Every field defaults to its identity value, so a layer declaring a partial block gets exactly the
 * effects it asked for and nothing else. A layer declaring no block at all never builds one of these
 * and is skipped entirely when the enabled layers are folded together.
 *
 * Grants arrive here unsorted. Deciding whether a granted state belongs to the prefix or the suffix
 * pool requires reading its notetags off a hydrated `$dataStates` row, and those do not exist yet at
 * the moment this is constructed - plugin metadata is built during script evaluation, long before the
 * database loads. So the raw pairs are held as authored and the split happens later, during the
 * boot-time validation pass that already has to walk every grant anyway.
 */
class AffixEffects
{
  /**
   * Builds an instance from a layer's raw `affixEffects` JSON block.
   *
   * Grant keys are coerced to numbers here rather than anywhere later. JSON object keys are always
   * strings, while the affix pools are keyed by the numeric `state.id` - so an uncoerced key would
   * land beside the numeric entry as a second, parallel member of the pool rather than replacing it.
   * The roll would then be able to return a string, which survives every downstream use because
   * array indexing coerces it back, leaving a double-counted pool and nothing reporting a problem.
   * @param {string} layerKey The key of the layer this block was authored on, used in error messages.
   * @param {object} rawBlock The `affixEffects` object as parsed from the configuration file.
   * @returns {AffixEffects}
   */
  static fromRaw(layerKey, rawBlock)
  {
    const affixEffects = new AffixEffects();

    const {
      prefixChance,
      suffixChance,
      flatten,
      grants
    } = rawBlock;

    // each field is optional; an omitted one keeps the identity default already on the instance.
    if (prefixChance !== undefined)
    {
      affixEffects.prefixChance = AffixEffects.#validatedChance(layerKey, 'prefixChance', prefixChance);
    }

    if (suffixChance !== undefined)
    {
      affixEffects.suffixChance = AffixEffects.#validatedChance(layerKey, 'suffixChance', suffixChance);
    }

    if (flatten !== undefined)
    {
      affixEffects.flatten = AffixEffects.#validatedFlatten(layerKey, flatten);
    }

    if (grants !== undefined)
    {
      affixEffects.setRawGrants(AffixEffects.#validatedGrants(layerKey, grants));
    }

    return affixEffects;
  }

  /**
   * Rejects a chance multiplier that cannot mean anything.
   * Zero is deliberately allowed and means "this layer suppresses that slot entirely while enabled";
   * only a negative multiplier is nonsense, because it would flip the sign of a percentage.
   * @param {string} layerKey The layer being validated, for the error message.
   * @param {string} fieldName Which of the two chance fields this is, for the error message.
   * @param {number} chance The authored value.
   * @returns {number}
   */
  static #validatedChance(layerKey, fieldName, chance)
  {
    if (chance < 0)
    {
      throw new Error(`[J-Difficulty-Affix] layer [${layerKey}] has ${fieldName}:${chance}; must not be negative.`);
    }

    return chance;
  }

  /**
   * Rejects a flatten outside the range the interpolation is defined over.
   * Above 100 would push weights past the mean and out the other side, inverting the pool's ordering
   * rather than levelling it; below 0 would exaggerate the pool instead of flattening it. Neither is
   * what any author means by the word, so both are a mistake rather than a feature.
   * @param {string} layerKey The layer being validated, for the error message.
   * @param {number} flatten The authored value.
   * @returns {number}
   */
  static #validatedFlatten(layerKey, flatten)
  {
    if (flatten < 0 || flatten > 100)
    {
      throw new Error(`[J-Difficulty-Affix] layer [${layerKey}] has flatten:${flatten}; must be between 0 and 100.`);
    }

    return flatten;
  }

  /**
   * Converts the authored grants object into a map keyed by numeric state id.
   * Only the shape is checked here. Whether a granted id names a real state, which slot it belongs
   * to, and whether it was authored at zero weight are all questions needing the database, so they
   * are asked later by {@link JDifficultyAffix_PluginMetadata#assertGrantsAreValid}.
   * @param {string} layerKey The layer being validated, for the error message.
   * @param {object} grants The authored grants object of state id to weight.
   * @returns {Map<number, number>}
   */
  static #validatedGrants(layerKey, grants)
  {
    const rawGrants = new Map();

    Object.entries(grants)
      .forEach(([ stateId, weight ]) =>
      {
        if (weight < 0)
        {
          throw new Error(
            `[J-Difficulty-Affix] layer [${layerKey}] grants state [${stateId}] a weight of ` +
            `[${weight}]; must not be negative.`);
        }

        rawGrants.set(parseInt(stateId), weight);
      });

    return rawGrants;
  }

  /**
   * The multiplier applied to whatever prefix chance a spawn would otherwise have had, as a percent.
   * 100 is identity; 150 makes prefixes half again as common while this layer is enabled.
   * @type {number}
   */
  prefixChance = 100;

  /**
   * The multiplier applied to whatever suffix chance a spawn would otherwise have had, as a percent.
   * 100 is identity; the suffix twin of {@link #prefixChance} in every respect.
   * @type {number}
   */
  suffixChance = 100;

  /**
   * How far each affix weight is pulled toward its pool's mean, as a percent.
   * 0 leaves the pool exactly as authored; 100 makes every member of the pool equally likely. This
   * is the knob that decides whether the rare end of an affix ladder is ever actually seen.
   * @type {number}
   */
  flatten = 0;

  /**
   * The weights this layer hands to affix states, keyed by state id, before the slot is known.
   * Drained into {@link #prefixGrants} and {@link #suffixGrants} once the database has loaded.
   * @type {Map<number, number>}
   */
  _rawGrants = new Map();

  /**
   * The weights this layer hands to prefix affix states, keyed by state id.
   * Empty until the boot-time validation pass sorts {@link #_rawGrants} by slot.
   * @type {Map<number, number>}
   */
  _prefixGrants = new Map();

  /**
   * The weights this layer hands to suffix affix states, keyed by state id.
   * Empty until the boot-time validation pass sorts {@link #_rawGrants} by slot.
   * @type {Map<number, number>}
   */
  _suffixGrants = new Map();

  /**
   * The grants exactly as authored, before they were sorted into slots.
   * @returns {Map<number, number>}
   */
  rawGrants()
  {
    return this._rawGrants;
  }

  /**
   * Replaces the unsorted grants.
   * @param {Map<number, number>} rawGrants The grants as authored.
   */
  setRawGrants(rawGrants)
  {
    this._rawGrants = rawGrants;
  }

  /**
   * The weights this layer hands to prefix affix states.
   * @returns {Map<number, number>}
   */
  prefixGrants()
  {
    return this._prefixGrants;
  }

  /**
   * The weights this layer hands to suffix affix states.
   * @returns {Map<number, number>}
   */
  suffixGrants()
  {
    return this._suffixGrants;
  }

  /**
   * Records that a granted state belongs to the prefix pool.
   * A state carrying both slot tags is recorded on both sides at the same weight, because it is
   * genuinely a member of both pools and a grant naming it means to unlock it wherever it lives.
   * @param {number} stateId The granted state.
   * @param {number} weight The weight this layer hands it.
   */
  addPrefixGrant(stateId, weight)
  {
    this.prefixGrants()
      .set(stateId, weight);
  }

  /**
   * Records that a granted state belongs to the suffix pool.
   * @param {number} stateId The granted state.
   * @param {number} weight The weight this layer hands it.
   */
  addSuffixGrant(stateId, weight)
  {
    this.suffixGrants()
      .set(stateId, weight);
  }
}

export default AffixEffects;
//endregion AffixEffects