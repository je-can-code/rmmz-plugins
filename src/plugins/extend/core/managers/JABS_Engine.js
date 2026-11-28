//region JABS_Engine
/**
 * Extends {@link JABS_Engine#handleOnCastStateEffects}.<br/>
 * Also applies this plugin's on-cast effects to the caster, once for the action as it executes- after any cast time
 * has run out- rather than once per target hit. In order: the states the caster gives itself, then those it gives
 * itself only while it carries another, then the states it loses, the states it toggles, and the state groups it
 * cycles; then the skills the cast force-executes, and those it force-executes only while the caster carries a
 * state. The two execute-skill families are handed the caster, since that is who their payloads are forced onto the
 * map as.
 * @param {JABS_Battler} caster The JABS_Battler executing the JABS action.
 * @param {JABS_Action} action The JABS action being executed.
 */
J.EXTEND.Aliased.JABS_Engine.set('handleOnCastStateEffects', JABS_Engine.prototype.handleOnCastStateEffects);
JABS_Engine.prototype.handleOnCastStateEffects = function(caster, action)
{
  // perform original logic.
  J.EXTEND.Aliased.JABS_Engine.get('handleOnCastStateEffects')
    .call(this, caster, action);

  // grab the underlying Game_Action to access its state-effect methods.
  const gameAction = action.getAction();

  // apply any on-cast self-states to the caster, once for this action.
  gameAction.applyOnCastSelfStates();

  // apply any conditional on-cast self-states that require the caster to have a specific state.
  gameAction.applyOnCastSelfStatesIfAfflicted();

  // remove any on-cast lose-states from the caster, once for this action.
  gameAction.applyOnCastLoseStates();

  // toggle any <toggleOnExecute> states on the caster, once for this action.
  gameAction.applyToggleOnExecuteStates();

  // cycle any <toggleGroupOnExecute> state groups on the caster, once for this action.
  gameAction.applyToggleGroupOnExecuteStates();

  // force-execute any <onCastExecuteSkill> payload skills, once for this action.
  gameAction.applyOnCastExecuteSkills(caster);

  // force-execute any <onCastExecuteSkillIfAfflicted> payload skills whose required state is
  // currently active on the caster, once for this action.
  gameAction.applyOnCastExecuteSkillsIfAfflicted(caster);
};
//endregion JABS_Engine