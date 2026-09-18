//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] The day and night cycle, as colour and as darkness.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-Lighting
 * @base J-TIME
 * @orderAfter J-Base
 * @orderAfter J-Lighting
 * @orderAfter J-TIME
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin makes the sky change with the clock.
 *
 * J-TIME knows what hour it is. J-Lighting owns what the screen looks like.
 * This is the piece in between: it decides what a given hour LOOKS like, and
 * declares that to the lighting system.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-Lighting; this is an extension of it.
 * - J-TIME; this is where the hour comes from.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * The day is six four-hour phases, each fading into the next across its own
 * four hours. Every phase says two things: what colour the light is, and how
 * much of it there is.
 *
 * Those are genuinely different tools. Colour is a tint over everything and
 * cannot have holes in it. Darkness is a mask that a torch can cut through.
 * Night used to be written entirely in colour, because colour was all there
 * was- which is why it read as "the world turned blue" rather than "you
 * cannot see". With both available, night can be dark AND cool rather than
 * having to fake one with the other.
 *
 * ----------------------------------------------------------------------------
 * WHAT THIS SHIPS WITH:
 * The colour curve is exactly what J-TIME used before this plugin existed,
 * value for value. The darkness curve ships at ZERO for every phase.
 *
 * That is deliberate. Installing this changes nothing about how the game
 * looks until somebody decides what night's darkness should be. The migration
 * is invisible; the art decision is separate, and it is yours.
 *
 * ============================================================================
 * CONFIGURATION:
 * The whole curve lives in `data/config.lighting-time.json`, so retuning what
 * night looks like is a data edit rather than a rebuild.
 *
 *  phases.<name>.tone      the [r, g, b, grey] that phase settles on
 *  phases.<name>.darkness  how much light it takes away, 0 through 1
 *  sequence                the phases in the order a day cycles through them
 *
 * The sequence lists the same phase at both ends on purpose. A day opens
 * partway through the fade INTO its first phase and closes having just
 * arrived back at it, so listing it twice lets one lookup serve every hour
 * with no wraparound special case.
 *
 * ============================================================================
 * MAPS WITHOUT A SKY:
 * A map tagged `<noToneChange>` opts out of all of this- an interior, a cave,
 * anywhere the sky is not visible. On such a map this plugin declares nothing
 * at all rather than declaring "neutral".
 *
 * That distinction matters. Declaring neutral would wipe out a tint an event
 * deliberately applied to an interior. Declaring nothing leaves whatever else
 * has a claim on the screen exactly where it is.
 *
 * `<noToneChange>` is about the SKY. It has nothing to do with J-Lighting's
 * `<ambient:...>`, and a cave usually wants both: no sky, and its own dark.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.1
 *    The sky is now right on the first frame after a save load, a transfer or a
 *    closed menu, rather than spending five seconds fading in from daylight.
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 *
 * @command lockTone
 * @text Freeze The Sky
 * @desc Stops the sky changing with the clock. The clock itself keeps running.
 *
 *
 * @command unlockTone
 * @text Unfreeze The Sky
 * @desc Lets the sky resume following the clock.
 */
//endregion annotations