//region Game_ActionResult
/**
 * Extends {@link Game_ActionResult.initialize}.<br/>
 * Also runs the member-initialization hook every plugin hangs its own state off.
 */
J.BASE.Aliased.Game_ActionResult.set('initialize', Game_ActionResult.prototype.initialize);
Game_ActionResult.prototype.initialize = function()
{
  // perform original logic.
  J.BASE.Aliased.Game_ActionResult.get('initialize')
    .call(this);

  // initialize our class members.
  this.initMembers();
};

/**
 * A hook for initializing additional members in {@link Game_ActionResult}.<br>
 *
 * Vanilla sets a result up inside `initialize`, which a decode can never re-run, so plugin state
 * added through it would come back missing. A result reaches a savefile nested on every battler, so
 * its codec seeds the engine's own fields and then calls this.
 *
 * **Plugins adding state to an action result alias this, not `initialize`.**
 */
Game_ActionResult.prototype.initMembers = function()
{
};
//endregion Game_ActionResult
