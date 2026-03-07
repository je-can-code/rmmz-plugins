/* eslint-disable max-len */

//region Window_JabsRemapActions
/**
 * The list window that shows logical actions and current bindings.
 * Refactored to extend {@link Window_Command} with builder-style organization
 * and namespaced state under {@link this._j._abs._input}.
 */
class Window_JabsRemapActions
  extends Window_Command
{
  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle to draw this window within.
   */
  constructor(rect)
  {
    // perform super initialize.
    super(rect);

    // initialize the root-namespace definition members.
    this.initCoreMembers();

    // initialize the window-local members.
    this.initPrimaryMembers();

    // align selection to the first actionable entry by default.
    this.select(this.firstActionIndex());
  }

  //region init
  /**
   * Initializes the shared root namespace for this plugin branch.
   */
  initCoreMembers()
  {
    /**
     * The shared root namespace for all of J's plugin data.
     */
    this._j ||= {};

    /**
     * A grouping of all properties associated with JABS.
     */
    this._j._abs ||= {};

    /**
     * A grouping of all properties associated with JABS input.
     */
    this._j._abs._input ||= {};

    /**
     * A grouping for this window within the input branch.
     */
    this._j._abs._input._actions ||= {};
  }

  /**
   * Initializes the state and view members for this window.
   */
  initPrimaryMembers()
  {
    /**
     * Window-local state bag.
     */
    this._j._abs._input._actions._state = {
      // The JABS mapping to display (owned/managed by the scene).
      _mapping: {},

      // The external mapping for rows built via buildExternalActionCommand().
      _externalMapping: {},

      // The authoritative, ordered list of JABS logical action keys to display.
      _buttons: [],
    };

    /**
     * Window-local view bag.
     */
    this._j._abs._input._actions._view = {
      // The help window bound to this command window.
      _helpWindow: null,
    };

    // Pre-build the static button list if not already present.
    if (this.getButtons().length === 0)
    {
      // Set the authoritative buttons list for this window.
      this.setButtons(this.buildButtonList());
    }
  }

  //endregion init

  //region accessors
  /**
   * Gets the current mapping being displayed.
   * @returns {Object<string, string[]>}
   */
  getMapping()
  {
    // read from the lazily-initialized state bag.
    return this._state()._mapping || {};
  }

  /**
   * Sets the mapping to display and refreshes.
   * @param {Object<string, string[]>} mapping The mapping to show and edit.
   */
  setMapping(mapping)
  {
    // store the mapping reference (scene owns lifecycle of the object).
    this._state()._mapping = mapping || {};

    // refresh the contents to draw the values.
    this.refresh();
  }

  /**
   * Gets the current external mapping reference owned by the scene.
   * The shape is: { [`${ns}:${key}`]: string[] }
   * @returns {Object<string, string[]>}
   */
  getExternalMapping()
  {
    // Read from the lazily-initialized state bag.
    return this._state()._externalMapping || {};
  }

  /**
   * Sets the external mapping reference for external action rows.
   * The scene should maintain and update this object; the window only reads it.
   * @param {Object<string, string[]>} externalMapping The external mapping.
   */
  setExternalMapping(externalMapping)
  {
    // Store the reference (scene owns lifecycle and updates).
    this._state()._externalMapping = externalMapping || {};

    // Refresh the contents to draw the values.
    this.refresh();
  }

  /**
   * Gets the ordered list of logical action keys.
   * @returns {string[]}
   */
  getButtons()
  {
    // obtain the window state bag.
    const state = this._state();

    // if we already have an authoritative list, use it.
    if (state._buttons && state._buttons.length > 0)
    {
      return state._buttons;
    }

    // otherwise, fall back to the canonical assignable list without mutating state.
    return this.buildButtonList();
  }

  /**
   * Sets the ordered list of logical action keys.
   * @param {string[]} buttons The ordered list of buttons.
   */
  setButtons(buttons)
  {
    // store a defensive copy of the ordered button list.
    this._state()._buttons = Array.isArray(buttons)
      ? buttons.slice(0)
      : [];

    // rebuild the command list to reflect the new set of rows.
    this.refresh();
  }

  /**
   * Gets the currently bound help window.
   * @returns {Window_Help|null}
   */
  getHelpWindow()
  {
    // return the tracked help window instance.
    return this._view()._helpWindow;
  }

  /**
   * Sets the help window and forwards to the base implementation for linkage.
   * @param {Window_Help} helpWindow The help window to bind.
   */
  setHelpWindow(helpWindow)
  {
    // store a local reference for access via getter.
    this._view()._helpWindow = helpWindow;

    // also perform the default linkage.
    super.setHelpWindow(helpWindow);
  }

  /**
   * Returns the current logical button at the cursor (or section label for headers).
   * @returns {string}
   */
  currentButton()
  {
    // read the current command.
    const cmd = this.currentData();

    // if there is no command, return empty.
    if (!cmd) return String.empty;

    // if this is a header, return its label.
    if (cmd.ext && cmd.ext.kind === 'header')
    {
      return String(cmd.ext.label || String.empty);
    }

    // if this is an external action, return its display label (for prompt/help).
    if (cmd.ext && cmd.ext.kind === 'ext-action')
    {
      return String(cmd.ext.label || String.empty);
    }

    // otherwise return the logical action key.
    return String(cmd.symbol || String.empty);
  }

  /**
   * Lazily ensures the root namespace exists.
   */
  _root()
  {
    // ensure root namespaces.
    this._j ||= {};
    this._j._abs ||= {};
    this._j._abs._input ||= {};
    this._j._abs._input._actions ||= {};
  }

  /**
   * Lazily ensures and returns the window-local state bag.
   * @returns {{_mapping:Object<string,string[]>, _externalMapping:Object<string, string[]> , _buttons:string[]}}
   */
  _state()
  {
    // Ensure root namespaces.
    this._root();

    // Ensure and return the state bag with all tracked properties.
    const actions = this._j._abs._input._actions;
    actions._state ||= {
      _mapping: {},
      _externalMapping: {},
      _buttons: [],
    };
    return actions._state;
  }

  /**
   * Lazily ensures and returns the window-local view bag.
   * @returns {{_helpWindow:Window_Help|null}}
   */
  _view()
  {
    // ensure root namespaces.
    this._root();

    // ensure and return the view bag.
    const actions = this._j._abs._input._actions;
    actions._view ||= { _helpWindow: null };
    return actions._view;
  }

  //endregion accessors

  //region builders
  /**
   * Builds the ordered list of logical actions to show.
   * @returns {string[]}
   */
  buildButtonList()
  {
    // build from the canonical list of assignable inputs provided by JABS_Button.
    const list = JABS_Button.assignableInputs();

    // return as-is (the provided list is authoritative and de-duplicated).
    return list;
  }

  /**
   * Implements {@link Window_Command.prototype.makeCommandList}.<br>
   * Creates all commands (headers + actions) for this window.
   */
  makeCommandList()
  {
    // build all the commands for the window; this does not require pre-initialized state.
    const commands = this.buildCommands();

    // add all built commands to the list.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds all commands for this command window (headers + actions).
   * Composed from small group builders to encourage extension.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    // reference the assignable set for quick membership checks; falls back if not stored yet.
    const can = new Set(this.getButtons());

    // compile the rows in order using composition.
    const rows = [];

    // allow extensions to prepend entire sections before the built-ins.
    this.buildPreExtensionGroups(rows, can);

    // build primary group.
    this.buildPrimaryGroupRows(rows, can);

    // build secondary group.
    this.buildSecondaryGroupRows(rows, can);

    // build functional group.
    this.buildFunctionalGroupRows(rows, can);

    // allow extensions to append entire sections after the built-ins.
    this.buildPostExtensionGroups(rows, can);

    // return the compiled list of commands.
    return rows;
  }

  /**
   * Adds an action command row if the logical button is assignable in this context.
   * @param {BuiltWindowCommand[]} rows The rows being built.
   * @param {Set<string>} can The set of assignable logical action keys.
   * @param {string} button The logical button to conditionally add.
   */
  _addIf(rows, can, button)
  {
    // only add if the action is assignable in this context.
    if (can.has(button))
    {
      // build and push the action command row.
      rows.push(this.buildActionCommand(button));
    }
  }

  /**
   * Allows plugins to prepend custom sections before the built-in groups.
   * Default: no-op. Alias to insert rows.
   * @param {BuiltWindowCommand[]} rows The rows being built.
   * @param {Set<string>} can The set of assignable logical action keys.
   */
  // eslint-disable-next-line no-unused-vars
  buildPreExtensionGroups(rows, can)
  {
  }

  /**
   * Builds the Primary Actions section and its rows.
   * @param {BuiltWindowCommand[]} rows The rows being built.
   * @param {Set<string>} can The set of assignable logical action keys.
   */
  buildPrimaryGroupRows(rows, can)
  {
    // add a header for the primary actions.
    rows.push(this.buildHeaderCommand('Primary Actions'));

    // add primary logical actions if assignable.
    this._addIf(rows, can, JABS_Button.Mainhand);
    this._addIf(rows, can, JABS_Button.Offhand);
    this._addIf(rows, can, JABS_Button.Tool);
    this._addIf(rows, can, JABS_Button.Sprint);
  }

  /**
   * Builds the Secondary Actions section and its rows.
   * @param {BuiltWindowCommand[]} rows The rows being built.
   * @param {Set<string>} can The set of assignable logical action keys.
   */
  buildSecondaryGroupRows(rows, can)
  {
    // add a header for the secondary actions.
    rows.push(this.buildHeaderCommand('Secondary Actions'));

    // add secondary logical actions if assignable.
    this._addIf(rows, can, JABS_Button.SkillTrigger);
    this._addIf(rows, can, JABS_Button.Rotate);
    this._addIf(rows, can, JABS_Button.Strafe);
    this._addIf(rows, can, JABS_Button.Dodge);
  }

  /**
   * Builds the Functional Actions section and its rows.
   * @param {BuiltWindowCommand[]} rows The rows being built.
   * @param {Set<string>} can The set of assignable logical action keys.
   */
  buildFunctionalGroupRows(rows, can)
  {
    // add a header for the functional actions.
    rows.push(this.buildHeaderCommand('Functional Actions'));

    // add functional logical actions if assignable.
    this._addIf(rows, can, JABS_Button.Menu);
    this._addIf(rows, can, JABS_Button.Select);
  }

  /**
   * Allows plugins to append custom sections after the built-in groups.
   * Default: no-op. Override/alias to insert rows.
   * @param {BuiltWindowCommand[]} rows The rows being built.
   * @param {Set<string>} can The set of assignable logical action keys.
   */
  // eslint-disable-next-line no-unused-vars
  buildPostExtensionGroups(rows, can)
  {
    // default: intentionally empty for extensions to override.
  }

  /**
   * Builds a header command that is non-interactive.
   * @param {string} label The header label to display.
   * @returns {BuiltWindowCommand}
   */
  buildHeaderCommand(label)
  {
    // build a disabled command that represents a section header.
    return new WindowCommandBuilder(label)
      .setSymbol(`__header__${label}`)
      .setExtensionData({
        kind: 'header',
        label
      })
      .setEnabled(false)
      .build();
  }

  /**
   * Builds an actionable command for a logical action button.
   * @param {string} button The logical action key.
   * @returns {BuiltWindowCommand}
   */
  buildActionCommand(button)
  {
    // build an enabled command that represents a remappable action.
    return new WindowCommandBuilder(this.humanizeButton(button))
      .setSymbol(button)
      .setExtensionData({
        kind: 'action',
        button
      })
      .setEnabled(true)
      .build();
  }

  /**
   * Builds an actionable command for an external namespace logical action.
   * The window will read/write these directly via the Input registry.
   * @param {string} ns The namespace (ex: "J.MAP").
   * @param {string} key The logical key within that namespace.
   * @param {string} label The row label to display.
   * @param {number} [iconIndex=0] Optional fixed left-side icon index for this action.
   * @returns {BuiltWindowCommand}
   */
  buildExternalActionCommand(ns, key, label, iconIndex)
  {
    // build an enabled command that carries external namespace metadata.
    return new WindowCommandBuilder(label)
      .setSymbol(`__ext__${ns}:${key}`)
      .setExtensionData({
        kind: 'ext-action',
        ns: ns,
        key: key,
        label: label,
        // an optional fixed per-action icon for the left glyph; 0 means none provided.
        icon: Number(iconIndex) || 0,
      })
      .setEnabled(true)
      .build();
  }

  //endregion builders

  //region drawing
  /**
   * Draws a single item.
   * @param {number} index The index to draw.
   */
  drawItem(index)
  {
    // get the rectangle for this line.
    const rect = this.itemRectWithPadding(index);

    // resolve the command to draw.
    const cmd = this._list[index];

    // if no command found, do nothing.
    if (!cmd)
    {
      return;
    }

    // if this is a header row, draw it and exit.
    if (cmd.ext && cmd.ext.kind === 'header')
    {
      this._drawHeaderItem(rect, cmd);
      return;
    }

    // if this is an external registry-backed action, draw that and exit.
    if (cmd.ext && cmd.ext.kind === 'ext-action')
    {
      this._drawExternalActionItem(rect, cmd);
      return;
    }

    // otherwise render the standard JABS logical action row.
    this._drawJabsActionItem(rect, cmd);
  }

  /**
   * Draws a header row centered with system color styling.
   * @param {Rectangle} rect The row rectangle.
   * @param {{name:string, ext:object}} cmd The command data for this row.
   */
  _drawHeaderItem(rect, cmd)
  {
    // resolve a friendly header label.
    const name = cmd.name || String.empty;

    // apply system color and bold before drawing.
    this.changeTextColor(ColorManager.systemColor());
    this.contents.fontBold = true;

    // draw the header centered across the full row.
    this.drawText(name, rect.x, rect.y, rect.width, 'center');

    // reset text styling after drawing.
    this.resetTextColor();
    this.contents.fontBold = false;
  }

  /**
   * Draws an external registry-backed action row.
   * @param {Rectangle} rect The row rectangle.
   * @param {{ name:string, symbol:string, ext:object }} cmd The command for this row.
   */
  _drawExternalActionItem(rect, cmd)
  {
    // read the display label for this external action.
    const displayLabel = String(cmd.ext.label || "");

    // read the combined mapping from the window (scene-provided view model).
    const combined = this.getMapping();

    // the command symbol is a stable token: "__ext__<ns>:<key>".
    const token = String(cmd.symbol || "");

    // if a staged entry exists in the combined mapping, prefer that list.
    const hasStaged = Object.prototype.hasOwnProperty.call(combined, token);
    const staged = hasStaged ? combined[token] : null;

    // otherwise, fall back to the live registry for this external action.
    const boundList = staged !== null
      ? (Array.isArray(staged) ? staged : [])
      : (Input.getBindings(cmd.ext.ns, cmd.ext.key) || []);

    // extract the primary binding if any.
    const bound = boundList.length > 0
      ? boundList[0]
      : String.empty;

    // prefer a fixed per-action icon if provided; otherwise use the bound symbol’s icon.
    const leftIcon = (cmd.ext.icon && cmd.ext.icon > 0)
      ? cmd.ext.icon
      : this.iconIndexForSymbol(bound);

    // compute vertical placement for the icon and the mid X for two-column layout.
    const iconY = this._iconYForRect(rect);
    const midX = rect.x + Math.floor(rect.width / 2);

    // draw the left column (icon + label).
    this._drawLeftLabelWithOptionalIcon(rect.x, iconY, leftIcon, displayLabel, rect, midX);

    // draw the center arrow.
    this._drawArrowBetweenColumns(rect, midX);

    // draw the right column binding text with icon escapes.
    const rightText = IconManager.jabsIconTextForSymbol(bound);
    this._drawRightBindingText(rect, midX, rightText);
  }

  /**
   * Draws a standard JABS logical action row using the window’s mapping.
   * @param {Rectangle} rect The row rectangle.
   * @param {{symbol:string}} cmd The command data for this row.
   */
  _drawJabsActionItem(rect, cmd)
  {
    // resolve the logical button key from the command.
    const button = String(cmd.symbol);

    // read the displayed mapping from the window state.
    const mapping = this.getMapping();

    // read the binding list for this logical action.
    const boundList = mapping[button] || [];

    // extract the primary binding if present.
    const bound = boundList.length > 0
      ? boundList[0]
      : String.empty;

    // choose a readable label for the logical action.
    const label = this.humanizeButton(button);

    // draw the shared layout for this label/binding.
    this._drawActionBindingRow(rect, label, bound);
  }

  /**
   * Computes a vertically-centered Y for drawing an icon within a row.
   * @param {Rectangle} rect The row rectangle.
   * @returns {number} The Y coordinate for the icon.
   */
  _iconYForRect(rect)
  {
    // read shared icon height from the image manager.
    const ih = ImageManager.iconHeight;

    // compute a vertically-centered y for the icon within the row.
    return rect.y + Math.max(0, Math.floor((this.lineHeight() - ih) / 2));
  }

  /**
   * Draws an optional icon at the left and the provided label next to it.
   * @param {number} leftX The left column start X.
   * @param {number} iconY The Y where an icon would be drawn.
   * @param {number} iconIndex The icon index to draw; 0 means no icon.
   * @param {string} label The label to draw.
   * @param {Rectangle} rect The row rectangle.
   * @param {number} midX The mid X to limit left column width.
   */
  _drawLeftLabelWithOptionalIcon(leftX, iconY, iconIndex, label, rect, midX)
  {
    // start the text at the left side.
    let labelX = leftX;

    // if we have a valid icon index (> 0), draw it and push the text to the right.
    if (iconIndex > 0)
    {
      // draw the icon to the far-left, preceding the action label.
      this.drawIcon(iconIndex, leftX, iconY);

      // add spacing for the icon width + padding before drawing the action text.
      labelX += ImageManager.iconWidth + 6;
    }

    // compute the maximum width for the left column (half of the row width).
    const leftW = Math.max(0, midX - rect.x);

    // draw the action label to the right of the icon (if any).
    this.drawText(label, labelX, rect.y, leftW);
  }

  /**
   * Draws a complete two-column action row for a given label and binding.
   * @param {Rectangle} rect The row rectangle.
   * @param {string} label The left-column label to display.
   * @param {string} bound The primary bound physical symbol to display on the right.
   */
  _drawActionBindingRow(rect, label, bound)
  {
    // resolve an icon index for the bound physical symbol.
    const iconIndex = this.iconIndexForSymbol(bound);

    // compute the vertical placement for an icon.
    const iconY = this._iconYForRect(rect);

    // compute the middle x for two-column layout.
    const midX = rect.x + Math.floor(rect.width / 2);

    // draw the left column (icon + label).
    this._drawLeftLabelWithOptionalIcon(rect.x, iconY, iconIndex, label, rect, midX);

    // draw the center arrow.
    this._drawArrowBetweenColumns(rect, midX);

    // draw the right column binding text with icon escapes.
    const rightText = IconManager.jabsIconTextForSymbol(bound);
    this._drawRightBindingText(rect, midX, rightText);
  }

  /**
   * Draws the center arrow that separates left/right columns.
   * @param {Rectangle} rect The row rectangle.
   * @param {number} midX The middle X of the row.
   */
  _drawArrowBetweenColumns(rect, midX)
  {
    // define the arrow glyph to draw.
    const arrow = '→';

    // draw the arrow centered between columns.
    this.drawText(arrow, midX - this.textWidth(arrow), rect.y, Math.floor(rect.width / 2));
  }

  /**
   * Draws the right-column binding text (may contain icon escapes), right-aligned.
   * @param {Rectangle} rect The row rectangle.
   * @param {number} midX The middle X of the row.
   * @param {string} rightText The text to draw (often produced by IconManager).
   */
  _drawRightBindingText(rect, midX, rightText)
  {
    // measure the rendered width (icons + text) to right-align manually.
    const rightWidth = this.textSizeEx(rightText).width;

    // compute the right-aligned x within the right half.
    const rightX = midX + Math.floor(rect.width / 2) - rightWidth;

    // draw the mapping text on the right column using drawTextEx (enables icons).
    this.drawTextEx(rightText, rightX, rect.y, Math.floor(rect.width / 2));
  }

  //endregion drawing

  //region help
  /**
   * Updates the linked help window with a description of the selected action.
   */
  updateHelp()
  {
    // read the bound help window.
    const help = this.getHelpWindow();

    // if we have no help window, do nothing.
    if (!help) return;

    // resolve the currently selected logical or header label.
    const button = this.currentButton();

    // build the description for this selection.
    const text = this.describeButton(button);

    // update the help text.
    help.setText(text);
  }

  //endregion help

  //region handling
  /**
   * Processes the OK input.
   * Prevents confirming header rows.
   */
  processOk()
  {
    // read the current command.
    const cmd = this.currentData();

    // if there is no command, buzz and do nothing.
    if (!cmd)
    {
      SoundManager.playBuzzer();
      return;
    }

    // block only headers; allow normal and external actions to proceed.
    if (cmd.ext && cmd.ext.kind === 'header')
    {
      SoundManager.playBuzzer();
      return;
    }

    // defer to default behavior when actionable.
    super.processOk();
  }

  /**
   * Defines the standard handlers for OK/Cancel and Clear.
   */
  processHandling()
  {
    // perform super handling.
    super.processHandling();

    // handle clear binding when the delete-like key is pressed.
    if (this.isOpenAndActive())
    {
      // if the PageDown key was triggered, clear the binding.
      if (Input.isTriggered('pagedown')) this.callHandler('clear');
    }
  }

  //endregion handling

  //region utils
  /**
   * Finds the first actionable command index (skips headers).
   * @returns {number}
   */
  firstActionIndex()
  {
    // find the first index in the list that is enabled.
    for (let i = 0; i < this._list.length; i++)
    {
      // read the command at this index.
      const cmd = this._list[i];

      // if enabled, return this index.
      if (cmd && cmd.enabled !== false) return i;
    }

    // fallback to zero when none found.
    return 0;
  }

  /**
   * Converts a logical button key into a readable label.
   * @param {string} button The logical button key.
   * @returns {string}
   */
  humanizeButton(button)
  {
    // map known logical keys to nice labels.
    const map = {};
    map[JABS_Button.Mainhand] = 'Mainhand';
    map[JABS_Button.Offhand] = 'Offhand';
    map[JABS_Button.Tool] = 'Tool';
    map[JABS_Button.Dodge] = 'Dodge';

    // updated, descriptive labels for the four combat actions (not assignable here).
    map[JABS_Button.CombatSkill1] = 'Skill Trigger + Mainhand';
    map[JABS_Button.CombatSkill2] = 'Skill Trigger + Offhand';
    map[JABS_Button.CombatSkill3] = 'Skill Trigger + Dodge';
    map[JABS_Button.CombatSkill4] = 'Skill Trigger + Tool';

    // modifiers & mobility.
    map[JABS_Button.Sprint] = 'Sprint';
    map[JABS_Button.SkillTrigger] = 'Skill Trigger';
    map[JABS_Button.Strafe] = 'Strafe';
    map[JABS_Button.Rotate] = 'Rotate';
    map[JABS_Button.Guard] = 'Guard';

    // functionality.
    map[JABS_Button.Menu] = 'Menu';
    map[JABS_Button.Select] = 'Party Cycle';

    // return the translated label or the key if missing.
    return map[button] || button;
  }

  /**
   * Resolves an icon for a physical input symbol by consulting the IconManager.
   * Falls back to 0 (no icon) when unmapped.
   * @param {string} symbol The physical symbol to resolve an icon for.
   * @returns {number} The icon index to draw, or 0 if none.
   */
  iconIndexForSymbol(symbol)
  {
    // delegate to IconManager for a single icon index (or 0).
    return IconManager.jabsIconIndexForSymbol(symbol);
  }

  /**
   * Gets a human-readable description for a logical action or header.
   * @param {string} button The logical action key or header label.
   * @returns {string} The description text.
   */
  describeButton(button)
  {
    // provide descriptions for section headers when selected.
    if (button === 'Primary Actions')
    {
      // describe the purpose of primary actions.
      return 'Primary actions used moment-to-moment: mainhand/offhand attacks and tools.\n' + 'These are your core mapped buttons for direct, immediate use.';
    }

    // provide descriptions for section headers when selected.
    if (button === 'Secondary Actions')
    {
      // describe the purpose of secondary actions.
      return 'Secondary and modifier inputs: Skill Trigger, Rotate, Strafe, Dodge.\n' + 'Hold or tap to modify movement or enable combat skill slots.';
    }

    // provide descriptions for section headers when selected.
    if (button === 'Functional Actions')
    {
      // describe the purpose of functional actions.
      return 'Functional shortcuts unrelated to attacks: open the JABS menu, cycle party leader.\n' + 'Useful for management between encounters or to swap leaders on the fly.';
    }

    // a small dictionary of descriptions per logical action.
    const d = {};

    // functionality
    d[JABS_Button.Menu] = 'Open the JABS quick menu.\nAccess actions, tools, and options.';
    d[JABS_Button.Select] = 'Cycle the party leader.\nRotate the front actor with the next in line.';

    // primaries
    d[JABS_Button.Mainhand] = 'Use the mainhand action.\nTypically your basic weapon attack.';
    d[JABS_Button.Offhand] = 'Use the offhand action.\nTypically your secondary skill, or the guard-ready indicator.';
    d[JABS_Button.Tool] = 'Use the selected tool.\nExecutes the currently equipped tool skill.';
    d[JABS_Button.Sprint] = 'Sprint while held.\nMove faster when conditions allow.';

    // modifiers
    d[JABS_Button.Dodge] = 'Execute the mobility skill.\nLunge, backstep, tumble, or similar move.';
    d[JABS_Button.Strafe] = 'Hold facing while moving.\nLocks direction for circle-strafing.';
    d[JABS_Button.Rotate] = 'Rotate in place while held.\nIf you are guard-ready, you will also raise your guard.';
    d[JABS_Button.SkillTrigger] = 'Enable combat skills while held.\nPrimary actions become Combat skills 1-4.';

    // NOTE: this is not actually directly mappable- it arbitrarily shares input with rotation.
    d[JABS_Button.Guard] = 'Hold to raise guard (if guard skill is available).\nRaises guard skill when available.';

    // combat (L1 + face buttons)
    d[JABS_Button.CombatSkill1] = 'Trigger Combat Skill 1.\nUsed with the Skill Trigger modifier.';
    d[JABS_Button.CombatSkill2] = 'Trigger Combat Skill 2.\nUsed with the Skill Trigger modifier.';
    d[JABS_Button.CombatSkill3] = 'Trigger Combat Skill 3.\nUsed with the Skill Trigger modifier.';
    d[JABS_Button.CombatSkill4] = 'Trigger Combat Skill 4.\nUsed with the Skill Trigger modifier.';

    // fallback to the logical name if no description exists.
    return d[button] || String(button);
  }

  //endregion utils
}

//endregion Window_JabsRemapActions