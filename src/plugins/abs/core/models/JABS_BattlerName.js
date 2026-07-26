//region JABS_BattlerName
/**
 * A class representing the name of a JABS battler.
 */
class JABS_BattlerName
{
  name = String.empty;
  colorHex = '#ffffff';

  /**
   * The tier rank driving how many pips the map nameplate stripe draws (0 = single solid stripe).
   * @type {number}
   */
  tier = 0;
}

export default JABS_BattlerName;
//endregion JABS_BattlerName