//region Window_CraftConfirmation
/**
 * A window for choosing how many times to craft a recipe, and confirming the craft.
 *
 * Crafting used to happen the instant a recipe was chosen, which was fine while the recipe named exactly what it
 * would spend. Categorical slots changed that: the player now browses their gelatins and picks one, which feels
 * like shopping right up until something is destroyed. A confirmation guards that.
 *
 * It carries a quantity because a prompt that only asks "are you sure" is a tax - players learn to mash through it
 * within a session, and it stops protecting anything while still costing a keypress forever. Asking something worth
 * answering is what makes it worth reading. It also replaces holding the confirm button to craft repeatedly, which
 * was doing quantity selection invisibly and imprecisely.
 *
 * It floats in the middle of the screen rather than standing in for one of the scene's columns. A prompt borrowing
 * a column's geometry looks like that column failed to draw, and this one interrupts the whole scene rather than
 * belonging to any single part of it.
 *
 * The list holds only the two answers. The count is a readout at the base, not a row: the arrows and the shoulders
 * change it from wherever the cursor is, so making it selectable would mean navigating to a number before being
 * allowed to change it.
 */
class Window_CraftConfirmation
  extends Window_Command
{
  /**
   * How many repetitions the shoulder buttons add or remove at once.
   * @type {number}
   */
  static CoarseStep = 10;

  /**
   * The total vertical space the divider block consumes, split evenly above and below the rule itself.
   *
   * The scene adds exactly this to a four-line window height, so the two answer rows, the divider, the quantity
   * line and the legend land inside the contents with nothing left over and nothing clipped.
   * @type {number}
   */
  static DividerGap = 12;

  /**
   * @constructor
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    // perform original logic, which seeds this window's members via initMembers and then builds the command list.
    super(rect);

    // a prompt floating over a populated scene has to be opaque to be readable. this cannot move into initMembers,
    // because contents and contentsBack do not exist until the parent has initialized.
    this.opacity = 255;
    this.contentsBack.opacity = 255;
    this.contents.opacity = 255;
  }

  /**
   * Overwrites {@link Window_Base.updateBackOpacity}.<br/>
   * Keeps the backdrop solid rather than letting the scene behind it show through.
   */
  updateBackOpacity()
  {
    this.backOpacity = 255;
  }

  /**
   * Implements {@link Window_Command.initMembers}.<br/>
   * Initializes the members of this window.
   *
   * These cannot be class field declarations: JavaScript applies those only after `super()` returns, by which point
   * the command list has already been built from them and found them undefined.
   */
  initMembers()
  {
    /**
     * How many times the player has asked to craft.
     * @type {number}
     */
    this._count = 1;

    /**
     * The most repetitions the party's stock allows.
     * @type {number}
     */
    this._maximum = 1;

    /**
     * What a single craft will take from the party, one line per distinct entry.
     * @type {RecipeSpendLine[]}
     */
    this._spendLines = [];
  }

  /**
   * Gets what a single craft will take from the party.
   * @returns {RecipeSpendLine[]}
   */
  spendLines()
  {
    return this._spendLines;
  }

  /**
   * Sets the bill this prompt is asking about, and reshapes the window around it.
   *
   * The height cannot be settled when the scene builds this window, because it depends on how many distinct entries
   * the chosen recipe spends. A prompt sized for the worst case would sit half-empty for every ordinary recipe.
   * @param {RecipeSpendLine[]} spendLines What one craft takes, one line per distinct entry.
   */
  setSpendLines(spendLines)
  {
    this._spendLines = spendLines;

    this.fitToContents();
  }

  /**
   * Shrinks or grows this window to exactly the block it draws, and re-centers it.
   *
   * `Window.move` reshapes the frame but leaves the contents bitmap at its old size, so anything drawn into newly
   * gained space would simply not appear. Recreating the contents is what makes the extra room real.
   */
  fitToContents()
  {
    const height = this.requiredHeight();
    const y = Math.floor((Graphics.boxHeight - height) / 2);

    this.move(this.x, y, this.width, height);
    this.createContents();
    this.refresh();
  }

  /**
   * The exact height the two answers, the divider and the readout occupy together.
   *
   * The answers are measured as selectable rows and the readout as lines of text, because those are genuinely
   * different heights - a selectable row is eight pixels taller than the line it contains.
   * @returns {number}
   */
  requiredHeight()
  {
    const answers = this.itemHeight() * 2;

    // the quantity line, plus one line per thing being spent. the controls are taught by a legend of its own
    // beneath this window rather than by a line inside it.
    const readout = this.lineHeight() * (this.spendLines().length + 1);

    return answers + Window_CraftConfirmation.DividerGap + readout + this.padding * 2;
  }

  /**
   * Gets how many times the player has asked to craft.
   * @returns {number}
   */
  count()
  {
    return this._count;
  }

  /**
   * Sets how many times to craft, clamped to what the stock allows.
   * @param {number} count The requested repetitions.
   */
  setCount(count)
  {
    this._count = count.clamp(1, this.maximum());
    this.refresh();
  }

  /**
   * Gets the most repetitions the party's stock allows.
   * @returns {number}
   */
  maximum()
  {
    return this._maximum;
  }

  /**
   * Sets the ceiling and starts the count back at one.
   *
   * Always one, never the maximum: a mistimed confirm should cost a single craft rather than the entire stock.
   *
   * The ceiling arrives at one or better and is taken at face value. Both routes into this window gate on
   * `canCraft`, and the categorical route additionally passes through the selection window, which refuses to enable
   * an entry the player holds fewer of than the slot spends - counting what earlier slots already claimed, so two
   * slots reaching for the same entry cannot both be satisfied by one stack. A zero arriving here would mean one of
   * those gates has stopped working, and clamping it away would hide that behind a window offering a craft the
   * party cannot pay for.
   * @param {number} maximum The most repetitions the stock allows; at least one.
   */
  setMaximum(maximum)
  {
    this._maximum = maximum;

    // through the setter rather than the field, so the clamp against the ceiling just set still applies.
    this.setCount(1);
  }

  /**
   * Moves the count by some amount.
   *
   * The sound is tied to real movement rather than to the keypress. Held against either end of the range the count
   * stops changing, and a cursor blip per frame for a number that is standing still reads as the window being stuck.
   * @param {number} delta How much to add to the current count; negative removes.
   */
  adjustCount(delta)
  {
    const before = this.count();

    this.setCount(before + delta);

    // silence when the clamp swallowed the whole adjustment.
    if (this.count() !== before) SoundManager.playCursor();
  }

  /**
   * Implements {@link Window_Command.makeCommandList}.<br/>
   * Builds the two answers to the question.
   */
  makeCommandList()
  {
    this.addBuiltCommand(this.buildConfirmCommand());
    this.addBuiltCommand(this.buildCancelCommand());
  }

  /**
   * Builds the answer that performs the craft.
   *
   * The count rides in the label because this is the thing the player is agreeing to, and it should say what it
   * will do without their eyes having to leave the cursor.
   *
   * The ceiling rides alongside it rather than over the list below, where a figure counting crafts would have sat
   * on a heading about ingredients and invited the reader to think it counted those instead.
   * @returns {BuiltWindowCommand}
   */
  buildConfirmCommand()
  {
    const label = this.count() === 1
      ? 'Craft it'
      : `Craft all ${this.count()}`;

    return new WindowCommandBuilder(label)
      .setSymbol('craft-confirm')
      .setIconIndex(91)
      .setRightText(`${this.count()} / ${this.maximum()}`)
      .build();
  }

  /**
   * Builds the answer that abandons the craft.
   * @returns {BuiltWindowCommand}
   */
  buildCancelCommand()
  {
    return new WindowCommandBuilder('Never mind')
      .setSymbol('craft-cancel')
      .setIconIndex(90)
      .build();
  }

  /**
   * Overwrites {@link Window_Scrollable.paint}.<br/>
   * Paints the answers, then the readout beneath them.
   *
   * Vanilla paints only the item rows, so the readout would never appear without this. The guard on contents is the
   * engine's own: a window can be asked to paint before its bitmap exists.
   */
  paint()
  {
    if (!this.contents)
    {
      return;
    }

    this.contents.clear();

    if (this.contentsBack)
    {
      this.contentsBack.clear();
    }

    this.drawAllItems();
    this.drawQuantityReadout();
  }

  /**
   * Draws the divider and the quantity block that sit below the two answers.
   *
   * Must stay in sync with the height the scene reserves in `getCraftConfirmationRectangle` - two answer rows, this
   * gap, and the two lines drawn here.
   */
  drawQuantityReadout()
  {
    const padX = this.itemPadding();
    const width = this.innerWidth - padX * 2;

    // the gap is split evenly around the rule.
    const halfGap = Window_CraftConfirmation.DividerGap / 2;

    // measured in rows rather than in lines. a selectable row is `lineHeight` plus eight, so positioning this block
    // off `lineHeight` would put the rule eight pixels into the second answer for every row above it - the divider
    // would be drawn straight through "Never mind" rather than beneath it.
    const dividerY = this.itemHeight() * 2 + halfGap;

    this.drawHorizontalLine(padX, dividerY, width);

    this.resetFontSettings();

    const amountY = dividerY + halfGap;

    // a heading for the list beneath it rather than a field with a value. the count it used to carry sits on the
    // answer instead, where it belongs to the thing being agreed to.
    this.changeTextColor(ColorManager.systemColor());
    this.drawText('Ingredients used', padX, amountY, width, 'left');
    this.resetTextColor();

    this.drawSpending(padX, amountY + this.lineHeight(), width);

    this.resetFontSettings();
  }

  /**
   * Draws what the batch will actually cost, one indented line per distinct entry.
   *
   * Indented beneath the quantity because that is what these are: the quantity, itemized. Every figure is the
   * per-craft cost multiplied by the current count, so ramping the count shows the real bill moving rather than
   * leaving the player to do the arithmetic on the thing they are about to spend.
   * @param {number} padX The left inset shared with the rest of the readout.
   * @param {number} startY The first line's vertical position.
   * @param {number} width The drawable width available.
   */
  drawSpending(padX, startY, width)
  {
    const iconIndent = 24;
    const nameIndent = iconIndent + ImageManager.iconWidth + 4;
    let y = startY;

    this.spendLines()
      .forEach(line =>
      {
        this.drawIcon(line.iconIndex, padX + iconIndent, y + 2);
        this.drawText(line.name, padX + nameIndent, y, width - nameIndent, 'left');

        const owed = line.perCraft * this.count();

        // red the instant the bill exceeds the shelf. the ceiling should make this unreachable, so it reads as a
        // fault being reported rather than as an ordinary state the player is expected to correct.
        const colorIndex = (owed > line.held)
          ? 18
          : 24;

        this.changeTextColor(ColorManager.textColor(colorIndex));
        this.drawText(`x${owed}`, padX, y, width, 'right');
        this.resetTextColor();

        y += this.lineHeight();
      });
  }

  /**
   * Overwrites {@link Window_Selectable.cursorRight}.<br/>
   * Adds one to the count.
   *
   * Vanilla's implementation moves the cursor between columns and does nothing at all in a single-column list, so
   * the horizontal arrows are free here and this replaces rather than extends it.
   * @param {boolean} _wrap Whether vanilla would have wrapped around the ends; unused.
   */
  cursorRight(_wrap)
  {
    this.adjustCount(1);
  }

  /**
   * Overwrites {@link Window_Selectable.cursorLeft}.<br/>
   * Removes one from the count.
   * @param {boolean} _wrap Whether vanilla would have wrapped around the ends; unused.
   */
  cursorLeft(_wrap)
  {
    this.adjustCount(-1);
  }

  /**
   * Overwrites {@link Window_Selectable.cursorPagedown}.<br/>
   * Adds the coarse step to the count, bound to R1.
   *
   * Vanilla scrolls a page, which a list of two answers can never do. Note that the engine routes the shoulders
   * through `Input.isTriggered` rather than `isRepeated`, so these are discrete presses while the arrows repeat.
   */
  cursorPagedown()
  {
    this.adjustCount(Window_CraftConfirmation.CoarseStep);
  }

  /**
   * Overwrites {@link Window_Selectable.cursorPageup}.<br/>
   * Removes the coarse step from the count, bound to L1.
   *
   * The clamp floors this at one rather than at zero, so a player mashing L1 to get back to a single craft lands on
   * one and stays there instead of falling through into an amount that would craft nothing.
   */
  cursorPageup()
  {
    this.adjustCount(-Window_CraftConfirmation.CoarseStep);
  }
}

export default Window_CraftConfirmation;
//endregion Window_CraftConfirmation