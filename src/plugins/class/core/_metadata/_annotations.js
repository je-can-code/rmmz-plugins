//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Unlockable classes, and a scene to review and change them.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-CMS
 * @orderAfter J-Base
 * @orderAfter J-Base-Save
 * @orderAfter J-CMS
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin gives every actor a set of classes they have unlocked, and a
 * scene where the player reviews those classes and, where the game allows it,
 * changes between them.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-CMS; the parameters are formatted through it, so a stat reads the
 *   same here as on the equip screen.
 * - J-Classes-Aptitude; adds each class's learnings beside the parameters,
 *   and each class's progress to the list.
 * - J-Classes-Natural; lists each class's natural growths beneath the
 *   parameters.
 * - J-LevelMaster; gives Max Tech a curve, so Max Tech gets a multiplier
 *   like any other parameter with one.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * An actor's class list shows every class they have unlocked, plus the class
 * they are wearing right now. Classes are unlocked for one actor at a time
 * with the "Unlock Classes" plugin command, and nothing ever locks one again.
 *
 * A class set aside for particular actors also shows in their lists before
 * they unlock it, as a dimmed "???" row that gives nothing away. See
 * UNLOCKABLE FOR ACTORS below.
 *
 * Whether the scene can change classes is decided by whatever opens it:
 * - The "Call Scene" plugin command says whether changing is allowed. This
 *   is how a game ties changing classes to a place or a moment: open the
 *   scene with changing allowed from there, and from nowhere else.
 * - The main menu's command only views, unless the "Menu Change Switch" is
 *   set and ON.
 * Opened without changing allowed, every class can still be browsed and
 *   read; confirming a class only buzzes.
 *
 * Changing classes keeps the actor's experience.
 *
 * ============================================================================
 * LAYOUT:
 * Beside the class list, everything about the highlighted class is shown at
 * once: its description across the top, then its parameters, with whatever
 * extensions list beneath them, and any window an extension places beside
 * them. There are no pages to cycle.
 *
 * DESCRIPTION:
 * RPG Maker's editor has no field for a class's description, so it is written
 * in the JMZ data editor, on the Classes board. A class without one leaves
 * the strip across the top blank.
 *
 * ICONS:
 * RPG Maker's editor has no field for a class's icon either, so it is chosen
 * in the JMZ data editor too. A class without one is drawn with the "Class
 * Icon" parameter's icon, and so is every "???" row.
 *
 * PARAMETERS:
 * Every class lists the same fifteen parameters, in the same order, so a row
 * never moves as the cursor goes from class to class: the resources (Max
 * Life, Max Magi, Max Tech), the six core stats (attack, magic attack,
 * defense, magic defense, agility, luck), then Accuracy, Parry, Crit Rate,
 * Crit Dodge, Physical Evasion and Magic Evasion. A growth section an
 * extension lists beneath reads in the same order.
 *
 * For any other class, a parameter changing into it would move reads what it
 * would become and by how much, green when the change is good for the actor
 * and red when it is bad. One it would leave alone reads as it stands, in
 * white. For the class the actor is already in, nothing would change, so
 * every parameter reads as it stands. Every value is padded with zeroes, the
 * way the equip screen pads a value as it stands.
 *
 * Every value is raw: the actor without their equipment. The class's curve
 * and buffs, the actor's own growth and their passives all count, and gear
 * does not, since a class that cannot wear what is equipped takes it off the
 * moment it is changed into.
 *
 * Each parameter reads across four columns, so the numbers line up from row
 * to row: its name, the class's multiplier, its value, and its change.
 *  Max Life   ×0.80   1674   (-419)
 *
 * The multiplier is how a class's growth curve scales a parameter: the
 * class's curve over the curve of the class the actor started the game in,
 * measured at level 99. A class authored as the starting class's curve times
 * some number shows exactly that number, and a curve times one reads ×1.00,
 * the class leaving the parameter alone. The starting class is the Class set
 * on the actor's own database entry.
 *
 * RPG Maker gives Max Tech no curve. Under J-LevelMaster, a class's
 * <mtpGrowthCurve> tag is its Max Tech curve, and is measured the same way.
 *
 * J-Classes only knows curves. An extension can measure other parameters
 * the same way: J-Classes-Natural measures a parameter with no curve by what
 * the class buffs it by while worn.
 *
 * A class that grants passive states through a <passive> tag is previewed
 * without them.
 *
 * ============================================================================
 * UNLOCKABLE FOR ACTORS
 * Want a class only certain actors can ever unlock, like a job one character
 * grows into and nobody else does? By applying the appropriate tag to the
 * class, you can set it aside for the actors it lists.
 *
 * It unlocks only for them: an "Unlock Classes" command naming any other
 * actor is refused, with a warning in the console. Until one of those actors
 * unlocks it, the class waits in their list as a dimmed "???" row, with no
 * name, icon or details, and confirming it buzzes. Every other actor never
 * sees it at all.
 *
 * A class without the tag is open to anyone, and stays out of every list
 * until it is unlocked.
 *
 * TAG USAGE:
 * - Classes
 *
 * TAG FORMAT:
 *  <unlockableForActors:[ACTOR_ID, ACTOR_ID, ...]>
 *    Where each ACTOR_ID is an actor this class can be unlocked for.
 *
 * TAG EXAMPLES:
 *  <unlockableForActors:[1]>
 * Only actor 1 can unlock this class, and it waits in their list as "???"
 * until they do.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 *
 * @param parentConfig
 * @text SETUP
 *
 * @param menu-switch
 * @parent parentConfig
 * @type switch
 * @text Menu Switch ID
 * @desc When this switch is ON, the class command is visible in the menu. Leave at 0 to always show it.
 * @default 0
 *
 * @param menu-change-switch
 * @parent parentConfig
 * @type switch
 * @text Menu Change Switch ID
 * @desc When this switch is ON, the menu's class command can change classes. Leave at 0 to only ever view.
 * @default 0
 *
 * @param command-name
 * @parent parentConfig
 * @type string
 * @text Command Name
 * @desc The name of the class command in the menu.
 * @default Classes
 *
 * @param command-icon
 * @parent parentConfig
 * @type number
 * @text Command Icon
 * @desc The icon index of the class command in the menu.
 * @default 0
 *
 * @param class-icon
 * @parent parentConfig
 * @type number
 * @text Class Icon
 * @desc The icon index drawn beside a class without an icon of its own, and beside every "???" class.
 * @default 0
 *
 *
 * @command call-scene
 * @text Call Scene
 * @desc Opens the class scene for the party, either to change classes or only to review them.
 * @arg allowChanging
 * @type boolean
 * @text Allow Changing
 * @desc Whether confirming a class changes the actor into it. When false, the scene only views.
 * @default true
 *
 * @command unlock-classes
 * @text Unlock Classes
 * @desc Unlocks classes for an actor, making them selectable in the class scene. Repeating an unlock does nothing.
 * @arg actorId
 * @type actor
 * @text Actor
 * @desc The actor the classes are unlocked for.
 * @default 1
 * @arg classIds
 * @type class[]
 * @text Classes
 * @desc The classes to unlock.
 * @default []
 */
//endregion annotations