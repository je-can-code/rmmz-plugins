//region Window_EquipItem
/**
 * Overwrites {@link #updateHelp}.<br/>
 * Enables extension of the method's logic for various menu needs.
 */
Window_EquipItem.prototype.updateHelp = function()
{
  // perform parent logic.
  Window_ItemList.prototype.updateHelp.call(this);

  // validate we can update the actor comparison data.
  if (this.actor() && this.statusWindow() && this.slotId() >= 0)
  {
    // update the actor comparison.
    this.updateActorComparison();
  }
};

/**
 * Updates the actor comparison of the status window by duplicating the actor
 * and forcefully equipping it with the hovered item.
 */
Window_EquipItem.prototype.updateActorComparison = function()
{
  // duplicate the actor.
  const actorClone = this.getActorClone(this.actor());

  // perform setup before force-equipping the hovered item.
  this.preEquipSetupActorClone(actorClone);

  // force the duplicate actor to equip the hovered item.
  actorClone.forceChangeEquip(this.slotId(), this.item());

  // perform setup after force-equipping the hovered item.
  this.postEquipSetupActorClone(actorClone);

  // update the status window with this new item.
  this.statusWindow().setTempActor(actorClone);
};

/**
 * Duplicates a given actor.
 *
 * The duplicate is not a real version of the {@link Game_Actor} class, but
 * will have access to its prototypical inheritance.
 * @param {Game_Actor} actorToCopy The actor to make a copy of.
 * @returns {Game_Actor} A non-referenced duplicate of the given actor.
 */
Window_EquipItem.prototype.getActorClone = function(actorToCopy)
{
  return JsonEx.makeDeepCopy(actorToCopy);
};

/**
 * A hook for performing logic on the clone of the actor for the status window.
 * This is fired before equipping the actor clone with the equipment.
 * @param {Game_Actor} actorClone The clone of the actor.
 */
// eslint-disable-next-line no-unused-vars
Window_EquipItem.prototype.preEquipSetupActorClone = function(actorClone)
{
};

/**
 * A hook for performing logic on the clone of the actor for the status window.
 * This is fired after equipping the actor clone with the equipment.
 * @param {Game_Actor} actorClone The clone of the actor.
 */
// eslint-disable-next-line no-unused-vars
Window_EquipItem.prototype.postEquipSetupActorClone = function(actorClone)
{
};

/**
 * Gets the actor whose equipment is being changed.
 * @returns {Game_Actor} The actor.
 */
Window_EquipItem.prototype.actor = function()
{
  // hand back the actor whose equipment is being changed.
  return this._actor;
};

/**
 * Gets the status window previewing this selection.
 * @returns {Window_EquipStatus} The statusWindow.
 */
Window_EquipItem.prototype.statusWindow = function()
{
  // hand back the status window previewing this selection.
  return this._statusWindow;
};

/**
 * Gets the equipment slot currently being filled.
 * @returns {number} The slotId.
 */
Window_EquipItem.prototype.slotId = function()
{
  // hand back the equipment slot currently being filled.
  return this._slotId;
};
//endregion Window_EquipItem