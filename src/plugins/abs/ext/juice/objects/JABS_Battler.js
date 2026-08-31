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
  // perform original logic.
  J.ABS.EXT.JUICE.Aliased.JABS_Battler.get('processCastingTimer')
    .call(this);

  // renew the casting pulse for as long as the cast is still running. this fires every frame on
  // purpose — the pulse is declared with a few frames of life, so a cast that ends by any route at
  // all, hooked or not, stops renewing it and it lapses on its own.
  //
  // death is the one route that does not stop it by itself: JABS keeps advancing a defeated
  // battler's timers while its corpse plays out, and nothing clears the casting flag on the way
  // out, so a caster killed mid-incantation would go on glowing all the way through its collapse.
  if (this.isCasting() === true && this.isDead() === false)
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
  // perform original logic.
  J.ABS.EXT.JUICE.Aliased.JABS_Battler.get('onCastComplete')
    .call(this);
};
//endregion JABS_Battler (casting hooks)