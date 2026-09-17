//region Introduction
/*:
 * @target MZ
 * @plugindesc [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Gives access to more message window functionality.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @orderAfter J-SDP
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin grants additional message functionality.
 * - Adds new text codes for various database objects.
 * - Adds new conditionals for showing/hiding choices.
 * - Adds text codes that animate the text itself.
 * - Gives each speaker their own voice and reading pace.
 *
 * ============================================================================
 * NEW TEXT CODES:
 * Have you ever wanted to be able to reference a particular entry in the
 * database without having to hardcode the name of the entry and the icon into
 * the message window? Well now you can! By adding the correct text codes into
 * your message windows (or in your plugins using .drawTextEx()), you too can
 * leverage entries from the database without any significant difficulty!
 *
 * NOTE:
 * All new text codes except \Enemy[ID] will also prepend their corresponding
 * icon as well. This is because enemies don't have icons assigned to them.
 *
 * NEW TEXT CODES AVAILABLE:
 *  From their own respectively named tabs
 *  \Weapon[ID]
 *  \Armor[ID]
 *  \Item[ID]
 *  \State[ID]
 *  \Skill[ID]
 *  \Enemy[ID]
 *
 *  From the "Types" tab:
 *  \element[ID]
 *  \equipType[ID]
 *  \weaponType[ID]
 *  \armorType[ID]
 *  \skillType[ID]
 *
 *  From mine other plugins:
 *  \sdp[SDP_KEY]
 *  \quest[QUEST_KEY]
 *  \param[PARAM_KEY]
 *
 * Where ID is the id of the entry in the database.
 * Where SDP_KEY is the key of the panel.
 * Where QUEST_KEY is the key of the quest.
 * Where PARAM_KEY is a registered J-Base ParameterRegistry key (e.g. "atk", "mcr", "hcr").
 * An unrecognized PARAM_KEY renders as an unmistakable "!!! UNKNOWN PARAM !!!" in red with a
 * question-mark icon instead of failing silently- this is always an authoring mistake, never a
 * legitimate zero/empty result.
 *
 * NEW TEXT CODES EXAMPLES:
 *  \Weapon[4]
 * The text of "\Weapon[4]" will be replaced with:
 * - the icon of the weapon matching id 4 in the database.
 * - the name of the weapon matching id 4 in the database.
 *
 *  \Skill[101]
 * The text of "\Skill[101]" will be replaced with:
 * - the icon of the skill matching id 101 in the database.
 * - the name of the skill matching id 101 in the database.
 *
 *  \param[atk]
 * The text of "\param[atk]" will be replaced with:
 * - the icon of the "atk" parameter from the ParameterRegistry.
 * - the label of the "atk" parameter from the ParameterRegistry.
 *
 *  \param[typo]
 * An unregistered key like "typo" will be replaced with a bright red
 * "!!! UNKNOWN PARAM !!!" and a question-mark icon instead of doing nothing.
 *
 * ============================================================================
 * NEW TEXT STYLES:
 * Have you ever wanted to be able to style your already amazing comic sans ms
 * font with italics or bold? Well now you can! By adding the correct text
 * codes into your message windows (or in your plugins using .drawTextEx()),
 * you too can flourish with italics and/or stand stoic with bold!
 *
 * NOTE:
 * The following styles act as 'toggles', in the sense that all characters that
 * are surrounded by the text codes of \_ or \* would be of their corresponding
 * style- italics or bold respectively. See the examples for clarity.
 *
 * NEW TEXT STYLES AVAILABLE:
 *  \_      (italics)
 *  \*      (bold)
 *
 * NEW TEXT STYLES EXAMPLES:
 *  "so it is \*gilbert\*. We finally meet \_at last\_."
 * In the passage above, the word "gilbert" would be bolded.
 * In the passage above, the words "at last" would be italicized.
 *
 * ============================================================================
 * ANIMATED TEXT
 * Bold and italics change how a letter is drawn. These change what it does
 * afterward- the letters of a message are individually animated objects, so
 * they can be made to move and change colour while they sit there.
 *
 * Like bold and italics, each of these is a toggle: the first one opens the
 * effect and the next one closes it again. An effect left open closes on its
 * own at the end of the page.
 *
 * ANIMATED TEXT CODES AVAILABLE:
 *  \~  the text rolls up and down like a wave
 *  \%  the text trembles in place
 *  \=  the text cycles through the colours of the rainbow
 *  \+  the text swells and settles again, like breathing
 *
 * The symbols are picked to look like what they do, so that a passage full of
 * them still reads: a tilde is a wave, a percent sign cannot make up its mind
 * whether it is going up or down, and a plus is something getting bigger.
 *
 * NOTE ON \+ AND EVENT COMMENTS:
 * Of the four, only \+ may appear inside an event comment tag. The others are
 * dropped by the comment parser before any plugin sees them, because ~, % and =
 * are not in the character set it accepts. This only matters for tags, not for
 * Show Text, where all four work everywhere.
 *
 * ANIMATED TEXT EXAMPLES:
 *  "whoa, that is \~incredible\~."
 * In the passage above, the word "incredible" would roll like a wave.
 *
 *  "d-did you \%hear\% that?"
 * In the passage above, the word "hear" would tremble.
 *
 *  "the door is \+locked\+."
 * In the passage above, the word "locked" would swell and settle.
 *
 * These stack with everything else, so \*\~shouting\~\* is both bold and
 * waving, and a colour code inside a wave keeps its colour while it moves.
 *
 * ============================================================================
 * COMBINING MESSAGES
 * A long speech is uncomfortable to author as a single Show Text command. The
 * editor offers four lines, the box holds four lines, and a paragraph broken
 * across several commands reaches the player as several boxes with a button
 * press between each one.
 *
 * The text code below welds a message onto the one written directly after it.
 * The two are revealed as a single message, in a single window that grows to
 * hold all of it. The code itself is removed before anything is drawn.
 *
 * TEXT CODE FORMAT:
 *  \more
 *
 * Put it anywhere in a Show Text command whose text should run on into the next
 * one. The end of the last line is the tidiest place; a line holding nothing
 * but the code leaves an empty line behind in the message.
 *
 * TEXT CODE EXAMPLES:
 *  Show Text: "I have been thinking about this for a while.\more"
 *  Show Text: "And I still do not know what to tell you."
 * Both lines appear together in one window, and the player presses the confirm
 * button once rather than twice.
 *
 *  Show Text: "First.\more"
 *  Show Text: "Second.\more"
 *  Show Text: "Third."
 * All three are welded into a single message. A chain runs for as long as each
 * message in it carries the code; the message that ends the chain does not.
 *
 * WHAT THE COMBINED MESSAGE LOOKS LIKE:
 * The first message of a chain decides everything about presentation- the face
 * image, the Name field, the Background and Position dropdowns, and the \pop
 * target if J-Message-Bubbles is installed. Every message welded onto it
 * contributes its text and nothing else.
 *
 * The window grows downward to fit, up to the height of the screen. A chain
 * that would outgrow the screen stops before the message that would overflow
 * it, and that message is shown as an ordinary separate message instead.
 *
 * A chain only ever reaches the Show Text command written immediately after it.
 * Anything sitting in between- a conditional branch closing, a set of choices,
 * the end of the page- ends the chain, whether or not more was asked for.
 *
 * ============================================================================
 * SPEAKER VOICES
 * Every message already knows who is speaking- either from the Name field of
 * the Show Text command, or from the face image it carries. That is enough to
 * give each character a voice of their own without editing a single line of
 * dialogue that has already been written.
 *
 * A speaker profile controls:
 *  - the sound that plays as their letters appear, and its pitch
 *  - how many letters pass between one of those sounds and the next
 *  - how long they linger on each letter
 *  - how long they pause on particular punctuation
 *  - effects that act on everything they say, with no text code needed
 *
 * Profiles are authored in "data/config.message.json". Unlike the other
 * configs in this suite, this one is optional: a project without it behaves
 * exactly as it did before, with every speaker on the engine's own pace and no
 * sound at all.
 *
 * The profile key is whatever literally sits in the Name field, which means a
 * message whose Name field reads "\N[1]" is keyed as "\N[1]" and NOT as the
 * actor's name. Messages with no Name field fall back to a key built from the
 * face image and its index, like "People2:3", so that eight characters sharing
 * one face sheet can still sound like eight different people.
 *
 * ============================================================================
 * NEW CHOICE CONDITIONALS
 * Have you ever wanted to be able to conditionally make choices appear based
 * on a situation like a switch or who the leader currently is? Well now you
 * can! By adding tags into the comments of your 'Show Choices' branches, you
 * too can have conditionally appearing choices in events!
 *
 * NOTE:
 * It is untested how well this functions with nested 'Show Choices' commands,
 * if it functions at all as-intended. It is recommended to avoid nesting the
 * switches.
 *
 * TAG USAGE:
 * - Event Commands - specifically in a 'Show Choices' branch/choice.
 *
 * TAG FORMAT:
 *  <leaderChoiceCondition:ACTOR_ID>
 *  <notLeaderChoiceCondition:ACTOR_ID>
 *    Where ACTOR_ID represents the id of the actor
 *    to condition this choice for.
 *
 * <switchOnChoiceCondition:SWITCH_ID>
 * <switchOffChoiceCondition:SWITCH_ID>
 *    Where SWITCH_ID represents the id of the switch
 *    to condition this choice for.
 *
 * TAG EXAMPLES:
 *  <leaderChoiceCondition:4>
 * The choice with this in its branch will be visible only while the actor of
 * ACTOR_ID 4 is the leader when this event gets triggered.
 *
 *  <notLeaderChoiceCondition:17>
 * The choice with this in its branch will be hidden only while the actor of
 * ACTOR_ID 17 is the leader when this event gets triggered.
 *
 *  <switchOnChoiceCondition:222>
 * The choice with this in its branch will be visible only while the switch of
 * SWITCH_ID 222 is ON when this event gets triggered.
 *
 *  <switchOffChoiceCondition:74>
 * The choice with this in its branch will be visible only while the switch of
 * SWITCH_ID 74 is OFF when this event gets triggered.
 *
 * ============================================================================
 * CHANGELOG:
 * - 2.1.0
 *    Added the \more text code, which welds a message onto the one written
 *    after it. The box grows to hold whatever they add up to.
 * - 2.0.0
 *    Renamed from J-MessageTextCodes. Update the entry in js/plugins.js and
 *    delete the old file; nothing else in a project has to change.
 *    Message text is now drawn as one sprite per character rather than baked
 *    into the window's bitmap, which is what lets a letter move after it has
 *    been drawn. Added \~ wave, \% jitter, \= rainbow and \+ pulse, which
 *    nest with each other and with the engine's own codes.
 *    Added speaker profiles, read from data/config.message.json and keyed by
 *    the Name field or the face. A profile carries a voice, a pace, per-
 *    punctuation beats and effects that act on everything that speaker says,
 *    so dialogue already written gains a character without being edited.
 *    Added layoutMessageGlyphs, which builds a message's glyphs before any of
 *    them are revealed - the only way something drawing a container around
 *    them can know its size on the frame it opens.
 *    Effects now declare how far they travel, so a container can reserve room
 *    for an effect it has never heard of.
 *    Added a named-section accessor for the external config, so an extension
 *    can read its own settings without opening the file a second time.
 *    A finished message now fades out over about half a second rather than
 *    blinking away. The engine's own close hides a window's client area on
 *    its first frame, so the text always left instantly no matter how long
 *    the frame took to collapse. Length is the "fade" section of the config.
 * - 1.3.1
 *    Fixed choice conditionals not hiding branches inside called common events.
 * - 1.3.0
 *    Added \param[PARAM_KEY] text code, pulling name/icon/color from the
 *    shared J-Base ParameterRegistry catalog. An unregistered key renders as
 *    a loud red "!!! UNKNOWN PARAM !!!" instead of failing silently.
 * - 1.2.1
 *    Added helper for applying text color to fragments.
 * - 1.2.0
 *    Embedded a modified version of HIME's choice conditionals into this.
 *      Said plugin was added and modified and extended for other purposes.
 *    Implemented questopedia text code format.
 *    Added basic choice conditionals for switches and leader for choices.
 * - 1.1.0
 *    Implemented element, the four "types" from database data.
 *    Added plugin dependency of J-Base.
 *    Implemented SDP panel text code format.
 * - 1.0.0
 *    Initial release.
 *    Implemented style toggles for bold and italics.
 *    Implemented weapon/armor/item/state/skill/enemy names from database data.
 * ============================================================================
 */