/**
 * CMS status window shows six party rows at once.
 * @returns {number}
 */
Window_MenuStatus.prototype.numVisibleRows = function()
{
  return 6;
};

/**
 * Draws a compact actor ribbon: name, level, class, and basic gauges.
 * @param {Game_Actor} actor The actor row being rendered.
 * @param {number} x Left edge of the row content.
 * @param {number} y Top edge of the row content.
 */
Window_MenuStatus.prototype.drawActorSimpleStatus = function(actor, x, y)
{
  const lineHeight = this.lineHeight();
  const x2 = x + 180;
  this.drawActorName(actor, x, y);
  this.drawActorLevel(actor, x, y + lineHeight * 1);
  this.drawActorClass(actor, x2, y);
  this.placeBasicGauges(actor, x2, y + lineHeight);
};