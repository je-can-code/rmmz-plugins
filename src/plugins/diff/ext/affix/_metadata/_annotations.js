//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Lets difficulty layers bias enemy affix rates and unlock reserved affixes.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-Difficulty
 * @base J-Passive-Affix
 * @orderAfter J-Base
 * @orderAfter J-Difficulty
 * @orderAfter J-Passive-Affix
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin is an extension of J-Difficulty that reaches into J-Passive-Affix.
 *
 * It gives every difficulty layer an optional say in how enemy affixes roll:
 * how often they appear, how evenly the pool is spread, and whether affixes
 * that are otherwise unreachable become available at all.
 *
 * The point is to give the difficulty system a second axis. Without this, a
 * layer trades harder enemies for better rewards and that is the whole of the
 * bargain. With it, raising a layer also changes what the world spawns.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * Nothing here is required. A difficulty layer that says nothing about affixes
 * behaves exactly as it did before this plugin was installed, and a project
 * where no layer says anything is completely unaffected.
 *
 * All configuration lives in the same `data/config.difficulty.json` that
 * J-Difficulty already reads. There is no second file and no plugin parameter.
 *
 * ============================================================================
 * CONFIGURING A LAYER
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
 *   how J-Difficulty already treats its parameter effects.
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
 */
//endregion annotations