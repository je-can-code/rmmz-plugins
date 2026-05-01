//region Window_PassiveDetail
/**
 * A non-interactive detail panel that displays information about the currently
 * highlighted passive state in the list window.
 *
 * The panel is divided into two equal columns below the full-width state header.
 * Each column renders sections that group effects by meaning. All draw helpers
 * share state through {@link currentX} and {@link currentY}, both reset at the
 * start of each repaint — no y threading through method signatures.
 *
 * Left column:   Combat (stub, filled by passive/ext/abs) + Ailments
 * Middle column: Parameters + Elements
 * Right column:  Skills + Equip + Properties + Rewards
 *
 * Section draw order / extension target names:
 *   drawStateHeader → drawCombatSection (stub) → drawAilmentsSection →
 *   (middle) → drawParametersSection → drawElementsSection →
 *   (right) → drawSkillsSection → drawEquipSection → drawPropertiesSection →
 *   drawRewardsSection
 *
 * Clears and shows nothing when no state is selected.
 */
class Window_PassiveDetail
  extends Window_Base
{
  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle for this window.
   */
  constructor(rect)
  {
    // call super when having extended constructors.
    super(rect);

    // jumpstart initialization on creation.
    this.initialize(rect);
  }

  //region init
  /**
   * Initializes this window.
   * @param {Rectangle} rect The rectangle for this window.
   */
  initialize(rect)
  {
    // perform original logic.
    super.initialize(rect);

    /**
     * The passive state currently being displayed.
     * @type {RPG_State|null}
     */
    this._state = null;

    /**
     * The actor whose passive states are being browsed.
     * @type {Game_Actor|null}
     */
    this._actor = null;

    /**
     * The running horizontal cursor. 0 for the left column, columnWidth+gutter for the right.
     * @type {number}
     */
    this._currentX = 0;

    /**
     * The running vertical cursor shared by all draw helpers in the active column.
     * @type {number}
     */
    this._currentY = 0;

    /**
     * The y coordinate where both columns begin, recorded after the full-width header.
     * Used by {@link switchToRightColumn} to reset the vertical cursor.
     * @type {number}
     */
    this._columnStartY = 0;
  }
  //endregion init

  //region cursor properties
  /**
   * The running horizontal cursor for the active column.
   * @type {number}
   */
  get currentX()
  {
    return this._currentX;
  }

  set currentX(value)
  {
    this._currentX = value;
  }

  /**
   * The running vertical cursor shared by all draw helpers.
   * @type {number}
   */
  get currentY()
  {
    return this._currentY;
  }

  set currentY(value)
  {
    this._currentY = value;
  }

  /**
   * The usable pixel width of one column.
   * All three columns are equal; two 8px gutters separate them.
   * @type {number}
   */
  get columnWidth()
  {
    return Math.floor((this.innerWidth - 16) / 3);
  }
  //endregion cursor properties

  //region column navigation
  /**
   * Moves the active draw cursor to the given zero-based column index.
   * Column 0 = left, 1 = middle, 2 = right.
   * Resets {@link currentY} to the value recorded after the full-width header.
   * @param {number} columnIndex The target column (0, 1, or 2).
   */
  switchToColumn(columnIndex)
  {
    this.currentX = columnIndex * (this.columnWidth + 8);
    this.currentY = this._columnStartY;
  }

  /**
   * Convenience: moves to the middle (second) column.
   */
  switchToMiddleColumn()
  {
    this.switchToColumn(1);
  }

  /**
   * Convenience: moves to the right (third) column.
   */
  switchToRightColumn()
  {
    this.switchToColumn(2);
  }
  //endregion column navigation

  //region update
  /**
   * Sets the actor context and repaints.
   * @param {Game_Actor|null} actor The actor being browsed.
   */
  setActor(actor)
  {
    this._actor = actor;
    this.refresh();
  }

  /**
   * Sets the state to display and repaints.
   * @param {RPG_State|null} state The state to display, or null to clear.
   */
  setState(state)
  {
    this._state = state;
    this.refresh();
  }
  //endregion update

  //region draw
  /**
   * Repaints the detail panel for the current state.
   */
  refresh()
  {
    // clear prior contents before repainting.
    this.contents.clear();

    // nothing to show when there is no state.
    if (!this._state) return;

    // reset the cursors and paint the full detail view.
    this.currentX = 0;
    this.currentY = 0;
    this.drawPassiveStateDetail(this._state);
  }

  /**
   * Top-level orchestrator — draws the full-width header, then populates the
   * left and right columns with their respective sections.
   *
   * Left column: Combat (stub, filled by passive/ext/abs), Parameters, Elements.
   * Right column: Ailments, Skills, Equip, Properties, Rewards.
   *
   * Extensions may alias either this method or any individual section method.
   * @param {RPG_State} state The state whose details are being drawn.
   */
  drawPassiveStateDetail(state)
  {
    // full-width header: state icon, name, description.
    this.drawStateHeader(state);

    // record the y where all three columns start, then fill the left column.
    this._columnStartY = this.currentY;
    this.drawCombatSection(state);
    this.drawAilmentsSection(state);

    // middle column: stat modifications and elemental affinities.
    this.switchToMiddleColumn();
    this.drawParametersSection(state);
    this.drawElementsSection(state);

    // right column: skill/equip access, misc flags, and battle rewards.
    this.switchToRightColumn();
    this.drawSkillsSection(state);
    this.drawEquipSection(state);
    this.drawPropertiesSection(state);
    this.drawRewardsSection(state);
  }

  /**
   * Stub for the combat section — occupies no space when unoverridden.
   * J.PASSIVE.EXT.ABS overrides this to draw JABS combat, shield, and stacking.
   * @param {RPG_State} state The state being detailed.
   */
  // eslint-disable-next-line no-unused-vars
  drawCombatSection(state)
  {
  }

  //region helpers
  /**
   * Draws a "——— Label ———" section divider centered in the active column.
   * Lines are drawn on each side of the title text; they do not pass through it.
   * Advances {@link currentY} by one line height.
   * @param {string} label The section title text.
   */
  drawDetailSectionHeader(label)
  {
    const lh = this.lineHeight();
    const y = this.currentY;
    const cw = this.columnWidth;
    const cx = this.currentX;

    // measure the title to find where the lines should start and end.
    const textWidth = this.textWidth(label);
    const centerX = cx + Math.floor(cw / 2);
    const textX = centerX - Math.floor(textWidth / 2);
    const lineY = y + Math.floor(lh / 2);
    const lineColor = ColorManager.textColor(8);

    // left rule — from the column edge to just before the title.
    const leftEnd = textX - 4;
    if (leftEnd > cx + 4)
    {
      this.contents.fillRect(cx + 4, lineY, leftEnd - (cx + 4), 1, lineColor);
    }

    // right rule — from just after the title to the column edge.
    const rightStart = textX + textWidth + 4;
    const rightEnd = cx + cw - 4;
    if (rightStart < rightEnd)
    {
      this.contents.fillRect(rightStart, lineY, rightEnd - rightStart, 1, lineColor);
    }

    // title text in warm gold.
    this.changeTextColor(ColorManager.textColor(14));
    this.drawText(label, textX, y, textWidth + 2);
    this.resetTextColor();

    this.currentY += lh;
  }

  /**
   * Draws a single detail row within the active column.
   * Layout: optional icon | label | right-aligned value (160px).
   * The value is color-coded green for beneficial and red for detrimental changes.
   * By default '+' prefix = green and '-' prefix = red.
   * Pass invertColor=true for parameters where lower values are better
   * (e.g. PDR, MDR, MCR, TCR, HCR), which reverses the color assignment.
   * Advances {@link currentY} by one line height.
   * @param {number} icon Icon index; pass 0 to skip.
   * @param {string} label The row label.
   * @param {string} value The value string; pass empty string when there is none.
   * @param {boolean} invertColor When true, '-' = green and '+' = red.
   */
  drawDetailRow(icon, label, value, invertColor = false)
  {
    const y = this.currentY;
    const lh = this.lineHeight();
    const iconW = ImageManager.iconWidth + 4;
    const valueW = value ? 160 : 0;
    let labelX = this.currentX + 4;

    // draw icon when one is provided.
    if (icon > 0)
    {
      this.drawIcon(icon, this.currentX, y);
      labelX = this.currentX + iconW;
    }

    const labelW = this.columnWidth - (labelX - this.currentX) - valueW;
    this.drawText(label, labelX, y, labelW);

    // draw value right-aligned with color coding.
    // for "lower is better" params the color assignment is inverted.
    if (value)
    {
      if (value.startsWith('+'))
      {
        this.changeTextColor(invertColor ? ColorManager.powerDownColor() : ColorManager.powerUpColor());
      }
      else if (value.startsWith('-'))
      {
        this.changeTextColor(invertColor ? ColorManager.powerUpColor() : ColorManager.powerDownColor());
      }
      this.drawText(value, this.currentX + this.columnWidth - valueW, y, valueW, 'right');
      this.resetTextColor();
    }

    this.currentY += lh;
  }

  /**
   * Determines whether a trait's value color should be inverted because
   * lower values are beneficial for the associated parameter.
   * Applies to sparams where reducing the rate is the desired effect:
   * MCR (Magi Cost), TCR (Tech Cost), PDR (Phys Dmg), MDR (Magi Dmg), FDR (Environ Dmg).
   * @param {RPG_Trait} trait The trait to evaluate.
   * @returns {boolean}
   */
  isInvertedTrait(trait)
  {
    // only sparam traits (code 23) can be "lower is better" in this ecosystem.
    if (trait._code !== 23) return false;

    // these sparams represent rates where lower = less cost or less damage taken = good.
    const invertedSparamIds = [4, 5, 6, 7, 8];
    return invertedSparamIds.includes(trait._dataId);
  }

  /**
   * Evaluates a formula string against the given actor and returns a display string.
   * Uses 'a' as the actor reference, matching the RMMZ formula convention.
   * Returns the formula wrapped in brackets as a fallback when no actor is available
   * or when evaluation throws.
   * @param {string} formula The formula string to evaluate (without surrounding brackets).
   * @param {Game_Actor|null} actor The actor providing the 'a' context variable.
   * @returns {string} The evaluated result, or '[formula]' on failure.
   */
  evaluateFormula(formula, actor)
  {
    // fall back to the raw formula when there is no actor context to evaluate against.
    if (!actor) return `[${formula}]`;

    try
    {
      // 'a' and 'b' are the RMMZ formula conventions for acting and target battlers.
      // for passive states, the bearer is both — there is no external attacker or target.
      const a = actor;
      const b = actor; // eslint-disable-line no-unused-vars
      // eval is intentional here — this mirrors what RMMZ does internally for damage formulas.
      const result = eval(formula);
      if (typeof result === 'number') return `${Math.round(result)}`;
      return `${result}`;
    }
    catch
    {
      return `[${formula}]`;
    }
  }

  /**
   * Returns the filtered subset of a state's traits matching a given set of codes.
   * Skips code 63 (J-JAFTING collateral-trait marker).
   * @param {RPG_State} state The state to filter traits from.
   * @param {number[]} codes The trait codes to include.
   * @returns {MV_Trait[]} The matching traits.
   */
  filterTraits(state, codes)
  {
    if (!state.traits || state.traits.length === 0) return [];
    return state.traits.filter(t => t.code !== 63 && codes.includes(t.code));
  }
  //endregion helpers

  //region state header
  /**
   * Draws the full-width state icon, name, and description at the top of the panel.
   * Explicitly ignores {@link currentX} and uses the full {@link innerWidth} so the
   * header always spans both columns.
   * @param {RPG_State} state The state to draw the header for.
   */
  drawStateHeader(state)
  {
    const { name, iconIndex, description } = state;
    const lh = this.lineHeight();

    // icon and name — full window width, always at x=0.
    this.drawIcon(iconIndex, 0, this.currentY);
    this.drawText(name, ImageManager.iconWidth + 4, this.currentY, this.innerWidth - ImageManager.iconWidth - 4);
    this.currentY += lh + 4;

    // description — full window width, always at x=0.
    this.drawTextEx(description ?? String.empty, 4, this.currentY, this.innerWidth - 4);
    this.currentY += lh * 2 + 8;
  }
  //endregion state header

  //region parameters section
  /**
   * Draws the Parameters section in the left column.
   * Covers RMMZ param/xparam/sparam traits (codes 21–23) and J-Natural
   * formula-driven buffs and growths (evaluated against the current actor).
   * Skipped when neither source has any content on this state.
   * @param {RPG_State} state The state being detailed.
   */
  drawParametersSection(state)
  {
    const paramTraits = this.filterTraits(state, [21, 22, 23]);
    const naturalLines = this.collectNaturalParamLines(state);

    if (paramTraits.length === 0 && naturalLines.length === 0) return;

    this.drawDetailSectionHeader('Parameters');

    // standard RMMZ param/xparam/sparam rows with per-stat icons.
    // sparams where lower values are beneficial get inverted color coding.
    paramTraits.forEach(rawTrait =>
    {
      const trait = new RPG_Trait(rawTrait);
      this.drawDetailRow(
        this.paramIconForTrait(trait), trait.textName(), trait.textValue(), this.isInvertedTrait(trait));
    });

    // J-Natural formula rows — icon and growth suffix supplied by collectNaturalParamLines.
    naturalLines.forEach(({ icon, label, value }) =>
    {
      this.drawDetailRow(icon, label, value);
    });

    // HCR row from J-Resources: HP cost rate reduction, displayed like MCR/TCR.
    const hcrLine = this.collectHcrLine(state);
    if (hcrLine)
    {
      this.drawDetailRow(hcrLine.icon, hcrLine.label, hcrLine.value, true);
    }

    // J-Crit rows: crit reduction and crit multiplier are combat math, not rewards.
    this.collectCritLines(state).forEach(({ icon, label, value }) =>
    {
      this.drawDetailRow(icon, label, value);
    });
  }

  /**
   * Collects the HP Cost Reduction (HCR) display row from J-Resources.
   * HCR formula evaluates to a positive reduction amount (e.g. 15 = 15% cheaper),
   * so the value is negated for display to match the MCR/TCR visual convention,
   * and invertColor is applied so the resulting '-' prefix renders green.
   * Returns null when J-Resources is not loaded or the state has no HCR tag.
   * @param {RPG_State} state The state to check.
   * @returns {{icon: number, label: string, value: string}|null}
   */
  collectHcrLine(state)
  {
    if (!J.RESOURCES) return null;

    const formula = RPGManager.getStringFromNoteByRegex(state, J.RESOURCES.RegExp.HpCostReduction);
    if (!formula) return null;

    const evaluated = Number(this.evaluateFormula(formula, this._actor));
    return {
      icon:  IconManager.param(0),
      label: 'HP Cost Rate',
      value: `-${Math.abs(evaluated)}%`,
    };
  }

  /**
   * Collects J-CriticalFactors display rows for the given state.
   * Crit Reduction reduces incoming critical damage (higher = more protection = green).
   * Crit Multiplier increases outgoing critical damage (positive = better = green).
   * Returns an empty array when J-CriticalFactors is not loaded.
   * @param {RPG_State} state The state to check.
   * @returns {Array<{icon: number, label: string, value: string}>}
   */
  collectCritLines(state)
  {
    if (!J.CRIT) return [];

    const rows = [];

    // crit reduction — protects the bearer from incoming critical hits; more is better.
    const critReduce = RPGManager.getNumberFromNoteByRegex(state, J.CRIT.RegExp.CritDamageReduction);
    if (critReduce)
    {
      rows.push({
        icon:  IconManager.xparam(3),
        label: 'Crit Reduction',
        value: `+${critReduce}`,
      });
    }

    // crit multiplier — amplifies the bearer's outgoing critical damage.
    const critMult = RPGManager.getNumberFromNoteByRegex(state, J.CRIT.RegExp.CritDamageMultiplier);
    if (critMult)
    {
      rows.push({
        icon:  IconManager.xparam(2),
        label: 'Crit Multiplier',
        value: `${critMult > 0 ? '+' : ''}${critMult}`,
      });
    }

    return rows;
  }

  /**
   * Returns the icon index for a param/xparam/sparam trait using IconManager.
   * @param {RPG_Trait} trait The trait to resolve an icon for.
   * @returns {number}
   */
  paramIconForTrait(trait)
  {
    switch (trait.code)
    {
      case 21:
        return IconManager.param(trait.dataId);
      case 22:
        return IconManager.xparam(trait.dataId);
      case 23:
        return IconManager.sparam(trait.dataId);
      default:
        return 0;
    }
  }

  /**
   * Collects J-Natural parameter formula lines for the Parameters section.
   * Each entry carries an icon from IconManager, an evaluated numeric value,
   * and a "/lv" suffix on growth-type rows to communicate that the gain
   * applies per level rather than immediately.
   * Returns an empty array when J-Natural is not loaded.
   * @param {RPG_State} state The state to check.
   * @returns {Array<{icon: number, label: string, value: string}>}
   */
  collectNaturalParamLines(state)
  {
    if (!J.NATURAL) return [];

    const lines = [];

    // each tuple: [label, regexp, iconIndex, isGrowth]
    // labels pull from TextManager so names stay consistent with parameter displays
    // elsewhere (status screen, Parameters section, etc.) and only need to be
    // updated in one place when Jeremy renames a stat.
    // isGrowth=true means the formula adds extra gain per level-up rather than
    // applying an immediate flat boost; those rows get a "/lv" suffix.
    const checks = [
      // bparams — buffs (immediate flat/rate boost to the base stat).
      [`${TextManager.param(0)} Buff+`,  J.NATURAL.RegExp.MaxLifeBuffPlus,        IconManager.param(0), false],
      [`${TextManager.param(0)} Buff%`,  J.NATURAL.RegExp.MaxLifeBuffRate,        IconManager.param(0), false],
      [`${TextManager.param(1)} Buff+`,  J.NATURAL.RegExp.MaxMagiBuffPlus,        IconManager.param(1), false],
      [`${TextManager.param(1)} Buff%`,  J.NATURAL.RegExp.MaxMagiBuffRate,        IconManager.param(1), false],
      [`${TextManager.param(2)} Buff+`,  J.NATURAL.RegExp.PowerBuffPlus,          IconManager.param(2), false],
      [`${TextManager.param(2)} Buff%`,  J.NATURAL.RegExp.PowerBuffRate,          IconManager.param(2), false],
      [`${TextManager.param(3)} Buff+`,  J.NATURAL.RegExp.DefenseBuffPlus,        IconManager.param(3), false],
      [`${TextManager.param(3)} Buff%`,  J.NATURAL.RegExp.DefenseBuffRate,        IconManager.param(3), false],
      [`${TextManager.param(4)} Buff+`,  J.NATURAL.RegExp.ForceBuffPlus,          IconManager.param(4), false],
      [`${TextManager.param(4)} Buff%`,  J.NATURAL.RegExp.ForceBuffRate,          IconManager.param(4), false],
      [`${TextManager.param(5)} Buff+`,  J.NATURAL.RegExp.ResistBuffPlus,         IconManager.param(5), false],
      [`${TextManager.param(5)} Buff%`,  J.NATURAL.RegExp.ResistBuffRate,         IconManager.param(5), false],
      [`${TextManager.param(6)} Buff+`,  J.NATURAL.RegExp.SpeedBuffPlus,          IconManager.param(6), false],
      [`${TextManager.param(6)} Buff%`,  J.NATURAL.RegExp.SpeedBuffRate,          IconManager.param(6), false],
      [`${TextManager.param(7)} Buff+`,  J.NATURAL.RegExp.LuckBuffPlus,           IconManager.param(7), false],
      [`${TextManager.param(7)} Buff%`,  J.NATURAL.RegExp.LuckBuffRate,           IconManager.param(7), false],
      // bparams — growths (additional gain applied each level-up).
      [`${TextManager.param(0)} Growth+`, J.NATURAL.RegExp.MaxLifeGrowthPlus,     IconManager.param(0), true],
      [`${TextManager.param(0)} Growth%`, J.NATURAL.RegExp.MaxLifeGrowthRate,     IconManager.param(0), true],
      [`${TextManager.param(1)} Growth+`, J.NATURAL.RegExp.MaxMagiGrowthPlus,     IconManager.param(1), true],
      [`${TextManager.param(1)} Growth%`, J.NATURAL.RegExp.MaxMagiGrowthRate,     IconManager.param(1), true],
      [`${TextManager.param(2)} Growth+`, J.NATURAL.RegExp.PowerGrowthPlus,       IconManager.param(2), true],
      [`${TextManager.param(2)} Growth%`, J.NATURAL.RegExp.PowerGrowthRate,       IconManager.param(2), true],
      [`${TextManager.param(3)} Growth+`, J.NATURAL.RegExp.DefenseGrowthPlus,     IconManager.param(3), true],
      [`${TextManager.param(3)} Growth%`, J.NATURAL.RegExp.DefenseGrowthRate,     IconManager.param(3), true],
      [`${TextManager.param(4)} Growth+`, J.NATURAL.RegExp.ForceGrowthPlus,       IconManager.param(4), true],
      [`${TextManager.param(4)} Growth%`, J.NATURAL.RegExp.ForceGrowthRate,       IconManager.param(4), true],
      [`${TextManager.param(5)} Growth+`, J.NATURAL.RegExp.ResistGrowthPlus,      IconManager.param(5), true],
      [`${TextManager.param(5)} Growth%`, J.NATURAL.RegExp.ResistGrowthRate,      IconManager.param(5), true],
      [`${TextManager.param(6)} Growth+`, J.NATURAL.RegExp.SpeedGrowthPlus,       IconManager.param(6), true],
      [`${TextManager.param(6)} Growth%`, J.NATURAL.RegExp.SpeedGrowthRate,       IconManager.param(6), true],
      [`${TextManager.param(7)} Growth+`, J.NATURAL.RegExp.LuckGrowthPlus,        IconManager.param(7), true],
      [`${TextManager.param(7)} Growth%`, J.NATURAL.RegExp.LuckGrowthRate,        IconManager.param(7), true],
      // xparams — buffs.
      [`${TextManager.xparam(0)} Buff+`,  J.NATURAL.RegExp.HitBuffPlus,           IconManager.xparam(0), false],
      [`${TextManager.xparam(0)} Buff%`,  J.NATURAL.RegExp.HitBuffRate,           IconManager.xparam(0), false],
      [`${TextManager.xparam(1)} Buff+`,  J.NATURAL.RegExp.EvadeBuffPlus,         IconManager.xparam(1), false],
      [`${TextManager.xparam(1)} Buff%`,  J.NATURAL.RegExp.EvadeBuffRate,         IconManager.xparam(1), false],
      [`${TextManager.xparam(2)} Buff+`,  J.NATURAL.RegExp.CritChanceBuffPlus,    IconManager.xparam(2), false],
      [`${TextManager.xparam(2)} Buff%`,  J.NATURAL.RegExp.CritChanceBuffRate,    IconManager.xparam(2), false],
      [`${TextManager.xparam(3)} Buff+`,  J.NATURAL.RegExp.CritEvadeBuffPlus,     IconManager.xparam(3), false],
      [`${TextManager.xparam(3)} Buff%`,  J.NATURAL.RegExp.CritEvadeBuffRate,     IconManager.xparam(3), false],
      [`${TextManager.xparam(7)} Buff+`,  J.NATURAL.RegExp.LifeRegenBuffPlus,     IconManager.xparam(7), false],
      [`${TextManager.xparam(7)} Buff%`,  J.NATURAL.RegExp.LifeRegenBuffRate,     IconManager.xparam(7), false],
      [`${TextManager.xparam(8)} Buff+`,  J.NATURAL.RegExp.MagiRegenBuffPlus,     IconManager.xparam(8), false],
      [`${TextManager.xparam(8)} Buff%`,  J.NATURAL.RegExp.MagiRegenBuffRate,     IconManager.xparam(8), false],
      [`${TextManager.xparam(9)} Buff+`,  J.NATURAL.RegExp.TechRegenBuffPlus,     IconManager.xparam(9), false],
      [`${TextManager.xparam(9)} Buff%`,  J.NATURAL.RegExp.TechRegenBuffRate,     IconManager.xparam(9), false],
      // xparams — growths.
      [`${TextManager.xparam(0)} Growth+`, J.NATURAL.RegExp.HitGrowthPlus,        IconManager.xparam(0), true],
      [`${TextManager.xparam(0)} Growth%`, J.NATURAL.RegExp.HitGrowthRate,        IconManager.xparam(0), true],
      [`${TextManager.xparam(1)} Growth+`, J.NATURAL.RegExp.EvadeGrowthPlus,      IconManager.xparam(1), true],
      [`${TextManager.xparam(1)} Growth%`, J.NATURAL.RegExp.EvadeGrowthRate,      IconManager.xparam(1), true],
      [`${TextManager.xparam(2)} Growth+`, J.NATURAL.RegExp.CritChanceGrowthPlus, IconManager.xparam(2), true],
      [`${TextManager.xparam(2)} Growth%`, J.NATURAL.RegExp.CritChanceGrowthRate, IconManager.xparam(2), true],
      [`${TextManager.xparam(7)} Growth+`, J.NATURAL.RegExp.LifeRegenGrowthPlus,  IconManager.xparam(7), true],
      [`${TextManager.xparam(7)} Growth%`, J.NATURAL.RegExp.LifeRegenGrowthRate,  IconManager.xparam(7), true],
      [`${TextManager.xparam(8)} Growth+`, J.NATURAL.RegExp.MagiRegenGrowthPlus,  IconManager.xparam(8), true],
      [`${TextManager.xparam(8)} Growth%`, J.NATURAL.RegExp.MagiRegenGrowthRate,  IconManager.xparam(8), true],
      [`${TextManager.xparam(9)} Growth+`, J.NATURAL.RegExp.TechRegenGrowthPlus,  IconManager.xparam(9), true],
      [`${TextManager.xparam(9)} Growth%`, J.NATURAL.RegExp.TechRegenGrowthRate,  IconManager.xparam(9), true],
      // sparams — buffs.
      [`${TextManager.sparam(0)} Buff+`,  J.NATURAL.RegExp.AggroBuffPlus,         IconManager.sparam(0), false],
      [`${TextManager.sparam(0)} Buff%`,  J.NATURAL.RegExp.AggroBuffRate,         IconManager.sparam(0), false],
      [`${TextManager.sparam(1)} Buff+`,  J.NATURAL.RegExp.ParryBuffPlus,         IconManager.sparam(1), false],
      [`${TextManager.sparam(1)} Buff%`,  J.NATURAL.RegExp.ParryBuffRate,         IconManager.sparam(1), false],
      [`${TextManager.sparam(2)} Buff+`,  J.NATURAL.RegExp.HealingBuffPlus,       IconManager.sparam(2), false],
      [`${TextManager.sparam(2)} Buff%`,  J.NATURAL.RegExp.HealingBuffRate,       IconManager.sparam(2), false],
      [`${TextManager.sparam(4)} Buff+`,  J.NATURAL.RegExp.MagiCostRateBuffPlus,  IconManager.sparam(4), false],
      [`${TextManager.sparam(4)} Buff%`,  J.NATURAL.RegExp.MagiCostRateBuffRate,  IconManager.sparam(4), false],
      [`${TextManager.sparam(5)} Buff+`,  J.NATURAL.RegExp.TechCostRateBuffPlus,  IconManager.sparam(5), false],
      [`${TextManager.sparam(5)} Buff%`,  J.NATURAL.RegExp.TechCostRateBuffRate,  IconManager.sparam(5), false],
      [`${TextManager.sparam(6)} Buff+`,  J.NATURAL.RegExp.PhysDmgRateBuffPlus,  IconManager.sparam(6), false],
      [`${TextManager.sparam(6)} Buff%`,  J.NATURAL.RegExp.PhysDmgRateBuffRate,  IconManager.sparam(6), false],
      [`${TextManager.sparam(7)} Buff+`,  J.NATURAL.RegExp.MagiDmgRateBuffPlus,  IconManager.sparam(7), false],
      [`${TextManager.sparam(7)} Buff%`,  J.NATURAL.RegExp.MagiDmgRateBuffRate,  IconManager.sparam(7), false],
      // sparams — growths.
      [`${TextManager.sparam(0)} Growth+`, J.NATURAL.RegExp.AggroGrowthPlus,      IconManager.sparam(0), true],
      [`${TextManager.sparam(0)} Growth%`, J.NATURAL.RegExp.AggroGrowthRate,      IconManager.sparam(0), true],
      [`${TextManager.sparam(1)} Growth+`, J.NATURAL.RegExp.ParryGrowthPlus,      IconManager.sparam(1), true],
      [`${TextManager.sparam(1)} Growth%`, J.NATURAL.RegExp.ParryGrowthRate,      IconManager.sparam(1), true],
      [`${TextManager.sparam(2)} Growth+`, J.NATURAL.RegExp.HealingGrowthPlus,    IconManager.sparam(2), true],
      [`${TextManager.sparam(2)} Growth%`, J.NATURAL.RegExp.HealingGrowthRate,    IconManager.sparam(2), true],
      [`${TextManager.sparam(4)} Growth+`, J.NATURAL.RegExp.MagiCostRateGrowthPlus, IconManager.sparam(4), true],
      [`${TextManager.sparam(4)} Growth%`, J.NATURAL.RegExp.MagiCostRateGrowthRate, IconManager.sparam(4), true],
      [`${TextManager.sparam(5)} Growth+`, J.NATURAL.RegExp.TechCostRateGrowthPlus, IconManager.sparam(5), true],
      [`${TextManager.sparam(5)} Growth%`, J.NATURAL.RegExp.TechCostRateGrowthRate, IconManager.sparam(5), true],
      [`${TextManager.sparam(6)} Growth+`, J.NATURAL.RegExp.PhysDmgRateGrowthPlus, IconManager.sparam(6), true],
      [`${TextManager.sparam(6)} Growth%`, J.NATURAL.RegExp.PhysDmgRateGrowthRate, IconManager.sparam(6), true],
      [`${TextManager.sparam(7)} Growth+`, J.NATURAL.RegExp.MagiDmgRateGrowthPlus, IconManager.sparam(7), true],
      [`${TextManager.sparam(7)} Growth%`, J.NATURAL.RegExp.MagiDmgRateGrowthRate, IconManager.sparam(7), true],
      // max tech — TP cap.
      [`${TextManager.maxTp()} Base`,    J.NATURAL.RegExp.BaseMaxTech,            IconManager.maxTp(), false],
      [`${TextManager.maxTp()} Buff+`,   J.NATURAL.RegExp.MaxTechBuffPlus,        IconManager.maxTp(), false],
      [`${TextManager.maxTp()} Buff%`,   J.NATURAL.RegExp.MaxTechBuffRate,        IconManager.maxTp(), false],
      [`${TextManager.maxTp()} Growth+`, J.NATURAL.RegExp.MaxTechGrowthPlus,      IconManager.maxTp(), true],
      [`${TextManager.maxTp()} Growth%`, J.NATURAL.RegExp.MaxTechGrowthRate,      IconManager.maxTp(), true],
    ];

    checks.forEach(([label, regexp, icon, isGrowth]) =>
    {
      const formula = RPGManager.getStringFromNoteByRegex(state, regexp);
      if (formula)
      {
        const evaluated = this.evaluateFormula(formula, this._actor);
        // growth values communicate "per level" intent rather than an immediate flat bonus.
        const value = isGrowth ? `${evaluated} /lv` : `${evaluated}`;
        lines.push({ icon, label, value });
      }
    });

    return lines;
  }
  //endregion parameters section

  //region elements section
  /**
   * Draws the Elements section in the middle column.
   * Element icons replace text names throughout — the icon is the identifier,
   * keeping the display language-agnostic.
   *
   * Element rate traits (code 11) use invertColor because a higher incoming
   * damage rate is a vulnerability, not a benefit.
   * Attack element traits (code 31) show the element icon with "Atk Element".
   * J-ELEM boost and absorb rows supply their own icon from collectElemLines.
   * Skipped when the state has no elemental content.
   * @param {RPG_State} state The state being detailed.
   */
  drawElementsSection(state)
  {
    const dmgInTraits     = this.filterTraits(state, [11]);
    const atkElemTraits   = this.filterTraits(state, [31]);
    const elemLines       = this.collectElemLines(state);

    if (dmgInTraits.length === 0 && atkElemTraits.length === 0 && elemLines.length === 0) return;

    this.drawDetailSectionHeader('Elements');

    // incoming element damage rate — element icon identifies which, "Dmg In" the direction.
    // color is inverted: + means more damage taken (bad = red), - means resistance (good = green).
    dmgInTraits.forEach(rawTrait =>
    {
      const trait = new RPG_Trait(rawTrait);
      this.drawDetailRow(IconManager.element(trait.dataId), 'Dmg In', trait.textValue(), true);
    });

    // attack element — element icon identifies which element is added to basic attacks.
    atkElemTraits.forEach(rawTrait =>
    {
      const trait = new RPG_Trait(rawTrait);
      this.drawDetailRow(
        IconManager.element(trait.dataId), 'Atk Element', TextManager.element(trait.dataId));
    });

    // J-ELEM boost and absorbed element rows — icon and label already resolved.
    elemLines.forEach(({ icon, label, value }) =>
    {
      this.drawDetailRow(icon, label, value);
    });
  }

  /**
   * Collects display rows from J-ELEM tags on the state.
   * Each row uses the element's icon as the primary identifier rather than its name.
   * Boost rows show outgoing damage amplification per element.
   * Absorbed elements produce one row each with no value — the icon is the payload.
   * Returns an empty array when J-ELEM is not loaded.
   * @param {RPG_State} state The state to check.
   * @returns {Array<{icon: number, label: string, value: string}>}
   */
  collectElemLines(state)
  {
    if (!J.ELEM) return [];

    const lines = [];

    // boost element: one row per boosted element — icon identifies it, "Boost" the effect.
    const boostCaptures = RPGManager.getAllCapturesFromNoteByRegex(state, J.ELEM.RegExp.BoostElement);
    if (boostCaptures && boostCaptures.length > 0)
    {
      boostCaptures.forEach(([rawId, rawPct]) =>
      {
        const elementId = Number(rawId);
        const pct = Number(rawPct);
        const sign = pct >= 0 ? '+' : '';
        lines.push({ icon: IconManager.element(elementId), label: 'Boost', value: `${sign}${pct}%` });
      });
    }

    // absorbed elements: one row each — icon carries the identity, no value needed.
    const absorbIds = RPGManager.getNumbersFromNoteByRegex(state, J.ELEM.RegExp.AbsorbElementIds);
    if (absorbIds && absorbIds.length > 0)
    {
      absorbIds.forEach(id =>
      {
        lines.push({ icon: IconManager.element(id), label: 'Absorbed', value: '' });
      });
    }

    return lines;
  }
  //endregion elements section

  //region ailments section
  /**
   * Draws the Ailments section in the right column.
   * Covers debuff rate (code 12), state rate (code 13), state nullify (code 14),
   * and attack state inflict (code 32).
   * @param {RPG_State} state The state being detailed.
   */
  drawAilmentsSection(state)
  {
    const ailmentTraits = this.filterTraits(state, [12, 13, 14, 32]);
    if (ailmentTraits.length === 0) return;

    this.drawDetailSectionHeader('Ailments');

    ailmentTraits.forEach(rawTrait =>
    {
      const trait = new RPG_Trait(rawTrait);
      this.drawDetailRow(this.ailmentIconForTrait(trait), trait.textName(), trait.textValue());
    });
  }

  /**
   * Returns the icon for an ailment-related trait.
   * @param {RPG_Trait} trait The trait to resolve an icon for.
   * @returns {number}
   */
  ailmentIconForTrait(trait)
  {
    switch (trait.code)
    {
      case 12:
        return IconManager.param(trait.dataId);
      case 13:
      case 14:
        return $dataStates[trait.dataId] ? $dataStates[trait.dataId].iconIndex : 0;
      case 32:
        return $dataStates[trait.dataId] ? $dataStates[trait.dataId].iconIndex : 0;
      default:
        return 0;
    }
  }
  //endregion ailments section

  //region skills section
  /**
   * Draws the Skills section in the right column.
   * Covers skill-type unlock/lock (codes 41–42) and individual skill learn/seal (codes 43–44).
   * @param {RPG_State} state The state being detailed.
   */
  drawSkillsSection(state)
  {
    const skillTraits = this.filterTraits(state, [41, 42, 43, 44]);
    if (skillTraits.length === 0) return;

    this.drawDetailSectionHeader('Skills');

    skillTraits.forEach(rawTrait =>
    {
      const trait = new RPG_Trait(rawTrait);

      // cross-reference the skill icon for learn/seal rows.
      let icon = 0;
      if (trait.code === 43 || trait.code === 44)
      {
        icon = $dataSkills[trait.dataId] ? $dataSkills[trait.dataId].iconIndex : 0;
      }

      this.drawDetailRow(icon, trait.textName(), trait.textValue());
    });
  }
  //endregion skills section

  //region equip section
  /**
   * Draws the Equip section in the right column.
   * Covers weapon/armor proficiency (codes 51–52), equip lock/seal (codes 53–54),
   * and dual-wield enable (code 55).
   * @param {RPG_State} state The state being detailed.
   */
  drawEquipSection(state)
  {
    const equipTraits = this.filterTraits(state, [51, 52, 53, 54, 55]);
    if (equipTraits.length === 0) return;

    this.drawDetailSectionHeader('Equip');

    equipTraits.forEach(rawTrait =>
    {
      const trait = new RPG_Trait(rawTrait);
      this.drawDetailRow(0, trait.textName(), trait.textValue());
    });
  }
  //endregion equip section

  //region properties section
  /**
   * Draws the Properties section in the right column.
   * Covers skill speed (code 33), attack times+ (code 34), basic-attack override
   * (code 35), action times+ (code 61), special flags (code 62), and party ability (code 64).
   * @param {RPG_State} state The state being detailed.
   */
  drawPropertiesSection(state)
  {
    const propTraits = this.filterTraits(state, [33, 34, 35, 61, 62, 64]);
    if (propTraits.length === 0) return;

    this.drawDetailSectionHeader('Properties');

    propTraits.forEach(rawTrait =>
    {
      const trait = new RPG_Trait(rawTrait);
      const icon = (trait.code === 35 && $dataSkills[trait.value])
        ? $dataSkills[trait.value].iconIndex
        : 0;
      this.drawDetailRow(icon, trait.textName(), trait.textValue());
    });
  }
  //endregion properties section

  //region rewards section
  /**
   * Draws the Rewards section in the right column.
   * Sources: J-Drops, J-Crit, J-SDP, J-Prof, J-Natural reward formulas.
   * Skipped when none have relevant tags on this state.
   * @param {RPG_State} state The state being detailed.
   */
  drawRewardsSection(state)
  {
    const rows = this.collectRewardRows(state);
    if (rows.length === 0) return;

    this.drawDetailSectionHeader('Rewards');

    rows.forEach(({ icon, label, value }) =>
    {
      this.drawDetailRow(icon, label, value);
    });
  }

  /**
   * Collects all reward row data from the various reward-contributing plugins.
   * @param {RPG_State} state The state to check.
   * @returns {Array<{icon: number, label: string, value: string}>}
   */
  collectRewardRows(state)
  {
    const rows = [];

    if (J.DROPS)
    {
      const dropMult = RPGManager.getNumberFromNoteByRegex(state, J.DROPS.RegExp.DropMultiplier);
      if (dropMult)
      {
        rows.push({ icon: 0, label: 'Drop Rate', value: `${dropMult > 0 ? '+' : ''}${dropMult}%` });
      }

      const goldMult = RPGManager.getNumberFromNoteByRegex(state, J.DROPS.RegExp.GoldMultiplier);
      if (goldMult)
      {
        rows.push({ icon: 0, label: 'Gold', value: `${goldMult > 0 ? '+' : ''}${goldMult}%` });
      }
    }

    if (J.SDP)
    {
      const sdpMult = RPGManager.getNumberFromNoteByRegex(state, J.SDP.RegExp.SdpMultiplier);
      if (sdpMult)
      {
        rows.push({ icon: 0, label: 'SDP Points', value: `${sdpMult > 0 ? '+' : ''}${sdpMult}%` });
      }
    }

    if (J.PROF)
    {
      const profBonus = RPGManager.getNumberFromNoteByRegex(state, J.PROF.RegExp.ProficiencyBonus);
      if (profBonus) rows.push({ icon: 0, label: 'Proficiency Bonus', value: `+${profBonus}` });
    }

    if (J.NATURAL)
    {
      const expFormula = RPGManager.getStringFromNoteByRegex(state, J.NATURAL.RegExp.RewardExp);
      if (expFormula)
      {
        rows.push({ icon: 0, label: 'EXP Bonus', value: this.evaluateFormula(expFormula, this._actor) });
      }

      const goldFormula = RPGManager.getStringFromNoteByRegex(state, J.NATURAL.RegExp.RewardGold);
      if (goldFormula)
      {
        rows.push({ icon: 0, label: 'Gold Bonus', value: this.evaluateFormula(goldFormula, this._actor) });
      }

      const sdpFormula = RPGManager.getStringFromNoteByRegex(state, J.NATURAL.RegExp.RewardSdps);
      if (sdpFormula)
      {
        rows.push({ icon: 0, label: 'SDP Bonus', value: this.evaluateFormula(sdpFormula, this._actor) });
      }
    }

    return rows;
  }
  //endregion rewards section
  //endregion draw
}
//endregion Window_PassiveDetail