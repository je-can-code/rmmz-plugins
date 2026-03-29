//region Window_JabsRemapActions

const JABS_REMAP_HEADER_HELP = {
  'Primary Actions':
    'Primary actions used moment-to-moment: mainhand/offhand attacks and tools.\n'
    + 'These are your core mapped buttons for direct, immediate use.',
  'Secondary Actions':
    'Secondary and modifier inputs: Skill Trigger, Rotate, Strafe, Dodge.\n'
    + 'Hold or tap to modify movement or enable combat skill slots.',
  'Functional Actions':
    'Functional shortcuts unrelated to attacks: open the JABS menu, cycle party leader.\n'
    + 'Useful for management between encounters or to swap leaders on the fly.',
};

/**
 * Cached labels + help text for logical JABS buttons (built once; keys use {@link JABS_Button}).
 * @returns {{ labels: Object<string, string>, help: Object<string, string> }}
 */
function jabsRemapActionLookupMaps()
{
  if (jabsRemapActionLookupMaps._cached)
  {
    return jabsRemapActionLookupMaps._cached;
  }

  const labels = {};
  labels[JABS_Button.Mainhand] = 'Mainhand';
  labels[JABS_Button.Offhand] = 'Offhand';
  labels[JABS_Button.Tool] = 'Tool';
  labels[JABS_Button.Dodge] = 'Dodge';
  labels[JABS_Button.CombatSkill1] = 'Skill Trigger + Mainhand';
  labels[JABS_Button.CombatSkill2] = 'Skill Trigger + Offhand';
  labels[JABS_Button.CombatSkill3] = 'Skill Trigger + Dodge';
  labels[JABS_Button.CombatSkill4] = 'Skill Trigger + Tool';
  labels[JABS_Button.Sprint] = 'Sprint';
  labels[JABS_Button.SkillTrigger] = 'Skill Trigger';
  labels[JABS_Button.Strafe] = 'Strafe';
  labels[JABS_Button.Rotate] = 'Rotate';
  labels[JABS_Button.Guard] = 'Guard';
  labels[JABS_Button.Menu] = 'Menu';
  labels[JABS_Button.Select] = 'Party Cycle';

  const help = {};
  help[JABS_Button.Menu] = 'Open the JABS quick menu.\nAccess actions, tools, and options.';
  help[JABS_Button.Select] = 'Cycle the party leader.\nRotate the front actor with the next in line.';
  help[JABS_Button.Mainhand] = 'Use the mainhand action.\nTypically your basic weapon attack.';
  help[JABS_Button.Offhand] = 'Use the offhand action.\nTypically your secondary skill, or the guard-ready indicator.';
  help[JABS_Button.Tool] = 'Use the selected tool.\nExecutes the currently equipped tool skill.';
  help[JABS_Button.Sprint] = 'Sprint while held.\nMove faster when conditions allow.';
  help[JABS_Button.Dodge] = 'Execute the mobility skill.\nLunge, backstep, tumble, or similar move.';
  help[JABS_Button.Strafe] = 'Hold facing while moving.\nLocks direction for circle-strafing.';
  help[JABS_Button.Rotate] =
    'Rotate in place while held.\nIf you are guard-ready, you will also raise your guard.';
  help[JABS_Button.SkillTrigger] =
    'Enable combat skills while held.\nPrimary actions become Combat skills 1-4.';
  // Not directly mappable; shares input with rotation in practice.
  help[JABS_Button.Guard] =
    'Hold to raise guard (if guard skill is available).\nRaises guard skill when available.';
  help[JABS_Button.CombatSkill1] = 'Trigger Combat Skill 1.\nUsed with the Skill Trigger modifier.';
  help[JABS_Button.CombatSkill2] = 'Trigger Combat Skill 2.\nUsed with the Skill Trigger modifier.';
  help[JABS_Button.CombatSkill3] = 'Trigger Combat Skill 3.\nUsed with the Skill Trigger modifier.';
  help[JABS_Button.CombatSkill4] = 'Trigger Combat Skill 4.\nUsed with the Skill Trigger modifier.';

  jabsRemapActionLookupMaps._cached = { labels, help };
  return jabsRemapActionLookupMaps._cached;
}

/**
 * The list window that shows logical actions and current bindings.
 * Extends {@link Window_Command} with builder-style rows and namespaced state under
 * {@link this._j._abs._input._actions}.
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
    super(rect);
    this.initMembers();
    this.select(this.firstActionIndex());
  }

  //region init
  /**
   * Ensures `this._j._abs._input._actions` exists and seeds state/view bags.
   * Also hydrates the assignable button list when empty.
   */
  initMembers()
  {
    this._j ||= {};
    this._j._abs ||= {};
    this._j._abs._input ||= {};
    this._j._abs._input._actions ||= {};

    const actions = this._j._abs._input._actions;
    actions._state = {
      _mapping: {},
      _externalMapping: {},
      _buttons: [],
    };
    actions._view = { _helpWindow: null };

    if (this.getButtons().length === 0)
    {
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
    return this._state()._mapping || {};
  }

  /**
   * Sets the mapping to display and refreshes.
   * @param {Object<string, string[]>} mapping The mapping to show and edit.
   */
  setMapping(mapping)
  {
    this._state()._mapping = mapping || {};
    this.refresh();
  }

  /**
   * Gets the external mapping reference for rows from {@link buildExternalActionCommand}.
   * Shape: `{ [`${ns}:${key}`]: string[] }` (scene-owned; optional).
   * @returns {Object<string, string[]>}
   */
  getExternalMapping()
  {
    return this._state()._externalMapping || {};
  }

  /**
   * Sets the external mapping reference; scene owns lifecycle.
   * @param {Object<string, string[]>} externalMapping The external mapping.
   */
  setExternalMapping(externalMapping)
  {
    this._state()._externalMapping = externalMapping || {};
    this.refresh();
  }

  /**
   * Gets the ordered list of logical action keys.
   * @returns {string[]}
   */
  getButtons()
  {
    const state = this._state();
    if (state._buttons && state._buttons.length > 0)
    {
      return state._buttons;
    }
    return this.buildButtonList();
  }

  /**
   * Sets the ordered list of logical action keys.
   * @param {string[]} buttons The ordered list of buttons.
   */
  setButtons(buttons)
  {
    this._state()._buttons = Array.isArray(buttons)
      ? buttons.slice(0)
      : [];
    this.refresh();
  }

  /**
   * Gets the currently bound help window.
   * @returns {Window_Help|null}
   */
  getHelpWindow()
  {
    return this._view()._helpWindow;
  }

  /**
   * Sets the help window and forwards to the base implementation for linkage.
   * @param {Window_Help} helpWindow The help window to bind.
   */
  setHelpWindow(helpWindow)
  {
    this._view()._helpWindow = helpWindow;
    super.setHelpWindow(helpWindow);
  }

  /**
   * Returns the current logical button at the cursor (or section / external label for headers).
   * @returns {string}
   */
  currentButton()
  {
    const cmd = this.currentData();
    if (!cmd)
    {
      return String.empty;
    }
    if (cmd.ext && cmd.ext.kind === 'header')
    {
      return String(cmd.ext.label || String.empty);
    }
    if (cmd.ext && cmd.ext.kind === 'ext-action')
    {
      return String(cmd.ext.label || String.empty);
    }
    if (cmd.ext && cmd.ext.kind === 'action')
    {
      return String(cmd.ext.button || cmd.symbol || String.empty);
    }
    return String(cmd.symbol || String.empty);
  }

  /**
   * Ensures the `_j._abs._input._actions` chain exists.
   * Lazily mirrors ctor init so accessors stay valid when this window is touched without a full
   * new-game init path (continued saves, aliased entry, or future scene wiring).
   */
  _root()
  {
    this._j ||= {};
    this._j._abs ||= {};
    this._j._abs._input ||= {};
    this._j._abs._input._actions ||= {};
  }

  /**
   * Lazily ensures and returns the window-local state bag.
   * @returns {{_mapping:Object<string,string[]>, _externalMapping:Object<string, string[]>, _buttons:string[]}}
   */
  _state()
  {
    this._root();
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
    this._root();
    const actions = this._j._abs._input._actions;
    actions._view ||= { _helpWindow: null };
    return actions._view;
  }

  //endregion accessors

  //region builders
  /**
   * Built-in section specs (title + logical keys). Override to reorder or replace default sections.
   * @returns {{ title: string, buttons: string[] }[]}
   */
  _builtinSectionSpecs()
  {
    return [
      {
        title: 'Primary Actions',
        buttons: [
          JABS_Button.Mainhand,
          JABS_Button.Offhand,
          JABS_Button.Tool,
          JABS_Button.Sprint,
        ],
      },
      {
        title: 'Secondary Actions',
        buttons: [
          JABS_Button.SkillTrigger,
          JABS_Button.Rotate,
          JABS_Button.Strafe,
          JABS_Button.Dodge,
        ],
      },
      {
        title: 'Functional Actions',
        buttons: [
          JABS_Button.Menu,
          JABS_Button.Select,
        ],
      },
    ];
  }

  /**
   * Appends built-in header + action rows between pre/post extension hooks.
   * @param {BuiltWindowCommand[]} rows Accumulated rows.
   * @param {Set<string>} can Assignable logical keys for this window.
   */
  buildBuiltinActionSections(rows, can)
  {
    const specs = this._builtinSectionSpecs();
    for (let i = 0; i < specs.length; i++)
    {
      const spec = specs[i];
      rows.push(this.buildHeaderCommand(spec.title));
      for (let j = 0; j < spec.buttons.length; j++)
      {
        this._addIf(rows, can, spec.buttons[j]);
      }
    }
  }

  /**
   * Builds the ordered list of logical actions to show.
   * @returns {string[]}
   */
  buildButtonList()
  {
    return JABS_Button.assignableInputs();
  }

  /**
   * Implements {@link Window_Command.prototype.makeCommandList}.
   */
  makeCommandList()
  {
    const commands = this.buildCommands();
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds all commands (headers + actions) for this window.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    const can = new Set(this.getButtons());
    const rows = [];
    this.buildPreExtensionGroups(rows, can);
    this.buildBuiltinActionSections(rows, can);
    this.buildPostExtensionGroups(rows, can);
    return rows;
  }

  /**
   * Adds an action row when the logical key is assignable in this context.
   * @param {BuiltWindowCommand[]} rows Rows being built.
   * @param {Set<string>} can Assignable logical keys.
   * @param {string} button Logical key.
   */
  _addIf(rows, can, button)
  {
    if (can.has(button))
    {
      rows.push(this.buildActionCommand(button));
    }
  }

  /**
   * Prepend custom sections before built-in groups.
   * @param {BuiltWindowCommand[]} rows Rows being built.
   * @param {Set<string>} can Assignable logical keys.
   */
  // eslint-disable-next-line no-unused-vars
  buildPreExtensionGroups(rows, can)
  {
  }

  /**
   * Append custom sections after built-in groups.
   * @param {BuiltWindowCommand[]} rows Rows being built.
   * @param {Set<string>} can Assignable logical keys.
   */
  // eslint-disable-next-line no-unused-vars
  buildPostExtensionGroups(rows, can)
  {
  }

  /**
   * Builds a non-interactive section header.
   * @param {string} label Header label.
   * @returns {BuiltWindowCommand}
   */
  buildHeaderCommand(label)
  {
    return new WindowCommandBuilder(label)
      .setSymbol(`__header__${label}`)
      .setExtensionData({
        kind: 'header',
        label,
      })
      .setEnabled(false)
      .build();
  }

  /**
   * Builds a remappable JABS logical action row.
   * @param {string} button Logical action key.
   * @returns {BuiltWindowCommand}
   */
  buildActionCommand(button)
  {
    return new WindowCommandBuilder(this.humanizeButton(button))
      .setSymbol(button)
      .setExtensionData({
        kind: 'action',
        button,
      })
      .setEnabled(true)
      .build();
  }

  /**
   * Builds a row backed by {@link Input} registry keys (external namespace).
   * @param {string} ns Namespace (e.g. `"J.MAP"`).
   * @param {string} key Logical key within `ns`.
   * @param {string} label Row label.
   * @param {number} [iconIndex=0] Optional fixed left icon; 0 = derive from binding.
   * @returns {BuiltWindowCommand}
   */
  buildExternalActionCommand(ns, key, label, iconIndex)
  {
    return new WindowCommandBuilder(label)
      .setSymbol(`__ext__${ns}:${key}`)
      .setExtensionData({
        kind: 'ext-action',
        ns,
        key,
        label,
        icon: Number(iconIndex) || 0,
      })
      .setEnabled(true)
      .build();
  }

  //endregion builders

  //region drawing
  /**
   * @param {number} index Row index.
   */
  drawItem(index)
  {
    const rect = this.itemRectWithPadding(index);
    const cmd = this._list[index];
    if (!cmd)
    {
      return;
    }
    if (cmd.ext && cmd.ext.kind === 'header')
    {
      this._drawHeaderItem(rect, cmd);
      return;
    }
    if (cmd.ext && cmd.ext.kind === 'ext-action')
    {
      this._drawExternalActionItem(rect, cmd);
      return;
    }
    this._drawJabsActionItem(rect, cmd);
  }

  /**
   * @param {Rectangle} rect Row rect.
   * @param {{name:string, ext:object}} cmd Command data.
   */
  _drawHeaderItem(rect, cmd)
  {
    const name = cmd.name || String.empty;
    this.changeTextColor(ColorManager.systemColor());
    this.contents.fontBold = true;
    this.drawText(name, rect.x, rect.y, rect.width, 'center');
    this.resetTextColor();
    this.contents.fontBold = false;
  }

  /**
   * @param {Rectangle} rect Row rect.
   * @param {{ name:string, symbol:string, ext:object }} cmd Command data.
   */
  _drawExternalActionItem(rect, cmd)
  {
    const displayLabel = String(cmd.ext.label || '');
    const combined = this.getMapping();
    const token = String(cmd.symbol || '');
    const hasStaged = Object.prototype.hasOwnProperty.call(combined, token);
    const staged = hasStaged ? combined[token] : null;
    let boundList;
    if (staged !== null)
    {
      boundList = Array.isArray(staged) ? staged : [];
    }
    else
    {
      boundList = Input.getBindings(cmd.ext.ns, cmd.ext.key) || [];
    }
    const bound = boundList.length > 0
      ? boundList[0]
      : String.empty;
    let leftIcon = 0;
    if (cmd.ext.icon && cmd.ext.icon > 0)
    {
      leftIcon = cmd.ext.icon;
    }
    this._drawActionBindingRow(rect, displayLabel, bound, leftIcon);
  }

  /**
   * @param {Rectangle} rect Row rect.
   * @param {{symbol:string}} cmd Command data.
   */
  _drawJabsActionItem(rect, cmd)
  {
    const button = String(cmd.symbol);
    const mapping = this.getMapping();
    const boundList = mapping[button] || [];
    const bound = boundList.length > 0
      ? boundList[0]
      : String.empty;
    const label = this.humanizeButton(button);
    this._drawActionBindingRow(rect, label, bound, 0);
  }

  /**
   * @param {Rectangle} rect Row rect.
   * @returns {number} Icon Y.
   */
  _iconYForRect(rect)
  {
    const ih = ImageManager.iconHeight;
    return rect.y + Math.max(0, Math.floor((this.lineHeight() - ih) / 2));
  }

  /**
   * @param {number} leftX Left column X.
   * @param {number} iconY Icon Y.
   * @param {number} iconIndex Icon index; 0 = skip icon.
   * @param {string} label Text after optional icon.
   * @param {Rectangle} rect Row rect.
   * @param {number} midX Column split.
   */
  _drawLeftLabelWithOptionalIcon(leftX, iconY, iconIndex, label, rect, midX)
  {
    let labelX = leftX;
    if (iconIndex > 0)
    {
      this.drawIcon(iconIndex, leftX, iconY);
      labelX += ImageManager.iconWidth + 6;
    }
    const leftW = Math.max(0, midX - rect.x);
    this.drawText(label, labelX, rect.y, leftW);
  }

  /**
   * Two-column row: optional fixed left icon, label, arrow, binding (with icon escapes).
   * @param {Rectangle} rect Row rect.
   * @param {string} label Left column label.
   * @param {string} bound Primary physical symbol for the right column.
   * @param {number} leftIconOverride Fixed left icon index; 0 = use {@link iconIndexForSymbol} on `bound`.
   */
  _drawActionBindingRow(rect, label, bound, leftIconOverride)
  {
    let iconIndex = leftIconOverride;
    if (!(iconIndex > 0))
    {
      iconIndex = this.iconIndexForSymbol(bound);
    }
    const iconY = this._iconYForRect(rect);
    const midX = rect.x + Math.floor(rect.width / 2);
    this._drawLeftLabelWithOptionalIcon(rect.x, iconY, iconIndex, label, rect, midX);
    this._drawArrowBetweenColumns(rect, midX);
    const rightText = IconManager.jabsIconTextForSymbol(bound);
    this._drawRightBindingText(rect, midX, rightText);
  }

  /**
   * @param {Rectangle} rect Row rect.
   * @param {number} midX Column split.
   */
  _drawArrowBetweenColumns(rect, midX)
  {
    const arrow = '→';
    this.drawText(arrow, midX - this.textWidth(arrow), rect.y, Math.floor(rect.width / 2));
  }

  /**
   * @param {Rectangle} rect Row rect.
   * @param {number} midX Column split.
   * @param {string} rightText Text for {@link Window_Base.prototype.drawTextEx}.
   */
  _drawRightBindingText(rect, midX, rightText)
  {
    const rightWidth = this.textSizeEx(rightText).width;
    const rightX = midX + Math.floor(rect.width / 2) - rightWidth;
    this.drawTextEx(rightText, rightX, rect.y, Math.floor(rect.width / 2));
  }

  //endregion drawing

  //region help
  /**
   * Updates the linked help window from the current selection.
   */
  updateHelp()
  {
    const help = this.getHelpWindow();
    if (!help)
    {
      return;
    }
    const button = this.currentButton();
    help.setText(this.describeButton(button));
  }

  //endregion help

  //region handling
  /**
   * Blocks OK on header rows only.
   */
  processOk()
  {
    const cmd = this.currentData();
    if (!cmd)
    {
      SoundManager.playBuzzer();
      return;
    }
    if (cmd.ext && cmd.ext.kind === 'header')
    {
      SoundManager.playBuzzer();
      return;
    }
    super.processOk();
  }

  /**
   * Forwards to base handling and maps PageDown to the `clear` handler.
   */
  processHandling()
  {
    super.processHandling();
    if (this.isOpenAndActive() && Input.isTriggered('pagedown'))
    {
      this.callHandler('clear');
    }
  }

  //endregion handling

  //region utils
  /**
   * First enabled command index (skips disabled headers).
   * @returns {number}
   */
  firstActionIndex()
  {
    for (let i = 0; i < this._list.length; i++)
    {
      const cmd = this._list[i];
      if (cmd && cmd.enabled !== false)
      {
        return i;
      }
    }
    return 0;
  }

  /**
   * @param {string} button Logical key.
   * @returns {string}
   */
  humanizeButton(button)
  {
    const { labels } = jabsRemapActionLookupMaps();
    return labels[button] || button;
  }

  /**
   * @param {string} symbol Physical symbol.
   * @returns {number} Icon index, or 0.
   */
  iconIndexForSymbol(symbol)
  {
    return IconManager.jabsIconIndexForSymbol(symbol);
  }

  /**
   * Help text for a header label, logical key, or external row label.
   * @param {string} button Value from {@link currentButton}.
   * @returns {string}
   */
  describeButton(button)
  {
    const header = JABS_REMAP_HEADER_HELP[button];
    if (header)
    {
      return header;
    }
    const { help } = jabsRemapActionLookupMaps();
    if (help[button])
    {
      return help[button];
    }
    return String(button);
  }

  //endregion utils
}

//endregion Window_JabsRemapActions
