//region DataManager
/**
 * Extends/Overrides {@link #createGameObjects}.<br/>
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
    defaults: [ J.ABS.Input.DPadUp ],
    category: 'ui',
  });

  Input.registerAction('J.MAP', {
    key: 'expand-minimap',
    label: 'Expand Minimap (Hold)',
    defaults: [ J.ABS.Input.DPadDown ],
    category: 'ui',
  });

  // seed defaults (replacement-idempotent) and ensure live bindings exist.
  Input.seedDefaultBindings('J.MAP', {
    'minimap-toggle': [ J.ABS.Input.DPadUp ],
    'expand-minimap': [ J.ABS.Input.DPadDown ],
  });
  Input.getAllBindings('J.MAP');

  // make sure these symbols are capture-eligible and nicely labeled.
  Input.registerRemapCaptureSymbol(J.ABS.Input.DPadUp);
  Input.registerRemapCaptureSymbol(J.ABS.Input.DPadDown);
  Input.registerSymbolLabel(J.ABS.Input.DPadUp, 'D-Pad Up');
  Input.registerSymbolLabel(J.ABS.Input.DPadDown, 'D-Pad Down');
};

//endregion DataManager