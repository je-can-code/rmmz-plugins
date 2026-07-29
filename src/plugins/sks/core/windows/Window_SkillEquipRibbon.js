//region Window_SkillEquipRibbon
/**
 * A window responsible for showing actor and SKS point summary.
 */
class Window_SkillEquipRibbon
  extends Window_ActorRibbon
{
  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle for this window.
   */
  constructor(rect)
  {
    // perform original logic.
    super(rect);
  }

  /**
   * Initializes member fields.
   */
  initMembers()
  {
    // initialize base ribbon members (actor, face size/coords, etc.).
    super.initMembers();
  }

  //region properties
  /**
   * Gets the actor.
   * @returns {*} The actor.
   */
  actor()
  {
    // hand back the actor.
    return this._actor;
  }
  //endregion properties

  /**
   * Clears and redraws the contents of this window.
   */
  drawContent()
  {
    // perform original logic.
    super.drawContent();

    // don't draw if the actor is unavailable.
    if (!this.actor()) return;

    // draw the actor name and slot info.
    this.drawNameAndPoints();
  }

  /**
   * Draws the actor name and slot info.
   */
  drawNameAndPoints()
  {
    // grab the actor.
    const actor = this.actor();

    // pull the face anchor and dimensions from the base ribbon.
    const [ fx, fy ] = this.faceCoordinates();
    const [ fw ] = this.faceSize();

    // compute text placement to the right of the face.
    const nameX = fx + fw + 16;
    const y = fy;

    // gather display values.
    const name = actor.name();

    // draw name (left) and the mode-appropriate capacity summary (right) on the same line.
    this.drawText(name, nameX, y, this.contentsWidth() - nameX - 6, 'left');
    this.drawText(this.capacitySummaryText(actor), 0, y, this.contentsWidth() - 6, 'right');
  }

  /**
   * Builds the capacity summary text for the given actor, matching whichever
   * capacity the plugin's configured mode actually gates equipping by.
   * @param {Game_Actor} actor - The actor to summarize.
   * @returns {string}
   */
  capacitySummaryText(actor)
  {
    // when exclusive mode is on and slots are the governing capacity, points are
    // irrelevant to whether anything can be equipped- show slot count instead.
    if (J.SKS.Metadata.enableExclusiveMode && J.SKS.Metadata.slotsOnly)
    {
      // slotMap().size is the true occupied-slot count, unlike the sparse slots() array.
      return `${actor.slotMap().size}/${actor.maxSlots()} slots`;
    }

    // otherwise- tandem mode, or exclusive points-only mode- points still gate equipping.
    return `${actor.spentSlotPoints()}/${actor.maxSlotPoints()} pts`;
  }
}

export default Window_SkillEquipRibbon;
//endregion Window_SkillEquipRibbon