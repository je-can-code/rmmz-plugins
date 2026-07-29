//region Window_PassiveActorRibbon
/**
 * A ribbon window for the passive viewer that displays the currently viewed actor's
 * face, name, and level. Sits above the state list in the left column so the player
 * always knows whose passives they are looking at.
 */
class Window_PassiveActorRibbon
  extends Window_ActorRibbon
{

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
   * Constructor.
   * @param {Rectangle} rect The rectangle for this window.
   */

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
   * Also draws the actor name and level beside the face.
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

export default Window_PassiveActorRibbon;
//endregion Window_PassiveActorRibbon