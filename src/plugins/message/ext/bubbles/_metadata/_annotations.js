//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] A J-Message extension that floats messages above whoever is speaking.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-Message
 * @orderAfter J-Base
 * @orderAfter J-Message
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin lets a message float above the character saying it, drawn as a
 * bubble rather than shown in the box at the edge of the screen.
 *
 * The bubble is drawn at runtime rather than assembled from a windowskin, so
 * it is sized to the text actually in it, and the speaker's name sits inline
 * in the bubble's own border rather than in a separate plate above it.
 *
 * Messages that name no target are not left out: they are drawn as the same
 * panel, without a tail, at whichever of top/middle/bottom the Show Text
 * command already asked for.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-Message; the glyphs in a bubble are its glyphs.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * Line breaks are the author's, always. A long line makes a wide bubble; this
 * plugin will never re-break a line to make it fit something.
 *
 * ============================================================================
 * NAMING WHO IS SPEAKING:
 * Put the text code below anywhere in a Show Text command, and the message
 * floats above the target it names instead of appearing in the message box.
 * The code itself is removed before the message is drawn.
 *
 * TEXT CODE FORMAT:
 *  \pop[TARGET]
 *    Where TARGET is one of the forms in the table below.
 *
 * TEXT CODE EXAMPLES:
 *  \pop[self]
 * The message floats above the event running this command.
 *
 *  \pop[player]
 * The message floats above the player.
 *
 *  \pop[e12]
 * The message floats above event 12 of the current map.
 *
 *  \pop[a1]
 * The message floats above actor 1, wherever that actor is walking- as the
 * player if they are leading the party, or as the follower they currently are.
 * If that actor is not marching with the party at all, no bubble is drawn.
 *
 *  \pop[f2]
 * The message floats above the second follower behind the player.
 *
 *  \pop[320,180]
 * The message floats at a fixed point on screen, and does not follow anyone.
 *
 * A target naming nothing that exists- a deleted event, an actor sitting in
 * reserve, a form with a typo in it- draws no bubble, and the message appears
 * as an ordinary panel instead.
 * ============================================================================
 * CONVERSATIONS:
 * A bubble does not disappear the moment its message closes. It stays where it
 * is, dimmed and frozen, until the conversation is declared over- so two
 * characters trading lines both stay on screen and a player who blinks does not
 * lose half of an exchange.
 *
 * A speaker who talks again replaces their own bubble rather than stacking a
 * second one, so a character delivering four lines in a row leaves one behind.
 *
 * Use the End Conversation plugin command when the scene is finished. Changing
 * map, entering a battle and opening the menu all end one too, because the
 * characters those bubbles were pointing at have stopped existing.
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 *
 * @command end-conversation
 * @text End Conversation
 * @desc Clears every bubble left behind by the characters who just spoke.
 */
//endregion annotations