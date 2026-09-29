//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Shows each class's aptitude learnings in the class scene.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-Classes
 * @base J-Aptitude
 * @orderAfter J-Base
 * @orderAfter J-Classes
 * @orderAfter J-Aptitude
 * @orderAfter J-Aptitude-Typed
 * @orderAfter J-SkillSlots
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin connects J-Classes to J-Aptitude, for games whose classes teach
 * skills through <aptitude> tags.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-Classes; the class scene this adds to.
 * - J-Aptitude; the learnings this shows.
 * - J-Aptitude-Typed; typed learnings carry their badge here too.
 * - J-SkillSlots; the skills a class keeps known are listed too.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * The class scene gains a window beside the parameters, showing every skill
 * the highlighted class teaches and how far along the actor is with each.
 * Progress is kept per class whether or not it is being worn, so a class set
 * aside still shows how far along it got.
 *
 * With J-SkillSlots installed, the skills a class lists in <unslottedSkills>
 * are shown above them as "Always known": the skills the class keeps active
 * for as long as it is worn, like the weapon types it can equip.
 *
 * Each class in the list also shows how many of its skills have been learned,
 * as learned/total, and MASTERED in green once every one of them has. A "???"
 * class shows neither.
 *
 * ============================================================================
 * MASTERY:
 * A class is mastered once every skill it teaches has been learned, from that
 * class or any other. A class that teaches nothing is never mastered.
 *
 * Events can ask with a script call in a conditional branch:
 *  $gameActors.actor(1).isClassMastered(2)
 * This is true once actor 1 has learned everything class 2 teaches.
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 */
//endregion annotations