//region Window_PassiveDetail
/**
 * Extends {@link Window_PassiveDetail#drawCombatSection}.<br/>
 * Injects JABS combat, shield, and stacking sections into the passive detail
 * window. These draw before the core sections so combat effects appear first.
 * All methods read and advance {@link Window_PassiveDetail#currentY} directly —
 * no y threading through method signatures.
 */
J.PASSIVE.EXT.AFFIX.Aliased.Window_PassiveDetail.set(
  'drawCombatSection',
  Window_PassiveDetail.prototype.drawCombatSection);
Window_PassiveDetail.prototype.drawCombatSection = function(state)
{
  // perform original logic (core stub — no-op).
  J.PASSIVE.EXT.AFFIX.Aliased.Window_PassiveDetail
    .get('drawCombatSection')
    .call(this, state);

  // draw JABS combat effects: ailments, slip, modifiers, timing extensions.
  this.drawJabsCombatSection(state);

  // draw JABS shield data when J-ABS-Ext-Shield is loaded.
  this.drawJabsShieldSection(state);

  // draw JABS reapplication / stacking config when present.
  this.drawJabsStackingSection(state);
};

/**
 * Draws the JABS Combat section.
 * Skipped when the state has no JABS combat content.
 * @param {RPG_State} state The state being detailed.
 */
Window_PassiveDetail.prototype.drawJabsCombatSection = function(state)
{
  const rows = this.collectJabsCombatRows(state);
  if (rows.length === 0) return;

  this.drawDetailSectionHeader('Combat');

  rows.forEach(({ icon, label, value }) =>
  {
    this.drawDetailRow(icon, label, value);
  });
};

/**
 * Collects all JABS combat display rows for the given state.
 * Delegates to focused sub-collectors to stay within complexity limits.
 * @param {RPG_State} state The state to check.
 * @returns {Array<{icon: number, label: string, value: string}>}
 */
Window_PassiveDetail.prototype.collectJabsCombatRows = function(state)
{
  const rows = [];

  // status ailments and slip damage/regen.
  rows.push(...this.collectJabsAilmentRows(state));

  // on-attack and on-hit resource gains from J-Resources-ABS.
  rows.push(...this.collectResourcesAbsRows(state));

  // aggro, offhand, vision, retaliation, bonus hits, speed, gap close.
  rows.push(...this.collectJabsModifierRows(state));

  // cast time, cooldown, on-cast state, duration formula.
  rows.push(...this.collectJabsTimingRows(state));

  return rows;
};

/**
 * Collects JABS ailment and slip rows for the given state.
 * Covers the five status ailment flags and HP/MP/TP slip (percent or formula).
 * @param {RPG_State} state The state to check.
 * @returns {Array<{icon: number, label: string, value: string}>}
 */
Window_PassiveDetail.prototype.collectJabsAilmentRows = function(state)
{
  const rows = [];

  // status ailments: boolean constraint flags.
  if (state.jabsParalyzed) rows.push({ icon: 0, label: 'Paralyzed', value: '(rooted + muted + disabled)' });
  if (state.jabsRooted)    rows.push({ icon: 0, label: 'Rooted',    value: '(cannot move)' });
  if (state.jabsMuted)     rows.push({ icon: 0, label: 'Muted',     value: '(no cast skills)' });
  if (state.jabsDisarmed)  rows.push({ icon: 0, label: 'Disabled',  value: '(no basic attack)' });
  if (state.jabsNegative)  rows.push({ icon: 0, label: 'Negative',  value: '(AI tries to remove)' });

  // slip damage/regen — percent-based takes priority over formula-based.
  const slipHpPct  = state.jabsSlipHpPercentPerFive;
  const slipMpPct  = state.jabsSlipMpPercentPerFive;
  const slipTpPct  = state.jabsSlipTpPercentPerFive;
  const slipHpForm = state.jabsSlipHpFormulaPerFive;
  const slipMpForm = state.jabsSlipMpFormulaPerFive;
  const slipTpForm = state.jabsSlipTpFormulaPerFive;

  // percent-based values are already a plain number; formula-based values are evaluated
  // against the current actor so the player sees an actual quantity, not raw code.
  // In JABS slip convention, negative values are healing and positive values are damage.
  // TraitManager.slipName/slipIcon handle direction via sign; the displayed value is
  // always shown as a positive magnitude so regen reads as "+55 / 5s" not "-55 / 5s".
  if (slipHpPct)
  {
    rows.push({
      icon:  TraitManager.slipIcon('hp', slipHpPct),
      label: TraitManager.slipName('hp', slipHpPct),
      value: `+${Math.abs(slipHpPct)}% / 5s`,
    });
  }
  else if (slipHpForm)
  {
    const hpEval = this.evaluateFormula(slipHpForm, this._actor);
    rows.push({
      icon:  TraitManager.slipIcon('hp', Number(hpEval)),
      label: TraitManager.slipName('hp', Number(hpEval)),
      value: `+${Math.abs(Number(hpEval))} / 5s`,
    });
  }

  if (slipMpPct)
  {
    rows.push({
      icon:  TraitManager.slipIcon('mp', slipMpPct),
      label: TraitManager.slipName('mp', slipMpPct),
      value: `+${Math.abs(slipMpPct)}% / 5s`,
    });
  }
  else if (slipMpForm)
  {
    const mpEval = this.evaluateFormula(slipMpForm, this._actor);
    rows.push({
      icon:  TraitManager.slipIcon('mp', Number(mpEval)),
      label: TraitManager.slipName('mp', Number(mpEval)),
      value: `+${Math.abs(Number(mpEval))} / 5s`,
    });
  }

  if (slipTpPct)
  {
    rows.push({
      icon:  TraitManager.slipIcon('tp', slipTpPct),
      label: TraitManager.slipName('tp', slipTpPct),
      value: `+${Math.abs(slipTpPct)}% / 5s`,
    });
  }
  else if (slipTpForm)
  {
    const tpEval = this.evaluateFormula(slipTpForm, this._actor);
    rows.push({
      icon:  TraitManager.slipIcon('tp', Number(tpEval)),
      label: TraitManager.slipName('tp', Number(tpEval)),
      value: `+${Math.abs(Number(tpEval))} / 5s`,
    });
  }

  return rows;
};

/**
 * Collects resource gain rows from J-Resources-ABS for the given state.
 * Covers HP/MP/TP gains that fire on a successful attack and gains that fire
 * when the bearer takes damage. Each resource type supports flat, percent, and
 * formula variants; the first present variant wins per resource per trigger.
 * Returns an empty array when J-Resources-ABS is not loaded.
 * @param {RPG_State} state The state to check.
 * @returns {Array<{icon: number, label: string, value: string}>}
 */
Window_PassiveDetail.prototype.collectResourcesAbsRows = function(state)
{
  if (!J.RESOURCES || !J.RESOURCES.EXT || !J.RESOURCES.EXT.ABS) return [];

  const rows = [];
  const rx = J.RESOURCES.EXT.ABS.RegExp;

  // each entry: [flatRx, pctRx, formRx, label, icon]
  const checks = [
    [rx.OnAttackHpGainFlat, rx.OnAttackHpGainPercent, rx.OnAttackHpGainFormula,
      `On-Attack ${TextManager.resource(0)}`, IconManager.param(0)],
    [rx.OnAttackMpGainFlat, rx.OnAttackMpGainPercent, rx.OnAttackMpGainFormula,
      `On-Attack ${TextManager.resource(1)}`, IconManager.param(1)],
    [rx.OnAttackTpGainFlat, rx.OnAttackTpGainPercent, rx.OnAttackTpGainFormula,
      `On-Attack ${TextManager.resource(30)}`, IconManager.maxTp()],
    [rx.WhenHitHpGainFlat, rx.WhenHitHpGainPercent, rx.WhenHitHpGainFormula,
      `When-Hit ${TextManager.resource(0)}`, IconManager.param(0)],
    [rx.WhenHitMpGainFlat, rx.WhenHitMpGainPercent, rx.WhenHitMpGainFormula,
      `When-Hit ${TextManager.resource(1)}`, IconManager.param(1)],
    [rx.WhenHitTpGainFlat, rx.WhenHitTpGainPercent, rx.WhenHitTpGainFormula,
      `When-Hit ${TextManager.resource(30)}`, IconManager.maxTp()],
  ];

  checks.forEach(([flatRx, pctRx, formRx, label, icon]) =>
  {
    const row = this.collectResourceGainRow(state, flatRx, pctRx, formRx, label, icon);
    if (row) rows.push(row);
  });

  return rows;
};

/**
 * Resolves a resource gain row from a flat/percent/formula tag triplet.
 * Checks flat first, then percent, then formula; returns the first match as a
 * display row or null when none of the three tags are present on the state.
 * @param {RPG_State} state The state to check.
 * @param {RegExp} flatRx Regexp for the flat gain tag.
 * @param {RegExp} pctRx Regexp for the percent gain tag.
 * @param {RegExp} formRx Regexp for the formula gain tag.
 * @param {string} label The display label for this row.
 * @param {number} icon The icon index for this row.
 * @returns {{icon: number, label: string, value: string}|null}
 */
Window_PassiveDetail.prototype.collectResourceGainRow = function(state, flatRx, pctRx, formRx, label, icon)
{
  const flat = RPGManager.getNumberFromNoteByRegex(state, flatRx);
  if (flat) return { icon, label, value: `+${flat}` };

  const pct = RPGManager.getNumberFromNoteByRegex(state, pctRx);
  if (pct) return { icon, label, value: `+${pct}%` };

  const form = RPGManager.getStringFromNoteByRegex(state, formRx);
  if (form)
  {
    const evaluated = this.evaluateFormula(form, this._actor);
    return { icon, label, value: `+${Math.abs(Number(evaluated))}` };
  }

  return null;
};

/**
 * Collects JABS battler-modifier rows for the given state.
 * Covers aggro, offhand skill, vision, retaliation, bonus hits (three scopes),
 * parry ignore, speed boost (ext-speed), and gap-close target (ext-tools).
 * @param {RPG_State} state The state to check.
 * @returns {Array<{icon: number, label: string, value: string}>}
 */
Window_PassiveDetail.prototype.collectJabsModifierRows = function(state)
{
  const rows = [];

  // aggro — threat scaling multiplier.
  const aggroOut = state.jabsAggroOutAmp;
  if (aggroOut) rows.push({ icon: 0, label: 'Aggro Out', value: `x${aggroOut}` });

  // offhand skill override.
  const offhandId = state.jabsOffhandSkillId;
  if (offhandId)
  {
    const skill = $dataSkills[offhandId];
    rows.push({
      icon: skill ? skill.iconIndex : 0,
      label: 'Offhand',
      value: skill ? skill.name : `Skill #${offhandId}`,
    });
  }

  // vision range modifier.
  const visionMult = RPGManager.getNumberFromNoteByRegex(state, J.ABS.RegExp.VisionMultiplier);
  if (visionMult)
  {
    const sign = visionMult > 0 ? '+' : '';
    rows.push({ icon: 0, label: 'Vision', value: `${sign}${visionMult}%` });
  }

  // retaliation: skill + chance on being struck.
  const retaliateData = RPGManager.getNumbersFromNoteByRegex(state, J.ABS.RegExp.Retaliate);
  if (retaliateData && retaliateData.length >= 2)
  {
    const [retSkillId, retChance] = retaliateData;
    const retSkill = $dataSkills[retSkillId];
    rows.push({
      icon: retSkill ? retSkill.iconIndex : 0,
      label: 'Retaliate',
      value: `${retSkill ? retSkill.name : `Skill #${retSkillId}`} at ${retChance}%`,
    });
  }

  // bonus hits (three scope variants).
  const bonusGlobal = state.jabsBonusHitsScopeGlobal;
  const bonusBasic  = state.jabsBonusHitsScopeBasic;
  const bonusSkill  = state.jabsBonusHitsScopeSkill;
  if (bonusGlobal) rows.push({ icon: 0, label: 'Bonus Hits (all)',    value: `+${bonusGlobal}` });
  if (bonusBasic)  rows.push({ icon: 0, label: 'Bonus Hits (basic)',  value: `+${bonusBasic}` });
  if (bonusSkill)  rows.push({ icon: 0, label: 'Bonus Hits (skills)', value: `+${bonusSkill}` });

  // parry ignore — bearer's attacks bypass the target's guard.
  const ignoresParry = RPGManager.checkForBooleanFromNoteByRegex(state, J.ABS.RegExp.Unparryable);
  if (ignoresParry) rows.push({ icon: 0, label: 'Ignore Parry', value: '' });

  // movement speed boost from J-ABS-Ext-Speed.
  if (J.ABS.EXT.SPEED)
  {
    const speedBoost = RPGManager.getNumberFromNoteByRegex(state, J.ABS.EXT.SPEED.RegExp.WalkSpeedBoost);
    if (speedBoost)
    {
      const sign = speedBoost > 0 ? '+' : '';
      rows.push({ icon: 0, label: 'Speed Boost', value: `${sign}${speedBoost}` });
    }
  }

  // gap-close targeting — this battler can be gap-closed to.
  if (J.ABS.EXT.TOOLS)
  {
    const isTarget = RPGManager.checkForBooleanFromNoteByRegex(
      state, J.ABS.EXT.TOOLS.RegExp.GapCloseTarget);
    if (isTarget) rows.push({ icon: 0, label: 'Gap Close Target', value: '' });
  }

  return rows;
};

/**
 * Collects JABS timing and extension rows for the given state.
 * Covers cast time modifiers (ext-timing), cooldown modifiers (ext-timing),
 * on-cast self state (J-Extend), and state duration formula.
 * @param {RPG_State} state The state to check.
 * @returns {Array<{icon: number, label: string, value: string}>}
 */
Window_PassiveDetail.prototype.collectJabsTimingRows = function(state)
{
  const rows = [];

  // cast time and fast cooldown modifiers from J-ABS-Ext-Timing.
  // timing formulas use 'a' (the actor), so evaluate them for a human-readable value.
  if (J.ABS.EXT.TIMING)
  {
    const castFlat = RPGManager.getStringFromNoteByRegex(state, J.ABS.EXT.TIMING.RegExp.CastSpeedFlat);
    if (castFlat)
    {
      rows.push({ icon: 0, label: 'Cast Time Flat', value: `${this.evaluateFormula(castFlat, this._actor)}` });
    }

    const castRate = RPGManager.getStringFromNoteByRegex(state, J.ABS.EXT.TIMING.RegExp.CastSpeedRate);
    if (castRate)
    {
      rows.push({ icon: 0, label: 'Cast Time Rate', value: `${this.evaluateFormula(castRate, this._actor)}%` });
    }

    const cdFlat = RPGManager.getStringFromNoteByRegex(state, J.ABS.EXT.TIMING.RegExp.FastCooldownFlat);
    if (cdFlat)
    {
      rows.push({ icon: 0, label: 'Cooldown Flat', value: `${this.evaluateFormula(cdFlat, this._actor)}` });
    }

    const cdRate = RPGManager.getStringFromNoteByRegex(state, J.ABS.EXT.TIMING.RegExp.FastCooldownRate);
    if (cdRate)
    {
      rows.push({ icon: 0, label: 'Cooldown Rate', value: `${this.evaluateFormula(cdRate, this._actor)}%` });
    }
  }

  // on-cast self state from J-Extend.
  if (J.EXTEND)
  {
    const onCastData = RPGManager.getNumbersFromNoteByRegex(state, J.EXTEND.RegExp.OnCastSelfState);
    if (onCastData && onCastData.length >= 2)
    {
      const [castStateId, castChance] = onCastData;
      const castState = $dataStates[castStateId];
      rows.push({
        icon: castState ? castState.iconIndex : 0,
        label: 'On Cast',
        value: `${castState ? castState.name : `State #${castStateId}`} at ${castChance}%`,
      });
    }
  }

  // state duration formula modifier — 'a' is the applying actor; evaluate to show multiplier.
  const durationForm = RPGManager.getStringFromNoteByRegex(state, J.ABS.RegExp.StateDurationFormulaPlus);
  if (durationForm)
  {
    rows.push({ icon: 0, label: 'Duration', value: `x${this.evaluateFormula(durationForm, this._actor)}` });
  }

  return rows;
};

/**
 * Draws the JABS Shield section when J-ABS-Ext-Shield is loaded and the state
 * has shield-related tags. Skipped otherwise.
 * @param {RPG_State} state The state being detailed.
 */
Window_PassiveDetail.prototype.drawJabsShieldSection = function(state)
{
  // ext-shield isn't loaded; nothing to show.
  if (!J.ABS.EXT.SHIELD) return;

  const rows = [];

  // shield points derived from a formula — evaluated as self vs. self since the bearer
  // of a permanent passive state is both the acting and target battler.
  const shieldFormula = RPGManager.getStringFromNoteByRegex(
    state, J.ABS.EXT.SHIELD.RegExp.ShieldPointsFormula);
  if (shieldFormula)
  {
    rows.push({ icon: 0, label: 'Shield', value: `${this.evaluateFormula(shieldFormula, this._actor)}` });
  }

  // protect mode prevents overflow damage on shield break.
  const shieldProtect = RPGManager.checkForBooleanFromNoteByRegex(
    state, J.ABS.EXT.SHIELD.RegExp.Protect);
  if (shieldProtect) rows.push({ icon: 0, label: 'Shield Protect', value: '(no overflow dmg)' });

  if (rows.length === 0) return;

  this.drawDetailSectionHeader('Shield');

  rows.forEach(({ icon, label, value }) =>
  {
    this.drawDetailRow(icon, label, value);
  });
};

/**
 * Draws the JABS Stacking section when the state has a reapplication type.
 * Shows the stack type and its sub-settings (extend amount/cap or max stacks).
 * Skipped when no reapplication type is defined on the state.
 * @param {RPG_State} state The state being detailed.
 */
Window_PassiveDetail.prototype.drawJabsStackingSection = function(state)
{
  const reapplyType = state.jabsStateReapplyType;
  if (!reapplyType) return;

  this.drawDetailSectionHeader('Stacking');

  this.drawDetailRow(0, 'Stack Type', reapplyType);

  if (reapplyType === 'extend')
  {
    const extendAmt = state.jabsStateExtendAmount;
    const extendMax = state.jabsStateExtendMax;
    this.drawDetailRow(0, 'Extend Amount', `${extendAmt}f`);
    if (extendMax) this.drawDetailRow(0, 'Extend Cap', `${extendMax}f`);
  }

  if (reapplyType === 'stack')
  {
    this.drawDetailRow(0, 'Max Stacks',     `${state.jabsStateStackMax}`);
    this.drawDetailRow(0, 'Stacks Applied', `${state.jabsStateStacksApplied}`);
    if (state.jabsLoseAllStacksAtOnce) this.drawDetailRow(0, 'Lose All Stacks At Once', '');
  }
};
//endregion Window_PassiveDetail