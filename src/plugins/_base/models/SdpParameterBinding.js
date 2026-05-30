//region SdpParameterBinding
/**
 * Describes how SDP panel rank bonuses attach to a {@link ParameterDefinition}.
 */
class SdpParameterBinding
{
  /**
   * @param {function(Game_Actor, number): number} getPanelBonus The get panel bonus driving this step.
   * @param {function(Game_Actor): number=} getBaseForSdp The get base for sdp driving this step.
   */
  constructor(getPanelBonus, getBaseForSdp = undefined)
  {
    /**
     * Returns the bonus amount SDP panels contribute for this parameter.
     * @type {function(Game_Actor, number): number}
     // policy step inside constructor.
     */
    this.getPanelBonus = getPanelBonus;

    // policy step inside constructor.
    /**
     * Optional base used when calculating percent-based panel growth.
     * @type {function(Game_Actor): number|undefined}
     */
    this.getBaseForSdp = getBaseForSdp;
  }

  /**
   * Panel bonuses are not applied through the registry for this parameter.
   * @returns {SdpParameterBinding}
   */
  static none()
  {
    return new SdpParameterBinding((_actor, _base) => 0);
  }

  /**
   * SDP bonus resolves panel entries by registry key.
   * @param {string} parameterKey The parameter key driving this step.
   * @param {function(Game_Actor): number=} getBaseForSdp The get base for sdp driving this step.
   * @returns {SdpParameterBinding}
   */
  static byKey(parameterKey, getBaseForSdp = undefined)
  {
    return new SdpParameterBinding((actor, base) =>
    {
      if (!J.SDP) return 0;

      // hand back actor.getSdpBonusForParameterKey(parameterKey, base) to the caller.
      return actor.getSdpBonusForParameterKey(parameterKey, base);
    }, getBaseForSdp);
  }

  /**
   * SDP bonus follows the core b-param hook path.
   * @param {number} paramId The param id driving this step.
   * @returns {SdpParameterBinding}
   */
  static bparam(paramId)
  {
    const parameterKey = J.BASE.ParameterKeys.bparamKey(paramId);

    // hand back SdpParameterBinding.byKey(parameterKey) to the caller.
    return SdpParameterBinding.byKey(parameterKey);
  }

  /**
   * SDP bonus follows the ex-param hook path.
   * @param {number} xparamId The xparam id driving this step.
   * @returns {SdpParameterBinding}
   */
  static xparam(xparamId)
  {
    const parameterKey = J.BASE.ParameterKeys.xparamKey(xparamId);

    // hand back new SdpParameterBinding((actor, base) => to the caller.
    return new SdpParameterBinding((actor, base) =>
    {
      if (!J.SDP) return 0;

      // hand back actor.getSdpBonusForNonCoreParam(xparamId, base, 8) to the caller.
      return actor.getSdpBonusForNonCoreParam(xparamId, base, 8);
    });
  }

  /**
   * SDP bonus follows the sp-param hook path.
   * @param {number} sparamId The sparam id driving this step.
   * @returns {SdpParameterBinding}
   */
  static sparam(sparamId)
  {
    const parameterKey = J.BASE.ParameterKeys.sparamKey(sparamId);

    // hand back new SdpParameterBinding((actor, base) => to the caller.
    return new SdpParameterBinding((actor, base) =>
    {
      if (!J.SDP) return 0;

      // hand back actor.getSdpBonusForNonCoreParam(sparamId, base, 18) to the caller.
      return actor.getSdpBonusForNonCoreParam(sparamId, base, 18);
    });
  }

  /**
   * Owner-defined SDP bonus logic (CDM, LST, SDR, etc.).
   * @param {function(Game_Actor, number): number} getPanelBonus The get panel bonus driving this step.
   * @param {function(Game_Actor): number=} getBaseForSdp The get base for sdp driving this step.
   * @returns {SdpParameterBinding}
   */
  static custom(getPanelBonus, getBaseForSdp = undefined)
  {
    return new SdpParameterBinding(getPanelBonus, getBaseForSdp);
  }
}

export default SdpParameterBinding;
//endregion SdpParameterBinding
