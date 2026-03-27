//region Window_SkillEquipDetail
/**
 * A window responsible for showing skill details in SKS context.
 */
class Window_SkillEquipDetail
  extends Window_Base
{
  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle for this window.
   */
  constructor(rect)
  {
    // perform original logic.
    super(rect);

    // initialize members.
    this.initMembers();
  }

  /**
   * Initializes internal members.
   */
  initMembers()
  {
    /**
     * The actor used for extended/overlay data.
     * @type {Game_Actor|null}
     */
    this._actor = null;

    /**
     * The skill id this window is showing.
     * @type {number}
     */
    this._skillId = 0;

    // refresh to draw default.
    this.refresh();
  }

  /**
   * Assigns the actor for this window.
   * @param {Game_Actor} actor The actor to assign.
   */
  setActor(actor)
  {
    // assign the actor.
    this._actor = actor;

    // refresh for the new actor context.
    this.refresh();
  }

  /**
   * Sets the skill id being displayed and refreshes.
   * @param {number} skillId The new skill id.
   */
  setSkillId(skillId)
  {
    // assign the id.
    this._skillId = skillId > 0
      ? skillId
      : 0;

    // refresh for the new selection.
    this.refresh();
  }

  /**
   * Gets the current skill being presented.
   * @returns {RPG_Skill|null}
   */
  skill()
  {
    // if we do not have a skill id, then there is no skill.
    if (!this._skillId) return null;

    // if we have extend capability available and actor context, then resolve overlayed skill.
    if (typeof J !== 'undefined' && J.EXTEND && this._actor)
    {
      // return the overlayed skill.
      return OverlayManager.getExtendedSkill(this._actor, this._skillId);
    }

    // otherwise, return the base skill.
    return $dataSkills[this._skillId];
  }

  /**
   * Clears and redraws contents.
   */
  refresh()
  {
    // clear existing.
    this.contents.clear();

    // grab the current skill.
    const skill = this.skill();

    // if there is no skill to draw, stop here.
    if (!skill) return;

    // draw icon + name.
    const iconX = 0;
    const nameX = iconX + ImageManager.iconWidth + 6;
    this.drawIcon(skill.iconIndex, iconX, 0);
    this.drawText(skill.name, nameX, 0, this.contentsWidth() - nameX, 'left');

    // compute y for the details section.
    const lineH = this.lineHeight();
    let y = lineH + 4;

    // draw a horizontal line.
    this.drawHorzLine(y - 2);

    // draw costs: MP/TP + Slot cost.
    const mpCost = skill.mpCost || 0;
    const tpCost = skill.tpCost || 0;
    const slotCost = this._actor
      ? this._actor.skillSlotCost(skill.id, 0)
      : (J.SKS.Metadata.defaultSkillSlotCost || 1);
    this.drawText(`MP: ${mpCost}`, 0, y, 120, 'left');
    this.drawText(`TP: ${tpCost}`, 120, y, 120, 'left');
    this.drawText(`Slot: ${slotCost}`, 240, y, 160, 'left');

    // advance y to description block.
    y += lineH + 2;

    // draw description wrapped.
    const desc = skill.description || String.empty;
    const descWidth = this.contentsWidth() - 6;
    const textLines = this.convertEscapeCharacters(desc)
      .split(/\n/g);
    let drawY = y;
    textLines.forEach(line =>
    {
      // draw each line of description.
      this.drawTextEx(line, 0, drawY, descWidth);

      // step down.
      drawY += lineH;
    });
  }

  /**
   * Draws a thin horizontal line across the window.
   * @param {number} y The y coordinate to draw at.
   */
  drawHorzLine(y)
  {
    // determine line width.
    const lineWidth = this.contentsWidth();

    // determine line color.
    const color = this.systemColor();

    // draw the line.
    this.drawRect(0, y, lineWidth, 2, color);
  }
}

//endregion Window_SkillEquipDetail