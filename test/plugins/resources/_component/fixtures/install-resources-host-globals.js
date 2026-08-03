//region plugins/resources/_component/fixtures/install-resources-host-globals.js
import { installJBaseHostGlobals } from '../../../_base/core/_component/fixtures/install-j-base-host-globals.js';
import PluginMetadata from '../../../../../src/plugins/_base/core/models/PluginMetadata.js';

/**
 * `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` are bare identifiers read once, at import time, by
 * _base/_metadata/initialization.js. Vite's `define` substitutes them at build time, so raw src
 * imports have to supply them by hand.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJBase(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Base';
  sandbox.__PLUGIN_VERSION__ = '3.2.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-Resources's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJResources(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Resources';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-Resources-ABS's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJResourcesAbs(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Resources-ABS';
  sandbox.__PLUGIN_VERSION__ = '1.1.0';
}

/**
 * Globals required for the J-Resources family's `_metadata/**` files to evaluate when
 * direct-imported into the real Vitest realm instead of a nested vm context.
 *
 * Deliberately its own fixture rather than a shared one: each plugin family owns its host-global
 * surface so a change made for one family cannot silently alter another family's test environment.
 *
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 */
export function installResourcesHostGlobals(sandbox = globalThis)
{
  // installing twice would re-run J-Base's own bootstrap and double-register its metadata, so the
  // whole body is idempotent behind a single marker flag.
  if (sandbox.__resourcesHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__resourcesHostGlobalsInstalled = true;

  // the resources family sits on top of J-Base, so J-Base's host surface has to exist first.
  installJBaseHostGlobals(sandbox);

  // each resources ship's _pluginMetadata.js subclasses this real J-Base class as a bare global
  // (no import), exactly the way the built plugin bundle sees it after vite concatenation.
  sandbox.PluginMetadata ??= PluginMetadata;
}
//endregion plugins/resources/_component/fixtures/install-resources-host-globals.js
