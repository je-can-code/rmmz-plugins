//region JABS_Engine (juice hooks)
/**
 * Extends {@link JABS_Engine.postPrimaryBattleEffects}.<br/>
 * Applies lightweight target-side sprite reactions after core logging (and after Hitstop).
 */
J.ABS.EXT.JUICE.Aliased.JABS_Engine.set('postPrimaryBattleEffects', JABS_Engine.prototype.postPrimaryBattleEffects);
JABS_Engine.prototype.postPrimaryBattleEffects = function(action, target)
{
  // perform original logic (includes upstream extensions such as Hitstop).
  J.ABS.EXT.JUICE.Aliased.JABS_Engine.get('postPrimaryBattleEffects')
    .call(this, action, target);

  // layer procedural juice on the struck battler when applicable.
  JuiceHookManager.onPostPrimaryBattleEffects(action, target);
};

/**
 * Extends {@link JABS_Engine.executeMapAction}.<br/>
 * Runs caster-facing juice after JABS core and after higher-priority wrappers such as Poses.
 */
J.ABS.EXT.JUICE.Aliased.JABS_Engine.set('executeMapAction', JABS_Engine.prototype.executeMapAction);
JABS_Engine.prototype.executeMapAction = function(caster, action, targetX, targetY)
{
  // perform original logic (poses, cooldown routing, generation, etc.).
  J.ABS.EXT.JUICE.Aliased.JABS_Engine.get('executeMapAction')
    .call(this, caster, action, targetX, targetY);

  // attach caster-side strike / dodge / heal pulses without blocking gameplay logic.
  JuiceHookManager.onExecuteMapAction(caster, action);
};
//endregion JABS_Engine (juice hooks)