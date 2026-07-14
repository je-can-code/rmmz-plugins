//region annoations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Enable action poses for JABS.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin enables "action poses", or "character sprite animations" within
 * the JABS engine.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-ABS; allies and enemies will perform animations for various actions.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * A new functionality for "action poses" or "character sprite animations" is
 * now available by adding a variety of tags across the database. Mind you,
 * this will not animate your character sprites for you, under the hood it will
 * just swap out the regular character sprite defined in the database with
 * another for a given duration, and cycle through the stepping animation.
 *
 * ============================================================================
 * ACTION POSES:
 * Ever want to have your characters visually perform actions on the map when
 * doing things like attacking or casting a spell? Well now you can! By
 * applying the appropriate tags across the various database locations, you too
 * can have pseudo-animated character sprites when taking action!
 *
 * TAG USAGE:
 * - Skills
 * - Items
 *
 * TAG FORMAT:
 *    <poseSuffix:[SUFFIX,INDEX,DURATION]>
 *  Where SUFFIX is the suffix of the filename you want to swap out for.
 *  Where INDEX is the index in the character file to become.
 *  Where DURATION is the amount of frames to remain in this pose.
 *
 * TAG EXAMPLES:
 *    <poseSuffix:[-spell,0,25]>
 * As an example, if the character using the skill was a player with a
 * character sprite named "Actor1", the above tag would look for "Actor1-spell"
 * and swap to the 0th index (the upper left-most character) for 25 frames
 * (which is about a half second).
 *
 * WARNING:
 * This is not a highly tested feature of JABS and may not work as intended.
 * ============================================================================
 * CHANGELOG:
 * - 1.0.4
 *    `JABS_Battler` pose hooks aligned with J-ABS 4.10.0 dodge/guard battler updates.
 * - 1.0.3
 *    Raised minimum J-ABS version requirement to 4.7.0.
 * - 1.0.2
 *    Raised minimum J-ABS version requirement to 4.6.0.
 * - 1.0.1
 *    Consumed `RPGManager` update.
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 */
//endregion annotations