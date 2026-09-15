//region plugin commands
import JuiceIconResolver from '../core/JuiceIconResolver.js';
import JuiceHeldOverlayManager from '../managers/JuiceHeldOverlayManager.js';
import JuiceWeaponSwingOverlay from '../managers/JuiceWeaponSwingOverlay.js';
import JuiceWeaponSwingMotionEffect from '../models/JuiceWeaponSwingMotionEffect.js';
import JuiceMapSpriteFinder from '../helpers/JuiceMapSpriteFinder.js';

/**
 * Reads one numeric command argument, falling back when the field was left blank.
 *
 * `Number.parseInt` answers `NaN` for an empty string, and a `NaN` duration is the one that cannot
 * be shrugged off: the overlay's own progress is computed against it, `frame >= NaN` is false
 * forever, and a one-shot that never finishes is also never tracked by anything that could take it
 * down again. The fallbacks are the defaults each argument declares in `_annotations.js`.
 * @param {string} raw The argument as the command handed it over.
 * @param {number} fallback The value to use when the field held nothing usable.
 * @returns {number}
 */
const readNumber = (raw, fallback) =>
{
  const parsed = Number.parseInt(raw, 10);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
};

/**
 * Shows an icon over a character, either as a single motion or held until withdrawn.
 *
 * Everything a battler does with its own body is already addressable from an event page, because
 * those motions register with J-Motion and `applyMotion` can ask for any of them by name. The
 * overlay is the half that could not be: it is a sprite this plugin builds rather than a channel on
 * one the engine draws, so it has no declaration for `applyMotion` to make.
 *
 * `MotionTargetResolver` is reached as a global rather than imported: it ships inside J-Motion's
 * bundle, which is a declared `@base` and is hoisted long before this one loads.
 */
PluginManager.registerCommand(J.ABS.EXT.JUICE.Metadata.name, 'applyOverlay', function(args)
{
  const { target, targetId, iconSource, iconId, motion, duration, repeats, spanDegrees, hold, sourceKey } = args;

  // every plugin command argument arrives as a string regardless of its declared type.
  const parsedTargetId = Number.parseInt(targetId, 10);
  const parsedIconId = Number.parseInt(iconId, 10);
  const parsedDuration = readNumber(duration, 20);
  const parsedRepeats = readNumber(repeats, 1);
  const parsedSpanDegrees = readNumber(spanDegrees, 120);
  const isHeld = hold === 'true';
  const resolvedSourceKey = sourceKey || 'command';

  const character = MotionTargetResolver.resolve(target, parsedTargetId, this);

  if (!character)
  {
    Diagnostics.warn(__PLUGIN_NAME__, 'apply overlay could not find its target', { target, targetId });

    return;
  }

  // a preset that does not exist would otherwise fall through to the arc default and play something
  // nobody asked for, which reads as the command having been ignored.
  if (JuiceWeaponSwingMotionEffect.isKnownMotionType(motion) === false)
  {
    Diagnostics.warn(__PLUGIN_NAME__, `unknown overlay motion: [ ${motion} ]`, { motion, target });

    return;
  }

  const iconIndex = JuiceIconResolver.resolve(iconSource, parsedIconId);

  // held overlays are declared rather than drawn, and a sprite comes and collects them. that
  // indirection is the entire reason one survives the map scene being rebuilt around it.
  if (isHeld === true)
  {
    JuiceHeldOverlayManager.declare(
      character,
      resolvedSourceKey,
      iconIndex,
      motion,
      parsedDuration,
      parsedRepeats,
      parsedSpanDegrees
    );

    return;
  }

  const sprite = JuiceMapSpriteFinder.findSpriteCharacterFor(character);

  // a one-shot is drawn where it is asked for, so a character with no sprite on screen right now
  // has nowhere to draw it and no later moment worth saving it for.
  if (sprite === null)
  {
    Diagnostics.warn(__PLUGIN_NAME__, 'apply overlay found no sprite for its target', { target, targetId });

    return;
  }

  const facing = character.direction();

  JuiceWeaponSwingOverlay.playPreset(
    sprite,
    iconIndex,
    motion,
    parsedDuration,
    parsedRepeats,
    parsedSpanDegrees,
    facing
  );
});

/**
 * Takes down whatever a source was holding up on a character.
 *
 * Only reaches held overlays. A one-shot lasts a fraction of a second and takes itself down, so
 * there is never a moment when withdrawing one would mean anything.
 */
PluginManager.registerCommand(J.ABS.EXT.JUICE.Metadata.name, 'removeOverlay', function(args)
{
  const { target, targetId, sourceKey } = args;

  const parsedTargetId = Number.parseInt(targetId, 10);
  const resolvedSourceKey = sourceKey || 'command';
  const character = MotionTargetResolver.resolve(target, parsedTargetId, this);

  if (!character)
  {
    Diagnostics.warn(__PLUGIN_NAME__, 'remove overlay could not find its target', { target, targetId });

    return;
  }

  JuiceHeldOverlayManager.withdraw(character, resolvedSourceKey);
});
//endregion plugin commands