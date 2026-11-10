//region JabsBossStep
/**
 * One instruction inside a boss routine or reaction.
 *
 * A step is the smallest unit an encounter can express, and the vocabulary is deliberately small:
 * every operation observed across the existing hand-evented boss fights reduces to a handful of
 * these. Only the verbs a shipped fight actually needs are implemented- an unimplemented verb is
 * an unexercised code path, and this system earns its keep by being trustworthy rather than broad.
 *
 * Every step carries every field any verb reads. A verb reads only the ones it has a use for, and the
 * rest sit at their "none", which keeps one shape for every step whichever verb it names.
 */
class JabsBossStep
{
  /**
   * Everything a step can be told, whichever verb it performs.
   * @typedef {Object} JabsBossStepDetails
   * @property {string} participantKey The participant the step acts on, or empty for the primary.
   * @property {number} skillId The skill a forced skill performs.
   * @property {number} stateId The state added to or removed from the participant.
   * @property {string} expect The name the referenced skill, state, enemy or animation carried when authored.
   * @property {boolean} cast Whether a forced skill observes its own cast time.
   * @property {string} characterName The character sheet a participant changes into.
   * @property {number} characterIndex The character on that sheet.
   * @property {string} routineKey The routine a quickening speeds up.
   * @property {number} frames How many frames a quickening takes off that routine's cadence, or a tint takes to settle.
   * @property {number} enemyId The enemy a spawn puts on the map.
   * @property {number} templateId The slot on the enemy clone map a spawn copies its body from.
   * @property {number} x The tile column a spawn puts its body on, or a blink takes its participant to.
   * @property {number} y The tile row a spawn puts its body on, or a blink takes its participant to.
   * @property {number} direction The way a blink leaves its participant facing, or zero to keep its facing.
   * @property {number[]} tone The screen tone a tint settles on: red, green, blue and gray.
   * @property {number} animationId The animation played over a participant, a blink's flare, or a spawn's arrival.
   * @property {string} face The face image shown with a participant's line, or empty for none.
   * @property {number} faceIndex The face on that image.
   * @property {string} speaker The name shown with a participant's line.
   * @property {string[]} lines The text a participant says, shown together as one message.
   */

  /**
   * The verb this step performs.
   * @type {string}
   */
  #verb = String.empty;

  /**
   * The author-facing name of the participant this step acts on.
   *
   * Empty means the encounter's primary participant- "the boss"- because that is who the overwhelming
   * majority of steps are about.
   * @type {string}
   */
  #participantKey = String.empty;

  /**
   * The id of the skill this step performs, for a forced skill.
   * @type {number}
   */
  #skillId = 0;

  /**
   * The id of the state this step adds or removes.
   * @type {number}
   */
  #stateId = 0;

  /**
   * The name the skill, state, enemy or animation this step references had when it was authored, used to
   * detect database drift. Empty means the author recorded no name to check against.
   * @type {string}
   */
  #expect = String.empty;

  /**
   * Whether this step's skill should observe its own cast time.
   *
   * This is not cosmetic. A cast time is the telegraph- it is the window in which a player reads
   * the attack and moves out of it. Executing a skill without its cast time deletes that window
   * and turns a readable attack into an unavoidable one.
   * @type {boolean}
   */
  #cast = true;

  /**
   * The character sheet this step changes its participant into.
   * @type {string}
   */
  #characterName = String.empty;

  /**
   * The character on that sheet this step changes its participant into.
   * @type {number}
   */
  #characterIndex = 0;

  /**
   * The author-facing name of the routine this step speeds up.
   * @type {string}
   */
  #routineKey = String.empty;

  /**
   * How many frames this step works across: how much a quickening takes off its routine's cadence, or how
   * long a tint takes to settle.
   * @type {number}
   */
  #frames = 0;

  /**
   * The id of the enemy this step puts on the map, for a spawn.
   * @type {number}
   */
  #enemyId = 0;

  /**
   * The slot on the enemy clone map this step copies its body from, for a spawn.
   *
   * Already resolved: an author naming no template of their own gets the slot matching the enemy's id.
   * @type {number}
   */
  #templateId = 0;

  /**
   * The tile column this step puts its body on, for a spawn, or takes its participant to, for a blink.
   * @type {number}
   */
  #x = 0;

  /**
   * The tile row this step puts its body on, for a spawn, or takes its participant to, for a blink.
   * @type {number}
   */
  #y = 0;

  /**
   * The way this step leaves its participant facing, for a blink: 2, 4, 6 or 8, or zero to keep its facing.
   * @type {number}
   */
  #direction = 0;

  /**
   * The screen tone this step settles on, for a tint: red, green, blue and gray.
   * @type {number[]}
   */
  #tone = [];

  /**
   * The id of the animation this step plays: over its participant, as a blink's flare, or as a spawn's arrival.
   * Zero plays none.
   * @type {number}
   */
  #animationId = 0;

  /**
   * The face image shown with this step's line, for dialogue, or empty for none.
   * @type {string}
   */
  #face = String.empty;

  /**
   * The face on that image shown with this step's line.
   * @type {number}
   */
  #faceIndex = 0;

  /**
   * The name shown with this step's line, for dialogue.
   * @type {string}
   */
  #speaker = String.empty;

  /**
   * The text this step's participant says, for dialogue, shown together as one message.
   * @type {string[]}
   */
  #lines = [];

  /**
   * Constructor.
   * @param {string} verb The verb this step performs.
   * @param {JabsBossStepDetails} details Everything the step was told, with each unused field at its "none".
   */
  constructor(verb, details)
  {
    this.#verb = verb;
    this.#participantKey = details.participantKey;
    this.#skillId = details.skillId;
    this.#stateId = details.stateId;
    this.#expect = details.expect;
    this.#cast = details.cast;
    this.#characterName = details.characterName;
    this.#characterIndex = details.characterIndex;
    this.#routineKey = details.routineKey;
    this.#frames = details.frames;
    this.#enemyId = details.enemyId;
    this.#templateId = details.templateId;
    this.#x = details.x;
    this.#y = details.y;
    this.#direction = details.direction;
    this.#tone = details.tone;
    this.#animationId = details.animationId;
    this.#face = details.face;
    this.#faceIndex = details.faceIndex;
    this.#speaker = details.speaker;
    this.#lines = details.lines;
  }

  /**
   * Gets the verb this step performs.
   * @returns {string}
   */
  verb()
  {
    return this.#verb;
  }

  /**
   * Gets the author-facing name of the participant this step acts on, which is empty for the primary.
   * @returns {string}
   */
  participantKey()
  {
    return this.#participantKey;
  }

  /**
   * Gets the id of the skill this step performs.
   * @returns {number}
   */
  skillId()
  {
    return this.#skillId;
  }

  /**
   * Gets the id of the state this step adds or removes.
   * @returns {number}
   */
  stateId()
  {
    return this.#stateId;
  }

  /**
   * Gets the skill or state name recorded when this step was authored.
   * @returns {string}
   */
  expect()
  {
    return this.#expect;
  }

  /**
   * Gets whether this step's skill should observe its own cast time.
   * @returns {boolean}
   */
  isCast()
  {
    return this.#cast;
  }

  /**
   * Gets the character sheet this step changes its participant into.
   * @returns {string}
   */
  characterName()
  {
    return this.#characterName;
  }

  /**
   * Gets the character on that sheet this step changes its participant into.
   * @returns {number}
   */
  characterIndex()
  {
    return this.#characterIndex;
  }

  /**
   * Gets the author-facing name of the routine this step speeds up.
   * @returns {string}
   */
  routineKey()
  {
    return this.#routineKey;
  }

  /**
   * Gets how many frames this step works across: what a quickening takes off its routine's cadence, or how
   * long a tint takes to settle.
   * @returns {number}
   */
  frames()
  {
    return this.#frames;
  }

  /**
   * Gets the id of the enemy this step puts on the map.
   * @returns {number}
   */
  enemyId()
  {
    return this.#enemyId;
  }

  /**
   * Gets the slot on the enemy clone map this step copies its body from.
   * @returns {number}
   */
  templateId()
  {
    return this.#templateId;
  }

  /**
   * Gets the tile column this step puts its body on, or takes its participant to.
   * @returns {number}
   */
  x()
  {
    return this.#x;
  }

  /**
   * Gets the tile row this step puts its body on, or takes its participant to.
   * @returns {number}
   */
  y()
  {
    return this.#y;
  }

  /**
   * Gets the way this step leaves its participant facing, which is zero to keep its facing.
   * @returns {number}
   */
  direction()
  {
    return this.#direction;
  }

  /**
   * Gets the screen tone this step settles on: red, green, blue and gray.
   * @returns {number[]}
   */
  tone()
  {
    return this.#tone;
  }

  /**
   * Gets the id of the animation this step plays, which is zero when it plays none.
   * @returns {number}
   */
  animationId()
  {
    return this.#animationId;
  }

  /**
   * Gets the face image shown with this step's line, which is empty for none.
   * @returns {string}
   */
  face()
  {
    return this.#face;
  }

  /**
   * Gets the face on that image shown with this step's line.
   * @returns {number}
   */
  faceIndex()
  {
    return this.#faceIndex;
  }

  /**
   * Gets the name shown with this step's line.
   * @returns {string}
   */
  speaker()
  {
    return this.#speaker;
  }

  /**
   * Gets the text this step's participant says, shown together as one message.
   * @returns {string[]}
   */
  lines()
  {
    return this.#lines;
  }
}

export default JabsBossStep;
//endregion JabsBossStep