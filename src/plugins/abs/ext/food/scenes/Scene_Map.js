//region Scene_Map food extensions

//region initJabsMenu
/**
 * Extends {@link Scene_Map.prototype.initJabsMenu}.<br>
 * Initializes null placeholders for the two food-related ABS menu windows
 * so references are safe before `createJabsAbsMenu` runs.
 */
J.ABS.EXT.FOOD.Aliased.Scene_Map.set('initJabsMenu', Scene_Map.prototype.initJabsMenu);
Scene_Map.prototype.initJabsMenu = function()
{
  // perform original logic.
  J.ABS.EXT.FOOD.Aliased.Scene_Map.get('initJabsMenu').call(this);

  /**
   * The window listing food items available for equipping to the food slot.
   * @type {Window_AbsMenuSelect|null}
   */
  this._j._absMenu._foodWindow = null;

  /**
   * The window showing the currently equipped food item in the food slot.
   * @type {Window_AbsMenuSelect|null}
   */
  this._j._absMenu._equipFoodWindow = null;
};
//endregion initJabsMenu

//region createJabsAbsMenu
/**
 * Extends {@link Scene_Map.prototype.createJabsAbsMenu}.<br>
 * Creates the food list window and the equipped food window alongside the
 * other ABS menu windows.
 */
J.ABS.EXT.FOOD.Aliased.Scene_Map.set('createJabsAbsMenu', Scene_Map.prototype.createJabsAbsMenu);
Scene_Map.prototype.createJabsAbsMenu = function()
{
  // perform original logic.
  J.ABS.EXT.FOOD.Aliased.Scene_Map.get('createJabsAbsMenu').call(this);

  // create the food list window (all food items the party holds).
  this.createJabsAbsMenuFoodListWindow();

  // create the equipped food window (the current food slot assignment).
  this.createJabsAbsMenuEquipFoodWindow();
};
//endregion createJabsAbsMenu

//region buildJabsMenuMainWindow (handler registration)
/**
 * Extends {@link Scene_Map.prototype.buildJabsMenuMainWindow}.<br>
 * Registers the food-assign handler so selecting "Equip Food" in the main
 * JABS menu routes to {@link commandFood}.
 * @returns {Window_AbsMenu} The configured main menu window.
 */
J.ABS.EXT.FOOD.Aliased.Scene_Map.set('buildJabsMenuMainWindow', Scene_Map.prototype.buildJabsMenuMainWindow);
Scene_Map.prototype.buildJabsMenuMainWindow = function()
{
  // perform original logic to build and configure the base main menu window.
  const window = J.ABS.EXT.FOOD.Aliased.Scene_Map.get('buildJabsMenuMainWindow').call(this);

  // register the food-assign command handler.
  window.setHandler('food-assign', this.commandFood.bind(this));

  return window;
};
//endregion buildJabsMenuMainWindow (handler registration)

//region food list window getters/setters
/**
 * Gets the food list window.
 * @returns {Window_AbsMenuSelect|null}
 */
Scene_Map.prototype.getJabsFoodListWindow = function()
{
  return this._j._absMenu._foodWindow;
};

/**
 * Sets the food list window.
 * @param {Window_AbsMenuSelect} window The food list window to track.
 */
Scene_Map.prototype.setJabsFoodListWindow = function(window)
{
  this._j._absMenu._foodWindow = window;
};

/**
 * Gets the equipped food window.
 * @returns {Window_AbsMenuSelect|null}
 */
Scene_Map.prototype.getJabsEquippedFoodWindow = function()
{
  return this._j._absMenu._equipFoodWindow;
};

/**
 * Sets the equipped food window.
 * @param {Window_AbsMenuSelect} window The equipped food window to track.
 */
Scene_Map.prototype.setJabsEquippedFoodWindow = function(window)
{
  this._j._absMenu._equipFoodWindow = window;
};
//endregion food list window getters/setters

//region createJabsAbsMenuFoodListWindow
/**
 * Creates the food list window and registers it with the scene.
 */
Scene_Map.prototype.createJabsAbsMenuFoodListWindow = function()
{
  // build the window.
  const window = this.buildJabsAbsMenuFoodListWindow();

  // register it for tracking.
  this.setJabsFoodListWindow(window);

  // add to the scene's window list.
  this.addWindow(window);
};

/**
 * Builds and configures the food list window.
 * @returns {Window_AbsMenuSelect} The configured food list window.
 */
Scene_Map.prototype.buildJabsAbsMenuFoodListWindow = function()
{
  // determine the window rectangle.
  const rectangle = this.jabsFoodSkillListWindowRectangle();

  // create the window with the FoodList selection type.
  const window = new Window_AbsMenuSelect(rectangle, Window_AbsMenuSelect.SelectionTypes.FoodList);

  // cancel closes the food context and returns to the main menu.
  window.setHandler('cancel', this.closeAbsWindow.bind(this, Window_AbsMenuSelect.SelectionTypes.FoodList));

  // selecting a food item advances to the equip confirmation window.
  window.setHandler('food', this.commandEquipFood.bind(this));

  // start closed and hidden.
  window.close();
  window.hide();

  return window;
};

/**
 * Builds the rectangle for the food item list window.
 * Mirrors the tool list rectangle: 66% width, right-aligned, full height.
 * @returns {Rectangle}
 */
Scene_Map.prototype.jabsFoodSkillListWindowRectangle = function()
{
  // two-thirds of the screen width.
  const width = Math.round(Graphics.boxWidth * 0.66);

  // each command item takes this many pixels.
  const commandHeight = 72;

  // ten items tall with a small buffer.
  const height = commandHeight * 10 + 40;

  // push against the right edge.
  const x = Graphics.boxWidth - width;

  const y = 0;

  return new Rectangle(x, y, width, height);
};
//endregion createJabsAbsMenuFoodListWindow

//region createJabsAbsMenuEquipFoodWindow
/**
 * Creates the equipped food window and registers it with the scene.
 */
Scene_Map.prototype.createJabsAbsMenuEquipFoodWindow = function()
{
  // build the window.
  const window = this.buildJabsAbsMenuEquipFoodWindow();

  // register it for tracking.
  this.setJabsEquippedFoodWindow(window);

  // add to the scene's window list.
  this.addWindow(window);
};

/**
 * Builds and configures the equipped food window.
 * @returns {Window_AbsMenuSelect} The configured equipped food window.
 */
Scene_Map.prototype.buildJabsAbsMenuEquipFoodWindow = function()
{
  // determine the window rectangle.
  const rectangle = this.jabsEquippedFoodWindowRectangle();

  // create the window with the FoodEquip selection type.
  const window = new Window_AbsMenuSelect(rectangle, Window_AbsMenuSelect.SelectionTypes.FoodEquip);

  // cancel returns to the food list.
  window.setHandler('cancel', this.closeAbsWindow.bind(this, JABS_MenuType.Assign));

  // selecting the slot fires the standard assign handler.
  window.setHandler('slot', this.commandAssign.bind(this));

  // start closed and hidden.
  window.close();
  window.hide();

  return window;
};

/**
 * Builds the rectangle for the equipped food slot window.
 * Sits just below the food list, right-aligned.
 * @returns {Rectangle}
 */
Scene_Map.prototype.jabsEquippedFoodWindowRectangle = function()
{
  // fixed width matching the tool equip window.
  const width = 400;

  // just enough height for one item.
  const height = 96;

  // push against the right edge.
  const x = Graphics.boxWidth - width;

  // place it immediately below the food list.
  const parentRectangle = this.jabsFoodSkillListWindowRectangle();
  const y = parentRectangle.y + parentRectangle.height;

  return new Rectangle(x, y, width, height);
};
//endregion createJabsAbsMenuEquipFoodWindow

//region show/hide food windows
/**
 * Shows the food list window.
 */
Scene_Map.prototype.showJabsFoodListWindow = function()
{
  this.showJabsMenuWindow(this.getJabsFoodListWindow());
};

/**
 * Hides the food list window.
 */
Scene_Map.prototype.hideJabsFoodListWindow = function()
{
  this.hideJabsMenuWindow(this.getJabsFoodListWindow());
};

/**
 * Shows the equipped food window.
 */
Scene_Map.prototype.showJabsEquippedFoodWindow = function()
{
  this.showJabsMenuWindow(this.getJabsEquippedFoodWindow());
};

/**
 * Hides the equipped food window.
 */
Scene_Map.prototype.hideJabsEquippedFoodWindow = function()
{
  this.hideJabsMenuWindow(this.getJabsEquippedFoodWindow());
};
//endregion show/hide food windows

//region commandFood
/**
 * When the "Equip Food" option is chosen from the JABS main menu,
 * opens the food list and shows the currently equipped food slot.
 * Mirrors the pattern of commandItem/commandDodge exactly.
 */
Scene_Map.prototype.commandFood = function()
{
  // set the menu focus to the food context.
  this.setJabsMenuFocus(JABS_MenuType.Food);

  // refresh the food list window.
  this.getJabsFoodListWindow().refresh();

  // show and configure the equipped food side panel.
  this.getJabsEquippedFoodWindow().refresh();
  this.showJabsEquippedFoodWindow();
  this.getJabsEquippedFoodWindow().deselect();
  this.getJabsEquippedFoodWindow().deactivate();

  // show the food list window and give it focus.
  this.showJabsFoodListWindow();

  // record the equip type so commandAssign knows what slot to write.
  this.setJabsMenuEquipType(JABS_MenuType.Food);
};
//endregion commandFood

//region commandEquipFood
/**
 * When a food item is selected from the food list, advance focus to the
 * equip slot confirmation window.
 * Mirrors commandEquipTool exactly.
 */
Scene_Map.prototype.commandEquipFood = function()
{
  // shift focus to the assign context.
  this.setJabsMenuFocus(JABS_MenuType.Assign);

  // grab and refresh the equip window.
  const window = this.getJabsEquippedFoodWindow();
  window.refresh();
  window.select(0);

  // show the equip window and hand it focus.
  this.showJabsEquippedFoodWindow();
};
//endregion commandEquipFood

//region manageAbsMenu (Food focus case)
/**
 * Extends {@link Scene_Map.prototype.manageAbsMenu}.<br>
 * Handles the Food focus case so the menu manager shows the food list
 * when focus is set to JABS_MenuType.Food.
 */
J.ABS.EXT.FOOD.Aliased.Scene_Map.set('manageAbsMenu', Scene_Map.prototype.manageAbsMenu);
Scene_Map.prototype.manageAbsMenu = function()
{
  // check if this frame belongs to the food context.
  if (this.getJabsMenuFocus() === JABS_MenuType.Food)
  {
    // hide the main window and show the food list.
    this.hideJabsMainWindow();
    this.showJabsFoodListWindow();
    return;
  }

  // perform original logic for all other focus types.
  J.ABS.EXT.FOOD.Aliased.Scene_Map.get('manageAbsMenu').call(this);
};
//endregion manageAbsMenu (Food focus case)

//region closeAbsWindow (Food cases)
/**
 * Extends {@link Scene_Map.prototype.closeAbsWindow}.<br>
 * Adds handling for the Food menu context and the FoodList selection type
 * so that Cancel in food-related windows routes correctly.
 * @param {string} absWindow The type of ABS window being closed.
 */
J.ABS.EXT.FOOD.Aliased.Scene_Map.set('closeAbsWindow', Scene_Map.prototype.closeAbsWindow);
Scene_Map.prototype.closeAbsWindow = function(absWindow)
{
  // closing the food list window returns to the main menu.
  if (absWindow === Window_AbsMenuSelect.SelectionTypes.FoodList)
  {
    this.hideJabsFoodListWindow();
    this.hideJabsEquippedFoodWindow();
    this.setJabsMenuFocus(JABS_MenuType.Main);
    return;
  }

  // perform original logic for all other close scenarios.
  J.ABS.EXT.FOOD.Aliased.Scene_Map.get('closeAbsWindow').call(this, absWindow);
};
//endregion closeAbsWindow (Food cases)

//region redirectToParentAssignMenu (Food case)
/**
 * Extends {@link Scene_Map.prototype.redirectToParentAssignMenu}.<br>
 * Adds the Food equip-type case so that cancelling from the equipped food
 * confirmation window returns focus to the food list.
 */
J.ABS.EXT.FOOD.Aliased.Scene_Map.set(
  'redirectToParentAssignMenu', Scene_Map.prototype.redirectToParentAssignMenu);
Scene_Map.prototype.redirectToParentAssignMenu = function()
{
  // handle the food equip type redirect before the original switch fires.
  if (this.getJabsMenuEquipType() === JABS_MenuType.Food)
  {
    // deselect and refresh the equip window, then re-activate the food list.
    const equippedFoodWindow = this.getJabsEquippedFoodWindow();
    equippedFoodWindow.deselect();
    equippedFoodWindow.refresh();
    this.getJabsFoodListWindow().activate();
    return;
  }

  // perform original logic for all other equip types.
  J.ABS.EXT.FOOD.Aliased.Scene_Map.get('redirectToParentAssignMenu').call(this);
};
//endregion redirectToParentAssignMenu (Food case)

//region commandAssign (Food case)
/**
 * Extends {@link Scene_Map.prototype.commandAssign}.<br>
 * Adds the Food equip-type case so that confirming a food item from the
 * food list correctly writes the selection to the actor's food slot.
 */
J.ABS.EXT.FOOD.Aliased.Scene_Map.set('commandAssign', Scene_Map.prototype.commandAssign);
Scene_Map.prototype.commandAssign = function()
{
  // handle the food assignment case separately from the base implementation.
  if (this.getJabsMenuEquipType() === JABS_MenuType.Food)
  {
    // grab the leader for reference.
    const actor = $gameParty.leader();

    // the equip window holds the slot key; the food list holds the item id.
    const equippedActionSlot = this.getJabsEquippedFoodWindow().currentExt();
    const nextActionSkill = this.getJabsFoodListWindow().currentExt();

    // write the food item to the food slot.
    actor.setEquippedSkill(equippedActionSlot, nextActionSkill);

    // return to the food list after assignment.
    this.closeAbsWindow(JABS_MenuType.Assign);
    return;
  }

  // perform original logic for all other equip types.
  J.ABS.EXT.FOOD.Aliased.Scene_Map.get('commandAssign').call(this);
};
//endregion commandAssign (Food case)

//region hideAllJabsWindows (Food windows)
/**
 * Extends {@link Scene_Map.prototype.hideAllJabsWindows}.<br>
 * Ensures the food list and equipped food windows are also hidden when
 * the entire JABS menu is torn down.
 */
J.ABS.EXT.FOOD.Aliased.Scene_Map.set('hideAllJabsWindows', Scene_Map.prototype.hideAllJabsWindows);
Scene_Map.prototype.hideAllJabsWindows = function()
{
  // perform original logic to hide the existing windows.
  J.ABS.EXT.FOOD.Aliased.Scene_Map.get('hideAllJabsWindows').call(this);

  // also tear down the food-specific windows.
  this.hideJabsFoodListWindow();
  this.hideJabsEquippedFoodWindow();
};
//endregion hideAllJabsWindows (Food windows)

//region forceCloseAbsMenu (Food case)
/**
 * Extends {@link Scene_Map.prototype.forceCloseAbsMenu}.<br>
 * Includes the Food focus type in the full-menu force-close sweep.
 */
J.ABS.EXT.FOOD.Aliased.Scene_Map.set('forceCloseAbsMenu', Scene_Map.prototype.forceCloseAbsMenu);
Scene_Map.prototype.forceCloseAbsMenu = function()
{
  // close the food context before the main logic clears everything else.
  this.closeAbsWindow(Window_AbsMenuSelect.SelectionTypes.FoodList);

  // perform original logic.
  J.ABS.EXT.FOOD.Aliased.Scene_Map.get('forceCloseAbsMenu').call(this);
};
//endregion forceCloseAbsMenu (Food case)
//endregion Scene_Map food extensions