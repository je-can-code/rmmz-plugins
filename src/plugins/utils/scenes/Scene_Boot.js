//region Scene_Boot
/**
 * Extends `startNormalGame()` to accommodate plugin parameters.
 * If the "auto-newgame" parameter is true, then we skip straight into a new game,
 * bypassing the title screen altogether.
 */
J.UTILS.Aliased.Scene_Boot.set('startNormalGame', Scene_Boot.prototype.startNormalGame);
Scene_Boot.prototype.startNormalGame = function()
{
  // if using the "autostart-newgame" feature, then skip straight to a new game.
  if (J.UTILS.Metadata.autostartNewgame)
  {
    this.checkPlayerLocation();
    DataManager.setupNewGame();
    SceneManager.goto(Scene_Map);
  }
  // otherwise, perform original logic.
  else
  {
    J.UTILS.Aliased.Scene_Boot.get('startNormalGame').call(this);
  }
};

/**
 * Extends {@link #start}.<br>
 * Also shows the devtools window because I need that to do dev things.
 */
J.UTILS.Aliased.Scene_Boot.set('start', Scene_Boot.prototype.start);
Scene_Boot.prototype.start = function()
{
  // perform original logic.
  J.UTILS.Aliased.Scene_Boot.get('start').call(this);

  // if using the "autoload-devtools" feature, then also load this up.
  if (J.UTILS.Metadata.autoloadDevtools)
  {
    // show the dev tools automatically.
    SceneManager.showDevTools();

    // set a timer for after the devtools has loaded to focus the game window.
    setTimeout(() => nw.Window.get().focus(), 1000);
  }
};
//endregion Scene_Boot