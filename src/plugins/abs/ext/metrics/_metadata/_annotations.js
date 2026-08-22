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
 * announces- a battler died, a skill effect landed, guard was raised, an item
 * was consumed- and files what happened into game variables.
 *
 * Nothing in this plugin changes gameplay. It only observes.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-ABS; every metric here is a JABS event.
 * - J-ABS-InputManager; defines the slots that usage is bucketed by.
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
 * difference between a number that means something and one that does not:
 *
 * - RUNNING TOTALS only ever grow (total damage dealt, damage prevented).
 * - PERSONAL BESTS keep the largest value ever seen (biggest crit landed).
 * - COUNTS tally occurrences (number of parries, guard activations).
 *
 * ============================================================================
 * REQUIRED EXTERNAL CONFIGURATION
 * J-ABS-Metrics has NO plugin parameters. Which variable holds which metric is
 * declared in the external JABS configuration file at `data/config.jabs.json`,
 * under a top-level `metrics` block. The plugin THROWS at startup when the
 * block is missing.
 *
 * A variableId is a bare number that means nothing on its own, and twenty-six
 * of them in a plugin parameter panel is twenty-six opportunities to point two
 * metrics at the same variable and never find out. In the config file they sit
 * beside the rest of the JABS setup, in a file that diffs.
 *
 * Required shape (all twenty-six keys required):
 *
 *   {
 *     "teams": [ ... ],
 *     "metrics": {
 *       "enemiesDefeated":           61,
 *       "destructiblesDestroyed":    62,
 *       "alliesDowned":              63,
 *       "numberOfDeaths":            64,
 *       "totalDamageDealt":          65,
 *       "highestDamageDealt":        66,
 *       "numberOfCritsDealt":        67,
 *       "biggestCritDealt":          68,
 *       "attacksEvadedByEnemies":    69,
 *       "totalDamageTaken":          70,
 *       "highestDamageTaken":        71,
 *       "numberOfCritsTaken":        72,
 *       "biggestCritTaken":          73,
 *       "numberOfParries":           74,
 *       "numberOfPreciseParries":    75,
 *       "numberOfGlancingBlows":     76,
 *       "numberOfGuardedHits":       77,
 *       "attacksEvadedByParty":      78,
 *       "damagePreventedByGuarding": 79,
 *       "mainhandSkillUsage":        80,
 *       "offhandSkillUsage":         81,
 *       "assignedSkillUsage":        82,
 *       "dodgeSkillUsage":           83,
 *       "guardActivations":          84,
 *       "toolUsage":                 85,
 *       "usableItemUsage":           86
 *     }
 *   }
 *
 * ============================================================================
 * WHO COUNTS:
 * Two rules, applied consistently.
 *
 * DEFENSIVE OUTCOMES ARE PARTY-WIDE. Damage taken, parries, glancing blows,
 * guarded hits, evasions and damage prevented all count for any actor, not only
 * the one being controlled. An ally soaking a hit soaked it; leaving them out
 * would make damage-taken and damage-prevented describe different populations
 * and stop being comparable to each other.
 *
 * INPUT METRICS ARE THE PLAYER ONLY. Slot usage, guard activations, dodges and
 * item usage count only what the person holding the controller did. Ally AI
 * raises guard on its own schedule, and folding that in would bury the one
 * number these exist to answer: what did the player actually reach for.
 *
 * ============================================================================
 * WHAT COUNTS AS WHAT:
 *
 * ENEMIES DEFEATED vs DESTRUCTIBLES DESTROYED:
 * A battler flagged inanimate- a tree, an ore deposit, a crate- files under
 * destructibles. Everything else files under enemies. Keeping them apart means
 * an hour spent harvesting does not read as an hour spent fighting.
 *
 * THE THREE DEFENSIVE OUTCOMES:
 * A hit that is fully negated is a PARRY. A hit that lands for reduced damage
 * because the defender rolled well is a GLANCING BLOW. A hit that never
 * connects because evasion beat accuracy is an EVASION. All three exist, and
 * all three are counted separately.
 *
 * PARRIES, PRECISE AND OTHERWISE:
 * A parry happens two ways- passively, when the defender's GRD overwhelms the
 * attacker's HIT, or deliberately, by holding guard inside the parry window.
 * Both produce the same outcome, so "number of parries" is the combined total,
 * and "number of precise parries" is the deliberate subset of it. The passive
 * count is the difference between the two and deliberately spends no variable
 * of its own- a stored figure that can disagree with its own operands is worse
 * than a subtraction performed when someone asks.
 *
 * ATTACKS EVADED, BOTH DIRECTIONS:
 * "By enemies" counts swings that an enemy slipped, which is a statement about
 * picking fights above one's level rather than about swinging at empty air.
 * "By party" counts incoming attacks the party slipped.
 *
 * DAMAGE PREVENTED BY GUARDING:
 * Measured as the difference between the hit before and after guard reduction,
 * at the one moment both figures exist. Healing runs through the same reduction
 * path as negative damage and is excluded, since "prevented" there would be a
 * number pointing the wrong way.
 *
 * ITEM USAGE IS COUNTED AT CONSUMPTION:
 * Not at the executed action, because an item only produces an action when it
 * carries a skill id- so a plain healing potion would never be counted at all.
 * Walking over loot travels the same path and is excluded: picking a potion up
 * is not using one.
 *
 * TOOLS ARE NOT ATTACKS:
 * Anything executed from the tool slot is skipped for damage tracking. A thrown
 * bomb is inventory usage, not swordsmanship, and folding it into the damage
 * tallies would make them describe something the player did not do.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 */
//endregion annotations