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
   * The value is color-coded green for '+' prefix and red for '-' prefix.
   * Advances {@link currentY} by one line height.
   * @param {number} icon Icon index; pass 0 to skip.
   * @param {string} label The row label.
   * @param {string} value The value string; pass empty string when there is none.
   */
  drawDetailRow(icon, label, value)
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
    if (value)
    {
      if (value.startsWith('+')) this.changeTextColor(ColorManager.powerUpColor());
      else if (value.startsWith('-')) this.changeTextColor(ColorManager.powerDownColor());
      this.drawText(value, this.currentX + this.columnWidth - valueW, y, valueW, 'right');
      this.resetTextColor();
    }

    this.currentY += lh;
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
    paramTraits.forEach(rawTrait =>
    {
      const trait = new RPG_Trait(rawTrait);
      this.drawDetailRow(this.paramIconForTrait(trait), trait.textName(), trait.textValue());
    });

    // J-Natural formula rows — icon and growth suffix supplied by collectNaturalParamLines.
    naturalLines.forEach(({ icon, label, value }) =>
    {
      this.drawDetailRow(icon, label, value);
    });
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
    // iconIndex comes from IconManager so the stat is immediately recognizable.
    // isGrowth=true means the formula contributes additional gain per level,
    // not an immediate flat addition; we suffix the value with "/lv" to reflect that.
    const p = IconManager.param;
    const x = IconManager.xparam;
    const s = IconManager.sparam;
    const checks = [
      // bparams — buffs (immediate flat/rate boost to the base stat).
      ['Life Buff+',       J.NATURAL.RegExp.MaxLifeBuffPlus,        p.call(IconManager, 0), false],
      ['Life Buff%',       J.NATURAL.RegExp.MaxLifeBuffRate,        p.call(IconManager, 0), false],
      ['Magi Buff+',       J.NATURAL.RegExp.MaxMagiBuffPlus,        p.call(IconManager, 1), false],
      ['Magi Buff%',       J.NATURAL.RegExp.MaxMagiBuffRate,        p.call(IconManager, 1), false],
      ['Power Buff+',      J.NATURAL.RegExp.PowerBuffPlus,          p.call(IconManager, 2), false],
      ['Power Buff%',      J.NATURAL.RegExp.PowerBuffRate,          p.call(IconManager, 2), false],
      ['Defense Buff+',    J.NATURAL.RegExp.DefenseBuffPlus,        p.call(IconManager, 3), false],
      ['Defense Buff%',    J.NATURAL.RegExp.DefenseBuffRate,        p.call(IconManager, 3), false],
      ['Force Buff+',      J.NATURAL.RegExp.ForceBuffPlus,          p.call(IconManager, 4), false],
      ['Force Buff%',      J.NATURAL.RegExp.ForceBuffRate,          p.call(IconManager, 4), false],
      ['Resist Buff+',     J.NATURAL.RegExp.ResistBuffPlus,         p.call(IconManager, 5), false],
      ['Resist Buff%',     J.NATURAL.RegExp.ResistBuffRate,         p.call(IconManager, 5), false],
      ['Speed Buff+',      J.NATURAL.RegExp.SpeedBuffPlus,          p.call(IconManager, 6), false],
      ['Speed Buff%',      J.NATURAL.RegExp.SpeedBuffRate,          p.call(IconManager, 6), false],
      ['Luck Buff+',       J.NATURAL.RegExp.LuckBuffPlus,           p.call(IconManager, 7), false],
      ['Luck Buff%',       J.NATURAL.RegExp.LuckBuffRate,           p.call(IconManager, 7), false],
      // bparams — growths (additional gain applied each level-up).
      ['Life Growth+',     J.NATURAL.RegExp.MaxLifeGrowthPlus,      p.call(IconManager, 0), true],
      ['Life Growth%',     J.NATURAL.RegExp.MaxLifeGrowthRate,      p.call(IconManager, 0), true],
      ['Magi Growth+',     J.NATURAL.RegExp.MaxMagiGrowthPlus,      p.call(IconManager, 1), true],
      ['Magi Growth%',     J.NATURAL.RegExp.MaxMagiGrowthRate,      p.call(IconManager, 1), true],
      ['Power Growth+',    J.NATURAL.RegExp.PowerGrowthPlus,        p.call(IconManager, 2), true],
      ['Power Growth%',    J.NATURAL.RegExp.PowerGrowthRate,        p.call(IconManager, 2), true],
      ['Defense Growth+',  J.NATURAL.RegExp.DefenseGrowthPlus,      p.call(IconManager, 3), true],
      ['Defense Growth%',  J.NATURAL.RegExp.DefenseGrowthRate,      p.call(IconManager, 3), true],
      ['Force Growth+',    J.NATURAL.RegExp.ForceGrowthPlus,        p.call(IconManager, 4), true],
      ['Force Growth%',    J.NATURAL.RegExp.ForceGrowthRate,        p.call(IconManager, 4), true],
      ['Resist Growth+',   J.NATURAL.RegExp.ResistGrowthPlus,       p.call(IconManager, 5), true],
      ['Resist Growth%',   J.NATURAL.RegExp.ResistGrowthRate,       p.call(IconManager, 5), true],
      ['Speed Growth+',    J.NATURAL.RegExp.SpeedGrowthPlus,        p.call(IconManager, 6), true],
      ['Speed Growth%',    J.NATURAL.RegExp.SpeedGrowthRate,        p.call(IconManager, 6), true],
      ['Luck Growth+',     J.NATURAL.RegExp.LuckGrowthPlus,         p.call(IconManager, 7), true],
      ['Luck Growth%',     J.NATURAL.RegExp.LuckGrowthRate,         p.call(IconManager, 7), true],
      // xparams — buffs.
      ['Hit Buff+',        J.NATURAL.RegExp.HitBuffPlus,            x.call(IconManager, 0), false],
      ['Hit Buff%',        J.NATURAL.RegExp.HitBuffRate,            x.call(IconManager, 0), false],
      ['Evade Buff+',      J.NATURAL.RegExp.EvadeBuffPlus,          x.call(IconManager, 1), false],
      ['Evade Buff%',      J.NATURAL.RegExp.EvadeBuffRate,          x.call(IconManager, 1), false],
      ['Crit Buff+',       J.NATURAL.RegExp.CritChanceBuffPlus,     x.call(IconManager, 2), false],
      ['Crit Buff%',       J.NATURAL.RegExp.CritChanceBuffRate,     x.call(IconManager, 2), false],
      ['Crit Evade Buff+', J.NATURAL.RegExp.CritEvadeBuffPlus,      x.call(IconManager, 3), false],
      ['Crit Evade Buff%', J.NATURAL.RegExp.CritEvadeBuffRate,      x.call(IconManager, 3), false],
      ['HP Regen Buff+',   J.NATURAL.RegExp.LifeRegenBuffPlus,      x.call(IconManager, 7), false],
      ['HP Regen Buff%',   J.NATURAL.RegExp.LifeRegenBuffRate,      x.call(IconManager, 7), false],
      ['MP Regen Buff+',   J.NATURAL.RegExp.MagiRegenBuffPlus,      x.call(IconManager, 8), false],
      ['MP Regen Buff%',   J.NATURAL.RegExp.MagiRegenBuffRate,      x.call(IconManager, 8), false],
      ['TP Regen Buff+',   J.NATURAL.RegExp.TechRegenBuffPlus,      x.call(IconManager, 9), false],
      ['TP Regen Buff%',   J.NATURAL.RegExp.TechRegenBuffRate,      x.call(IconManager, 9), false],
      // xparams — growths.
      ['Hit Growth+',      J.NATURAL.RegExp.HitGrowthPlus,          x.call(IconManager, 0), true],
      ['Hit Growth%',      J.NATURAL.RegExp.HitGrowthRate,          x.call(IconManager, 0), true],
      ['Evade Growth+',    J.NATURAL.RegExp.EvadeGrowthPlus,        x.call(IconManager, 1), true],
      ['Evade Growth%',    J.NATURAL.RegExp.EvadeGrowthRate,        x.call(IconManager, 1), true],
      ['Crit Growth+',     J.NATURAL.RegExp.CritChanceGrowthPlus,   x.call(IconManager, 2), true],
      ['Crit Growth%',     J.NATURAL.RegExp.CritChanceGrowthRate,   x.call(IconManager, 2), true],
      ['HP Regen Growth+', J.NATURAL.RegExp.LifeRegenGrowthPlus,    x.call(IconManager, 7), true],
      ['HP Regen Growth%', J.NATURAL.RegExp.LifeRegenGrowthRate,    x.call(IconManager, 7), true],
      ['MP Regen Growth+', J.NATURAL.RegExp.MagiRegenGrowthPlus,    x.call(IconManager, 8), true],
      ['MP Regen Growth%', J.NATURAL.RegExp.MagiRegenGrowthRate,    x.call(IconManager, 8), true],
      ['TP Regen Growth+', J.NATURAL.RegExp.TechRegenGrowthPlus,    x.call(IconManager, 9), true],
      ['TP Regen Growth%', J.NATURAL.RegExp.TechRegenGrowthRate,    x.call(IconManager, 9), true],
      // sparams — buffs.
      ['Aggro Buff+',      J.NATURAL.RegExp.AggroBuffPlus,          s.call(IconManager, 0), false],
      ['Aggro Buff%',      J.NATURAL.RegExp.AggroBuffRate,          s.call(IconManager, 0), false],
      ['Parry Buff+',      J.NATURAL.RegExp.ParryBuffPlus,          s.call(IconManager, 1), false],
      ['Parry Buff%',      J.NATURAL.RegExp.ParryBuffRate,          s.call(IconManager, 1), false],
      ['Healing Buff+',    J.NATURAL.RegExp.HealingBuffPlus,        s.call(IconManager, 2), false],
      ['Healing Buff%',    J.NATURAL.RegExp.HealingBuffRate,        s.call(IconManager, 2), false],
      ['MP Cost Buff+',    J.NATURAL.RegExp.MagiCostRateBuffPlus,   s.call(IconManager, 4), false],
      ['MP Cost Buff%',    J.NATURAL.RegExp.MagiCostRateBuffRate,   s.call(IconManager, 4), false],
      ['TP Cost Buff+',    J.NATURAL.RegExp.TechCostRateBuffPlus,   s.call(IconManager, 5), false],
      ['TP Cost Buff%',    J.NATURAL.RegExp.TechCostRateBuffRate,   s.call(IconManager, 5), false],
      ['Phys Dmg Buff+',   J.NATURAL.RegExp.PhysDmgRateBuffPlus,   s.call(IconManager, 6), false],
      ['Phys Dmg Buff%',   J.NATURAL.RegExp.PhysDmgRateBuffRate,   s.call(IconManager, 6), false],
      ['Magi Dmg Buff+',   J.NATURAL.RegExp.MagiDmgRateBuffPlus,   s.call(IconManager, 7), false],
      ['Magi Dmg Buff%',   J.NATURAL.RegExp.MagiDmgRateBuffRate,   s.call(IconManager, 7), false],
      // sparams — growths.
      ['Aggro Growth+',    J.NATURAL.RegExp.AggroGrowthPlus,        s.call(IconManager, 0), true],
      ['Aggro Growth%',    J.NATURAL.RegExp.AggroGrowthRate,        s.call(IconManager, 0), true],
      ['Parry Growth+',    J.NATURAL.RegExp.ParryGrowthPlus,        s.call(IconManager, 1), true],
      ['Parry Growth%',    J.NATURAL.RegExp.ParryGrowthRate,        s.call(IconManager, 1), true],
      ['Healing Growth+',  J.NATURAL.RegExp.HealingGrowthPlus,      s.call(IconManager, 2), true],
      ['Healing Growth%',  J.NATURAL.RegExp.HealingGrowthRate,      s.call(IconManager, 2), true],
      ['MP Cost Growth+',  J.NATURAL.RegExp.MagiCostRateGrowthPlus, s.call(IconManager, 4), true],
      ['MP Cost Growth%',  J.NATURAL.RegExp.MagiCostRateGrowthRate, s.call(IconManager, 4), true],
      ['TP Cost Growth+',  J.NATURAL.RegExp.TechCostRateGrowthPlus, s.call(IconManager, 5), true],
      ['TP Cost Growth%',  J.NATURAL.RegExp.TechCostRateGrowthRate, s.call(IconManager, 5), true],
      ['Phys Dmg Growth+', J.NATURAL.RegExp.PhysDmgRateGrowthPlus,  s.call(IconManager, 6), true],
      ['Phys Dmg Growth%', J.NATURAL.RegExp.PhysDmgRateGrowthRate,  s.call(IconManager, 6), true],
      ['Magi Dmg Growth+', J.NATURAL.RegExp.MagiDmgRateGrowthPlus,  s.call(IconManager, 7), true],
      ['Magi Dmg Growth%', J.NATURAL.RegExp.MagiDmgRateGrowthRate,  s.call(IconManager, 7), true],
      // max tech — TP cap.
      ['Max Tech Base',    J.NATURAL.RegExp.BaseMaxTech,            IconManager.maxTp(),    false],
      ['Max Tech Buff+',   J.NATURAL.RegExp.MaxTechBuffPlus,        IconManager.maxTp(),    false],
      ['Max Tech Buff%',   J.NATURAL.RegExp.MaxTechBuffRate,        IconManager.maxTp(),    false],
      ['Max Tech Growth+', J.NATURAL.RegExp.MaxTechGrowthPlus,      IconManager.maxTp(),    true],
      ['Max Tech Growth%', J.NATURAL.RegExp.MaxTechGrowthRate,      IconManager.maxTp(),    true],
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
   * Draws the Elements section in the left column.
   * Covers RMMZ element rate traits (code 11), attack element traits (code 31),
   * and J-ELEM boost/absorb tags.
   * Skipped when the state has no elemental content.
   * @param {RPG_State} state The state being detailed.
   */
  drawElementsSection(state)
  {
    const elementTraits = this.filterTraits(state, [11, 31]);
    const elemLines = this.collectElemLines(state);

    if (elementTraits.length === 0 && elemLines.length === 0) return;

    this.drawDetailSectionHeader('Elements');

    elementTraits.forEach(rawTrait =>
    {
      const trait = new RPG_Trait(rawTrait);
      this.drawDetailRow(0, trait.textName(), trait.textValue());
    });

    elemLines.forEach(({ label, value }) =>
    {
      this.drawDetailRow(0, label, value);
    });
  }

  /**
   * Collects display lines from J-ELEM tags on the state.
   * Returns an empty array when J-ELEM is not loaded.
   * @param {RPG_State} state The state to check.
   * @returns {Array<{label: string, value: string}>}
   */
  collectElemLines(state)
  {
    if (!J.ELEM) return [];

    const lines = [];

    const boostCaptures = RPGManager.getAllCapturesFromNoteByRegex(state, J.ELEM.RegExp.BoostElement);
    if (boostCaptures && boostCaptures.length > 0)
    {
      boostCaptures.forEach(([rawId, rawPct]) =>
      {
        const elementId = Number(rawId);
        const pct = Number(rawPct);
        const name = $dataSystem.elements[elementId] ?? `Element #${elementId}`;
        const sign = pct >= 0 ? '+' : '';
        lines.push({ label: `${name} Dmg Out`, value: `${sign}${pct}%` });
      });
    }

    const absorbIds = RPGManager.getNumbersFromNoteByRegex(state, J.ELEM.RegExp.AbsorbElementIds);
    if (absorbIds && absorbIds.length > 0)
    {
      const names = absorbIds
        .map(id => $dataSystem.elements[id] ?? `Element #${id}`)
        .join(', ');
      lines.push({ label: 'Absorbs', value: names });
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

    if (J.CRIT)
    {
      const critReduce = RPGManager.getNumberFromNoteByRegex(state, J.CRIT.RegExp.CritDamageReduction);
      if (critReduce) rows.push({ icon: 0, label: 'Crit Reduction', value: `${critReduce}` });

      const critMult = RPGManager.getNumberFromNoteByRegex(state, J.CRIT.RegExp.CritDamageMultiplier);
      if (critMult)
      {
        rows.push({ icon: 0, label: 'Crit Multiplier', value: `${critMult > 0 ? '+' : ''}${critMult}` });
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