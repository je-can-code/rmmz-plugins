//region Scene_Map
import JABS_MenuType from '../models/JABS_MenuFocus.js';
import JABS_AiManager from './../managers/JABS_AiManager.js';
import Window_AbsMenu from './../windows/Window_AbsMenu.js';
import Window_AbsMenuSelect from './../windows/Window_AbsMenuSelect.js';
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

  /**
   * The window containing the list of equippable combat skills.
   * @type {Window_AbsMenuSelect|null}
   */
  this._j._absMenu._skillWindow = null;

  /**
   * The window containing the list of equippable tools.
   * @type {Window_AbsMenuSelect|null}
   */
  this._j._absMenu._toolWindow = null;

  /**
   * The window containing the list of equippable dodge skills.
   * @type {Window_AbsMenuSelect|null}
   */
  this._j._absMenu._dodgeWindow = null;

  /**
   * The window containing the currently equipped combat skills.
   * @type {Window_AbsMenuSelect|null}
   */
  this._j._absMenu._equipSkillWindow = null;

  /**
   * The window containing the currently equipped tool.
   * @type {Window_AbsMenuSelect|null}
   */
  this._j._absMenu._equipToolWindow = null;

  /**
   * The window containing the currently equipped dodge skill.
   * @type {Window_AbsMenuSelect|null}
   */
  this._j._absMenu._equipDodgeWindow = null;

  /**
   * The window containing the list of offhand-eligible skills the leader knows.
   * @type {Window_AbsMenuSelect|null}
   */
  this._j._absMenu._offhandWindow = null;

  /**
   * The window containing the currently resolved offhand skill row.
   * @type {Window_AbsMenuSelect|null}
   */
  this._j._absMenu._equipOffhandWindow = null;

  /**
   * The window containing the list of equippable usable items (consumables).
   * @type {Window_AbsMenuSelect|null}
   */
  this._j._absMenu._usableItemWindow = null;

  /**
   * The window containing the currently equipped usable item.
   * @type {Window_AbsMenuSelect|null}
   */
  this._j._absMenu._equipUsableItemWindow = null;
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
 * Gets the currently selected menu equip type being perused.
 * @returns {string|null}
 */
Scene_Map.prototype.getJabsMenuEquipType = function()
{
  return this._j._absMenu._equipType;
};

/**
 * Sets the currently selected menu equip type being perused.
 * @param {string} equipType The currently selected menu equip type.
 */
Scene_Map.prototype.setJabsMenuEquipType = function(equipType)
{
  this._j._absMenu._equipType = equipType;
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

/**
 * Get the currently tracked JABS menu skill list window.
 * @returns {Window_AbsMenuSelect}
 */
Scene_Map.prototype.getJabsSkillListWindow = function()
{
  return this._j._absMenu._skillWindow;
};

/**
 * Set the currently tracked JABS menu combat skill list window to the given window.
 * @param {Window_AbsMenu} window The combat skill list window to track.
 */
Scene_Map.prototype.setJabsSkillListWindow = function(window)
{
  this._j._absMenu._skillWindow = window;
};

/**
 * Gets the window containing the list of equipped combat skills.
 * @returns {Window_AbsMenuSelect|null}
 */
Scene_Map.prototype.getJabsEquippedCombatSkillsWindow = function()
{
  return this._j._absMenu._equipSkillWindow;
};

/**
 * Set the currently tracked JABS menu equipped combat skills window to the given window.
 * @param {Window_AbsMenu} window The equipped combat skills window to track.
 */
Scene_Map.prototype.setJabsEquippedCombatSkillsWindow = function(window)
{
  this._j._absMenu._equipSkillWindow = window;
};

/**
 * Gets the window containing the list of equippable tools.
 * @returns {Window_AbsMenuSelect|null}
 */
Scene_Map.prototype.getJabsToolListWindow = function()
{
  return this._j._absMenu._toolWindow;
};

/**
 * Set the currently tracked JABS menu tool list window to the given window.
 * @param {Window_AbsMenu} window The tool list window to track.
 */
Scene_Map.prototype.setJabsToolListWindow = function(window)
{
  this._j._absMenu._toolWindow = window;
};

/**
 * Gets the window containing the equipped tool.
 * @returns {Window_AbsMenuSelect|null}
 */
Scene_Map.prototype.getJabsEquippedToolWindow = function()
{
  return this._j._absMenu._equipToolWindow;
};

/**
 * Set the currently tracked JABS menu equipped tool window to the given window.
 * @param {Window_AbsMenuSelect} window The equipped tool window to track.
 */
Scene_Map.prototype.setJabsEquippedToolWindow = function(window)
{
  this._j._absMenu._equipToolWindow = window;
};

/**
 * Gets the window containing the list of equippable dodge skills.
 * @returns {Window_AbsMenuSelect|null}
 */
Scene_Map.prototype.getJabsDodgeSkillListWindow = function()
{
  return this._j._absMenu._dodgeWindow;
};

/**
 * Set the currently tracked JABS menu dodge skill list window to the given window.
 * @param {Window_AbsMenuSelect} window The dodge skill list window to track.
 */
Scene_Map.prototype.setJabsDodgeSkillListWindow = function(window)
{
  this._j._absMenu._dodgeWindow = window;
};

/**
 * Gets the window containing the equipped dodge skill.
 * @returns {Window_AbsMenuSelect|null}
 */
Scene_Map.prototype.getJabsEquippedDodgeSkillWindow = function()
{
  return this._j._absMenu._equipDodgeWindow;
};

/**
 * Set the currently tracked JABS menu equipped dodge skill window to the given window.
 * @param {Window_AbsMenu} window The equipped combat skills window to track.
 */
Scene_Map.prototype.setJabsEquippedDodgeSkillWindow = function(window)
{
  this._j._absMenu._equipDodgeWindow = window;
};

/**
 * Gets the window containing the list of offhand-eligible skills.
 * @returns {Window_AbsMenuSelect|null}
 */
Scene_Map.prototype.getJabsOffhandSkillListWindow = function()
{
  return this._j._absMenu._offhandWindow;
};

/**
 * Sets the currently tracked JABS menu offhand skill list window to the given window.
 * @param {Window_AbsMenuSelect} window The offhand skill list window to track.
 */
Scene_Map.prototype.setJabsOffhandSkillListWindow = function(window)
{
  this._j._absMenu._offhandWindow = window;
};

/**
 * Gets the window containing the currently equipped offhand skill row.
 * @returns {Window_AbsMenuSelect|null}
 */
Scene_Map.prototype.getJabsEquippedOffhandSkillWindow = function()
{
  return this._j._absMenu._equipOffhandWindow;
};

/**
 * Sets the currently tracked JABS menu equipped offhand skill window to the given window.
 * @param {Window_AbsMenuSelect} window The equipped offhand skill window to track.
 */
Scene_Map.prototype.setJabsEquippedOffhandSkillWindow = function(window)
{
  this._j._absMenu._equipOffhandWindow = window;
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
  this.createJabsAbsSkillListWindow();
  this.createJabsAbsMenuToolListWindow();
  this.createJabsAbsMenuDodgeListWindow();
  this.createJabsAbsMenuOffhandListWindow();

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
  window.setHandler('skill-assign', this.commandSkill.bind(this));
  window.setHandler('dodge-assign', this.commandDodge.bind(this));
  window.setHandler('offhand-assign', this.commandOffhand.bind(this));
  window.setHandler('item-assign', this.commandItem.bind(this));
  window.setHandler('usable-item-assign', this.commandUsableItem.bind(this));
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
/**
 * Creates the skill assignment window of the Jabs quick menu.
 */
Scene_Map.prototype.createJabsAbsSkillListWindow = function()
{
  // create the window.
  const window = this.buildJabsSkillListWindow();

  // update the tracker with the new window.
  this.setJabsSkillListWindow(window);

  // add the window to the scene manager's tracking.
  this.addWindow(window);
};

/**
 * Sets up and defines the skill list of the JABS menu.
 * @returns {Window_AbsMenuSelect}
 */
Scene_Map.prototype.buildJabsSkillListWindow = function()
{
  // define the rectangle of the window.
  const rectangle = this.jabsSkillListWindowRectangle();

  // create the window with the rectangle.
  const window = new Window_AbsMenuSelect(rectangle, Window_AbsMenuSelect.SelectionTypes.SkillList);

  // assign functionality for each of the commands.
  window.setHandler('cancel', this.closeAbsWindow.bind(this, Window_AbsMenuSelect.SelectionTypes.SkillList));
  window.setHandler('skill', this.commandEquipSkill.bind(this));

  // close and hide the window by default upon creation.
  window.close();
  window.hide();

  // return the built and configured window.
  return window;
};

/**
 * Get the rectangle associated with the skill list of the JABS menu.
 * @returns {Rectangle}
 */
Scene_Map.prototype.jabsSkillListWindowRectangle = function()
{
  // define the width arbitrarily.
  const width = Math.round(Graphics.boxWidth * 0.66);

  // the general height of a command item is this many pixels.
  const commandHeight = 72;

  // the height should be 10 items tall.
  const height = commandHeight * 10 + 40;

  // the x coordinate should push the window against the right side.
  const x = Graphics.boxWidth - width;

  // define the y coordinate arbitrarily.
  const y = 0;

  // build the rectangle to return.
  return new Rectangle(x, y, width, height);
};
//endregion skill list

//region equip skill
/**
 * Creates the skill assignment window of the Jabs quick menu.
 */
Scene_Map.prototype.createJabsAbsMenuEquipSkillWindow = function()
{
  // create the window.
  const window = this.buildJabsEquippedCombatSkillsWindow();

  // update the tracker with the new window.
  this.setJabsEquippedCombatSkillsWindow(window);

  // add the window to the scene manager's tracking.
  this.addWindow(window);
};

/**
 * Sets up and defines the equipped combat skills window of the JABS menu.
 * @returns {Window_AbsMenuSelect}
 */
Scene_Map.prototype.buildJabsEquippedCombatSkillsWindow = function()
{
  // define the rectangle of the window.
  const rectangle = this.jabsEquippedCombatSkillsWindowRectangle();

  // create the window with the rectangle.
  const window = new Window_AbsMenuSelect(rectangle, Window_AbsMenuSelect.SelectionTypes.SkillEquip);

  // assign functionality for each of the commands.
  window.setHandler('cancel', this.closeAbsWindow.bind(this, JABS_MenuType.Assign));
  window.setHandler('slot', this.commandAssign.bind(this));

  // close and hide the window by default upon creation.
  window.close();
  window.hide();

  // return the built and configured window.
  return window;
};

/**
 * Get the rectangle associated with the equipped combat skills of the JABS menu.
 * @returns {Rectangle}
 */
Scene_Map.prototype.jabsEquippedCombatSkillsWindowRectangle = function()
{
  // define the width arbitrarily.
  const width = 400;

  // the general height of a command item is this many pixels.
  const commandHeight = 72;

  // the height should be 4 items tall with some padding on top and bottom.
  const height = commandHeight * 4 + 24;

  // the x coordinate should push the window against the right side.
  const x = Graphics.boxWidth - width;

  // grab the parent rectangle for location details.
  const parentRectangle = this.jabsSkillListWindowRectangle();

  // define the y coordinate arbitrarily.
  const y = parentRectangle.y + parentRectangle.height;

  // build the rectangle to return.
  return new Rectangle(x, y, width, height);
};
//endregion equip skill

//region tool list
/**
 * Creates the item assignment window of the Jabs quick menu.
 */
Scene_Map.prototype.createJabsAbsMenuToolListWindow = function()
{
  // create the window.
  const window = this.buildJabsToolListWindow();

  // update the tracker with the new window.
  this.setJabsToolListWindow(window);

  // add the window to the scene manager's tracking.
  this.addWindow(window);
};

/**
 * Sets up and defines the tool list of the JABS menu.
 * @returns {Window_AbsMenuSelect}
 */
Scene_Map.prototype.buildJabsToolListWindow = function()
{
  // define the rectangle of the window.
  const rectangle = this.jabsToolListWindowRectangle();

  // create the window with the rectangle.
  const window = new Window_AbsMenuSelect(rectangle, Window_AbsMenuSelect.SelectionTypes.ToolList);

  // assign functionality for each of the commands.
  window.setHandler('cancel', this.closeAbsWindow.bind(this, Window_AbsMenuSelect.SelectionTypes.ToolList));
  window.setHandler('tool', this.commandEquipTool.bind(this));

  // close and hide the window by default upon creation.
  window.close();
  window.hide();

  // return the built and configured window.
  return window;
};

/**
 * Get the rectangle associated with the tool list of the JABS menu.
 * @returns {Rectangle}
 */
Scene_Map.prototype.jabsToolListWindowRectangle = function()
{
  // define the width arbitrarily.
  const width = Math.round(Graphics.boxWidth * 0.66);

  // the general height of a command item is this many pixels.
  const commandHeight = 72;

  // the height should be 10 items tall with some padding on top and bottom.
  const height = commandHeight * 10 + 40;

  // the x coordinate should push the window against the right side.
  const x = Graphics.boxWidth - width;

  // define the y coordinate arbitrarily.
  const y = 0;

  // build the rectangle to return.
  return new Rectangle(x, y, width, height);
};
//endregion tool list

//region equip tool
/**
 * Creates the equip tool window of the JABS menu.
 */
Scene_Map.prototype.createJabsAbsMenuEquipToolWindow = function()
{
  // create the window.
  const window = this.buildJabsEquippedToolWindow();

  // update the tracker with the new window.
  this.setJabsEquippedToolWindow(window);

  // add the window to the scene manager's tracking.
  this.addWindow(window);
};

/**
 * Sets up and defines the equipped tool window of the JABS menu.
 * @returns {Window_AbsMenuSelect}
 */
Scene_Map.prototype.buildJabsEquippedToolWindow = function()
{
  // define the rectangle of the window.
  const rectangle = this.jabsEquippedToolWindowRectangle();

  // create the window with the rectangle.
  const window = new Window_AbsMenuSelect(rectangle, Window_AbsMenuSelect.SelectionTypes.ToolEquip);

  // assign functionality for each of the commands.
  window.setHandler('cancel', this.closeAbsWindow.bind(this, JABS_MenuType.Assign));
  window.setHandler('slot', this.commandAssign.bind(this));

  // close and hide the window by default upon creation.
  window.close();
  window.hide();

  // return the built and configured window.
  return window;
};

/**
 * Get the rectangle associated with the equipped tool of the JABS menu.
 * @returns {Rectangle}
 */
Scene_Map.prototype.jabsEquippedToolWindowRectangle = function()
{
  // define the width arbitrarily.
  const width = 400;

  // the height should be just enough to fit the single tool in there.
  const height = 96;

  // the x coordinate should push the window against the right side.
  const x = Graphics.boxWidth - width;

  // grab the parent rectangle for location details.
  const parentRectangle = this.jabsToolListWindowRectangle();

  // define the y coordinate arbitrarily.
  const y = parentRectangle.y + parentRectangle.height;

  // build the rectangle to return.
  return new Rectangle(x, y, width, height);
};
//endregion equip tool

//region dodge list
/**
 * Creates the dodge skill list window of the JABS menu.
 */
Scene_Map.prototype.createJabsAbsMenuDodgeListWindow = function()
{
  // create the window.
  const window = this.buildJabsDodgeSkillListWindow();

  // update the tracker with the new window.
  this.setJabsDodgeSkillListWindow(window);

  // add the window to the scene manager's tracking.
  this.addWindow(window);
};

/**
 * Sets up and defines the dodge skill list of the JABS menu.
 * @returns {Window_AbsMenuSelect}
 */
Scene_Map.prototype.buildJabsDodgeSkillListWindow = function()
{
  // define the rectangle of the window.
  const rectangle = this.jabsDodgeSkillListWindowRectangle();

  // create the window with the rectangle.
  const window = new Window_AbsMenuSelect(rectangle, Window_AbsMenuSelect.SelectionTypes.DodgeList);

  // assign functionality for each of the commands.
  window.setHandler('cancel', this.closeAbsWindow.bind(this, JABS_MenuType.Dodge));
  window.setHandler('dodge', this.commandEquipDodge.bind(this));

  // close and hide the window by default upon creation.
  window.close();
  window.hide();

  // return the built and configured window.
  return window;
};

/**
 * Get the rectangle associated with the dodge skill list of the JABS menu.
 * @returns {Rectangle}
 */
Scene_Map.prototype.jabsDodgeSkillListWindowRectangle = function()
{
  // define the width arbitrarily.
  const width = Math.round(Graphics.boxWidth * 0.66);

  // the general height of a command item is this many pixels.
  const commandHeight = 72;

  // the height should be 10 items tall with some padding on top and bottom.
  const height = commandHeight * 10 + 40;

  // the x coordinate should push the window against the right side.
  const x = Graphics.boxWidth - width;

  // define the y coordinate arbitrarily.
  const y = 0;

  // build the rectangle to return.
  return new Rectangle(x, y, width, height);
};
//endregion dodge list

//region equip dodge
/**
 * Creates the equip dodge skill window of the JABS menu.
 */
Scene_Map.prototype.createJabsAbsMenuEquipDodgeWindow = function()
{
  // create the window.
  const window = this.buildJabsEquippedDodgeSkillWindow();

  // update the tracker with the new window.
  this.setJabsEquippedDodgeSkillWindow(window);

  // add the window to the scene manager's tracking.
  this.addWindow(window);
};

/**
 * Sets up and defines the equipped dodge skill window of the JABS menu.
 * @returns {Window_AbsMenuSelect}
 */
Scene_Map.prototype.buildJabsEquippedDodgeSkillWindow = function()
{
  // define the rectangle of the window.
  const rectangle = this.jabsEquippedDodgeSkillWindowRectangle();

  // create the window with the rectangle.
  const window = new Window_AbsMenuSelect(rectangle, Window_AbsMenuSelect.SelectionTypes.DodgeEquip);

  // assign functionality for each of the commands.
  window.setHandler('cancel', this.closeAbsWindow.bind(this, JABS_MenuType.Assign));
  window.setHandler('slot', this.commandAssign.bind(this));

  // close and hide the window by default upon creation.
  window.close();
  window.hide();

  // return the built and configured window.
  return window;
};

/**
 * Get the rectangle associated with the equipped dodge skill of the JABS menu.
 * @returns {Rectangle}
 */
Scene_Map.prototype.jabsEquippedDodgeSkillWindowRectangle = function()
{
  // define the width arbitrarily.
  const width = 400;

  // the height should be just enough to fit the single dodge skill in there.
  const height = 96;

  // the x coordinate should push the window against the right side.
  const x = Graphics.boxWidth - width;

  // grab the parent rectangle for location details.
  const parentRectangle = this.jabsDodgeSkillListWindowRectangle();

  // define the y coordinate arbitrarily.
  const y = parentRectangle.y + parentRectangle.height;

  // build the rectangle to return.
  return new Rectangle(x, y, width, height);
};
//endregion equip dodge

//region offhand list
/**
 * Creates the offhand-eligible skill list window of the JABS menu.
 */
Scene_Map.prototype.createJabsAbsMenuOffhandListWindow = function()
{
  // create the window.
  const window = this.buildJabsOffhandSkillListWindow();

  // update the tracker with the new window.
  this.setJabsOffhandSkillListWindow(window);

  // add the window to the scene manager's tracking.
  this.addWindow(window);
};

/**
 * Sets up and defines the offhand skill list of the JABS menu.
 * @returns {Window_AbsMenuSelect}
 */
Scene_Map.prototype.buildJabsOffhandSkillListWindow = function()
{
  // define the rectangle of the window.
  const rectangle = this.jabsOffhandSkillListWindowRectangle();

  // create the window with the rectangle.
  const window = new Window_AbsMenuSelect(rectangle, Window_AbsMenuSelect.SelectionTypes.OffhandList);

  // assign functionality for each of the commands.
  window.setHandler('cancel', this.closeAbsWindow.bind(this, JABS_MenuType.Offhand));
  window.setHandler('offhand', this.commandEquipOffhand.bind(this));

  // close and hide the window by default upon creation.
  window.close();
  window.hide();

  // return the built and configured window.
  return window;
};

/**
 * Get the rectangle associated with the offhand skill list of the JABS menu.
 *
 * Mirrors the dodge list dimensions for visual parity across categories.
 * @returns {Rectangle}
 */
Scene_Map.prototype.jabsOffhandSkillListWindowRectangle = function()
{
  // define the width arbitrarily.
  const width = Math.round(Graphics.boxWidth * 0.66);

  // the general height of a command item is this many pixels.
  const commandHeight = 72;

  // the height should be 10 items tall with some padding on top and bottom.
  const height = commandHeight * 10 + 40;

  // the x coordinate should push the window against the right side.
  const x = Graphics.boxWidth - width;

  // define the y coordinate arbitrarily.
  const y = 0;

  // build the rectangle to return.
  return new Rectangle(x, y, width, height);
};
//endregion offhand list

//region equip offhand
/**
 * Creates the equip offhand skill window of the JABS menu.
 */
Scene_Map.prototype.createJabsAbsMenuEquipOffhandWindow = function()
{
  // create the window.
  const window = this.buildJabsEquippedOffhandSkillWindow();

  // update the tracker with the new window.
  this.setJabsEquippedOffhandSkillWindow(window);

  // add the window to the scene manager's tracking.
  this.addWindow(window);
};

/**
 * Sets up and defines the equipped offhand skill window of the JABS menu.
 * @returns {Window_AbsMenuSelect}
 */
Scene_Map.prototype.buildJabsEquippedOffhandSkillWindow = function()
{
  // define the rectangle of the window.
  const rectangle = this.jabsEquippedOffhandSkillWindowRectangle();

  // create the window with the rectangle.
  const window = new Window_AbsMenuSelect(rectangle, Window_AbsMenuSelect.SelectionTypes.OffhandEquip);

  // assign functionality for each of the commands.
  window.setHandler('cancel', this.closeAbsWindow.bind(this, JABS_MenuType.Assign));
  window.setHandler('slot', this.commandAssign.bind(this));

  // close and hide the window by default upon creation.
  window.close();
  window.hide();

  // return the built and configured window.
  return window;
};

/**
 * Get the rectangle associated with the equipped offhand skill of the JABS menu.
 *
 * Mirrors the equipped dodge skill dimensions: a single-row landing window beneath
 * the matching list window.
 * @returns {Rectangle}
 */
Scene_Map.prototype.jabsEquippedOffhandSkillWindowRectangle = function()
{
  // define the width arbitrarily.
  const width = 400;

  // the height should be just enough to fit the single offhand skill in there.
  const height = 96;

  // the x coordinate should push the window against the right side.
  const x = Graphics.boxWidth - width;

  // grab the parent rectangle for location details.
  const parentRectangle = this.jabsOffhandSkillListWindowRectangle();

  // define the y coordinate arbitrarily.
  const y = parentRectangle.y + parentRectangle.height;

  // build the rectangle to return.
  return new Rectangle(x, y, width, height);
};
//endregion equip offhand

//region usable item list
/**
 * Gets the window containing the list of equippable usable items.
 * @returns {Window_AbsMenuSelect|null}
 */
Scene_Map.prototype.getJabsUsableItemListWindow = function()
{
  return this._j._absMenu._usableItemWindow;
};

/**
 * Set the currently tracked JABS menu usable item list window to the given window.
 * @param {Window_AbsMenuSelect} window The usable item list window to track.
 */
Scene_Map.prototype.setJabsUsableItemListWindow = function(window)
{
  this._j._absMenu._usableItemWindow = window;
};

/**
 * Gets the window containing the equipped usable item.
 * @returns {Window_AbsMenuSelect|null}
 */
Scene_Map.prototype.getJabsEquippedUsableItemWindow = function()
{
  return this._j._absMenu._equipUsableItemWindow;
};

/**
 * Set the currently tracked JABS menu equipped usable item window to the given window.
 * @param {Window_AbsMenuSelect} window The equipped usable item window to track.
 */
Scene_Map.prototype.setJabsEquippedUsableItemWindow = function(window)
{
  this._j._absMenu._equipUsableItemWindow = window;
};

/**
 * Creates the usable item list window of the JABS menu.
 */
Scene_Map.prototype.createJabsAbsMenuUsableItemListWindow = function()
{
  // create the window.
  const window = this.buildJabsUsableItemListWindow();

  // update the tracker with the new window.
  this.setJabsUsableItemListWindow(window);

  // add the window to the scene manager's tracking.
  this.addWindow(window);
};

/**
 * Sets up and defines the usable item list of the JABS menu.
 * @returns {Window_AbsMenuSelect}
 */
Scene_Map.prototype.buildJabsUsableItemListWindow = function()
{
  // define the rectangle of the window.
  const rectangle = this.jabsUsableItemListWindowRectangle();

  // create the window with the rectangle.
  const window = new Window_AbsMenuSelect(rectangle, Window_AbsMenuSelect.SelectionTypes.UsableItemList);

  // assign functionality for each of the commands.
  window.setHandler('cancel', this.closeAbsWindow.bind(this, JABS_MenuType.UsableItem));
  window.setHandler('usable-item', this.commandEquipUsableItem.bind(this));

  // close and hide the window by default upon creation.
  window.close();
  window.hide();

  // return the built and configured window.
  return window;
};

/**
 * Get the rectangle associated with the usable item list of the JABS menu.
 * Mirrors the tool list dimensions.
 * @returns {Rectangle}
 */
Scene_Map.prototype.jabsUsableItemListWindowRectangle = function()
{
  // define the width arbitrarily.
  const width = Math.round(Graphics.boxWidth * 0.66);

  // the general height of a command item is this many pixels.
  const commandHeight = 72;

  // the height should be 10 items tall with some padding on top and bottom.
  const height = commandHeight * 10 + 40;

  // the x coordinate should push the window against the right side.
  const x = Graphics.boxWidth - width;

  // define the y coordinate arbitrarily.
  const y = 0;

  // build the rectangle to return.
  return new Rectangle(x, y, width, height);
};
//endregion usable item list

//region equip usable item
/**
 * Creates the equip usable item window of the JABS menu.
 */
Scene_Map.prototype.createJabsAbsMenuEquipUsableItemWindow = function()
{
  // create the window.
  const window = this.buildJabsEquippedUsableItemWindow();

  // update the tracker with the new window.
  this.setJabsEquippedUsableItemWindow(window);

  // add the window to the scene manager's tracking.
  this.addWindow(window);
};

/**
 * Sets up and defines the equipped usable item window of the JABS menu.
 * @returns {Window_AbsMenuSelect}
 */
Scene_Map.prototype.buildJabsEquippedUsableItemWindow = function()
{
  // define the rectangle of the window.
  const rectangle = this.jabsEquippedUsableItemWindowRectangle();

  // create the window with the rectangle.
  const window = new Window_AbsMenuSelect(rectangle, Window_AbsMenuSelect.SelectionTypes.UsableItemEquip);

  // assign functionality for each of the commands.
  window.setHandler('cancel', this.closeAbsWindow.bind(this, JABS_MenuType.Assign));
  window.setHandler('slot', this.commandAssign.bind(this));

  // close and hide the window by default upon creation.
  window.close();
  window.hide();

  // return the built and configured window.
  return window;
};

/**
 * Get the rectangle associated with the equipped usable item of the JABS menu.
 * Mirrors the equipped tool window dimensions.
 * @returns {Rectangle}
 */
Scene_Map.prototype.jabsEquippedUsableItemWindowRectangle = function()
{
  // define the width arbitrarily.
  const width = 400;

  // the height should be just enough to fit the single usable item in there.
  const height = 96;

  // the x coordinate should push the window against the right side.
  const x = Graphics.boxWidth - width;

  // grab the parent rectangle for location details.
  const parentRectangle = this.jabsUsableItemListWindowRectangle();

  // define the y coordinate arbitrarily.
  const y = parentRectangle.y + parentRectangle.height;

  // build the rectangle to return.
  return new Rectangle(x, y, width, height);
};
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

/**
 * When the "assign skills" option is chosen, it prioritizes this window.
 */
Scene_Map.prototype.commandSkill = function()
{
  // adjust the focus.
  this.setJabsMenuFocus(JABS_MenuType.Skill);

  // refresh the window.
  this.getJabsSkillListWindow()
    .refresh();

  // show the related equipped window.
  this.getJabsEquippedCombatSkillsWindow()
    .refresh();
  this.showJabsEquippedCombatSkillsWindow();
  this.getJabsEquippedCombatSkillsWindow()
    .deselect();
  this.getJabsEquippedCombatSkillsWindow()
    .deactivate();

  // show the window.
  this.showJabsSkillListWindow();

  // set the assignment type to combat skills.
  this.setJabsMenuEquipType(JABS_MenuType.Skill);
};

/**
 * When the "assign items" option is chosen, it prioritizes this window.
 */
Scene_Map.prototype.commandItem = function()
{
  // adjust the focus.
  this.setJabsMenuFocus(JABS_MenuType.Tool);

  // refresh the window.
  this.getJabsToolListWindow()
    .refresh();

  // show the related equipped window.
  this.getJabsEquippedToolWindow()
    .refresh();
  this.showJabsEquippedToolWindow();
  this.getJabsEquippedToolWindow()
    .deselect();
  this.getJabsEquippedToolWindow()
    .deactivate();

  // show the window.
  this.showJabsToolListWindow();

  // set the assignment type to tools.
  this.setJabsMenuEquipType(JABS_MenuType.Tool);
};

/**
 * When the "assign usable item" option is chosen, it prioritizes this window.
 */
Scene_Map.prototype.commandUsableItem = function()
{
  // adjust the focus.
  this.setJabsMenuFocus(JABS_MenuType.UsableItem);

  // refresh the window.
  this.getJabsUsableItemListWindow()
    .refresh();

  // show the related equipped window.
  this.getJabsEquippedUsableItemWindow()
    .refresh();
  this.showJabsEquippedUsableItemWindow();
  this.getJabsEquippedUsableItemWindow()
    .deselect();
  this.getJabsEquippedUsableItemWindow()
    .deactivate();

  // show the window.
  this.showJabsUsableItemListWindow();

  // set the assignment type to usable items.
  this.setJabsMenuEquipType(JABS_MenuType.UsableItem);
};

/**
 * When a decision is made in usable item assign, prioritize the equip window.
 */
Scene_Map.prototype.commandEquipUsableItem = function()
{
  // adjust the focus.
  this.setJabsMenuFocus(JABS_MenuType.Assign);

  // grab the window.
  const window = this.getJabsEquippedUsableItemWindow();

  // refresh the window.
  window.refresh();
  window.select(0);

  // show the window.
  this.showJabsEquippedUsableItemWindow();
};

/**
 * When the "assign dodge" option is chosen, it prioritizes this window.
 */
Scene_Map.prototype.commandDodge = function()
{
  // adjust the focus.
  this.setJabsMenuFocus(JABS_MenuType.Dodge);

  // refresh the window.
  this.getJabsDodgeSkillListWindow()
    .refresh();

  // show the related equipped window.
  this.getJabsEquippedDodgeSkillWindow()
    .refresh();
  this.showJabsEquippedDodgeSkillWindow();
  this.getJabsEquippedDodgeSkillWindow()
    .deselect();
  this.getJabsEquippedDodgeSkillWindow()
    .deactivate();

  // show the window.
  this.showJabsDodgeSkillListWindow();

  // set the assignment type to dodge skills.
  this.setJabsMenuEquipType(JABS_MenuType.Dodge);
};

/**
 * When a decision is made in skill assign, prioritize the equip window.
 */
Scene_Map.prototype.commandEquipSkill = function()
{
  // adjust the focus.
  this.setJabsMenuFocus(JABS_MenuType.Assign);

  // grab the window.
  const window = this.getJabsEquippedCombatSkillsWindow();

  // refresh the window.
  window.refresh();
  window.select(0);

  // show the window.
  this.showJabsEquippedCombatSkillsWindow();
};

/**
 * When a decision is made in tool assign, prioritize the equip window.
 */
Scene_Map.prototype.commandEquipTool = function()
{
  // adjust the focus.
  this.setJabsMenuFocus(JABS_MenuType.Assign);

  // grab the window.
  const window = this.getJabsEquippedToolWindow();

  // refresh the window.
  window.refresh();
  window.select(0);

  // show the window.
  this.showJabsEquippedToolWindow();
};

/**
 * When a decision is made in tool assign, prioritize the equip window.
 */
Scene_Map.prototype.commandEquipDodge = function()
{
  // adjust the focus.
  this.setJabsMenuFocus(JABS_MenuType.Assign);

  // grab the window.
  const window = this.getJabsEquippedDodgeSkillWindow();

  // refresh the window.
  window.refresh();
  window.select(0);

  // show the window.
  this.showJabsEquippedDodgeSkillWindow();
};

/**
 * When the "equip offhand skill" option is chosen, it prioritizes this window.
 */
Scene_Map.prototype.commandOffhand = function()
{
  // adjust the focus.
  this.setJabsMenuFocus(JABS_MenuType.Offhand);

  // refresh the window.
  this.getJabsOffhandSkillListWindow()
    .refresh();

  // show the related equipped window.
  this.getJabsEquippedOffhandSkillWindow()
    .refresh();
  this.showJabsEquippedOffhandSkillWindow();
  this.getJabsEquippedOffhandSkillWindow()
    .deselect();
  this.getJabsEquippedOffhandSkillWindow()
    .deactivate();

  // show the window.
  this.showJabsOffhandSkillListWindow();

  // set the assignment type to offhand skills.
  this.setJabsMenuEquipType(JABS_MenuType.Offhand);
};

/**
 * When a decision is made in offhand assign, prioritize the equip window.
 */
Scene_Map.prototype.commandEquipOffhand = function()
{
  // adjust the focus.
  this.setJabsMenuFocus(JABS_MenuType.Assign);

  // grab the window.
  const window = this.getJabsEquippedOffhandSkillWindow();

  // refresh the window.
  window.refresh();
  window.select(0);

  // show the window.
  this.showJabsEquippedOffhandSkillWindow();
};

/**
 * When assigning a slot, determine the last opened window and use that.
 *
 * Offhand assignments route through the actor's pin path so the choice survives
 * the next equipment-derived refresh; non-offhand slots use the legacy direct
 * setEquippedSkill path unchanged.
 */
Scene_Map.prototype.commandAssign = function()
{
  // grab the leader for reference.
  const actor = $gameParty.leader();

  // initialize the skill and slot variables.
  let nextActionSkill = 0;
  let equippedActionSlot = 0;

  // pivot on the currently perused equip type.
  switch (this.getJabsMenuEquipType())
  {
    case JABS_MenuType.Skill:
      // update with combat skill information and the given slot.
      equippedActionSlot = this.getJabsEquippedCombatSkillsWindow()
        .currentExt();
      nextActionSkill = this.getJabsSkillListWindow()
        .currentExt();
      break;
    case JABS_MenuType.Tool:
      // update with tool information and the given slot.
      equippedActionSlot = this.getJabsEquippedToolWindow()
        .currentExt();
      nextActionSkill = this.getJabsToolListWindow()
        .currentExt();
      break;
    case JABS_MenuType.Dodge:
      // update with dodge skill information and the given slot.
      equippedActionSlot = this.getJabsEquippedDodgeSkillWindow()
        .currentExt();
      nextActionSkill = this.getJabsDodgeSkillListWindow()
        .currentExt();
      break;
    case JABS_MenuType.Offhand:
      // offhand always targets the offhand slot key from the equip window's payload.
      equippedActionSlot = this.getJabsEquippedOffhandSkillWindow()
        .currentExt();
      // the list window's payload is either a skill id (number) or undefined for the
      // clear-slot row; an undefined payload is normalized to 0 to clear the pin.
      nextActionSkill = this.getJabsOffhandSkillListWindow()
        .currentExt() ?? 0;
      break;
    case JABS_MenuType.UsableItem:
      // update with usable item information and the given slot.
      equippedActionSlot = this.getJabsEquippedUsableItemWindow()
        .currentExt();
      nextActionSkill = this.getJabsUsableItemListWindow()
        .currentExt();
      break;
  }

  // pivot writes for offhand through the pin path so equipment refreshes do not stomp it.
  if (this.getJabsMenuEquipType() === JABS_MenuType.Offhand)
  {
    actor.pinOffhandSkill(nextActionSkill);
  }
  else
  {
    // update the leader's equipped slots with the skill.
    actor.setEquippedSkill(equippedActionSlot, nextActionSkill);
  }

  // automatically return back to the list.
  this.closeAbsWindow(JABS_MenuType.Assign);
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
    case JABS_MenuType.Skill:
      this.hideJabsMainWindow();
      this.showJabsSkillListWindow();
      break;
    case JABS_MenuType.Tool:
      this.hideJabsMainWindow();
      this.showJabsToolListWindow();
      break;
    case JABS_MenuType.Dodge:
      this.hideJabsMainWindow();
      this.showJabsDodgeSkillListWindow();
      break;
    case JABS_MenuType.Offhand:
      this.hideJabsMainWindow();
      this.showJabsOffhandSkillListWindow();
      break;
    case JABS_MenuType.UsableItem:
      this.hideJabsMainWindow();
      this.showJabsUsableItemListWindow();
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

//region combat skills
/**
 * Shows the JABS menu skill list window.
 */
Scene_Map.prototype.showJabsSkillListWindow = function()
{
  // grab the window.
  const window = this.getJabsSkillListWindow();

  // show the window.
  this.showJabsMenuWindow(window);
};

/**
 * Hides the JABS menu skill list window.
 */
Scene_Map.prototype.hideJabsCombatSkillListWindow = function()
{
  // grab the window.
  const window = this.getJabsSkillListWindow();

  // hide the window.
  this.hideJabsMenuWindow(window);
};
//endregion combat skills

//region tools
/**
 * Shows the JABS menu tool list window.
 */
Scene_Map.prototype.showJabsToolListWindow = function()
{
  // grab the window.
  const window = this.getJabsToolListWindow();

  // show the window.
  this.showJabsMenuWindow(window);
};

/**
 * Hides the JABS menu tool list window.
 */
Scene_Map.prototype.hideJabsToolListWindow = function()
{
  // grab the window.
  const window = this.getJabsToolListWindow();

  // hide the window.
  this.hideJabsMenuWindow(window);
};
//endregion tools

//region dodge skills
/**
 * Shows the JABS menu dodge skill list window.
 */
Scene_Map.prototype.showJabsDodgeSkillListWindow = function()
{
  // grab the window.
  const window = this.getJabsDodgeSkillListWindow();

  // show the window.
  this.showJabsMenuWindow(window);
};

/**
 * Hides the JABS menu dodge skill list window.
 */
Scene_Map.prototype.hideJabsDodgeSkillListWindow = function()
{
  // grab the window.
  const window = this.getJabsDodgeSkillListWindow();

  // hide the window.
  this.hideJabsMenuWindow(window);
};
//endregion dodge skills

//region equip combat skills
/**
 * Shows the JABS menu equip combat skill window.
 */
Scene_Map.prototype.showJabsEquippedCombatSkillsWindow = function()
{
  // grab the window.
  const window = this.getJabsEquippedCombatSkillsWindow();

  // show the window.
  this.showJabsMenuWindow(window);
};

/**
 * Hides the JABS menu equip combat skill window.
 */
Scene_Map.prototype.hideJabsEquippedCombatSkillsWindow = function()
{
  // grab the window.
  const window = this.getJabsEquippedCombatSkillsWindow();

  // hide the window.
  this.hideJabsMenuWindow(window);
};
//endregion equip combat skills

//region equip tool
/**
 * Shows the JABS menu equip tool window.
 */
Scene_Map.prototype.showJabsEquippedToolWindow = function()
{
  // grab the window.
  const window = this.getJabsEquippedToolWindow();

  // show the window.
  this.showJabsMenuWindow(window);
};

/**
 * Hides the JABS menu equip tool window.
 */
Scene_Map.prototype.hideJabsEquippedToolWindow = function()
{
  // grab the window.
  const window = this.getJabsEquippedToolWindow();

  // hide the window.
  this.hideJabsMenuWindow(window);
};
//endregion equip tool

//region equip dodge skill
/**
 * Shows the JABS menu equip dodge skill window.
 */
Scene_Map.prototype.showJabsEquippedDodgeSkillWindow = function()
{
  // grab the window.
  const window = this.getJabsEquippedDodgeSkillWindow();

  // show the window.
  this.showJabsMenuWindow(window);
};

/**
 * Hides the JABS menu equip dodge skill window.
 */
Scene_Map.prototype.hideJabsEquippedDodgeSkillWindow = function()
{
  // grab the window.
  const window = this.getJabsEquippedDodgeSkillWindow();

  // hide the window.
  this.hideJabsMenuWindow(window);
};
//endregion equip dodge skill

//region offhand skills
/**
 * Shows the JABS menu offhand skill list window.
 */
Scene_Map.prototype.showJabsOffhandSkillListWindow = function()
{
  // grab the window.
  const window = this.getJabsOffhandSkillListWindow();

  // show the window.
  this.showJabsMenuWindow(window);
};

/**
 * Hides the JABS menu offhand skill list window.
 */
Scene_Map.prototype.hideJabsOffhandSkillListWindow = function()
{
  // grab the window.
  const window = this.getJabsOffhandSkillListWindow();

  // hide the window.
  this.hideJabsMenuWindow(window);
};
//endregion offhand skills

//region equip offhand skill
/**
 * Shows the JABS menu equip offhand skill window.
 */
Scene_Map.prototype.showJabsEquippedOffhandSkillWindow = function()
{
  // grab the window.
  const window = this.getJabsEquippedOffhandSkillWindow();

  // show the window.
  this.showJabsMenuWindow(window);
};

/**
 * Hides the JABS menu equip offhand skill window.
 */
Scene_Map.prototype.hideJabsEquippedOffhandSkillWindow = function()
{
  // grab the window.
  const window = this.getJabsEquippedOffhandSkillWindow();

  // hide the window.
  this.hideJabsMenuWindow(window);
};
//endregion equip offhand skill

//region usable items
/**
 * Shows the JABS menu usable item list window.
 */
Scene_Map.prototype.showJabsUsableItemListWindow = function()
{
  // grab the window.
  const window = this.getJabsUsableItemListWindow();

  // show the window.
  this.showJabsMenuWindow(window);
};

/**
 * Hides the JABS menu usable item list window.
 */
Scene_Map.prototype.hideJabsUsableItemListWindow = function()
{
  // grab the window.
  const window = this.getJabsUsableItemListWindow();

  // hide the window.
  this.hideJabsMenuWindow(window);
};
//endregion usable items

//region equip usable item
/**
 * Shows the JABS menu equip usable item window.
 */
Scene_Map.prototype.showJabsEquippedUsableItemWindow = function()
{
  // grab the window.
  const window = this.getJabsEquippedUsableItemWindow();

  // show the window.
  this.showJabsMenuWindow(window);
};

/**
 * Hides the JABS menu equip usable item window.
 */
Scene_Map.prototype.hideJabsEquippedUsableItemWindow = function()
{
  // grab the window.
  const window = this.getJabsEquippedUsableItemWindow();

  // hide the window.
  this.hideJabsMenuWindow(window);
};
//endregion equip usable item

/**
 * Hides all windows of the JABS menu.
 */
Scene_Map.prototype.hideAllJabsWindows = function()
{
  this.hideJabsDodgeSkillListWindow();
  this.hideJabsEquippedDodgeSkillWindow();

  this.hideJabsOffhandSkillListWindow();
  this.hideJabsEquippedOffhandSkillWindow();

  this.hideJabsToolListWindow();
  this.hideJabsEquippedToolWindow();

  this.hideJabsUsableItemListWindow();
  this.hideJabsEquippedUsableItemWindow();

  this.hideJabsCombatSkillListWindow();
  this.hideJabsEquippedCombatSkillsWindow();

  this.hideJabsMainWindow();

  this.closeAbsMenu();
};

/**
 * Shows a JABS menu window.
 * @param {Window_AbsMenu|Window_AbsMenuSelect} window The window to show.
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
 * @param {Window_AbsMenu|Window_AbsMenuSelect} window The window to hide.
 */
Scene_Map.prototype.hideJabsMenuWindow = function(window)
{
  // if its a selectable window, be sure to deselect it.
  if (window instanceof Window_Selectable)
  {
    window.deselect();
  }

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
    case JABS_MenuType.Skill:
      this.hideJabsCombatSkillListWindow();
      this.hideJabsEquippedCombatSkillsWindow();
      this.setJabsMenuFocus(JABS_MenuType.Main);
      break;
    case JABS_MenuType.Tool:
      this.hideJabsToolListWindow();
      this.hideJabsEquippedToolWindow();
      this.setJabsMenuFocus(JABS_MenuType.Main);
      break;
    case JABS_MenuType.Dodge:
      this.hideJabsDodgeSkillListWindow();
      this.hideJabsEquippedDodgeSkillWindow();
      this.setJabsMenuFocus(JABS_MenuType.Main);
      break;
    case JABS_MenuType.Offhand:
      this.hideJabsOffhandSkillListWindow();
      this.hideJabsEquippedOffhandSkillWindow();
      this.setJabsMenuFocus(JABS_MenuType.Main);
      break;
    case JABS_MenuType.UsableItem:
      this.hideJabsUsableItemListWindow();
      this.hideJabsEquippedUsableItemWindow();
      this.setJabsMenuFocus(JABS_MenuType.Main);
      break;
    case JABS_MenuType.Assign:
      this.redirectToParentAssignMenu();
      break;
  }
};

/**
 * Redirects the player's control to the parent assignment menu.
 */
Scene_Map.prototype.redirectToParentAssignMenu = function()
{
  // grab the current equip type.
  const equipType = this.getJabsMenuEquipType();

  // pivot on current equip type.
  switch (equipType)
  {
    case JABS_MenuType.Skill:
      const equippedCombatSkillsWindow = this.getJabsEquippedCombatSkillsWindow();
      equippedCombatSkillsWindow.deselect();
      equippedCombatSkillsWindow.refresh();
      this.getJabsSkillListWindow()
        .activate();
      break;
    case JABS_MenuType.Tool:
      const equippedToolWindow = this.getJabsEquippedToolWindow();
      equippedToolWindow.deselect();
      equippedToolWindow.refresh();
      this.getJabsToolListWindow()
        .activate();
      break;
    case JABS_MenuType.Dodge:
      const equippedDodgeSkillWindow = this.getJabsEquippedDodgeSkillWindow();
      equippedDodgeSkillWindow.deselect();
      equippedDodgeSkillWindow.refresh();
      this.getJabsDodgeSkillListWindow()
        .activate();
      break;
    case JABS_MenuType.Offhand:
      const equippedOffhandSkillWindow = this.getJabsEquippedOffhandSkillWindow();
      equippedOffhandSkillWindow.deselect();
      equippedOffhandSkillWindow.refresh();
      this.getJabsOffhandSkillListWindow()
        .activate();
      break;
    case JABS_MenuType.UsableItem:
      const equippedUsableItemWindow = this.getJabsEquippedUsableItemWindow();
      equippedUsableItemWindow.deselect();
      equippedUsableItemWindow.refresh();
      this.getJabsUsableItemListWindow()
        .activate();
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
  this.closeAbsWindow(JABS_MenuType.Assign);
  this.closeAbsWindow(JABS_MenuType.Skill);
  this.closeAbsWindow(JABS_MenuType.Tool);
  this.closeAbsWindow(JABS_MenuType.Dodge);
  this.closeAbsWindow(JABS_MenuType.Offhand);
  this.closeAbsWindow(JABS_MenuType.UsableItem);

  this.setJabsMenuEquipType(String.empty);
  this.closeAbsWindow(JABS_MenuType.Main);
  this.setJabsMenuFocus(JABS_MenuType.Main);
};
//endregion Scene_Map