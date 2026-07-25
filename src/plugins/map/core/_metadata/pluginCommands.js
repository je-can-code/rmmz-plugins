//region plugin commands
/**
 * Toggle the minimap visibility on the map scene.
 */
PluginManager.registerCommand(J.MAP.Metadata.name, 'toggle-minimap', args =>
{
  const shouldShow = `${args.action}` === 'true';

  // if the map blocks the minimap, force hide and bail.
  if ($gameMap.isMinimapBlocked())
  {
    // ensure the persisted state remains hidden while on this map.
    $gameSystem.hideMinimap();

    // if currently on the map scene, immediately reflect the hidden state.
    if (SceneManager._scene.isMapScene())
    {
      const miniMap = SceneManager._scene.getMiniMap();
      if (miniMap)
      {
        miniMap.visible = false;
      }
    }

    // do not honor attempts to show while blocked.
    return;
  }

  if (shouldShow)
  {
    $gameSystem.showMinimap();
  }
  else
  {
    $gameSystem.hideMinimap();
  }

  // If we are currently on Scene_Map and have a minimap, update immediately.
  if (SceneManager._scene.isMapScene())
  {
    const miniMap = SceneManager._scene.getMiniMap();
    if (miniMap)
    {
      miniMap.visible = shouldShow;
    }
  }
});
//endregion plugin commands