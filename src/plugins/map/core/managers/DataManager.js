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
  // register logical actions under the J.MAP namespace.
  Input.registerAction('J.MAP', {
    key: 'minimap-toggle',
    label: 'Toggle Minimap',
    // handle this switch arm for the current discriminant.
    defaults: [ J.ABS.EXT.INPUT.Symbols.DPadUp ],
    category: 'ui',
  });

  // policy step inside register minimap input actions.
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