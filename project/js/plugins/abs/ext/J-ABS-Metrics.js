//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v1.0.0 ABS-METRICS] Records JABS combat activity into game variables.
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

//#region src/plugins/abs/ext/metrics/_metadata/_pluginMetadata.js
/**
* Plugin metadata for J-ABS-Metrics.
*
* Every value this plugin needs is a variableId, and a variableId is a primitive that means nothing
* on its own- which is exactly the kind of thing that belongs beside the rest of the JABS
* configuration rather than in a plugin parameter blob nobody can diff.
*/
var JAbsMetrics_PluginMetadata = class extends PluginMetadata {
	/**
	* Constructor.
	* @param {string} name The name of this plugin.
	* @param {string} version The semver-formatted version of this plugin.
	*/
	constructor(name, version) {
		super(name, version);
	}
	/**
	* Extends {@link #postInitialize}.<br/>
	* Loads the metrics block from the external JABS config.
	*/
	postInitialize() {
		super.postInitialize();
		this.initializeMetadata();
	}
	/**
	* Initializes the metadata associated with this plugin by reading the `metrics` block from
	* `config.jabs.json`. J-ABS parses that file while its own metadata is being published, and this
	* plugin is ordered after it, so the parsed root is guaranteed to be present by the time this runs.
	*/
	initializeMetadata() {
		const { metrics } = J.ABS.Metadata.ExternalConfig;
		/**
		* The variable counting how many animate enemies have been slain.
		* @type {number}
		*/
		this.enemiesDefeatedVariableId = metrics.enemiesDefeated;
		/**
		* The variable counting how many inanimate battlers- trees, ore, crates- have been broken.
		* Kept apart from the enemy tally so a player who spent an hour chopping shrubs does not read
		* as a player who spent an hour fighting.
		* @type {number}
		*/
		this.destructiblesDestroyedVariableId = metrics.destructiblesDestroyed;
		/**
		* The variable accumulating every point of hp damage the party has dealt.
		* @type {number}
		*/
		this.totalDamageDealtVariableId = metrics.totalDamageDealt;
		/**
		* The variable holding the largest single hit the party has ever landed.
		* @type {number}
		*/
		this.highestDamageDealtVariableId = metrics.highestDamageDealt;
		/**
		* The variable counting how many critical hits the party has landed.
		* @type {number}
		*/
		this.numberOfCritsDealtVariableId = metrics.numberOfCritsDealt;
		/**
		* The variable holding the largest single critical hit the party has ever landed.
		* @type {number}
		*/
		this.biggestCritDealtVariableId = metrics.biggestCritDealt;
		/**
		* The variable counting successful parries of any kind.
		* @type {number}
		*/
		this.numberOfParriesVariableId = metrics.numberOfParries;
		/**
		* The variable counting parries that landed inside the precise window.
		* A precise parry also counts toward the plain parry tally- this is a subset, not a sibling.
		* @type {number}
		*/
		this.numberOfPreciseParriesVariableId = metrics.numberOfPreciseParries;
		/**
		* The variable accumulating every point of hp damage the party has absorbed.
		* @type {number}
		*/
		this.totalDamageTakenVariableId = metrics.totalDamageTaken;
		/**
		* The variable holding the largest single hit the party has ever absorbed.
		* @type {number}
		*/
		this.highestDamageTakenVariableId = metrics.highestDamageTaken;
		/**
		* The variable counting how many critical hits have landed on the party.
		* @type {number}
		*/
		this.numberOfCritsTakenVariableId = metrics.numberOfCritsTaken;
		/**
		* The variable holding the largest single critical hit the party has ever absorbed.
		* @type {number}
		*/
		this.biggestCritTakenVariableId = metrics.biggestCritTaken;
		/**
		* The variable counting actions executed from the mainhand slot.
		* @type {number}
		*/
		this.mainhandSkillUsageVariableId = metrics.mainhandSkillUsage;
		/**
		* The variable counting actions executed from the offhand slot.
		* @type {number}
		*/
		this.offhandSkillUsageVariableId = metrics.offhandSkillUsage;
		/**
		* The variable counting actions executed from any of the four assignable combat slots.
		* @type {number}
		*/
		this.assignedSkillUsageVariableId = metrics.assignedSkillUsage;
		/**
		* The variable counting dodge skill activations.
		* @type {number}
		*/
		this.dodgeSkillUsageVariableId = metrics.dodgeSkillUsage;
		/**
		* The variable counting how many times the player has been defeated.
		* @type {number}
		*/
		this.numberOfDeathsVariableId = metrics.numberOfDeaths;
	}
};

//#endregion
//#region src/plugins/abs/ext/metrics/_metadata/initialization.js
/**
* The core where all of my extensions live: in the `J` object.
*/
globalThis.J ||= {};
/**
* The plugin umbrella that governs all things related to this plugin.
*/
J.ABS.EXT.METRICS = {};
/**
* The metadata associated with this plugin.
*/
J.ABS.EXT.METRICS.Metadata = new JAbsMetrics_PluginMetadata("J-ABS-Metrics", "1.0.0");
/**
* A collection of all aliased methods for this plugin.
*/
J.ABS.EXT.METRICS.Aliased = {};
J.ABS.EXT.METRICS.Aliased.JABS_Engine = new Map();

//#endregion
//#region src/plugins/abs/ext/metrics/managers/JABS_MetricsManager.js
/**
* A static manager that translates combat events into game variables.
*
* The engine hooks that feed this live in {@link JABS_Engine}, but the recording itself lives here so
* that "what counts as a critical hit" is answerable without standing up a battle. It also gives the
* variable writes a single choke point- every metric in the game flows through
* {@link JABS_MetricsManager.increment} or {@link JABS_MetricsManager.recordHighWaterMark}, so a
* question like "which of these is a running total and which is a personal best" is answered by
* looking at which helper the call used.
*/
var JABS_MetricsManager = class {
	/**
	* Constructor.
	* A static class though, so don't build it.
	*/
	constructor() {
		throw new Error("This is a static class.");
	}
	/**
	* Gets the metadata governing which variable holds which metric.
	* @returns {JAbsMetrics_PluginMetadata}
	*/
	static metadata() {
		return J.ABS.EXT.METRICS.Metadata;
	}
	/**
	* Adds an amount onto a running total held in a variable.
	* @param {number} variableId The variable holding the running total.
	* @param {number} amount The amount to add.
	*/
	static increment(variableId, amount) {
		J.BASE.Helpers.modVariable(variableId, amount);
	}
	/**
	* Records a candidate against a personal best, keeping whichever is larger.
	* @param {number} variableId The variable holding the personal best.
	* @param {number} candidate The value that may or may not be a new best.
	*/
	static recordHighWaterMark(variableId, candidate) {
		const currentBest = $gameVariables.value(variableId);
		if (candidate <= currentBest) return;
		$gameVariables.setValue(variableId, candidate);
	}
	/**
	* Records the defeat of a battler that was not the player.
	* @param {JABS_Battler} defeatedTarget The battler that was defeated.
	*/
	static trackDefeatedEnemy(defeatedTarget) {
		const metadata = this.metadata();
		if (defeatedTarget.isInanimate() === true) {
			this.increment(metadata.destructiblesDestroyedVariableId, 1);
			return;
		}
		this.increment(metadata.enemiesDefeatedVariableId, 1);
	}
	/**
	* Records the defeat of the player.
	*/
	static trackDefeatedPlayer() {
		this.increment(this.metadata().numberOfDeathsVariableId, 1);
	}
	/**
	* Records the outcome of a hit the party landed on an enemy.
	* @param {JABS_Battler} target The enemy that was struck.
	*/
	static trackAttackData(target) {
		const metadata = this.metadata();
		const { hpDamage, critical } = target.getBattler().result();
		if (hpDamage <= 0) return;
		this.increment(metadata.totalDamageDealtVariableId, hpDamage);
		this.recordHighWaterMark(metadata.highestDamageDealtVariableId, hpDamage);
		if (critical !== true) return;
		this.increment(metadata.numberOfCritsDealtVariableId, 1);
		this.recordHighWaterMark(metadata.biggestCritDealtVariableId, hpDamage);
	}
	/**
	* Records the outcome of a hit the party absorbed.
	* @param {JABS_Battler} target The ally that was struck.
	*/
	static trackDefensiveData(target) {
		const { hpDamage, critical, parried, preciseParried } = target.getBattler().result();
		if (hpDamage > 0) {
			this.trackDamageTaken(hpDamage, critical);
			return;
		}
		if (parried !== true) return;
		this.trackParry(preciseParried);
	}
	/**
	* Records a hit that got through the party's defenses.
	* @param {number} hpDamage The hp damage that landed.
	* @param {boolean} critical Whether or not the hit was a critical.
	*/
	static trackDamageTaken(hpDamage, critical) {
		const metadata = this.metadata();
		this.increment(metadata.totalDamageTakenVariableId, hpDamage);
		this.recordHighWaterMark(metadata.highestDamageTakenVariableId, hpDamage);
		if (critical !== true) return;
		this.increment(metadata.numberOfCritsTakenVariableId, 1);
		this.recordHighWaterMark(metadata.biggestCritTakenVariableId, hpDamage);
	}
	/**
	* Records a parry the party pulled off.
	* @param {boolean} preciseParried Whether or not the parry landed inside the precise window.
	*/
	static trackParry(preciseParried) {
		const metadata = this.metadata();
		this.increment(metadata.numberOfParriesVariableId, 1);
		if (preciseParried !== true) return;
		this.increment(metadata.numberOfPreciseParriesVariableId, 1);
	}
	/**
	* Records which slot the player just executed an action from.
	* @param {JABS_Action} action The action driving this step.
	*/
	static trackActionData(action) {
		const metadata = this.metadata();
		const cooldownType = action.getCooldownType();
		switch (cooldownType) {
			case JABS_Button.Mainhand:
				this.increment(metadata.mainhandSkillUsageVariableId, 1);
				break;
			case JABS_Button.Offhand:
				this.increment(metadata.offhandSkillUsageVariableId, 1);
				break;
			case JABS_Button.Dodge:
				this.increment(metadata.dodgeSkillUsageVariableId, 1);
				break;
			default:
				this.increment(metadata.assignedSkillUsageVariableId, 1);
				break;
		}
	}
};

//#endregion
//#region src/plugins/abs/ext/metrics/managers/JABS_Engine.js
/**
* Extends {@link #handleDefeatedEnemy}.<br/>
* Also records the kill against the appropriate tally.
* @param {JABS_Battler} defeatedTarget The `JABS_Battler` that was defeated.
* @param {JABS_Battler} caster The `JABS_Battler` that defeated the target.
*/
J.ABS.EXT.METRICS.Aliased.JABS_Engine.set("handleDefeatedEnemy", JABS_Engine.prototype.handleDefeatedEnemy);
JABS_Engine.prototype.handleDefeatedEnemy = function(defeatedTarget, caster) {
	J.ABS.EXT.METRICS.Aliased.JABS_Engine.get("handleDefeatedEnemy").call(this, defeatedTarget, caster);
	JABS_MetricsManager.trackDefeatedEnemy(defeatedTarget);
};
/**
* Extends {@link #handleDefeatedPlayer}.<br/>
* Also records the death.
*
* The tally is taken before the original logic rather than after, because handling a defeated player
* is what triggers the game over- there is no guarantee the rest of this function returns.
*/
J.ABS.EXT.METRICS.Aliased.JABS_Engine.set("handleDefeatedPlayer", JABS_Engine.prototype.handleDefeatedPlayer);
JABS_Engine.prototype.handleDefeatedPlayer = function() {
	JABS_MetricsManager.trackDefeatedPlayer();
	J.ABS.EXT.METRICS.Aliased.JABS_Engine.get("handleDefeatedPlayer").call(this);
};
/**
* Extends {@link #postExecuteSkillEffects}.<br/>
* Also records the combat outcome of the hit that just landed.
* @param {JABS_Action} action The action being executed.
* @param {JABS_Battler} target The target the skill effects were applied against.
*/
J.ABS.EXT.METRICS.Aliased.JABS_Engine.set("postExecuteSkillEffects", JABS_Engine.prototype.postExecuteSkillEffects);
JABS_Engine.prototype.postExecuteSkillEffects = function(action, target) {
	J.ABS.EXT.METRICS.Aliased.JABS_Engine.get("postExecuteSkillEffects").call(this, action, target);
	if (action.getCooldownType() === JABS_Button.Tool) return;
	if (target.isEnemy()) {
		JABS_MetricsManager.trackAttackData(target);
	} else if (target.isActor()) {
		JABS_MetricsManager.trackDefensiveData(target);
	}
};
/**
* Extends {@link #executeMapAction}.<br/>
* Also records which slot the player is leaning on.
* @param {JABS_Battler} caster The battler executing the action.
* @param {JABS_Action} action The action being executed.
* @param {number?} targetX The target's `x` coordinate, if applicable.
* @param {number?} targetY The target's `y` coordinate, if applicable.
*/
J.ABS.EXT.METRICS.Aliased.JABS_Engine.set("executeMapAction", JABS_Engine.prototype.executeMapAction);
JABS_Engine.prototype.executeMapAction = function(caster, action, targetX, targetY) {
	J.ABS.EXT.METRICS.Aliased.JABS_Engine.get("executeMapAction").call(this, caster, action, targetX, targetY);
	if (caster.isPlayer() === false) return;
	JABS_MetricsManager.trackActionData(action);
};

//#endregion
//# sourceMappingURL=J-ABS-Metrics.js.map