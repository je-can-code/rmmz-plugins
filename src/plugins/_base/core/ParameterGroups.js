//region ParameterGroups
/**
 * Status-screen and catalog grouping ids for {@link ParameterDefinition}.
 */
class ParameterGroups
{
  /** @type {string} */
  static VITALITY = 'vitality';

  /** @type {string} */
  static COMBAT = 'combat';

  /** @type {string} */
  static PRECISION = 'precision';

  /** @type {string} */
  static DEFENSIVE = 'defensive';

  /** @type {string} */
  static FATE = 'fate';

  /** @type {string} */
  static SUPPORT = 'support';

  /**
   * All groups in default status-screen iteration order.
   * @type {string[]}
   */
  static ALL = [
    ParameterGroups.VITALITY,
    ParameterGroups.COMBAT,
    ParameterGroups.PRECISION,
    ParameterGroups.DEFENSIVE,
    ParameterGroups.FATE,
    ParameterGroups.SUPPORT,
  ];
}

export default ParameterGroups;
//endregion ParameterGroups