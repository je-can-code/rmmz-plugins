//region JABS_HitstopRuntime
/**
 * Frame-scoped runtime state for J-ABS Hitstop (not plugin parameters).
 */
class JABS_HitstopRuntime
{
  /**
   * Last frame index when screen shake was triggered (anti-spam cooldown).
   * @type {number}
   */
  static lastShakeFrame = 0;
}

export default JABS_HitstopRuntime;
//endregion JABS_HitstopRuntime