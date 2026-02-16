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
      _mapping: {},
      _buttons: [],
    };

    /**
     * Window-local view bag.
     */
    this._j._abs._input._actions._view = {
      _helpWindow: null,
    };

    // pre-build the static button list if not already present.
    if (this.getButtons().length === 0)
    {
      // set the authoritative buttons list for this window.
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
      return String(cmd.ext.label || '');
    }

    // if this is an external action, return its display label (for prompt/help).
    if (cmd.ext && cmd.ext.kind === 'ext-action')
    {
      return String(cmd.ext.label || '');
    }

    // otherwise return the logical action key.
    return String(cmd.symbol || '');
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
   * @returns {{_mapping:Object<string,string[]>, _buttons:string[]}}
   */
  _state()
  {
    // ensure root namespaces.
    this._root();

    // ensure and return the state bag.
    const actions = this._j._abs._input._actions;
    actions._state ||= {
      _mapping: {},
      _buttons: []
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
   * @returns {BuiltWindowCommand}
   */
  buildExternalActionCommand(ns, key, label)
  {
    // build an enabled command that carries external namespace metadata.
    return new WindowCommandBuilder(label)
      .setSymbol(`__ext__${ns}:${key}`)
      .setExtensionData({
        kind: 'ext-action',
        ns: ns,
        key: key,
        label: label,
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

    // fallback if no command was found.
    if (!cmd) return;

    // if this is a header row, draw the section title and exit.
    if (cmd.ext && cmd.ext.kind === 'header')
    {
      // pick a stronger font and centered alignment for headers.
      const name = cmd.name || '';

      // draw the header text centered across the full row.
      this.changeTextColor(ColorManager.systemColor());
      this.contents.fontBold = true;
      this.drawText(name, rect.x, rect.y, rect.width, 'center');
      this.resetTextColor();
      this.contents.fontBold = false;
      return;
    }

    // external registry-backed action: render from Input registry bindings.
    if (cmd.ext && cmd.ext.kind === 'ext-action')
    {
      // label is provided by the command.
      const displayLabel = String(cmd.ext.label || '');

      // read the bindings directly from the Input registry.
      const boundList = Input.getBindings(cmd.ext.ns, cmd.ext.key) || [];

      // extract the primary binding if any.
      const bound = boundList.length > 0
        ? boundList[0]
        : String.empty;

      // determine the icon index for the bound physical symbol.
      const iconIndex = this.iconIndexForSymbol(bound);

      // pull icon sizing for positioning.
      const iw = ImageManager.iconWidth;
      const ih = ImageManager.iconHeight;

      // compute a vertically-centered y for the icon.
      const iconY = rect.y + Math.max(0, Math.floor((this.lineHeight() - ih) / 2));

      // track the x-position for the action text, starting at the left side.
      let leftTextX = rect.x;

      // if we have a valid icon index (> 0), draw it and bump the text to the right.
      if (iconIndex > 0)
      {
        // draw the icon to the far-left, preceding the action label.
        this.drawIcon(iconIndex, rect.x, iconY);

        // add spacing for the icon width + padding before drawing the action text.
        leftTextX += iw + 6;
      }

      // draw the action label to the right of the icon (if any).
      this.drawText(displayLabel, leftTextX, rect.y, rect.width / 2);

      // draw an arrow separating columns.
      const arrow = '→';

      // compute mid-column x.
      const midX = rect.x + rect.width / 2;

      // draw the arrow centered between columns.
      this.drawText(arrow, midX - this.textWidth(arrow), rect.y, rect.width / 2);

      // build the right-column rich text (supports icons/escape codes).
      const rightText = IconManager.jabsIconTextForSymbol(bound);

      // measure the rendered width (icons + text) to right-align manually.
      const rightWidth = this.textSizeEx(rightText).width;

      // compute the right-aligned x within the right half.
      const rightX = midX + (rect.width / 2) - rightWidth;

      // draw the mapping text on the right column using drawTextEx (enables icons).
      this.drawTextEx(rightText, rightX, rect.y, rect.width / 2);
      return;
    }

    // JABS logical action row: original behavior.
    const button = String(cmd.symbol);
    const mapping = this.getMapping();
    const boundList = mapping[button] || [];
    const bound = boundList.length > 0
      ? boundList[0]
      : String.empty;
    const iconIndex = this.iconIndexForSymbol(bound);
    const iw = ImageManager.iconWidth;
    const ih = ImageManager.iconHeight;
    const iconY = rect.y + Math.max(0, Math.floor((this.lineHeight() - ih) / 2));
    let leftTextX = rect.x;
    if (iconIndex > 0)
    {
      this.drawIcon(iconIndex, rect.x, iconY);
      leftTextX += iw + 6;
    }
    this.drawText(this.humanizeButton(button), leftTextX, rect.y, rect.width / 2);
    const arrow = '→';
    const midX = rect.x + rect.width / 2;
    this.drawText(arrow, midX - this.textWidth(arrow), rect.y, rect.width / 2);
    const rightText = IconManager.jabsIconTextForSymbol(bound);
    const rightWidth = this.textSizeEx(rightText).width;
    const rightX = midX + (rect.width / 2) - rightWidth;
    this.drawTextEx(rightText, rightX, rect.y, rect.width / 2);
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

    // if this is not an action row, buzz and do nothing.
    if (!cmd || (cmd.ext && cmd.ext.kind !== 'action'))
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