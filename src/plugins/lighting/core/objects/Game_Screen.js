//region Game_Screen
import ScreenLightingComposer from '../managers/ScreenLightingComposer.js';
import ToneDeclaration from '../models/ToneDeclaration.js';

/**
 * Extends {@link #startTint}.<br/>
 * Declares the requested tone to the composer under the `command` source.
 *
 * This is the door every tint in the game comes through. An event's Tint Screen command is literally
 * `$gameScreen.startTint(params[0], params[1])`, and a script call is the same method by another
 * name, so aliasing here catches every cutscene, every plugin and every hand-written call without
 * any of them needing to know this plugin exists.
 *
 * The original logic still runs, so `$gameScreen` keeps behaving exactly as the engine designed. It
 * simply stops being the only voice deciding what reaches the screen.
 */
J.LIGHTING.Aliased.Game_Screen.set('startTint', Game_Screen.prototype.startTint);
Game_Screen.prototype.startTint = function(tone, duration)
{
  // perform original logic.
  J.LIGHTING.Aliased.Game_Screen.get('startTint')
    .call(this, tone, duration);

  // hand the request over as a declaration rather than letting it paint directly.
  this.declareLightingTone(tone, duration);
};

/**
 * Passes a requested screen tone to the lighting composer.
 *
 * The arguments are used rather than the fields the engine just wrote them into, and that is the
 * whole trick: what arrives here is a *destination*, which is what a declaration must carry. Reading
 * the live tone instead would mean composing against an interpolation that matches nobody's intent
 * partway through a fade, and the screen would lurch toward a colour no source ever asked for.
 * @param {[number, number, number, number]} tone The tone being travelled toward.
 * @param {number} duration How many frames the journey should take.
 */
Game_Screen.prototype.declareLightingTone = function(tone, duration)
{
  const declaration = new ToneDeclaration(tone, duration, 'command');

  ScreenLightingComposer.declareTone('command', declaration);
};

/**
 * Overrides {@link #tone}.<br/>
 * Reports the tone every source composed together, rather than only the last one to write.
 *
 * This is where the composed colour actually reaches the screen, and it reaches it by answering the
 * question the engine was already asking: `Spriteset_Base#updateBaseFilters` reads this every frame
 * and hands the answer to the colour filter on the base sprite. Answering here rather than reaching
 * into that filter directly means battle is covered by the same three lines as the map, since
 * `Spriteset_Battle` inherits the very same method.
 *
 * The engine's own interpolation underneath is untouched and still runs; it simply is not what gets
 * painted any more. That matters for an event that tints and then transfers - the engine has always
 * let a tint outlive a map change, nothing clears it on the way through, and a cutscene that expects
 * its red to follow the player through a door still gets exactly that.
 * @returns {[number, number, number, number]}
 */
Game_Screen.prototype.tone = function()
{
  const composition = ScreenLightingComposer.compose();

  return composition.tone();
};
//endregion Game_Screen