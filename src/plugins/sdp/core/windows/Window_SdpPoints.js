//region Window_SdpPoints
/**
 * The upper-left SDP ribbon: menu actor identity and always-visible wallet balance.
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
   * Refreshes this window and all its content.
   */
  refresh()
  {
    this.contents.clear();
    this.drawPoints();
  }

  /**
   * Draws the face, actor name, and right-aligned SDP wallet for the menu actor.
   */
  drawPoints()
  {
    this.drawSdpFace();
    this.drawActorName();
    this.drawSdpWallet();
  }

  /**
   * Draws the menu actor name beside the face graphic.
   */
  drawActorName()
  {
    // don't draw the name if the actor is unavailable.
    if (!this.actor()) return;

    const nameX = 140;
    const y = this.ribbonTextY();
    const nameMaxWidth = this.sdpWalletAnchorX() - nameX - 8;

    this.drawText(this.actor().name(), nameX, y, nameMaxWidth, 'left');
  }

  /**
   * Draws the actor's SDP balance on the right edge of the ribbon.
   */
  drawSdpWallet()
  {
    // don't draw the wallet if the actor is unavailable.
    if (!this.actor()) return;

    const y = this.ribbonTextY();
    const pad = 12;
    const gap = 8;
    const wallet = this.actor().getSdpPoints();
    const amountW = this.textWidth('00000000');
    const amountX = this.innerWidth - amountW - pad;

    // wallet amount (always normal coloring; leading zeros dim).
    this.drawStyledZeroPaddedNumber(amountX, y, wallet, amountW, 8, 8, 0);

    const iconX = amountX - gap - ImageManager.iconWidth;

    this.drawIcon(J.SDP.Metadata.sdpIconIndex, iconX, y);
  }

  /**
   * Left edge x for the wallet chrome; the name column stops before this point.
   * @returns {number}
   */
  sdpWalletAnchorX()
  {
    const pad = 12;
    const gap = 8;
    const amountW = this.textWidth('00000000');
    const iconW = ImageManager.iconWidth;
    const amountX = this.innerWidth - amountW - pad;

    return amountX - gap - iconW;
  }

  /**
   * Vertically centers single-line ribbon text beside the face graphic.
   * @returns {number}
   */
  ribbonTextY()
  {
    return Math.floor((this.innerHeight - this.lineHeight()) / 2);
  }

  /**
   * A wrapper around the drawing of the actor's face- in case we need logic.
   */
  drawSdpFace()
  {
    // don't draw the points if the actor is unavailable.
    if (!this.actor()) return;

    this.drawFace(
      this.actor().faceName(),
      this.actor().faceIndex(),
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