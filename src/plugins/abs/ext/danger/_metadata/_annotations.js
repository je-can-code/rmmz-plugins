//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] Enable danger indicators on foes on the map.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-ABS
 * @orderAfter J-ABS
 * @help
 * ============================================================================
 * This plugin enables the ability to display danger indicators on enemies
 * while on the map.
 *
 * This plugin requires JABS.
 * This plugin is plug-n-play, with minimal configuration.
 * ============================================================================
 * USAGE:
 * If you are using JABS, then JABS already knows what to do to make use of
 * this functionality. Just add this plugin after/below JABS, and it'll work
 * with no additional adjustments.
 * ============================================================================
 * OVERRIDING THE INDICATOR PER ENEMY:
 * By default, whether an enemy's danger indicator shows is controlled by the
 * plugin parameter "Show Indicator by Default". You can override this on a
 * per-enemy basis using the tags below.
 *
 * TAG USAGE:
 * - Enemies (database note)
 * - Enemy events (comment; overrides the database default for that event)
 *
 * TAG FORMAT:
 *    <noDangerIndicator>
 *  Suppresses the danger indicator for this enemy, regardless of the plugin
 *  parameter default.
 *
 *    <showDangerIndicator>
 *  Forces the danger indicator to show for this enemy, regardless of the
 *  plugin parameter default. Only meaningful on an event comment when the
 *  database default (or an event-level <noDangerIndicator>) would otherwise
 *  suppress it.
 *
 * NOTE: An event-level tag overrides whatever the database note tag or
 * plugin parameter default would otherwise decide for that specific event.
 *
 * EXAMPLE:
 *    <noDangerIndicator>
 * This enemy never shows a danger indicator, even if the plugin parameter
 * default is enabled.
 * ============================================================================
 * CHANGELOG:
 * - 1.0.4
 *    Fixed the NaN check on power level running before the line that produces the
 *    NaN, and answering with a warning rather than a usable sentinel.
 * - 1.0.3
 *    Added <noDangerIndicator>/<showDangerIndicator> per-enemy overrides.
 * - 1.0.2
 *    Raised minimum J-ABS version requirement to 4.7.0.
 * - 1.0.1
 *    Raised minimum J-ABS version requirement to 4.6.0.
 * ============================================================================
 * @param defaultEnemyShowDangerIndicator
 * @type boolean
 * @text Show Indicator by Default
 * @desc The default for whether or not enemies' danger indicators are visible.
 * @default true
 *
 * @param dangerIndicatorIconData
 * @type struct<DangerIconsStruct>
 * @text Danger Indicator Icons
 * @desc The collection of icons to represent enemy danger levels beside their hp gauge.
 * @default {"Worthless":"880","Simple":"881","Easy":"882","Average":"883","Hard":"884","Grueling":"885","Deadly":"886"}
 */
/*~struct~DangerIconsStruct:
 * @param Worthless
 * @type number
 * @text Extremely Easy <7
 * @desc When an enemy is more 7+ levels below the player, display this icon.
 * @default 591
 *
 * @param Simple
 * @type number
 * @text Very Easy <5-6
 * @desc When an enemy is more 5-6 levels below the player, display this icon.
 * @default 583
 *
 * @param Easy
 * @type number
 * @text Easy <3-4
 * @desc When an enemy is more 3-4 levels below the player, display this icon.
 * @default 581
 *
 * @param Average
 * @type number
 * @text Normal +/- 2
 * @desc When the player and enemy are within 0-2 levels of eachother, display this icon.
 * @default 579
 *
 * @param Hard
 * @type number
 * @text Hard >3-4
 * @desc When an player is more 3-4 levels below the enemy, display this icon.
 * @default 578
 *
 * @param Grueling
 * @type number
 * @text Very Hard >5-6
 * @desc When an player is more 5-6 levels below the enemy, display this icon.
 * @default 577
 *
 * @param Deadly
 * @type number
 * @text Extremely Hard >7+
 * @desc When an player is more 7+ levels below the enemy, display this icon.
 * @default 588
*/