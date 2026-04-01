//region shipped-plugin-vm
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { installJBaseHostGlobals } from '../plugins/_base/fixtures/install-j-base-host-globals.js';
import { repoRoot } from './repo-root.js';
import { finishPluginVmHarness } from './finish-plugin-vm-harness.js';
import { evaluateJBaseInSandboxOnce } from './j-base-vm-script.js';

const J_BASE_OUT_PATH = path.join(repoRoot, 'out', 'J-Base.js');

const DEFAULT_J_BASE_PLUGIN_PARAMS = {
  actorBaseTp: '0',
  enemyBaseTp: '100',
};

/**
 * Ensures `sandbox` has been passed to `vm.createContext` exactly once.
 *
 * @param {object} sandbox
 */
function ensureVmContext(sandbox)
{
  if (sandbox.__rmmzPluginVmReady === true)
  {
    return;
  }

  vm.createContext(sandbox);
  sandbox.__rmmzPluginVmReady = true;
}

/**
 * Reads {@link out/J-Base.js} once per sandbox, optional prelude scripts, then the built plugin.
 *
 * @param {object} options
 * @param {string} options.outFilename Output filename under `out/` (e.g. `J-NaturalGrowth.js`).
 * @param {object} options.sandbox Globals visible to the plugin (`PluginManager`, engine classes, etc.).
 * @param {boolean} [options.loadJBase=true] When true, installs J-Base host globals, evaluates `out/J-Base.js` once.
 * @param {Record<string, string>} [options.jBasePluginParameterStrings] `PluginManager.parameters('J-Base')` shape.
 * @param {(sandbox: object) => void} [options.afterHostGlobalsInstall] Replace placeholder engine classes before J-Base.
 * @param {string[]} [options.preludeRepoRelativePaths] Optional extra scripts before the feature plugin.
 * @param {string} [options.appendToPluginSource] Text appended to the plugin file before eval (same lexical scope as the bundle; use to export top-level `class` names to `globalThis` for tests).
 * @returns {object} The same sandbox reference after all scripts have run.
 */
export function evaluateShippedPlugin(options)
{
  const {
    outFilename,
    sandbox,
    preludeRepoRelativePaths = [],
    loadJBase = true,
    jBasePluginParameterStrings = DEFAULT_J_BASE_PLUGIN_PARAMS,
    afterHostGlobalsInstall = null,
    appendToPluginSource = '',
  } = options;
  const absolutePath = path.join(repoRoot, 'out', outFilename);

  if (fs.existsSync(absolutePath) === false)
  {
    throw new Error(
      `Missing ${absolutePath}. Run the matching build (e.g. bun run build:natural) before bun test.`,
    );
  }

  ensureVmContext(sandbox);

  if (loadJBase === true)
  {
    installJBaseHostGlobals(sandbox, jBasePluginParameterStrings);
  }

  if (typeof afterHostGlobalsInstall === 'function')
  {
    afterHostGlobalsInstall(sandbox);
  }

  if (loadJBase === true)
  {
    evaluateJBaseInSandboxOnce(sandbox);
  }

  for (const rel of preludeRepoRelativePaths)
  {
    const preludeAbs = path.join(repoRoot, rel);

    if (fs.existsSync(preludeAbs) === false)
    {
      throw new Error(`Missing prelude ${preludeAbs}.`);
    }

    const preludeCode = fs.readFileSync(preludeAbs, 'utf8');

    vm.runInContext(preludeCode, sandbox, { filename: preludeAbs });
  }

  const code = fs.readFileSync(absolutePath, 'utf8') + appendToPluginSource;

  vm.runInContext(code, sandbox, { filename: absolutePath });

  if (loadJBase === true)
  {
    finishPluginVmHarness(sandbox);
  }

  return sandbox;
}

/**
 * Evaluates an additional built plugin into an existing VM context (J-Base and {@link finishPluginVmHarness} already ran).
 * Use to stack plugins such as {@link out/J-CriticalFactors.js} after {@link out/J-NaturalGrowth.js}.
 *
 * @param {object} options
 * @param {object} options.sandbox
 * @param {string} options.outFilename Basename under `out/` (e.g. `J-CriticalFactors.js`).
 * @param {string} [options.appendToPluginSource] Appended before eval; see {@link evaluateShippedPlugin}.
 * @returns {object} The same sandbox reference.
 */
export function appendShippedPluginToVm(options)
{
  const { sandbox, outFilename, appendToPluginSource = '' } = options;
  const absolutePath = path.join(repoRoot, 'out', outFilename);

  if (fs.existsSync(absolutePath) === false)
  {
    throw new Error(
      `Missing ${absolutePath}. Run the matching build before bun test.`,
    );
  }

  ensureVmContext(sandbox);

  const code = fs.readFileSync(absolutePath, 'utf8') + appendToPluginSource;

  vm.runInContext(code, sandbox, { filename: absolutePath });

  return sandbox;
}

/**
 * Installs host globals, evaluates {@link out/J-Base.js} once per sandbox, and runs {@link finishPluginVmHarness}.
 * Use for J-Base-only tests (no feature plugin). Prefer {@link evaluateShippedPlugin} when loading `out/J-*.js` plugins.
 *
 * @param {object} options
 * @param {object} options.sandbox Globals for the VM context.
 * @param {Record<string, string>} [options.jBasePluginParameterStrings] `PluginManager.parameters('J-Base')` shape.
 * @param {(sandbox: object) => void} [options.afterHostGlobalsInstall] Runs after host globals, before J-Base eval.
 * @returns {object} The same sandbox reference.
 */
export function evaluateJBaseOnlyForTests(options)
{
  const {
    sandbox,
    jBasePluginParameterStrings = DEFAULT_J_BASE_PLUGIN_PARAMS,
    afterHostGlobalsInstall = null,
  } = options;

  if (fs.existsSync(J_BASE_OUT_PATH) === false)
  {
    throw new Error(
      `Missing ${J_BASE_OUT_PATH}. Run bun run build:base before bun test.`,
    );
  }

  ensureVmContext(sandbox);
  installJBaseHostGlobals(sandbox, jBasePluginParameterStrings);

  if (typeof afterHostGlobalsInstall === 'function')
  {
    afterHostGlobalsInstall(sandbox);
  }

  evaluateJBaseInSandboxOnce(sandbox);
  finishPluginVmHarness(sandbox);

  return sandbox;
}

/**
 * Clears {@link RPGManager} WeakMap caches inside the VM (lexical `class` is not visible as `sandbox.RPGManager` from Node).
 *
 * @param {object} sandbox
 */
export function clearRpgManagerCacheInVm(sandbox)
{
  vm.runInContext('RPGManager.clearCache();', sandbox);
}
//endregion shipped-plugin-vm
