//region Window_ClassParameters
import ClassSceneLayout from '../helpers/ClassSceneLayout.js';
import ClassManager from '../managers/ClassManager.js';

/**
 * The class scene's main window: the same parameters for every class, listed down a single column in the same
 * order, with whatever extensions add listed beneath them. A row never moves as the cursor goes from one class
 * to the next, so two classes compare at a glance.
 *
 * Any other class shows what changing into it would do, compared against the actor as they are: a parameter
 * it would move reads as the equip screen reads a change, and one it would leave alone reads as it stands.
 * The class already worn would change nothing, so every parameter reads as it stands.
 *
 * Each row is a small table: the parameter's name, then its multiplier, its value and its change, each in a
 * column of its own so the numbers line up from row to row. Values are formatted by J-CMS and by each
 * parameter's own definition, so a stat reads the same way here as on the equip screen.
 *
 * Extensions add their own sections beneath the parameters by aliasing {@link #drawAfterParameters}.
 */
class Window_ClassParameters
  extends Window_Base
{
  /**
   * The widest multiplier the multiplier column makes room for.
   * @type {string}
   */
  static MULTIPLIER_COLUMN_SAMPLE = '×0.00';

  /**
   * The widest value the value column makes room for: six digits, as wide as any padded catalog value.
   * @type {string}
   */
  static VALUE_COLUMN_SAMPLE = '000000';

  /**
   * The widest change the change column makes room for.
   * @type {string}
   */
  static CHANGE_COLUMN_SAMPLE = '(+0000)';

  /**
   * The space between one column of a parameter row and the next.
   * @type {number}
   */
  static COLUMN_GAP = 16;

  /**
   * The actor whose parameters are shown.
   * @type {Game_Actor|null}
   */
  _actor = null;

  /**
   * The id of the class being previewed.
   * @type {number}
   */
  _classId = 0;

  /**
   * A copy of the actor as they stand, with nothing equipped: the raw stats every row starts from.
   * @type {Game_Actor|null}
   */
  _baselineActor = null;

  /**
   * A copy of the actor standing in the previewed class with nothing equipped, which every row is compared
   * against- or null for the class the actor already wears, whose rows are shown as they stand.
   * @type {Game_Actor|null}
   */
  _previewActor = null;

  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle to draw the window in.
   */
  constructor(rect)
  {
    super(rect);
  }

  //region accessors
  /**
   * Gets the actor whose parameters are shown.
   * @returns {Game_Actor|null}
   */
  actor()
  {
    return this._actor;
  }

  /**
   * Sets the actor whose parameters are shown.
   * @param {Game_Actor} actor The actor to show.
   */
  setActor(actor)
  {
    this._actor = actor;
  }

  /**
   * Gets the id of the class being previewed.
   * @returns {number}
   */
  classId()
  {
    return this._classId;
  }

  /**
   * Sets the id of the class being previewed.
   * @param {number} classId The id of the class to preview.
   */
  setClassId(classId)
  {
    this._classId = classId;
  }

  /**
   * Gets the copy of the actor as they stand, with nothing equipped.
   * @returns {Game_Actor|null}
   */
  baselineActor()
  {
    return this._baselineActor;
  }

  /**
   * Sets the copy of the actor as they stand, with nothing equipped.
   * @param {Game_Actor} baselineActor The copy every row starts from.
   */
  setBaselineActor(baselineActor)
  {
    this._baselineActor = baselineActor;
  }

  /**
   * Gets the copy of the actor standing in the previewed class.
   * @returns {Game_Actor|null}
   */
  previewActor()
  {
    return this._previewActor;
  }

  /**
   * Sets the copy of the actor standing in the previewed class.
   * @param {Game_Actor|null} previewActor The copy to compare against.
   */
  setPreviewActor(previewActor)
  {
    this._previewActor = previewActor;
  }

  //endregion accessors

  //region showing
  /**
   * Points this window at an actor and one of their classes, and redraws it.
   *
   * Both arrive together because the preview is built from both. Taking them one at a time would build a
   * copy of the actor in the wrong class in between, which is a whole deep copy thrown away for nothing.
   *
   * Every figure shown is raw: the actor with nothing equipped, both as they stand and in the class. The
   * sheet is about what a class makes of the actor, and a class that cannot wear their gear takes it off.
   * @param {Game_Actor} actor The actor whose parameters are shown.
   * @param {number} classId The id of the class being previewed.
   */
  showClass(actor, classId)
  {
    // remember who and what is being shown, for the multipliers read from the actor's starting class.
    this.setActor(actor);
    this.setClassId(classId);

    // the raw stats every row starts from.
    const baselineActor = ClassManager.baselineActor(actor);
    this.setBaselineActor(baselineActor);

    // and the copy every row is measured against, which the class already worn has no need of.
    const previewActor = ClassManager.comparisonActor(actor, classId);
    this.setPreviewActor(previewActor);

    // redraw against the new preview.
    this.refresh();
  }

  //endregion showing

  //region drawing
  /**
   * Implements {@link Window_Base.drawContent}.<br/>
   * Draws the parameters, then whatever an extension lists beneath them.
   */
  drawContent()
  {
    // nothing is shown until the scene points this window at a class.
    if (this.actor() === null) return;

    // the parameters come first; anything an extension adds follows beneath them.
    const afterParameters = this.drawParametersSection(0);
    this.drawAfterParameters(afterParameters);
  }

  /**
   * Draws the parameters as a titled list, one row each, the same parameters in the same order for every class.
   * @param {number} y The y coordinate the section starts at.
   * @returns {number} The y coordinate just below the section.
   */
  drawParametersSection(y)
  {
    this.drawSectionTitle('Parameters', y);
    const rowsY = y + this.lineHeight();

    // the manager decides what is listed; this window only draws it.
    const parameterKeys = ClassManager.listedParameterKeys();

    // one row per parameter, down a single column.
    parameterKeys.forEach((parameterKey, index) =>
    {
      const rowY = rowsY + (index * this.lineHeight());
      this.drawParameterRow(parameterKey, rowY);
    });

    return rowsY + (parameterKeys.length * this.lineHeight());
  }

  /**
   * Draws one parameter as a row of four columns: its icon and name from the left, then its multiplier, its
   * value and its change, each right-aligned in a column of its own so every row's numbers line up.
   * @param {string} parameterKey The registry key of the parameter to draw.
   * @param {number} y The y coordinate of the row.
   */
  drawParameterRow(parameterKey, y)
  {
    const parameter = ParameterCatalogRenderer.makeParameter(this.baselineActor(), parameterKey);

    // the icon at full size, then the rest of the row in the smaller type the catalog's rows wear.
    this.resetFontSettings();
    this.drawIcon(parameter.iconIndex, this.contentLeft(), y);
    this.makeFontSmaller();

    // the columns are measured in the rows' own type, so they are laid out only once it is set.
    const columns = this.parameterColumns();
    this.drawText(parameter.name, columns.nameX, y, columns.nameWidth);

    // the class's multiplier, where it has one.
    const multiplierText = ClassManager.multiplierText(this.actor(), this.classId(), parameterKey);
    this.drawText(multiplierText, columns.multiplierX, y, columns.multiplierWidth, 'right');

    // the value, and what changing would do to it.
    this.drawParameterFigures(parameter, columns, y);
    this.resetFontSettings();
  }

  /**
   * Draws a row's value and change columns: what the value would become and by how much, or the value as it
   * stands when changing classes would leave it alone.
   * @param {CmsParameter} parameter The parameter as the actor has it now, raw.
   * @param {{valueX: number, valueWidth: number, changeX: number, changeWidth: number}} columns Where the
   *   value and change columns sit.
   * @param {number} y The y coordinate of the row.
   */
  drawParameterFigures(parameter, columns, y)
  {
    const { parameterKey } = parameter;

    // a value the change would leave alone stands alone, padded like any catalog value, with no change beside
    // it- the way the equip screen shows a parameter an item leaves alone.
    if (ClassManager.isParameterChanging(this.baselineActor(), this.previewActor(), parameterKey) === false)
    {
      ParameterCatalogRenderer.drawCatalogParameterValue(
        this, columns.valueX, y, columns.valueWidth, parameter, 'right', null);
      return;
    }

    // a value the change would move shows what it would become, padded like every other value, and by how much.
    const { valueText, changeText, colorIndex } =
      ClassManager.parameterChange(this.baselineActor(), this.previewActor(), parameterKey);

    // the value's digits in the color of whether the change is good for the actor, with its leading zeros
    // dimmed the way the catalog dims them.
    this.drawStyledPaddedValue(columns.valueX, y, valueText, columns.valueWidth, 8, colorIndex, 'right');

    // the change beside it, in the same color, as bold as the digits.
    const changeColor = ColorManager.textColor(colorIndex);
    this.changeTextColor(changeColor);
    this.contents.fontBold = true;
    this.drawText(changeText, columns.changeX, y, columns.changeWidth, 'right');
    this.resetTextColor();
    this.resetFontFormatting();
  }

  /**
   * Where each column of a parameter row sits, measured in whatever type is set when this is asked.
   *
   * The three numeric columns are a fixed width each, sized to the widest thing they are made to hold, and
   * stack leftward from the row's right edge. Measuring what is actually in them instead would let the
   * columns shift as the cursor moves between classes, which is the jumble they exist to prevent.
   * @returns {{nameX: number, nameWidth: number, multiplierX: number, multiplierWidth: number, valueX: number,
   *   valueWidth: number, changeX: number, changeWidth: number}}
   */
  parameterColumns()
  {
    const gap = Window_ClassParameters.COLUMN_GAP;
    const changeWidth = this.textWidth(Window_ClassParameters.CHANGE_COLUMN_SAMPLE);
    const valueWidth = this.textWidth(Window_ClassParameters.VALUE_COLUMN_SAMPLE);
    const multiplierWidth = this.textWidth(Window_ClassParameters.MULTIPLIER_COLUMN_SAMPLE);

    // the change sits against the right edge, and each column before it one gap further left.
    const changeX = this.contentRight() - changeWidth;
    const valueX = changeX - gap - valueWidth;
    const multiplierX = valueX - gap - multiplierWidth;

    // the name has everything between its icon and the multiplier.
    const nameX = this.contentLeft() + ImageManager.iconWidth + 4;
    const nameWidth = multiplierX - gap - nameX;

    return {
      nameX,
      nameWidth,
      multiplierX,
      multiplierWidth,
      valueX,
      valueWidth,
      changeX,
      changeWidth,
    };
  }

  /**
   * The x every row starts at: the scene's shared inset, in from the left edge.
   * @returns {number}
   */
  contentLeft()
  {
    return ClassSceneLayout.contentInset(this);
  }

  /**
   * The x every row ends at: the scene's shared inset, in from the right edge.
   * @returns {number}
   */
  contentRight()
  {
    return this.contentsWidth() - ClassSceneLayout.contentInset(this);
  }

  /**
   * Draws whatever an extension lists beneath the parameters, and returns the y just below it all.
   *
   * J-Classes lists nothing more. An extension aliases this to draw its own sections at `y` and return the
   * y just below them, so any number of extensions stack one after another.
   * @param {number} y The y coordinate just below everything drawn so far.
   * @returns {number} The y coordinate just below everything drawn.
   */
  drawAfterParameters(y)
  {
    return y;
  }

  /**
   * Draws a section's title, in the system color every section title in the menus wears.
   * @param {string} title The section's title.
   * @param {number} y The y coordinate of the title.
   */
  drawSectionTitle(title, y)
  {
    const width = this.contentRight() - this.contentLeft();

    this.resetFontSettings();
    this.changeTextColor(ColorManager.systemColor());
    this.drawText(title, this.contentLeft(), y, width);
    this.resetTextColor();
  }

  /**
   * Draws the line standing in for a section with nothing in it.
   * @param {string} text What the line says.
   * @param {number} y The y coordinate of the line.
   */
  drawEmptySectionRow(text, y)
  {
    const width = this.contentRight() - this.contentLeft();

    // dimmed, since it is an absence rather than a fact.
    this.resetFontSettings();
    this.changeTextColor(ColorManager.textColor(7));
    this.drawText(text, this.contentLeft(), y, width);
    this.resetTextColor();
  }

  /**
   * Overrides {@link Window_Base.lineHeight}.<br/>
   * Spaces rows the way every window beside the class list does.
   * @returns {number}
   */
  lineHeight()
  {
    return ClassSceneLayout.ROW_HEIGHT;
  }

  /**
   * Overrides {@link Window_Base.makeFontSmaller}.<br/>
   * Eases off the reduction step to the one every window beside the class list shares, the way the equip
   * scene's catalog does, since its rows are just as roomy here.
   */
  makeFontSmaller()
  {
    // stop shrinking once the text would stop being comfortable to read.
    if (this.contents.fontSize >= 20)
    {
      this.contents.fontSize -= ClassSceneLayout.ROW_FONT_REDUCTION;
    }
  }

  //endregion drawing
}

export default Window_ClassParameters;
//endregion Window_ClassParameters