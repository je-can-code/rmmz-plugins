//region plugins/natural/_component/test-helpers.js
/**
 * Wraps an actor instance so `refreshAllParameterBuffs` can be counted; returns a getter for the count.
 *
 * @param {object} sandbox
 * @param {object} actor
 * @returns {() => number}
 */
export function wrapActorRefreshCounter(sandbox, actor)
{
  const impl = sandbox.Game_Actor.prototype.refreshAllParameterBuffs;
  let count = 0;

  actor.refreshAllParameterBuffs = function()
  {
    count++;
    return impl.call(this);
  };

  return () => count;
}
//endregion plugins/natural/_component/test-helpers.js
