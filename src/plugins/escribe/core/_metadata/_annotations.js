//region Introduction
/*:
 * @target MZ
 * @plugindesc [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Enables "describing" the event with some text and/or an icon.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @help
 * ============================================================================
 * This plugin allows the functionality to have events with text and/or icons
 * over them. These can also be only visible when the player is within a
 * specified distance from the event.
 *
 * In order to utilize this functionality, add a comment to an event with one
 * of the following tags below to create text/icons that show up on the event:
 *
 * <text:EVENT_TEXT>
 * Where EVENT_TEXT is whatever text you want to show on this event.
 *
 * <icon:ICON_INDEX>
 * Where ICON_INDEX is the icon index of the icon to show on this event.
 *
 * <proximityText:DISTANCE>
 * Where DISTANCE is the distance in tiles/squares that the player must be
 * within in order to see the text on this event. DISTANCE is required- to
 * require the player stand directly on the event, use <proximityText:0>
 * explicitly.
 *
 * <proximityIcon:DISTANCE>
 * Where DISTANCE is the distance in tiles/squares that the player must be
 * within in order to see the icon on this event. DISTANCE is required- to
 * require the player stand directly on the event, use <proximityIcon:0>
 * explicitly.
 * ============================================================================
 * NOTE:
 * Proximity tags are optional. If they are not added to the event alongside
 * the text or icon tag, then the text/icon will always be visible while the
 * event is visible on the map.
 * ============================================================================
 * CHANGELOG:
 * - 1.1.0
 *    Every <text> tag on a page is now its own line, reading top to bottom,
 *    where previously a second tag silently overwrote the first. RMMZ already
 *    stores a comment box as one command per line, so several tags in one box
 *    is the shape the data was in. The lines of a block share one
 *    proximityText, and an icon rides above the whole block rather than above
 *    the first line, so adding a line lifts the icon with it.
 *    Text and icons became one kind-tagged escription internally. They were the
 *    same feature written twice at every layer, and an event now holds a list
 *    of them so parsing, proximity, sprite construction, positioning and fading
 *    each happen once in a loop. The flag-and-acknowledge handshake between
 *    event and sprite is gone; the sprite compares what the character declares
 *    against what it last built from, which cannot desync.
 *    Fixed four unreachable opacity branches and two fade terminal checks that
 *    compared for equality against a value floating-point drift could step past.
 * - 1.0.2
 *    Text escriptions are now horizontally centered on their event. The map
 *    coordinate was being added into a pixel offset, drifting every label one
 *    pixel to the right per tile from the left edge of the map.
 *    Escription height is now measured from the character sprite instead of
 *    being picked from the sheet's "$" prefix, which is a single-character
 *    marker rather than a tall-character one. Small "$" sheets floated their
 *    labels far too high, and sheets taller than 96 pixels wore theirs inside
 *    the sprite. Sheets 48 and 96 pixels tall are unaffected.
 *    <proximityText:DISTANCE> now fades its text in. It was being gated on the
 *    icon's proximity, so an event with proximity text and no icon never
 *    showed the text at all.
 * - 1.0.1
 *    <proximityText>/<proximityIcon> now require an explicit DISTANCE; the
 *    no-argument form (implicit distance 0) is no longer supported- use
 *    <proximityText:0>/<proximityIcon:0> instead.
 *    Removed a dead constructor-type check against Game_Event that was
 *    already unreachable behind an equivalent isEvent() check.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
*/