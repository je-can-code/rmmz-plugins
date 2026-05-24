//region Window_SdpPoints
/**
 * The SDP window containing the menu actor identity.
 */
class Window_SdpPoints
  extends Window_Base
{
  /**
   * @constructor
   * @param {Rectangle} rect The rectangle that defines this window's shape.
   */
  constructor(rect)
  {
    super(rect);
    this.initialize(rect);
    this.initMembers();
  }

  /**
   * Initializes all members of this window.
   */
  initMembers()
  {
    this._actor = null;
  }

  /**
   * Refreshes this window and all its content.
   */
  refresh()
  {
    this.contents.clear();
    this.drawPoints();
  }

  /**
   * Draws the face + actor name of the menu actor.
   */
  drawPoints()
  {
    this.drawSdpFace();
    this.drawActorName();
  }

  /**
   * Draws the menu actor name (wallet moved to the cart).
   */
  drawActorName()
  {
    // don't draw the points if the actor is unavailable.
    if (!this._actor) return;

    const actorName = this._actor.name();
    const x = 140;
    const y = 0;
    const textWidth = this.innerWidth - x;
    const alignment = 'left';
    this.drawText(actorName, x, y, textWidth, alignment);
  }

  /**
   * A wrapper around the drawing of the actor's face- in case we need logic.
   */
  drawSdpFace()
  {
    // don't draw the points if the actor is unavailable.
    if (!this._actor) return;

    this.drawFace(
      this._actor.faceName(),
      this._actor.faceIndex(),
      0,
      0,
      128,
      40
    );
  }

  /**
   * Sets the actor focus for the SDP points window. Implicit refresh.
   * @param {Game_Actor} actor The actor to display SDP info for.
   */
  setActor(actor)
  {
    this._actor = actor;
    this.refresh();
  }
}

export default Window_SdpPoints;
//endregion Window_SdpPoints