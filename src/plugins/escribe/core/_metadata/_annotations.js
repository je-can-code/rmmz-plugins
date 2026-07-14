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
*/