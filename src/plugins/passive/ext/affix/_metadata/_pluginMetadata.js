//region plugin metadata
class JPassiveAffix_PluginMetadata
  extends PluginMetadata
{
  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   *  Extends {@link #postInitialize}.<br>
   *  Includes translation of plugin parameters.
   */
  postInitialize()
  {
    // execute original logic.
    super.postInitialize();

    // pull defaults from the plugin manager so designers can tune without touching code.
    this.initializeMetadata();
  }

  /**
   * Parses the plugin parameters and assigns them to the metadata.
   */
  initializeMetadata()
  {
    /**
     * The default chance for a prefix to be applied.
     * @type {number}
     */
    this.defaultPrefixChance = parseFloat(this.parsedPluginParameters['default-prefix-chance']);

    /**
     * The default chance for a suffix to be applied.
     * @type {number}
     */
    this.defaultSuffixChance = parseFloat(this.parsedPluginParameters['default-suffix-chance']);
  }

  /**
   * Initializes the state affix weight totals and maps.
   */
  initializeStateAffixWeights()
  {
    /**
     * The total weight of all prefixes.
     * @type {number}
     */
    this.totalPrefixWeight = 0;

    /**
     * The total weight of all suffixes.
     * @type {number}
     */
    this.totalSuffixWeight = 0;

    /**
     * The collection of key=id,value=weight for all states and their prefix weights found in the database.
     * @type {Map<number, number>}
     */
    this.prefixMap = new Map();

    /**
     * The collection of key=id,value=weight for all states and their suffix weights found in the database.
     * @type {Map<number, number>}
     */
    this.suffixMap = new Map();

    // iterate through all states.
    $dataStates.forEach(state =>
    {
      // first entry is always null.
      if (!state) return;

      // check if the state is a prefix.
      if (state.isEnemyPrefix)
      {
        // add the weight and capture the prefix.
        this.totalPrefixWeight += state.affixWeight;
        this.prefixMap.set(state.id, state.affixWeight);
      }

      // check if the state is a suffix.
      if (state.isEnemySuffix)
      {
        // add the weight and capture the suffix.
        this.totalSuffixWeight += state.affixWeight;
        this.suffixMap.set(state.id, state.affixWeight);
      }
    });
  }

  /**
   * The prefix pool as it should be rolled against for the spawn happening right now.
   * Base behavior hands back the boot-time pool untouched; this exists as the single seam an
   * extension can alias to bias the pool, so that biasing never requires re-implementing the whole
   * spawn body just to substitute two values into it.
   *
   * This must remain a prototype method and never become a class field. A field would install an
   * own property on the metadata instance, and an extension aliasing the prototype afterward would
   * never be reached - the bias would silently do nothing.
   * @returns {{map: Map<number, number>, totalWeight: number}}
   */
  effectivePrefixPool()
  {
    return {
      map: this.prefixMap,
      totalWeight: this.totalPrefixWeight,
    };
  }

  /**
   * The suffix pool as it should be rolled against for the spawn happening right now.
   * The suffix twin of {@link #effectivePrefixPool}, and biased by the same extensions - anything
   * that can add to or reweight one slot's pool has nowhere else to reach the other.
   * @returns {{map: Map<number, number>, totalWeight: number}}
   */
  effectiveSuffixPool()
  {
    return {
      map: this.suffixMap,
      totalWeight: this.totalSuffixWeight,
    };
  }

  /**
   * Determines if the provided state id is an affix state.
   * Membership is independent of weight, so a state weighted at zero still answers true here - it
   * is a known affix that simply never wins a random roll, and explicit `<passive:[...]>` spawns
   * still need to recognize it.
   * @param {number} stateId The state id to check.
   * @returns {boolean} True if the state is a prefix or suffix, false otherwise.
   */
  isAffixStateId(stateId)
  {
    return this.prefixMap.has(stateId) || this.suffixMap.has(stateId);
  }
}

export default JPassiveAffix_PluginMetadata;
//endregion plugin metadata