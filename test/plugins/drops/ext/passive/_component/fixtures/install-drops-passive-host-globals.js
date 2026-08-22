//region plugins/drops/ext/passive/_component/fixtures/install-drops-passive-host-globals.js
import PluginMetadata from '../../../../../../../src/plugins/_base/core/models/PluginMetadata.js';
import { installRealRmmzEngine } from '../../../../../../setup/rmmz-engine-loader.js';

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-Base's identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJBase(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Base';
  sandbox.__PLUGIN_VERSION__ = '3.2.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-DropsControl's identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJDrops(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-DropsControl';
  sandbox.__PLUGIN_VERSION__ = '2.3.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-Drops-Passive's own identity.
 *
 * This is J-Drops-Passive's own isolated fixture, not shared with any other extension- each
 * extension is an independent plugin and gets a fixture file of its own.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJDropsPassive(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Drops-Passive';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Installs the real, vendored RPG Maker MZ engine plus the minimal host-global surface that
 * J-Base's and J-DropsControl's initialization files read at import time, so this extension's patch
 * files can be imported directly against real engine prototypes.
 *
 * J-DropsControl's own `Game_Enemy.dropSources` is stood in rather than imported: it is a
 * different ship's bundle, and the point of the tests here is that this extension chains onto
 * whatever answer that ship gives, not what that answer happens to be.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function installDropsPassiveHostGlobals(sandbox = globalThis)
{
  // the real engine, not a guess- real Game_Enemy/Game_Party with their inheritance intact.
  installRealRmmzEngine();

  // both metadata subclasses extend the real PluginMetadata as a bare global, the way the
  // concatenated ship bundles see it at runtime.
  sandbox.PluginMetadata ??= PluginMetadata;

  // neither ship in this chain reads a plugin parameter, so an empty set is honest.
  sandbox.PluginManager = { parameters: () => '[]' };
}

/**
 * Stands in J-DropsControl's own base implementation of `dropSources`, which this extension aliases.
 * @param {RPG_BaseItem[]} baseSources What the base implementation reports.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function installBaseDropSources(baseSources, sandbox = globalThis)
{
  sandbox.Game_Enemy.prototype.dropSources = function()
  {
    // a fresh array per call, matching the real implementation- the alias pushes onto what it gets.
    return [ ...baseSources ];
  };
}
//endregion plugins/drops/ext/passive/_component/fixtures/install-drops-passive-host-globals.js