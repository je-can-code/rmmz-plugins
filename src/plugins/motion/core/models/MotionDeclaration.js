//region MotionDeclaration
/**
 * A statement that some character should be doing some motion, and who said so.
 *
 * A declaration carries no behavior and no animation state — it is the authored intent, nothing
 * more. The composer turns it into a live effect, and throws that effect away when the declaration
 * goes. That separation is what lets an event page, a state, and a combat hit all declare motions
 * on one sprite while remaining completely ignorant of each other.
 */
class MotionDeclaration
{
  /**
   * The name of the motion type, ex: `breathe`.
   * @type {string}
   */
  #type = String.empty;

  /**
   * The positional parameters as authored, before defaults are applied.
   * @type {Array<string|number>}
   */
  #parameters = [];

  /**
   * Who declared this motion, and therefore who can remove it.
   * @type {string}
   */
  #sourceKey = String.empty;

  /**
   * Constructor.
   * @param {string} type The name of the motion type.
   * @param {Array<string|number>} parameters The positional parameters as authored.
   * @param {string} sourceKey Who declared this motion.
   */
  constructor(type, parameters, sourceKey)
  {
    this.#type = type;
    this.#parameters = parameters;
    this.#sourceKey = sourceKey;
  }

  /**
   * Gets the motion type.
   * @returns {string} The type.
   */
  type()
  {
    // hand back the motion type.
    return this.#type;
  }

  /**
   * Gets the authored parameters.
   * @returns {Array<string|number>} The parameters.
   */
  parameters()
  {
    // hand back the authored parameters.
    return this.#parameters;
  }

  /**
   * Gets the source key.
   * @returns {string} The sourceKey.
   */
  sourceKey()
  {
    // hand back the source key.
    return this.#sourceKey;
  }

  /**
   * Determines whether another declaration says exactly the same thing as this one.
   *
   * This is what lets a page be re-declared without disturbing anything. `Game_Map#refresh` fires
   * on any self-switch anywhere on the map and re-runs every event's page setup, so without a
   * value comparison every enemy in the scene would be handed fresh effects and snap to a new
   * random phase several times a minute.
   * @param {MotionDeclaration} other The declaration to compare against.
   * @returns {boolean}
   */
  matches(other)
  {
    // a different motion entirely.
    if (this.type() !== other.type()) return false;

    // the same motion asked for by someone else is not the same declaration.
    if (this.sourceKey() !== other.sourceKey()) return false;

    // a different number of parameters means at least one was added or removed.
    const otherParameters = other.parameters();
    if (this.#parameters.length !== otherParameters.length) return false;

    // every parameter has to agree, in order, since they are positional.
    return this.#parameters.every((parameter, index) => parameter === otherParameters.at(index));
  }
}

export default MotionDeclaration;
//endregion MotionDeclaration