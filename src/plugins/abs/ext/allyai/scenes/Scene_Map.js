//region Scene_Map
//region init
/**
 * Extends the JABS menu initialization to include the new ally ai management selection.
 */
J.ABS.EXT.ALLYAI.Aliased.Scene_Map.set('initJabsMembers', Scene_Map.prototype.initJabsMembers);
Scene_Map.prototype.initJabsMembers = function()
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.Scene_Map.get('initJabsMembers')
    .call(this);

  // init ally ai members.
  this.initAllyAiMembers();
};

/**
 * Initializes the new windows for ally ai management.
 */
Scene_Map.prototype.initAllyAiMembers = function()
{
  /**
   * The window containing the list of party members to adjust the AI for.
   * @type {Window_AbsMenuSelect|null}
   */
  this._j._absMenu._allyAiPartyWindow = null;

  /**
   * The window containing the list of AI strategies for use.
   * @type {Window_AbsMenuSelect|null}
   */
  this._j._absMenu._allyAiEquipWindow = null;

  /**
   * The window containing the list of ally formations available.
   * @type {Window_Formations|null}
   */
  this._j._absMenu._allyAiFormationWindow = null;

  /**
   * The currently-selected ally actorId.
   * @type {number}
   */
  this._j._absMenu._allyAiActorId = 0;
};
//endregion init

//region getter/setter
/**
 * Sets the chosen actor id to the provided id.
 * @param {number} chosenActorId The id of the chosen actor.
 */
Scene_Map.prototype.setAllyAiActorId = function(chosenActorId)
{
  this._j._absMenu._allyAiActorId = chosenActorId;
};

/**
 * Gets the chosen actor id.
 */
Scene_Map.prototype.getAllyAiActorId = function()
{
  return this._j._absMenu._allyAiActorId;
};

/**
 * Gets the ally formation window.
 * @returns {Window_Formations}
 */
Scene_Map.prototype.getAllyFormationWindow = function()
{
  return this._j._absMenu._allyAiFormationWindow;
};

/**
 * Sets the ally formation window.
 * @param {Window_Formations} window The new window.
 */
Scene_Map.prototype.setAllyFormationWindow = function(window)
{
  this._j._absMenu._allyAiFormationWindow = window;
};
//endregion getter/setter

//region create
/**
 * Extends the JABS menu creation to include the new windows for ally ai management.
 */
J.ABS.EXT.ALLYAI.Aliased.Scene_Map.set('createJabsAbsMenu', Scene_Map.prototype.createJabsAbsMenu);
Scene_Map.prototype.createJabsAbsMenu = function()
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.Scene_Map.get('createJabsAbsMenu')
    .call(this);

  // also create the new ally AI windows..
  this.createAllyAiPartyWindow();
  this.createAllyAiEquipWindow();
  this.createAllyAiFormationWindow();
};

/**
 * Extends the JABS menu creation to include a new command handler for ally ai.
 */
J.ABS.EXT.ALLYAI.Aliased.Scene_Map.set('createJabsAbsMenuMainWindow', Scene_Map.prototype.createJabsAbsMenuMainWindow);
Scene_Map.prototype.createJabsAbsMenuMainWindow = function()
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.Scene_Map.get('createJabsAbsMenuMainWindow')
    .call(this);

  // also associate the ally AI handler with the appropriate symbol.
  this._j._absMenu._mainWindow.setHandler("ally-ai", this.commandManagePartyAi.bind(this));
};

/**
 * Creates the window that lists all active members of the party.
 */
Scene_Map.prototype.createAllyAiPartyWindow = function()
{
  // identify the shape of the window.
  const rect = this.allyAiPartyRectangle();

  // build the window with the rectangle and its type.
  const aiPartyMenu = new Window_AbsMenuSelect(rect, "ai-party-list");

  // setup the handlers.
  aiPartyMenu.setHandler("cancel", this.closeAbsWindow.bind(this, "ai-party-list"));
  aiPartyMenu.setHandler("party-member", this.commandSelectMemberAi.bind(this));
  aiPartyMenu.setHandler("aggro-passive-toggle", this.commandAggroPassiveToggle.bind(this));
  aiPartyMenu.setHandler("ally-formations", this.commandAllyFormations.bind(this));

  // set the window for tracking.
  this._j._absMenu._allyAiPartyWindow = aiPartyMenu;
  this.addWindow(this._j._absMenu._allyAiPartyWindow);

  // manage the initial state of the window.
  this._j._absMenu._allyAiPartyWindow.close();
  this._j._absMenu._allyAiPartyWindow.hide();
};

/**
 * Creates the rectangle representing the window for selecting which ally to manage AI for.
 * @returns {Rectangle}
 */
Scene_Map.prototype.allyAiPartyRectangle = function()
{
  // define the width of the window.
  const w = 600;

  // define the height of the window.
  const h = 600;

  // define the origin x of the window.
  const x = Graphics.boxWidth - w;

  // define the origin y of the window.
  const y = 200;

  // return the built rectangle.
  return new Rectangle(x, y, w, h);
};

/**
 * Creates a window that lists all available ai modes that the chosen ally can use.
 */
Scene_Map.prototype.createAllyAiEquipWindow = function()
{
  // identify the shape of the window.
  const rect = this.allyAiEquipRectangle();

  // build the window with the rectangle and its type.
  const aiMemberMenu = new Window_AbsMenuSelect(rect, "select-ai");

  // setup the handlers.
  aiMemberMenu.setHandler("cancel", this.closeAbsWindow.bind(this, "select-ai"));
  aiMemberMenu.setHandler("select-ai", this.commandEquipMemberAi.bind(this));

  // set the window for tracking.
  this._j._absMenu._allyAiEquipWindow = aiMemberMenu;
  this.addWindow(this._j._absMenu._allyAiEquipWindow);

  // manage the initial state of the window.
  this._j._absMenu._allyAiEquipWindow.close();
  this._j._absMenu._allyAiEquipWindow.hide();
};

/**
 * Creates the rectangle representing the window for selecting which AI mode to apply to a given ally.
 * @returns {Rectangle}
 */
Scene_Map.prototype.allyAiEquipRectangle = function()
{
  // define the width of the window.
  const w = 600;

  // define the height of the window.
  const h = 400;

  // define the origin x of the window.
  const x = Graphics.boxWidth - w;

  // define the origin y of the window.
  const y = 200;

  // return the built rectangle.
  return new Rectangle(x, y, w, h);
};

/**
 * Creates the ally formations window.
 */
Scene_Map.prototype.createAllyAiFormationWindow = function()
{
  // identify the shape of the window.
  const rect = this.allyAiFormationRectangle();

  // build the window with the rectangle.
  const window = new Window_Formations(rect);

  // setup the handlers.
  window.setHandler("cancel", this.closeAbsWindow.bind(this, "ally-formations"));
  window.setHandler("select-formation", this.commandSelectAllyFormation.bind(this));

  // set the window for tracking.
  this.setAllyFormationWindow(window);
  this.addWindow(window);

  // manage the initial state of the window.
  window.close();
  window.hide();
};

/**
 * Creates the rectangle representing the window for the formations.
 * @returns {Rectangle}
 */
Scene_Map.prototype.allyAiFormationRectangle = function()
{
  // define the width of the window.
  const width = 600;

  // define the height of the window.
  const height = 400;

  // define the origin x of the window.
  const x = Graphics.boxWidth - width;

  // define the origin y of the window.
  const y = 200;

  // return the built rectangle.
  return new Rectangle(x, y, width, height);
};
//endregion create

//region commands
/**
 * When the "manage ally ai" option is chosen, it prioritizes this window.
 */
Scene_Map.prototype.commandManagePartyAi = function()
{
  this.setJabsMenuFocus("ai-party-list");
};

/**
 * When an individual party member is chosen, it prioritizes the AI mode selection window.
 */
Scene_Map.prototype.commandSelectMemberAi = function()
{
  // change focus to the ally AI selection window.
  this.setJabsMenuFocus("select-ai");

  // set the actorId into the AI selection window and refresh.
  const actorId = this._j._absMenu._allyAiPartyWindow.currentExt();
  this.setAllyAiActorId(actorId);
  this._j._absMenu._allyAiEquipWindow.setActorId(actorId);
  this._j._absMenu._allyAiEquipWindow.refresh();
};

/**
 * Toggles the party-wide aggro/passive switch.
 * Passive switch will only target the leader's current target.
 * Aggro switch will enable full sight range and auto-engaging abilities.
 */
Scene_Map.prototype.commandAggroPassiveToggle = function()
{
  // play a fun sound when changing party aggro mode.
  SoundManager.playRecovery();

  // toggle the party aggro mode.
  $gameParty.isAggro()
    ? $gameParty.becomePassive()
    : $gameParty.becomeAggro();

  // refresh the window to pick up the new state.
  this._j._absMenu._allyAiPartyWindow.refresh();
};

/**
 * When an ai mode is chosen, it replaces it for the actor.
 */
Scene_Map.prototype.commandEquipMemberAi = function()
{
  // grab the new ally AI mode from the window.
  const newMode = this._j._absMenu._allyAiEquipWindow.currentExt();

  // grab the current ally AI.
  const allyAi = $gameActors.actor(this.getAllyAiActorId())
    .getAllyAI();

  // change the mode of the AI to the new one by its key.
  allyAi.changeMode(newMode.key);

  // refresh the ally AI window to reflect the change.
  this._j._absMenu._allyAiEquipWindow.refresh();
};

Scene_Map.prototype.commandAllyFormations = function()
{
  this.setJabsMenuFocus("ally-formations");
};

Scene_Map.prototype.commandSelectAllyFormation = function()
{
  const window = this.getAllyFormationWindow();

  /** @type {JABS_Formation} */
  const selectedFormation = window.currentExt();
  $gameParty.setPartyFormation(selectedFormation.key);
  window.refresh();
};
//endregion commands

//region manage menu
/**
 * Manages the ABS main menu's interactivity.
 */
J.ABS.EXT.ALLYAI.Aliased.Scene_Map.set('manageAbsMenu', Scene_Map.prototype.manageAbsMenu);
Scene_Map.prototype.manageAbsMenu = function()
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.Scene_Map.get('manageAbsMenu')
    .call(this);

  // pivot on the window focus to manage which should be open and which should be closed.
  switch (this._j._absMenu._windowFocus)
  {
    case "ai-party-list":
      this._j._absMenu._mainWindow.hide();
      this._j._absMenu._mainWindow.close();
      this._j._absMenu._mainWindow.deactivate();
      this._j._absMenu._allyAiPartyWindow.show();
      this._j._absMenu._allyAiPartyWindow.open();
      this._j._absMenu._allyAiPartyWindow.activate();
      break;
    case "select-ai":
      this._j._absMenu._allyAiPartyWindow.hide();
      this._j._absMenu._allyAiPartyWindow.close();
      this._j._absMenu._allyAiPartyWindow.deactivate();
      this._j._absMenu._allyAiEquipWindow.show();
      this._j._absMenu._allyAiEquipWindow.open();
      this._j._absMenu._allyAiEquipWindow.activate();
      break;
    case "ally-formations":
    {
      this._j._absMenu._allyAiPartyWindow.hide();
      this._j._absMenu._allyAiPartyWindow.close();
      this._j._absMenu._allyAiPartyWindow.deactivate();

      const window = this.getAllyFormationWindow();
      window.show();
      window.open();
      window.activate();
      break;
    }
  }
};

/**
 * Closes a given Abs menu window.
 * @param {string} absWindow The type of abs window being closed.
 */
J.ABS.EXT.ALLYAI.Aliased.Scene_Map.set('closeAbsWindow', Scene_Map.prototype.closeAbsWindow);
Scene_Map.prototype.closeAbsWindow = function(absWindow)
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.Scene_Map.get('closeAbsWindow')
    .call(this, absWindow);

  // allow possibly closing ally AI windows as well.
  switch (absWindow)
  {
    case "ai-party-list":
      this._j._absMenu._allyAiPartyWindow.hide();
      this._j._absMenu._allyAiPartyWindow.close();
      this._j._absMenu._allyAiPartyWindow.deactivate();
      this._j._absMenu._mainWindow.activate();
      this._j._absMenu._mainWindow.open();
      this._j._absMenu._mainWindow.show();
      this.setJabsMenuFocus("main");
      break;
    case "select-ai":
      this._j._absMenu._allyAiEquipWindow.hide();
      this._j._absMenu._allyAiEquipWindow.close();
      this._j._absMenu._allyAiEquipWindow.deactivate();
      this._j._absMenu._allyAiPartyWindow.activate();
      this._j._absMenu._allyAiPartyWindow.open();
      this._j._absMenu._allyAiPartyWindow.show();
      this.setJabsMenuFocus("ai-party-list");
      break;
    case "ally-formations":
    {
      const window = this.getAllyFormationWindow();
      window.hide();
      window.close();
      window.deactivate();

      this._j._absMenu._allyAiPartyWindow.activate();
      this._j._absMenu._allyAiPartyWindow.open();
      this._j._absMenu._allyAiPartyWindow.show();
      this.setJabsMenuFocus("ai-party-list");
      break;
    }
  }
};
//endregion manage menu
//endregion Scene_Map