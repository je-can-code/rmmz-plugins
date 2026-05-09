//region JuiceStyleMultiplierRow
/**
 * Tilt and swing intensity multipliers for one juice weapon-style bucket.
 */
class JuiceStyleMultiplierRow
{
  /**
   * @param {number} tiltMul Scale applied to strike tilt (radians envelope).
   * @param {number} swingMul Scale applied to weapon swing overlay peak rotation.
   */
  constructor(tiltMul = 1, swingMul = 1)
  {
    this.tiltMul = tiltMul;
    this.swingMul = swingMul;
  }
}
//endregion JuiceStyleMultiplierRow