//region plugins/pixel/pixel-vm.js
import vm from 'node:vm';

import { appendShippedPluginToVm, evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

import { DEFAULT_PIXEL_CORE_PLUGIN_PARAMS } from './fixtures/pixel-plugin-params.js';
import {
  installPixelAbsExtensionEngineStubs,
  installPixelCoreEngineStubs,
} from './fixtures/engine-stubs.js';

export const PIXEL_CORE_OUT_FILENAME = 'pixel/J-Pixelistics.js';

export const PIXEL_ABS_EXT_OUT_FILENAME = 'pixel/ext/J-Pixel-ABS.js';

const EXPOSE_PIXEL_GLOBALS = `
globalThis.PIXEL_CollisionManager = PIXEL_CollisionManager;
`;

/**
 * Loads {@link out/pixel/J-Pixelistics.js} with J-Base and harness.
 *
 * @param {object} sandbox
 * @param {object} [options]
 * @param {Record<string, string>} [options.coreParams]
 */
export function loadPixelCorePluginVm(sandbox, options = {})
{
  const {
    coreParams = DEFAULT_PIXEL_CORE_PLUGIN_PARAMS,
  } = options;

  evaluateShippedPlugin({
    outFilename: PIXEL_CORE_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installPixelCoreEngineStubs(s, coreParams);
    },
  });

  vm.runInContext(EXPOSE_PIXEL_GLOBALS, sandbox);
}

/**
 * Loads {@link out/pixel/J-Pixelistics.js} then {@link out/pixel/ext/J-Pixel-ABS.js}.
 *
 * @param {object} sandbox
 * @param {object} [options]
 * @param {Record<string, string>} [options.coreParams]
 * @param {Record<string, string>} [options.extParams]
 */
export function loadPixelAbsStackPluginVm(sandbox, options = {})
{
  const {
    coreParams = DEFAULT_PIXEL_CORE_PLUGIN_PARAMS,
    extParams,
  } = options;

  evaluateShippedPlugin({
    outFilename: PIXEL_CORE_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installPixelCoreEngineStubs(s, coreParams);
    },
  });

  vm.runInContext(EXPOSE_PIXEL_GLOBALS, sandbox);

  installPixelAbsExtensionEngineStubs(sandbox, extParams);

  appendShippedPluginToVm({
    sandbox,
    outFilename: PIXEL_ABS_EXT_OUT_FILENAME,
  });
}
//endregion plugins/pixel/pixel-vm.js
