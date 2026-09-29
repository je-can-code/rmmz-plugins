//region introduction
 
/*:
 * @target MZ
 * @plugindesc [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Difficulty layers as passive states for everyone.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-Passive
 * @orderAfter J-Base
 * @orderAfter J-Passive
 * @orderAfter J-Passive-Affix
 * @orderAfter J-ABS
 * @orderAfter J-Base-Save
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin is an extension of J-Passive.
 *
 * It enables the ability to apply one to many "difficulty layers". A layer is
 * a passive that is on for everyone, perpetually: it names one state for
 * actors and one state for enemies, and while the layer is enabled every actor
 * and every enemy carries that state as a passive.
 *
 * Everything a layer does lives on its states, so anything a state can do, a
 * layer can do: any trait, and any tag any plugin reads off a state.
 *
 * Being passives, the states show no icon, fill no HUD strip, never expire,
 * and nothing can cure or cleanse them. Tag each one <hideFromPassiveList> to
 * keep it out of the Passives menu as well.
 * ----------------------------------------------------------------------------
 * NOTE:
 * There are no tags for this plugin.
 * All difficulties are defined in an external JSON file.
 * ============================================================================
 * CONFIGURING A LAYER
 * Every layer lives in `data/config.difficulty.json`, which is a list of them:
 *
 *  {
 *    "key": "011_crimson-drive",
 *    "name": "Bloody Exchange",
 *    "iconIndex": 1009,
 *    "description": "First line.|Second line.",
 *    "cost": 5,
 *    "actorStateId": 501,
 *    "enemyStateId": 502,
 *    "enabled": false,
 *    "unlocked": false,
 *    "hidden": false
 *  }
 *
 * - actorStateId: the state every actor carries while the layer is enabled.
 * - enemyStateId: the state every enemy carries while the layer is enabled.
 * - Either may be 0, which grants that side of every fight nothing.
 * - With no layer enabled at all, the default layer (the Default Difficulty
 *   parameter) stays in force, states and all.
 * ============================================================================
 * AFFIX EFFECTS (requires J-Passive-Affix)
 * It gives every difficulty layer an optional say in how enemy affixes roll:
 * how often they appear, how evenly the pool is spread, and whether affixes
 * that are otherwise unreachable become available at all.
 *
 * Nothing here is required. A layer that says nothing about affixes changes
 * nothing about them, and without J-Passive-Affix installed the block is read
 * and validated but never applied.
 *
 * Have you ever wanted your hardest difficulty to feel like a different game
 * rather than the same game with bigger numbers? Well now you can! By adding
 * an `affixEffects` block to a layer in the difficulty configuration, you too
 * can make that layer reshape the affixes your enemies spawn with.
 *
 * CONFIG USAGE:
 * - Any layer in `data/config.difficulty.json`
 *
 * CONFIG FORMAT:
 *  "affixEffects": {
 *    "prefixChance": 150,
 *    "suffixChance": 150,
 *    "flatten": 40,
 *    "grants": [
 *      { "stateId": 306, "weight": 50 }
 *    ]
 *  }
 *
 * CONFIG NOTES:
 * - Every field is optional. An omitted field does nothing at all.
 * - Effects from multiple enabled layers are combined, not overridden.
 * - When no layers are enabled, the default layer's block applies, matching
 *   how the default layer's states apply.
 *
 * ----------------------------------------------------------------------------
 * PREFIX CHANCE / SUFFIX CHANCE
 * These are multipliers against whatever chance the spawn would otherwise have
 * had, expressed as a percent. 100 means "leave it alone".
 *
 * They scale the chance AFTER J-Passive-Affix has resolved it, so the usual
 * precedence still decides the baseline: an event comment beats an enemy note,
 * which beats the plugin default. This only says how much of that applies.
 *
 * EXAMPLES:
 *  "prefixChance": 150
 *    Prefixes are half again as common while this layer is enabled.
 *
 *  "prefixChance": 0
 *    Prefixes never roll while this layer is enabled. This is legal and
 *    occasionally useful, but it is an easy typo for "leave it alone", which
 *    is 100 rather than 0.
 *
 * Two enabled layers at 150 combine to 225% of the base chance, because layers
 * multiply. The result is clamped to 0-100 before it is rolled.
 *
 * ----------------------------------------------------------------------------
 * FLATTEN
 * Affix weights are shares, not percentages: an affix's odds are its own weight
 * divided by the total weight of its pool. A pool authored so that its best
 * affix is fifty times rarer than its worst will show that best affix roughly
 * never, no matter how often affixes roll.
 *
 * Flatten pulls every weight toward the pool's average, as a percent of the
 * distance. At 0 the pool is untouched. At 100 every affix in the pool is
 * equally likely. In between, the rare end becomes reachable without the common
 * end disappearing.
 *
 * EXAMPLE:
 *  "flatten": 40
 *    In a pool averaging 179, an affix weighted 10 is rewritten to about 78 -
 *    close to eight times as likely - while one weighted 500 drops to about
 *    372, losing roughly a quarter of its share.
 *
 * Two enabled layers each flattening 40 combine to 64, not 80. Each layer
 * closes part of the remaining distance to the mean, so what is left after both
 * is 60% of 60%. The order they are applied in does not matter.
 *
 * Flatten applies to the whole pool. It has no notion of a "good" or "bad"
 * affix, because an affix is only a state and nothing records whether its
 * effects favor the player.
 *
 * ----------------------------------------------------------------------------
 * GRANTS
 * Have you ever wanted an affix that simply does not exist until the player
 * opts into a harder game? Well now you can! By reserving a state at weight
 * zero and granting it from a layer, you too can hide an affix behind a
 * difficulty.
 *
 * An affix state weighted at zero is a member of its pool that is never drawn.
 * It still counts as an affix everywhere else - an event pinning it through
 * `<passive:[...]>` still works, and its tier presentation still applies - it
 * simply never wins a random roll.
 *
 * A grant hands that state a weight, which both unlocks it and prices it.
 *
 * CONFIG FORMAT:
 *  "grants": [
 *    { "stateId": ID, "weight": WEIGHT }
 *  ]
 *
 * EXAMPLE:
 *  A state noted with:
 *    <enemy-prefix>
 *    <affix-weight:0>
 *
 *  ...paired with a layer configured:
 *    "grants": [
 *      { "stateId": 306, "weight": 50 }
 *    ]
 *
 *  ...means state 306 can only appear while that layer is enabled, at a weight
 *  of 50 against the rest of the prefix pool.
 *
 * CONFIG NOTES:
 * - Grants are a list of objects rather than an object keyed by state id,
 *   because JSON object keys are always strings. A keyed form would make every
 *   id arrive as text and need converting before it could match anything, and
 *   named fields say which number is the id and which is the weight.
 * - The same state may not be granted twice by one layer. Two different layers
 *   granting it is fine and resolves to the larger of the two weights.
 * - Which slot a grant lands in comes from the state's own <enemy-prefix> or
 *   <enemy-suffix> tag, so a grant never has to name it. A state carrying both
 *   is granted in both.
 * - Granted weights are never flattened. Flatten reshapes the pool as authored;
 *   grants speak for what was deliberately left out of it.
 * - Two layers granting the same state resolve to the larger weight, not the
 *   sum of the two.
 * - Granting a state that already has a nonzero weight is an error and stops
 *   the game at boot. Grants exist to unlock reserved affixes; applied to one
 *   that already rolls, a grant would silently overwrite an authored weight.
 * - Granting a state id that does not exist, or one that is neither a prefix
 *   nor a suffix, is likewise an error at boot. A grant that quietly does
 *   nothing is indistinguishable from bad luck, which is a miserable thing to
 *   have to diagnose from inside a playthrough.
 * ============================================================================
 * CHANGELOG:
 * - 3.0.0
 *    BREAKING: replaces J-Difficulty and J-Difficulty-Affix; plugin commands now come
 *    from J-Passive-Difficulty. Each layer is a pair of hidden passive states, and the
 *    difficulty screen says what they do in words. Locked layers show behind a padlock.
 * - 2.2.2
 *    Dropped a redundant round from the parameter and reward factors. The inputs are
 *    whole percentages, so it never had anything to round.
 * - 2.2.1
 *    Routed the duplicate-key and lock/unlock/enable/disable warnings through
 *    J-Base's new Diagnostics, so each one names J-Difficulty in the console.
 * - 2.2.0
 *    Difficulty layers now retain the raw configuration they were built from.
 *    The classifier reads a fixed set of fields by name, so anything an
 *    extension adds to a layer was unrecoverable once parsing finished - and
 *    parsing happens during this plugin's own construction, too early for any
 *    extension to intervene. Keeping the source is what lets an extension find
 *    its own fields without reading the file a second time.
 * - 2.1.2
 *    Difficulty scaling can no longer reduce max hp below one. The engine floors
 *    it at one inside its own param call, and the difficulty multiplier was
 *    applied to the result - outside that clamp - so a max hp multiplier of zero
 *    produced a battler with no maximum hp and broke every ratio computed from
 *    it. Other parameters still scale to zero, which is a legitimate setting.
 * - 2.1.1
 *    The difficulty points window no longer declares private members. A
 *    window's constructor reaches initialize, and through it the drawing
 *    hooks, before a derived class installs its own members- so anything
 *    private was being touched on an object that did not yet have it.
 * - 2.1.0
 *    Routed the _difficulty namespace into its own save section, so difficulty
 *    state lands in systems/difficulty.json rather than in the system blob.
 *    Moved the _difficulty namespace seeding from the initialize alias to
 *    initMembers, so a decoded save can establish it without a constructor.
 * - 2.0.2
 *    Fixed the scene's initMembers chain never reaching Scene_Base, which left
 *    the modal dimmer field unseeded. getModalDimmerWindow guards on === null,
 *    so undefined slipped straight past it and showModalDimmer dereferenced it.
 *    Command windows now seed state in initMembers, early enough for
 *    makeCommandList to see it.
 * - 2.0.1
 *    Added flag for showing external file load info.
 *    Removed dead plugin parameter inputs.
 * - 2.0.0
 *    Updated window layout of scene.
 *    Added multiple layer application support.
 *    Updated difficulty layers to also be applicable to actors if desired.
 *    Refactored a lot of underlying code.
 *    Externalized difficulty layer data.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 *
 * @param difficultyConfigs
 * @text DIFFICULTY SETUP
 *
 * @param initialPoints
 * @parent difficultyConfigs
 * @type number
 * @text Starting Points
 * @desc The number of points the player has available from the start of a new game.
 * @default 10
 *
 * @param defaultDifficulty
 * @parent difficultyConfigs
 * @type string
 * @text Default Difficulty
 * @desc The key of the starting or default difficulty before it is decided.
 * @default 000_default
 *
 * @command callDifficultyMenu
 * @text Call Difficulty Menu
 * @desc Calls the difficulty menu regardless of the current scene.
 *
 * @command lockDifficulty
 * @text Lock Difficulty
 * @desc Locks a difficulty, making it unchoosable in the difficulty menu.
 * @arg keys
 * @type string[]
 * @desc The unique keys for the difficulties that will be locked.
 *
 * @command unlockDifficulty
 * @text Unlock Difficulty
 * @desc Unlocks a difficulty, making it choosable in the difficulty menu.
 * @arg keys
 * @type string[]
 * @desc The unique keys for the difficulties that will be unlocked.
 *
 * @command hideDifficulty
 * @text Hide Difficulty
 * @desc Hides a difficulty, preventing it from being added to the list in the difficulty menu.
 * @arg keys
 * @type string[]
 * @desc The unique keys for the difficulties that will be hidden.
 *
 * @command unhideDifficulty
 * @text Unhide Difficulty
 * @desc Shows a difficulty, forcing it to be added to the list in the difficulty menu.
 * @arg keys
 * @type string[]
 * @desc The unique keys for the difficulties that will be unhidden.
 *
 * @command enableDifficulty
 * @text Enable Difficulty
 * @desc Enables a difficulty, applying its effects.
 * @arg keys
 * @type string[]
 * @desc The unique keys for the difficulties that will be enabled.
 *
 * @command disableDifficulty
 * @text Disable Difficulty
 * @desc Disables a difficulty, rendering its effects inactive.
 * @arg keys
 * @type string[]
 * @desc The unique keys for the difficulties that will be disabled.
 *
 * @command modifyLayerMax
 * @text Modify Layer Max
 * @desc Modifies the maximum difficulty layer points by the given amount.
 * @arg amount
 * @type number
 * @desc The amount to modify the max layer points by. This can be negative.
 * @min -999999
 * @max 999999
 */
 