//region install-ca-mods-host-globals
import PluginMetadata from '../../../../src/plugins/_base/models/PluginMetadata.js';
import { installRealRmmzEngine } from '../../../setup/rmmz-engine-loader.js';

/**
 * Installs the real, vendored RPG Maker MZ engine (Game_Actor/Game_BattlerBase/Game_Enemy/
 * Game_Map/Game_Party/Game_Action, etc.) plus the minimal host-global surface J-Base's
 * `_metadata/initialization.js` needs to run (PluginManager.parameters(), __PLUGIN_NAME__/
 * __PLUGIN_VERSION__), so a `__ca-mods` patch file can be imported directly against real engine
 * prototypes instead of a hand-rolled placeholder. Callers still need to import J-Base's own
 * `_metadata/initialization.js` and `__ca-mods`'s `_metadata/initialization.js` themselves (in
 * that order) before importing the patch file under test- this fixture only prepares the globals
 * those two initialization files themselves require.
 */
export function installCaModsHostGlobals()
{
  // the real engine, not a guess- installs the actual Game_Actor/Game_BattlerBase/Game_Enemy/etc
  // onto globalThis with their real inheritance chains intact.
  installRealRmmzEngine();

  // J-Base's initialization.js reads PluginManager.parameters(name) synchronously at import
  // time to seed J.BASE.Metadata/PluginParameters; an empty parameter set is fine since no
  // __ca-mods patch file under test reads plugin parameters directly.
  globalThis.PluginManager = { parameters: () => '[]' };

  // both J_BaseMetadata and __ca-mods's J_CaModsPluginMetadata extend the real PluginMetadata
  // bare global- concatenated into the same runtime scope in the shipped bundle, so both plugins'
  // metadata subclasses can find it. The class itself is pure (no host globals of its own).
  globalThis.PluginMetadata = PluginMetadata;

  // __PLUGIN_NAME__/__PLUGIN_VERSION__ are Vite `define`-time string substitutions in the real
  // ship build (a different literal per plugin bundle); tests only need some non-empty string
  // for both J-Base's and __ca-mods's initialization.js to construct their PluginMetadata without
  // throwing, so the same placeholder pair is reused for both imports.
  globalThis.__PLUGIN_NAME__ = 'Test-Plugin';
  globalThis.__PLUGIN_VERSION__ = '0.0.0-test';
}
//endregion install-ca-mods-host-globals
