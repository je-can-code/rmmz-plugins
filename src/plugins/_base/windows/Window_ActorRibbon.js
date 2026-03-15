//region Window_ActorRibbon
/**
 * A window for rendering a ribbon of an actor's face.
 * If the window is made longer or taller, additional info could be rendered around it.
 */
class Window_ActorRibbon
  extends Window_Base
{
  //region init
  /**
   * @constructor
   * @param {Rectangle} rect The rectangle that defines this window's shape.
   */
  constructor(rect)
  {
    // perform original logic.
    super(rect);

    // initialize our custom members.
    this.initMembers();
  }

  /**
   * Initializes all custom members of this window.
   */
  initMembers()
  {
    /**
     * The actor in this window.
     * @type {Game_Actor|null}
     */
    this._actor = null;

    /**
     * The width of the actor face in the ribbon.
     * @type {number}
     */
    this._faceWidth = 128;

    /**
     * The height of the actor face in the ribbon.
     * @type {number}
     */
    this._faceHeight = 40;

    /**
     * The x of the actor's face in the ribbon.
     * @type {number}
     */
    this._faceX = 0;

    /**
     * The y of the actor's face in the ribbon.
     * @type {number}
     */
    this._faceY = 0;
  }

  //endregion init

  //region properties
  //region actor
  /**
   * Gets the actor focus for the window.
   * @returns {Game_Actor|null}
   */
  actor()
  {
    return this._actor;
  }

  /**
   * Sets the actor focus for the window and optionally refreshes.
   * @param {Game_Actor} actor The actor to display.
   * @param {boolean} [andRefresh=true] Whether or not to refresh the window; defaults to true.
   */
  setActor(actor, andRefresh = true)
  {
    // set the actor.
    this._actor = actor;

    // check if a refresh is desired.
    if (andRefresh)
    {
      // refresh the window.
      this.refresh();
    }
  }

  //endregion actor

  // region face size
  /**
   * The width of the actor face in the ribbon.
   * @returns {number}
   */
  faceWidth()
  {
    return this._faceWidth;
  }

  /**
   * The width of the actor face in the ribbon.
   * @returns {number}
   */
  setFaceWidth(width)
  {
    this._faceWidth = width;
  }

  /**
   * The height of the actor face in the ribbon.
   * @returns {number}
   */
  faceHeight()
  {
    return this._faceHeight;
  }

  /**
   * The height of the actor face in the ribbon.
   * @returns {number}
   */
  setFaceHeight(height)
  {
    this._faceHeight = height;
  }

  /**
   * Gets the size of the actor face in the ribbon.
   * @returns {[number, number]}
   */
  faceSize()
  {
    return [ this.faceWidth(), this.faceHeight() ];
  }

  //endregion face size

  //region face coordinates
  /**
   * Gets the x coordinate of the actor face in the ribbon.
   * @returns {number}
   */
  faceX()
  {
    return this._faceX;
  }

  /**
   * Sets the x coordinate of the actor face in the ribbon.
   * @param {number} x The x coordinate.
   */
  setFaceX(x)
  {
    this._faceX = x;
  }

  /**
   * Gets the y coordinate of the actor face in the ribbon.
   * @returns {number}
   */
  faceY()
  {
    return this._faceY;
  }

  /**
   * Sets the y coordinate of the actor face in the ribbon.
   * @param {number} y The y coordinate.
   */
  setFaceY(y)
  {
    this._faceY = y;
  }

  /**
   * Gets the coordinates of the actor face in the ribbon.
   * @returns {[number, number]}
   */
  faceCoordinates()
  {
    return [ this.faceX(), this.faceY() ];
  }

  //endregion face coordinates
  //endregion properties

  //region draw
  /**
   * Implements {@link #drawContent}.<br/>
   * Draws the actor face in the ribbon.
   */
  drawContent()
  {
    // don't draw if the actor is unavailable.
    if (!this._actor) return;

    // draw the actor face.
    this.drawActorRibbon();
  }

  /**
   * Draws the actor face in the ribbon.
   */
  drawActorRibbon()
  {
    // grab the actor.
    const actor = this.actor();

    // grab the coordinates of the face.
    const [ x, y ] = this.faceCoordinates();

    // grab the size of the face.
    const [ w, h ] = this.faceSize();

    // draw the face.
    this.drawFace(actor.faceName(), actor.faceIndex(), x, y, w, h);
  }

  //endregion draw
}

//endregion Window_ActorRibbon