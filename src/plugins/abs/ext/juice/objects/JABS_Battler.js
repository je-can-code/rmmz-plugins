//region JABS_Battler (casting hooks)
import JuiceHookManager from './../managers/JuiceHookManager.js';
/**
 * Extends {@link JABS_Battler.processCastingTimer}.<br/>
 * Keeps casting pulse juice alive while the battler remains in a casting state.
 */
J.ABS.EXT.JUICE.Aliased.JABS_Battler.set('processCastingTimer', JABS_Battler.prototype.processCastingTimer);
JABS_Battler.prototype.processCastingTimer = function()
{
  // advance timers exactly like core JABS (cast countdown may finish inside here).
  J.ABS.EXT.JUICE.Aliased.JABS_Battler.get('processCastingTimer')
    .call(this);

  // if still casting after countdown, keep the lightweight pulse scheduled once per session.
  if (this.isCasting())
  {
    JuiceHookManager.tickCastingJuice(this);
  }
};

/**
 * Extends {@link JABS_Battler.onCastComplete}.<br/>
 * Clears casting-layer transforms before the decided action executes on the map.
 */
J.ABS.EXT.JUICE.Aliased.JABS_Battler.set('onCastComplete', JABS_Battler.prototype.onCastComplete);
JABS_Battler.prototype.onCastComplete = function()
{
  // tear down casting pulse first so execution-time strike juice reads a neutral sprite baseline.
  JuiceHookManager.endCastingJuice(this);

  // fire the normal cast-completion pipeline (completeCast, generation, etc.).
  J.ABS.EXT.JUICE.Aliased.JABS_Battler.get('onCastComplete')
    .call(this);
};
//endregion JABS_Battler (casting hooks)