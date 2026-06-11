//region plugins/jafting/creation-metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DEFAULT_JAFTING_CREATE_PLUGIN_PARAMS } from './fixtures/engine-stubs.js';
import { loadJaftingCreationPluginVm } from './jafting-creation-vm.js';

describe('J-JAFTING + J-JAFTING-Creation metadata (built plugins)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadJaftingCreationPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('exposes core metadata on J.JAFTING.Metadata', () =>
  {
    expect(sandbox.J.JAFTING.Metadata.name).toBe('J-JAFTING');
  });

  it('maps Creation plugin parameters onto J.JAFTING.EXT.CREATE.Metadata', () =>
  {
    const md = sandbox.J.JAFTING.EXT.CREATE.Metadata;

    expect(md.name).toBe('J-JAFTING-Creation');
    expect(md.menuSwitchId).toBe(Number(DEFAULT_JAFTING_CREATE_PLUGIN_PARAMS['menu-switch']));
    expect(md.commandName).toBe(DEFAULT_JAFTING_CREATE_PLUGIN_PARAMS['menu-name']);
    expect(md.commandIconIndex).toBe(Number(DEFAULT_JAFTING_CREATE_PLUGIN_PARAMS['menu-icon']));
  });

  it('loads and classifies crafting config from StorageManager.fsReadFile into maps', () =>
  {
    const md = sandbox.J.JAFTING.EXT.CREATE.Metadata;

    expect(md.recipes.length).toBe(1);
    expect(md.categories.length).toBe(1);

    const recipe = md.recipesMap.get('vitest_recipe');

    expect(recipe).toBeDefined();
    expect(recipe.key).toBe('vitest_recipe');
    expect(recipe.name).toBe('Vitest Recipe');

    const category = md.categoriesMap.get('vitest_cat');

    expect(category).toBeDefined();
    expect(category.key).toBe('vitest_cat');
  });

  it('throws when crafting config JSON is invalid (message includes config path)', () =>
  {
    const badSandbox = { console };

    expect(() =>
    {
      loadJaftingCreationPluginVm(badSandbox, { craftingJson: '{ not valid json' });
    }).toThrow(/failed to parse JSON at data\/config\.crafting\.json/i);
  });
});
//endregion plugins/jafting/creation-metadata.test.js