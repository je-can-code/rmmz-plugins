//region JABS_Engine
import FormulaEffect from './../__models/FormulaEffect.js';
J.ABS.EXT.FORMULA.Aliased.JABS_Engine ||= new Map();

/**
 * Extends {@link JABS_Engine.applyOnExecutionEffects}.<br/>
 * Fires on-use packets at action launch time (normal execution path).
 * @param {JABS_Battler} caster The battler executing the skill.
 * @param {JABS_Action} primaryAction The 0th index action for this launch.
 */
J.ABS.EXT.FORMULA.Aliased.JABS_Engine.set("applyOnExecutionEffects", JABS_Engine.prototype.applyOnExecutionEffects);
JABS_Engine.prototype.applyOnExecutionEffects = function(caster, primaryAction)
{
  // perform original launch-time responsibilities (costs, cooldowns, etc.).
  J.ABS.EXT.FORMULA.Aliased.JABS_Engine.get("applyOnExecutionEffects")
    .call(this, caster, primaryAction);

  // fire on-use packets at launch time.
  this.applyOnUseFormulaPackets(caster, primaryAction);
};

/**
 * Applies J.ABS.EXT.FORMULA on-use packets for the underlying Game_Action
 * of the provided primary JABS action. Executed at action launch time.
 * @param {JABS_Battler} caster The JABS battler launching the action.
 * @param {JABS_Action} primaryAction The primary JABS action (index 0).
 */
JABS_Engine.prototype.applyOnUseFormulaPackets = function(caster, primaryAction)
{
  // obtain the underlying Game_Action from the JABS action.
  const gameAction = primaryAction.getAction();
  // no underlying action => nothing to apply.
  if (!gameAction) return;

  // set context to on-use while evaluating packets.
  const ctx = J.ABS.EXT.FORMULA.Context;
  const prevTrigger = ctx.activeTrigger;
  const prevCascade = ctx.suppressCascades;
  // "use".
  ctx.activeTrigger = FormulaEffect.Trigger.USE;
  // parent-level packets should execute.
  ctx.suppressCascades = false;

  try
  {
    // fire all on-use packets for this action; parentTarget is not defined at launch.
    // NOTE: <on-use:to-target:...> resolves to [] by design. Prefer self/allies/enemies/all for on-use.
    gameAction.applyFormulaPackets(FormulaEffect.Trigger.USE, null);
  }
  finally
  {
    // restore context regardless of success.
    ctx.suppressCascades = prevCascade;
    ctx.activeTrigger = prevTrigger;
  }
};

/**
 * Extends {@link JABS_Engine.forceMapAction}.<br/>
 * Ensures on-use packets are also fired at launch time for forced/immediate actions.
 * @param {JABS_Battler} caster The battler executing the skill.
 * @param {number} skillId The skill to be executed.
 * @param {boolean=} isRetaliation Whether this is a retaliation skill.
 * @param {number=} targetX The target's x-coordinate.
 * @param {number=} targetY The target's y-coordinate.
 * @param {boolean=} isMapDamage Whether this is environmental damage.
 */
J.ABS.EXT.FORMULA.Aliased.JABS_Engine.set("forceMapAction", JABS_Engine.prototype.forceMapAction);
JABS_Engine.prototype.forceMapAction = function(
  caster,
  skillId,
  isRetaliation = false,
  targetX = null,
  targetY = null,
  isMapDamage = false
)
{
  // build options based on inputs (to derive a primary action for on-use packets).
  const actionLocation = JABS_Location.Builder()
    // set the target x.
    .setX(targetX)
    // set the target y.
    .setY(targetY)
    // build the location.
    .build();
  const actionOptions = JABS_ActionOptions.Builder()
    // set if this is a retaliation.
    .setIsRetaliation(isRetaliation)
    // apply the action location.
    .setLocation(actionLocation)
    // set if this is environmental damage.
    .setIsTerrainDamage(isMapDamage)
    // build the options.
    .build();

  // generate the actions to obtain the primary action for on-use packet firing.
  // NOTE: this preview is used only to feed the on-use hook below; actual execution is
  // performed by the original method to avoid duplication and preserve core behavior.
  // create preview.
  const previewActions = caster.createJabsActionFromSkill(skillId, actionOptions);

  // if we cannot execute map actions, then do not proceed.
  // guard execution.
  if (!this.canExecuteMapActions(caster, previewActions)) return;

  // fire on-use packets at launch time for forced actions using the primary preview action.
  // launch-time on-use.
  this.applyOnUseFormulaPackets(caster, previewActions[0]);

  // delegate to the original forceMapAction (immediate execution path without costs/cooldowns/cast time),
  // preserving all core behavior (animations, collisions, effects, logs, threat, etc.).
  J.ABS.EXT.FORMULA.Aliased.JABS_Engine.get("forceMapAction")
    // call original.
    .call(this, caster, skillId, isRetaliation, targetX, targetY, isMapDamage);
};
//endregion JABS_Engine