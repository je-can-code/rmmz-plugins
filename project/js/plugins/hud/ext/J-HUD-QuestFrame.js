//region annoations
/*:
 * @target MZ
 * @plugindesc
 * [v1.0.0 HUD-QUEST] A HUD frame that displays quest objective information.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin is an extension of the J-HUD plugin.
 * It will display quests and their objectives and the player's progress as
 * in realtime.
 *
 * It will show and hide with the rest of the HUD, and will only reveal quests
 * that are flagged as "tracked" in the questopedia.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * Cool details about this cool plugin go here.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 *
 * @param parentConfig
 * @text SETUP
 *
 * @param menu-switch
 * @parent parentConfig
 * @type switch
 * @text Menu Switch ID
 * @desc When this switch is ON, then this command is visible in the menu.
 * @default 101
 *
 *
 * @command do-the-thing
 * @text Add/Remove points
 * @desc Adds or removes a designated amount of points from all members of the current party.
 * @arg points
 * @type number
 * @min -99999999
 * @max 99999999
 * @desc The number of points to modify by. Negative will remove points. Cannot go below 0.
 */
//endregion annotations

//region plugin metadata
class J_HUD_Quest_PluginMetadata extends PluginMetadata
{
  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   *  Extends {@link #postInitialize}.<br>
   *  Includes translation of plugin parameters.
   */
  postInitialize()
  {
    // execute original logic.
    super.postInitialize();

    // initialize this plugin from configuration.
    this.initializeMetadata();
  }

  /**
   * Initializes the metadata associated with this plugin.
   */
  initializeMetadata()
  {
    /**
     * The id of a switch that represents whether or not this system is accessible in the menu.
     * @type {number}
     */
    this.menuSwitchId = parseInt(this.parsedPluginParameters['menu-switch']);
  }
}
//endregion plugin metadata

//region initialization
/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.HUD.EXT.QUEST ||= {};

/**
 * The metadata associated with this plugin.
 */
J.HUD.EXT.QUEST.Metadata = new J_HUD_Quest_PluginMetadata('J-HUD-QuestFrame', '1.0.0');

/**
 * A collection of all aliased methods for this plugin.
 */
J.HUD.EXT.QUEST.Aliased = {};
J.HUD.EXT.QUEST.Aliased.Scene_Map = new Map();
J.HUD.EXT.QUEST.Aliased.Scene_Questopedia = new Map();
J.HUD.EXT.QUEST.Aliased.TrackedOmniQuest = new Map();
J.HUD.EXT.QUEST.Aliased.TrackedOmniObjective = new Map();
J.HUD.EXT.QUEST.Aliased.HudManager = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.HUD.EXT.QUEST.RegExp = {};
J.HUD.EXT.QUEST.RegExp.Points = /<tag:[ ]?(\d+)>/i;
//endregion initialization

//region plugin commands
/**
 * Plugin command for doing the thing.
 */
PluginManager.registerCommand(
  J.HUD.EXT.QUEST.Metadata.name,
  "do-the-thing",
  args =>
  {
    console.log('did the thing.');
  });
//endregion plugin commands

//region TrackedOmniObjective
/**
 * Extends {@link onObjectiveUpdate}.<br/>
 * Also refreshes the HUD for tracked quests.
 */
J.HUD.EXT.QUEST.Aliased.TrackedOmniObjective.set('onObjectiveUpdate', TrackedOmniObjective.prototype.onObjectiveUpdate);
TrackedOmniObjective.prototype.onObjectiveUpdate = function()
{
  // perform original logic.
  J.HUD.EXT.QUEST.Aliased.TrackedOmniObjective.get('onObjectiveUpdate')
    .call(this);

  // check if this quest is being tracked in the HUD.
  if (QuestManager.quest(this.questKey).tracked)
  {
    // refresh the quest status.
    $hudManager.requestQuestRefresh();
  }
};
//endregion TrackedOmniObjective

//region TrackedOmniQuest
/**
 * Extends {@link refreshState}.<br/>
 * Also flags the HUD for refreshment.
 */
J.HUD.EXT.QUEST.Aliased.TrackedOmniQuest.set('refreshState', TrackedOmniQuest.prototype.refreshState);
TrackedOmniQuest.prototype.refreshState = function()
{
  // perform original logic.
  J.HUD.EXT.QUEST.Aliased.TrackedOmniQuest.get('refreshState').call(this);

  // also refresh the quest HUD with a progression of objectives.
  $hudManager.requestQuestRefresh();
};

/**
 * Unlocks this quest and actives the target objective. If no objectiveId is provided, then the first objective will be
 * made {@link OmniObjective.States.Active}.
 * @param {number=} objectiveId The id of the objective to initialize as active; defaults to the immediate or first.
 */
J.HUD.EXT.QUEST.Aliased.TrackedOmniQuest.set('unlock', TrackedOmniQuest.prototype.unlock);
TrackedOmniQuest.prototype.unlock = function(objectiveId = null)
{
  // perform original logic.
  J.HUD.EXT.QUEST.Aliased.TrackedOmniQuest.get('unlock').call(this, objectiveId);

  // check if we have any tracked quests.
  const hasNoTrackedQuests = QuestManager.trackedQuests().length === 0;

  // check if there is nothing else tracked, and this quest is now active.
  if (hasNoTrackedQuests && this.state === OmniQuest.States.Active)
  {
    // start tracking it!
    this.toggleTracked();

    // and also refresh the HUD.
    $hudManager.requestQuestRefresh();
  }
};

//endregion TrackedOmniQuest

//region Hud_Manager
/**
 * Initialize the various members of the HUD.
 */
J.HUD.EXT.QUEST.Aliased.HudManager.set('initMembers', HudManager.prototype.initMembers);
HudManager.prototype.initMembers = function()
{
  // perform original logic.
  J.HUD.EXT.QUEST.Aliased.HudManager.get('initMembers').call(this);

  /**
   * The request state for the quest data of the HUD.
   * @type {boolean}
   */
  this._needsQuestRefresh = true;
};

/**
 * Issue a request to refresh the quest data in the HUD.
 */
HudManager.prototype.requestQuestRefresh = function()
{
  this._needsQuestRefresh = true;
};

/**
 * Acknowledge the request to refresh the HUD.
 */
HudManager.prototype.acknowledgeQuestRefresh = function()
{
  this._needsQuestRefresh = false;
};

/**
 * Whether or not we have a request to refresh the quest data of the HUD.
 * @returns {boolean}
 */
HudManager.prototype.needsQuestRefresh = function()
{
  return this._needsQuestRefresh;
};
//endregion Hud_Manager

//region Scene_Map
/**
 * Extends {@link #initHudMembers}.<br>
 * Includes initialization of the target frame members.
 */
J.HUD.EXT.QUEST.Aliased.Scene_Map.set('initHudMembers', Scene_Map.prototype.initHudMembers);
Scene_Map.prototype.initHudMembers = function()
{
  // perform original logic.
  J.HUD.EXT.QUEST.Aliased.Scene_Map.get('initHudMembers').call(this);

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
  J.HUD.EXT.QUEST.Aliased.Scene_Map.get('createAllWindows').call(this);

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
  J.HUD.EXT.QUEST.Aliased.Scene_Map.get('updateHudFrames').call(this);

  // check if we need to refresh quest data.
  if ($hudManager.needsQuestRefresh())
  {
    // refresh the quest frame.
    this.getQuestFrameWindow().refresh();

    // acknowledge the refresh.
    $hudManager.acknowledgeQuestRefresh();
  }
};
//endregion Scene_Map

//region Scene_Questopedia
/**
 * Extends {@link onQuestopediaListSelection}.<br/>
 * Triggers a HUD update request when something is selected in the list of quests.
 */
J.HUD.EXT.QUEST.Aliased.Scene_Questopedia.set(
  'onQuestopediaListSelection',
  Scene_Questopedia.prototype.onQuestopediaListSelection);
Scene_Questopedia.prototype.onQuestopediaListSelection = function()
{
  // perform original logic.
  J.HUD.EXT.QUEST.Aliased.Scene_Questopedia.get('onQuestopediaListSelection').call(this);

  // also refresh the HUD when the user gets back to the map if they added/removed trackings of quests.
  $hudManager.requestQuestRefresh();
}

//endregion Scene_Questopedia

//region Window_QuestFrame
class Window_QuestFrame extends Window_Base
{
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Extends {@link initialize}.<br/>
   * Also configures this window accordingly.
   * @param {Rectangle} rect The rectangle representing this window.
   */
  initialize(rect)
  {
    // perform original logic.
    super.initialize(rect);

    // run our one-time setup and configuration.
    this.configure();

    // refresh the window for the first time.
    this.refresh();
  }

  /**
   * Performs the one-time setup and configuration per instantiation.
   */
  configure()
  {
    // make the window's background opacity transparent.
    this.opacity = 0;
  }

  drawContent()
  {
    // we default to the upper left most point of the window for origin.
    const [ x, y ] = [ 0, 0 ];

    // draw the quests and their objective datas.
    this.drawQuests(x, y);
  }

  drawQuests(x, y)
  {
    // grab the current quest.
    const quests = QuestManager.trackedQuests();

    // if there are no quests, do not render them.
    if (quests.length === 0) return;

    const lh = this.lineHeight();

    let lineCount = 0;

    quests.forEach((quest, questIndex) =>
    {
      const questNameY = lh * lineCount;
      const questNameSized = this.modFontSizeForText(-4, quest.name());
      const questName = this.boldenText(questNameSized);
      const questNameWidth = this.textWidth(questName);
      this.drawTextEx(questName, 0, questNameY, questNameWidth);
      lineCount++;

      const drawableObjectives = quest.objectives.filter(objective => objective.isActive());

      if (drawableObjectives.length === 0)
      {
        const objectiveTextWidth = this.textWidth(objectiveText);
        this.drawTextEx(objectiveText, 10, objectiveY, objectiveTextWidth);
      }

      drawableObjectives
        .forEach((objective, objectiveIndex) =>
        {
          const objectiveY = lh * (objectiveIndex + lineCount);
          const objectiveText = this.modFontSizeForText(-8, objective.fulfillmentText());
          const objectiveTextWidth = this.textWidth(objectiveText);
          this.drawTextEx(objectiveText, 10, objectiveY, objectiveTextWidth);
          lineCount++;
        });
    }, this);
  }

  drawQuest(x, y)
  {

  }

  drawObjectives(x, y)
  {

  }

  drawObjective(x, y)
  {

  }

  lineHeight()
  {
    return super.lineHeight() - 10;
  }

}

//endregion Window_QuestFrame