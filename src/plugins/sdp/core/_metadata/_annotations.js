//region Introduction
 
/*:
 * @target MZ
 * @plugindesc [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Enables the SDP system, aka Stat Distribution Panels.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-DropsControl
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter J-ABS-Speed
 * @orderAfter J-DropsControl
 * @orderAfter J-Natural
 * @orderAfter J-Proficiency
 * @orderBefore J-CriticalFactors
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin is a form of "stat distribution"- an alternative to the standard
 * of leveling up to raise an actor's stats.
 *
 * Integrates with others of mine plugins:
 * - J-ABS; enemies will individually drop their points and panels.
 * - J-ABS-Speed; enables usage of Movespeed Boost as a parameter on panels.
 * - J-CriticalFactors; enables usage of CDM/CDR as parameters on panels.
 * - J-DropsControl; enables usage of item-as-panel drops.
 * - J-Natural; enables SDP reward modifications.
 * - J-Proficiency; enables usage of Proficiency+ as a parameter on panels.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * This system allows the player's party to unlock "stat distribution panels"
 * (aka SDPs), by means of plugin command.
 *
 * The scene to manage unlocked SDPs is accessible via the menu, the JABS
 * quick menu, or via plugin command.
 *
 * Each SDP has the following:
 * - 1+ parameters (of the 27 available in RMMZ) with flat/percent growth.
 * - A fixed rank max.
 * - Rank-up costs driven by **rarity defaults** (plugin parameters) plus optional **per-panel offsets**
 *   in `config.sdp.json` (`baseCost`, `flatGrowthCost`, `multGrowthCost` — usually **0 / 0 / 1.0**).
 * - Customizable name/icon/description1/description2.
 * - Rank up rewards for any/every/max rank, which can be most anything.
 *
 * In order to rank up these SDPs, you'll need to use SDP points. These can be
 * acquired by using the tags below, or by using plugin commands.
 *
 * NOTES:
 * - SDP points gained from enemies are earned for all members of the party.
 * - SDP points are stored and spent on a per-actor basis.
 * - SDP points for an actor cannot be reduced below 0.
 * - Stat Distribution Panels are unlocked for all members of the party.
 * - Stat Distribution Panel rewards can unlock other panels.
 *
 * IMPORTANT NOTE:
 * The SDP data is derived from an external file rather than the plugin's
 * parameters. This file lives in the "/data" directory of your project, and
 * is called "config.sdp.json". You can absolutely generate/modify this file
 * by hand, but you'll probably want to visit my github and swipe the
 * rmmz-data-editor project I've built that provides a convenient GUI for
 * generating and modifying SDPs in just about every way you could need.
 *
 * If this configuration file is missing, the game will not run.
 *
 * Additionally, due to the way RMMZ base code is designed, by loading external
 * files for configuration like this, a project made with this plugin will
 * simply crash when attempting to load in a web context with an error akin to:
 *    "ReferenceError require is not defined"
 * This error is a result of attempting to leverage nodejs's "require" loader
 * to load the "fs" (file system) library to then load the plugin's config
 * file. Normally a web deployed game will alternatively use "forage" instead
 * to handle things that need to be read or saved, but because the config file
 * is just that- a file sitting in the /data directory rather than loaded into
 * forage storage- it becomes unaccessible.
 * ----------------------------------------------------------------------------
 * NOTE ABOUT PANEL NAMES:
 * Generally speaking, you can name your chosen panels (described in the
 * configuration file mentioned above) whatever you want- with a couple of
 * exceptions for organizational purposes within the JMZ Data Editor.
 *
 * If a panel starts with any of the following characters:
 * - "__" (double underscore)
 * - "--" (double hyphen/dash)
 * - "==" (double equals)
 * Then the panel will not be included in the list that is parsed from the
 * configuration file upon starting the game.
 * ============================================================================
 * FAMILIES AND SUBGROUPS:
 * Have you ever wanted to organize a large panel list into browsable
 * categories, or build a chain of panels where investing deep into one
 * grants a payoff that replaces the previous tier's? Well now you can! Two
 * new top-level blocks in `config.sdp.json`- `families` and `subgroups`-
 * let you group panels for menu browsing and for mastery progression.
 *
 * A FAMILY is a top-level menu category. In the SDP scene, the player
 * cycles between families with L2/R2, filtering the panel list down to just
 * that family's panels (or "All", or "Unsorted" for panels with no
 * subgroup/family enrollment). Each family row owns a list of subgroup
 * keys.
 *
 * A SUBGROUP is a tiered chain of panels that live inside a family. Panels
 * enroll in a subgroup individually (see their own `mastery` block below)
 * by referencing the subgroup's key and declaring their tier within it.
 * Subgroups themselves don't define the panels- they're just the
 * authoring/display metadata (name, key, icon, description) that panels
 * point back to.
 *
 * CONFIG SCHEMA (families):
 *    {
 *      "key": "elemental",
 *      "name": "Elemental Affinities",
 *      "iconIndex": 64,
 *      "description": "Mastery over the elements.",
 *      "subgroupKeys": ["fire-mastery", "ice-mastery"]
 *    }
 *  Where "key" uniquely identifies this family and is referenced by nothing
 *  else directly- families own subgroups, not the other way around.
 *  Where "subgroupKeys" lists every subgroup key that belongs to this family.
 *
 * CONFIG SCHEMA (subgroups):
 *    {
 *      "key": "fire-mastery",
 *      "name": "Fire Mastery",
 *      "iconIndex": 65,
 *      "description": "Deepen your command of flame."
 *    }
 *  Where "key" is referenced by panels via their own `mastery.subgroupKey`
 *  (see MASTERY below) and by a family's `subgroupKeys` list above.
 *
 * NOTE: A subgroup with no owning family (not listed in any family's
 * subgroupKeys) still functions for mastery purposes, but its panels fall
 * back to the "Unsorted" filter bucket in the family strip instead of a
 * named family.
 * ============================================================================
 * MASTERY:
 * Have you ever wanted maxing out a panel to grant a passive skill- and have
 * a deeper panel in the same progression line automatically replace that
 * skill with a better one? Well now you can! Any panel can opt into the
 * mastery program by adding a `mastery` block to its config row.
 *
 * NOTE ABOUT TWO INDEPENDENT FLAGS:
 * Subgroup ENROLLMENT (subgroupKey + subgroupTier) and mastery SKILL
 * GRANTING (masterySkillId) are independent- a panel can be enrolled in a
 * subgroup (participating in family filtering and occupying a tier slot)
 * without granting any skill at all (masterySkillId left at 0). This is
 * useful for "filler" tiers that exist purely to occupy a slot in the
 * progression without a payoff of their own.
 *
 * CONFIG SCHEMA (panel `mastery` block):
 *    "mastery": {
 *      "subgroupKey": "fire-mastery",
 *      "subgroupTier": 1,
 *      "masterySkillId": 501
 *    }
 *  Where "subgroupKey" enrolls this panel in a subgroup (must match a
 *  subgroups[].key entry above). Omit or leave empty to opt this panel out
 *  of the subgroup hierarchy entirely.
 *  Where "subgroupTier" is this panel's rank within the subgroup's
 *  progression- higher tiers win when reconciling which mastery skill is
 *  active. Boot validation rejects two panels sharing the same tier within
 *  one subgroup. Required (> 0) whenever subgroupKey is set.
 *  Where "masterySkillId" is the skill id granted to the actor when this
 *  panel reaches max rank. Leave at 0 (or omit) for an enrolled panel that
 *  should not grant a mastery skill of its own.
 *
 * HOW RECONCILIATION WORKS:
 * The instant a panel reaches max rank, every panel enrolled in that same
 * subgroup is re-evaluated: the actor's highest-tier MAXED panel in the
 * subgroup wins, its masterySkillId is learned if not already known, and
 * every other tier's masterySkillId in that subgroup is forgotten if
 * currently known. Only one mastery skill per subgroup is ever active on a
 * given actor at a time- deepening your investment upgrades the payoff
 * instead of stacking it.
 *
 * NOTE: Ranking a panel back down (if your project allows that) does not
 * un-grant a mastery skill by itself- reconciliation only runs when a panel
 * is freshly maxed. The mastery summary for whichever panel is currently
 * hovered in the SDP scene is shown read-only alongside the normal reward
 * list.
 * ============================================================================
 * SDP POINTS:
 * Ever wanted enemies to yield SDP points on defeat, or items that grant (or
 * consume) SDP points when used? Well now you can! By applying the same tag
 * to either an enemy or an item, you too can define exactly how many SDP
 * points that source is worth.
 *
 * NOTE ABOUT ENEMIES:
 * The value on an enemy is a straight reward yielded on defeat, same as exp
 * or gold.
 *
 * NOTE ABOUT ITEMS:
 * The value on an item is applied to the target actor when the item is used
 * on them- an item can only ever affect actors (using an SDP item on an
 * enemy target does nothing), and only non-skill usable items are eligible.
 * A negative VALUE consumes points from the target instead of granting them.
 *
 * TAG USAGE:
 * - Enemies
 * - Items
 *
 * TAG FORMAT:
 *  <sdpPoints:VALUE>
 *   Where VALUE is the integer number of SDP points yielded (enemies) or
 *   granted/consumed (items). Can be negative on items.
 *
 * TAG EXAMPLES:
 *  <sdpPoints:250>
 * This enemy yields 250 SDP points upon defeat.
 *
 *  <sdpPoints:100>
 * Using this item on an actor grants them 100 SDP points.
 *
 *  <sdpPoints:-50>
 * Using this item on an actor consumes 50 of their SDP points.
 *
 * ============================================================================
 * ENEMY SDP DROPS:
 * Ever want enemies to drop SDPs themselves for unlocking across the party?
 * Well now you can! By applying the appropriate tag to enemies in the
 * database, you can have enemies drop any singular SDP at any integer percent
 * chance you want them to.
 *
 * NOTE ABOUT SDP DROPS AND JABS:
 * This system was explicitly designed with JABS in mind. If you are not using
 * JABS, you probably instead should just use the SDP UNLOCK tag on an item
 * that the enemy drops for similar functionality. This functionality will
 * dynamically generate the loot for the SDP being unlocked with no database
 * backing and unlock it upon pickup- which would be incompatible outside of
 * JABS.
 *
 * TAG USAGE:
 * - Enemies only.
 *
 * TAG FORMAT:
 *  <sdpDropData:[SDP_KEY, DROP_CHANCE]>
 *   Where SDP_KEY is the unique string key for the SDP to unlock.
 *   Where DROP_CHANCE is the 1-100 percent chance that the SDP will drop.
 *
 * TAG EXAMPLES:
 *  <sdpDropData:[ORC_1, 5]>
 * The enemy with this tag will drop an SDP with the key of "ORC_1" upon defeat
 * 5% of the time.
 *
 *  <sdpDropData:[GOB_4, 100]>
 * The enemy with this tag will drop an SDP with the key of "GOB_4" upon defeat
 * 100% of the time- aka guaranteed drop upon defeat.
 *
 * ============================================================================
 * SDP UNLOCK:
 * Ever wanted items used to unlock SDPs? Well now you can! By applying the
 * necessary tags onto items in the database, you too can have items that will
 * function as SDP unlockers (in addition to whatever else they do).
 * 
 * TAG USAGE:
 * - Items only.
 * 
 * TAG FORMAT:
 *  <sdpUnlock:SDP_KEY>
 *   Where SDP_KEY is the unique string key for the SDP to unlock.
 *
 * TAG EXAMPLES:
 *  <sdpUnlock:ORC_1>
 * An item used with this tag on it will unlock the SDP with the key of "ORC_1"
 * upon use- in addition to its other effects.
 *
 *  <sdpUnlock:GOB_4>
 * An item used with this tag on it will unlock the SDP with the key of "GOB_4"
 * upon use- in addition to its other effects.
 * 
 * ============================================================================
 * SDP POINTS:
 * Ever want enemies to drop SDP Points? Well now they can! By applying the
 * appropriate tag to the enemy/enemies in question, you can have enemies drop
 * as little or as much as you want them to.
 *
 * TAG USAGE:
 * - Enemies only.
 *
 * TAG FORMAT:
 *  <sdp:POINTS>
 *
 * TAG EXAMPLES:
 *  <sdp:10>
 * The party will gain 10 SDP points from defeating this enemy.
 *
 *  <sdp:123456>
 * The party will gain 123456 SDP points from defeating this enemy.
 *
 * ============================================================================
 * SDP MULTIPLIERS:
 * Ever want allies to gain some percentage amount more (or less) of the SDP
 * points earned from enemies? Well now you can! By applying the appropriate
 * tag to the various database locations applicable, you can gain a percentage
 * bonus/penalty amount of SDP points obtained!
 *
 * NOTE:
 * The format implies that you will be providing whole numbers and not actual
 * multipliers, like 1.3 or something. If multiple tags are present across the
 * various database locations on a single actor, they will stack additively.
 * SDP points cannot be reduced below 0 for an actor, but they most certainly
 * can receive negative amounts if the tags added up like that.
 *
 * TAG USAGE:
 * - Actors
 * - Classes
 * - Skills
 * - Weapons
 * - Armors
 * - States
 *
 * TAG FORMAT:
 *  <sdpMultiplier:AMOUNT>    (for positive)
 *  <sdpMultiplier:-AMOUNT>   (for negative)
 *
 * TAG EXAMPLES:
 *  <sdpMultiplier:25>
 * An actor with something equipped/applied that has the above tag will now
 * gain 25% increased SDP points.
 *
 *  <sdpMultiplier:80>
 *  <sdpMultiplier:-30>
 * An actor with something equipped/applied that has both of the above tags
 * will now gain 50% increased SDP points (80 - 30 = 50).
 *
 * ============================================================================
 * SDP BONUS FORMULA:
 * Need to scale the SDP points an actor gains from a JS formula rather than
 * a flat percentage? Apply the sdpBonusFormula tag to any valid notetag source.
 * The formula is evaluated after the sdpMultiplier (SDR) step and its result
 * is treated as a bonus fraction — so a result of 0.20 means +20% more points.
 * Multiple tags across different sources sum their bonus fractions together
 * before the final multiply, consistent with how other formula tags work here.
 *
 * Formula context:
 *   a = the actor gaining SDP points
 *   b = 0 (unused; present for formula consistency)
 *   v = $gameVariables._data
 *
 * Useful formula helpers:
 *   a.getMasteryCount()   — number of subgroups the actor has currently mastered
 *   a.level               — actor level
 *   a.getTotalSdpRanks()  — sum of all ranked panel investments
 *
 * TAG USAGE:
 * - Actors
 * - Classes
 * - Skills
 * - Weapons
 * - Armors
 * - States
 *
 * TAG FORMAT:
 *  <sdpBonusFormula:[FORMULA]>
 *
 * TAG EXAMPLES:
 *  <sdpBonusFormula:[a.getMasteryCount() * 0.01]>
 * An actor with 20 mastered subgroups gains an extra 20% SDP points on top of
 * whatever the sdpMultiplier (SDR) already provided.
 *
 *  <sdpBonusFormula:[a.level * 0.005]>
 * An actor at level 50 gains an extra 25% SDP points from this source.
 *
 * ============================================================================
 * CHANGELOG:
 * - 3.0.0
 *    BREAKING: Rank-up cost spine is defined per **rarity** in plugin parameters; each panel’s `baseCost`,
 *    `flatGrowthCost`, and `multGrowthCost` in `config.sdp.json` are **offsets / scale** (defaults **0 / 0 / 1.0**).
 *    Retune plugin defaults or panel overrides when migrating from v2.x absolute triples.
 *    Added panel Families and Subgroups (`config.sdp.json` `families`/`subgroups` blocks): a
 *    Family is a top-level menu category cycled with L2/R2 in the SDP scene (Window_SdpFamilyStrip);
 *    a Subgroup is a tiered chain of panels within a Family whose masteries supersede each other.
 *    Added Mastery: a panel enrolled in a subgroup (via its `mastery` block: subgroupKey,
 *    subgroupTier, masterySkillId) grants that tier's wrapper skill to the actor when maxed.
 *    Maxing a higher tier in the same subgroup automatically forgets the previous tier's mastery
 *    skill and grants the new one (SdpMasteryManager) — only the highest maxed tier is ever active.
 *    Surfaced read-only in the SDP scene via Window_SdpMastery for whichever panel is hovered.
 * - 2.1.2
 *    Consumed `RPGManager` updates.
 * - 2.1.1
 *    Added flag for showing external file load info.
 * - 2.1.0
 *    Removed association of SDPs being backed by actual database items.
 *    Implemented JABS-centric basis for dynamically generating drops.
 * - 2.0.2
 *    Added new getTotalSdpRanks function to actors for a new data point.
 * - 2.0.1
 *    Added filter for skipping panels that start with particular characters.
 *    Retroactively added note about breaking web deploys for this plugin.
 * - 2.0.0
 *    THIS UPDATE BREAKS WEB DEPLOY FUNCTIONALITY FOR YOUR GAME.
 *    Major breaking changes related to plugin parameters.
 *    Updated to extend common plugin metadata patterns.
 *    Panel data is now strictly data.
 *    Rankings of panels are stored on the actor as save data.
 *    Now loads panel data from external file.
 *    Panels being unlocked/locked are stored on the party.
 *    Updated SDP scene to display rewards.
 *    Updated SDP rewards to have names.
 * - 1.3.0
 *    Added new tag for unlocking panels on use of item.
 * - 1.2.3
 *    Updated JABS menu integration with help text.
 * - 1.2.2
 *    Updated sdp drop production to use drop item builder.
 * - 1.2.1
 *    Update to add tracking for total gained sdp points.
 *    Update to add tracking for total spent sdp points.
 * - 1.2.0
 *    Update to include Max TP as a valid panel parameter.
 * - 1.1.0
 *    Update to accommodate J-CriticalFactors.
 * - 1.0.0
 *    The initial release.
 *
 * ============================================================================
 *
 * @param SDPconfigs
 * @text SDP SETUP
 *
 * @param menuSwitch
 * @parent SDPconfigs
 * @type switch
 * @text Menu Switch ID
 * @desc When this switch is ON, then this command is visible in the menu.
 * @default 104
 *
 * @param sdpIcon
 * @parent SDPconfigs
 * @type number
 * @text Points Icon
 * @desc The default icon index to represent "SDP points".
 * Use the context menu to easily select an index.
 * @default 306
 *
 * @param victoryText
 * @parent SDPconfigs
 * @type string
 * @text Victory Text
 * @desc The text appended to text as seen in the default.
 * This text usually shows up after a battle is won.
 * @default SDP points earned!
 *
 * @param menuCommandName
 * @parent SDPconfigs
 * @type string
 * @text Menu Name
 * @desc The text to show as the name of this command in menus.
 * @default Distribute
 *
 * @param menuCommandIcon
 * @parent SDPconfigs
 * @type number
 * @text Menu Icon
 * @desc The icon to show next to the command in the menu.
 * Use the context menu to easily select an index.
 * @default 2563
 *
 * @param sdpUnitSingular
 * @parent SDPconfigs
 * @type string
 * @text Unit name (singular)
 * @desc Player-facing word for one rankable entry (panel, node, junction, etc.).
 * @default panel
 *
 * @param sdpUnitPlural
 * @parent SDPconfigs
 * @type string
 * @text Unit name (plural)
 * @desc Plural form for counts in confirmations (panels, nodes, …).
 * @default panels
 *
 * @param sdpPointsDisplayName
 * @parent SDPconfigs
 * @type string
 * @text Points name (short)
 * @desc Currency label in SDP UI (confirmation “Remaining …”, cart wallet header, TextManager.sdpPoints).
 * @default SDP
 *
 *
 * @param JABSconfigs
 * @text JABS-ONLY CONFIG
 * @desc Without JABS, these configurations are irrelevant.
 *
 * @param showInBoth
 * @parent JABSconfigs
 * @type boolean
 * @desc If ON, then show in both JABS quick menu and main menu, otherwise only JABS quick menu.
 * @default false
 *
 *
 * @param sdpPanelCostDefaults
 * @text Panel rank-up defaults (by rarity)
 * @desc Core base / flat coefficient / exponential base (**mult**) per rarity. Panel JSON adds offsets on top.
 *
 * @param sdpDefaultCommonBase
 * @parent sdpPanelCostDefaults
 * @type number
 * @min -999999
 * @text Common · Base SDP
 * @default 0
 *
 * @param sdpDefaultCommonFlat
 * @parent sdpPanelCostDefaults
 * @type number
 * @min 0
 * @text Common · Flat coefficient
 * @default 70
 *
 * @param sdpDefaultCommonMult
 * @parent sdpPanelCostDefaults
 * @type number
 * @decimals 2
 * @min 1.00
 * @text Common · Mult base
 * @default 1.06
 *
 * @param sdpDefaultMagicalBase
 * @parent sdpPanelCostDefaults
 * @type number
 * @min -999999
 * @text Magical · Base SDP
 * @default 0
 *
 * @param sdpDefaultMagicalFlat
 * @parent sdpPanelCostDefaults
 * @type number
 * @min 0
 * @text Magical · Flat coefficient
 * @default 235
 *
 * @param sdpDefaultMagicalMult
 * @parent sdpPanelCostDefaults
 * @type number
 * @decimals 2
 * @min 1.00
 * @text Magical · Mult base
 * @default 1.06
 *
 * @param sdpDefaultRareBase
 * @parent sdpPanelCostDefaults
 * @type number
 * @min -999999
 * @text Rare · Base SDP
 * @default 0
 *
 * @param sdpDefaultRareFlat
 * @parent sdpPanelCostDefaults
 * @type number
 * @min 0
 * @text Rare · Flat coefficient
 * @default 1180
 *
 * @param sdpDefaultRareMult
 * @parent sdpPanelCostDefaults
 * @type number
 * @decimals 2
 * @min 1.00
 * @text Rare · Mult base
 * @default 1.06
 *
 * @param sdpDefaultEpicBase
 * @parent sdpPanelCostDefaults
 * @type number
 * @min -999999
 * @text Epic · Base SDP
 * @default 0
 *
 * @param sdpDefaultEpicFlat
 * @parent sdpPanelCostDefaults
 * @type number
 * @min 0
 * @text Epic · Flat coefficient
 * @default 4320
 *
 * @param sdpDefaultEpicMult
 * @parent sdpPanelCostDefaults
 * @type number
 * @decimals 2
 * @min 1.00
 * @text Epic · Mult base
 * @default 1.06
 *
 * @param sdpDefaultLegendaryBase
 * @parent sdpPanelCostDefaults
 * @type number
 * @min -999999
 * @text Legendary · Base SDP
 * @default 0
 *
 * @param sdpDefaultLegendaryFlat
 * @parent sdpPanelCostDefaults
 * @type number
 * @min 0
 * @text Legendary · Flat coefficient
 * @default 11900
 *
 * @param sdpDefaultLegendaryMult
 * @parent sdpPanelCostDefaults
 * @type number
 * @decimals 2
 * @min 1.00
 * @text Legendary · Mult base
 * @default 1.06
 *
 * @param sdpDefaultGodlikeBase
 * @parent sdpPanelCostDefaults
 * @type number
 * @min -999999
 * @text Godlike · Base SDP
 * @default 0
 *
 * @param sdpDefaultGodlikeFlat
 * @parent sdpPanelCostDefaults
 * @type number
 * @min 0
 * @text Godlike · Flat coefficient
 * @default 30500
 *
 * @param sdpDefaultGodlikeMult
 * @parent sdpPanelCostDefaults
 * @type number
 * @decimals 2
 * @min 1.00
 * @text Godlike · Mult base
 * @default 1.06
 *
 * @command Call SDP Menu
 * @text Access the SDP Menu
 * @desc Calls the SDP Menu directly via plugin command.
 *
 * @command Unlock SDP
 * @text Unlock Panel(s)
 * @desc Unlocks a new panel for the player to level up by its key. Key must exist in the SDPs list above.
 * @arg keys
 * @type string[]
 * @desc The unique keys for the SDPs that will be unlocked.
 *
 * @command Lock SDP
 * @text Lock Panel(s)
 * @desc Locks a SDP by its key. Locked panels do not appear in the list nor affect the player's parameters.
 * @arg keys
 * @type string[]
 * @desc The unique keys for the SDPs that will be locked.
 *
 * @command Modify SDP points
 * @text Add/Remove SDP points
 * @desc Adds or removes a designated amount of points from an actor.
 * @arg actorId
 * @type actor
 * @desc The actor to modify the points of.
 * @arg sdpPoints
 * @type number
 * @min -99999999
 * @desc The number of points to modify by. Negative will remove points. Cannot go below 0.
 *
 * @command Modify party SDP points
 * @text Add/Remove party's SDP points
 * @desc Adds or removes a designated amount of points from all members of the current party.
 * @arg sdpPoints
 * @type number
 * @min -99999999
 * @desc The number of points to modify by. Negative will remove points. Cannot go below 0.
 */
 