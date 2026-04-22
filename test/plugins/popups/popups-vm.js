//region plugins/popups/popups-vm.js
import vm from 'node:vm';

import { evaluateShippedPlugin } from '../../setup/shipped-plugin-vm.js';

import { installPopupsEngineStubs } from './fixtures/engine-stubs.js';

export const POPUPS_OUT_FILENAME = 'popups/J-Popups.js';

const EXPOSE_POPUPS_GLOBALS = `
globalThis.TextPopBuilder = TextPopBuilder;
globalThis.TextPopSpriteManager = TextPopSpriteManager;
globalThis.Map_TextPop = Map_TextPop;
`;

/**
 * Loads {@link out/popups/J-Popups.js} with J-Base and harness.
 *
 * @param {object} sandbox
 */
export function loadPopupsPluginVm(sandbox)
{
  evaluateShippedPlugin({
    outFilename: POPUPS_OUT_FILENAME,
    sandbox,
    afterHostGlobalsInstall(s)
    {
      installPopupsEngineStubs(s);
    },
  });

  vm.runInContext(EXPOSE_POPUPS_GLOBALS, sandbox);

  vm.runInContext(`
(function()
{
  const prev = Sprite_Damage.prototype.repositionChildren;

  Sprite_Damage.prototype.repositionChildren = function()
  {
    if (this.children === undefined || this.children === null)
    {
      this.children = [];
    }

    return prev.call(this);
  };
})();
`, sandbox);
}
//endregion plugins/popups/popups-vm.js
