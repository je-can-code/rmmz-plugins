//region plugin metadata
/* eslint-disable max-len */
import JABS_Stance from '../_models/JABS_Stance.js';

class J_AllyAiPluginMetadata
  extends PluginMetadata
{
  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   * Extends {@link #postInitialize}.<br/>
   * Maps ally AI menu commands and stance defaults from plugin parameters.
   */
  postInitialize()
  {
    super.postInitialize();

    this.initializeMetadata();
  }

  /**
   * Initializes the metadata associated with this plugin.
   */
  initializeMetadata()
  {
    // configuration for the main JABS quick menu command for ally AI.
    this.AllyAiCommandName = this.parsedPluginParameters['jabsMenuAllyAiCommandName'];
    this.AllyAiCommandIconIndex = Number(this.parsedPluginParameters['jabsMenuAllyAiCommandIconIndex']);
    this.AllyAiCommandSwitchId = Number(this.parsedPluginParameters['jabsMenuAllyAiCommandSwitchId']);

    // configuration for the various ai modes.
    this.AiModeEquippedIconIndex = Number(this.parsedPluginParameters['aiModeEquipped']);
    this.AiModeNotEquippedIconIndex = Number(this.parsedPluginParameters['aiModeNotEquipped']);

    // configuration for the per-ally do-nothing toggle, which shows which way it is set.
    this.DoNothingOnIconIndex = Number(this.parsedPluginParameters['doNothingOnIconIndex']);
    this.DoNothingOffIconIndex = Number(this.parsedPluginParameters['doNothingOffIconIndex']);

    // configuration for the party stance command.
    this.AllyStanceCommandName = this.parsedPluginParameters['allyStanceCommandName'] || 'Ally Stance';
    // assign ally stance command icon index on this instance for callers.
    this.AllyStanceCommandIconIndex = Number(this.parsedPluginParameters['allyStanceCommandIconIndex'] || 289);

    // assign how close to its spot an ally must be to count as standing in it.
    this.StanceTolerance = 0.5;

    // assign how much closer an ally must get to its spot for the frame to count as progress.
    // small enough that a genuine walk always clears it, large enough that the sub-tile shuffle of
    // a blocked ally never does.
    this.StanceProgressEpsilon = 0.05;

    // assign how many frames of getting no closer an ally endures before abandoning its spot.
    // a second is long enough to outlast a doorway or a passing ally, and short enough that nobody
    // watches a companion vibrate against a wall.
    this.StanceStallFrames = 60;

    // assign how far an ally's spot may drift before it counts as a different spot. a stance spot is the
    // nearest point of a zone to the ally, so a shuffling ally drags its spot a hair each frame; a leader
    // on the move carries it further than this within a handful of frames.
    this.StanceSpotDrift = 0.5;

    // assign how many frames the leader must hold a new facing before the stance turns with them.
    // half a second outlasts a glance at a sign, and is still quick to follow a real change of course.
    this.StanceFacingSettleFrames = 30;

    // assign how far outside its stance an ally must stray before it sprints to catch up. an ally trailing
    // a walking leader sits just outside its zone the whole time, and must not sprint for that.
    this.StanceCatchUpDistance = 1.5;

    // assign how much faster an ally moves while catching up, in steps of move speed. a single step
    // doubles the distance covered each frame, which is what it takes to overtake a leader still walking.
    this.StanceCatchUpSpeedBoost = 1;

    // assign how many frames a pull back holds the party's allies out of the fight. three seconds is long
    // enough to break away from a fight, and short enough that the party is not left defenseless.
    this.PullBackFrames = 180;

    /**
     * All available stances the party's allies can take.
     *
     * Listed in ladder order, from hanging back behind the leader to leading the charge ahead of them. The
     * menu shows them in this order, and stepping the stance safer or bolder moves along it.
     * @type {JABS_Stance[]}
     */
    this.StanceTypes = [
      new JABS_Stance(
        'safe-support',
        'Safe Support',
        'Hangs back 1-3 tiles behind you.\nJoins the fight the moment you do.',
        JABS_Stance.Placements.Behind,
        false),
      new JABS_Stance(
        'bloody-wanker',
        'Bloody Wanker',
        'Sticks right at your side.\nAlways first to swing at anything in sight.',
        JABS_Stance.Placements.Side,
        true),
      new JABS_Stance(
        'meat-shield',
        'Meat Shield',
        'Marches 1-3 tiles ahead of you.\nCharges anything in sight before it reaches you.',
        JABS_Stance.Placements.Front,
        true),
    ];

    /**
     * The default stance the party takes if none has been chosen.
     * @type {string}
     */
    this.DefaultStanceType = this.StanceTypes[0].key;
  }
}

export default J_AllyAiPluginMetadata;
//endregion plugin metadata