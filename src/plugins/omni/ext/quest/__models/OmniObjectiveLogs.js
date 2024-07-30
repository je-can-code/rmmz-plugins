//region OmniObjectiveLogs
/**
 * A class representing the data shape of the various log messages associated with the state of an objective.
 */
class OmniObjectiveLogs
{
  /**
   * The text displayed in the log while the objective is still unfulfilled but ongoing.
   * @type {string}
   */
  discovered = String.empty;

  /**
   * The text displayed in the log after this objective is fulfilled successfully.
   * @type {string}
   */
  completed = String.empty;

  /**
   * The text displayed in the log after this objective is failed.
   * @type {string}
   */
  failed = String.empty;

  /**
   * The text displayed in the log after this objective is missed.
   * @type {string}
   */
  missed = String.empty;

  /**
   * Constructor.
   * @param {string} discovered The log text for when this objective is made active.
   * @param {string} completed The log text for when this objective is completed successfully.
   * @param {string} failed The log text for when this objective is failed.
   * @param {string} missed The log text for when this objective is missed.
   */
  constructor(discovered, completed, failed, missed)
  {
    this.discovered = discovered;
    this.completed = completed;
    this.failed = failed;
    this.missed = missed;
  }
}
//endregion OmniObjectiveLogs