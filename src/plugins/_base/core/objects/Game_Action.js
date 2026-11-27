//region Game_Action
/**
 * A collection of registered formula context providers.
 * Each provider contributes a named variable to every `evalFormulaWithContext` call.
 * Plugins append entries here via {@link Game_Action.registerFormulaContext}; the order
 * of registration determines the order of arguments passed to the generated function.
 * @type {Array<{name: string, getter: function}>}
 */
Game_Action.formulaContextProviders = [];

/**
 * Registers a named formula context variable provided by a plugin.
 * The getter receives `(action, a, b)` where `action` is the {@link Game_Action} instance,
 * `a` is the attacker, and `b` is the target. Arrow functions are fully supported.
 * The return value of the getter becomes the value of `name` inside every
 * formula evaluated by {@link Game_Action#evalFormulaWithContext}.
 * @param {string} name The variable name exposed inside the formula (e.g. `'p'`, `'s'`).
 * @param {function(Game_Action, Game_Battler, Game_Battler): number|string|boolean|object} getter
 * A function returning the value exposed under `name`.
 */
Game_Action.registerFormulaContext = function(name, getter)
{
  // push the provider entry onto the shared registry.
  Game_Action.formulaContextProviders.push({ name, getter });
};

/**
 * Evaluates a formula string using the base context (`a`, `b`, `v`) plus all
 * variables registered via {@link Game_Action.registerFormulaContext}.
 *
 * Uses `new Function` rather than `eval` so that each plugin owns its own
 * injected variable — no plugin needs to patch another's formula function.
 * @param {string} formula The formula string to evaluate.
 * @param {Game_Actor|Game_Enemy} a The attacker / subject of this action.
 * @param {Game_Actor|Game_Enemy} b The target of this action.
 * @returns {number} The result of the formula.
 */
Game_Action.prototype.evalFormulaWithContext = function(formula, a, b)
{
  // build the fixed base context available in every formula.
  const v = $gameVariables._data;

  // collect variable names and corresponding values from all registered providers.
  // each getter receives (action, a, b) so arrow functions work without needing .call().
  const names  = ['a', 'b', 'v', ...Game_Action.formulaContextProviders.map(provider => provider.name)];
  const values = [a,   b,   v,  ...Game_Action.formulaContextProviders.map(provider => provider.getter(this, a, b))];

  // build and immediately invoke a function whose parameters match the context names.
  return new Function(...names, `return (${formula})`)(...values);
};

/**
 * Gets the `Game_Item` wrapper backing this action.
 *
 * This is deliberately not {@link Game_Action#item}, which unwraps into the database row. Anything
 * rebinding what this action points at needs the wrapper to call `setObject` on.
 * @returns {Game_Item} The raw item wrapper.
 */
Game_Action.prototype.rawItem = function()
{
  // hand back the wrapper rather than the row it points at.
  return this._item;
};

/**
 * Extends {@link #clear}.<br/>
 * Also seeds the triggering damage values, so they are always numbers rather than undefined.
 */
J.BASE.Aliased.Game_Action.set('clear', Game_Action.prototype.clear);
Game_Action.prototype.clear = function()
{
  // perform original logic.
  J.BASE.Aliased.Game_Action.get('clear')
    .call(this);

  // an action that was not triggered by damage was triggered by zero damage.
  this.setTriggerHpDamage(0);
  this.setTriggerMpDamage(0);
  this.setTriggerTpDamage(0);
};

/**
 * Sets the triggering damage values that caused this action to fire (e.g. a retaliation).
 * These are exposed as `d` (HP), `m` (MP), and `t` (TP) inside damage formulas via
 * {@link Game_Action.registerFormulaContext}.
 * @param {number} hpDamage The HP damage that triggered this action.
 * @param {number} mpDamage The MP damage that triggered this action.
 * @param {number} tpDamage The TP damage that triggered this action.
 */
Game_Action.prototype.setTriggerDamage = function(hpDamage, mpDamage, tpDamage)
{
  this.setTriggerHpDamage(hpDamage);
  this.setTriggerMpDamage(mpDamage);
  this.setTriggerTpDamage(tpDamage);
};

/**
 * Gets the triggering HP damage stamped onto this action, defaulting to 0.
 * @returns {number}
 */
Game_Action.prototype.getTriggerHpDamage = function()
{
  return this.triggerHpDamage();
};

/**
 * Gets the triggering MP damage stamped onto this action, defaulting to 0.
 * @returns {number}
 */
Game_Action.prototype.getTriggerMpDamage = function()
{
  return this.triggerMpDamage();
};

/**
 * Gets the triggering TP damage stamped onto this action, defaulting to 0.
 * @returns {number}
 */
Game_Action.prototype.getTriggerTpDamage = function()
{
  return this.triggerTpDamage();
};

// Register d/m/t as formula context variables available in every skill formula.
// They default to 0 for all non-retaliation skills; the retaliate system stamps
// real values before firing payload skills.
Game_Action.registerFormulaContext('d', action => action.getTriggerHpDamage());
Game_Action.registerFormulaContext('m', action => action.getTriggerMpDamage());
Game_Action.registerFormulaContext('t', action => action.getTriggerTpDamage());

//region damage roll
/**
 * Overwrites {@link #makeDamageValue}.<br/>
 * Identical to vanilla except for two things. The target's physical or magical damage rate is read
 * through {@link #damageRateAgainst} rather than straight off the target: that rate is the one part of
 * a hit's damage that belongs to how the target takes it rather than to what the action is, and routing
 * it through a single method lets a plugin change how much of it an action respects without rewriting
 * the whole roll. And a Damage-tab heal answers to the caster's HAR as well as the recipient's REC, the
 * same pairing {@link #itemEffectRecoverHp} uses. Every extension of this method wraps the number this
 * produces.
 * @param {Game_Battler} target The target being hit.
 * @param {boolean} critical Whether or not this hit is a critical hit.
 * @returns {number}
 */
Game_Action.prototype.makeDamageValue = function(target, critical)
{
  // the skill or item being used.
  const item = this.item();

  // evaluate the damage formula against the target.
  const baseValue = this.evalDamageFormula(target);

  // scale it by this action's elemental rate against the target.
  let value = baseValue * this.calcElementRate(target);

  // an absorbed element can turn a hit into a heal, so harm is judged after the elemental rate.
  const isHarmful = value > 0;

  // scale it by the rate the target takes this action's hit type at.
  value *= this.damageRateAgainst(target, isHarmful);

  // a heal answers to the target's recovery rate as well.
  if (baseValue < 0)
  {
    value *= target.rec;
  }

  // a critical hit amplifies what it lands.
  if (critical)
  {
    value = this.applyCritical(value);
  }

  // roll the variance, then let a guarding target take its share off.
  value = this.applyVariance(value, item.damage.variance);
  value = this.applyGuard(value, target);

  // damage is dealt in whole numbers.
  value = Math.round(value);

  // a negative value is a heal, and it answers to the caster's HAR alongside the recipient's REC.
  // guard, variance and critical all preserve the sign, so the final value tells a heal apart as
  // surely as the formula did.
  if (value < 0)
  {
    value *= this.subject().har;
  }

  return value;
};

/**
 * The rate the given target takes this action at, by the action's hit type.<br/>
 * A physical hit meets the target's PDR and a magical hit its MDR, while a certain hit meets neither
 * and lands at an even 1. Every place a target's damage rate reaches a number asks this, from
 * {@link #makeDamageValue} to anything else that builds damage by hand, so a plugin changing how much
 * of that rate an action respects extends this one method and every path agrees.
 * @param {Game_Battler} target The target being hit.
 * @param {boolean} _isHarmful Whether the value this rate scales is harm rather than a heal. The rate
 * itself never depends on it; it is here for an extension that treats the two differently.
 * @returns {number}
 */
Game_Action.prototype.damageRateAgainst = function(target, _isHarmful)
{
  // a physical hit is taken at the target's physical damage rate.
  if (this.isPhysical()) return target.pdr;

  // a magical hit is taken at the target's magical damage rate.
  if (this.isMagical()) return target.mdr;

  // a certain hit answers to neither.
  return 1;
};
//endregion damage roll

//region HAR
/**
 * Overwrites {@link #itemEffectRecoverHp}.<br/>
 * Identical to vanilla except for the added `this.subject().har` multiplier, the caster's healing rate
 * that {@link #makeDamageValue} applies to a Damage-tab heal as well.
 */
Game_Action.prototype.itemEffectRecoverHp = function(target, effect)
{
  let value = (target.mhp * effect.value1 + effect.value2) * target.rec * this.subject().har;
  if (this.isItem())
  {
    value *= this.subject().pha;
  }

  value = Math.floor(value);
  if (value !== 0)
  {
    target.gainHp(value);
    this.makeSuccess(target);
  }
};

/**
 * Overwrites {@link #itemEffectRecoverMp}.<br/>
 * Identical to vanilla except for the added `this.subject().har` multiplier, the caster's healing rate
 * that {@link #makeDamageValue} applies to a Damage-tab heal as well.
 */
Game_Action.prototype.itemEffectRecoverMp = function(target, effect)
{
  let value = (target.mmp * effect.value1 + effect.value2) * target.rec * this.subject().har;
  if (this.isItem())
  {
    value *= this.subject().pha;
  }

  value = Math.floor(value);
  if (value !== 0)
  {
    target.gainMp(value);
    this.makeSuccess(target);
  }
};
//endregion HAR

/**
 * Gets the actor id of this action's subject, or 0 when an enemy.
 * @returns {number} The subjectActorId.
 */
Game_Action.prototype.subjectActorId = function()
{
  // hand back the actor id of this action's subject, or 0 when an enemy.
  return this._subjectActorId;
};

/**
 * Sets the actor id of this action's subject, or 0 when an enemy.
 * @param {number} newSubjectActorId The new subjectActorId.
 */
Game_Action.prototype.setSubjectActorId = function(newSubjectActorId)
{
  // assign the actor id of this action's subject, or 0 when an enemy.
  this._subjectActorId = newSubjectActorId;
};

/**
 * Gets the troop index of this action's subject, or -1 when an actor.
 * @returns {number} The subjectEnemyIndex.
 */
Game_Action.prototype.subjectEnemyIndex = function()
{
  // hand back the troop index of this action's subject, or -1 when an actor.
  return this._subjectEnemyIndex;
};

/**
 * Sets the troop index of this action's subject, or -1 when an actor.
 * @param {number} newSubjectEnemyIndex The new subjectEnemyIndex.
 */
Game_Action.prototype.setSubjectEnemyIndex = function(newSubjectEnemyIndex)
{
  // assign the troop index of this action's subject, or -1 when an actor.
  this._subjectEnemyIndex = newSubjectEnemyIndex;
};

//region properties
/**
 * Gets the trigger hp damage.
 * @returns {number} The triggerHpDamage.
 */
Game_Action.prototype.triggerHpDamage = function()
{
  // hand back the trigger hp damage.
  return this._triggerHpDamage;
};

/**
 * Sets the trigger hp damage.
 * @param {number} newTriggerHpDamage The new triggerHpDamage.
 */
Game_Action.prototype.setTriggerHpDamage = function(newTriggerHpDamage)
{
  // assign the trigger hp damage.
  this._triggerHpDamage = newTriggerHpDamage;
};

/**
 * Gets the trigger mp damage.
 * @returns {number} The triggerMpDamage.
 */
Game_Action.prototype.triggerMpDamage = function()
{
  // hand back the trigger mp damage.
  return this._triggerMpDamage;
};

/**
 * Sets the trigger mp damage.
 * @param {number} newTriggerMpDamage The new triggerMpDamage.
 */
Game_Action.prototype.setTriggerMpDamage = function(newTriggerMpDamage)
{
  // assign the trigger mp damage.
  this._triggerMpDamage = newTriggerMpDamage;
};

/**
 * Gets the trigger tp damage.
 * @returns {number} The triggerTpDamage.
 */
Game_Action.prototype.triggerTpDamage = function()
{
  // hand back the trigger tp damage.
  return this._triggerTpDamage;
};

/**
 * Sets the trigger tp damage.
 * @param {number} newTriggerTpDamage The new triggerTpDamage.
 */
Game_Action.prototype.setTriggerTpDamage = function(newTriggerTpDamage)
{
  // assign the trigger tp damage.
  this._triggerTpDamage = newTriggerTpDamage;
};
//endregion properties
//endregion Game_Action