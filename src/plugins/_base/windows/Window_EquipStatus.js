//region Window_EquipStatus
/**
 * Gets the actor whose parameters are displayed.
 * @returns {Game_Actor} The actor.
 */
Window_EquipStatus.prototype.actor = function()
{
  // hand back the actor whose parameters are displayed.
  return this._actor;
};

/**
 * Gets the hypothetical actor used to preview parameter changes.
 * @returns {Game_Actor} The tempActor.
 */
Window_EquipStatus.prototype.tempActor = function()
{
  // hand back the hypothetical actor used to preview parameter changes.
  return this._tempActor;
};
//endregion Window_EquipStatus
