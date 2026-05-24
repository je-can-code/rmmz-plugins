//region JuiceFlurryStrikeRecord
/**
 * One row of flurry decay state for a given action UUID and target UUID pair.
 */
class JuiceFlurryStrikeRecord
{
  /**
   * @param {number} count How many qualifying hits have stacked in the short window.
   * @param {number} frame Last {@link Graphics.frameCount} when this row was touched.
   */
  constructor(count, frame)
  {
    this.count = count;
    this.frame = frame;
  }
}
export default JuiceFlurryStrikeRecord;
//endregion JuiceFlurryStrikeRecord