//region notetag-id-targets
/**
 * Which table every id-bearing notetag's payload points into.
 *
 * A notetag that names a database row by id is a reference with nothing guarding it. RPG Maker MZ,
 * jmz-data-editor and Chef Adventure's bulk scripts can each move or blank the row it names, and none
 * of them reads notes, so the tag keeps pointing at wherever the row used to be. Nothing reports it:
 * a `<drops:[a,ID,N]>` naming a blank armor is not an error, it is a drop that never happens. That
 * exact shape shipped 274 times before anyone noticed.
 *
 * The plugins are the only thing that knows what a payload means, so the knowledge lives here, beside
 * the regexes that parse it, rather than in the validator that consumes it. `generate-manifest` ships
 * this table next to the built plugins, and Chef Adventure's `tools/validate` resolves every id a
 * note names against it.
 *
 * ## Shape
 *
 * Keyed by tag name, exactly as the tag's regex declares it. Each tag lists one target per payload
 * position that holds an id:
 *
 * - `position` - which payload value is the id, counted from zero after the payload's brackets are
 *   stripped and it is split on commas. `<applyState:[12, 100]>` holds its id at position 0. The
 *   word `each` means every value is an id, for list tags such as `<passive:[3, 4, 5]>`.
 * - `table` - one of {@link IdTables}; or an object whose `byPosition` names the payload value that
 *   chooses the table and whose `cases` map each value to one, as `<drops>`' type letter does; or
 *   `null` when the id names something no table holds, in which case `reason` says what.
 * - `allowZero` - zero is the tag's documented "none" or "any", not a missing row.
 * - `acceptsName` - a display name is accepted in place of the id. Only meaningful for the System
 *   lists, which are what a name can be looked up in.
 *
 * Positions are used rather than capture groups on purpose: a regex can be rewritten without its
 * payload changing shape, and the glossary heading (`[STATE_ID, CHANCE]`) states the position
 * directly, so an entry can be checked against the documentation by eye.
 *
 * ## Keeping it complete
 *
 * `verify-notetag-reference` fails when a tag whose glossary heading names an id placeholder
 * (`STATE_ID`, `SKILL_IDS`, `ID`, and so on) has no entry here, and when an entry names a tag that
 * nothing declares. Several tags carry ids behind a generic placeholder - `<castAnimation:VAL>` is an
 * animation id, `<attackElements:[NUM]>` a list of element ids - and those are listed because they
 * were found by reading, not because the gate demanded them. A new tag of that kind is only as
 * covered as its author makes it.
 */

/**
 * Every table a target may name, and what an id has to be to resolve against it.
 *
 * This is the contract with Chef Adventure's validator: it resolves exactly these names, and refuses a
 * manifest naming any other, so adding one here means teaching the validator what it means too.
 * @type {Object<string, string>}
 */
export const IdTables = {
  Actors: 'a row in data/Actors.json with a non-empty name',
  Animations: 'a row in data/Animations.json with a non-empty name',
  Armors: 'a row in data/Armors.json with a non-empty name',
  Classes: 'a row in data/Classes.json with a non-empty name',
  Enemies: 'a row in data/Enemies.json with a non-empty name',
  Items: 'a row in data/Items.json with a non-empty name',
  Skills: 'a row in data/Skills.json with a non-empty name',
  States: 'a row in data/States.json with a non-empty name',
  Weapons: 'a row in data/Weapons.json with a non-empty name',
  Self: 'a row with a non-empty name in the same table as the row whose note carries the tag',
  Maps: 'a map listed in data/MapInfos.json',
  Elements: 'a named entry in the elements list of data/System.json, or 0 - RPG Maker\'s built-in "None" element',
  SkillTypes: 'a named entry in the skillTypes list of data/System.json',
  WeaponTypes: 'a named entry in the weaponTypes list of data/System.json',
  Switches: 'an entry in the switches list of data/System.json',
  JabsActionMapEvents: 'an event on the map named by the actionMapId parameter of J-ABS in js/plugins.js',
  SdpPanels: 'a panel key in data/config.sdp.json',
  Quests: 'a quest key in data/config.quest.json',
};

/**
 * Why a region id is never resolved, shared by every tag that names one.
 * @type {string}
 */
const REGION_REASON = 'region ids are painted onto map tiles; there is no table to resolve them against';

/**
 * The payload value that chooses a typed aptitude's table, and the table each value chooses. The
 * plugin lowercases the domain before matching it, so the cases are lowercase too.
 * @type {Object<string, string>}
 */
const APTITUDE_DOMAINS = {
  element: 'Elements',
  weapontype: 'WeaponTypes',
  skilltype: 'SkillTypes',
};

/**
 * Every id-bearing notetag, by the tag name its regex declares.
 * @type {Object<string, object[]>}
 */
export const NotetagIdTargets = {
  // J-ABS.
  actionId: [ { position: 0, table: 'JabsActionMapEvents' } ],
  applyStateOnExpire: [ { position: 0, table: 'States' } ],
  bonusDamageIfSelfState: [ { position: 0, table: 'States' } ],
  bonusDamageIfState: [ { position: 0, table: 'States' } ],
  bonusDamagePerStateStack: [ { position: 0, table: 'States' } ],
  castAnimation: [ { position: 0, table: 'Animations' } ],
  channel: [ { position: 0, table: 'Skills' } ],
  combo: [ { position: 0, table: 'Skills' } ],
  counterGuard: [ { position: 0, table: 'Skills' } ],
  counterParry: [ { position: 0, table: 'Skills' } ],
  directStateTarget: [ { position: 0, table: 'States' } ],
  enemyId: [ { position: 0, table: 'Enemies' } ],
  guardSkillId: [ { position: 0, table: 'Skills' } ],
  noAutoAssignType: [ { position: 'each', table: 'SkillTypes' } ],
  offhandSkillId: [ { position: 0, table: 'Skills' } ],
  onCastAnimationId: [ { position: 0, table: 'Animations' } ],
  onChannelComplete: [ { position: 'each', table: 'Skills' } ],
  onEvadeApply: [ { position: 0, table: 'States' } ],
  onEvadeApplySelf: [ { position: 0, table: 'States' } ],
  onEvadeExecute: [ { position: 0, table: 'Skills' } ],
  onOwnDefeat: [ { position: 0, table: 'Skills' } ],
  onTargetDefeat: [ { position: 0, table: 'Skills' } ],
  respawnAnimation: [ { position: 0, table: 'Animations' } ],
  retaliate: [ { position: 0, table: 'Skills' } ],
  selfAnimationId: [ { position: 0, table: 'Animations' } ],
  skillHistoryBonus: [ { position: 0, table: 'SkillTypes', allowZero: true } ],
  skillId: [ { position: 0, table: 'Skills' } ],
  skillTransform: [ { position: 0, table: 'Skills' }, { position: 1, table: 'Skills' } ],
  slotTransform: [ { position: 1, table: 'Skills' } ],
  stacksConvertToState: [ { position: 0, table: 'States' } ],
  thisBonusDamageIfSelfState: [ { position: 0, table: 'States' } ],
  thisBonusDamageIfState: [ { position: 0, table: 'States' } ],
  thisBonusDamagePerStateStack: [ { position: 0, table: 'States' } ],
  upgradeOverSkill: [ { position: 0, table: 'Skills' } ],

  // J-ABS-Charge. A released skill of 0 is a tier that fires nothing.
  chargeTier: [
    { position: 2, table: 'Skills', allowZero: true },
    { position: 3, table: 'Animations' },
    { position: 4, table: 'Animations' },
  ],

  // J-ABS-Formula.
  onApplySkill: [ { position: 2, table: 'Skills' } ],

  // J-ABS-Shield.
  shieldBreak: [ { position: 'each', table: 'Skills' } ],

  // J-ABS-StarBattles, read through the engine's native map-note meta.
  battleMap: [ { position: 0, table: 'Maps' } ],

  // J-ABS-Tools.
  onGapCloseEnd: [ { position: 'each', table: 'Skills' } ],
  thisOnGapCloseEnd: [ { position: 'each', table: 'Skills' } ],

  // J-Aptitude and J-Aptitude-Typed. A typed domain accepts a name as readily as an id.
  aptitude: [ { position: 0, table: 'Skills' } ],
  aptitudeTyped: [
    { position: 0, table: 'Skills' },
    { position: 3, table: { byPosition: 2, cases: APTITUDE_DOMAINS }, acceptsName: true },
  ],
  apTyped: [ { position: 2, table: { byPosition: 1, cases: APTITUDE_DOMAINS }, acceptsName: true } ],

  // J-CriticalFactors.
  critAlwaysIfState: [ { position: 'each', table: 'States' } ],
  critChanceIfState: [ { position: 0, table: 'States' } ],
  onCritApply: [ { position: 0, table: 'States' } ],
  onCritSelf: [ { position: 0, table: 'States' } ],
  thisCritApply: [ { position: 0, table: 'States' } ],
  thisCritChanceIfState: [ { position: 0, table: 'States' } ],
  thisCritSelf: [ { position: 0, table: 'States' } ],
  thisCritsAlwaysIfState: [ { position: 'each', table: 'States' } ],

  // J-DropsControl. The type letter picks the table; an upgrade stays inside the table it starts in.
  drops: [
    {
      position: 1,
      table: {
        byPosition: 0,
        cases: { i: 'Items', item: 'Items', w: 'Weapons', weapon: 'Weapons', a: 'Armors', armor: 'Armors' },
      },
    },
  ],
  dropUpgradeId: [ { position: 0, table: 'Self' } ],

  // J-Elementalistics.
  absorbElements: [ { position: 'each', table: 'Elements' } ],
  attackElements: [ { position: 'each', table: 'Elements' } ],
  boostElement: [ { position: 0, table: 'Elements' } ],
  pierceElement: [ { position: 0, table: 'Elements' } ],
  slayer: [ { position: 0, table: 'Elements' } ],
  strictElements: [ { position: 'each', table: 'Elements' } ],
  thisPierceElement: [ { position: 0, table: 'Elements' } ],

  // J-LevelMaster.
  learning: [ { position: 0, table: 'Skills' } ],

  // J-Message.
  leaderChoiceCondition: [ { position: 0, table: 'Actors' } ],
  notLeaderChoiceCondition: [ { position: 0, table: 'Actors' } ],
  switchOffChoiceCondition: [ { position: 0, table: 'Switches' } ],
  switchOnChoiceCondition: [ { position: 0, table: 'Switches' } ],

  // J-Omnipedia-Quest.
  choiceQuestCondition: [ { position: 0, table: 'Quests' } ],
  pageQuestCondition: [ { position: 0, table: 'Quests' } ],

  // J-Passive.
  equippedPassive: [ { position: 'each', table: 'States' } ],
  passive: [ { position: 'each', table: 'States' } ],
  uniqueEquippedPassive: [ { position: 'each', table: 'States' } ],
  uniquePassive: [ { position: 'each', table: 'States' } ],

  // J-Passive-Conditional. A skill type of 0 matches every skill type.
  autoApplyState: [ { position: 0, table: 'States' } ],
  autoApplyStateOnNearby: [ { position: 0, table: 'States' } ],
  autoExecuteSkill: [ { position: 0, table: 'Skills' } ],
  autoInflictState: [ { position: 0, table: 'States' } ],
  passiveStateCount: [ { position: 0, table: 'States' } ],
  passiveStateRule: [ { position: 0, table: 'States' } ],
  removeOnSkillExecution: [ { position: 0, table: 'SkillTypes', allowZero: true } ],
  removeOnSkillResolution: [ { position: 0, table: 'SkillTypes', allowZero: true } ],
  removeStateOnMove: [ { position: 0, table: 'States' } ],

  // J-Passive-OTIB.
  otib: [ { position: 'each', table: 'States' } ],

  // J-RegionEffects and its extensions.
  allowRegions: [ { position: 'each', table: null, reason: REGION_REASON } ],
  denyRegions: [ { position: 'each', table: null, reason: REGION_REASON } ],
  regionAddState: [
    { position: 0, table: null, reason: REGION_REASON },
    { position: 1, table: 'States' },
    { position: 3, table: 'Animations' },
  ],
  regionSkill: [
    { position: 0, table: null, reason: REGION_REASON },
    { position: 1, table: 'Skills' },
    { position: 3, table: 'Enemies' },
  ],

  // J-Resources.
  itemCost: [ { position: 0, table: 'Items' } ],
  stackCost: [ { position: 0, table: 'States' } ],

  // J-SDP.
  sdpDropData: [ { position: 0, table: 'SdpPanels' } ],
  sdpUnlock: [ { position: 0, table: 'SdpPanels' } ],

  // J-SkillExtend. An extension names rows in its own table: a skill extends skills, a state states.
  applyState: [ { position: 0, table: 'States' } ],
  extend: [ { position: 'each', table: 'Self' } ],
  onCastExecuteSkill: [ { position: 0, table: 'Skills' } ],
  onCastExecuteSkillIfAfflicted: [ { position: 0, table: 'Skills' }, { position: 2, table: 'States' } ],
  onCastLoseState: [ { position: 0, table: 'States' } ],
  onCastRemoveState: [ { position: 0, table: 'States' } ],
  onCastSelfState: [ { position: 0, table: 'States' } ],
  onCastSelfStateIfAfflicted: [ { position: 0, table: 'States' }, { position: 2, table: 'States' } ],
  onCastStripState: [ { position: 0, table: 'States' } ],
  onHitLoseState: [ { position: 0, table: 'States' } ],
  onHitRemoveState: [ { position: 0, table: 'States' } ],
  onHitSelfState: [ { position: 0, table: 'States' } ],
  onHitStripState: [ { position: 0, table: 'States' } ],
  thisApplyState: [ { position: 0, table: 'States' } ],
  toggleGroupOnExecute: [ { position: 'each', table: 'States' } ],
  toggleOnExecute: [ { position: 0, table: 'States' } ],

  // J-SkillSlots.
  unslottedSkills: [ { position: 'each', table: 'Skills' } ],
};
//endregion notetag-id-targets