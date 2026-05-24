//region plugins/map/map-vm.js
import vm from 'node:vm';

import { evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

import { installMapEngineStubs } from './fixtures/engine-stubs.js';

export const MAP_OUT_FILENAME = 'map/J-Map.js';

const EXPOSE_MAP_GLOBALS = `
globalThis.MinimapEventType = MinimapEventType;
`;

/**
 * Loads {@link out/J-Map.js} with J-Base and harness.
 *
 * @param {object} sandbox
 */
export function loadMapPluginVm(sandbox)
{
  evaluateShippedPlugin({
    outFilename: MAP_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installMapEngineStubs(s);
    },
  });

  vm.runInContext(`
globalThis.J = globalThis.J || {};
globalThis.J.ABS = globalThis.J.ABS || {};
globalThis.J.ABS.EXT = globalThis.J.ABS.EXT || {};
globalThis.J.ABS.EXT.INPUT = globalThis.J.ABS.EXT.INPUT || {};
globalThis.J.ABS.EXT.INPUT.Symbols = globalThis.J.ABS.EXT.INPUT.Symbols || {};
globalThis.J.ABS.EXT.INPUT.Symbols.DPadUp = globalThis.J.ABS.EXT.INPUT.Symbols.DPadUp || 'dpadUp';
globalThis.J.ABS.EXT.INPUT.Symbols.DPadDown = globalThis.J.ABS.EXT.INPUT.Symbols.DPadDown || 'dpadDown';
`, sandbox);

  vm.runInContext(EXPOSE_MAP_GLOBALS, sandbox);
}
//endregion plugins/map/map-vm.js
