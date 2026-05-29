//region SdpParameterBinding
import ParameterKeys from './../core/ParameterKeys.js';

/**
 * Describes how SDP panel rank bonuses attach to a {@link ParameterDefinition}.
 */
class SdpParameterBinding
{
  /**
   * @param {function(Game_Actor, number): number} getPanelBonus
   * @param {function(Game_Actor): number=} getBaseForSdp
   */
  constructor(getPanelBonus, getBaseForSdp = undefined)
  {
    /**
     * Returns the bonus amount SDP panels contribute for this parameter.
     * @type {function(Game_Actor, number): number}
     */
    this.getPanelBonus = getPanelBonus;

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
   * @param {string} parameterKey
   * @param {function(Game_Actor): number=} getBaseForSdp
   * @returns {SdpParameterBinding}
   */
  static byKey(parameterKey, getBaseForSdp = undefined)
  {
    return new SdpParameterBinding((actor, base) =>
    {
      if (!J.SDP) return 0;

      return actor.getSdpBonusForParameterKey(parameterKey, base);
    }, getBaseForSdp);
  }

  /**
   * SDP bonus follows the core b-param hook path.
   * @param {number} paramId
   * @returns {SdpParameterBinding}
   */
  static bparam(paramId)
  {
    const parameterKey = ParameterKeys.bparamKey(paramId);

    return SdpParameterBinding.byKey(parameterKey);
  }

  /**
   * SDP bonus follows the ex-param hook path.
   * @param {number} xparamId
   * @returns {SdpParameterBinding}
   */
  static xparam(xparamId)
  {
    return new SdpParameterBinding((actor, base) =>
    {
      if (!J.SDP) return 0;

      return actor.getSdpBonusForNonCoreParam(xparamId, base, 8);
    });
  }

  /**
   * SDP bonus follows the sp-param hook path.
   * @param {number} sparamId
   * @returns {SdpParameterBinding}
   */
  static sparam(sparamId)
  {
    return new SdpParameterBinding((actor, base) =>
    {
      if (!J.SDP) return 0;

      return actor.getSdpBonusForNonCoreParam(sparamId, base, 18);
    });
  }

  /**
   * Owner-defined SDP bonus logic (CDM, LST, SDR, etc.).
   * @param {function(Game_Actor, number): number} getPanelBonus
   * @param {function(Game_Actor): number=} getBaseForSdp
   * @returns {SdpParameterBinding}
   */
  static custom(getPanelBonus, getBaseForSdp = undefined)
  {
    return new SdpParameterBinding(getPanelBonus, getBaseForSdp);
  }
}

export default SdpParameterBinding;
//endregion SdpParameterBinding
