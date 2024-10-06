//region Hud_Manager
/**
 * Initialize the various members of the HUD.
 */
J.HUD.EXT.QUEST.Aliased.HudManager.set('initMembers', HudManager.prototype.initMembers);
HudManager.prototype.initMembers = function()
{
  // perform original logic.
  J.HUD.EXT.QUEST.Aliased.HudManager.get('initMembers')
    .call(this);

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