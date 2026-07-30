//region Window_AptitudeRibbon
/**
 * The ribbon window for the Aptitude scene.
 */
class Window_AptitudeRibbon
  extends Window_ActorRibbon
{
  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle to draw the ribbon in.
   */
  constructor(rect)
  {
    super(rect);
  }

  //region draw
  /**
   * Draws the actor face in the ribbon.
   */
  drawActorRibbon()
  {
    // perform original logic.
    super.drawActorRibbon();

    // also draw the actor's name.
    this.drawActorName();
  }

  /**
   * Draws the actor's name.
   */
  drawActorName()
  {
    // grab the actor.
    const actor = this.actor();

    // grab the coordinates of the face.
    const [ x, y ] = this.faceCoordinates();

    // grab the size of the face.
    const [ w ] = this.faceSize();

    // identify the name of the actor.
    const name = actor.name();

    // calculate the position.
    const nameX = x + w + 16;
    const nameWidth = this.contents.measureTextWidth(name);

    // draw the name.
    this.drawText(name, nameX, y, nameWidth);
  }

  //endregion draw
}

export default Window_AptitudeRibbon;
//endregion Window_AptitudeRibbon