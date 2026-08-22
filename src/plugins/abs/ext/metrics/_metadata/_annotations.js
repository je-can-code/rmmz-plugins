//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Records JABS combat activity into game variables.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-ABS-InputManager
 * @help
 * ============================================================================
 * OVERVIEW
 * J-ABS-Metrics quietly keeps score. It hooks the moments JABS already
 * announces- a battler died, a skill effect landed, an action was executed-
 * and files what happened into game variables.
 *
 * Nothing in this plugin changes gameplay. It only observes.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-ABS; every metric here is a JABS event.
 * - J-ABS-InputManager; defines the slots that skill usage is bucketed by.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * Variables are the right home for this despite being clumsy storage, because
 * variables are the one thing the event editor, the message window, and every
 * conditional branch in the game can already read. A trophy that unlocks at
 * "1000 enemies defeated" is a single event page against a variable this plugin
 * maintains, with nothing else to write.
 *
 * The metrics divide into three shapes, and knowing which is which is the
 * difference between a number that means something and a number that does not:
 *
 * - RUNNING TOTALS only ever grow (total damage dealt, enemies defeated).
 * - PERSONAL BESTS keep the largest value ever seen (biggest crit landed).
 * - COUNTS tally occurrences (number of parries, mainhand skill usage).
 *
 * ============================================================================
 * REQUIRED EXTERNAL CONFIGURATION
 * J-ABS-Metrics has NO plugin parameters. Which variable holds which metric is
 * declared in the external JABS configuration file at `data/config.jabs.json`,
 * under a top-level `metrics` block. The plugin THROWS at startup when the
 * block is missing.
 *
 * A variableId is a bare number that means nothing on its own, and seventeen of
 * them in a plugin parameter panel is seventeen opportunities to point two
 * metrics at the same variable and never find out. In the config file they sit
 * beside the rest of the JABS setup, in a file that diffs.
 *
 * Required shape (all seventeen keys required):
 *
 *   {
 *     "teams": [ ... ],
 *     "metrics": {
 *       "enemiesDefeated":        101,
 *       "destructiblesDestroyed": 102,
 *       "totalDamageDealt":       103,
 *       "highestDamageDealt":     104,
 *       "numberOfCritsDealt":     105,
 *       "biggestCritDealt":       106,
 *       "numberOfParries":        107,
 *       "numberOfPreciseParries": 108,
 *       "totalDamageTaken":       109,
 *       "highestDamageTaken":     110,
 *       "numberOfCritsTaken":     111,
 *       "biggestCritTaken":       112,
 *       "mainhandSkillUsage":     113,
 *       "offhandSkillUsage":      114,
 *       "assignedSkillUsage":     115,
 *       "dodgeSkillUsage":        116,
 *       "numberOfDeaths":         117
 *     }
 *   }
 *
 * ============================================================================
 * WHAT COUNTS AS WHAT:
 *
 * ENEMIES DEFEATED vs DESTRUCTIBLES DESTROYED:
 * A battler flagged inanimate- a tree, an ore deposit, a crate- files under
 * destructibles. Everything else files under enemies. Keeping them apart means
 * an hour spent harvesting does not read as an hour spent fighting.
 *
 * TOOLS ARE NOT ATTACKS:
 * Anything executed from the tool slot is skipped entirely for damage tracking.
 * A thrown bomb is inventory usage, not swordsmanship, and folding it into the
 * damage tallies would make them describe something the player did not do.
 *
 * PARRIES ARE COUNTED ONLY WHEN NOTHING LANDED:
 * A parry that still let damage through is recorded as damage taken, not as a
 * parry. Precise parries increment both the parry tally and the precise tally,
 * because a precise parry is a parry that also cleared a tighter bar.
 *
 * SKILL USAGE IS THE PLAYER ONLY:
 * Allies and enemies swinging weapons do not move these numbers. Mainhand and
 * offhand each get their own count; the four assignable combat slots share one,
 * because "which of my equipped skills was it" is a question no trophy asks.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 */
//endregion annotations