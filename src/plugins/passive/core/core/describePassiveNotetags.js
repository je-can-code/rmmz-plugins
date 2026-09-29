//region describePassiveNotetags
/**
 * The lines describing the notetags this plugin reads, registered with {@link NotetagDescriber} at boot.
 *
 * No words are written here. Each sentence is the game's, kept in its config under the tag's key; this class reads
 * the tag and supplies what the sentence names.
 */
class PassiveNotetagDescriptions
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
    // the states a source grants as passives, once for every source granting them.
    NotetagDescriber.register(
      J.PASSIVE.RegExp.PassiveStateIds,
      match => this.grantLines(match, 'passive'));

    // the states a source grants as passives, once however many sources grant them.
    NotetagDescriber.register(
      J.PASSIVE.RegExp.UniquePassiveStateIds,
      match => this.grantLines(match, 'uniquePassive'));

    // a state kept off the Passives menu: housekeeping, which the game's config decides whether to mention at all.
    NotetagDescriber.register(
      J.PASSIVE.RegExp.HideFromPassiveList,
      () => NotetagDescriber.line('hideFromPassiveList', {}));
  }

  /**
   * The line describing a tag granting passive states, in the sentence the game's config keeps under the given key.
   *
   * The sentence may name `{states}`, every granted state in the order the tag lists them, each as the text code that
   * draws its icon and name. What a granted state does is for its own lines to say, so the grant itself cuts neither
   * way, and the states' own icons leave the line none of its own to lead with.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is `[STATE_ID, ...]`.
   * @param {string} templateKey The key of the tag's sentence.
   * @returns {NotetagLine[]}
   */
  static grantLines(match, templateKey)
  {
    // the states, parsed the way the tag's reader parses them.
    const [ , writtenIds ] = match;
    const stateIds = JsonMapper.parseObject(writtenIds);

    // every state as the code that draws it, set apart by commas.
    const codes = stateIds.map(stateId => `\\state[${stateId}]`);
    const states = { text: codes.join(', '), kind: NotetagDescriber.TokenKinds.CODE };

    return NotetagDescriber.line(templateKey, { tokens: { states } });
  }
}

export default PassiveNotetagDescriptions;
//endregion describePassiveNotetags