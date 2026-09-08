//region MasteryProseResolver
/**
 * Fills the tokens in a subgroup's mastery prose from live database values.
 *
 * The templates are authored per act and stored on the subgroup, but the numbers they describe live
 * across three layers: the wrapper skill's gate, the mastery state's own tags and traits, and the
 * payload those tags point at. This resolver walks that chain so a rebalance never leaves a
 * description quoting a number that no longer exists.
 *
 * **Resolution fails closed.** A template is rendered only when *every* token in it resolves; one
 * unknown token yields the empty string and the caller shows nothing. A half-filled sentence is worse
 * than a missing one here, because the whole feature exists to inform a purchase the player cannot
 * take back.
 */
class MasteryProseResolver
{
  /**
   * The token grammar: a namespace, a name, and an optional bracketed selector.
   *
   * <pre>
   * Structure:
   *  {NAMESPACE.NAME}
   *  {NAMESPACE.NAME[SELECTOR]}
   *
   * Example:
   *  {v.cdr}
   *  {v.boostElement[8]}
   *
   * Translation:
   *  the value of the cdr tag
   *  the value of the boostElement tag whose first argument is 8
   * </pre>
   * @type {RegExp}
   */
  static TokenPattern = /\{([psdv])\.([a-zA-Z]+)(?:\[(\d+)])?}/g;

  /**
   * The constructor is not designed to be called.
   * This is a static class.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  /**
   * Renders a template against the mastery it describes.
   * @param {string} template The authored template, tokens and all.
   * @param {number} masterySkillId The wrapper skill id whose state carries the mastery's tags.
   * @returns {string} The finished sentence, or an empty string when any token could not be resolved.
   */
  static resolve(template, masterySkillId)
  {
    if (template === String.empty) return String.empty;

    const state = $dataStates[masterySkillId];

    // a template pointing at a mastery that does not exist describes nothing; say nothing.
    if (!state) return String.empty;

    let resolvable = true;

    const rendered = template.replace(MasteryProseResolver.TokenPattern, (whole, namespace, name, selector) =>
    {
      const value = MasteryProseResolver.#resolveToken(state, namespace, name, selector);

      if (value === null)
      {
        resolvable = false;

        return whole;
      }

      return value;
    });

    if (resolvable === false) return String.empty;

    return rendered;
  }

  /**
   * Whether every token in the given template can currently be resolved.
   * Exists so callers can decide what to show without paying for the render twice.
   * @param {string} template The authored template, tokens and all.
   * @param {number} masterySkillId The wrapper skill id whose state carries the mastery's tags.
   * @returns {boolean}
   */
  static canResolve(template, masterySkillId)
  {
    return MasteryProseResolver.resolve(template, masterySkillId) !== String.empty;
  }

  /**
   * Resolves a single token, or answers null when this resolver does not yet know how.
   *
   * Null rather than a sentinel: an empty string is a legitimate resolved value for some tags, so the
   * "I cannot do this" answer has to be distinguishable from "this resolved to nothing".
   * @param {RPG_State} state The mastery state carrying the tags.
   * @param {string} namespace One of p, d, s or v.
   * @param {string} name The parameter key, structural field, or tag name.
   * @param {string|undefined} selector The bracketed selector, when the token carried one.
   * @returns {string|null}
   */
  static #resolveToken(state, namespace, name, selector)
  {
    // the tag namespace is purely syntactic - it reads notetag grammar rather than tag meaning - so it
    // needs no knowledge of which plugin owns which tag, and no registration from any of them.
    if (namespace === 'v') return MasteryProseResolver.#resolveTagValue(state, name, selector);

    // the parameter and structural namespaces both need a semantic table that does not exist yet.
    return null;
  }

  /**
   * Reads a named tag's value off the mastery state.
   * @param {RPG_State} state The mastery state carrying the tags.
   * @param {string} tagName The tag whose value is wanted.
   * @param {string|undefined} selector The first argument to match on, when the tag repeats.
   * @returns {string|null}
   */
  static #resolveTagValue(state, tagName, selector)
  {
    const matches = MasteryProseResolver.#matchingTags(state, tagName);

    if (matches.length === 0) return null;

    const chosen = MasteryProseResolver.#chooseMatch(matches, selector);

    if (chosen === null) return null;

    return MasteryProseResolver.#formatValue(chosen);
  }

  /**
   * Every occurrence of the named tag on the state, each as its raw argument list.
   * @param {RPG_State} state The mastery state carrying the tags.
   * @param {string} tagName The tag whose occurrences are wanted.
   * @returns {string[][]}
   */
  static #matchingTags(state, tagName)
  {
    const pattern = new RegExp(`<${tagName}:[ ]?(\\[[^\\]]*]|[^>]*)>`, 'gi');
    const found = [];

    for (const match of state.note.matchAll(pattern))
    {
      const stripped = match[1].replace(/^\[/, '')
        .replace(/]$/, '');
      const args = stripped.split(',')
        .map(arg => arg.trim());

      found.push(args);
    }

    return found;
  }

  /**
   * Picks the occurrence the token asked for.
   *
   * Without a selector there must be exactly one occurrence, because "the value of this tag" is
   * ambiguous when a mastery carries several and guessing would print a plausible wrong number.
   * @param {string[][]} matches Every occurrence of the tag, as argument lists.
   * @param {string|undefined} selector The first argument to match on.
   * @returns {string[]|null}
   */
  static #chooseMatch(matches, selector)
  {
    if (selector === undefined)
    {
      if (matches.length !== 1) return null;

      return matches[0];
    }

    const selected = matches.find(args => args[0] === selector);

    if (selected === undefined) return null;

    return selected;
  }

  /**
   * Formats a chosen tag's arguments as the value half of a sentence.
   *
   * The last argument is the magnitude in every tag shape this resolver handles; the earlier ones
   * select what the magnitude applies to and are already spoken by the authored nouns around the token.
   * @param {string[]} args The chosen occurrence's argument list.
   * @returns {string}
   */
  static #formatValue(args)
  {
    const magnitude = args.at(-1);
    const numeric = Number(magnitude);

    // a non-numeric argument is a formula or a mode word; it stands on its own.
    if (Number.isNaN(numeric)) return magnitude;

    const sign = numeric >= 0
      ? '+'
      : String.empty;

    return `${sign}${magnitude}%`;
  }
}

export default MasteryProseResolver;
//endregion MasteryProseResolver