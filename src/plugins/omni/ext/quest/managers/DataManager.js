//region DataManager
/**
 * Extends {@link #createGameObjects}.<br/>
 * Also registers J.OMNI.QUEST input actions and defaults.
 */
J.OMNI.EXT.QUEST.Aliased.DataManager.set('createGameObjects', DataManager.createGameObjects);
DataManager.createGameObjects = function()
{
  // perform original logic.
  J.OMNI.EXT.QUEST.Aliased.DataManager.get('createGameObjects')
    .call(this);

  // register (or re-register) quest actions/defaults each boot/load.
  DataManager.registerQuestopediaInputActions();
};

/**
 * Registers the quest actions and seeds defaults into the engine-owned Input registry.
 * Called each time game objects are (re)created.
 */
DataManager.registerQuestopediaInputActions = function()
{
  // the action registry and the symbol it binds to both belong to J-ABS-InputManager, which this
  // plugin only orders after rather than requires. without it there is nothing to register into,
  // and the questopedia is reached through the menu instead.
  if (!J.ABS || !J.ABS.EXT.INPUT) return;

  // register the logical action under the J.OMNI.QUEST namespace.
  Input.registerAction('J.OMNI.QUEST', {
    key: 'open-quest-log',
    label: 'Open Quest Log',
    defaults: [ J.ABS.EXT.INPUT.Symbols.DPadRight ],
    category: 'ui',
  });

  // seed defaults (replacement-idempotent) and ensure live bindings exist.
  Input.seedDefaultBindings('J.OMNI.QUEST', {
    'open-quest-log': [ J.ABS.EXT.INPUT.Symbols.DPadRight ],
  });

  // lazily initialize the live bindings bucket for this ns if needed.
  Input.getAllBindings('J.OMNI.QUEST');
};
//endregion DataManager