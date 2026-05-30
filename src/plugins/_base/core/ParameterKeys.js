//region ParameterKeys
/**
 * String keys for vanilla engine parameters and legacy long-param id translation.
 */
class ParameterKeys
{
  /**
   * b-param registry keys indexed by engine param id (0–7).
   * @type {string[]}
   */
  static BPARAM_KEYS = [
    'mhp',
    'mmp',
    'atk',
    'def',
    'mat',
    'mdf',
    'agi',
    'luk',
  ];

  /**
   * x-param registry keys indexed by engine xparam id (0–9).
   * @type {string[]}
   */
  static XPARAM_KEYS = [
    'hit',
    'eva',
    'cri',
    'cev',
    'mev',
    'mrf',
    'cnt',
    'hrg',
    'mrg',
    'trg',
  ];

  /**
   * s-param registry keys indexed by engine sparam id (0–9).
   * @type {string[]}
   */
  static SPARAM_KEYS = [
    'tgr',
    'grd',
    'rec',
    'pha',
    'mcr',
    'tcr',
    'pdr',
    'mdr',
    'fdr',
    'exr',
  ];

  /**
   * Legacy SDP panel long-param id → registry key.
   * @type {Object<number, string>}
   */
  static LEGACY_LONG_PARAM_TO_KEY = {
    0: 'mhp',
    1: 'mmp',
    2: 'atk',
    3: 'def',
    4: 'mat',
    5: 'mdf',
    6: 'agi',
    7: 'luk',
    8: 'hit',
    9: 'eva',
    10: 'cri',
    11: 'cev',
    12: 'mev',
    13: 'mrf',
    14: 'cnt',
    15: 'hrg',
    16: 'mrg',
    17: 'trg',
    18: 'tgr',
    19: 'grd',
    20: 'rec',
    21: 'pha',
    22: 'mcr',
    23: 'tcr',
    24: 'pdr',
    25: 'mdr',
    26: 'fdr',
    27: 'exr',
    28: 'cdm',
    29: 'cdr',
    30: 'mtp',
    31: 'msb',
    32: 'prof',
    33: 'sdr',
    35: 'lst',
    36: 'mst',
    37: 'tst',
    38: 'sar',
    39: 'ser',
    40: 'apr',
    41: 'gdr',
    42: 'dor',
    43: 'hcr',
  };

  /**
   * Parameters where a panel decrease is beneficial in the SDP preview UI.
   * @type {string[]}
   */
  static SDP_SMALLER_IS_BETTER = [
    'tgr',
    'mcr',
    'tcr',
    'pdr',
    'mdr',
    'fdr',
  ];

  /**
   * @param {number} paramId Engine b-param id (0–7).
   * @returns {string|null}
   */
  static bparamKey(paramId)
  {
    return ParameterKeys.BPARAM_KEYS[paramId] ?? null;
  }

  /**
   * @param {number} xparamId Engine x-param id (0–9).
   * @returns {string|null}
   */
  static xparamKey(xparamId)
  {
    return ParameterKeys.XPARAM_KEYS[xparamId] ?? null;
  }

  /**
   * @param {number} sparamId Engine s-param id (0–9).
   * @returns {string|null}
   */
  static sparamKey(sparamId)
  {
    return ParameterKeys.SPARAM_KEYS[sparamId] ?? null;
  }

  /**
   * @param {number} longParamId Legacy unified panel parameter id.
   * @returns {string|null}
   */
  static legacyLongParamKey(longParamId)
  {
    return ParameterKeys.LEGACY_LONG_PARAM_TO_KEY[longParamId] ?? null;
  }
}

export default ParameterKeys;
//endregion ParameterKeys
