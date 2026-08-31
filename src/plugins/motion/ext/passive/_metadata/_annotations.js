//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Passive states can declare sprite motion.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @base J-Motion
 * @base J-Motion-ABS
 * @base J-Passive
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-Motion
 * @orderAfter J-Motion-ABS
 * @orderAfter J-Passive
 * @help
 * ============================================================================
 * OVERVIEW
 * J-Motion-ABS lets an APPLIED state declare a motion. This lets a PASSIVE one
 * do the same. It adds no tag and no parameter of its own- the whole plugin is
 * one more place the <motion:...> tag is honoured.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-ABS; a battler needs a presence on the map before it can be animated.
 * - J-Motion; this extension is meaningless without motion.
 * - J-Motion-ABS; the bridge between a battler and its character lives there.
 * - J-Passive; this extension is meaningless without passive states.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * WHY THIS IS A SEPARATE PLUGIN
 * An applied state announces its own arrival and departure, so J-Motion-ABS
 * animates one by listening. A passive announces neither. Passives are granted
 * by rebuilding the whole set from every source a battler owns- its own row,
 * its states, its skills, its equipment, the event that spawned it- and they
 * are refused by the ordinary state-adding path outright, so there is no
 * arrival to hear.
 *
 * This plugin therefore reconciles instead of listening: whenever that set is
 * rebuilt, it asks what the battler is carrying now and settles the difference.
 * That is a genuinely different mechanism, which is why it is a genuinely
 * different plugin rather than a few more lines in J-Motion-ABS.
 *
 * WHAT THAT BUYS YOU
 * Because it reconciles, it never goes stale:
 *
 * - An affix rolled onto an enemy at spawn animates from its first frame.
 * - A passive granted by a weapon starts and stops with the equipping.
 * - A passive that J-Passive-Conditional gates on and off mid-fight starts and
 *   stops the motion with the gate, without either plugin knowing about the
 *   other.
 * - Party cycling moves the leader's passive motions to whoever is leading now,
 *   rather than stranding them on the character the player drives.
 *
 * STACKS
 * A passive applied several times over animates once. Three stacks of the same
 * state are still one thing the sprite is doing, and animating it three times
 * would move the sprite three times as far as the tag asked for.
 *
 * ============================================================================
 * TAG FORMAT:
 * There is no tag of this plugin's own. Write J-Motion's:
 *
 *  <motion:[TYPE]>
 *  <motion:[TYPE, PARAM, ...]>
 *
 * TAG USAGE:
 * - States, when they are being granted as passives.
 *
 * TAG EXAMPLES:
 *  <motion:[scale,150]>
 * A creature carrying this passive is half again its usual size. Useful on an
 * affix, where the size IS the warning.
 *
 *  <motion:[throb,80,0,0,0,90]>
 * A creature carrying this passive pulses red, continuously, for as long as it
 * has the passive.
 *
 * ============================================================================
 * WHICH MOTION WINS:
 * When two sources want the same thing from a sprite- both want to scale it,
 * say- the more fleeting one wins, on the reasoning that the shorter something
 * lasts the more likely it is the thing the player is meant to be reading.
 *
 * From weakest to strongest: an event page's ambient motion, then a passive,
 * then an applied state, then a plugin command, then a combat reaction.
 *
 * So an elite's permanent swell is overridden by the flicker of it catching
 * fire, and returns when the fire goes out. Motions that want different things
 * do not contest at all and simply run together.
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 */
//endregion annotations