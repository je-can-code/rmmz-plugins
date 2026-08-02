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
 * @param {function(Game_Action, Game_Battler, Game_Battler): *} getter A function returning the value.
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

//region HAR
/**
 * Extends {@link #makeDamageValue}.<br/>
 * Applies the caster's HAR to the Damage-tab "HP/MP Recover" result, mirroring
 * vanilla's own `value *= target.rec` for the same negative-value (heal) branch.
 * A negative return value here always means a heal; guard/variance/critical all
 * preserve sign, so checking the final value is equivalent to checking baseValue.
 */
J.BASE.Aliased.Game_Action.set('makeDamageValue', Game_Action.prototype.makeDamageValue);
Game_Action.prototype.makeDamageValue = function(target, critical)
{
  // perform original logic, which already applies target.rec for the heal branch.
  let value = J.BASE.Aliased.Game_Action.get('makeDamageValue')
    .call(this, target, critical);

  // a negative value here is a heal; apply the caster's HAR alongside the recipient's REC.
  if (value < 0)
  {
    value *= this.subject().har;
  }

  return value;
};

/**
 * Overwrites {@link #itemEffectRecoverHp}.<br/>
 * Identical to vanilla except for the added `this.subject().har` multiplier;
 * the method mutates `target` directly rather than returning a value, so there's
 * no return value to post-multiply the way {@link #makeDamageValue} allows.
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
 * Identical to vanilla except for the added `this.subject().har` multiplier;
 * the method mutates `target` directly rather than returning a value, so there's
 * no return value to post-multiply the way {@link #makeDamageValue} allows.
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
 * @returns {*} The triggerHpDamage.
 */
Game_Action.prototype.triggerHpDamage = function()
{
  // hand back the trigger hp damage.
  return this._triggerHpDamage;
};

/**
 * Sets the trigger hp damage.
 * @param {*} newTriggerHpDamage The new triggerHpDamage.
 */
Game_Action.prototype.setTriggerHpDamage = function(newTriggerHpDamage)
{
  // assign the trigger hp damage.
  this._triggerHpDamage = newTriggerHpDamage;
};

/**
 * Gets the trigger mp damage.
 * @returns {*} The triggerMpDamage.
 */
Game_Action.prototype.triggerMpDamage = function()
{
  // hand back the trigger mp damage.
  return this._triggerMpDamage;
};

/**
 * Sets the trigger mp damage.
 * @param {*} newTriggerMpDamage The new triggerMpDamage.
 */
Game_Action.prototype.setTriggerMpDamage = function(newTriggerMpDamage)
{
  // assign the trigger mp damage.
  this._triggerMpDamage = newTriggerMpDamage;
};

/**
 * Gets the trigger tp damage.
 * @returns {*} The triggerTpDamage.
 */
Game_Action.prototype.triggerTpDamage = function()
{
  // hand back the trigger tp damage.
  return this._triggerTpDamage;
};

/**
 * Sets the trigger tp damage.
 * @param {*} newTriggerTpDamage The new triggerTpDamage.
 */
Game_Action.prototype.setTriggerTpDamage = function(newTriggerTpDamage)
{
  // assign the trigger tp damage.
  this._triggerTpDamage = newTriggerTpDamage;
};
//endregion properties
//endregion Game_Action