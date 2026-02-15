//region Window_JabsRemapActions
/**
 * The list window that shows logical actions and current bindings.
 */
class Window_JabsRemapActions
  extends Window_Selectable
{
  /**
   * @param {Rectangle} rect The rectangle to draw this window within.
   */
  constructor(rect)
  {
    // perform super initialize.
    super(rect);

    /**
     * The working mapping being displayed.
     * @type {Object<string, string[]>}
     */
    this._mapping = {};

    /**
     * The ordered list of logical action keys for display (flat, assignable-only).
     * @type {string[]}
     */
    this._buttons = this.buildButtonList();

    /**
     * The grouped row model combining headers and actions.
     * @type {{ kind: string, label?: string, button?: string }[]}
     */
    this._rows = this.buildRows();

    // align the help window behavior.
    this.select(0);
  }

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
   * Returns the current logical button at the cursor.
   * @returns {string}
   */
  currentButton()
  {
    // resolve the row at the current index.
    const row = this.rowAt(this.index());

    // return the logical button for the selected action row.
    return (row.kind === 'action'
      ? String(row.button)
      : String(row.label));
  }

  /**
   * Builds the grouped row model based on the current assignable inputs.
   * @returns {{ kind: string, label?: string, button?: string }[]} The grouped rows.
   */
  buildRows()
  {
    // reference the assignable set for quick membership checks.
    const can = new Set(this._buttons);

    // a small helper to add a labeled header.
    const header = label => ({
      kind: 'header',
      label
    });

    // a small helper to add an action row when assignable.
    const action = button => ({
      kind: 'action',
      button
    });

    // construct the rows per requested groups.
    const rows = [];

    // primary actions.
    rows.push(header('Primary Actions'));
    if (can.has(JABS_Button.Mainhand)) rows.push(action(JABS_Button.Mainhand));
    if (can.has(JABS_Button.Offhand)) rows.push(action(JABS_Button.Offhand));
    if (can.has(JABS_Button.Tool)) rows.push(action(JABS_Button.Tool));
    if (can.has(JABS_Button.Sprint)) rows.push(action(JABS_Button.Sprint));

    // secondary actions.
    rows.push(header('Secondary Actions'));
    if (can.has(JABS_Button.SkillTrigger)) rows.push(action(JABS_Button.SkillTrigger));
    if (can.has(JABS_Button.Rotate)) rows.push(action(JABS_Button.Rotate));
    if (can.has(JABS_Button.Strafe)) rows.push(action(JABS_Button.Strafe));
    if (can.has(JABS_Button.Dodge)) rows.push(action(JABS_Button.Dodge));

    // functional actions.
    rows.push(header('Functional Actions'));
    if (can.has(JABS_Button.Menu)) rows.push(action(JABS_Button.Menu));
    if (can.has(JABS_Button.Select)) rows.push(action(JABS_Button.Select));

    // return the assembled rows.
    return rows;
  }

  /**
   * Gets the row at the provided index.
   * @param {number} index The index of the row.
   * @returns {{ kind: string, label?: string, button?: string }|null}
   */
  rowAt(index)
  {
    // return the row if within range.
    if (index >= 0 && index < this._rows.length) return this._rows[index];

    // out of range yields null.
    return null;
  }

  /**
   * Sets the mapping to display and refreshes.
   * @param {Object<string, string[]>} mapping The mapping to show and edit.
   */
  setMapping(mapping)
  {
    // store the mapping reference (scene owns lifecycle of the object).
    this._mapping = mapping;

    // refresh to draw the values.
    this.refresh();
  }

  /**
   * Gets the number of items to render.
   * @returns {number}
   */
  maxItems()
  {
    // return the count of buttons.
    return this._rows.length;
  }

  /**
   * Draws a single item.
   * @param {number} index The index to draw.
   */
  drawItem(index)
  {
    // get the rectangle for this line.
    const rect = this.itemRectWithPadding(index);

    // resolve the row to draw.
    const row = this.rowAt(index);

    // if this is a header row, draw the section title and exit.
    if (row && row.kind === 'header')
    {
      // pick a stronger font and centered alignment for headers.
      const name = row.label || '';

      // draw the header text centered across the full row.
      this.changeTextColor(ColorManager.systemColor());
      this.contents.fontBold = true;
      this.drawText(name, rect.x, rect.y, rect.width, 'center');
      this.resetTextColor();
      this.contents.fontBold = false;
      return;
    }

    // fallback if no row was found.
    if (!row || row.kind !== 'action') return;

    // get the logical button and current bindings.
    const { button } = row;
    const boundList = this._mapping[button] || [];
    const bound = boundList.length > 0
      ? boundList[0]
      : '';

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

    // draw the logical action label to the right of the icon (if any).
    this.drawText(this.humanizeButton(button), leftTextX, rect.y, rect.width / 2);

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
   * Resolves an icon for a physical input symbol by consulting J.ABS.Input as the authority.
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
   * Updates the linked help window with a description of the selected action.
   */
  updateHelp()
  {
    // if we have no help window, do nothing.
    if (!this._helpWindow) return;

    // resolve the currently selected logical button.
    const button = this.currentButton();

    // build the description for this button.
    const text = this.describeButton(button);

    // update the help text.
    this._helpWindow.setText(text);
  }

  /**
   * Gets a human-readable description for a logical action.
   * @param {string} button The logical action key.
   * @returns {string} The description text.
   */
  describeButton(button)
  {
    // provide descriptions for section headers when selected.
    if (button === 'Primary Actions')
    {
      // describe the purpose of primary actions.
      return 'Primary actions used moment-to-moment: mainhand/offhand attacks and tools.\n'
        + 'These are your core mapped buttons for direct, immediate use.';
    }

    // provide descriptions for section headers when selected.
    if (button === 'Secondary Actions')
    {
      // describe the purpose of secondary actions.
      return 'Secondary and modifier inputs: Skill Trigger, Rotate, Strafe, Dodge.\n'
        + 'Hold or tap to modify movement or enable combat skill slots.';
    }

    // provide descriptions for section headers when selected.
    if (button === 'Functional Actions')
    {
      // describe the purpose of functional actions.
      return 'Functional shortcuts unrelated to attacks: open the JABS menu, cycle party leader.\n'
        + 'Useful for management between encounters or to swap leaders on the fly.';
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

  /**
   * Processes the OK input.
   * Prevents confirming header rows.
   */
  processOk()
  {
    // if we are not on an action row, buzz and do nothing.
    const row = this.rowAt(this.index());
    if (!row || row.kind !== 'action')
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
}

//endregion Window_JabsRemapActions