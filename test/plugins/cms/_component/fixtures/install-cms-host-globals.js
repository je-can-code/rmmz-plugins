//region plugins/cms/_component/fixtures/install-cms-host-globals.js
import { installJBaseHostGlobals } from '../../../_base/core/_component/fixtures/install-j-base-host-globals.js';
import { installPluginManagerWithParams } from '../../../../setup/install-plugin-manager-with-params.js';
import PluginMetadata from '../../../../../src/plugins/_base/core/models/PluginMetadata.js';

/**
 * The help text J-CMS ships configured in the real project/js/plugins.js, so metadata assertions
 * exercise realistic strings rather than the empty-object default. `help-formation` is deliberately
 * absent: the real configuration leaves it unset, which is what exercises the fallback.
 * @type {Record<string, string>}
 */
export const DEFAULT_CMS_PLUGIN_PARAMS = {
  'help-item': 'Use and inspect the things you are carrying.',
  'help-skill': 'Review the skills each member has learned.',
  'help-equip': 'Change what your party has equipped.',
  'help-status': 'Look over a member in detail.',
  'help-options': 'Adjust how the game plays and sounds.',
  'help-save': 'Record your progress.',
  'help-gameEnd': 'Step away for now.',
};

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
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-CMS's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJCms(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-CMS';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-CMS-Equip's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJCmsEquip(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-CMS-Equip';
  sandbox.__PLUGIN_VERSION__ = '1.1.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-CMS-Skill's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJCmsSkill(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-CMS-Skill';
  sandbox.__PLUGIN_VERSION__ = '1.1.0';
}

/**
 * Globals required for the J-CMS family's `_metadata/**` and `_models/**` files to evaluate when
 * direct-imported into the real Vitest realm instead of a nested vm context.
 *
 * Deliberately its own fixture rather than a shared one: each plugin family owns its host-global
 * surface so a change made for one family cannot silently alter another family's test environment.
 *
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 * @param {Record<string, string>} [cmsParams] Plugin parameters to serve for J-CMS.
 */
export function installCmsHostGlobals(sandbox = globalThis, cmsParams = DEFAULT_CMS_PLUGIN_PARAMS)
{
  // installing twice would re-run J-Base's own bootstrap and double-register its metadata, so the
  // whole body is idempotent behind a single marker flag.
  if (sandbox.__cmsHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__cmsHostGlobalsInstalled = true;

  // the whole J-CMS family sits on top of J-Base, so J-Base's host surface has to exist first.
  installJBaseHostGlobals(sandbox);

  // each cms ship's _pluginMetadata.js subclasses this real J-Base class as a bare global (no
  // import), exactly the way the built plugin bundle sees it after vite concatenation.
  sandbox.PluginMetadata ??= PluginMetadata;

  installPluginManagerWithParams(sandbox, 'J-CMS', cmsParams);
}
//endregion plugins/cms/_component/fixtures/install-cms-host-globals.js
