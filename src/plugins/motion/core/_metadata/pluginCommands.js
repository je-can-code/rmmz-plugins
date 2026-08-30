//region plugin commands
import MotionTagParser from '../core/MotionTagParser.js';
import MotionTargetResolver from '../core/MotionTargetResolver.js';
import CharacterMotionComposer from '../managers/CharacterMotionComposer.js';

/**
 * Applies a motion to a character for a while, or forever.
 *
 * There are two commands rather than one per motion because the tag grammar already says what a
 * motion is; a command only has to say who it happens to and for how long.
 */
PluginManager.registerCommand(J.MOTION.Metadata.name, 'applyMotion', function(args)
{
  const { target, targetId, motion, sourceKey, duration } = args;

  // every plugin command argument arrives as a string regardless of its declared type.
  const parsedTargetId = Number.parseInt(targetId, 10);
  const parsedDuration = Number.parseInt(duration, 10);
  const resolvedSourceKey = sourceKey || 'command';
  const character = MotionTargetResolver.resolve(target, parsedTargetId, this);

  if (!character)
  {
    Diagnostics.warn(__PLUGIN_NAME__, 'apply motion could not find its target', { target, targetId });

    return;
  }

  const declaration = MotionTagParser.parsePayload(`[${motion}]`, resolvedSourceKey);

  // the motion itself was malformed, and the parser has already said so in detail.
  if (declaration === null) return;

  const expiryFrames = Number.isFinite(parsedDuration)
    ? parsedDuration
    : 0;

  CharacterMotionComposer.declare(character, resolvedSourceKey, [ declaration ], expiryFrames);
});

/**
 * Withdraws whatever a source had applied to a character.
 */
PluginManager.registerCommand(J.MOTION.Metadata.name, 'removeMotion', function(args)
{
  const { target, targetId, sourceKey } = args;

  const parsedTargetId = Number.parseInt(targetId, 10);
  const resolvedSourceKey = sourceKey || 'command';
  const character = MotionTargetResolver.resolve(target, parsedTargetId, this);

  if (!character)
  {
    Diagnostics.warn(__PLUGIN_NAME__, 'remove motion could not find its target', { target, targetId });

    return;
  }

  CharacterMotionComposer.removeDeclarations(character, resolvedSourceKey);
});
//endregion plugin commands