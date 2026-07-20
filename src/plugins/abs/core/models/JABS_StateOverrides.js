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
   * When {@code null} or {@code 0}, no override is applied — the state's own tags
   * ({@code jabsStateDurationFrames}, {@code jabsIndefiniteState}) decide as usual.
   * When {@code -1}, the state is forced indefinite regardless of its own tags.
   * Any other value forces that exact finite duration, also regardless of the
   * state's own tags (including an {@code <indefiniteState>} tag).
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
   * @param {number|null} duration Override duration in frames; pass {@code null} or {@code 0} to use the
   * state's default, or {@code -1} to force the state indefinite regardless of its own tags.
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
