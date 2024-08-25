//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v1.2.0 MESSAGE] Gives access to more message window functionality.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin grants additional message functionality.
 * - Adds new text codes for various database objects.
 * - Adds new conditionals for showing/hiding choices.
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
 *
 * Where ID is the id of the entry in the database.
 * Where SDP_KEY is the key of the panel.
 * Where QUEST_KEY is the key of the quest.
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