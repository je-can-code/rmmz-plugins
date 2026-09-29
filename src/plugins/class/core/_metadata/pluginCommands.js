//region plugin commands
import Scene_Classes from '../scenes/Scene_Classes.js';

/**
 * Opens the class scene, either to change classes or only to look at them.
 *
 * This is how a game decides where classes change: open the scene with changing allowed from wherever
 * that should happen, and from nowhere else.
 */
PluginManager.registerCommand(J.CLASS.Metadata.name, 'call-scene', ({ allowChanging }) =>
{
  // every plugin command argument arrives as a string, booleans included.
  const isChangingAllowed = allowChanging === 'true';

  Scene_Classes.callScene(isChangingAllowed);
});

/**
 * Unlocks one or more classes for an actor, making them selectable in the class scene.
 */
PluginManager.registerCommand(J.CLASS.Metadata.name, 'unlock-classes', ({ actorId, classIds }) =>
{
  // resolve the actor the classes are unlocked for.
  const actor = $gameActors.actor(parseInt(actorId));

  // the editor hands a list of classes over as a JSON array of stringy ids.
  const parsedClassIds = JSON.parse(classIds);

  // unlock every class named, in the order they were listed.
  parsedClassIds.forEach(classId => actor.unlockClass(parseInt(classId)));
});
//endregion plugin commands