//region StateAfflictionViewModel
/**
 * A single row of affliction data for HUD or map presenters.
 */
class StateAfflictionViewModel
{
  /**
   * The JABS tracked state instance.
   * @type {JABS_State}
   */
  trackedState = null;

  /**
   * The hydrated database state from the afflicted battler's perspective.
   * @type {RPG_State|null}
   */
  state = null;

  /**
   * The database state id.
   * @type {number}
   */
  stateId = 0;

  /**
   * The icon index to display for this affliction.
   * @type {number}
   */
  iconIndex = 0;

  /**
   * The current stack count on the tracked state.
   * @type {number}
   */
  stackCount = 1;

  /**
   * Remaining duration in frames.
   * @type {number}
   */
  durationFrames = 0;

  /**
   * Base duration in frames when the state was applied.
   * @type {number}
   */
  baseDurationFrames = 0;

  /**
   * Whether this affliction never expires by duration.
   * @type {boolean}
   */
  isEternal = false;

  /**
   * Normalized remaining-time ratio for map gauges; null when eternal or unknown.
   * @type {number|null}
   */
  fillRatio = null;

  /**
   * Whether this row belongs to the negative or positive collection.
   * @type {'negative'|'positive'}
   */
  polarity = 'negative';

  /**
   * Builds a view model from a tracked JABS state and afflicted battler.
   * @param {JABS_State} trackedState The tracked state data.
   * @param {Game_Battler} battler The afflicted battler.
   * @param {'negative'|'positive'} polarity The polarity bucket for this row.
   * @returns {StateAfflictionViewModel}
   */
  static fromTrackedState(trackedState, battler, polarity)
  {
    const viewModel = new StateAfflictionViewModel();

    viewModel.trackedState = trackedState;
    viewModel.stateId = trackedState.stateId;
    viewModel.state = battler.state(trackedState.stateId);
    viewModel.iconIndex = viewModel.state
      ? viewModel.state.iconIndex
      : 0;
    viewModel.stackCount = trackedState.stackCount;
    viewModel.durationFrames = trackedState.duration;
    viewModel.baseDurationFrames = trackedState.baseDurationFrames;
    viewModel.isEternal = trackedState.hasEternalDuration();
    viewModel.fillRatio = StateAfflictionViewModel.resolveFillRatio(
      viewModel.durationFrames,
      viewModel.baseDurationFrames,
      viewModel.isEternal,
    );
    viewModel.polarity = polarity;

    return viewModel;
  }

  /**
   * Resolves the normalized remaining-time ratio for map gauges.
   * @param {number} durationFrames Remaining duration in frames.
   * @param {number} baseDurationFrames Base duration in frames.
   * @param {boolean} isEternal Whether the state is eternal.
   * @returns {number|null}
   */
  static resolveFillRatio(durationFrames, baseDurationFrames, isEternal)
  {
    if (isEternal === true)
    {
      return null;
    }

    if (baseDurationFrames <= 0)
    {
      return null;
    }

    const ratio = durationFrames / baseDurationFrames;

    return Math.max(0, Math.min(1, ratio));
  }
}

export default StateAfflictionViewModel;
//endregion StateAfflictionViewModel