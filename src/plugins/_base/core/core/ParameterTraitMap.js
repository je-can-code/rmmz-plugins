//region ParameterTraitMap
/**
 * Maps a parameter key onto the trait that carries it.
 *
 * {@link ParameterRegistry} answers what a parameter *is* - its label, icon, format and how to read it
 * off a battler - but not which trait encodes it on a database row. Anything reading a parameter back
 * out of an equip, state or class needs that second half, and the mapping is the fixed RMMZ table
 * rather than anything a plugin decides, so it lives here beside the trait formatters that consume it.
 *
 * Keys absent from this table are not errors. A parameter introduced by a plugin and stored in a
 * notetag rather than a trait - crit block, lifesteal - legitimately has no trait to name, and callers
 * are expected to fall back to reading its tag.
 */
class ParameterTraitMap
{
  /**
   * The trait code for the eight base parameters.
   * @type {number}
   */
  static BaseParameterCode = 21;

  /**
   * The trait code for the ten ex-parameters.
   * @type {number}
   */
  static ExParameterCode = 22;

  /**
   * The trait code for the ten sp-parameters.
   * @type {number}
   */
  static SpParameterCode = 23;

  /**
   * The parameter key of each base parameter, in dataId order.
   * @type {string[]}
   */
  static BaseParameterKeys = [ 'mhp', 'mmp', 'atk', 'def', 'mat', 'mdf', 'agi', 'luk' ];

  /**
   * The parameter key of each ex-parameter, in dataId order.
   * @type {string[]}
   */
  static ExParameterKeys = [ 'hit', 'eva', 'cri', 'cev', 'mev', 'mrf', 'cnt', 'hrg', 'mrg', 'trg' ];

  /**
   * The parameter key of each sp-parameter, in dataId order.
   * @type {string[]}
   */
  static SpParameterKeys = [ 'tgr', 'grd', 'rec', 'pha', 'mcr', 'tcr', 'pdr', 'mdr', 'fdr', 'exr' ];

  /**
   * The constructor is not designed to be called.
   * This is a static class.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  /**
   * The trait code and data id encoding the given parameter key.
   * @param {string} parameterKey The parameter key being looked up.
   * @returns {{code: number, dataId: number}|null} Null when no trait encodes this key.
   */
  static forKey(parameterKey)
  {
    const baseId = ParameterTraitMap.BaseParameterKeys.indexOf(parameterKey);
    if (baseId > -1) return { code: ParameterTraitMap.BaseParameterCode, dataId: baseId };

    const exId = ParameterTraitMap.ExParameterKeys.indexOf(parameterKey);
    if (exId > -1) return { code: ParameterTraitMap.ExParameterCode, dataId: exId };

    const spId = ParameterTraitMap.SpParameterKeys.indexOf(parameterKey);
    if (spId > -1) return { code: ParameterTraitMap.SpParameterCode, dataId: spId };

    return null;
  }

  /**
   * Whether a trait encodes the given parameter key.
   * @param {string} parameterKey The parameter key being looked up.
   * @returns {boolean}
   */
  static hasKey(parameterKey)
  {
    return ParameterTraitMap.forKey(parameterKey) !== null;
  }
}

export default ParameterTraitMap;
//endregion ParameterTraitMap