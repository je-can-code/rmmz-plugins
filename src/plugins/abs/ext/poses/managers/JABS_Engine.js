//region JABS_Engine
/**
 * Handles the pose functionality behind this action.
 * @param {JABS_Battler} caster The `JABS_Battler` executing the `JABS_Action`.
 * @param {JABS_Action} action The `JABS_Action` to execute.
 */
JABS_Engine.handleActionPose = function(caster, action)
{
  // perform the action's corresponding pose.
  caster.performActionPose(action.getBaseSkill());
}

J.ABS.EXT.POSES.Aliased.JABS_Engine.set('executeMapAction', JABS_Engine.executeMapAction);
/**
 * Executes the provided `JABS_Action`.
 * It generates a copy of an event from the "ActionMap" and fires it off
 * based on it's move route.
 * @param {JABS_Battler} caster The `JABS_Battler` executing the `JABS_Action`.
 * @param {JABS_Action} action The `JABS_Action` to execute.
 * @param {number?} targetX The target's `x` coordinate, if applicable.
 * @param {number?} targetY The target's `y` coordinate, if applicable.
 */
JABS_Engine.executeMapAction = function(caster, action, targetX, targetY)
{
  // perform original logic.
  J.ABS.EXT.POSES.Aliased.JABS_Engine.get('executeMapAction')
    .call(this, caster, action, targetX, targetY);

  // handle the pose for this forced action.
  this.handleActionPose(caster, action);
}
//endregion JABS_Engine