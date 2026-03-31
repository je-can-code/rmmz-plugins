//region finish-plugin-vm-harness
import vm from 'node:vm';

const FINISH_SNIPPET = `
(function()
{
  if (typeof Number.prototype.clamp !== 'function')
  {
    Number.prototype.clamp = function(min, max)
    {
      return Math.min(max, Math.max(min, Number(this)));
    };
  }

  globalThis.RPGManager = RPGManager;
  globalThis.RPG_Enemy = RPG_Enemy;
  globalThis.RPG_DropItem = RPG_DropItem;
  globalThis.JsonMapper = JsonMapper;

  const battlerGetNotesSources = Game_Battler.prototype.getNotesSources;

  Game_Battler.prototype.getNotesSources = function()
  {
    if (Array.isArray(this.__testNoteSources))
    {
      return this.__testNoteSources;
    }

    return battlerGetNotesSources.call(this);
  };

  const actorGetNotesSources = Game_Actor.prototype.getNotesSources;

  Game_Actor.prototype.getNotesSources = function()
  {
    if (Array.isArray(this.__testNoteSources))
    {
      return this.__testNoteSources;
    }

    return actorGetNotesSources.call(this);
  };

  const partyItemContainerPrev = Game_Party.prototype.itemContainer;

  Game_Party.prototype.itemContainer = function(item)
  {
    if (this.__testItemContainer !== undefined && this.__testItemContainer !== null)
    {
      return this.__testItemContainer;
    }

    if (typeof partyItemContainerPrev === 'function')
    {
      return partyItemContainerPrev.call(this, item);
    }

    return null;
  };
})();
`;

/**
 * After {@link out/J-Base.js} and a feature plugin run in the VM: polyfills, expose lexical classes on
 * `globalThis` for Node assertions, and test-only hooks (`__testNoteSources`, `__testItemContainer`).
 *
 * @param {object} sandbox
 */
export function finishPluginVmHarness(sandbox)
{
  vm.runInContext(FINISH_SNIPPET, sandbox);
}
//endregion finish-plugin-vm-harness
