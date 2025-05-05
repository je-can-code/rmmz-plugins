//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v2.2.0 BASE] The base class for all J plugins.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @help
 * ============================================================================
 * OVERVIEW
 * This is the base class that is required for basically ALL of J-* plugins.
 * Please be sure this is above all other J-* plugins, and keep it up to date!
 * ----------------------------------------------------------------------------
 * While this plugin doesn't do a whole lot all by itself, it contains a number
 * of centralized functionalities that are used by ALL of my plugins.
 * ----------------------------------------------------------------------------
 * If you are not a dev, you can stop reading if you want (or read on to learn
 * more about the code underneath).
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
 * ==============================================================================
 */