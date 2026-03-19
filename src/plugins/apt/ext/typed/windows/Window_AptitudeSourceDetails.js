//region Window_AptitudeSourceDetails
/**
 * Extends {@link #drawExtensionData}.<br/>
 * Also draws a small typed badge (icon + label) when the teachable is typed.
 * @param {AptitudeTeachable} teachable - The teachable being rendered.
 * @param {string} sourceKey - The stable key for the source currently displayed.
 * @param {number} x - The row's x coordinate.
 * @param {number} y - The row's y coordinate.
 */
J.APT.EXT.TYPED.Aliased.Window_AptitudeSourceDetails.set(
  'drawExtensionData',
  Window_AptitudeSourceDetails.prototype.drawExtensionData
);
Window_AptitudeSourceDetails.prototype.drawExtensionData = function(teachable, sourceKey, x, y)
{
  // perform original logic.
  J.APT.EXT.TYPED.Aliased.Window_AptitudeSourceDetails.get('drawExtensionData')
    .call(this, teachable, sourceKey, x, y);

  // pull the typed key from the teachable.
  const key = teachable.apTypeKey();

  // if untyped, do nothing.
  if (!key)
  {
    return;
  }

  // render the centralized typed badge.
  const badgeX = x + this.gaugeWidth() - 350;
  this.drawTypedBadge(key, badgeX, y);
};
//endregion Window_AptitudeSourceDetails