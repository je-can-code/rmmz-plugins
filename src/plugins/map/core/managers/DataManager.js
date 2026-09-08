//region DataManager
/**
 * Extends {@link #createGameObjects}.<br/>
 * Also registers J.MAP minimap input actions and defaults.
 */
J.MAP.Aliased.DataManager.set('createGameObjects', DataManager.createGameObjects);
DataManager.createGameObjects = function()
{
  // perform original logic.
  J.MAP.Aliased.DataManager.get('createGameObjects')
    .call(this);

  // register (or re-register) minimap actions/defaults each boot/load.
  DataManager.registerMinimapInputActions();
};

/**
 * Registers the minimap actions and seeds defaults into the engine-owned Input registry.
 * Called each time game objects are (re)created.
 */
DataManager.registerMinimapInputActions = function()
{
  // the action registry and the symbols it binds to both belong to J-ABS-InputManager, which this
  // plugin only orders after rather than requires. without it there is nothing to register into,
  // and the minimap is driven by its plugin command instead.
  if (!J.ABS || !J.ABS.EXT.INPUT) return;

  // register logical actions under the J.MAP namespace.
  Input.registerAction('J.MAP', {
    key: 'minimap-toggle',
    label: 'Toggle Minimap',
    defaults: [ J.ABS.EXT.INPUT.Symbols.DPadUp ],
    category: 'ui',
  });

  Input.registerAction('J.MAP', {
    key: 'expand-minimap',
    label: 'Expand Minimap (Hold)',
    defaults: [ J.ABS.EXT.INPUT.Symbols.DPadDown ],
    category: 'ui',
  });

  // seed defaults (replacement-idempotent) and ensure live bindings exist.
  Input.seedDefaultBindings('J.MAP', {
    'minimap-toggle': [ J.ABS.EXT.INPUT.Symbols.DPadUp ],
    'expand-minimap': [ J.ABS.EXT.INPUT.Symbols.DPadDown ],
  });
  Input.getAllBindings('J.MAP');
};

//endregion DataManager