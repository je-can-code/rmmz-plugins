//region describeProfNotetags
/**
 * The lines describing the notetags this plugin reads, registered with {@link NotetagDescriber} at boot.
 *
 * No words are written here. Each sentence is the game's, kept in its config under the tag's key; this class reads
 * the tag and supplies what the sentence names.
 */
class ProfNotetagDescriptions
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
    // the extra proficiency every skill use earns.
    NotetagDescriber.register(
      J.PROF.RegExp.ProficiencyBonus,
      match => this.bonusLines(match));

    // a battler whose attackers earn no proficiency from it, which works in its favor.
    NotetagDescriber.register(
      J.PROF.RegExp.ProficiencyGivingBlock,
      () => this.blockLines('proficiencyGivingBlock', NotetagLine.Impacts.HELPS));

    // a battler that earns no proficiency from its own skills, which only ever holds it back.
    NotetagDescriber.register(
      J.PROF.RegExp.ProficiencyGainingBlock,
      () => this.blockLines('proficiencyGainingBlock', NotetagLine.Impacts.HURTS));
  }

  /**
   * The line describing a proficiency bonus tag, in the sentence the game's config keeps under `proficiencyBonus`:
   * extra proficiency earned on top of the usual for every skill used.
   *
   * Only an actor ever earns proficiency, so the tag does nothing anywhere else. The sentence may name `{value}`, the
   * bonus (`+3`).
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is the bonus.
   * @returns {NotetagLine[]}
   */
  static bonusLines(match)
  {
    // the bonus, as written.
    const [ , writtenBonus ] = match;
    const bonus = Number(writtenBonus);

    // the proficiency stat's own face, the bonus, and which way it cuts.
    const iconIndex = IconManager.proficiencyBoost();
    const value = RPG_Trait.asDelta(bonus);
    const holderImpact = this.bonusImpact(bonus);

    return NotetagDescriber.line('proficiencyBonus', { iconIndex, holderImpact, value });
  }

  /**
   * The line describing either proficiency block, in the sentence the game's config keeps under the given key.
   *
   * Neither block carries an amount, so the sentence has nothing to name.
   * @param {string} templateKey The key of the tag's sentence.
   * @param {number} holderImpact Which way the block cuts for whoever carries it.
   * @returns {NotetagLine[]}
   */
  static blockLines(templateKey, holderImpact)
  {
    // the proficiency stat's own face.
    const iconIndex = IconManager.proficiencyBoost();

    return NotetagDescriber.line(templateKey, { iconIndex, holderImpact });
  }

  /**
   * Which way a proficiency bonus cuts for whoever carries it: one of {@link NotetagLine.Impacts}.
   *
   * More proficiency helps its holder, and a bonus of nothing changes nothing. The tag only ever carries whole
   * numbers of zero or more, so there is no bonus that hurts.
   * @param {number} bonus The bonus.
   * @returns {number}
   */
  static bonusImpact(bonus)
  {
    // more proficiency earned.
    if (bonus > 0) return NotetagLine.Impacts.HELPS;

    // no change at all.
    return NotetagLine.Impacts.NEITHER;
  }
}

export default ProfNotetagDescriptions;
//endregion describeProfNotetags