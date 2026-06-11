//region Introduction
import JHud_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

//region version checks
(() =>
{
  // Check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '1.0.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (hasBaseRequirement === false)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }

  const requiredAbsVersion = '4.0.0';
  const hasAbsRequirement = J.ABS
    && J.BASE.Helpers.satisfies(J.ABS.Metadata.version.version(), requiredAbsVersion);

  if (hasAbsRequirement === false)
  {
    throw new Error(`Either missing J-ABS or has a lower version than the required: ${requiredAbsVersion}`);
  }
})();
//endregion version check

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.HUD = {};

/**
 * A collection of all extensions for the HUD.
 */
J.HUD.EXT = {};

/**
 * The `metadata` associated with this plugin, such as version.
 * @type {JHud_PluginMetadata}
 */
J.HUD.Metadata = new JHud_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.HUD.Aliased = {
  Game_System: new Map(),
  Scene_Map: new Map(),
  DataManager: new Map(),
};

// pre-declare the hud manager global before DataManager creates the instance.
globalThis.$hudManager ??= null;

//region plugin commands
/**
 * Plugin command for hiding the hud.
 */
PluginManager.registerCommand(J.HUD.Metadata.name, 'hideHud', () =>
{
  $hudManager.requestHideHud();
});

/**
 * Plugin command for showing the hud.
 */
PluginManager.registerCommand(J.HUD.Metadata.name, 'showHud', () =>
{
  $hudManager.requestShowHud();
});

/**
 * Plugin command for hiding allies in the hud.
 */
PluginManager.registerCommand(J.HUD.Metadata.name, 'hideAllies', () =>
{
  $hudManager.requestHideAllies();
});

/**
 * Plugin command for showing allies in the hud.
 */
PluginManager.registerCommand(J.HUD.Metadata.name, 'showAllies', () =>
{
  $hudManager.requestShowAllies();
});

/**
 * Plugin command for refreshing the hud.
 */
PluginManager.registerCommand(J.HUD.Metadata.name, 'refreshHud', () =>
{
  $hudManager.requestRefreshHud();
});

/**
 * Plugin command for refreshing the hud's image cache.
 */
PluginManager.registerCommand(J.HUD.Metadata.name, 'refreshImageCache', () =>
{
  $hudManager.requestRefreshImageCache();
});
//endregion plugin commands
//endregion Introduction