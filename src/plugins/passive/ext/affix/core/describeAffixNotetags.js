//region describeAffixNotetags
/**
 * The lines describing the notetags this plugin reads, registered with {@link NotetagDescriber} at boot.
 *
 * No words are written here. Each sentence is the game's, kept in its config under the tag's key; this class reads
 * the tag and supplies what the sentence names. Every reward already has a name and an icon in whichever manager
 * owns it, so a line asks for those too, rather than keeping a copy that would drift the day one is renamed.
 */
class AffixNotetagDescriptions
{
  /**
   * The name each reward type goes by, asked of whichever manager owns it.
   *
   * A table on the class rather than a local, so a plugin introducing a reward type of its own adds its name
   * beside these.
   * @type {Object<string, function(): string>}
   */
  static RewardNames = {
    exp: () => TextManager.exp,
    gold: () => TextManager.currencyUnit,
    sdp: () => TextManager.sdpPoints(),
    ap: () => TextManager.apPoints(),
    drops: () => TextManager.rewardParam(2),
  };

  /**
   * The icon each reward type wears, asked of whichever manager owns it.
   * @type {Object<string, function(): number>}
   */
  static RewardIcons = {
    exp: () => IconManager.rewardParam(0),
    gold: () => IconManager.rewardParam(1),
    sdp: () => IconManager.rewardParam(4),
    ap: () => IconManager.apPoints(),
    drops: () => IconManager.rewardParam(2),
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
   * Registers the describer of every tag this plugin reads that has its words so far.
   */
  static registerAll()
  {
    NotetagDescriber.register(
      J.PASSIVE.EXT.AFFIX.RegExp.RewardMultiplier,
      match => this.rewardMultiplierLines(match));
  }

  /**
   * The line describing one reward multiplier: how many times as much of which reward enemies yield when
   * defeated, in the sentence the game's config keeps under `rewardMultiplier`.
   *
   * The sentence may name `{value}`, the multiplier (`2.4x`), and `{reward}`, the reward's own name.
   * @param {RegExpExecArray} match The tag as its regex matched it: the reward type, then the multiplier.
   * @returns {NotetagLine[]}
   */
  static rewardMultiplierLines(match)
  {
    // the reward type as the reader reads it, whatever case it was written in.
    const [ , writtenType, writtenMultiplier ] = match;
    const rewardType = writtenType.toLowerCase();

    // a reward the game never grants has nothing to multiply, so the tag says nothing.
    if (this.isRewardGranted(rewardType) === false) return [];

    // the reward's own face and name.
    const iconIndex = this.RewardIcons[rewardType]();
    const reward = {
      text: this.RewardNames[rewardType](),
      kind: NotetagDescriber.TokenKinds.SUBJECT,
    };

    // how many times as much of it, and which way that cuts for the one yielding it.
    const multiplier = Number(writtenMultiplier);
    const value = `${multiplier}x`;
    const holderImpact = this.rewardImpact(multiplier);

    return NotetagDescriber.line('rewardMultiplier', { iconIndex, holderImpact, value, tokens: { reward } });
  }

  /**
   * Whether the game grants a reward type at all. Experience, gold and drops are always granted; SDP and AP come
   * from their own plugins, which a game may leave out.
   * @param {string} rewardType One of exp, gold, sdp, ap or drops.
   * @returns {boolean}
   */
  static isRewardGranted(rewardType)
  {
    // SDP only exists where J-SDP does.
    if (rewardType === 'sdp') return J.SDP !== undefined;

    // AP only exists where J-Aptitude does.
    if (rewardType === 'ap') return J.APT !== undefined;

    return true;
  }

  /**
   * Which way a reward multiplier cuts for the enemy carrying it: one of {@link NotetagLine.Impacts}.
   *
   * Whatever an enemy yields when defeated, it yields to whoever defeated it, so more of it hurts the enemy and
   * less of it helps. On a difficulty's enemy side, that is what reads a bigger bounty as easier.
   * @param {number} multiplier How many times as much of the reward is yielded.
   * @returns {number}
   */
  static rewardImpact(multiplier)
  {
    // more to give up on defeat.
    if (multiplier > 1) return NotetagLine.Impacts.HURTS;

    // less to give up on defeat.
    if (multiplier < 1) return NotetagLine.Impacts.HELPS;

    // exactly as much as ever.
    return NotetagLine.Impacts.NEITHER;
  }
}

export default AffixNotetagDescriptions;
//endregion describeAffixNotetags