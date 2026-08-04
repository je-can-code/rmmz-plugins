//region Window_MenuStatus
/**
 * J-CMS reserves a block at the foot of each party member's menu cell for whatever the plugins
 * layered on top of it have to say. Unspent node points are the clearest thing this plugin can
 * contribute there: they are a currency the player is holding rather than spending, and a currency
 * nobody is reminded of is one nobody spends.
 *
 * The check is for J-CMS itself rather than for the method, because this is the one honestly
 * optional dependency in play- the main menu redesign may simply not be installed, in which case
 * there is no cell to draw into and nothing here should exist.
 */
if (J.CMS)
{
  /**
   * Extends {@link #drawExtensionData}.<br/>
   * Also reports how many node points this actor is holding unspent.
   *
   * Draws beneath whatever the original returned rather than at the y it was handed, so that this
   * plugin claims a row of its own without needing to know whether anything else already claimed
   * one above it.
   * @param {Game_Actor} actor The actor being described.
   * @param {number} x The left edge of the space available.
   * @param {number} y The top of the space available.
   * @param {number} width The width available.
   * @returns {number}
   */
  J.SDP.Aliased.Window_MenuStatus.set('drawExtensionData', Window_MenuStatus.prototype.drawExtensionData);
  Window_MenuStatus.prototype.drawExtensionData = function(actor, x, y, width)
  {
    // perform original logic, which hands back wherever anything before this finished drawing.
    const nextY = J.SDP.Aliased.Window_MenuStatus.get('drawExtensionData')
      .call(this, actor, x, y, width);

    // also report this actor's unspent points.
    this.drawSdpPoints(actor, x, nextY, width);

    // hand back the row beneath the one just claimed.
    return nextY + this.lineHeight();
  };

  /**
   * Draws how many node points this actor has available to spend.
   *
   * Drawn even at zero rather than hidden when empty. A row that appears only sometimes teaches the
   * player nothing about where to look for it, and a standing zero is what makes a later non-zero
   * legible as a change worth acting on.
   * @param {Game_Actor} actor The actor whose points are being reported.
   * @param {number} x The left edge of the row.
   * @param {number} y The top of the row.
   * @param {number} width The width available to the row.
   */
  Window_MenuStatus.prototype.drawSdpPoints = function(actor, x, y, width)
  {
    // the points this actor is holding but has not committed.
    const points = actor.getSdpPoints();

    // lead with the same icon the dedicated points window marks this currency with.
    this.drawIcon(J.SDP.Metadata.sdpIconIndex, x, y);

    // the value sits immediately past its icon, with no word between them. The icon is the label-
    // naming it as well would be saying the same thing twice, and every other measure in this cell
    // has already taught the player that the icon on the left is what the number belongs to.
    const valueX = x + ImageManager.standardIconWidth + 8;
    this.resetTextColor();
    this.drawText(`${points}`, valueX, y, width - (valueX - x), 'left');
  };
}
//endregion Window_MenuStatus