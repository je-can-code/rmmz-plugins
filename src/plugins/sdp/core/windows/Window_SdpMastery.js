//region Window_SdpMastery
import StatDistributionPanel from '../models/StatDistributionPanel.js';
/**
 * Read-only mastery summary for the hovered panel.
 * Mastery is separate from {@link Window_SdpRewardList} — it reflects subgroup tier
 * replacement skills granted at max rank, not panelRewards eval rows.
 */
class Window_SdpMastery
  extends Window_Base
{
  /**
   * @type {StatDistributionPanel|null}
   */
  #panel = null;

  /**
   * Binds the hovered panel to this mastery strip.
   * @param {StatDistributionPanel|null} panel The hovered panel.
   */
  setPanel(panel)
  {
    this.#panel = panel;
  }

  /**
   * Implements {@link Window_Base.drawContent}.<br>
   * Renders subgroup mastery enrollment for the hovered panel.
   */
  drawContent()
  {
    const panel = this.#panel;
    if (!panel)
    {
      return;
    }

    const { mastery } = panel;

    // panels outside the mastery program get a muted placeholder so layout stays stable.
    if (mastery.participates() === false)
    {
      this.changeTextColor(ColorManager.textColor(8));
      this.drawText('No mastery.', 0, 0, this.innerWidth, Window_Base.TextAlignments.Left);
      this.resetTextColor();
      return;
    }

    const subgroup = J.SDP.Metadata.subgroupsMap.get(mastery.subgroupKey);
    const subgroupName = subgroup
      ? subgroup.name
      : mastery.subgroupKey;
    const subgroupIcon = subgroup && subgroup.iconIndex >= 0
      ? subgroup.iconIndex
      : J.SDP.Metadata.sdpIconIndex;

    // line 1: subgroup identity — the family this mastery belongs to.
    const iconPad = 4;

    // note: the icon width lives on `ImageManager` in MZ; `Window_Base._iconWidth` is an MV property
    // that does not exist here, and reaching for it silently yields a NaN x that renders nothing.
    const textX = subgroupIcon >= 0
      ? ImageManager.iconWidth + iconPad
      : 0;

    if (subgroupIcon >= 0)
    {
      this.drawIcon(subgroupIcon, iconPad, 0);
    }

    this.resetFontSettings();
    const tintedSubgroup = this.colorizeText(14, subgroupName);
    this.drawTextEx(tintedSubgroup, textX, 0, this.innerWidth - textX);
    this.resetFontSettings();

    // line 2: the passive skill granted at max rank, plus tier context.
    const skillLine = `\\Skill[${mastery.masterySkillId}] \\C[8]· Tier ${mastery.subgroupTier} · Rank MAX\\C[0]`;
    this.drawTextEx(skillLine, 0, this.lineHeight(), this.innerWidth);
    this.resetFontSettings();
  }
}

export default Window_SdpMastery;
//endregion Window_SdpMastery