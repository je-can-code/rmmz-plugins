//region Window_EquipActorRibbon
/**
 * A ribbon window for the equip scene that displays the currently equipped actor's face and name.
 * Replaces the old full face portrait that vanilla `Window_EquipStatus` drew internally, freeing
 * up most of that window's vertical space for the parameter catalog.
 */
class Window_EquipActorRibbon
  extends Window_ActorRibbon
{
  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle for this window.
   */
  

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

  constructor(rect)
  {
    // call super when having extended constructors.
    super(rect);

    // jumpstart initialization on creation.
    this.initialize(rect);
  }

  //region draw
  /**
   * Extends {@link Window_ActorRibbon#drawContent}.<br/>
   * Also draws the actor name beside the face.
   */
  drawContent()
  {
    // perform original logic to draw the face.
    super.drawContent();

    // also draw the actor name.
    this.drawActorName();
  }

  /**
   * Draws the actor name centered vertically beside the face graphic.
   */
  drawActorName()
  {
    // no actor means nothing to draw.
    if (!this.actor()) return;

    // the text column starts just past the face graphic.
    const textX = this.faceWidth() + 8;
    const textWidth = this.innerWidth - textX;
    const textY = Math.floor((this.innerHeight - this.lineHeight()) / 2);

    // draw the actor name.
    this.drawText(this.actor().name(), textX, textY, textWidth, 'left');
  }
  //endregion draw
}

export default Window_EquipActorRibbon;
//endregion Window_EquipActorRibbon
