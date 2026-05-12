//region DataManager
/**
 * Salvage ledger bags live on `$gameParty._j` — they must exist after the party object is real.<br>
 * Vanilla {@link Scene_Boot#onDatabaseLoaded} fires **before** {@link DataManager.createGameObjects}, so `$gameParty`
 * is still null there; explicit init belongs on {@link DataManager.createGameObjects} and on
 * {@link DataManager.extractSaveContents} after a loaded save replaces `$gameParty`.
 */
J.JAFTING.Aliased.DataManager.set('createGameObjects', DataManager.createGameObjects);
DataManager.createGameObjects = function()
{
  J.JAFTING.Aliased.DataManager.get('createGameObjects')
    .call(this);

  // new game, battle test, event test, and the throwaway party before `extractSaveContents` all pass through here.
  JaftingSalvageManager.initPartySalvageStorage();
};

J.JAFTING.Aliased.DataManager.set('extractSaveContents', DataManager.extractSaveContents);
DataManager.extractSaveContents = function(contents)
{
  J.JAFTING.Aliased.DataManager.get('extractSaveContents')
    .call(this, contents);

  // `JsonEx` swaps in the saved party instance—old saves may omit `_j`; normalize once on the hydrated object.
  JaftingSalvageManager.initPartySalvageStorage();
};
//endregion DataManager