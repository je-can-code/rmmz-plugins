//region JABS_InputAdapter.getAllControllers
/**
 * Gets all registered input controllers managed by the adapter.
 * Returns a shallow copy to prevent external mutation.
 * @returns {JABS_StandardController[]} The list of registered controllers.
 */
JABS_InputAdapter.getAllControllers = function()
{
  // return a shallow copy of the internal controllers list.
  return this.controllers.slice(0);
};
//endregion JABS_InputAdapter.getAllControllers