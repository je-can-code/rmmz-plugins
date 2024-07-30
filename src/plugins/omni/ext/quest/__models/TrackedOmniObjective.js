//region TrackedOmniObjective
/**
 * A class representing the tracking for a single objective of a quest.
 */
function TrackedOmniObjective(id, type, description, fulfillment, hiddenByDefault)
{
  this.initialize(id, type, description, fulfillment, hiddenByDefault);
}

TrackedOmniObjective.prototype = {};
TrackedOmniObjective.prototype.constructor = TrackedOmniObjective;

/**
 * Initialize an objective tracker for an quest.
 * @param {number} id The id of this objective.
 * @param {number} type The common classification of this objective.
 * @param {string} description The contextural description of this objective.
 * @param {string} fulfillment The templated fulfillment requirements of this objective.
 * @param {boolean} hidden Whether or not this objective is hidden.
 * @param {boolean} optional Whether or not this objective is optional for its parent quest.
 */
TrackedOmniObjective.prototype.initialize = function(id, type, description, fulfillment, hidden, optional)
{
  /**
   * The id of this objective. This is typically used to indicate order between objectives within a single quest.
   * @type {number}
   */
  this.id = id;

  /**
   * The contextual description that will be displayed in the objective itself regarding why the objective should be
   * completed.
   * @type {string}
   */
  this.description = description;

  /**
   * The uniform fulfillment criteria for this objective.
   * @type {string}
   */
  this.fulfillment = fulfillment;

  /**
   * The type of objective this is, defining how the fulfillment criteria is monitored.
   * @type {number}
   */
  this.type = type;

  /**
   * Whether or not this objective is hidden by default.
   * @type {boolean}
   */
  this.hidden = hidden;

  /**
   * Whether or not this objective is considered "optional", in that it is not strictly required to complete the parent
   * quest. Typically these objectives will end up "missed" if not completed rather than "failed".
   * @type {boolean}
   */
  this.optional = optional;
};

// TODO: implement methods for updating self.

//endregion TrackedOmniObjective