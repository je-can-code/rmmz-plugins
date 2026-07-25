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
 * Sets the triggering damage values that caused this action to fire (e.g. a retaliation).
 * These are exposed as `d` (HP), `m` (MP), and `t` (TP) inside damage formulas via
 * {@link Game_Action.registerFormulaContext}.
 * @param {number} hpDamage The HP damage that triggered this action.
 * @param {number} mpDamage The MP damage that triggered this action.
 * @param {number} tpDamage The TP damage that triggered this action.
 */
Game_Action.prototype.setTriggerDamage = function(hpDamage, mpDamage, tpDamage)
{
  this._triggerHpDamage = hpDamage;
  this._triggerMpDamage = mpDamage;
  this._triggerTpDamage = tpDamage;
};

/**
 * Gets the triggering HP damage stamped onto this action, defaulting to 0.
 * @returns {number}
 */
Game_Action.prototype.getTriggerHpDamage = function()
{
  return this._triggerHpDamage ?? 0;
};

/**
 * Gets the triggering MP damage stamped onto this action, defaulting to 0.
 * @returns {number}
 */
Game_Action.prototype.getTriggerMpDamage = function()
{
  return this._triggerMpDamage ?? 0;
};

/**
 * Gets the triggering TP damage stamped onto this action, defaulting to 0.
 * @returns {number}
 */
Game_Action.prototype.getTriggerTpDamage = function()
{
  return this._triggerTpDamage ?? 0;
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
//endregion Game_Action