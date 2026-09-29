//region describeNaturalNotetags
/**
 * The lines describing the buff and growth tags of every parameter bound to natural growth.
 *
 * Nothing here is written per parameter. A binding already names a parameter's four tags, and the parameter's
 * definition already knows its name, its icon and which way is good for it, so every bound parameter's tags are
 * described from those, whichever plugin bound it. The sentences themselves are the game's: four of them, one per
 * kind of tag, kept in its config under each kind's key, and each may name `{stat}`, the parameter's own name, and
 * `{value}`, the amount.
 *
 * It runs once every plugin has bound its parameters, since a parameter bound afterwards would have nothing
 * describing its tags.
 */
class NaturalNotetagDescriptions
{
  /**
   * The four natural tags of every bound parameter: the binding field holding each one's regex, and the key its
   * sentence is kept under in the game's config.
   * @type {{field: string, templateKey: string}[]}
   */
  static Kinds = [
    {
      field: 'buffPlus',
      templateKey: 'naturalBuffPlus',
    },
    {
      field: 'buffRate',
      templateKey: 'naturalBuffRate',
    },
    {
      field: 'growthPlus',
      templateKey: 'naturalGrowthPlus',
    },
    {
      field: 'growthRate',
      templateKey: 'naturalGrowthRate',
    },
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
   * Registers the describers for the four natural tags of every bound parameter.
   */
  static registerAll()
  {
    ParameterRegistry.naturallyBoundKeys()
      .forEach(parameterKey => this.registerParameter(parameterKey));
  }

  /**
   * Registers the describers for one bound parameter's four natural tags.
   * @param {string} parameterKey The registry key of the parameter.
   */
  static registerParameter(parameterKey)
  {
    // the binding names the tags, and the definition names the parameter.
    const binding = ParameterRegistry.naturalBinding(parameterKey);
    const definition = ParameterRegistry.get(parameterKey);

    // one describer for each kind of tag.
    this.Kinds.forEach(kind =>
    {
      const structure = binding[kind.field];
      NotetagDescriber.register(structure, match => this.linesFor(match, definition, kind));
    });
  }

  /**
   * The line describing one natural tag, in the sentence the game keeps for its kind.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is its formula.
   * @param {ParameterDefinition} definition The parameter the tag grows.
   * @param {{field: string, templateKey: string}} kind Which of the four tags it is.
   * @returns {NotetagLine[]}
   */
  static linesFor(match, definition, kind)
  {
    // the tag's formula, as written.
    const [ , formula ] = match;

    // the parameter's own face and name.
    const iconIndex = definition.iconIndex();
    const stat = {
      text: definition.label(),
      kind: NotetagDescriber.TokenKinds.SUBJECT,
    };

    // the amount, and which way it cuts for whoever carries it.
    const value = this.amountText(formula);
    const holderImpact = this.holderImpact(formula, definition);

    return NotetagDescriber.line(kind.templateKey, { iconIndex, holderImpact, value, tokens: { stat } });
  }

  /**
   * A formula as a line shows it. A plain number shows signed; anything else needs a battler to work out, and a
   * line describes the tag rather than any one battler, so it shows as written, in its brackets.
   * @param {string} formula The tag's formula.
   * @returns {string}
   */
  static amountText(formula)
  {
    const constant = Number(formula);

    // a formula needing a battler cannot be worked out here.
    if (Number.isNaN(constant)) return `[${formula}]`;

    return RPG_Trait.asDelta(constant);
  }

  /**
   * Which way a natural tag cuts for whoever carries it: one of {@link NotetagLine.Impacts}.
   *
   * Only a plain number has a direction to read; a formula's depends on the battler working it out. A number
   * moving the parameter the way its definition calls good helps, and the other way hurts.
   * @param {string} formula The tag's formula.
   * @param {ParameterDefinition} definition The parameter the tag grows.
   * @returns {number}
   */
  static holderImpact(formula, definition)
  {
    const constant = Number(formula);

    // a formula's direction depends on the battler working it out.
    if (Number.isNaN(constant)) return NotetagLine.Impacts.NEITHER;

    // nothing moves, so nothing cuts.
    if (constant === 0) return NotetagLine.Impacts.NEITHER;

    // the direction the definition calls good helps; the other hurts.
    const isIncrease = constant > 0;
    if (isIncrease === definition.isIncreaseBeneficial()) return NotetagLine.Impacts.HELPS;

    return NotetagLine.Impacts.HURTS;
  }
}

export default NaturalNotetagDescriptions;
//endregion describeNaturalNotetags