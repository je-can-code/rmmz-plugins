//region describeElemNotetags
/**
 * The lines describing the notetags this plugin reads, registered with {@link NotetagDescriber} at boot.
 *
 * No words are written here. Each sentence is the game's, kept in its config under the tag's key; this class reads
 * the tag and supplies what the sentence names.
 */
class ElemNotetagDescriptions
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
    // the elements a battler heals from instead of taking damage.
    NotetagDescriber.register(
      J.ELEM.RegExp.AbsorbElementIds,
      match => this.absorbLines(match));

    // how much harder, or softer, a battler's skills of an element hit.
    NotetagDescriber.register(
      J.ELEM.RegExp.BoostElement,
      match => this.elementPercentLines(match, 'boostElement'));

    // how much harder, or softer, a battler hits anything belonging to an element's family.
    NotetagDescriber.register(
      J.ELEM.RegExp.Slayer,
      match => this.elementPercentLines(match, 'slayer'));

    // the only elements that can harm a battler at all.
    NotetagDescriber.register(
      J.ELEM.RegExp.StrictElementIds,
      match => this.strictLines(match));

    // how much of a target's resistance to an element a battler's attacks negate.
    NotetagDescriber.register(
      J.ELEM.RegExp.PierceElement,
      match => this.pierceLines(match, 'pierceElement'));

    // how much of a target's resistance to an element one skill negates.
    NotetagDescriber.register(
      J.ELEM.RegExp.ThisPierceElement,
      match => this.pierceLines(match, 'thisPierceElement'));
  }

  /**
   * The line describing an absorb tag, in the sentence the game's config keeps under `absorbElements`: every listed
   * element heals whoever carries the tag instead of hurting them.
   *
   * The sentence may name `{elements}`, every listed element in the order the tag lists them, each as the text code
   * that draws its icon, color and name. Absorbing always helps whoever carries it.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is `[ELEMENT_ID, ...]`.
   * @returns {NotetagLine[]}
   */
  static absorbLines(match)
  {
    // the elements, parsed the way the tag's reader parses them.
    const [ , writtenIds ] = match;
    const elementIds = JsonMapper.parseObject(writtenIds);

    return this.elementListLines('absorbElements', elementIds);
  }

  /**
   * The line describing a strict element tag, in the sentence the game's config keeps under `strictElements`: the
   * only elements whose attacks can harm whoever carries the tag, every other element hitting for nothing.
   *
   * Non-elemental attacks skip the element math entirely, so they still land. The sentence may name `{elements}`,
   * every listed element in the order the tag lists them, each as the text code that draws its icon, color and name.
   * Shrugging off every other element always helps whoever carries it.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is `[ELEMENT_ID, ...]`.
   * @returns {NotetagLine[]}
   */
  static strictLines(match)
  {
    // the elements, parsed the way the tag's reader parses them.
    const [ , writtenIds ] = match;
    const elementIds = JsonMapper.parseObject(writtenIds);

    return this.elementListLines('strictElements', elementIds);
  }

  /**
   * The line for either tag listing elements its holder is protected by, led by the first element's face.
   * @param {string} templateKey The key of the tag's sentence.
   * @param {number[]} elementIds The elements, in the order the tag lists them.
   * @returns {NotetagLine[]}
   */
  static elementListLines(templateKey, elementIds)
  {
    // the first element's own face, since the line is about the elements themselves.
    const [ firstElementId ] = elementIds;
    const iconIndex = IconManager.element(firstElementId);

    // every element as the code that draws it, and a protection only ever works in its holder's favor.
    const elements = this.elementListToken(elementIds);
    const holderImpact = NotetagLine.Impacts.HELPS;

    return NotetagDescriber.line(templateKey, { iconIndex, holderImpact, tokens: { elements } });
  }

  /**
   * The line describing a tag multiplying damage by an element, in the sentence the game's config keeps under the
   * given key: an element boost multiplies every skill bearing the element, and a slayer multiplies every hit on
   * anything belonging to the element's family, whatever the hit is made of.
   *
   * The sentence may name `{value}`, the multiplier as a percentage (`+50%`), and `{element}`, the element as the
   * text code that draws its icon, color and name.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is `[ELEMENT_ID, PERCENT]`.
   * @param {string} templateKey The key of the tag's sentence.
   * @returns {NotetagLine[]}
   */
  static elementPercentLines(match, templateKey)
  {
    // the element and its percentage, parsed the way the tag's reader parses them.
    const [ , writtenPair ] = match;
    const [ elementId, percent ] = JsonMapper.parseObject(writtenPair);

    // the element's own face, and the element as the code that draws it: a list of one.
    const iconIndex = IconManager.element(elementId);
    const element = this.elementListToken([ elementId ]);

    // the percentage, and which way it cuts.
    const value = RPG_Trait.asDeltaPercent(percent);
    const holderImpact = this.amountImpact(percent);

    return NotetagDescriber.line(templateKey, { iconIndex, holderImpact, value, tokens: { element } });
  }

  /**
   * The line describing a resistance-negating tag, or its this-skill twin, in the sentence the game's config keeps
   * under the given key: how far a target's resistance to the element is pushed back toward neutral.
   *
   * The amount is points taken off the resistance rather than a share of it, and it never pushes past neutral, so
   * a weakness or an absorbed element is never touched. The sentence may name `{value}`, the amount (`5%`), and
   * `{element}`, the element as the text code that draws its icon, color and name.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is `[ELEMENT_ID, PERCENT]`.
   * @param {string} templateKey The key of the tag's sentence.
   * @returns {NotetagLine[]}
   */
  static pierceLines(match, templateKey)
  {
    // the element and its amount, parsed the way the tag's reader parses them.
    const [ , writtenPair ] = match;
    const [ elementId, percent ] = JsonMapper.parseObject(writtenPair);

    // the element's own face, and the element as the code that draws it: a list of one.
    const iconIndex = IconManager.element(elementId);
    const element = this.elementListToken([ elementId ]);

    // the amount negated, which is never below nothing, and which way it cuts.
    const value = `${percent}%`;
    const holderImpact = this.amountImpact(percent);

    return NotetagDescriber.line(templateKey, { iconIndex, holderImpact, value, tokens: { element } });
  }

  /**
   * Which way an element amount cuts for whoever carries it: one of {@link NotetagLine.Impacts}.
   *
   * A boost may be negative, a curse that softens every skill of the element; resistance negated never is.
   * @param {number} percent The amount, in percent.
   * @returns {number}
   */
  static amountImpact(percent)
  {
    // harder-hitting attacks of the element.
    if (percent > 0) return NotetagLine.Impacts.HELPS;

    // softer-hitting attacks of the element.
    if (percent < 0) return NotetagLine.Impacts.HURTS;

    // no change at all.
    return NotetagLine.Impacts.NEITHER;
  }

  /**
   * A list of elements named in a line, each as the text code that draws its icon, color and name when the line is
   * drawn, set apart by commas.
   * @param {number[]} elementIds The elements' ids, in the order they are listed.
   * @returns {{text: string, kind: string}}
   */
  static elementListToken(elementIds)
  {
    // every element as the code that draws it.
    const codes = elementIds.map(elementId => `\\element[${elementId}]`);

    return { text: codes.join(', '), kind: NotetagDescriber.TokenKinds.CODE };
  }
}

export default ElemNotetagDescriptions;
//endregion describeElemNotetags