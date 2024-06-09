//region Game_Enemy
/**
 * Gets the extra text from this enemy for the target frame.
 * @returns {string}
 */
Game_Enemy.prototype.targetFrameText = function()
{
  // return the extracted the target frame extra text from this enemy.
  return RPGManager.getStringFromNoteByRegex(
    this.enemy(),
    J.HUD.EXT.TARGET.RegExp.TargetFrameText);
};

/**
 * Gets the icon index of the target frame icon.
 * If none are present or valid, then the default will be 0 (no icon).
 * @returns {number}
 */
Game_Enemy.prototype.targetFrameIcon = function()
{
  // extract the target icon from this enemy.
  return RPGManager.getNumberFromNoteByRegex(
    this.enemy(),
    J.HUD.EXT.TARGET.RegExp.TargetFrameText);
};

/**
 * Gets whether or not the battler can show the target frame.
 * The default is to show.
 * @returns {boolean}
 */
Game_Enemy.prototype.showTargetFrame = function()
{
  // extract whether or not the target frame for this enemy is hidden.
  return !RPGManager.checkForBooleanFromNoteByRegex(
    this.enemy(),
    J.HUD.EXT.TARGET.RegExp.HideTargetFrame);
};

/**
 * Gets whether or not the battler can show its mp bar.
 * The default is to show.
 * @returns {boolean}
 */
Game_Enemy.prototype.showTargetHpBar = function()
{
  // extract whether or not to show the target HP for this enemy.
  return !RPGManager.checkForBooleanFromNoteByRegex(
    this.enemy(),
    J.HUD.EXT.TARGET.RegExp.HideTargetHP);
};

/**
 * Gets whether or not the battler can show its mp bar.
 * The default is to show.
 * @returns {boolean}
 */
Game_Enemy.prototype.showTargetMpBar = function()
{
  // extract whether or not to show the target MP for this enemy.
  return !RPGManager.checkForBooleanFromNoteByRegex(
    this.enemy(),
    J.HUD.EXT.TARGET.RegExp.HideTargetMP);
};

/**
 * Gets whether or not the battler can show its tp bar.
 * The default is to show.
 * @returns {boolean}
 */
Game_Enemy.prototype.showTargetTpBar = function()
{
  // extract whether or not to show the target TP for this enemy.
  return !RPGManager.checkForBooleanFromNoteByRegex(
    this.enemy(),
    J.HUD.EXT.TARGET.RegExp.HideTargetTP);
};

/**
 * Gets whether or not the battler can show its target text.
 * The default is to show.
 * @returns {boolean}
 */
Game_Enemy.prototype.showTargetText = function()
{
  // extract whether or not to show the target text from this enemy.
  return !RPGManager.checkForBooleanFromNoteByRegex(
    this.enemy(),
    J.HUD.EXT.TARGET.RegExp.HideTargetText);
};
//endregion Game_Enemy