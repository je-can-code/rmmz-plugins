//region plugins/jafting/fixtures/engine-stubs.js
import vm from 'node:vm';

import { installMinimalMenuUiStubs } from '../../../setup/install-minimal-menu-ui-stubs.js';

const noop = function()
{
};

/**
 * J-Base references {@link JsonEx} in a few paths; MZ defines it globally. Refinement trait merging uses
 * {@link JsonEx.makeDeepCopy} when refinement trait lists are combined (e.g. {@link JaftingManager.parseTraits}).
 *
 * @param {object} sandbox
 */
function ensureJsonExVmStub(sandbox)
{
  if (sandbox.JsonEx !== undefined)
  {
    return;
  }

  sandbox.JsonEx = {
    makeDeepCopy(value)
    {
      if (Array.isArray(value))
      {
        return value.slice();
      }

      return value;
    },
  };
}

export const VITEST_MINIMAL_CRAFTING_JSON = JSON.stringify({
  recipes: [
    {
      name: 'Vitest Recipe',
      key: 'vitest_recipe',
      categoryKeys: [ 'vitest_cat' ],
      iconIndex: 1,
      description: 'vitest recipe description',
      unlockedByDefault: true,
      maskedUntilCrafted: false,
      tools: [],
      ingredients: [
        { id: 1, type: 'i', count: 1 },
      ],
      outputs: [
        { id: 2, type: 'i', count: 1 },
      ],
    },
  ],
  categories: [
    {
      name: 'Vitest Category',
      key: 'vitest_cat',
      iconIndex: 0,
      description: 'vitest category description',
      unlockedByDefault: true,
    },
  ],
});

export const DEFAULT_JAFTING_CREATE_PLUGIN_PARAMS = {
  'menu-switch': '222',
  'menu-name': 'Vitest Creation',
  'menu-icon': '88',
};

export const DEFAULT_JAFTING_REFINE_PLUGIN_PARAMS = {
  'menu-switch': '333',
  'menu-name': 'Vitest Refine',
  'menu-icon': '77',
};

/**
 * Stubs for evaluating JAFTING core alone (after {@link installJBaseHostGlobals}).
 *
 * @param {object} sandbox
 */
export function installJaftingCoreEngineStubs(sandbox)
{
  const prevPm = sandbox.PluginManager;

  sandbox.PluginManager = {
    parameters(name)
    {
      if (name === 'J-JAFTING')
      {
        return {};
      }

      return prevPm.parameters(name);
    },
    registerCommand()
    {
    },
  };

  installMinimalMenuUiStubs(sandbox);

  sandbox.DataManager.createGameObjects = sandbox.DataManager.createGameObjects || noop;

  ensureJsonExVmStub(sandbox);
}

/**
 * Host stubs omit MZ `Game_Party.prototype.initialize`, but JAFTING extensions chain onto it.
 * Replaces the chain with an initializer that sets `_items` and runs whichever extension hooks exist.
 * <br>
 * Tests that assign `$gameParty` manually must also call {@link JaftingSalvageManager.initPartySalvageStorage} once
 * (the real game runs that from {@link DataManager.createGameObjects} / {@link DataManager.extractSaveContents}).
 *
 * @param {object} sandbox
 */
export function installJaftingVmGamePartyBootstrap(sandbox)
{
  const snippet = `
    Game_Party.prototype.initialize = function()
    {
      this._items = {};
      if (typeof this.initJaftingCreationMembers === 'function')
      {
        this.initJaftingCreationMembers();
        this.populateJaftingTrackings();
      }
      if (typeof this.initJaftingRefinementMembers === 'function')
      {
        this.initJaftingRefinementMembers();
      }
    };

    if (typeof Game_Party.prototype.loseItem !== 'function')
    {
      Game_Party.prototype.loseItem = function(item, amount, includeEquip)
      {
        this.gainItem(item, -amount, includeEquip);
      };
    }
  `;

  vm.runInContext(snippet, sandbox);
}

/**
 * Minimal {@link $dataItems} rows for {@link VITEST_MINIMAL_CRAFTING_JSON} (ids 1 = ingredient, 2 = output).
 *
 * @param {object} sandbox
 */
export function seedJaftingCreationDatabaseItems(sandbox)
{
  const snippet = `
    function vitestCraftingItemRaw(overrides)
    {
      return Object.assign({
        id: 1,
        meta: {},
        name: 'Vitest Item',
        note: '',
        animationId: 0,
        consumable: true,
        damage: {
          type: 1,
          elementId: 0,
          formula: '0',
          variance: 20,
          critical: false,
        },
        effects: [],
        hitType: 0,
        iconIndex: 1,
        itypeId: 1,
        occasion: 0,
        price: 0,
        repeats: 1,
        scope: 0,
        speed: 0,
        successRate: 100,
        tpGain: 0,
        description: 'vitest',
      }, overrides);
    }

    $dataItems[1] = new RPG_Item(vitestCraftingItemRaw({
      id: 1,
      name: 'Vitest Ingredient',
      iconIndex: 1,
      description: 'vitest ingredient',
    }), 1);
    $dataItems[2] = new RPG_Item(vitestCraftingItemRaw({
      id: 2,
      name: 'Vitest Output',
      iconIndex: 2,
      description: 'vitest output',
    }), 2);
    $dataItems[3] = new RPG_Item(vitestCraftingItemRaw({
      id: 3,
      name: 'Vitest Tool',
      iconIndex: 3,
      description: 'vitest tool',
    }), 3);
  `;

  vm.runInContext(snippet, sandbox);
}

/**
 * Stubs for evaluating JAFTING core + Creation in the VM (after {@link installJBaseHostGlobals}).
 *
 * @param {object} sandbox
 * @param {object} [options]
 * @param {string} [options.craftingJson] Full JSON text for {@link StorageManager.fsReadFile}.
 */
export function installJaftingCreationEngineStubs(sandbox, options = {})
{
  const { craftingJson = VITEST_MINIMAL_CRAFTING_JSON } = options;
  const prevPm = sandbox.PluginManager;

  sandbox.PluginManager = {
    parameters(name)
    {
      if (name === 'J-JAFTING-Creation')
      {
        return DEFAULT_JAFTING_CREATE_PLUGIN_PARAMS;
      }

      if (name === 'J-JAFTING')
      {
        return {};
      }

      return prevPm.parameters(name);
    },
    registerCommand()
    {
    },
  };

  sandbox.StorageManager.fsReadFile = function()
  {
    return craftingJson;
  };

  ensureJsonExVmStub(sandbox);

  installMinimalMenuUiStubs(sandbox);

  sandbox.ImageManager = sandbox.ImageManager || {};
  sandbox.ImageManager.iconWidth = sandbox.ImageManager.iconWidth || 32;
  sandbox.ImageManager.iconHeight = sandbox.ImageManager.iconHeight || 32;
  sandbox.ImageManager.loadSystem = sandbox.ImageManager.loadSystem || function()
  {
    return {};
  };

  sandbox.DataManager.createGameObjects = sandbox.DataManager.createGameObjects || noop;

  installJaftingVmGamePartyBootstrap(sandbox);
}

/**
 * Stubs for JAFTING core + Refinement (no external crafting JSON).
 *
 * @param {object} sandbox
 */
export function installJaftingRefineEngineStubs(sandbox)
{
  if (typeof sandbox.Game_Item !== 'function')
  {
    function Game_Item()
    {
    }

    Game_Item.prototype.setObject = noop;
    Game_Item.prototype.object = function()
    {
      return null;
    };

    sandbox.Game_Item = Game_Item;
  }

  const prevPm = sandbox.PluginManager;

  sandbox.PluginManager = {
    parameters(name)
    {
      if (name === 'J-JAFTING-Refinement')
      {
        return DEFAULT_JAFTING_REFINE_PLUGIN_PARAMS;
      }

      if (name === 'J-JAFTING')
      {
        return {};
      }

      return prevPm.parameters(name);
    },
    registerCommand()
    {
    },
  };

  installMinimalMenuUiStubs(sandbox);

  sandbox.ImageManager = sandbox.ImageManager || {};
  sandbox.ImageManager.iconWidth = sandbox.ImageManager.iconWidth || 32;
  sandbox.ImageManager.iconHeight = sandbox.ImageManager.iconHeight || 32;
  sandbox.ImageManager.loadSystem = sandbox.ImageManager.loadSystem || function()
  {
    return {};
  };

  sandbox.DataManager.createGameObjects = sandbox.DataManager.createGameObjects || noop;

  ensureJsonExVmStub(sandbox);

  installJaftingVmGamePartyBootstrap(sandbox);
}
//endregion plugins/jafting/fixtures/engine-stubs.js
