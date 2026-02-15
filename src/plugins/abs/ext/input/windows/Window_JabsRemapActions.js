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
     * The ordered list of logical action keys for display.
     * @type {string[]}
     */
    this._buttons = this.buildButtonList();

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
    // return the button from the list at the index.
    return this._buttons[this.index()];
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
    return this._buttons.length;
  }

  /**
   * Draws a single item.
   * @param {number} index The index to draw.
   */
  drawItem(index)
  {
    // get the rectangle for this line.
    const rect = this.itemRectWithPadding(index);

    // get the logical button and current bindings.
    const button = this._buttons[index];
    const boundList = this._mapping[button] || [];
    const bound = boundList.length > 0
      ? boundList[0]
      : "";

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
    const arrow = "→";

    // compute mid-column x.
    const midX = rect.x + rect.width / 2;

    // draw the arrow centered between columns.
    this.drawText(arrow, midX - this.textWidth(arrow), rect.y, rect.width / 2);

    // draw the mapping text on the right column (no icon here anymore).
    this.drawText(this.humanizeSymbol(bound), midX, rect.y, rect.width / 2, "right");
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
   * Converts a physical input symbol to a readable label.
   * @param {string} symbol The physical symbol.
   * @returns {string}
   */
  humanizeSymbol(symbol)
  {
    // handle empty/unbound case.
    if (!symbol) return '(unbound)';

    switch (symbol)
    {
      case 'ok':
        return 'A-button / Z-key [OK]';
      case 'cancel':
        return 'B-button / X-key [Cancel]';
      case 'tab':
        return 'Y-button / C-key';
      case 'shift':
        return 'X-Button / Shift-key [Dash/Sprint]';
      case 'pagedown':
        return 'R1-button / E-key [Cycle Forward]';
      case 'pageup':
        return 'L1-button / Q-key [Cycle Back]';
      case 'r2':
        return 'R2-button / Tab-key';
      case 'l2':
        return 'L2-button / L-Control-key';
      case 'select':
        return 'Select-button';
      case 'start':
        return 'Start-button';

      default:
        return symbol;
    }
  }

  /**
   * Resolves an icon for a physical input symbol by consulting J.ABS.Input as the authority.
   * Falls back to 0 (no icon) when unmapped.
   * @param {string} symbol The physical symbol to resolve an icon for.
   * @returns {number} The icon index to draw, or 0 if none.
   */
  iconIndexForSymbol(symbol)
  {
    // if nothing is bound, do not draw an icon.
    if (!symbol) return 0;

    // reference the configured input constants (source of truth for symbols).
    const I = J.ABS.Input;

    // normalize any engine-native synonyms to the configured constant values if needed.
    const normalized = symbol;

    // map configured inputs to icon indices.
    const iconByInput = {
      // primaries
      [I.Mainhand]: 76,       // (Cross / A)-button / Z-key
      [I.Offhand]: 77,        // (Circle / B)-button / X-key
      [I.Tool]: 176,           // (Triangle / Y)-button / C-key
      [I.Dash]: 140,           // (Square / X)-button / Shift-key

      // modifiers & mobility
      [I.SkillTrigger]: 86,   // L1-button / Q-key
      [I.StrafeTrigger]: 82,  // L2-button / L-Control-key
      [I.GuardTrigger]: 83,   // R1-button / E-key
      [I.MobilitySkill]: 13,  // R2-button / Tab-key

      // menu-ish
      [I.Quickmenu]: 2563,      // Start-button
      [I.PartyCycle]: 75,     // Select-button

      // combat face button triggers
      [I.CombatSkill1]: 79,
      [I.CombatSkill2]: 79,
      [I.CombatSkill3]: 79,
      [I.CombatSkill4]: 79,
    };

    // return the matching icon index or 0 if not mapped.
    return iconByInput[normalized] || 0;
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