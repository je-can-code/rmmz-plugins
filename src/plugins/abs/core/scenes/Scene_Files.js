//region Scene_Files
/**
 * Teaches J-Base-Save's files scene the same map-reload rule vanilla's load screen already learned.
 *
 * J-Base-Save is genuinely optional, so this whole file is behind one namespace check - the sanctioned
 * cross-plugin form. Without the check, a project running J-ABS and not J-Base-Save would throw on
 * boot; without the file, a project running both would load a map with no enemies on it and nothing
 * anywhere would say why.
 *
 * **The namespace check alone is not sufficient, and this is the subtle part.** `J.BASE.EXT.SAVE`
 * proves the namespace exists; aliasing `Scene_Files.prototype` needs the *class* to exist, which means
 * J-Base-Save has to have loaded first. That is declared as `@orderAfter J-Base-Save` in this plugin's
 * annotations - deliberately `@orderAfter` and not `@base`, since `@base` is a hard dependency and
 * would make the save plugin mandatory, destroying the optionality this check exists to preserve.
 */
if (J.BASE.EXT.SAVE)
{
  /**
   * Overwrites {@link Scene_Files.reloadMapIfUpdated}.<br/>
   * When loading, the map needs to be refreshed to load the enemies properly.
   */
  J.ABS.Aliased.Scene_Files.set('reloadMapIfUpdated', Scene_Files.prototype.reloadMapIfUpdated);
  Scene_Files.prototype.reloadMapIfUpdated = function()
  {
    if ($jabsEngine.absEnabled)
    {
      J.ABS.Helpers.forceMapReload();
    }
    else
    {
      // perform original logic.
      J.ABS.Aliased.Scene_Files.get('reloadMapIfUpdated')
        .call(this);
    }
  };
}
//endregion Scene_Files