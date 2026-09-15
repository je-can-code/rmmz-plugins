//region plugin commands
import LightingTagParser from '../core/LightingTagParser.js';
import MapAmbientCoordinator from '../managers/MapAmbientCoordinator.js';
import ScreenLightingComposer from '../managers/ScreenLightingComposer.js';

/**
 * Darkens the scene for as long as the command source holds it.
 *
 * A cutscene wanting the lights to go out has nowhere else to say so: the map's own darkness is what
 * the place is like ordinarily, and overwriting it would mean remembering to put it back. Declaring
 * under a separate source means the map's ambient is still there underneath, still compounding, and
 * still exactly what the room returns to when this is withdrawn.
 */
PluginManager.registerCommand(J.LIGHTING.Metadata.name, 'applyAmbient', args =>
{
  const { darkness, color } = args;

  // every plugin command argument arrives as a string regardless of its declared type.
  const payload = color
    ? `[${darkness}, ${color}]`
    : `[${darkness}]`;

  const declaration = LightingTagParser.parseAmbientPayload(payload, 'command');

  // the arguments did not describe an ambient, and the parser has already said so in detail.
  if (declaration === null) return;

  ScreenLightingComposer.declareAmbient('command', declaration);
});

/**
 * Withdraws whatever darkness a plugin command had applied.
 */
PluginManager.registerCommand(J.LIGHTING.Metadata.name, 'removeAmbient', () =>
{
  ScreenLightingComposer.removeDeclarations('command');
});

/**
 * Turns the lights on in a place the map itself calls dark.
 *
 * Withdrawing the map's own darkness rather than declaring brightness over the top of it is the only
 * thing that works: darkness compounds, so a command asking for none of it would compound to exactly
 * the darkness already there.
 */
PluginManager.registerCommand(J.LIGHTING.Metadata.name, 'lightsOn', () =>
{
  MapAmbientCoordinator.suppress();
});

/**
 * Gives a place its own darkness back after the lights were turned on.
 */
PluginManager.registerCommand(J.LIGHTING.Metadata.name, 'lightsOff', () =>
{
  MapAmbientCoordinator.refresh();
});
//endregion plugin commands