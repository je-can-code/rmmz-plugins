//region Window_Command
import BuiltWindowCommand from './../models/BuiltWindowCommand.js';

//region init
/**
 * A hook for subclasses to seed their own members before the command list is first built.
 *
 * A no-op here; implement it in the subclass and it will be called at the right moment.
 *
 * This exists because {@link Window_Command.initialize} ends by refreshing- which builds the command
 * list, and therefore runs the subclass's `makeCommandList` before the subclass has had any chance to
 * set itself up. Both of the obvious places to seed state are too late:
 *
 * - the constructor body after `super(rect)`, because `super(rect)` is what triggers the refresh.
 * - class field declarations, because JavaScript applies those only after `super()` returns.
 *
 * And a derived constructor cannot touch `this` before calling `super`, so there is no earlier place
 * to put it. The result was a family of crashes that all looked like "cannot read properties of
 * undefined" from inside `makeCommandList`, one per scene, each apparently unrelated to the others.
 *
 * Implementations must confine themselves to assigning fields. This runs before the original logic
 * reaches {@link Window_Base.initialize}, so there is no `contents`, no geometry and no font yet-
 * anything that draws, measures, or refreshes belongs after `super(rect)` in the constructor instead.
 *
 * There is a second, sharper consequence of the same timing, and it applies to `makeCommandList` rather
 * than to this hook: **a command window's list is built before the instance is fully constructed**, so
 * nothing on that path may touch a private member. Private fields and methods are branded onto an
 * instance only once `super()` returns, and until then any `this.#anything` throws:
 *
 *   TypeError: Receiver must be an instance of class anonymous
 *
 * Note that naming a private method is enough- `array.map(this.#build, this)` evaluates the reference
 * before `map` runs, so it throws even when the array is empty. So a `makeCommandList` with nothing to
 * build should return before reaching any private member, which is worth a guard of its own.
 */
Window_Command.prototype.initMembers = function()
{
};

/**
 * Extends {@link Window_Command.initialize}.<br/>
 * Also gives subclasses a chance to seed their members before the command list is built from them.
 */
J.BASE.Aliased.Window_Command.set('initialize', Window_Command.prototype.initialize);
Window_Command.prototype.initialize = function(rect)
{
  // let the subclass set itself up while there is still time to matter.
  this.initMembers();

  // perform original logic, which ends by building the command list.
  J.BASE.Aliased.Window_Command.get('initialize')
    .call(this, rect);
};
//endregion init

/**
 * Gets all commands currently in this list.
 * @returns {BuiltWindowCommand[]}
 */
Window_Command.prototype.commandList = function()
{
  return this._list;
};

/**
 * Checks whether or not there are any commands in this list.
 * @return {boolean}
 */
Window_Command.prototype.hasCommands = function()
{
  return this.commandList().length > 0;
};

/**
 * Command row at {@link index}, or null when out of range (empty list, stale index, pre-refresh).
 *
 * @param {number} index The index driving this step.
 * @returns {object|null}
 */
Window_Command.prototype.commandEntryAt = function(index)
{
  const entry = this.commandList()
    .at(index);

  if (entry === undefined || entry === null)
  {
    return null;
  }

  return entry;
};

/**
 * Get the unmodified line height, which should always be `36`.
 * @returns {36}
 */
Window_Command.prototype.originalLineHeight = function()
{
  return Window_Base.prototype.lineHeight.call(this);
};

/**
 * Handles things that must occur before every command drawn, such as
 * clearing any residual text color assignments and changing the text opacity
 * accordingly to the command's enabled status.
 * @param {number} index The index of the command to predraw for.
 */
Window_Command.prototype.preDrawItem = function(index)
{
  // clear any changes to text color.
  this.resetTextColor();

  // update the text opacity based on whether or not the command is enabled.
  this.changePaintOpacity(this.isCommandEnabled(index));
};

/**
 * Overwrites {@link #drawItem}.<br/>
 * Renders the text along with any additional data that is available to the command.
 */
Window_Command.prototype.drawItem = function(index)
{
  // handles the setup that occurs before each item drawn.
  this.preDrawItem(index);

  // grab the rectangle for the line item.
  const {
    x: rectX,
    y: rectY,
    width: rectWidth
  } = this.itemLineRect(index);

  // build the command name.
  let commandName = this.buildCommandName(index);

  // grab the right text for this command.
  const rightText = this.commandRightText(index);

  // grab the subtext for this command.
  const isSubtext = this.isCommandSubtext(index);
  const subtexts = this.commandSubtext(index);

  // grab the extra lines for this command.
  const extraLines = this.commandLines(index);

  // calculate the x of the command name.
  let commandNameX = rectX + 40;

  // initialize the y of the command name.
  let commandNameY = rectY;

  // determine if we have subtext to draw.
  const hasSubtexts = subtexts.length > 0 && isSubtext;

  // determine if we have multiline text to draw.
  const hasMultilineText = extraLines.length > 0 && !isSubtext;

  // check if we have any subtext.
  if (hasSubtexts)
  {
    // bolden the text if we have subtext to make it stand out.
    commandName = this.boldenText(commandName);

    // move the command name up a bit if we have subtext.
    commandNameY -= this.subtextLineHeight();
  }
  // check if we alternatively have multiline text instead.
  else if (hasMultilineText)
  {
    // move the command name up a bit if we have additional lines.
    commandNameY -= this.multilineLineHeight();
  }

  // destruct the face data.
  const [ faceName, faceIndex ] = this.commandFaceData(index);

  // validate the data is not default non-data.
  const hasFaceData = faceName !== String.empty && (faceIndex > -1 && faceIndex < 8);
  if (hasFaceData)
  {
    const faceY = rectY;
    this.drawFace(
      faceName.substring(faceName.lastIndexOf('/') + 1),
      faceIndex,
      commandNameX - 36,
      faceY - 12,
      ImageManager.faceWidth,
      ImageManager.faceHeight
    );
    commandNameX += 36;
  }

  // identify the icon for this command.
  const commandIcon = this.commandIcon(index);

  // validate we have an icon to draw, and we didn't already render face data.
  if (commandIcon && !hasFaceData)
  {
    // place the icon at the left-most side of the command.
    const iconY = rectY;
    this.drawIcon(commandIcon, commandNameX - 36, iconY);
  }

  // when there is no icon and no face, the visual-leader indent is wasted space.
  // collapse it to a small padding so text starts flush with the window edge.
  if (!commandIcon && !hasFaceData) commandNameX = rectX + 4;

  // render the command name.
  this.drawTextEx(commandName, commandNameX, commandNameY, rectWidth);

  // check if the right text exists.
  if (rightText)
  {
    // determine the text width so we can properly align it.
    const textWidth = this.textWidth(rightText);

    // determine the x coordinate for the right text.
    const rightTextX = rectWidth - this.textWidth(rightText);

    // initialize the y of the right text.
    let rightTextY = rectY;

    // check if we have subtexts to move the right text up.
    if (hasSubtexts)
    {
      // bolden the text if we have subtext to make it stand out.
      this.toggleBold(true);

      // move the command name up a bit if we have subtext.
      rightTextY -= this.subtextLineHeight();
    }

    // execute the color change for right text.
    this.processColorChange(this.commandRightColorIndex(index));

    // render the right-aligned text.
    this.drawText(rightText, rightTextX, rightTextY, textWidth, 'right');

    // bolden the text if we have subtext to make it stand out.
    this.toggleBold(false);
  }

  // check if we have any subtext available.
  if (hasSubtexts)
  {
    // iterate over each of the subtexts.
    subtexts.forEach((subtext, subtextIndex) =>
    {
      // the real index starts 1 line past the command name itself.
      const realSubtextIndex = (subtextIndex + 0);

      // calculate the x coordinate for all subtext.
      const subtextX = rectX + 32;

      // calculate the new y coordinate for the line.
      const subtextY = rectY + (realSubtextIndex * this.subtextLineHeight()) + 2;

      // italicize the subtext line.
      const italicsSubtext = this.italicizeText(subtext);

      // reduce font size for subtext just a bit.
      const sizedSubtext = this.modFontSizeForText(-4, italicsSubtext);

      // render the subtext line.
      this.drawTextEx(sizedSubtext, subtextX, subtextY, rectWidth);
    }, this);
  }
  else if (hasMultilineText)
  {
    // calculate the x coordinate for all subtext.
    // align with the command name: skip visual-leader indent when no icon or face is present.
    let extraLineX = (!commandIcon && !hasFaceData) ? rectX + 4 : rectX + 32;

    // if there was face data rendered, then move this over some.
    if (hasFaceData)
    {
      extraLineX += 44;
    }

    // iterate over each of the subtexts.
    extraLines.forEach((extraLine, extraLineIndex) =>
    {
      // TODO: is this needed?
      const actualIndex = extraLineIndex + 0;

      // calculate the new y coordinate for the line.
      const extraLineY = rectY + (actualIndex * this.multilineLineHeight()) + 2;

      // render the subtext line.
      this.drawTextEx(extraLine, extraLineX, extraLineY, rectWidth);
    }, this);
  }
};

/**
 * Builds the name of the command at the given index.
 * @param {number} index The index to build a name for.
 * @returns {string} The built name.
 */
Window_Command.prototype.buildCommandName = function(index)
{
  // initialize the command name to the default based on index.
  let commandName = `${this.commandName(index)}`;

  // prepend the color for the command if applicable.
  commandName = this.handleColor(commandName, index);

  // return what we have.
  return commandName;
};

/**
 * Gets the subtext for the command at the given index.
 * @param {number} index The index to get subtext for.
 * @returns {string[]} The subtext if available, an empty array otherwise.
 */
Window_Command.prototype.commandSubtext = function(index)
{
  const command = this.commandEntryAt(index);

  if (command === null)
  {
    return [];
  }

  return command.subText ?? [];
};

/**
 * Gets the subtext for the command at the given index.
 * @param {number} index The index to get subtext for.
 * @returns {string[]} The lines if available, an empty array otherwise.
 */
Window_Command.prototype.commandLines = function(index)
{
  const command = this.commandEntryAt(index);

  if (command === null)
  {
    return [];
  }

  return command.lines ?? [];
};

Window_Command.prototype.isCommandSubtext = function(index)
{
  const command = this.commandEntryAt(index);

  if (command === null)
  {
    return true;
  }

  return command.isSubtext ?? true;
};

/**
 * The line height explicitly used for subtext.
 * @returns {number}
 */
Window_Command.prototype.subtextLineHeight = function()
{
  return 20;
};

/**
 * The line height explicitly used for multiline commands.
 * @returns {number}
 */
Window_Command.prototype.multilineLineHeight = function()
{
  return 16;
};

/**
 * Gets the right-aligned text for this command.
 * @param {number} index The index to get the right-text for.
 * @returns {string}
 */
Window_Command.prototype.commandRightText = function(index)
{
  const command = this.commandEntryAt(index);

  if (command === null)
  {
    return String.empty;
  }

  return command.rightText;
};

/**
 * Gets the right-aligned text color index for this command.
 * @param {number} index The index to get the right-color-index for.
 * @returns {number}
 */
Window_Command.prototype.commandRightColorIndex = function(index)
{
  const command = this.commandEntryAt(index);

  if (command === null)
  {
    return 0;
  }

  return command.rightColor;
};

/**
 * Gets the help text for the command at the given index.
 * @param {number} index The index to get the help text for.
 * @returns {string}
 */
Window_Command.prototype.commandHelpText = function(index)
{
  const command = this.commandEntryAt(index);

  if (command === null)
  {
    return String.empty;
  }

  return command.helpText;
};

/**
 * Gets the help text for the current command.
 * @returns {string}
 */
Window_Command.prototype.currentHelpText = function()
{
  return this.commandHelpText(this.index()) ?? String.empty;
};

/**
 * Overwrites {@link #updateHelp}.<br/>
 * Describes the highlighted command in the attached help window.
 *
 * Commands already carry their own help text, and the engine already tells a window when to refresh
 * its help- but the default implementation only ever clears, so every window wanting the two joined
 * up had to say so itself. Doing it here means attaching a help window is the whole of the work.
 *
 * Commands without help text resolve to an empty string, which reads identically to the clear this
 * replaces, so windows that never set any behave exactly as they did before.
 */
Window_Command.prototype.updateHelp = function()
{
  // nothing to describe into if this window was never given a help window.
  if (!this.helpWindow()) return;

  // describe whatever is currently highlighted.
  this.helpWindow()
    .setText(this.currentHelpText());
};

/**
 * Wraps the command in color if a color index is provided.
 * @param {string} command The comman as raw text.
 * @param {number} index The index of this command in the window.
 * @returns {string}
 */
Window_Command.prototype.handleColor = function(command, index)
{
  const commandColor = this.commandColor(index);
  if (commandColor)
  {
    return `\\C[${commandColor}]${command}\\C[0]`;
  }

  return command;
};

/**
 * Retrieves the icon for the given command in the window if it exists.
 * @param {number} index the index of the command.
 * @returns {number} The icon index for the command, or 0 if it doesn't exist.
 */
Window_Command.prototype.commandIcon = function(index)
{
  const command = this.commandEntryAt(index);

  if (command === null)
  {
    return 0;
  }

  return command.icon;
};

/**
 * Retrieves the color for the given command in the window if it exists.
 * @param {number} index the index of the command.
 * @returns {number} The color index for the command, or 0 if it doesn't exist.
 */
Window_Command.prototype.commandColor = function(index)
{
  const command = this.commandEntryAt(index);

  if (command === null)
  {
    return 0;
  }

  return command.color;
};

Window_Command.prototype.commandFaceData = function(index)
{
  const command = this.commandEntryAt(index);

  if (command === null)
  {
    return [ String.empty, -1 ];
  }

  return command.faceData ?? [ String.empty, -1 ];
};

//region adding commands
/**
 * Overwrites {@link #addCommand}.<br/>
 * Adds additional metadata to a command.
 * @param {string} name The visible name of this command.
 * @param {string} symbol The symbol for this command.
 * @param {boolean=} enabled Whether or not this command is enabled; defaults to true.
 * @param {object=} ext The extra data for this command; defaults to null.
 * @param {number=} icon The icon index for this command; defaults to 0.
 * @param {number=} color The color index for this command; defaults to 0.
 */
Window_Command.prototype.addCommand = function(name, symbol, enabled = true, ext = null, icon = 0, color = 0,)
{
  this.commandList()
    .push({
      name,
      symbol,
      enabled,
      ext,
      icon,
      color
    });
};

/**
 * Adds a pre-built command using the {@link BuiltWindowCommand} implementation.
 * @param {BuiltWindowCommand} command The command to be added.
 */
Window_Command.prototype.addBuiltCommand = function(command)
{
  this.commandList()
    .push(command);
};

/**
 * Identical to {@link #addCommand}, except that this adds the new command to
 * the front of the list. This results in vertical lists having a new item prepended to
 * the top, and in horizontal lists having a new item prepended to the left.
 * @param {string} name The visible name of this command.
 * @param {string} symbol The symbol for this command.
 * @param {boolean=} enabled Whether or not this command is enabled; defaults to true.
 * @param {object=} ext The extra data for this command; defaults to null.
 * @param {number=} icon The icon index for this command; defaults to 0.
 * @param {number=} color The color index for this command; defaults to 0.
 */
Window_Command.prototype.prependCommand = function(name, symbol, enabled = true, ext = null, icon = 0, color = 0,)
{
  this.commandList()
    .unshift({
      name,
      symbol,
      enabled,
      ext,
      icon,
      color
    });
};

/**
 * Adds a pre-built command using the {@link BuiltWindowCommand} implementation to
 * the front of the list. This results in vertical lists having a new item prepended
 * to the top, and in horizontal lists having a new item prepended to the left.
 * @param {BuiltWindowCommand} command The command to be prepended.
 */
Window_Command.prototype.prependBuiltCommand = function(command)
{
  this.commandList()
    .unshift(command);
};
//endregion adding commands
//endregion Window_Command