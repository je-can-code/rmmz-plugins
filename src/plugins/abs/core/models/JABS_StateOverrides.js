//region JABS_StateOverrides
/**
 * A value object carrying skill-authored overrides for state application.
 *
 * Passed to {@link Game_Battler#addStateWithOverrides} when a skill's notetag specifies
 * a custom duration or starting stack count. Only the properties that are explicitly set
 * take effect; a {@code null} property defers to the state's own database value.
 *
 * Instances are read-only after construction; callers should treat them as value objects.
 */
class JABS_StateOverrides
{
  /**
   * The override duration in frames for the applied state.
   * When {@code null}, the state's own {@code jabsStateDurationFrames} value is used instead.
   * @type {number|null}
   */
  duration = null;

  /**
   * The override starting stack count for the applied state.
   * When {@code null}, the state's own {@code jabsStateStacksApplied} value is used instead.
   * @type {number|null}
   */
  stacks = null;

  /**
   * Constructor.
   * @param {number|null} duration Override duration in frames; pass {@code null} to use the state's default.
   * @param {number|null} stacks Override starting stack count; pass {@code null} to use the state's default.
   */
  constructor(duration = null, stacks = null)
  {
    // assign the override duration, defaulting to null if not provided.
    this.duration = duration;

    // assign the override stack count, defaulting to null if not provided.
    this.stacks = stacks;
  }
}

export default JABS_StateOverrides;
//endregion JABS_StateOverrides
