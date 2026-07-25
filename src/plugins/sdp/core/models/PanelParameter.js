//region PanelParameter
/**
 * A class that represents a single parameter and its growth for a SDP.
 */
class PanelParameter
{
  /**
   * Initializes a single panel parameter.
   * @param {string} parameterKey The registry key this panel entry affects.
   * @param {number} perRank The amount per rank this parameter gives.
   * @param {boolean} isFlat True if it is flat growth, false if it is percent growth.
   * @param {boolean} isCore True if this is a core parameter, false otherwise.
   */
  constructor(parameterKey, perRank, isFlat = true, isCore = false)
  {
    /**
     * The registry key of the parameter this class represents.
     * @type {string}
     */
    this.parameterKey = parameterKey;

    /**
     * The amount per rank this parameter gives.
     * @type {number}
     */
    this.perRank = perRank;

    /**
     * Whether or not the growth per rank for this parameter is flat or percent.
     * @type {boolean}
     */
    this.isFlat = isFlat;

    /**
     * Whether or not this is a core parameter.
     * Core parameters are emphasized on the SDP scene.
     * @type {boolean}
     */
    this.isCore = isCore;
  }
}

export default PanelParameter;
//endregion PanelParameter