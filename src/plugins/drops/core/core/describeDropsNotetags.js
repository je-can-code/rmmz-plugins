//region describeDropsNotetags
/**
 * The lines describing the notetags this plugin reads, registered with {@link NotetagDescriber} at boot.
 *
 * No words are written here. Each sentence is the game's, kept in its config under the tag's key; this class reads
 * the tag and supplies what the sentence names.
 */
class DropsNotetagDescriptions
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
    // how much likelier the party's defeated enemies are to drop their items.
    NotetagDescriber.register(
      J.DROPS.RegExp.DropMultiplier,
      match => this.partyRateLines(match, 'dropMultiplier', IconManager.dropRate()));

    // how much more gold the party's defeated enemies pay out.
    NotetagDescriber.register(
      J.DROPS.RegExp.GoldMultiplier,
      match => this.partyRateLines(match, 'goldMultiplier', IconManager.goldRate()));

    // how many tiers every item a kill drops is carried up its upgrade ladder.
    NotetagDescriber.register(
      J.DROPS.RegExp.DropUpgrade,
      match => this.haulLines(match, 'dropUpgrade'));

    // how many extra copies of every item a kill drops.
    NotetagDescriber.register(
      J.DROPS.RegExp.DropQuantity,
      match => this.haulLines(match, 'dropQuantity'));
  }

  /**
   * The line describing a party reward rate tag, in the sentence the game's config keeps under the given key.
   *
   * Only a party member's tags count, and every member's add together into one rate the whole party shares, so the
   * amount is shown as the percent this one tag adds (`+30%`). The sentence may name `{value}`.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is its amount, in percent.
   * @param {string} templateKey The key of the tag's sentence.
   * @param {number} iconIndex The rate's own icon.
   * @returns {NotetagLine[]}
   */
  static partyRateLines(match, templateKey, iconIndex)
  {
    // the amount, as written.
    const [ , writtenAmount ] = match;
    const amount = Number(writtenAmount);

    // the amount as a percentage, and which way it cuts.
    const value = RPG_Trait.asDeltaPercent(amount);
    const holderImpact = this.rateImpact(amount);

    return NotetagDescriber.line(templateKey, { iconIndex, holderImpact, value });
  }

  /**
   * The line describing a tag that improves the haul of a kill, in the sentence the game's config keeps under the
   * given key: every item dropped is carried up its ladder, or comes with extra copies.
   *
   * The amount is a count of tiers or copies (`+2`). The sentence may name `{value}`.
   * @param {RegExpExecArray} match The tag as its regex matched it; the first capture is its amount.
   * @param {string} templateKey The key of the tag's sentence.
   * @returns {NotetagLine[]}
   */
  static haulLines(match, templateKey)
  {
    // the amount, as written.
    const [ , writtenAmount ] = match;
    const amount = Number(writtenAmount);

    // the drops' own face, the amount, and which way it cuts.
    const iconIndex = IconManager.rewardParam(2);
    const value = RPG_Trait.asDelta(amount);
    const holderImpact = this.haulImpact(amount);

    return NotetagDescriber.line(templateKey, { iconIndex, holderImpact, value });
  }

  /**
   * Which way a haul bonus cuts for whoever carries it: one of {@link NotetagLine.Impacts}.
   *
   * Both sides of a kill contribute, but it is the enemy that gives its loot up, and every one of these tags Chef
   * Adventure writes sits on an enemy's affix. So a better haul hurts the enemy carrying it, which is what reads a
   * bigger bounty as good news for the party, the way a reward multiplier does.
   * @param {number} amount The tiers or copies added, which may be negative.
   * @returns {number}
   */
  static haulImpact(amount)
  {
    // more to give up on defeat.
    if (amount > 0) return NotetagLine.Impacts.HURTS;

    // less to give up on defeat.
    if (amount < 0) return NotetagLine.Impacts.HELPS;

    // no change at all.
    return NotetagLine.Impacts.NEITHER;
  }

  /**
   * Which way a party reward rate cuts for whoever carries it: one of {@link NotetagLine.Impacts}.
   *
   * The rate may be negative: a curse that thins out what the party brings home.
   * @param {number} amount The rate, in percent.
   * @returns {number}
   */
  static rateImpact(amount)
  {
    // more for the party.
    if (amount > 0) return NotetagLine.Impacts.HELPS;

    // less for the party.
    if (amount < 0) return NotetagLine.Impacts.HURTS;

    // no change at all.
    return NotetagLine.Impacts.NEITHER;
  }
}

export default DropsNotetagDescriptions;
//endregion describeDropsNotetags