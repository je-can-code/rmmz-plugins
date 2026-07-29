//region Scene_Map
import JABS_MenuType from '../models/JABS_MenuFocus.js';
import JABS_AiManager from './../managers/JABS_AiManager.js';
import Window_AbsMenu from './../windows/Window_AbsMenu.js';
//region init
/**
 * Extends {@link #initialize}.<br/>
 * Also initializes all additional properties for JABS.
 */
J.ABS.Aliased.Scene_Map.set('initialize', Scene_Map.prototype.initialize);
Scene_Map.prototype.initialize = function()
{
  // perform original logic.
  J.ABS.Aliased.Scene_Map.get('initialize')
    .call(this);

  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  // initialize custom class members.
  this.initJabsMembers();
};

/**
 * Extends {@link #onMapLoaded}.<br/>
 * Safety net for ensuring the player's battler is initialized with the map load.
 */
J.ABS.Aliased.Scene_Map.set('onMapLoaded', Scene_Map.prototype.onMapLoaded);
Scene_Map.prototype.onMapLoaded = function()
{
  // check if JABS is enabled.
  if ($jabsEngine.absEnabled)
  {
    // initialize player 1.
    $jabsEngine.initializePlayer1();
  }

  // perform original logic.
  J.ABS.Aliased.Scene_Map.get('onMapLoaded')
    .call(this);
};

/**
 * Initializes all JABS components.
 */
Scene_Map.prototype.initJabsMembers = function()
{
  this.initJabsMenu();
};

/**
 * Initializes the JABS menu.
 */
Scene_Map.prototype.initJabsMenu = function()
{
  /**
   * The over-arching container for all things relating to the JABS menu.
   */
  this._j._absMenu = {};

  /**
   * The current focus that represents which submenu is selected.
   * @type {string|null}
   */
  this._j._absMenu._windowFocus = null;

  /**
   * The type of equip that is being equipped.
   * @type {string|null}
   */
  this._j._absMenu._equipType = null;

  /**
   * The primary list window of commands within the JABS menu.
   * @type {Window_AbsMenu|null}
   */
  this._j._absMenu._mainWindow = null;










};

//region properties
/**
 * Gets the current window focus of the JABS menu.
 * @returns {string|null}
 */
Scene_Map.prototype.getJabsMenuFocus = function()
{
  return this._j._absMenu._windowFocus;
};

/**
 * Sets the current window focus of the JABS menu.
 * @param {string} focus The key of the new JABS menu window to focus on.
 */
Scene_Map.prototype.setJabsMenuFocus = function(focus)
{
  this._j._absMenu._windowFocus = focus;
};



/**
 * Gets the currently tracked JABS main menu window.
 * @returns {Window_AbsMenu}
 */
Scene_Map.prototype.getJabsMainListWindow = function()
{
  return this._j._absMenu._mainWindow;
};

/**
 * Sets the currently tracked JABS main menu window to the given window.
 * @param {Window_AbsMenu} window The JABS main menu window to track.
 */
Scene_Map.prototype.setJabsMenuMainWindow = function(window)
{
  this._j._absMenu._mainWindow = window;
};
















//endregion properties
//endregion init

//region create
/**
 * Create the Hud with all the rest of the windows.
 */
J.ABS.Aliased.Scene_Map.set('createAllWindows', Scene_Map.prototype.createAllWindows);
Scene_Map.prototype.createAllWindows = function()
{
  // generate the JABS quick menu.
  this.createJabsAbsMenu();

  // perform original logic.
  J.ABS.Aliased.Scene_Map.get('createAllWindows')
    .call(this);
};

/**
 * Creates the Jabs quick menu for use.
 */
Scene_Map.prototype.createJabsAbsMenu = function()
{
  // the main window that forks into the other categories.
  this.createJabsAbsMenuMainWindow();

  // the per-category list windows of the ABS menu.
  this.createJabsAbsMenuToolListWindow();

  // the per-category equipped/landing windows for assignment.
  this.createJabsAbsMenuEquipSkillWindow();
  this.createJabsAbsMenuEquipToolWindow();
  this.createJabsAbsMenuEquipDodgeWindow();
  this.createJabsAbsMenuEquipOffhandWindow();
  this.createJabsAbsMenuUsableItemListWindow();
  this.createJabsAbsMenuEquipUsableItemWindow();
};

//region main menu
/**
 * Creates the JABS main menu window containing the list of other options
 * available for use while on the map.
 */
Scene_Map.prototype.createJabsAbsMenuMainWindow = function()
{
  // create the window.
  const window = this.buildJabsMenuMainWindow();

  // update the tracker with the new window.
  this.setJabsMenuMainWindow(window);

  // perform this once to begin with.
  window.onIndexChange();

  // add the window to the scene manager's tracking.
  this.addWindow(window);
};

/**
 * Sets up and defines the JABS main menu window.
 * @returns {Window_AbsMenu}
 */
Scene_Map.prototype.buildJabsMenuMainWindow = function()
{
  // define the rectangle of the window.
  const rectangle = this.jabsMenuMainWindowRectangle();

  // create the window with the rectangle.
  const window = new Window_AbsMenu(rectangle);

  // assign functionality for each of the commands.
  window.setHandler('main-menu', this.commandMenu.bind(this));
  window.setHandler('cancel', this.closeAbsWindow.bind(this, JABS_MenuType.Main));

  // close and hide the window by default upon creation.
  window.close();
  window.hide();

  // return the built and configured window.
  return window;
};

/**
 * Get the rectangle associated with the main list of the JABS menu.
 * @returns {Rectangle}
 */
Scene_Map.prototype.jabsMenuMainWindowRectangle = function()
{
  // the general height of a command item is this many pixels.
  const commandHeight = 36;

  // define the width arbitrarily.
  const width = 400;

  // the height should be 8 items tall.
  const height = commandHeight * 8;

  // the x coordinate should push the window against the right side.
  const x = Graphics.boxWidth - width;

  // define the y coordinate arbitrarily.
  const y = 100;

  // build the rectangle to return.
  return new Rectangle(x, y, width, height);
};
//endregion main menu

//region skill list


//endregion skill list

//region equip skill


//endregion equip skill

//region tool list


//endregion tool list

//region equip tool


//endregion equip tool

//region dodge list


//endregion dodge list

//region equip dodge


//endregion equip dodge

//region offhand list


//endregion offhand list

//region equip offhand


//endregion equip offhand

//region usable item list






//endregion usable item list

//region equip usable item


//endregion equip usable item
//endregion create

//region actions
//region command execution
/**
 * Brings up the main menu.
 */
Scene_Map.prototype.commandMenu = function()
{
  SceneManager.push(Scene_Menu);
};











//endregion command execution
//endregion actions

//region update
/**
 * Extends {@link #update}.<br/>
 * Also updates JABS.
 */
J.ABS.Aliased.Scene_Map.set('update', Scene_Map.prototype.update);
Scene_Map.prototype.update = function()
{
  // perform original logic.
  J.ABS.Aliased.Scene_Map.get('update')
    .call(this);

  // update JABS.
  this.updateJabs();
};

/**
 * Performs update logic for the JABS engine.
 */
Scene_Map.prototype.updateJabs = function()
{
  // if the ABS is disabled, then don't update it.
  if (!$jabsEngine.absEnabled) return;

  // update the JABS engine!
  JABS_AiManager.update();

  // handle the JABS menu.
  if ($jabsEngine.requestAbsMenu)
  {
    this.manageAbsMenu();
  }
  else
  {
    this.hideAllJabsWindows();
  }

  // handle rotation.
  if ($jabsEngine.requestPartyRotation)
  {
    this.handlePartyRotation();
  }

  // handle requests for refreshing the JABS quick menu.
  if ($jabsEngine.requestJabsMenuRefresh)
  {
    this.refreshJabsMenu();
  }
};

/**
 * Handles the logic in the scene for a party rotation.
 */
Scene_Map.prototype.handlePartyRotation = function()
{
  // acknowledge the party rotation request.
  $jabsEngine.requestPartyRotation = false;

  // add a hook for logic on-rotation.
  this.onPartyRotate();
};

/**
 * A hook for performing action when there was a party rotation request.
 */
Scene_Map.prototype.onPartyRotate = function()
{
};

/**
 * Refreshes the contents of the JABS menu.
 */
Scene_Map.prototype.refreshJabsMenu = function()
{
  // refresh the main menu window.
  this.getJabsMainListWindow()
    .refresh();

  // acknowledge jabs menu refresh request.
  $jabsEngine.requestJabsMenuRefresh = false;
};

/**
 * Manages the ABS main menu's interactivity.
 */
Scene_Map.prototype.manageAbsMenu = function()
{
  switch (this.getJabsMenuFocus())
  {
    case JABS_MenuType.Main:
      this.showJabsMainListWindow();
      break;
    case null:
      this.setJabsMenuFocus(JABS_MenuType.Main);
      break;
  }
};
//endregion update

/**
 * Extends {@link #callMenu}.<br/>
 * Disables the ability to directly call the menu by pressing the given key.
 */
J.ABS.Aliased.Scene_Map.set('callMenu', Scene_Map.prototype.callMenu);
Scene_Map.prototype.callMenu = function()
{
  // while JABS is enabled, the call to the menu will always fail.
  if ($jabsEngine.absEnabled) return;

  // perform original logic.
  J.ABS.Aliased.Scene_Map.get('callMenu')
    .call(this);
};

//region show/hide
//region main
/**
 * Shows the JABS menu main list window.
 */
Scene_Map.prototype.showJabsMainListWindow = function()
{
  // grab the window.
  const window = this.getJabsMainListWindow();

  // only when becoming visible so we do not fight the cursor every frame (manageAbsMenu runs per update).
  const wasHidden = !window.visible;

  // show the window.
  this.showJabsMenuWindow(window);

  // force-select the main menu.
  if (wasHidden && window.maxItems() > 1)
  {
    window.forceSelect(0);
  }
};

/**
 * Hides the JABS menu main list window.
 */
Scene_Map.prototype.hideJabsMainWindow = function()
{
  // grab the window.
  const window = this.getJabsMainListWindow();

  // hide the window.
  this.hideJabsMenuWindow(window);
};
//endregion main











/**
 * Hides all windows of the JABS menu.
 */
Scene_Map.prototype.hideAllJabsWindows = function()
{
  this.hideJabsMainWindow();

  this.closeAbsMenu();
};

/**
 * Shows a JABS menu window.
 * @param {Window_AbsMenu} window The window to show.
 */
Scene_Map.prototype.showJabsMenuWindow = function(window)
{
  // positively open it.
  window.show();
  window.open();
  window.activate();
};

/**
 * Hides a JABS menu window.
 * @param {Window_AbsMenu} window The window to hide.
 */
Scene_Map.prototype.hideJabsMenuWindow = function(window)
{
  // deselect before closing so no stale cursor state persists.
  window.deselect();

  // negatively close it.
  window.close();
  window.deactivate();
  window.hide();
};
//endregion show/hide

/**
 * Closes a given JABS menu window.
 * @param {string} absWindow The type of abs window being closed.
 */
Scene_Map.prototype.closeAbsWindow = function(absWindow)
{
  switch (absWindow)
  {
    case JABS_MenuType.Main:
      this.hideJabsMainWindow();
      this.closeAbsMenu();
      break;
  }
};


/**
 * Close out from the Abs menu.
 */
Scene_Map.prototype.closeAbsMenu = function()
{
  this.getJabsMainListWindow()
    .closeMenu();
};

/**
 * Force closes the JABS quick menu entirely.
 */
Scene_Map.prototype.forceCloseAbsMenu = function()
{
  this.closeAbsWindow(JABS_MenuType.Main);
  this.setJabsMenuFocus(JABS_MenuType.Main);
};
//endregion Scene_Map