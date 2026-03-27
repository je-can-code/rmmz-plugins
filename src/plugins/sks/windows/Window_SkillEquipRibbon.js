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

  /**
   * Clears and redraws the contents of this window.
   */
  drawContent()
  {
    // perform original logic.
    super.drawContent();

    // don't draw if the actor is unavailable.
    if (!this._actor) return;

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
    const spent = actor.spentSlotPoints();
    const total = actor.maxSlotPoints();

    // draw name (left) and points (right) on the same line.
    this.drawText(name, nameX, y, this.contentsWidth() - nameX - 6, 'left');
    this.drawText(`${spent}/${total} pts`, 0, y, this.contentsWidth() - 6, 'right');
  }
}

//endregion Window_SkillEquipRibbon