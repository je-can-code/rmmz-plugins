//region MotionEasing
/**
 * The easing curves used when a motion travels to a target rather than cycling around one.
 *
 * Every curve here takes a normalized progress from 0 to 1 and returns a normalized position from
 * 0 to 1. Nothing in this class knows about frames, distances, or channels — that keeps the curves
 * trivially testable and lets a caller reuse one for a scale, a rotation, or a colour without
 * anything having to be adapted.
 */
class MotionEasing
{
  /**
   * Decelerating ease: fast to start, settling gently into the target.
   *
   * This is the default for transitions because it reads as something arriving under its own
   * momentum. A linear travel reads as mechanical, which is right for a conveyor belt and wrong
   * for a creature swelling with rage.
   * @param {number} progress Normalized progress, 0 to 1.
   * @returns {number} Normalized position, 0 to 1.
   */
  static easeOutQuad(progress)
  {
    const clamped = MotionEasing.normalize(progress);
    const remaining = 1 - clamped;

    return 1 - (remaining * remaining);
  }

  /**
   * Accelerating ease: slow to start, arriving at speed.
   * @param {number} progress Normalized progress, 0 to 1.
   * @returns {number} Normalized position, 0 to 1.
   */
  static easeInQuad(progress)
  {
    const clamped = MotionEasing.normalize(progress);

    return clamped * clamped;
  }

  /**
   * Constant-rate travel, for when a motion should read as machinery rather than as life.
   * @param {number} progress Normalized progress, 0 to 1.
   * @returns {number} Normalized position, 0 to 1.
   */
  static linear(progress)
  {
    return MotionEasing.normalize(progress);
  }

  /**
   * Constrains a raw progress value into the 0-to-1 range the curves are defined over.
   *
   * Callers compute progress as elapsed over duration, which overshoots 1 on the frame after a
   * transition completes and would send a curve past its target if left alone.
   * @param {number} progress The raw progress value.
   * @returns {number} The same value, held within 0 and 1.
   */
  static normalize(progress)
  {
    return progress.clamp(0, 1);
  }
}

export default MotionEasing;
//endregion MotionEasing