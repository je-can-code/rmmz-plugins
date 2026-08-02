//region Scene_Equip
/**
 * Gets the window listing this actor's equipment slots.
 * @returns {Window_EquipSlot} The slotWindow.
 */
Scene_Equip.prototype.slotWindow = function()
{
  // hand back the window listing this actor's equipment slots.
  return this._slotWindow;
};

/**
 * Gets the window listing equippable items for the chosen slot.
 * @returns {Window_EquipItem} The itemWindow.
 */
Scene_Equip.prototype.itemWindow = function()
{
  // hand back the window listing equippable items for the chosen slot.
  return this._itemWindow;
};

/**
 * Sets the window listing equippable items for the chosen slot.
 * @param {Window_EquipItem} newItemWindow The new itemWindow.
 */
Scene_Equip.prototype.setItemWindow = function(newItemWindow)
{
  // assign the window listing equippable items for the chosen slot.
  this._itemWindow = newItemWindow;
};

/**
 * Gets the window previewing parameter changes.
 * @returns {Window_EquipStatus} The statusWindow.
 */
Scene_Equip.prototype.statusWindow = function()
{
  // hand back the window previewing parameter changes.
  return this._statusWindow;
};
//endregion Scene_Equip
