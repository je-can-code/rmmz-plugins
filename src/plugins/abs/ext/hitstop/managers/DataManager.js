//region DataManager
/**
 * Extends {@link DataManager.extractSaveContents}.<br/>
 * Reinitializes hitstop data on all characters after a save is loaded so no
 * stale combat state (frozen frames, active flurry windows) carries over.
 */
J.ABS.EXT.HITSTOP.Aliased.DataManager.set('extractSaveContents', DataManager.extractSaveContents);
DataManager.extractSaveContents = function(contents)
{
  // perform original logic.
  J.ABS.EXT.HITSTOP.Aliased.DataManager.get('extractSaveContents')
    .call(this, contents);

  // reset hitstop state on every character so loaded saves never carry stale combat data.
  const characters = [
    $gamePlayer,
    ...$gamePlayer.followers().data(),
    ...$gameMap.events(),
  ];

  for (const character of characters)
  {
    character.initHitstopMembers();
  }
};
//endregion DataManager
