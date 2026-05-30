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
//endregion Game_Action