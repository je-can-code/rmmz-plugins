//region MasteryGatePhrase
/**
 * Turns a mastery's {@code passiveSourceRule} into the phrase a player reads.
 *
 * 110 of the mastery wrapper skills gate their passive on a condition, and the gate is frequently the
 * whole identity of the strip rather than a footnote: draconite is not "endurance up", it is "stand
 * still for three seconds and endurance goes up". Prose that omits the gate describes a different
 * mastery, so this class exists to say the condition in words rather than leaving it to the author to
 * hardcode a number that will move.
 */
class MasteryGatePhrase
{
  /**
   * How many frames make a second, for rendering durations the player can feel.
   * @type {number}
   */
  static FramesPerSecond = 60;

  /**
   * Gate kinds phrased as a resource threshold, mapped to the word describing the direction.
   * @type {Object<string, string>}
   */
  static ThresholdKinds = {
    hpAbove: 'above',
    hpBelow: 'below',
    mpAbove: 'above',
    mpBelow: 'below',
    tpAbove: 'above',
    tpBelow: 'below',
  };

  /**
   * Gate kinds phrased as an elapsed time since something last happened.
   * @type {string[]}
   */
  static ElapsedKinds = [ 'sinceLastMoved', 'sinceLastHit', 'sinceLastAttacked' ];

  /**
   * Gate kinds phrased as a recent event within a window.
   * @type {string[]}
   */
  static WithinKinds = [ 'movedWithin', 'hitWithin', 'attackedWithin' ];

  /**
   * The resource each threshold kind reads, keyed by its prefix.
   * @type {Object<string, string>}
   */
  static ResourceNames = {
    hp: 'Life',
    mp: 'Magi',
    tp: 'Tech',
  };

  /**
   * The constructor is not designed to be called.
   * This is a static class.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  /**
   * The phrase describing the gate on the given wrapper skill.
   * @param {RPG_Skill} skill The mastery's wrapper skill.
   * @returns {string|null} Null when the skill carries no gate, or one this class cannot phrase.
   */
  static phraseFor(skill)
  {
    const match = skill.note.match(/<passiveSourceRule:[ ]?\[([^\]]*)]>/i);

    if (!match) return null;

    const args = match[1].split(',')
      .map(arg => arg.trim());
    const [ kind, param, scope ] = args;

    if (kind === 'allOffCooldown') return 'every skill ready';

    if (MasteryGatePhrase.ThresholdKinds[kind]) return MasteryGatePhrase.#thresholdPhrase(kind, param);

    if (MasteryGatePhrase.ElapsedKinds.includes(kind)) return MasteryGatePhrase.#secondsPhrase(param);

    if (MasteryGatePhrase.WithinKinds.includes(kind)) return MasteryGatePhrase.#secondsPhrase(param);

    if (kind === 'alliesNearby') return MasteryGatePhrase.#nearbyPhrase(scope);

    return null;
  }

  /**
   * Phrases a resource threshold, e.g. "below 20% Life".
   * @param {string} kind The gate kind, whose prefix names the resource.
   * @param {string} param The threshold percentage.
   * @returns {string}
   */
  static #thresholdPhrase(kind, param)
  {
    const direction = MasteryGatePhrase.ThresholdKinds[kind];
    const resource = MasteryGatePhrase.ResourceNames[kind.slice(0, 2)];

    return `${direction} ${param}% ${resource}`;
  }

  /**
   * Phrases a frame count as seconds, e.g. "3 seconds".
   * @param {string} frames The frame count.
   * @returns {string}
   */
  static #secondsPhrase(frames)
  {
    const seconds = Number(frames) / MasteryGatePhrase.FramesPerSecond;
    const rounded = Math.round(seconds * 100) / 100;

    return `${rounded} seconds`;
  }

  /**
   * Phrases an ally proximity gate, e.g. "6 tiles".
   *
   * Only the distance is spoken. The count is always one in a two-person party, so saying it would add
   * a number the player can do nothing with.
   * @param {string|undefined} scope The tile radius, when the gate names one.
   * @returns {string}
   */
  static #nearbyPhrase(scope)
  {
    if (scope === undefined) return 'nearby';

    return `${scope} tiles`;
  }
}

export default MasteryGatePhrase;
//endregion MasteryGatePhrase