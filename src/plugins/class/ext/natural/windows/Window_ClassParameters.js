//region Window_ClassParameters
import ClassGrowthManager from '../managers/ClassGrowthManager.js';

/**
 * Extends {@link Window_ClassParameters#drawAfterParameters}.<br/>
 * Also lists what the highlighted class grants for every level gained while wearing it, beneath whatever came
 * before.
 *
 * This is the part a player can plan around. A growth is earned at level-up and kept forever, so the class an
 * actor levels in decides what they carry into every class after it.
 * @param {number} y The y coordinate just below everything drawn so far.
 * @returns {number} The y coordinate just below everything drawn.
 */
J.CLASS.EXT.NATURAL.Aliased.Window_ClassParameters
  .set('drawAfterParameters', Window_ClassParameters.prototype.drawAfterParameters);
Window_ClassParameters.prototype.drawAfterParameters = function(y)
{
  // perform original logic.
  const afterOriginal = J.CLASS.EXT.NATURAL.Aliased.Window_ClassParameters.get('drawAfterParameters')
    .call(this, y);

  // the growths, read from one preview of the actor in the class.
  const growths = ClassGrowthManager.readGrowths(this.actor(), this.classId());

  // half a line of air between the parameters and the section beneath them.
  const gap = Math.floor(this.lineHeight() / 2);

  return this.drawGrowthSection('Growth per level', growths, afterOriginal + gap);
};

/**
 * Draws the class's growth section: its title, then a row per growth, or a line saying there are none.
 * @param {string} title The section's title.
 * @param {Array<{parameterKey: string, isRate: boolean, amount: number}>} rows The section's rows.
 * @param {number} y The y coordinate the section starts at.
 * @returns {number} The y coordinate just below the section.
 */
Window_ClassParameters.prototype.drawGrowthSection = function(title, rows, y)
{
  // titled the same way as the parameters above it.
  this.drawSectionTitle(title, y);
  const rowsY = y + this.lineHeight();

  // a class contributing nothing here says so, rather than leaving a bare title.
  if (rows.length === 0)
  {
    this.drawEmptySectionRow('Nothing', rowsY);

    return rowsY + this.lineHeight();
  }

  // one row per parameter the class moves.
  rows.forEach((row, index) =>
  {
    const rowY = rowsY + (index * this.lineHeight());
    this.drawGrowthRow(row, rowY);
  });

  return rowsY + (rows.length * this.lineHeight());
};

/**
 * Draws a single contribution the way a parameter row above it reads: the parameter's icon and name, and the
 * amount at the right edge- in line with the parameters' last column- in the same smaller type.
 * @param {{parameterKey: string, isRate: boolean, amount: number}} row The row to draw.
 * @param {number} y The y coordinate of the row.
 */
Window_ClassParameters.prototype.drawGrowthRow = function(row, y)
{
  // the service knows how every parameter presents itself.
  const { iconIndex, label, value } = ClassGrowthManager.describe(row);
  const left = this.contentLeft();
  const right = this.contentRight();
  const nameX = left + ImageManager.iconWidth + 4;

  // the icon at full size, then the text in the rows' smaller type.
  this.resetFontSettings();
  this.drawIcon(iconIndex, left, y);
  this.makeFontSmaller();
  this.drawText(label, nameX, y, right - nameX);
  this.drawText(value, left, y, right - left, Window_Base.TextAlignments.Right);
  this.resetFontSettings();
};
//endregion Window_ClassParameters