//region MasteryProseResolver
import MasteryFormulaPhrase from './MasteryFormulaPhrase.js';
import MasteryGatePhrase from './MasteryGatePhrase.js';
import MasteryPayloadLocator from './MasteryPayloadLocator.js';
import MasteryTagShapes from './MasteryTagShapes.js';

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
  static TokenPattern = /\{([psdvPD])\.([a-zA-Z]+)(?:\[(\d+)])?}/g;

  /**
   * How many frames make a second, for rendering cadences the player can feel.
   * @type {number}
   */
  static FramesPerSecond = 60;

  /**
   * The palette index each kind of resolved value is tinted with.
   *
   * A description is mostly authored words with a few live numbers threaded through it, and the eye
   * needs to find those numbers without reading the sentence twice. Three colours rather than a dozen:
   * a stat, a measure of time or distance, and everything else that is a quantity.
   * @type {Object<string, number>}
   */
  static ValueColors = {
    stat: 1,
    measure: 6,
    quantity: 3,
    list: 2,
  };

  /**
   * Which colour each structural field takes.
   * @type {Object<string, string>}
   */
  static StructuralColorKinds = {
    gate: 'stat',
    interval: 'measure',
    duration: 'measure',
    window: 'measure',
    radius: 'measure',
    chance: 'quantity',
    stacks: 'quantity',
    count: 'quantity',
    perStack: 'quantity',
    payload: 'quantity',
    foodTypes: 'list',
    statList: 'list',
  };

  /**
   * The tags whose named argument carries a cadence, in the order they are tried.
   * @type {[ string, number ][]}
   */
  static CadenceTags = [
    [ 'autoExecuteSkill', 3 ],
    [ 'autoApplyStateOnNearby', 3 ],
    [ 'autoApplyState', 2 ],
  ];

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
    const skill = $dataSkills[masterySkillId];

    // a template pointing at a mastery that does not exist describes nothing; say nothing.
    if (!state) return String.empty;
    if (!skill) return String.empty;

    const payload = MasteryPayloadLocator.locate(state, skill);
    let resolvable = true;

    const rendered = template.replace(MasteryProseResolver.TokenPattern, (whole, namespace, name, selector) =>
    {
      // an uppercase namespace asks for the parameter's own name alongside its value, for the many
      // lines whose noun is simply the parameter. A line preferring friendlier wording than the
      // catalogue's - "damage taken" over "Phys Dmg Rate" - keeps the lowercase form and its own noun.
      const named = namespace === namespace.toUpperCase();
      const lowered = namespace.toLowerCase();

      const value = MasteryProseResolver.#resolveToken(state, skill, payload, lowered, name, selector);

      if (value === null)
      {
        resolvable = false;

        return whole;
      }

      const labelled = named
        ? MasteryProseResolver.#withParameterName(value, name)
        : value;

      if (labelled === null)
      {
        resolvable = false;

        return whole;
      }

      return MasteryProseResolver.#tint(labelled, lowered, name, skill);
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
   * Prefixes a resolved value with the display name of the parameter it belongs to.
   * @param {string} value The resolved value.
   * @param {string} parameterKey The parameter key being named.
   * @returns {string|null} Null when nothing names this key, so the caller can fail closed.
   */
  static #withParameterName(value, parameterKey)
  {
    const mapping = ParameterTraitMap.forKey(parameterKey);

    if (mapping === null) return null;

    const label = MasteryProseResolver.#parameterLabel(mapping);

    return `${label} ${value}`;
  }

  /**
   * The display name of a parameter, read from whichever catalogue its trait code belongs to.
   * @param {{code: number, dataId: number}} mapping The trait encoding the parameter.
   * @returns {string}
   */
  static #parameterLabel(mapping)
  {
    if (mapping.code === ParameterTraitMap.BaseParameterCode) return TextManager.param(mapping.dataId);

    if (mapping.code === ParameterTraitMap.ExParameterCode) return TextManager.xparam(mapping.dataId);

    return TextManager.sparam(mapping.dataId);
  }

  /**
   * Wraps a resolved value in the colour its kind is read in.
   * @param {string} value The resolved value.
   * @param {string} namespace One of p, d, s or v.
   * @param {string} name The parameter key, structural field, or tag name.
   * @returns {string}
   */
  static #tint(value, namespace, name, skill)
  {
    const kind = namespace === 's'
      ? MasteryProseResolver.#structuralColorKind(name, skill)
      : MasteryProseResolver.#valueColorKind(namespace, name);

    // every field that can resolve to a value has a declared colour: the structural switch answers
    // null for anything not in that table, so a resolved value always has one to wear.
    const colorIndex = MasteryProseResolver.ValueColors[kind];

    return `\\C[${colorIndex}]${value}\\C[0]`;
  }

  /**
   * The colour kind a structural field reads in.
   * @param {string} field The structural field name.
   * @param {RPG_Skill} skill The wrapper skill, which decides what a gate turned out to be.
   * @returns {string}
   */
  static #structuralColorKind(field, skill)
  {
    // a gate can be a threshold or a measure, and only the phrase itself knows which.
    if (field === 'gate') return MasteryGatePhrase.colorKindFor(skill);

    return MasteryProseResolver.StructuralColorKinds[field];
  }

  /**
   * The colour kind a non-structural namespace reads in.
   *
   * A tag naming a parameter is a stat however it was written: lifesteal arrives as its own tag and
   * regeneration arrives as a trait, and a description quoting both in one breath should not paint
   * them differently. Anything the parameter catalogs do not claim is an effect magnitude.
   * @param {string} namespace One of p, d or v.
   * @param {string} name The parameter key or tag name.
   * @returns {string}
   */
  static #valueColorKind(namespace, name)
  {
    if (namespace !== 'v') return 'stat';

    const base = name.replace(/Buff(Plus|Rate)$/, String.empty);

    if (ParameterTraitMap.hasKey(base)) return 'stat';

    if (ParameterRegistry.has(base)) return 'stat';

    return 'quantity';
  }

  /**
   * Resolves a single token, or answers null when this resolver cannot.
   *
   * Null rather than a sentinel: an empty string is a legitimate resolved value for some tags, so the
   * "I cannot do this" answer has to be distinguishable from "this resolved to nothing".
   * @param {RPG_State} state The mastery state carrying the tags.
   * @param {RPG_Skill} skill The wrapper skill carrying the gate.
   * @param {RPG_State|RPG_Skill} payload The row this mastery delivers.
   * @param {string} namespace One of p, d, s or v.
   * @param {string} name The parameter key, structural field, or tag name.
   * @param {string|undefined} selector The bracketed selector, when the token carried one.
   * @returns {string|null}
   */
  static #resolveToken(state, skill, payload, namespace, name, selector)
  {
    // the tag namespace is purely syntactic - it reads notetag grammar rather than tag meaning - so it
    // needs no knowledge of which plugin owns which tag, and no registration from any of them.
    if (namespace === 'v') return MasteryProseResolver.#resolveTagValue(state, name, selector);

    if (namespace === 'p') return MasteryProseResolver.#resolveParameter(state, name);

    if (namespace === 'd') return MasteryProseResolver.#resolveParameter(payload, name);

    return MasteryProseResolver.#resolveStructural(state, skill, payload, name);
  }

  //region parameter namespace
  /**
   * Reads a parameter's delta off a row, whether a trait or a notetag carries it.
   *
   * Both are tried because the ecosystem stores the same idea both ways: endurance arrives as a trait,
   * crit block arrives as a tag, and prose should not have to know which.
   * @param {RPG_Base} dataRow The row the value is read from.
   * @param {string} parameterKey The parameter key, or a tag name on that row.
   * @returns {string|null}
   */
  static #resolveParameter(dataRow, parameterKey)
  {
    const fromBuffTag = MasteryProseResolver.#resolveBuffTag(dataRow, parameterKey);
    if (fromBuffTag !== null) return fromBuffTag;

    const fromPlainTag = MasteryProseResolver.#resolveTagValue(dataRow, parameterKey, undefined);
    if (fromPlainTag !== null) return fromPlainTag;

    const fromFamily = MasteryProseResolver.#resolveTraitFamily(dataRow, parameterKey);
    if (fromFamily !== null) return fromFamily;

    return MasteryProseResolver.#resolveTrait(dataRow, parameterKey);
  }

  /**
   * Reads a parameter from its `<keyBuffPlus>` or `<keyBuffRate>` notetag.
   * @param {RPG_Base} dataRow The row the value is read from.
   * @param {string} parameterKey The parameter key.
   * @returns {string|null}
   */
  static #resolveBuffTag(dataRow, parameterKey)
  {
    const suffixes = [ 'BuffRate', 'BuffPlus' ];

    for (const suffix of suffixes)
    {
      const resolved = MasteryProseResolver.#resolveTagValue(dataRow, `${parameterKey}${suffix}`, undefined);

      if (resolved === null) continue;

      // a Plus tag adds points, not a proportion, so quoting it as a percentage would be a lie. Only
      // a bare number is unmarked though: a Plus tag holding a formula was already phrased, and the
      // percentages inside that phrase belong to the formula rather than to the tag.
      const isBareNumber = /^[+-]?[\d.]+%$/.test(resolved);

      if (suffix === 'BuffPlus' && isBareNumber) return resolved.slice(0, -1);

      return resolved;
    }

    return null;
  }

  /**
   * Reads a parameter from the trait that encodes it.
   * @param {RPG_Base} dataRow The row the value is read from.
   * @param {string} parameterKey The parameter key.
   * @returns {string|null}
   */
  static #resolveTrait(dataRow, parameterKey)
  {
    if (dataRow.isState() === false) return null;

    const mapping = ParameterTraitMap.forKey(parameterKey);

    if (mapping === null) return null;

    const found = dataRow.traits.find(trait => trait.code === mapping.code && trait.dataId === mapping.dataId);

    if (found === undefined) return null;

    const asTrait = RPG_Trait.fromValues(found.code, found.dataId, found.value);

    return asTrait.textValue();
  }

  /**
   * Reads the shared magnitude of a whole family of traits.
   *
   * Element and state resistances arrive as a run of traits that share one value - dargin weakens six
   * elements by the same third - so the prose says the magnitude once and names the family in its own
   * words. A family whose members disagree is refused rather than averaged.
   * @param {RPG_Base} dataRow The row the value is read from.
   * @param {string} parameterKey Either elementRate or stateRate.
   * @returns {string|null}
   */
  static #resolveTraitFamily(dataRow, parameterKey)
  {
    const familyCodes = { elementRate: 11, stateRate: 13 };
    const code = familyCodes[parameterKey];

    if (code === undefined) return null;
    if (dataRow.isState() === false) return null;

    const members = dataRow.traits.filter(trait => trait.code === code);

    if (members.length === 0) return null;

    const [ first ] = members;
    const uniform = members.every(trait => trait.value === first.value);

    if (uniform === false) return null;

    const asTrait = RPG_Trait.fromValues(first.code, first.dataId, first.value);

    return asTrait.textValue();
  }
  //endregion parameter namespace

  //region structural namespace
  /**
   * Resolves one of the derived structural fields.
   * @param {RPG_State} state The mastery state carrying the tags.
   * @param {RPG_Skill} skill The wrapper skill carrying the gate.
   * @param {RPG_State|RPG_Skill} payload The row this mastery delivers.
   * @param {string} field The structural field name.
   * @returns {string|null}
   */
  static #resolveStructural(state, skill, payload, field)
  {
    switch (field)
    {
      case 'gate':
        return MasteryGatePhrase.phraseFor(skill);
      case 'interval':
        return MasteryProseResolver.#resolveInterval(state);
      case 'duration':
        return MasteryProseResolver.#resolveFrameTag(payload, 'stateDuration');
      case 'window':
        return MasteryProseResolver.#resolveWindow(state, skill);
      case 'radius':
        return MasteryProseResolver.#resolveRadius(state, skill, payload);
      case 'stacks':
        return MasteryProseResolver.#resolveCount(payload, 'stackMax');
      case 'chance':
        return MasteryProseResolver.#resolveChance(state);
      case 'count':
        return MasteryProseResolver.#resolveShapedCount(state, skill);
      case 'perStack':
        return MasteryProseResolver.#resolvePerStack(state, skill);
      case 'payload':
        return MasteryProseResolver.#resolvePayloadFormula(payload);
      case 'foodTypes':
        return MasteryProseResolver.#resolveExtendedTypes(state);
      case 'statList':
        return MasteryProseResolver.#resolveStatList(state);
      default:
        return null;
    }
  }

  /**
   * The cadence a mastery fires on, rendered in seconds.
   * @param {RPG_State} state The mastery state carrying the tags.
   * @returns {string|null}
   */
  static #resolveInterval(state)
  {
    const declared = MasteryProseResolver.#shapedArgument(state, 'interval');

    if (declared !== null) return MasteryProseResolver.#secondsText(Number(declared));

    return null;
  }

  /**
   * The lookback window a mastery measures against, rendered in seconds.
   * @param {RPG_State} state The mastery state carrying the tags.
   * @param {RPG_Skill} skill The wrapper skill, whose gate can also carry a window.
   * @returns {string|null}
   */
  static #resolveWindow(state, skill)
  {
    const historyArgs = MasteryProseResolver.#firstTagArgs(state, 'skillHistoryBonus');

    if (historyArgs !== null) return `${historyArgs[1]} seconds`;

    return MasteryGatePhrase.phraseFor(skill);
  }

  /**
   * The reach of the payload, in tiles.
   * @param {RPG_State|RPG_Skill} payload The row this mastery delivers.
   * @returns {string|null}
   */
  static #resolveRadius(state, skill, payload)
  {
    // a tag that carries its own reach wins, because it is the reach the mastery actually uses.
    const declared = MasteryProseResolver.#shapedArgument(state, 'radius');

    if (declared !== null) return `${declared} tiles`;

    const names = [ 'radius', 'proximity' ];
    const sources = [ payload, MasteryPayloadLocator.locateVehicle(state, skill) ];

    for (const source of sources)
    {
      for (const name of names)
      {
        const value = MasteryProseResolver.#numberTag(source, name);

        if (value !== null) return `${value} tiles`;
      }
    }

    return null;
  }

  /**
   * The argument the shape table names for a meaning, across every tag on the row that declares one.
   * @param {RPG_Base} dataRow The row carrying the tags.
   * @param {string} meaning The meaning being looked up.
   * @returns {string|null}
   */
  static #shapedArgument(dataRow, meaning)
  {
    // only a cadence has two legal positions worth guessing between. Letting a radius fall back to
    // "the last number" reads a cooldown in frames as a distance in tiles.
    const mayFallBack = meaning === 'interval';

    for (const tagName of Object.keys(MasteryTagShapes.Shapes))
    {
      const index = MasteryTagShapes.indexOf(tagName, meaning);

      if (index === null) continue;

      const args = MasteryProseResolver.#firstTagArgs(dataRow, tagName);

      if (args === null) continue;

      const value = mayFallBack
        ? MasteryProseResolver.#argumentOrLast(args, index)
        : MasteryProseResolver.#exactArgument(args, index);

      if (value === null) continue;

      return `${value}`;
    }

    return null;
  }

  /**
   * The chance a mastery's effect lands, as a percentage.
   * @param {RPG_State} state The mastery state carrying the tags.
   * @returns {string|null}
   */
  static #resolveChance(state)
  {
    const declared = MasteryProseResolver.#shapedArgument(state, 'chance');

    if (declared !== null) return `${declared}%`;

    if (state.isState() === false) return null;

    const onHit = state.traits.find(trait => trait.code === 32);

    if (onHit === undefined) return null;

    return `${Math.round(onHit.value * 100)}%`;
  }

  /**
   * The share of a resource each stack of a scaler is worth.
   * @param {RPG_Skill} skill The wrapper skill carrying the scaler.
   * @returns {string|null}
   */
  static #resolvePerStack(state, skill)
  {
    const fromState = MasteryProseResolver.#shapedArgument(state, 'perStack');

    if (fromState !== null) return `${fromState}%`;

    const fromSkill = MasteryProseResolver.#shapedArgument(skill, 'perStack');

    if (fromSkill !== null) return `${fromSkill}%`;

    return null;
  }

  /**
   * The food groups this tier extends, listed as a reader would say them.
   * @param {RPG_State} state The mastery state carrying the tags.
   * @returns {string|null}
   */
  static #resolveExtendedTypes(state)
  {
    const matches = MasteryProseResolver.#matchingTags(state, 'extendType');

    if (matches.length === 0) return null;

    const names = matches.map(args => args[0].replace(/^food-/, ''));

    return MasteryProseResolver.#listText(names);
  }

  /**
   * The parameters this tier's traits raise, named rather than numbered.
   * @param {RPG_State} state The mastery state carrying the traits.
   * @returns {string|null}
   */
  static #resolveStatList(state)
  {
    if (state.isState() === false) return null;

    const raised = state.traits.filter(trait => trait.code === ParameterTraitMap.BaseParameterCode && trait.value > 1);

    if (raised.length === 0) return null;

    const names = raised.map(trait => TextManager.param(trait.dataId));

    return MasteryProseResolver.#listText(names);
  }

  /**
   * Joins names the way a sentence would, with an "and" before the last.
   * @param {string[]} names The names being listed.
   * @returns {string}
   */
  static #listText(names)
  {
    if (names.length === 1) return names[0];

    const leading = names.slice(0, -1)
      .join(', ');

    return `${leading} and ${names.at(-1)}`;
  }

  /**
   * The payload's damage or heal formula, phrased for a reader.
   * @param {RPG_State|RPG_Skill} payload The row this mastery delivers.
   * @returns {string|null}
   */
  static #resolvePayloadFormula(payload)
  {
    const shieldFormula = MasteryProseResolver.#bracketFormula(payload, 'shield');

    if (shieldFormula !== null) return shieldFormula;

    const hpFormula = MasteryProseResolver.#bracketFormula(payload, 'hpFormula');

    if (hpFormula !== null) return hpFormula;

    if (!payload.damage) return null;
    if (!payload.damage.formula) return null;

    return MasteryFormulaPhrase.phraseFor(payload.damage.formula);
  }

  /**
   * A bracketed formula tag, phrased for a reader.
   * @param {RPG_Base} dataRow The row the formula is read from.
   * @param {string} tagName The tag holding the formula.
   * @returns {string|null}
   */
  static #bracketFormula(dataRow, tagName)
  {
    const args = MasteryProseResolver.#firstTagArgs(dataRow, tagName);

    if (args === null) return null;

    return MasteryFormulaPhrase.phraseFor(args.join(','));
  }
  //endregion structural namespace

  //region tag reading
  /**
   * Reads a named tag's value off a row.
   * @param {RPG_Base} dataRow The row carrying the tags.
   * @param {string} tagName The tag whose value is wanted.
   * @param {string|undefined} selector The first argument to match on, when the tag repeats.
   * @returns {string|null}
   */
  static #resolveTagValue(dataRow, tagName, selector)
  {
    const matches = MasteryProseResolver.#matchingTags(dataRow, tagName);

    if (matches.length === 0) return null;

    const chosen = MasteryProseResolver.#chooseMatch(matches, selector);

    if (chosen === null) return null;

    const declared = MasteryTagShapes.indexOf(tagName, 'magnitude');

    if (declared !== null && selector === undefined) return MasteryProseResolver.#formatArgument(chosen[declared]);

    return MasteryProseResolver.#formatValue(chosen);
  }

  /**
   * A whole-number tag's value.
   * @param {RPG_Base} dataRow The row carrying the tag.
   * @param {string} tagName The tag whose value is wanted.
   * @returns {number|null}
   */
  static #numberTag(dataRow, tagName)
  {
    const args = MasteryProseResolver.#firstTagArgs(dataRow, tagName);

    if (args === null) return null;

    const parsed = Number(args[0]);

    if (Number.isNaN(parsed)) return null;

    return parsed;
  }

  /**
   * A frame-count tag, rendered in seconds.
   * @param {RPG_Base} dataRow The row carrying the tag.
   * @param {string} tagName The tag whose value is wanted.
   * @returns {string|null}
   */
  static #resolveFrameTag(dataRow, tagName)
  {
    const frames = MasteryProseResolver.#numberTag(dataRow, tagName);

    if (frames === null) return null;

    return MasteryProseResolver.#secondsText(frames);
  }

  /**
   * A bare count tag, with no unit attached.
   * @param {RPG_Base} dataRow The row carrying the tag.
   * @param {string} tagName The tag whose value is wanted.
   * @returns {string|null}
   */
  static #resolveCount(dataRow, tagName)
  {
    const count = MasteryProseResolver.#numberTag(dataRow, tagName);

    if (count === null) return null;

    return `${count}`;
  }

  /**
   * A count read through the shape table, falling back to a bare single-value tag.
   * @param {RPG_Base} dataRow The row carrying the tags.
   * @param {string} meaning The meaning being looked up.
   * @returns {string|null}
   */
  static #resolveShapedCount(state, skill)
  {
    const fromState = MasteryProseResolver.#shapedArgument(state, 'count');

    if (fromState !== null) return fromState;

    const fromSkill = MasteryProseResolver.#shapedArgument(skill, 'count');

    if (fromSkill !== null) return fromSkill;

    return MasteryProseResolver.#resolveCount(state, 'spreadPerTick');
  }

  /**
   * The argument list of the first occurrence of a tag.
   * @param {RPG_Base} dataRow The row carrying the tags.
   * @param {string} tagName The tag whose arguments are wanted.
   * @returns {string[]|null}
   */
  static #firstTagArgs(dataRow, tagName)
  {
    const matches = MasteryProseResolver.#matchingTags(dataRow, tagName);

    if (matches.length === 0) return null;

    return matches[0];
  }

  /**
   * Every occurrence of the named tag on the row, each as its raw argument list.
   * @param {RPG_Base} dataRow The row carrying the tags.
   * @param {string} tagName The tag whose occurrences are wanted.
   * @returns {string[][]}
   */
  static #matchingTags(dataRow, tagName)
  {
    // tokens are written in camelCase because a hyphen cannot appear in one, but some tags are
    // authored kebab-case, so the camel spelling is also tried in its hyphenated form.
    const kebab = tagName.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    const pattern = new RegExp(`<(?:${tagName}|${kebab}):[ ]?(\\[[^\\]]*]|[^>]*)>`, 'gi');
    const found = [];

    for (const match of dataRow.note.matchAll(pattern))
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
      const [ first ] = matches;

      if (matches.length === 1) return first;

      // several occurrences that agree on their magnitude are not ambiguous: dargin weakens six
      // elements by one third, and the sentence wants that third said once.
      const last = args => MasteryProseResolver.#lastNumeric(args);
      const uniform = matches.every(args => last(args) === last(first));

      if (uniform) return first;

      return null;
    }

    const byIdentity = matches.find(args => args[0] === selector);

    if (byIdentity !== undefined) return byIdentity;

    // a single occurrence with the selector reading as an argument index instead.
    if (matches.length !== 1) return null;

    const [ only ] = matches;
    const index = Number(selector);

    if (index >= only.length) return null;

    return [ only[index] ];
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
    const magnitude = MasteryProseResolver.#lastNumeric(args);

    // no number anywhere means the tag holds a formula, which is read aloud rather than quoted. A
    // mode word - "unique", "time" - is not a magnitude either, and saying it would be nonsense.
    if (magnitude === null)
    {
      const joined = args.join(',');

      return MasteryFormulaPhrase.phraseFor(joined);
    }

    const sign = Number(magnitude) >= 0
      ? '+'
      : String.empty;

    return `${sign}${magnitude}%`;
  }

  /**
   * Formats one already-chosen argument as the value half of a sentence.
   * @param {string} argument The argument holding the magnitude.
   * @returns {string|null}
   */
  static #formatArgument(argument)
  {
    if (argument === undefined) return null;
    if (Number.isNaN(Number(argument))) return MasteryFormulaPhrase.phraseFor(argument);

    const sign = Number(argument) >= 0
      ? '+'
      : String.empty;

    return `${sign}${argument}%`;
  }

  /**
   * The declared argument, when it is present and numeric.
   * @param {string[]} args The tag's argument list.
   * @param {number} index The index the shape table declared.
   * @returns {string|null}
   */
  static #exactArgument(args, index)
  {
    const declared = args[index];

    if (declared === undefined) return null;
    if (Number.isNaN(Number(declared))) return null;

    return declared;
  }

  /**
   * The declared argument, or the last numeric one when the tag was written in a shorter form.
   *
   * Several tags have two legal shapes: {@code autoExecuteSkill:[ID, time, FRAMES]} carries its
   * cadence third, while {@code autoExecuteSkill:[ID, KIND, MIN, FRAMES, TILES]} carries it fourth.
   * One declared index cannot serve both, and the value being sought is the last number in either.
   * @param {string[]} args The tag's argument list.
   * @param {number} index The index the shape table declared.
   * @returns {string|null}
   */
  static #argumentOrLast(args, index)
  {
    const declared = args[index];

    if (declared !== undefined && !Number.isNaN(Number(declared))) return declared;

    return MasteryProseResolver.#lastNumeric(args);
  }

  /**
   * The last argument that is actually a number.
   *
   * Trailing mode words are common - {@code [0, 6, 4, unique]} ends in how to count, not how much -
   * so the magnitude is the last numeric argument rather than simply the last one.
   * @param {string[]} args The chosen occurrence's argument list.
   * @returns {string|null}
   */
  static #lastNumeric(args)
  {
    for (let index = args.length - 1; index >= 0; index--)
    {
      const candidate = args[index];

      if (candidate === String.empty) continue;
      if (Number.isNaN(Number(candidate))) continue;

      return candidate;
    }

    return null;
  }

  /**
   * Renders a frame count as the seconds a player would feel.
   * @param {number} frames The frame count.
   * @returns {string}
   */
  static #secondsText(frames)
  {
    const seconds = frames / MasteryProseResolver.FramesPerSecond;
    const rounded = Math.round(seconds * 100) / 100;

    return `${rounded} seconds`;
  }
  //endregion tag reading
}

export default MasteryProseResolver;
//endregion MasteryProseResolver