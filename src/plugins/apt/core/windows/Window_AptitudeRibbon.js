//region Window_AptitudeRibbon
/**
 * The ribbon window for the Aptitude scene.
 */
class Window_AptitudeRibbon
  extends Window_ActorRibbon
{
  //region properties
  /**
   * The target to show a hint for when the view is toggled.
   * @type {string}
   */
  _toggleHintTarget = String.empty;

  //endregion properties

  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle to draw the ribbon in.
   */
  constructor(rect)
  {
    super(rect);
  }

  //region accessors
  /**
   * Gets the target to show a hint for when the view is toggled.
   * @returns {string}
   */
  toggleHintTarget()
  {
    return this._toggleHintTarget;
  }

  /**
   * Sets the target to show a hint for when the view is toggled.
   * @param {string} target The target to show a hint for.
   */
  setToggleHintTarget(target)
  {
    // store the target.
    this._toggleHintTarget = target;

    // also refresh the contents.
    this.refresh();
  }

  //endregion accessors

  /**
   * Extends {@link #initMembers}.<br/>
   * Adds the toggle hint target.
   */
  initMembers()
  {
    // initialize the original members.
    super.initMembers();

    // initialize our own members.
    this._toggleHintTarget = String.empty;
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

    // also draw the view-toggle hint if we have a target.
    this.drawHint();
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

  /**
   * Draws the hint for the current view.
   */
  drawHint()
  {
    // also draw the view-toggle hint if we have a target.
    const target = this.toggleHintTarget();

    // build the hint string using your icon indices.
    const hint = `\\I[2450]/\\I[2434]: see ${target}.`;

    // compute the width available to the right of the face.
    const textW = this.contents.measureTextWidth(hint);

    // grab the coordinates and size of the face to anchor our text.
    const [ x, y ] = this.faceCoordinates();
    const [ w, h ] = this.faceSize();

    // compute the starting x for text to the right of the face.
    const textX = x + 64;

    // compute the y such that it sits beneath the name, inside the ribbon.
    const textY = y + h;

    // draw the hint using textEx so icons render correctly.
    this.drawTextEx(hint, textX, textY, textW);
  }

  //endregion draw
}

export default Window_AptitudeRibbon;
//endregion Window_AptitudeRibbon