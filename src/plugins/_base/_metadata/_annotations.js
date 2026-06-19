//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] The base class for all J plugins.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @help
 * ============================================================================
 * OVERVIEW
 * This is the base class that is required for basically ALL of J-* plugins.
 * Please be sure this is above all other J-* plugins, and keep it up to date!
 * ----------------------------------------------------------------------------
 * ============================================================================
 * MAX ITEM QUANTITY:
 * Have you ever wanted to define a max quantity for items/weapons/armors in
 * the database? Like, not just 99? Well now you can! By applying the correct
 * tags to the relevant entries in the database, you too can have various fixed
 * and maximum item quantities.
 *
 * NOTE ABOUT FUNCTIONALITY PERMANENCE:
 * This max quantity stuff will likely get shifted to its own plugin eventually.
 *
 * TAG USAGE:
 * - Items
 * - Weapons
 * - Armors
 *
 * TAG FORMAT:
 *  <max:VALUE>
 *    Where VALUE represents the maximum quantity allowed for this item.
 *
 * TAG EXAMPLES:
 *  <max:15>
 * The maximum amount of the database entry decorated with this is 15.
 * ============================================================================
 * CUSTOM MAX TP:
 * Have you ever wanted to define a max value for TP instead of the default of
 * 100 across the board for all battlers?  Well now you can! By applying the
 * correct tags to the relevant entries in the database, you too can have
 * varying amounts of max tp for actors and enemies alike!.
 *
 * NOTE ABOUT COMBINING TAGS:
 * This is additive across the board, so if a single actor has multiple tags
 * from various equipment and/or states, all amounts of max tP will be summed
 * together.
 *
 * NOTE ABOUT NEGATIVES:
 * The tag value can be negative, so you can make "cursed" equipment or states
 * that reduce TP capabilities.
 *
 * TAG USAGE:
 * - Actors
 * - Classes
 * - Weapons
 * - Armors
 * - Enemies
 * - States
 *
 * TAG FORMAT:
 *  <maxTp:VALUE>
 *    Where VALUE represents the amount of max TP provided by the entry.
 *
 * TAG EXAMPLES:
 *  <maxTp:15>    (on actor)
 * The max TP for this battler would be 15.
 *
 *  <maxTp:25>    (on state)
 *  <maxTp:100>   (on weapon)
 *  <maxTp:50000> (on armor)
 * The max TP for this battler would be 50125 until the state wears off, then
 * it would reduce to 50100.
 *
 * ============================================================================
 * STATE TYPE CLASSIFIER:
 * Have you ever wanted to group states into named categories, like "poison" or
 * "bleed", so other plugins/tags can react to "any state of this category" instead
 * of a single hardcoded state id? Well now you can! By applying this tag to a
 * state's notebox, that state is classified under one or more named types.
 *
 * NOTE ABOUT MULTIPLE TAGS:
 * A single state may carry more than one <type:CLASSIFIER> tag, and will
 * belong to every classifier listed across all of its tags.
 *
 * NOTE ABOUT CASING:
 * Classifier strings are intended to be compared case-insensitively by
 * consumers of this tag (such as J-ABS's type-based damage bonus tags).
 *
 * TAG USAGE:
 * - States
 *
 * TAG FORMAT:
 *  <type:CLASSIFIER>
 *    Where CLASSIFIER is the name of the category this state belongs to.
 *
 * TAG EXAMPLES:
 *  <type:poison>
 *  <type:bleed>
 * This state is classified as both "poison" and "bleed".
 *
 * ============================================================================
 *
 * DEV DETAILS:
 * I would encourage you peruse the added functions to the various classes.
 * Many helper functions that probably should've existed were added, and coding
 * patterns that were used erratically are... less erratic now.
 * ----------------------------------------------------------------------------
 * DEV THINGS ADDED:
 * - many *-Manager type classes were added, and existing ones were extended.
 * - the concept of "long param" was utilized for iterating over parameters.
 * - "implemented" a class layer for many database objects.
 * - added various lifecycle hooks to battlers and states.
 * - rewrites the way items are managed and processed.
 * - adds a number of functions to retrieve data that was otherwise "private".
 * - adds an API for retrieving specific regex-based comments from an event.
 * - adds an API for getting all notes associated with given battlers.
 * - adds a few reusable sprites for convenience, like faces, icons, and text.
 * - adds a parent class for subclassing to strongly type plugin metadata.
 *
 * ============================================================================
 * CHANGELOG:
 * - 3.4.0
 *    Added Game_Action.formulaContextProviders registry and Game_Action.registerFormulaContext
 *    static method. Any plugin can now inject a named variable into damage formula evaluation
 *    by registering a getter; the variable is available in every formula evaluated by
 *    evalFormulaWithContext without any plugin needing to patch another plugin's code.
 *    Added Game_Action.prototype.evalFormulaWithContext(formula, a, b) — evaluates a formula
 *    string via new Function with the base context (a, b, v) plus all registered providers.
 *    This replaces all eval() usage in damage/formula paths; see each consumer's changelog.
 * - 3.3.0
 *    Added J.BASE.Resource enum (HP/MP/TP string keys).
 *    Added Game_Battler.prototype.onHeal(resource, amount) stub — a broadcast hook
 *    fired after any positive resource recovery. Extensions alias onHeal instead of
 *    the three gainHp/gainMp/gainTp methods individually.
 *    Aliased gainHp, gainMp, gainTp on Game_Battler to fire onHeal for positive values.
 * - 3.2.0
 *    Added skillIds() to Game_Battler (stub returning empty), Game_Actor (learned skills
 *    plus trait-granted ids, deduplicated), and Game_Enemy (action skill ids plus
 *    trait-granted ids, deduplicated). This gives the skill-extension resolver a raw-id
 *    source that is completely outside the skill()/skills() call path, eliminating the
 *    need for a re-entrancy guard and enabling intentional recursive overlay chains.
 * - 3.1.1
 *    RPG database wrappers expose createEmpty() on item, weapon, armor, skill,
 *    and state classes.
 *    Used when JAFTING reclaims dynamic refinement slots and in unit tests.
 * - 3.1.0
 *    Added TraitManager static class for centralized display of slip effects (name and icon
 *    based on value sign: damage vs regen).
 *    Extended TextManager with resource() for HP/MP/TP resource display names.
 *    Added traitsDeltaSum() helper on Game_BattlerBase.
 *    Overrode sparam, elementRate, paramRate, and stateRate to use additive delta stacking
 *    instead of multiplicative (traitsPi), with a floor of 0; xparam and attackStatesRate
 *    were already additive and are unchanged.
 *    Fixed RPG_Trait.textValue() for trait code 35: attack-skill now resolves via dataId
 *    instead of value.
 *    Fixed RPG_Trait.textValue() for xparam 0 (Accuracy) and sparam 1 (Parry) to display
 *    as flat integers rather than percentages, matching JABS usage.
 * - 3.0.1
 *    Fixed issue with RPGManager parsing arrays of notes.
 *    Added some arbitrary defaults for icon indices of types.
 * - 3.0.0
 *    Removed all legacy note-parsing logic from RPG_Base.
 *    Updated RPGManager to leverage WeakMap caching for parsed notes.
 * - 2.3.3
 *    Extended database object type-checking.
 *    Provided way for any database object to provide a unique identifier.
 *    Added gauge-drawing into the Window_Base class.
 *    Added API on Game_Actor and Game_Party for directly setting levels.
 *    Added Window_ActorRibbon for re-use.
 * - 2.3.2
 *    Added helper function to determine array intersections.
 *    Added prototype helper class for common prototype operations (unused).
 *    Added new RPGManager.getStringsFromNoteByRegex(...) helper function.
 *    Updated multiple ephemereal classes to be modern class syntax.
 * - 2.3.1
 *    Added flag for showing external file load info across plugins.
 *    Removed extraneous note tag enum-like object.
 *    Updated various custom sprites with additional helpful methods.
 * - 2.3.0
 *    Added base Max TP management with tags for battlers.
 *    Added helper functions for detecting plugin commands inside of events.
 *    Added helper function for converting horz/vert directions to a direction.
 *    Added helper functions for direction validation.
 * - 2.2.1
 *    Added dev filter function for action to skill mapping for enemies.
 * - 2.2.0
 *    Added parent class for subclassing to strongly type plugin metadata.
 *    Added Game_Character#isVehicle function.
 *    Added max item quantity functionality with tag.
 *    Added note grouping methods specific to actors/enemies.
 *    Added Window_Command updates to enable drawing faces as well.
 *    Updated Game_Timer to track elapsed time.
 * - 2.1.3
 *    Added help text functionality for window commands.
 *    Added description text for all parameters.
 * - 2.1.2
 *    Added polyfill implementation for Array.prototype.at().
 *    Updated Window_EquipItem code to enable extension.
 * - 2.1.1
 *    Lifted and shifted multiple functions out of my plugins into here.
 *    Added RPGManager class for helpful note parsing.
 *    Added numerous lifecycle hooks for battler data updating.
 * - 2.1.0
 *    Added wrapper objects for many database objects to ease plugin dev coding.
 *    Added "More data" window base class.
 *    Reverted the break-apart because that caused grief.
 *    Shuffled ownership of various functions.
 * - 2.0.0 (breaking change!)
 *    Broke apart the entire plugin into a collection of pieces, to leverage
 *    the new "plugin in a nested folder" functionality of RMMZ.
 * - 1.0.3
 *    Added "on-own-death" and "on-target-death" tag for battlers.
 *    Changed "retaliate" tag structure to allow a chance for triggering.
 * - 1.0.2
 *    Added an "IconManager" for consistent icon indexing between all my plugins.
 * - 1.0.1
 *    Updates for new models leveraged by the JAFTING system (refinement).
 *    All equipment now have a ._jafting property available on them.
 * - 1.0.0
 *    First proper actual release where I'm leveraging and enforcing versioning.
 * ============================================================================
 * @param actorBaseTp
 * @type number
 * @min 0
 * @text Actor Base TP Max
 * @desc The base TP for actors is this amount. Any formulai add onto this.
 * @default 0
 *
 * @param enemyBaseTp
 * @type number
 * @min 0
 * @text Enemy Base TP Max
 * @desc The base TP for enemies is this amount. Any formulai add onto this.
 * @default 100
 */