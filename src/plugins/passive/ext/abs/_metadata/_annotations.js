//region annotations
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Random passive affixes + tier presentation for JABS enemies.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @base J-Passive
 * @base J-ABS-Speed
 * @base J-ABS-Tools
 * @base J-ABS-Timing
 * @base J-ABS-Shield
 * @base J-SkillExtend
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-Passive
 * @orderAfter J-ABS-Speed
 * @orderAfter J-ABS-Tools
 * @orderAfter J-ABS-Timing
 * @orderAfter J-ABS-Shield
 * @orderAfter J-SkillExtend
 * @orderAfter J-HUD-TargetFrame
 * @orderAfter J-MessageTextCodes
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin is an extension of J-Passive for J-ABS.
 *
 * It adds a passive "affix" system to JABS map enemies so they can spawn with
 * a random tier prefix and/or suffix (both weighted), and it decorates the
 * name presentation on the map and in the target HUD.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * This plugin is intentionally layered behind a simple policy:
 * If an event explicitly defines passive state ids via `<passive:[...]>`, then
 * those ids win and no random affix rolling occurs for that spawn.
 *
 * Otherwise, prefix/suffix affixes are rolled from state-defined pools and
 * applied as passive states to the spawned enemy battler.
 *
 * ============================================================================
 * PASSIVE AFFIX RNG (MAP ENEMIES)
 * Have you ever wanted "Wicked Slime" or "Slime of Frost" to be a thing, but
 * still want full control when you need it? Well now you can! By applying the
 * appropriate tags to your states and enemies (and optionally event comments),
 * you too can have JABS enemies spawn with weighted passive affixes.
 *
 * TAG USAGE:
 * - States (prefix/suffix pool membership + weights)
 * - Enemies (block RNG and/or override chances)
 * - Events (Comment commands on the pfage that spawns the enemy)
 *
 * POLICY / PRECEDENCE:
 *  (1) If the event has an explicit `<passive:[...]>` list that contains any
 *      affix ids, then that list is applied and no random affix rolling
 *      occurs.
 *  (2) Otherwise, prefix and suffix are rolled independently by chance + pool.
 *  (3) Event comment overrides beat enemy note overrides, which beat the
 *      plugin defaults.
 *
 * ----------------------------------------------------------------------------
 * BLOCKING RANDOM AFFIXES
 * Have you ever wanted a specific enemy to opt-out of random affixes entirely,
 * or to only ever roll one slot? Well now you can! By applying the following
 * tags to an enemy note, you too can block random affix rolls per enemy.
 *
 * TAG USAGE:
 * - Enemies
 *
 * TAG FORMAT:
 *  <no-rng-passives>
 *  <no-rng-passive-prefixes>
 *  <no-rng-passive-suffixes>
 *
 * TAG EXAMPLES:
 *  <no-rng-passives>
 *    Prevents rolling both prefixes and suffixes for this enemy.
 *
 *  <no-rng-passive-prefixes>
 *    Prevents rolling prefixes for this enemy, but suffixes may still roll.
 *
 * ----------------------------------------------------------------------------
 * OVERRIDING RANDOM AFFIX CHANCES
 * Have you ever wanted a particular enemy (or a single spawn point on the map)
 * to have a much higher (or lower) chance of rolling an affix? Well now you
 * can! By applying these chance tags to an enemy note or event comment, you
 * too can override the percent chance for that slot.
 *
 * TAG USAGE:
 * - Enemies
 * - Events (Comment commands)
 *
 * TAG FORMAT:
 *  <passive-affix-prefix-chance:PERCENT>
 *  <passive-affix-suffix-chance:PERCENT>
 *    Where PERCENT is 0–100 (decimals allowed).
 *
 * TAG NOTES:
 * - Multiple chance tags on an event page are allowed; the last one wins.
 * - Event comment chance overrides take priority over enemy note overrides.
 *
 * TAG EXAMPLES:
 *  <passive-affix-prefix-chance:100>
 *    Always rolls a prefix (unless blocked or overridden by explicit
 *    `<passive:[...]>`).
 *
 *  <passive-affix-suffix-chance:12.5>
 *    Rolls a suffix roughly 12.5% of the time.
 *
 * ============================================================================
 * AFFIX POOLS (STATE NOTES)
 * Have you ever wanted some passive states to act like "affix words", where a
 * state can be eligible to become a prefix or suffix? Well now you can! By
 * applying the following tags to states, you too can define the pools this
 * plugin rolls from.
 *
 * TAG USAGE:
 * - States
 *
 * TAG FORMAT:
 *  <enemy-prefix>
 *  <enemy-suffix>
 *
 * TAG EXAMPLES:
 *  <enemy-prefix>
 *    This state can be selected as a prefix affix state.
 *
 * ----------------------------------------------------------------------------
 * WEIGHTING AFFIX ROLLS
 * Have you ever wanted some affixes to be common and others to be rare? Well
 * now you can! By applying a weight tag to a state, you too can influence how
 * often it is selected by the weighted roll.
 *
 * TAG USAGE:
 * - States
 *
 * TAG FORMAT:
 *  <affix-weight:N>
 *    Where N is a positive integer weight.
 *
 * TAG EXAMPLES:
 *  <affix-weight:10>
 *    Ten times as likely as an affix with weight 1.
 *
 * ============================================================================
 * TIER STRIPE / TINT
 * Have you ever wanted your tier prefix to communicate its tier visually on
 * the map (and optionally in the HUD), without forcing every prefix to have a
 * color? Well now you can! By applying a tier hex tag to a prefix state, you
 * too can tint the map nameplate stripe (and optionally the HUD name row).
 *
 * TAG USAGE:
 * - States
 *
 * TAG FORMAT:
 *  <tier-color-hex:#RRGGBB>
 *
 * TAG NOTES:
 * - No tag means no stripe tint. Full stop.
 *
 * TAG EXAMPLES:
 *  <tier-color-hex:#FF0000>
 *    Uses a bright red stripe tint when this prefix is the selected tier
 *    prefix.
 *
 * ============================================================================
 * REWARD MULTIPLIERS
 * Have you ever wanted affixed enemies to yield better rewards for the extra
 * challenge they pose? Well now you can! By applying the following tag to
 * states and/or enemy notes, you too can multiplicatively scale any reward
 * type when the enemy is defeated.
 *
 * TAG USAGE:
 * - States (affix states or any other state on the enemy)
 * - Enemies
 *
 * TAG FORMAT:
 *  <rewardMultiplier:[TYPE, VALUE]>
 *    Where TYPE is one of: exp, gold, sdp, ap, drops
 *    Where VALUE is a decimal multiplier (e.g. 2.0 = double).
 *
 * TAG NOTES:
 * - Multiple tags per note are supported (one per reward type).
 * - When an enemy has multipliers from both its note and its states,
 *   they stack multiplicatively (e.g. 1.5x from note * 2.0x from
 *   prefix state = 3.0x total).
 * - The "drops" type multiplies the drop chance percentage, not the
 *   number of items.
 *
 * TAG EXAMPLES:
 *  <rewardMultiplier:[exp, 2.0]>
 *    Enemies defeated with this tag yield double experience.
 *
 *  <rewardMultiplier:[gold, 1.5]>
 *  <rewardMultiplier:[drops, 1.25]>
 *    These two tags on the same state would grant 1.5x gold and
 *    1.25x drop chance when the enemy is defeated.
 *
 * ============================================================================
 * PLUGIN PARAMETERS
 * Have you ever wanted to tune the default prefix/suffix roll chances without
 * tagging every enemy? Well now you can! By configuring the parameters below,
 * you too can set the global defaults used when no overrides are present.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 *
 * @param parentConfigPassiveAbs
 * @text PASSIVE ABS
 *
 * @param default-prefix-chance
 * @parent parentConfigPassiveAbs
 * @type number
 * @decimals 2
 * @min 0
 * @max 100
 * @text Default Prefix Affix Chance
 * @desc Percent chance to roll a random prefix affix when the slot is not blocked and no override applies.
 * @default 8
 *
 * @param default-suffix-chance
 * @parent parentConfigPassiveAbs
 * @type number
 * @decimals 2
 * @min 0
 * @max 100
 * @text Default Suffix Affix Chance
 * @desc Percent chance to roll a random suffix affix when the slot is not blocked and no override applies.
 * @default 8
 */
//endregion annotations