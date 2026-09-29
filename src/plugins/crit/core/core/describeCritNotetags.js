//region describeCritNotetags
/**
 * The lines describing the notetags this plugin reads, registered with {@link NotetagDescriber} at boot.
 *
 * No words are written here. Each sentence is the game's, kept in its config under the tag's key; this class reads
 * the tag and supplies what the sentence names.
 */
class CritNotetagDescriptions
{
  /**
   * The constructor is not designed to be called.
   * This is a static class.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  /**
   * Registers the describer of every tag this plugin reads that has its words so far.
   */
  static registerAll()
  {
    // what a battler's critical hits deal on top of their base.
    NotetagDescriber.register(
      J.CRIT.RegExp.CritDamageMultiplier,
      match => this.critAmountLines(match, 'critMultiplier'));

    // the base every critical hit builds on, and every percentage of it is measured against.
    NotetagDescriber.register(
      J.CRIT.RegExp.CritDamageMultiplierBase,
      match => this.critAmountLines(match, 'critMultiplierBase'));

    // how much of a critical hit's extra damage its holder shrugs off.
    NotetagDescriber.register(
      J.CRIT.RegExp.CritDamageReduction,
      match => this.critReductionLines(match));

    // the reduction every critical hit taken faces, and every percentage of it is measured against.
    NotetagDescriber.register(
      J.CRIT.RegExp.CritDamageReductionBase,
      match => this.critReductionBaseLines(match));

    // what a battler's critical hits inflict on whoever they land on.
    NotetagDescriber.register(
      J.CRIT.RegExp.OnCritApply,
      match => this.critStateLines(match, 'onCritApply'));

    // what a battler's critical hits grant the battler landing them.
    NotetagDescriber.register(
      J.CRIT.RegExp.OnCritSelf,
      match => this.critStateLines(match, 'onCritSelf'));

    // what one skill's critical hits inflict on whoever they land on.
    NotetagDescriber.register(
      J.CRIT.RegExp.ThisCritApply,
      match => this.critStateLines(match, 'thisCritApply'));

    // what one skill's critical hits grant the battler landing them.
    NotetagDescriber.register(
      J.CRIT.RegExp.ThisCritSelf,
      match => this.critStateLines(match, 'thisCritSelf'));

    // every one of those rolls, guaranteed.
    NotetagDescriber.register(
      J.CRIT.RegExp.ForceCritProcs,
      () => this.forceCritProcsLines());

    // a battler's better odds of a critical hit against a target carrying a given state.
    NotetagDescriber.register(
      J.CRIT.RegExp.CritChanceIfState,
      match => this.critChanceIfStateLines(match, 'critChanceIfState'));

    // one skill's better odds of a critical hit against a target carrying a given state.
    NotetagDescriber.register(
      J.CRIT.RegExp.ThisCritChanceIfState,
      match => this.critChanceIfStateLines(match, 'thisCritChanceIfState'));

    // a battler's better odds of a critical hit against a target carrying any state of a given type.
    NotetagDescriber.register(
      J.CRIT.RegExp.CritChanceIfStateType,
      match => this.critChanceIfStateTypeLines(match, 'critChanceIfStateType'));

    // one skill's better odds of a critical hit against a target carrying any state of a given type.
    NotetagDescriber.register(
      J.CRIT.RegExp.ThisCritChanceIfStateType,
      match => this.critChanceIfStateTypeLines(match, 'thisCritChanceIfStateType'));

    // a battler's guaranteed critical hit against a target carrying any of the given states.
    NotetagDescriber.register(
      J.CRIT.RegExp.CritAlwaysIfState,
      match => this.critAlwaysIfStateLines(match, 'critAlwaysIfState'));

    // one skill's guaranteed critical hit against a target carrying any of the given states.
    NotetagDescriber.register(
      J.CRIT.RegExp.ThisCritsAlwaysIfState,
      match => this.critAlwaysIfStateLines(match, 'thisCritsAlwaysIfState'));

    // a battler's guaranteed critical hit against a target carrying any state of a given type.
    NotetagDescriber.register(
      J.CRIT.RegExp.CritAlwaysIfStateType,
      match => this.critAlwaysIfStateTypeLines(match, 'critAlwaysIfStateType'));

    // one skill's guaranteed critical hit against a target carrying any state of a given type.
    NotetagDescriber.register(
      J.CRIT.RegExp.ThisCritsAlwaysIfStateType,
      match => this.critAlwaysIfStateTypeLines(match, 'thisCritsAlwaysIfStateType'));
  }

  /**
   * The line describing a crit multiplier tag, or its base counterpart, in the sentence the game's config keeps
   * under the given key.
   *
   * The sentence may name `{value}`, the amount (`+50%`).
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is its amount, in percent.
   * @param {string} templateKey The key of the tag's sentence.
   * @returns {NotetagLine[]}
   */
  static critAmountLines(match, templateKey)
  {
    // the amount, as written.
    const [ , writtenAmount ] = match;
    const amount = Number(writtenAmount);

    // the crit multiplier's own face, the amount as a percentage, and which way it cuts.
    const iconIndex = IconManager.critParam(0);
    const value = RPG_Trait.asDeltaPercent(amount);
    const holderImpact = this.amountImpact(amount);

    return NotetagDescriber.line(templateKey, { iconIndex, holderImpact, value });
  }

  /**
   * Which way a crit amount cuts for whoever carries it: one of {@link NotetagLine.Impacts}.
   *
   * Harder or likelier crits help their holder, and an amount of nothing changes nothing. The tags only ever carry
   * whole numbers of zero or more, so there is no amount that hurts.
   * @param {number} amount The amount, in percent.
   * @returns {number}
   */
  static amountImpact(amount)
  {
    // harder or likelier crits.
    if (amount > 0) return NotetagLine.Impacts.HELPS;

    // no change at all.
    return NotetagLine.Impacts.NEITHER;
  }

  /**
   * The line describing a crit reduction tag, in the sentence the game's config keeps under `critReduction`.
   *
   * A reduction trims only the extra damage a critical hit deals, never the hit itself, so the sentence speaks of
   * that damage and shows it moving: a reduction of 30 is `-30%`, and a negative one, which lets crits land harder,
   * is `+10%`. The sentence may name `{value}`.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is its amount, in percent.
   * @returns {NotetagLine[]}
   */
  static critReductionLines(match)
  {
    // the amount, as written.
    const [ , writtenAmount ] = match;
    const amount = Number(writtenAmount);

    // the extra damage taken moves the opposite way to the reduction.
    const value = RPG_Trait.asDeltaPercent(-amount);

    return this.reductionLines('critReduction', amount, value);
  }

  /**
   * The line describing a base crit reduction tag, in the sentence the game's config keeps under
   * `critReductionBase`.
   *
   * The base is a reduction in its own right, so its amount is shown as written (`+20%`). The sentence may name
   * `{value}`.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is its amount, in percent.
   * @returns {NotetagLine[]}
   */
  static critReductionBaseLines(match)
  {
    // the amount, as written.
    const [ , writtenAmount ] = match;
    const amount = Number(writtenAmount);

    // the base reads as the reduction it is.
    const value = RPG_Trait.asDeltaPercent(amount);

    return this.reductionLines('critReductionBase', amount, value);
  }

  /**
   * The line for either crit reduction tag, drawn with crit block's own face.
   * @param {string} templateKey The key of the tag's sentence.
   * @param {number} amount The reduction as written, in percent, which decides which way the line cuts.
   * @param {string} value The amount as the sentence shows it.
   * @returns {NotetagLine[]}
   */
  static reductionLines(templateKey, amount, value)
  {
    // crit block's own face, and which way the reduction cuts.
    const iconIndex = IconManager.critParam(1);
    const holderImpact = this.reductionImpact(amount);

    return NotetagDescriber.line(templateKey, { iconIndex, holderImpact, value });
  }

  /**
   * Which way a crit reduction cuts for whoever carries it: one of {@link NotetagLine.Impacts}.
   *
   * Unlike a multiplier, a reduction may be negative: a debuff that lets critical hits land harder.
   * @param {number} amount The reduction, in percent.
   * @returns {number}
   */
  static reductionImpact(amount)
  {
    // softer crits against the holder.
    if (amount > 0) return NotetagLine.Impacts.HELPS;

    // harder crits against the holder.
    if (amount < 0) return NotetagLine.Impacts.HURTS;

    // no change at all.
    return NotetagLine.Impacts.NEITHER;
  }

  /**
   * The line describing an on-crit state tag, in the sentence the game's config keeps under the given key: every
   * critical hit rolls a chance to apply a state, to whoever was hit or to whoever landed it.
   *
   * The sentence may name `{value}`, the chance (`50%`), and `{state}`, the state itself. A proc is carried for its
   * holder's sake, whichever battler it lands on, so the line always helps whoever carries it.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is `[STATE_ID, CHANCE]`.
   * @param {string} templateKey The key of the tag's sentence.
   * @returns {NotetagLine[]}
   */
  static critStateLines(match, templateKey)
  {
    // the state and its chance, parsed the way the tag's reader parses them.
    const [ , writtenPair ] = match;
    const [ stateId, chance ] = JsonMapper.parseObject(writtenPair);

    // the critical hit's own face, since the state draws its own beside its name.
    const iconIndex = IconManager.critParam(0);
    const state = this.stateToken(stateId);

    // the chance of it landing.
    const value = `${chance}%`;
    const holderImpact = NotetagLine.Impacts.HELPS;

    return NotetagDescriber.line(templateKey, { iconIndex, holderImpact, value, tokens: { state } });
  }

  /**
   * The line describing a conditional crit chance tag, in the sentence the game's config keeps under the given key:
   * better odds of a critical hit against a target already carrying a given state.
   *
   * The sentence may name `{value}`, the bonus chance (`+30%`), and `{state}`, the state the target must carry.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is `[STATE_ID, BONUS_CHANCE]`.
   * @param {string} templateKey The key of the tag's sentence.
   * @returns {NotetagLine[]}
   */
  static critChanceIfStateLines(match, templateKey)
  {
    // the state and the bonus, parsed the way the tag's reader parses them.
    const [ , writtenPair ] = match;
    const [ stateId, bonusChance ] = JsonMapper.parseObject(writtenPair);

    // the state the target must carry.
    const state = this.stateToken(stateId);

    return this.critChanceLines(templateKey, bonusChance, { state });
  }

  /**
   * The line describing a conditional crit chance tag keyed by state type, in the sentence the game's config keeps
   * under the given key: better odds of a critical hit against a target carrying any state of a given type.
   *
   * A type is a classifier the game's own states declare with `<type:NAME>` rather than a row anywhere in the
   * database, so no text code can draw it: it is named exactly as the tag writes it. The sentence may name
   * `{value}`, the bonus chance (`+50%`), and `{type}`, the classifier.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is `[TYPE, BONUS_CHANCE]`.
   * @param {string} templateKey The key of the tag's sentence.
   * @returns {NotetagLine[]}
   */
  static critChanceIfStateTypeLines(match, templateKey)
  {
    // the type and the bonus, parsed the way the tag's reader parses them.
    const [ , writtenPair ] = match;
    const [ stateType, bonusChance ] = JsonMapper.parseObject(writtenPair);

    // the type any of the target's states must carry, as the tag writes it.
    const type = { text: stateType, kind: NotetagDescriber.TokenKinds.SUBJECT };

    return this.critChanceLines(templateKey, bonusChance, { type });
  }

  /**
   * The line for any conditional crit chance tag, drawn with crit chance's own face.
   * @param {string} templateKey The key of the tag's sentence.
   * @param {number} bonusChance The bonus to crit chance, in percent.
   * @param {Object<string, {text: string, kind: string}>} tokens What the target must carry, however it is named.
   * @returns {NotetagLine[]}
   */
  static critChanceLines(templateKey, bonusChance, tokens)
  {
    // crit chance's own face, the bonus, and which way it cuts.
    const iconIndex = IconManager.xparam(2);
    const value = RPG_Trait.asDeltaPercent(bonusChance);
    const holderImpact = this.amountImpact(bonusChance);

    return NotetagDescriber.line(templateKey, { iconIndex, holderImpact, value, tokens });
  }

  /**
   * The lines describing a guaranteed-crit tag keyed by state, in the sentence the game's config keeps under the
   * given key: every hit able to crit is a critical hit against a target carrying any of the listed states.
   *
   * Any one of the states is enough, so each gets a line of its own, and every one of those lines is true alone.
   * The sentence may name `{state}`; there is no amount to show.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is `[STATE_ID, ...]`.
   * @param {string} templateKey The key of the tag's sentence.
   * @returns {NotetagLine[]}
   */
  static critAlwaysIfStateLines(match, templateKey)
  {
    // the states, parsed the way the tag's reader parses them.
    const [ , writtenIds ] = match;
    const stateIds = JsonMapper.parseObject(writtenIds);

    // one line per state, since any one of them guarantees the crit.
    return stateIds.flatMap(stateId =>
    {
      // the state the target must carry.
      const state = this.stateToken(stateId);

      return this.critAlwaysLines(templateKey, { state });
    });
  }

  /**
   * The line describing a guaranteed-crit tag keyed by state type, in the sentence the game's config keeps under the
   * given key: every hit able to crit is a critical hit against a target carrying any state of the given type.
   *
   * Like every type, it is named exactly as the tag writes it. The sentence may name `{type}`; there is no amount to
   * show.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is the type.
   * @param {string} templateKey The key of the tag's sentence.
   * @returns {NotetagLine[]}
   */
  static critAlwaysIfStateTypeLines(match, templateKey)
  {
    // the type any of the target's states must carry, read the way the tag's reader reads it.
    const [ , stateType ] = match;
    const type = { text: stateType, kind: NotetagDescriber.TokenKinds.SUBJECT };

    return this.critAlwaysLines(templateKey, { type });
  }

  /**
   * The line for any guaranteed-crit tag, drawn with crit chance's own face.
   * @param {string} templateKey The key of the tag's sentence.
   * @param {Object<string, {text: string, kind: string}>} tokens What the target must carry, however it is named.
   * @returns {NotetagLine[]}
   */
  static critAlwaysLines(templateKey, tokens)
  {
    // crit chance's own face, and a guarantee only ever works in its holder's favor.
    const iconIndex = IconManager.xparam(2);
    const holderImpact = NotetagLine.Impacts.HELPS;

    return NotetagDescriber.line(templateKey, { iconIndex, holderImpact, tokens });
  }

  /**
   * A state named in a line, as the text code that draws its icon and name from the database when the line is drawn.
   * @param {number} stateId The state's id.
   * @returns {{text: string, kind: string}}
   */
  static stateToken(stateId)
  {
    return { text: `\\state[${stateId}]`, kind: NotetagDescriber.TokenKinds.CODE };
  }

  /**
   * The line describing the tag that makes every on-crit state roll succeed, in the sentence the game's config
   * keeps under `forceCritProcs`.
   *
   * The tag carries no amount, so the sentence has nothing to name, and a guaranteed proc always helps whoever
   * carries it.
   * @returns {NotetagLine[]}
   */
  static forceCritProcsLines()
  {
    // the critical hit's own face, and a guarantee only ever works in its holder's favor.
    const iconIndex = IconManager.critParam(0);
    const holderImpact = NotetagLine.Impacts.HELPS;

    return NotetagDescriber.line('forceCritProcs', { iconIndex, holderImpact });
  }
}

export default CritNotetagDescriptions;
//endregion describeCritNotetags