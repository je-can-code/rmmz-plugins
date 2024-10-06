//region OmniObjectiveLogs
/**
 * A class representing the data shape of the various log messages associated with the state of an objective. These will
 * reflect in the quest log when reviewing the quest in question.
 */
class OmniObjectiveLogs
{
  /**
   * The text displayed in the log when the objective hasn't yet been discovered by the player. Generally this won't be
   * shown, but if the objective is also hidden, it will.
   * @type {string}
   */
  inactive = String.empty;

  /**
   * The text displayed in the log while the objective is still unfulfilled but ongoing.
   * @type {string}
   */
  active = String.empty;

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
   * @constructor
   * @param {string} unknown The log text for when this objective is yet to be discovered.
   * @param {string} discovered The log text for when this objective is made active.
   * @param {string} completed The log text for when this objective is completed successfully.
   * @param {string} failed The log text for when this objective is failed.
   * @param {string} missed The log text for when this objective is missed.
   */
  constructor(unknown, discovered, completed, failed, missed)
  {
    this.inactive = unknown;
    this.active = discovered;
    this.completed = completed;
    this.failed = failed;
    this.missed = missed;
  }
}

//endregion OmniObjectiveLogs