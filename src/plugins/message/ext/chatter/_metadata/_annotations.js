//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] A J-Message extension that gives idle NPCs something to say.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-Message
 * @base J-Message-Bubbles
 * @orderAfter J-Base
 * @orderAfter J-Message
 * @orderAfter J-Message-Bubbles
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin lets characters talk to themselves as the player walks past.
 *
 * A civilian mutters about the weather; a shopkeeper tries to peddle his
 * goods. Nobody pressed a button and nothing was interrupted to make it
 * happen: chatter runs alongside whatever the player is doing, never blocks
 * the interpreter, and never takes the player's input.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-Message; a chatter line is laid out as that plugin's glyphs.
 * - J-Message-Bubbles; a chatter line is drawn as that plugin's bubble.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * Chatter is declared on an event page, which means it inherits that page's
 * conditions for free. A merchant who has closed up for the night is page two
 * with no chatter tags on it, and the muttering stops with the page.
 *
 * Chatter is silent- it plays no sound as it types itself out. A whole town
 * of blipping NPCs gets obnoxious fast.
 *
 * Line breaks are the author's, always. A chatter line is never re-wrapped.
 *
 * ============================================================================
 * GIVING A CHARACTER SOMETHING TO SAY:
 * Put a comment on the event page carrying this tag:
 *
 * TAG FORMAT:
 *  <chatter:LINE>
 *
 * TAG EXAMPLES:
 *  <chatter:Lovely weather, isn't it.>
 *  <chatter:Anything I can get you? Half price today.>
 * This character has two things they might say, and picks between them. The
 * same line is never said twice in a row.
 *
 * A line may not contain the < or > characters. A comment carrying either is
 * dropped before this plugin is ever offered it, and the result is a character
 * who simply says nothing. Everything else in ordinary prose is fine.
 * ============================================================================
 * TUNING ONE CHARACTER:
 * Every tag below is optional, and each overrides the project default for this
 * character only. Most chattering events will want none of them; an excitable
 * child or a bemoaning merchant might want one or two.
 *
 * TAG FORMAT:
 *  <chatterRadius:TILES>
 *  <chatterCooldown:FRAMES>
 *  <chatterDelay:FRAMES>
 *  <chatterDuration:FRAMES>
 *  <chatterSpeed:FRAMES>
 *  <chatterPosition:top|middle|bottom>
 *  <chatterBackground:window|dim|transparent>
 *
 * TAG EXAMPLES:
 *  <chatterRadius:5>
 * The player hears this character from up to five tiles away. Walls do not
 * enter into it; this is simply the distance between the two of them.
 *
 *  <chatterCooldown:600>
 * This character says nothing for ten seconds after finishing a line. The
 * clock starts when the line ends, never when it begins.
 *
 *  <chatterDelay:300>
 * This character waits somewhere between zero and five seconds before
 * speaking. The wait is rolled fresh every time, which is what keeps a row of
 * shopkeepers from speaking in lockstep. It only counts down while the player
 * is close enough to hear how it ends.
 *
 *  <chatterDuration:180>
 * A finished line stays on screen for three seconds. Counted from the moment
 * it finishes typing out, so a long line is readable for as long as a short
 * one.
 *
 *  <chatterSpeed:2>
 * A new character of the line appears every two frames. Zero shows the whole
 * line at once.
 *
 *  <chatterPosition:top>
 * The bubble floats above this character's head. Use bottom to hang it under
 * their feet instead, which is how two characters near each other avoid
 * stacking their bubbles in the same place. Middle behaves as top does.
 *
 *  <chatterBackground:dim>
 * This character's chatter is greyed and half see-through, the way a thought
 * is - so they read as muttering under their breath rather than speaking up.
 * The three words are the Show Text Background dropdown's own three; window
 * is the ordinary bubble and transparent leaves the words floating with no
 * backdrop at all.
 * ============================================================================
 * PROJECT DEFAULTS:
 * The defaults every character starts from live in the "chatter" section of
 * data/config.message.json, alongside the speaker profiles. A project that has
 * not written that section gets the plugin's own defaults, which are the
 * numbers used as examples above.
 * ============================================================================
 * WHEN CHATTER STOPS:
 * - The player walks out of earshot. The line is cut where it stands.
 * - A message opens above that character. Somebody you have started talking to
 *   stops muttering; everybody else carries on.
 * - An event takes the floor. A cutscene does not get heckled, and every idle
 *   line on the map is cut for the duration of it.
 * - The map changes.
 *
 * A line forced by the plugin command below ignores the first two - it is
 * heard from anywhere and it carries on through a cutscene, which is the
 * entire point of it. It is still cut by the map changing, and by a message
 * opening above that same character, because one character cannot be
 * muttering and speaking dialogue in the same place at the same time.
 *
 * Note that this is only ever about the character the message is on. A
 * forced line on somebody else carries on regardless - one character
 * thinking while another one talks needs nothing at all, whatever the two of
 * them are doing.
 *
 * For the same character, tick Keep During Dialogue on the command. That is
 * how one person holds a thought while saying something else out loud. It is
 * also the one case where the two bubbles share an anchor however much room
 * the scene has, so give them opposite sides - the thought at top and the
 * spoken line at bottom, or the reverse.
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 *
 * @command chatter-now
 * @text Chatter Now
 * @desc Makes a character say one specific line, ignoring radius, cooldown and any running event.
 *
 * @arg target
 * @type string
 * @text Target
 * @desc Who says it. Accepts self, player, eN for an event, aN for an actor, fN for a follower, or X,Y for a point.
 * @default self
 *
 * @arg text
 * @type string
 * @text Text
 * @desc What they say. Message text codes work here exactly as they do in a Show Text command.
 * @default
 *
 * @arg duration
 * @type string
 * @text Duration
 * @desc How many frames it stays up after it finishes typing out. Leave blank for this character's usual.
 * @default
 *
 * @arg position
 * @type select
 * @option
 * @option top
 * @option middle
 * @option bottom
 * @text Position
 * @desc Which side of the character it sits on. Leave blank for this character's usual.
 * @default
 *
 * @arg background
 * @type select
 * @option
 * @option window
 * @option dim
 * @option transparent
 * @text Background
 * @desc What it is drawn on, as the Show Text dropdown means it. Dim reads as a thought. Blank for the usual.
 * @default
 *
 * @arg persist
 * @type boolean
 * @text Keep During Dialogue
 * @desc Keep this line up even while a message opens above the same character. You decide where each one sits.
 * @default false
 */
//endregion annotations