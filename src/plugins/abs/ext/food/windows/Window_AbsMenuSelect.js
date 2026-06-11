//region Window_AbsMenuSelect food extensions

//region isItemVisibleInToolMenu
/**
 * Extends {@link Window_AbsMenuSelect.prototype.isItemVisibleInToolMenu}.<br>
 * Items tagged with {@code <food:TYPE>} are routed to the dedicated R2 food equip menu
 * rather than the Triangle tool slot list.
 * @param {RPG_Item} item The item to evaluate.
 * @returns {boolean} True when the item belongs in the tool list.
 */
J.ABS.EXT.FOOD.Aliased.Window_AbsMenuSelect.set('isItemVisibleInToolMenu', Window_AbsMenuSelect.prototype.isItemVisibleInToolMenu);
Window_AbsMenuSelect.prototype.isItemVisibleInToolMenu = function(item)
{
  // perform original logic.
  const isVisible = J.ABS.EXT.FOOD.Aliased.Window_AbsMenuSelect.get('isItemVisibleInToolMenu').call(this, item);

  // if the original says no, respect that.
  if (isVisible === false) return false;

  // food items belong in the food menu, not the tool menu.
  if (item.jabsFoodType !== null) return false;

  return true;
};
//endregion isItemVisibleInToolMenu

//region isItemVisibleInFoodMenu
/**
 * Determines whether the given item should appear in the JABS food equip menu.
 * Only items carrying a {@code <food:TYPE>} tag are eligible; standard visibility
 * rules still apply.
 *
 * Other plugins may alias this method to add additional conditions.
 * @param {RPG_Item} item The item to evaluate.
 * @returns {boolean} True when the item belongs in the food equip list.
 */
Window_AbsMenuSelect.prototype.isItemVisibleInFoodMenu = function(item)
{
  // invalid items are never visible.
  if (!item) return false;

  // explicitly hidden items are excluded from all menus.
  if (item.jabsHiddenFromMenus) return false;

  // only regular, always-occasion items can appear in the food menu.
  const isItem = DataManager.isItem(item) && item.itypeId === 1;
  const isUsable = isItem && (item.occasion === 0);
  if (!isItem || !isUsable) return false;

  // the item must declare a food group type to appear in the food menu.
  if (!item.jabsFoodType) return false;

  return true;
};
//endregion isItemVisibleInFoodMenu

//region makeCommandList
/**
 * Extends {@link Window_AbsMenuSelect.prototype.makeCommandList}.<br>
 * Adds handling for the FoodList and FoodEquip selection types so that the food
 * assign menus are built when this window is opened in food context.
 */
J.ABS.EXT.FOOD.Aliased.Window_AbsMenuSelect.set('makeCommandList', Window_AbsMenuSelect.prototype.makeCommandList);
Window_AbsMenuSelect.prototype.makeCommandList = function()
{
  // check if this window is in food-list mode.
  if (this._j._menuType === Window_AbsMenuSelect.SelectionTypes.FoodList)
  {
    // build the full list of food items in the party's inventory.
    this.makeFoodList();
    return;
  }

  // check if this window is in food-equip (currently equipped slot) mode.
  if (this._j._menuType === Window_AbsMenuSelect.SelectionTypes.FoodEquip)
  {
    // build the single-slot currently equipped food command.
    this.makeEquippedFoodList();
    return;
  }

  // perform original logic for all other selection types.
  J.ABS.EXT.FOOD.Aliased.Window_AbsMenuSelect.get('makeCommandList').call(this);
};
//endregion makeCommandList

//region makeFoodList
/**
 * Fills this window with all food items currently held by the party.
 * Mirrors {@link Window_AbsMenuSelect.prototype.makeToolList} but
 * filters by {@link Window_AbsMenuSelect.prototype.isItemVisibleInFoodMenu} instead.
 */
Window_AbsMenuSelect.prototype.makeFoodList = function()
{
  // initialize the blank command list.
  const commands = Array.empty;

  // build the clear slot command.
  const clearSlotCommand = new WindowCommandBuilder(J.ABS.Metadata.ClearSlotText)
    .setSymbol('food')
    .setColorIndex(16)
    .setTextLines([ 'Remove the currently equipped food item from the slot.' ])
    .build();

  commands.push(clearSlotCommand);

  // an iterator function that builds one food item command.
  const forEacher = foodItem =>
  {
    // unpack the commonly needed properties from the database item.
    const {
      name,
      id,
      iconIndex,
      description,
    } = foodItem;

    // show quantity for consumable food items.
    const amount = foodItem.consumable
      ? $gameParty.numItems(foodItem).padZero(3)
      : '♾';

    // build the command for this food item.
    const foodCommand = new WindowCommandBuilder(name)
      .setSymbol('food')
      .setExtensionData(id)
      .setIconIndex(iconIndex)
      .setHelpText(description)
      .setRightText(`x${amount}`)
      .setTextLines(description.split(/[\r\n]+/))
      .build();

    commands.push(foodCommand);
  };

  // filter the party's full inventory down to food items only.
  const foodItems = $gameParty.allItems()
    .filter(item => this.isItemVisibleInFoodMenu(item));

  // build each food command.
  foodItems.forEach(forEacher, this);

  // render all built commands.
  commands.forEach(this.addBuiltCommand, this);
};
//endregion makeFoodList

//region makeEquippedFoodList
/**
 * Fills this window with a single row representing the currently equipped
 * food item in the leader's food slot, or the unassigned placeholder.
 * Mirrors {@link Window_AbsMenuSelect.prototype.makeEquippedToolList}.
 */
Window_AbsMenuSelect.prototype.makeEquippedFoodList = function()
{
  // grab the food skill slot from the leader's slot manager.
  const foodSkillSlot = $gameParty.leader().getUsableItemSkillSlot();

  // resolve the equipped food item; fall back to the empty sentinel when the slot is bare.
  const equippedFood = foodSkillSlot.isUsable()
    ? $dataItems.at(foodSkillSlot.id)
    : RPG_BaseItem.Empty;

  // an empty slot shows the slot key and unassigned label instead of an item name.
  const name = equippedFood.id > 0
    ? equippedFood.name
    : `${foodSkillSlot.key}: ${J.ABS.Metadata.UnassignedText}`;

  // icon and description come straight from the item (or zeroed from the sentinel).
  const { iconIndex, description } = equippedFood;

  // quantity is only meaningful when a real item is equipped.
  let amount = String.empty;
  if (equippedFood.id > 0)
  {
    amount = equippedFood.consumable
      ? $gameParty.numItems(equippedFood).padZero(3)
      : '♾';
  }

  // build the single equip-slot command.
  const command = new WindowCommandBuilder(name)
    .setSymbol('slot')
    .setExtensionData(foodSkillSlot.key)
    .setIconIndex(iconIndex)
    .setRightText(`x${amount}`)
    .setHelpText(description)
    .build();

  this.addBuiltCommand(command);
};
//endregion makeEquippedFoodList
//endregion Window_AbsMenuSelect food extensions