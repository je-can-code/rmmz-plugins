//#region Introduction
/*:
 * @target MZ
 * @plugindesc 
 * [v1.0 STATS] A remodeled status screen.
 * @author JE
 * @url https://github.com/je-can-code/rmmz
 * @help
 * This is not officially released and thus has no/incomplete documentation.
 */

/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.STATS = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.STATS.Metadata = {
  /**
   * The version of this plugin.
   */
  Name: `J-CMS-StatusScreen`,

  /**
   * The version of this plugin.
   */
  Version: 1.00,
};

/**
 * The actual `plugin parameters` extracted from RMMZ.
 */
J.STATS.PluginParameters = PluginManager.parameters(J.STATS.Metadata.Name);

J.STATS.Aliased = {
  Game_Player: {},
  Game_System: {},
  Scene_Map: {},
};

//=============================================================================
J.STATS.Aliased.Game_System.initialize = Game_System.prototype.initialize;
Game_System.prototype.initialize = function() {
  this.initMapStatusMembers();
  J.STATS.Aliased.Game_System.initialize.call(this);
};

Game_System.prototype.initMapStatusMembers = function() {
  this._viewingMapStatus = false;
};

Game_System.prototype.callMapStatus = function() {
  // prevent accessing this menu without a leader.
  if ($gameParty.leader()) {
    console.warn("cannot view status/equip menu with no leader.");
    return;
  }

  this._viewingMapStatus = true;
};

Game_System.prototype.closeMapStatus = function() {
  this._viewingMapStatus = false;
};

Game_System.prototype.isViewingMapStatus = function() {
  return this._viewingMapStatus;
};
//=============================================================================
J.STATS.Aliased.Game_Player.canMove = Game_Player.prototype.canMove;
Game_Player.prototype.canMove = function() {
  if ($gameSystem.isViewingMapStatus()) {
    return false;
  } else {
    return J.STATS.Aliased.Game_Player.canMove.call(this);
  }
};
//=============================================================================
J.STATS.Aliased.Scene_Map.initialize = Scene_Map.prototype.initialize;
Scene_Map.prototype.initialize = function() {
  J.STATS.Aliased.Scene_Map.initialize.call(this);
  this.initMapStatusWindows();
};

Scene_Map.prototype.initMapStatusWindows = function() {
  this._mapStatusWindow = null;
  this._mapStatusCommands = null;
};

J.STATS.Aliased.Scene_Map.update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {
  J.STATS.Aliased.Scene_Map.update.call(this);

  if ($gameSystem.isViewingMapStatus()) {
    this.callMapStatus();
  }
};

Scene_Map.prototype.callMapStatus = function() {
  const exists = this.children.includes(this._mapStatusWindow);
  if (exists) {
    this.showMapStatus();
    return;
  };

  this.createMapStatusWindow();
  this.createMapStatusCommands();
};

Scene_Map.prototype.createMapStatusWindow = function() {
  const rectangle = new Rectangle(200, 150, 300, 250);
  const mapStatus = new Window_MapStatus(rectangle);
  this._mapStatusWindow = mapStatus;
  this.addChild(this._mapStatusWindow);
};

Scene_Map.prototype.createMapStatusCommands = function() {
  const rectangle = new Rectangle(0, 400, 300, 400);
  const mapStatusCmds = new Window_MapStatusCommand(rectangle);
  mapStatusCmds.setHandler("cancel", this.closeMapStatus.bind(this));
  this._mapStatusCommands = mapStatusCmds;
  this.addChild(this._mapStatusCommands);
};

Scene_Map.prototype.showMapStatus = function() {
  this._mapStatusCommands.show();
  this._mapStatusWindow.show();
  this._mapStatusCommands.open();
  this._mapStatusWindow.open();
  this._mapStatusCommands.activate();
};

Scene_Map.prototype.closeMapStatus = function() {
  this._mapStatusWindow.close();
  this._mapStatusWindow.hide();
  this._mapStatusCommands.close();
  this._mapStatusCommands.hide();
  this._mapStatusCommands.deactivate();
  $gameSystem.closeMapStatus();
};
//=============================================================================

class Window_MapStatus extends Window_Base {
  constructor(rect) {
    super(rect);
    this.initialize(rect);
  };

  initialize(rect) {
    super.initialize(rect);
    // ...
  };
};

class Window_MapStatusCommand extends Window_Command {
  constructor(rect) {
    super(rect);
    this.initialize(rect);
    console.log("initialized");
  };

  initialize(rect) {
    super.initialize(rect);
    // ...
  };

  makeCommandList() {
    // ...
  };
};