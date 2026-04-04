//region Game_Action
/**
 * Extends {@link Game_Action.applyVirtualJabsAction}.<br/>
 * Injects on-use packets before the core apply flow, and on-hit packets after.
 * @param {Game_Battler} target The primary target for this action.
 */
J.ABS.EXT.FORMULA.Aliased.Game_Action.set("applyVirtualJabsAction", Game_Action.prototype.applyVirtualJabsAction);
Game_Action.prototype.applyVirtualJabsAction = function(target)
{
  // perform original logic.
  J.ABS.EXT.FORMULA.Aliased.Game_Action.get("applyVirtualJabsAction")
    .call(this, target);

  // 2) Apply on-hit packets after the core flow completes.
  const ctx = J.ABS.EXT.FORMULA.Context;
  const prevTrigger = ctx.activeTrigger;
  const prevCascade = ctx.suppressCascades;

  ctx.activeTrigger = FormulaEffect.Trigger.HIT;
  ctx.suppressCascades = false;

  // Apply all on-hit packets for this action with the provided primary target.
  this.applyFormulaPackets(FormulaEffect.Trigger.HIT, target);

  // Restore prior context settings.
  ctx.suppressCascades = prevCascade;
  ctx.activeTrigger = prevTrigger;
};

/**
 * Resolves and applies all formula packets on this.item() for a given trigger.
 * @param {"hit"|"use"} trigger The trigger timing to apply.
 * @param {Game_Battler} parentTarget The primary target (used for affect-target, and crit parity for child).
 */
Game_Action.prototype.applyFormulaPackets = function(trigger, parentTarget)
{
  // ensure we have an item/skill to check.
  const skill = this.item();
  // only skills for now.
  if (!skill || !skill.isSkill()) return;

  // gather all effects and filter by trigger.
  const allEffects = skill.jabsFormulaEffects();
  if (!allEffects.length) return;

  // evaluate only matching trigger.
  const effects = allEffects.filter(e => e.trigger === trigger);
  if (!effects.length) return;

  // for each effect, resolve recipients and apply.
  effects.forEach(effect => this.applyFormulaPacket(effect, parentTarget), this);
};

/**
 * Applies a single packet to all resolved recipients.
 * @param {FormulaEffect} effect The effect definition.
 * @param {Game_Battler} parentTarget The primary target from the parent action.
 */
Game_Action.prototype.applyFormulaPacket = function(effect, parentTarget)
{
  // if a child-skill execution is ongoing and cascading is suppressed, bail.
  if (J.ABS.EXT.FORMULA.Context.suppressCascades) return;

  // build recipients list per affect key.
  const recipients = this.resolveFormulaRecipients(effect.affect, parentTarget);
  if (!recipients.length) return;

  // branch by mode for each recipient.
  if (effect.mode === FormulaEffect.Mode.FORMULA)
  {
    recipients.forEach(recipient => this.applyFormulaModePacket(effect, recipient), this);
  }
  else if (effect.mode === FormulaEffect.Mode.SKILL && effect.skillId > 0)
  {
    recipients.forEach(recipient => this.executeChildSkillPacket(effect, recipient, parentTarget), this);
  }
};

/**
 * Resolves recipients for a packet based on its affect key.
 * @param {"self"|"allies"|"target"|"enemies"|"all"} affect The affect key.
 * @param {Game_Battler} parentTarget The current parent target (if relevant).
 * @returns {Game_Battler[]} Recipients for this packet.
 */
Game_Action.prototype.resolveFormulaRecipients = function(affect, parentTarget)
{
  // subject (user) is often needed.
  const subject = this.subject();

  // helper to get underlying battlers from JABS_Battlers.
  const mapToBattlers = jabsBattlers => jabsBattlers.map(j => j.getBattler());

  switch (affect)
  {
    case FormulaEffect.Affect.SELF:
      return [ subject ];

    case FormulaEffect.Affect.TARGET:
      return parentTarget
        ? [ parentTarget ]
        : [ subject ];

    case FormulaEffect.Affect.ALLIES:
    {
      const subjJabs = JABS_AiManager.getBattlerByUuid(subject.getUuid());
      if (!subjJabs) return [];
      const allies = JABS_AiManager.getAlliedBattlers(subjJabs);
      return mapToBattlers(allies)
        .filter(this._filterFormulaEligibleBattler, this);
    }

    case FormulaEffect.Affect.ENEMIES:
    {
      const subjJabs = JABS_AiManager.getBattlerByUuid(subject.getUuid());
      if (!subjJabs) return [];
      const foes = JABS_AiManager.getOpposingBattlers(subjJabs);
      return mapToBattlers(foes)
        .filter(this._filterFormulaEligibleBattler, this);
    }

    case FormulaEffect.Affect.ALL:
    {
      const all = JABS_AiManager.getAllBattlers();
      return mapToBattlers(all)
        .filter(this._filterFormulaEligibleBattler, this);
    }
  }

  // unknown => nothing.
  return [];
};

/**
 * Filters out battlers we shouldn’t affect (dead or inanimate).
 * @param {Game_Battler} battler The battler being considered.
 * @returns {boolean} True if eligible, false otherwise.
 */
Game_Action.prototype._filterFormulaEligibleBattler = function(battler)
{
  if (!battler) return false;
  if (battler.isDead()) return false;
  if (battler.isInanimate()) return false;
  return true;
};

/**
 * Evaluates a formula with contextual variables.
 *  a = source (subject), b = recipient, v = variables, i = current item/skill.
 * @param {string} formula The formula text to eval.
 * @param {Game_Battler} source The subject.
 * @param {Game_Battler} recipient The recipient.
 * @param {RPG_Skill|RPG_Item} item The item/skill.
 * @returns {number} The result (positive => damage, negative => heal/gain).
 */
Game_Action.prototype.evaluateFormula = function(formula, source, recipient, item)
{
  /* eslint-disable no-unused-vars */
  const a = source;
  const b = recipient;
  const v = $gameVariables._data;
  const i = item;
  /* eslint-enable no-unused-vars */

  let result = 0;
  try
  {
    result = eval(formula);
    if (!Number.isFinite(result)) throw new Error("Invalid formula output.");
  }
  catch (err)
  {
    console.warn(`J.FORMULA eval failed: [ ${formula} ]`);
    console.trace();
    throw err;
  }

  // smoother small decimals.
  return parseFloat(Number(result)
    .toFixed(3));
};

/**
 * Applies a by-formula packet to a single recipient using the full battle pipeline.
 * @param {FormulaEffect} effect The by-formula effect.
 * @param {Game_Battler} recipient The recipient.
 */
Game_Action.prototype.applyFormulaModePacket = function(effect, recipient)
{
  // compute signed amount from formula.
  const raw = this.evaluateFormula(effect.formula, this.subject(), recipient, this.item());
  if (!raw) return;

  // identify damage vs healing/gain.
  const isDamage = raw > 0;
  // pipeline expects a positive magnitude.
  const baseMag = Math.abs(raw);

  // run magnitude through battle pipeline (element/phys-mag/guard/variance/JABS guard; REC on heals).
  const piped = this.pipeFormulaThroughBattleCalculations(recipient, baseMag, effect, isDamage);

  // finalize and apply by resource.
  // enforce non-negative integer.
  const mag = Math.max(0, Math.round(piped));
  // no net impact.
  if (mag === 0) return;

  // snapshot the current result so our packet doesn't overwrite the base action's result.
  const r = recipient.result();
  const snapshot = {
    used: r.used,
    missed: r.missed,
    evaded: r.evaded,
    critical: r.critical,
    hpDamage: r.hpDamage,
    mpDamage: r.mpDamage,
    tpDamage: r.tpDamage,
    parried: r.parried,
    reduced: r.reduced,
    physical: r.physical,
    drain: r.drain,
  };

  // apply resource change with correct sign.
  switch (effect.resource)
  {
    case FormulaEffect.Resource.HP:
      recipient.gainHp(isDamage
        ? -mag
        : +mag);
      break;
    case FormulaEffect.Resource.MP:
      recipient.gainMp(isDamage
        ? -mag
        : +mag);
      break;
    case FormulaEffect.Resource.TP:
      recipient.gainTp(isDamage
        ? -mag
        : +mag);
      break;
  }

  // mark success for this secondary packet.
  this.makeSuccess(recipient);

  // popup with signed amount semantics (negative => healing visuals).
  this.onFormulaResourceDelta(
    recipient,
    isDamage
      ? mag
      : -mag,
    effect.resource);

  // action log for any resource, attributed to the parent skill id.
  const signed = isDamage
    ? mag
    // negative => heal/gain, positive => damage/loss.
    : -mag;
  const parentSkillId = this.item()
    ? this.item().id
    : 0;
  this.generateFormulaActionLogIfAvailable(recipient, signed, effect.resource, parentSkillId);

  // restore the original action result so the base action remains authoritative for engine/JABS visuals.
  r.used = snapshot.used;
  r.missed = snapshot.missed;
  r.evaded = snapshot.evaded;
  r.critical = snapshot.critical;
  r.hpDamage = snapshot.hpDamage;
  r.mpDamage = snapshot.mpDamage;
  r.tpDamage = snapshot.tpDamage;
  r.parried = snapshot.parried;
  r.reduced = snapshot.reduced;
  r.physical = snapshot.physical;
  r.drain = snapshot.drain;
};

/**
 * Runs a packet’s magnitude (always positive) through the battle pipeline.
 * Damage path:
 *  - element rate
 *  - critical (on-hit only if result.critical true)
 *  - physical/magical damage rate
 *  - native guard
 *  - variance
 *  - JABS guard/parry reductions
 * Healing path:
 *  - element rate
 *  - physical/magical damage rate
 *  - variance
 *  - REC (recovery)
 * @param {Game_Battler} target The recipient.
 * @param {number} magnitude The base magnitude (>=0).
 * @param {FormulaEffect} effect The effect definition.
 * @param {boolean} isDamage Whether this is damage.
 * @returns {number} The post-pipeline magnitude.
 */
Game_Action.prototype.pipeFormulaThroughBattleCalculations = function(target, magnitude, effect, isDamage)
{
  let value = magnitude;

  // 1) element rate using this.item()’s element.
  value *= this.calcElementRate(target);

  // 2) critical only for damage and only if parent was critical (on-hit context).
  const targetResult = target.result();
  if (isDamage && J.ABS.EXT.FORMULA.Context.activeTrigger === FormulaEffect.Trigger.HIT && targetResult && targetResult.critical)
  {
    value = this.applyCritical(value);
  }

  // 3) phys/mag damage rate.
  if (this.isPhysical())
  {
    value *= target.pdr;
  }

  if (this.isMagical())
  {
    value *= target.mdr;
  }

  // 4) guard only for damage.
  if (isDamage)
  {
    value = this.applyGuard(value, target);
  }

  // 5) variance from the item’s damage settings.
  value = this.applyVariance(value, this.item().damage.variance);

  // 6) JABS guard/parry reductions only for damage.
  if (isDamage)
  {
    value = Math.round(value);
    if (this.canHandleGuardEffects(target))
    {
      const guardingJabsBattler = JABS_AiManager.getBattlerByUuid(target.getUuid());
      if (guardingJabsBattler)
      {
        value = this.handleGuardEffects(value, guardingJabsBattler);
      }
    }
  }

  // 7) REC for healing.
  if (!isDamage)
  {
    value = this.applyResourceHealingWithRecovery(target, value, effect.resource);
  }

  return Math.max(0, value);
};

/**
 * Applies REC to a healing magnitude (already positive) across resources.
 * Mirrors native healing treatment (HP REC), generalized for MP/TP per project rules.
 * @param {Game_Battler} target The recipient of healing.
 * @param {number} magnitude The base positive healing amount.
 * @param {"hp"|"mp"|"tp"} resource The resource being healed.
 * @returns {number} The REC-adjusted, rounded healing amount.
 */
Game_Action.prototype.applyResourceHealingWithRecovery = function(target, magnitude, resource)
{
  let healed = magnitude * target.rec;
  healed = Math.round(healed);
  return healed;
};

/**
 * Executes a child skill compute-only against a single recipient.
 * - No cost/cooldown/common events
 * - No cascading of FORMULA/skill packets
 * - Parity with crit on on-hit against parent target
 * @param {FormulaEffect} effect The by-skill packet (skillId must be > 0).
 * @param {Game_Battler} recipient The recipient of the child skill.
 * @param {Game_Battler} parentTarget The original parent action’s primary target.
 */
Game_Action.prototype.executeChildSkillPacket = function(effect, recipient, parentTarget)
{
  // look up the child skill.
  const child = $dataSkills[effect.skillId];
  // invalid skill id => nothing to do.
  if (!child) return;

  // resolve the subject as a JABS battler; full JABS actions require a JABS_Battler caster.
  const subject = this.subject();
  const jabsSubject = JABS_AiManager.getBattlerByUuid(subject.getUuid());
  // subject must exist on-map as a JABS battler.
  if (!jabsSubject) return;

  // optionally bias execution with the recipient’s current coordinates (useful for target/ground casts).
  let targetX = null;
  let targetY = null;
  if (recipient)
  {
    const jabsRecipient = JABS_AiManager.getBattlerByUuid(recipient.getUuid());
    if (jabsRecipient)
    {
      targetX = jabsRecipient.getX();
      targetY = jabsRecipient.getY();
    }
  }

  // build JABS actions from the child skill for the same subject.
  const actions = jabsSubject.createJabsActionFromSkill(effect.skillId);
  if (!actions || !actions.length) return;

  // Execute immediately with no costs, cooldowns, or cast time.
  // forceMapAction:
  // - ignores costs and cooldowns
  // - executes the action right away (no casting delay)
  // - still runs full authored behavior (animations, collisions, effects, logs, popups, threat)
  $jabsEngine.forceMapAction(jabsSubject, effect.skillId, false, targetX, targetY);
};

/**
 * Lifecycle event: a formula effect applied a resource delta to a recipient.
 * Extended by optional plugins (e.g. J-Popups-ABS) to surface map feedback.
 * The amount is signed (positive => damage/loss, negative => heal/gain).
 * @param {Game_Battler} recipient The battler who received the effect.
 * @param {number} amount The signed amount.
 * @param {"hp"|"mp"|"tp"} resource Which resource this packet targeted.
 */
// eslint-disable-next-line no-unused-vars
Game_Action.prototype.onFormulaResourceDelta = function(recipient, amount, resource) {};

/**
 * Generates an action log entry for FORMULA and child-skill packets for any resource.
 * Healing may also be critical depending on the action result.
 * Only guards once against logging plugin presence.
 * @param {Game_Battler} recipient The battler who received the effect.
 * @param {number} amount The signed amount (positive => damage/loss, negative => heal/gain).
 * @param {"hp"|"mp"|"tp"} resource Which resource this packet targeted.
 * @param {number} skillId The skill id attributed to this packet (parent or child).
 * @param {number=} reduced Optional reduced magnitude (HP typically) when known.
 */
Game_Action.prototype.generateFormulaActionLogIfAvailable = function(recipient, amount, resource, skillId, reduced)
{
  // if the logging plugin isn't present, skip logging.
  if (!J.LOG) return;

  // normalize signed amount and magnitude.
  const signed = Math.round(amount);
  const magnitude = Math.abs(signed);
  if (magnitude === 0) return;

  // derive display names for the caster and target.
  const caster = this.subject();
  const casterName = caster
    ? caster.name()
    : "Unknown";
  const targetName = recipient
    ? recipient.name()
    : "Unknown";

  // format reduced amount if provided and non-zero (HP mitigation display).
  let reducedAmount = String.empty;
  if (typeof reduced === "number" && reduced !== 0)
  {
    reducedAmount = `(${Math.round(Math.abs(reduced))})`;
  }

  // negative => heal/gain, positive => damage/loss.
  const isHeal = signed < 0;

  // heals can also be critical; use the recipient's current action result flag if present.
  const recipientResult = recipient.result();
  const wasCrit = recipientResult ? recipientResult.critical === true : false;

  // build and enqueue the action log entry using the standard execution line.
  const log = new ActionLogBuilder()
    .setupExecution(targetName, casterName, skillId || 0, magnitude, reducedAmount, isHeal, wasCrit)
    .build();

  // submit the built log entry to the manager (assumed present when J.LOG is true).
  $actionLogManager.addLog(log);
};

/**
 * Extends {@link Game_Action.applyGlobal}.<br/>
 * Suppresses common events while J.ABS.EXT.FORMULA.Context.suppressCommonEvents is true.
 */
J.ABS.EXT.FORMULA.Aliased.Game_Action.set("applyGlobal", Game_Action.prototype.applyGlobal);
Game_Action.prototype.applyGlobal = function()
{
  if (J.ABS.EXT.FORMULA.Context.suppressCommonEvents) return;

  // otherwise, perform original logic.
  J.ABS.EXT.FORMULA.Aliased.Game_Action.get("applyGlobal")
    .call(this);
};
//endregion Game_Action