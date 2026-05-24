//region Window_Base
import ApTypeKey from './../_models/ApTypeKey.js';
/**
 * Draws a compact typed AP badge (icon + [label]) right-aligned within the left column.
 * @param {ApTypeKey} apTypeKey - The typed key to render.
 * @param {number} x - The row's x coordinate.
 * @param {number} y - The row's y coordinate.
 */
Window_Base.prototype.drawTypedBadge = function(apTypeKey, x, y)
{
  // resolve the display info (name + icon) for this typed key.
  const display = ApManager.apTypeDisplay(apTypeKey);

  // build the badge label.
  const label = `[${display.name}]`;

  // determine the icon width and spacing.
  const iconW = ImageManager.iconWidth;
  const pad = 4;

  // measure the width of the label text.
  const labelW = this.textWidth(label);

  // compute the total badge width (icon + pad + label).
  const badgeTotalW = iconW + pad + labelW;

  // anchor the badge to the right edge of the left column.
  const badgeX = x + badgeTotalW;

  // draw the icon.
  this.drawIcon(display.icon, badgeX, y + 2);

  // draw the label using system color to distinguish it.
  this.changeTextColor(this.systemColor());
  this.drawText(label, badgeX + iconW + pad, y, labelW, 'left');
  this.resetTextColor();
};
//endregion Window_Base