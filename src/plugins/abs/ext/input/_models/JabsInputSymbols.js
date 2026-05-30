//region JabsInputSymbols
/**
 * Symbol names registered with RMMZ {@link Input} for J-ABS Input extension mappings.
 */
class JabsInputSymbols
{
  // this section of inputs is an attempt to align with the internal RMMZ mapping convention.
  static DirUp = 'up';
  static DirDown = 'down';
  static DirLeft = 'left';
  static DirRight = 'right';
  static Mainhand = 'ok';
  static Offhand = 'cancel';
  static Dash = 'shift';
  static Tool = 'tab';
  static GuardTrigger = 'pagedown';
  static SkillTrigger = 'pageup';

  // this section of inputs are newly implemented.
  static MobilitySkill = 'r2';
  static StrafeTrigger = 'l2';
  static Quickmenu = 'start';
  static PartyCycle = 'select';
  static Debug = 'cheat';

  // for gamepads, these buttons are tracked, but aren't used by JABS right now.
  static R3 = 'r3';
  static L3 = 'l3';

  // for dedicated D-pad shortcuts (not movement directions).
  static DPadUp = 'dpad-up';
  static DPadDown = 'dpad-down';
  static DPadLeft = 'dpad-left';
  static DPadRight = 'dpad-right';

  // for keyboards, these buttons are for direct combatskill usage.
  static CombatSkill1 = 'combat-skill-1';
  static CombatSkill2 = 'combat-skill-2';
  static CombatSkill3 = 'combat-skill-3';
  static CombatSkill4 = 'combat-skill-4';
}

export default JabsInputSymbols;
//endregion JabsInputSymbols