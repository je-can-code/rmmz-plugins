//region introduction
/*:
 * @target MZ
 * @plugindesc
 * [v@@PLUGIN_VERSION@@ @@PLUGIN_DESC_TAG@@] A HUD frame that displays your battle target.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-ABS
 * @base J-Base
 * @base J-HUD
 * @orderAfter J-ABS
 * @orderAfter J-Base
 * @orderAfter J-HUD
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin is an extension of the J-HUD plugin, designed for JABS.
 * It generates a window on the map displaying a given target.
 *
 * The following data points are currently supported:
 * - The enemy battler's name.
 * - The enemy battler's "text".
 * - An icon.
 * - The enemy's HP gauge.
 * - The enemy's MP gauge.
 * - The enemy's TP gauge.
 *
 * ============================================================================
 * SETUP:
 * This plugin creates a window, which contains gauges representing the target
 * that is currently set. No images are needed: the gauges are drawn the same
 * way as the rest of the HUD's gauges, trail and all- when the target loses
 * some of a gauge, the lost amount turns red and drains away, and when it
 * gains some back, the gained amount shows in green and the gauge fills in.
 * ============================================================================
 * TARGET FRAME TEXT:
 * Have you ever wanted your JABS battlers to have an extra line of text that
 * gives some sort of context to that particular enemy? Well now you can! By
 * applying the appropriate tags to either the enemy or the event that
 * represents the enemy on the map, you too can have meaningful text in your
 * target frame!
 *
 * NOTE 1:
 * If a tag exists on the enemy in the database AND on the event representing
 * the same enemy, the event tag will take priority and database tag will be
 * ignored.
 *
 * NOTE 2:
 * If no target frame text is available, the gauges will automatically move up
 * slightly to prevent it from looking strange with the extra space (if you
 * are using the gauges).
 *
 * TAG USAGE:
 * - Enemies
 * - Events on the map (only applicable to JABS battlers)
 *
 * TAG FORMAT:
 *  <targetFrameText:TEXT>
 *
 * TAG EXAMPLE:
 *  <targetFrameText:I'm the coolest ghosty ever.>
 * When this enemy is struck on the map, the target frame will display the
 * above provided text of "I'm the coolest ghosty ever." between the name and
 * the gauges (if present).
 * ============================================================================
 * TARGET FRAME ICON:
 * Have you ever wanted your JABS battlers to have an icon displayed in the
 * target frame? Well now you can! By applying the appropriate tags to either
 * the enemy or the event that represents the enemy on the map, you too can
 * have enemies with flashy and meaningful icons in your target frame!
 *
 * NOTE 1:
 * If a tag exists on the enemy in the database AND on the event representing
 * the same enemy, the event tag will take priority and database tag will be
 * ignored.
 *
 * NOTE 2:
 * The icon leads the target's name. If no target frame icon is available, the
 * name simply starts where the icon would have been.
 *
 * TAG USAGE:
 * - Enemies
 * - Events on the map (only applicable to JABS battlers)
 *
 * TAG FORMAT:
 *  <targetFrameIcon:ICON_INDEX>
 *
 * TAG EXAMPLE:
 *  <targetFrameIcon:25>
 * When this enemy is struck on the map, the target frame will display an icon
 * that matches the icon index of 25 ahead of the enemy's name.
 * ============================================================================
 * HIDING DATA:
 * Have you ever wanted to hide certain data points for some enemies, but not
 * ALL enemies? Well now you can! By applying the appropriate tags to either
 * the enemy or the event that represents an enemy on the map, you too can have
 * the chosen data points completely absent from the target frame when striking
 * the tagged enemy!
 *
 * DETAILS:
 * Below you'll find 5 tags for hiding the various data points of the target
 * frame, with the tag hopefully describing accurately what they accomplish.
 * Hiding the entire frame will take priority over any of the one elements.
 * Hiding with these tags via the event will take the highest priority over
 * showing via tags in the event or the database. Generally speaking, it is
 * probably recommended to enable and show all data points, and then hide
 * them selectively with the below tags.
 *
 * TAG USAGE:
 * - Enemies
 * - Events on the map (only applicable to JABS battlers)
 *
 * TAG FORMAT:
 *  <hideTargetFrame>     Hides the target frame and all text and gauges.
 *  <hideTargetFrameText> Hides the subtext in the target frame.
 *  <hideTargetHpBar>     Hides the HP gauge in the target frame.
 *  <hideTargetMpBar>     Hides the MP gauge in the target frame.
 *  <hideTargetTpBar>     Hides the TP gauge in the target frame.
 * ============================================================================
 * @param targetFrameData
 * @text Target Frame Window
 *
 * @param targetFrameX
 * @parent targetFrameData
 * @type number
 * @min 0
 * @text Origin X
 * @desc The x coordinate of the overarching target frame.
 * @default 400
 *
 * @param targetFrameY
 * @parent targetFrameData
 * @type number
 * @min 0
 * @text Origin Y
 * @desc The y coordinate of the overarching target frame.
 * @default 0
 *
 * @param targetFrameWidth
 * @parent targetFrameData
 * @type number
 * @min 0
 * @text Width
 * @desc The width in pixels of the target frame window.
 * @default 480
 *
 * @param targetFrameHeight
 * @parent targetFrameData
 * @type number
 * @min 0
 * @text Height
 * @desc The height in pixels of the target frame window.
 * @default 180
 *
 * @param settings
 * @text Target Settings
 *
 * @param hpSettings
 * @parent settings
 * @text For HP:
 *
 * @param enableHp
 * @parent hpSettings
 * @type boolean
 * @text Use Gauge
 * @desc Enables the HP gauge in the target frame.
 * @default true
 * @on Enable HP Gauge
 * @off Disable HP Gauge
 *
 * @param mpSettings
 * @parent settings
 * @text For MP:
 *
 * @param enableMp
 * @parent mpSettings
 * @type boolean
 * @text Use Gauge
 * @desc Enables the MP gauge in the target frame.
 * @default true
 * @on Enable MP Gauge
 * @off Disable MP Gauge
 *
 * @param tpSettings
 * @parent settings
 * @text For TP:
 *
 * @param enableTp
 * @parent tpSettings
 * @type boolean
 * @text Use Gauge
 * @desc Enables the TP gauge in the target frame.
 * @default true
 * @on Enable TP Gauge
 * @off Disable TP Gauge
 *
 * @param tpGaugeRotation
 * @parent tpSettings
 * @type number
 * @min -360
 * @max 360
 * @text Rotation
 * @desc The degree of rotation for the TP gauge. Between -360 and 360.
 * @default 270
 *
 * ============================================================================
 * CHANGELOG:
 * - 2.0.0
 *    The target frame no longer needs gauge images. Its gauges draw like the rest of
 *    the HUD's, trail and all, its afflictions share one compact row, and icons now
 *    lead the target's name. The image gauge parameters are gone.
 * - 1.2.0
 *    The target frame fades while the player is standing on top of it, through the
 *    shared resolver in J-HUD. This rides on top of the inactivity fade rather than
 *    competing with it - that one owns opacity, this one owns alpha.
 * - 1.1.0
 *    Target frame now renders the shared dual-row state affliction
 *    presenter from J-HUD core, wired via a new patch file.
 *    Fixed Game_Enemy#targetFrameIcon reading with the TargetFrameText
 *    regex instead of TargetFrameIcon, so the icon tag never matched.
 * - 1.0.1
 *    Adjusted target frame defaults for better readability.
 *    Improved gauge alignment logic for consistent HP/MP positioning.
 * - 1.0.0
 *    Initial release.
 */