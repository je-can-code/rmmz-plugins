//region plugin metadata
class JPassiveAbs_PluginMetadata
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
   * Determines if the provided state id is an affix state.
   * @param {number} stateId The state id to check.
   * @returns {boolean} True if the state is a prefix or suffix, false otherwise.
   */
  isAffixStateId(stateId)
  {
    return this.prefixMap.has(stateId) || this.suffixMap.has(stateId);
  }
}

export default JPassiveAbs_PluginMetadata;
//endregion plugin metadata