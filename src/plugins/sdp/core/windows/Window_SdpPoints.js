//region Window_SdpPoints
/**
 * The SDP ribbon: menu actor identity and always-visible wallet balance.
 *
 * This is the scene's actor ribbon, so {@link Window_ActorRibbon} supplies the actor tracking and the
 * face. All this adds is what is particular to SDP: the name beside the face, and the wallet balance
 * on the right edge.
 *
 * Note that {@link Window_SdpHeader} is *not* the counterpart to this window despite the name. That one
 * describes the hovered panel, not the actor.
 */
class Window_SdpPoints
  extends Window_ActorRibbon
{
  /**
   * Overrides {@link Window_ActorRibbon.faceWidth}.<br/>
   * Widens the face so the identity block reads as a band rather than a thumbnail.
   * @returns {number}
   */
  faceWidth()
  {
    return 128;
  }

  /**
   * Overrides {@link Window_ActorRibbon.faceHeight}.<br/>
   * Crops the face to a single band of height.
   * @returns {number}
   */
  faceHeight()
  {
    return 40;
  }

  /**
   * Extends {@link Window_ActorRibbon.drawContent}.<br/>
   * Also draws the actor's name and their SDP wallet.
   */
  drawContent()
  {
    // perform original logic, which draws the face.
    super.drawContent();

    // name the actor beside it.
    this.drawActorName();

    // and report what they have to spend.
    this.drawSdpWallet();
  }

  /**
   * Draws the menu actor name beside the face graphic.
   */
  drawActorName()
  {
    // don't draw the name if the actor is unavailable.
    if (!this.actor()) return;

    // start just past the face rather than at a fixed offset that has to agree with it.
    const nameX = this.faceWidth() + 12;
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
    const wallet = this.actor()
      .getSdpPoints();
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
}

export default Window_SdpPoints;
//endregion Window_SdpPoints
