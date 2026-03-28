//region Initialization
/*:
 * @target MZ
 * @plugindesc
 * [v1.1.2 DIAG] Enables diagonal movement.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-ABS
 * @orderAfter J-Base
 * @orderAfter J-ABS
 * @orderAfter Cyclone-Movement
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin enables 8-directional movement for the player.
 * This plugin enables the respect of diagonal directions for JABS actions.
 * This plugin enables diagonal facing script controls in moveroutes.
 *
 * This plugin requires JABS.
 * ============================================================================
 * DIAGONAL DIRECTIONS FOR ACTIONS
 * Have you ever wanted your actions to respect diagonals? Well now they will!
 * Additionally, by leveraging some straight-forward script commands in your
 * action event moveroutes, you too can diagonlize your actions moveroutes to
 * make spirals and all sorts of fun stuff!
 *
 * Use this to turn an event 45 degrees to the right:
 *   this.turnRight45();
 *
 * Use this to turn an event 45 degrees to the left:
 *   this.turnLeft45();
 *
 * Use this to turn an event randomly right or left 45 degrees:
 *   this.turnRightOrLeft45();
 *
 * ----------------------------------------------------------------------------
 * HOMING ACTIONS
 * Have you ever wanted your actions to home into targets? Well now you can! By
 * dropping one of these straight-forward script commands into your action
 * event moveroutes and slapping 'em on repeat, you too can home into current
 * targets and/or your last hit targets to your heart's content!
 *
 * What is "Homing"?
 * "Homing" is defined as taking the absolute shortest route to the target,
 * respecting terrain that the action cannot pass. In most cases, action events
 * probably have 'through' checked, so it will simply be the most direct route
 * to the target, but should the action not have 'through' checked, it will
 * pathfind to the target.
 *
 * Use this to force an action event to home into it's last-hit target:
 *   this.homeIntoLastHit();
 *
 * Use this to force an action event to home into it's current target:
 *   this.homeIntoTarget();
 *
 * ----------------------------------------------------------------------------
 * SEEKING ACTIONS
 * Have you ever wanted your actions to sorta home into targets, but be a bit
 * more subtle about it? Well now you can! By dropping one of these straight-
 * forward script commands into your action event moveroutes and slapping 'em
 * on repeat, you too can sorta gradually home into your current targets and/or
 * your last hit targets to your heart's content!
 *
 * What is "Seeking"?
 * "Seeking" is defined as turning 45 degrees once per step while moving toward
 * the target, NOT respecting terrain that the action cannot pass. In most
 * cases, the action events will probably have 'through' checked, so it will
 * simply be the somewhat most direct route to the target, but should the
 * action not have 'through' checked, it will loosely head towards the target
 * until a collision with something impassible.
 *
 * Use this to force an event to seek it's last-hit target:
 *   this.seekLastHit();
 *
 * Use this to force an event to seek it's current target:
 *   this.seekTarget();
 * ============================================================================
 * CHANGELOG:
 * - 1.1.2
 *    Raised minimum J-ABS version requirement to 4.7.0.
 * - 1.1.1
 *    Raised minimum J-ABS version requirement to 4.6.0.
 * - 1.1.0
 *    Retroactively added this CHANGELOG.
 *    Removed unnecessary references to Cyclone-Movement from this plugin.
 *    Cleaned up the code and added jsdocs.
 *    Updated the plugin help to have a more verbose explanation.
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 */