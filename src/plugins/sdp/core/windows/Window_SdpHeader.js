//region Window_SdpHeader
import MasteryProseResolver from '../managers/MasteryProseResolver.js';
import StatDistributionPanel from '../models/StatDistributionPanel.js';
/**
 * The header above the panel details, naming the mastery a panel grants and describing what it does.
 *
 * This is the only place a player can learn what a mastery does *before* buying it. The passives scene
 * describes the same thing, but reaching it means already owning the mastery, which is exactly the
 * wrong moment - a strip costs ten rank-ups, twenty at the capstone, and the mastery is the reason to
 * spend them.
 */
class Window_SdpHeader
  extends Window_Base
{
  /**
   * @type {StatDistributionPanel|null}
   */
  _panel = null;

  /**
   * Binds the hovered panel to this header.
   * @param {StatDistributionPanel|null} panel The hovered panel.
   */
  setPanel(panel)
  {
    this._panel = panel;
  }

  /**
   * The panel currently bound to this header.
   * @returns {StatDistributionPanel|null}
   */
  panel()
  {
    return this._panel;
  }

  /**
   * Implements {@link Window_Base.drawContent}.<br/>
   * Renders the mastery identity, then the prose describing it.
   */
  drawContent()
  {
    const panel = this.panel();
    if (!panel)
    {
      return;
    }

    const { mastery } = panel;

    // panels outside the mastery program still occupy this header, so say so rather than leaving the
    // reader wondering whether something failed to load.
    if (mastery.participates() === false)
    {
      this.drawNoMastery();
      return;
    }

    this.drawMasteryIdentity(mastery);
    this.drawMasteryProse(mastery);
  }

  /**
   * Draws the muted placeholder for a panel that grants no mastery.
   */
  drawNoMastery()
  {
    this.resetFontSettings();
    const mutedText = this.colorizeText(8, 'This panel grants no mastery.');
    this.drawTextEx(mutedText, 0, 0, this.innerWidth);
    this.resetFontSettings();
  }

  /**
   * Draws the first line: which enemy subgroup this mastery belongs to, and the skill it grants.
   * @param {PanelMastery} mastery The mastery enrollment of the hovered panel.
   */
  drawMasteryIdentity(mastery)
  {
    const subgroup = J.SDP.Metadata.subgroupsMap.get(mastery.subgroupKey);
    const subgroupName = subgroup
      ? subgroup.name
      : mastery.subgroupKey;

    this.resetFontSettings();
    const tintedSubgroup = this.colorizeText(14, subgroupName);
    const skillName = `\\Skill[${mastery.masterySkillId}]`;
    // the tier locates this panel in its strip, which differs panel to panel and is worth saying.
    // What it does not say is "Rank MAX": every mastery in the game arrives at max rank, so a line
    // repeating that on all five hundred panels teaches nothing after the first one a player reads.
    const tierNote = this.colorizeText(8, `Tier ${mastery.subgroupTier}`);
    const identityLine = `${tintedSubgroup} · ${skillName} ${tierNote}`;
    this.drawTextEx(identityLine, 0, 0, this.innerWidth);
    this.resetFontSettings();
  }

  /**
   * Splits a resolved description into the lines it will be drawn as.
   *
   * The break is authored, not calculated: a pipe in the template marks where the sentence should
   * turn over, because a person picks a clause and a measurement picks whatever word the pixels ran
   * out on. Wrapping is the safety net beneath that, for a line whose live values came out longer
   * than whoever wrote it expected.
   *
   * Measured with textSizeEx rather than textWidth because the line is painted with drawTextEx: the
   * former processes escape codes and answers the width that will actually appear, while the latter
   * measures the raw string and counts the codes themselves as characters.
   * @param {string} resolved The description, tokens already filled in.
   * @returns {string[]}
   */
  proseLines(resolved)
  {
    const measure = text => this.textSizeEx(text).width;
    const authored = resolved.split('|')
      .map(segment => segment.trim())
      .filter(segment => segment !== String.empty);

    const budget = this.proseLineCount();

    // an authored break that already fits is honoured exactly as written.
    const everySegmentFits = authored.every(segment => measure(segment) <= this.innerWidth);

    if (authored.length <= budget && everySegmentFits) return authored;

    const rejoined = authored.join(' ');

    return TextWrapper.wrapToLines(rejoined, this.innerWidth, budget, measure);
  }

  /**
   * How many lines the header reserves for the description beneath the identity row.
   * @returns {number}
   */
  proseLineCount()
  {
    return 2;
  }

  /**
   * Draws the two lines describing what the mastery actually does.
   *
   * Nothing is drawn when the subgroup has no authored prose, or when the prose still carries a token
   * this build cannot resolve. Showing a partly-filled sentence would be worse than showing none: the
   * player would read a number that is not the number.
   * @param {PanelMastery} mastery The mastery enrollment of the hovered panel.
   */
  drawMasteryProse(mastery)
  {
    const subgroup = J.SDP.Metadata.subgroupsMap.get(mastery.subgroupKey);

    if (!subgroup) return;

    const template = subgroup.prose.forTier(mastery.subgroupTier);

    if (template === String.empty) return;

    const resolved = MasteryProseResolver.resolve(template, mastery.masterySkillId);

    if (resolved === String.empty) return;

    this.resetFontSettings();

    const lines = this.proseLines(resolved);

    lines.forEach((line, index) =>
    {
      const y = this.lineHeight() * (index + 1);
      this.drawTextEx(line, 0, y, this.innerWidth);
    });

    this.resetFontSettings();
  }
}
export default Window_SdpHeader;
//endregion Window_SdpHeader