//region Scene_Map
/**
 * Extends {@link #initHudMembers}.<br>
 * Includes initialization of the target frame members.
 */
J.HUD.EXT.QUEST.Aliased.Scene_Map.set('initHudMembers', Scene_Map.prototype.initHudMembers);
Scene_Map.prototype.initHudMembers = function()
{
  // perform original logic.
  J.HUD.EXT.QUEST.Aliased.Scene_Map.get('initHudMembers')
    .call(this);

  /**
   * A grouping of all properties that belong to quest extension of the HUD.
   */
  this._j._hud._quest = {};

  /**
   * The quest frame for tracking quests and their objectives.
   * @type {Window_QuestFrame}
   */
  this._j._hud._quest._questFrame = null;
};

/**
 * Extends {@link #createAllWindows}.<br>
 * Includes creation of the target frame window.
 */
J.HUD.EXT.QUEST.Aliased.Scene_Map.set('createAllWindows', Scene_Map.prototype.createAllWindows);
Scene_Map.prototype.createAllWindows = function()
{
  // perform original logic.
  J.HUD.EXT.QUEST.Aliased.Scene_Map.get('createAllWindows')
    .call(this);

  // create the target frame.
  this.createQuestFrameWindow();
};

//region quest frame
/**
 * Creates the quest frame window and adds it to tracking.
 */
Scene_Map.prototype.createQuestFrameWindow = function()
{
  // create the window.
  const window = this.buildQuestFrameWindow();

  // update the tracker with the new window.
  this.setQuestFrameWindow(window);

  // add the window to the scene manager's tracking.
  this.addWindow(window);
};

/**
 * Sets up and defines the quest frame window.
 * @returns {Window_QuestFrame}
 */
Scene_Map.prototype.buildQuestFrameWindow = function()
{
  // define the rectangle of the window.
  const rectangle = this.questFrameWindowRect();

  // create the window with the rectangle.
  const window = new Window_QuestFrame(rectangle);

  // return the built and configured window.
  return window;
}

/**
 * Creates the rectangle representing the window for the target frame.
 * @returns {Rectangle}
 */
Scene_Map.prototype.questFrameWindowRect = function()
{
  // define the width of the window.
  const width = 800; // J.HUD.EXT.TARGET.Metadata.TargetFrameWidth;

  // define the height of the window.
  const height = 400; // J.HUD.EXT.TARGET.Metadata.TargetFrameHeight;

  // define the origin x of the window.
  const x = 0; //J.HUD.EXT.TARGET.Metadata.TargetFrameX;

  // define the origin y of the window.
  const y = 0; // J.HUD.EXT.TARGET.Metadata.TargetFrameY;

  // return the built rectangle.
  return new Rectangle(x, y, width, height);
};

/**
 * Gets the currently tracked quest frame window.
 * @returns {Window_QuestFrame}
 */
Scene_Map.prototype.getQuestFrameWindow = function()
{
  return this._j._hud._quest._questFrame;
}

/**
 * Set the currently tracked quest frame window to the given window.
 * @param {Window_QuestFrame} window The window to track.
 */
Scene_Map.prototype.setQuestFrameWindow = function(window)
{
  this._j._hud._quest._questFrame = window;
}
//endregion quest frame

/**
 * Extends {@link #updateHudFrames}.<br>
 * Includes updating the target frame.
 */
J.HUD.EXT.QUEST.Aliased.Scene_Map.set('updateHudFrames', Scene_Map.prototype.updateHudFrames);
Scene_Map.prototype.updateHudFrames = function()
{
  // perform original logic.
  J.HUD.EXT.QUEST.Aliased.Scene_Map.get('updateHudFrames')
    .call(this);

  // check if we need to refresh quest data.
  if ($hudManager.needsQuestRefresh())
  {
    // refresh the quest frame.
    this.getQuestFrameWindow()
      .refresh();

    // acknowledge the refresh.
    $hudManager.acknowledgeQuestRefresh();
  }
};
//endregion Scene_Map