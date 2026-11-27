//region describeAbsNotetags
/**
 * The lines describing the notetags this plugin reads, registered with {@link NotetagDescriber} at boot.
 *
 * No words are written here. Each sentence is the game's, kept in its config under the tag's key; this class reads
 * the tag and supplies what the sentence names. Only the tags that have their words so far are described, and a tag
 * with no sentence in the config simply says nothing.
 */
class AbsNotetagDescriptions
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
    // a battler's hits getting past a target's damage rates while it carries any state of a given type.
    NotetagDescriber.register(
      J.ABS.RegExp.PierceDamageRateIfStateType,
      match => this.pierceDamageRateIfStateTypeLines(match));
  }

  /**
   * The line describing the tag that pierces a target's damage rates, in the sentence the game's config keeps under
   * `pierceDamageRateIfStateType`: the holder's physical and magical hits treat the PDR and MDR of a target carrying
   * any state of the given type as no lower than 100%.
   *
   * A type is a classifier the game's own states declare with `<type:NAME>` rather than a row anywhere in the
   * database, so it is named exactly as the tag writes it. The sentence may name `{type}`; there is no amount to show.
   * The line wears physical damage rate's own face, and getting past a target's resistance only ever works in its
   * holder's favor.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is the type.
   * @returns {NotetagLine[]}
   */
  static pierceDamageRateIfStateTypeLines(match)
  {
    // the type any of the target's states must carry, read the way the tag's reader reads it.
    const [ , stateType ] = match;
    const type = { text: stateType, kind: NotetagDescriber.TokenKinds.SUBJECT };

    // physical damage rate's own face, and a pierce that only ever helps whoever carries it.
    const iconIndex = IconManager.sparam(6);
    const holderImpact = NotetagLine.Impacts.HELPS;

    return NotetagDescriber.line('pierceDamageRateIfStateType', { iconIndex, holderImpact, tokens: { type } });
  }
}

export default AbsNotetagDescriptions;
//endregion describeAbsNotetags