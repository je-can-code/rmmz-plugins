//region plugins/abs/core/models/jabs-action.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/** Builds a minimal but complete skill note-tag surface for JABS_Action's constructor/init chain. */
function buildSkill(overrides = {})
{
  return {
    id: 1,
    note: String.empty,
    meta: {},
    damage: { type: 0 },
    scope: 1,
    jabsSelfAnimationId: 0,
    jabsOnCastAnimationId: 0,
    jabsLinger: 10,
    jabsDelayDuration: 0,
    jabsDelayTriggerByTouch: false,
    jabsDelayTriggerRadius: null,
    jabsPierceCount: 1,
    jabsPierceDelay: 0,
    jabsCastTime: 0,
    jabsBonusHitsFromSkillNote: 0,
    jabsDirect: false,
    jabsCooldown: 0,
    jabsRadius: 1,
    jabsProximity: 3,
    jabsShape: 'circle',
    jabsKnockback: null,
    jabsInnerRadius: 0,
    jabsActionId: 1,
    jabsBonusAggro: 0,
    jabsAggroMultiplier: 1.0,
    jabsAggroPercent: 0,
    jabsNotMyAggro: 0,
    jabsNotMyAggroPercent: 0,
    jabsUnparryable: false,
    jabsCastAnimation: null,
    ...overrides,
  };
}

/** Builds a minimal Game_Battler-shaped object for the caster's underlying battler. */
function buildGameBattler(overrides = {})
{
  return {
    getBonusHitsGlobal: () => 0,
    getBonusHitsBasic: () => 0,
    getBonusHitsSkill: () => 0,
    getProjectileDurationModifier: () => 1,
    getRangeBuff: () => 0,
    getRangeRate: () => 1,
    getRadiusBuff: () => 0,
    getRadiusRate: () => 0,
    getProximityBuff: () => 0,
    getProximityRate: () => 0,
    getThicknessBuff: () => 0,
    getThicknessRate: () => 0,
    result: () => ({ parried: false }),
    ...overrides,
  };
}

/** Builds a minimal JABS_Battler-shaped caster. */
function buildCaster(overrides = {})
{
  const gameBattler = buildGameBattler();
  return {
    getUuid: () => 'caster-uuid',
    getBattler: () => gameBattler,
    isSkillIdBasicAttack: () => false,
    isEnemy: () => false,
    getCharacter: () => ({ requestAnimation: vi.fn(), direction: () => 2, _realX: 0, _realY: 0, _x: 0, _y: 0 }),
    ...overrides,
  };
}

/** Builds a minimal Game_Action-shaped object binding a skill to a caster. */
function buildGameAction(skill, caster, overrides = {})
{
  return {
    item: () => skill,
    isForFriend: () => false,
    subject: () => caster.getBattler(),
    ...overrides,
  };
}

describe('JABS_Action (direct src import)', () =>
{
  let JABS_Action;
  let JABS_Engine;

  beforeAll(async () =>
  {
    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // real Metadata.HitboxPulse gate used by JABS_HitboxPulseManager.syncSustainedActionPulse-
    // kept disabled so postUpdate's pulse sync short-circuits without needing a real PIXI layer.
    J.ABS.Metadata.HitboxPulse = { enabled: false };

    ({ default: JABS_Action } = await import('../../../../../src/plugins/abs/core/models/JABS_Action.js'));
    ({ default: JABS_Engine } = await import('../../../../../src/plugins/abs/core/managers/JABS_Engine.js'));
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    globalThis.$jabsEngine = {
      absEnabled: true,
      clearActionEvents: vi.fn(),
      getCollisionTargets: vi.fn(() => []),
      applyPrimaryBattleEffects: vi.fn(),
      getActionDegrees: vi.fn(() => null),
      getActionThicknessTiles: vi.fn(() => null),
      getTriggerTouchTargets: vi.fn(() => []),
    };
  });

  /** Builds a real JABS_Action through its constructor with sane defaults, override-friendly. */
  function buildAction({ skill, caster, isRetaliation = false, direction = 2, cooldownKey = 'basic', isTerrainDamage = false } = {})
  {
    const resolvedCaster = caster ?? buildCaster();
    const resolvedSkill = skill ?? buildSkill();
    const gameAction = buildGameAction(resolvedSkill, resolvedCaster);
    return new JABS_Action(gameAction, resolvedCaster, isRetaliation, direction, cooldownKey, isTerrainDamage);
  }

  describe('constructor / initMembers', () =>
  {
    it('generates a unique uuid per instance', () =>
    {
      // Arrange & Act
      const first = buildAction();
      const second = buildAction();

      // Assert
      expect(first.getUuid()).not.toBe(second.getUuid());
    });

    it('has not hit any target yet', () =>
    {
      // Arrange & Act
      const action = buildAction();

      // Assert
      expect(action.hasHitAtLeastOneTarget()).toBe(false);
    });

    it('starts with no action sprite bound', () =>
    {
      // Arrange & Act
      const action = buildAction();

      // Assert
      expect(action.getActionSprite()).toBeNull();
    });

    it('starts with no action options set', () =>
    {
      // Arrange & Act
      const action = buildAction();

      // Assert
      expect(action.getActionOptions()).toBeNull();
    });

    it('is not cast-complete when the skill defines a positive cast time', () =>
    {
      // Arrange & Act
      const action = buildAction({ skill: buildSkill({ jabsCastTime: 60 }) });

      // Assert
      expect(action.isCastComplete()).toBe(false);
    });

    it('is cast-complete by default when the skill has no cast time', () =>
    {
      // Arrange & Act
      const action = buildAction({ skill: buildSkill({ jabsCastTime: 0 }) });

      // Assert
      expect(action.isCastComplete()).toBe(true);
    });

    it('resolves the pierce count from the skill', () =>
    {
      // Arrange & Act
      const action = buildAction({ skill: buildSkill({ jabsPierceCount: 4 }) });

      // Assert
      expect(action.getPiercingTimes()).toBe(4);
    });

    it('defaults the cooldown type to the global cooldown key when none is provided', () =>
    {
      // Arrange & Act
      const action = buildAction({ cooldownKey: null });

      // Assert
      expect(action.getCooldownType()).toBe(J.ABS.Globals.GlobalCooldownKey);
    });

    it('uses the provided cooldown key when supplied', () =>
    {
      // Arrange & Act
      const action = buildAction({ cooldownKey: 'special' });

      // Assert
      expect(action.getCooldownType()).toBe('special');
    });

    it('setCooldownType overwrites the cooldown key', () =>
    {
      // Arrange
      const action = buildAction({ cooldownKey: 'special' });

      // Act
      action.setCooldownType('offhand');

      // Assert
      expect(action.getCooldownType()).toBe('offhand');
    });

    it('getCastAnimation reads the tagged cast animation from the base skill', () =>
    {
      // Arrange & Act
      const action = buildAction({ skill: buildSkill({ jabsCastAnimation: 12 }) });

      // Assert
      expect(action.getCastAnimation()).toBe(12);
    });

    it('marks the action as a retaliation when flagged', () =>
    {
      // Arrange & Act
      const action = buildAction({ isRetaliation: true });

      // Assert
      expect(action.isRetaliation()).toBe(true);
    });

    it('marks the action as terrain damage when flagged', () =>
    {
      // Arrange & Act
      const action = buildAction({ isTerrainDamage: true });

      // Assert
      expect(action.isTerrainDamage()).toBe(true);
    });
  });

  describe('makeHitsPerConnectionBonus / getHitsPerConnectionBonus', () =>
  {
    it('sums global and basic-attack bonus hits for a basic attack', () =>
    {
      // Arrange
      const gameBattler = buildGameBattler({ getBonusHitsGlobal: () => 1, getBonusHitsBasic: () => 2, getBonusHitsSkill: () => 99 });
      const caster = buildCaster({ getBattler: () => gameBattler, isSkillIdBasicAttack: () => true });

      // Act
      const action = buildAction({ caster });

      // Assert
      expect(action.getHitsPerConnectionBonus()).toBe(3);
    });

    it('sums global and skill bonus hits for a non-basic skill', () =>
    {
      // Arrange
      const gameBattler = buildGameBattler({ getBonusHitsGlobal: () => 1, getBonusHitsBasic: () => 99, getBonusHitsSkill: () => 2 });
      const caster = buildCaster({ getBattler: () => gameBattler, isSkillIdBasicAttack: () => false });

      // Act
      const action = buildAction({ caster });

      // Assert
      expect(action.getHitsPerConnectionBonus()).toBe(3);
    });

    it('floors a negative combined total at 0', () =>
    {
      // Arrange
      const gameBattler = buildGameBattler({ getBonusHitsGlobal: () => -100 });
      const caster = buildCaster({ getBattler: () => gameBattler });

      // Act
      const action = buildAction({ caster });

      // Assert
      expect(action.getHitsPerConnectionBonus()).toBe(0);
    });
  });

  describe('getUuid / getBaseSkill / getAction', () =>
  {
    it('returns the underlying skill', () =>
    {
      // Arrange
      const skill = buildSkill({ id: 42 });

      // Act
      const action = buildAction({ skill });

      // Assert
      expect(action.getBaseSkill()).toBe(skill);
    });
  });

  describe('getCaster', () =>
  {
    it('returns the designated caster when the AI manager has no live registration', () =>
    {
      // Arrange
      const caster = buildCaster();

      // Act
      const action = buildAction({ caster });

      // Assert
      expect(action.getCaster()).toBe(caster);
    });

    it('prefers the live battler registered with the AI manager over the designated caster', async () =>
    {
      // Arrange
      const { default: JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js');
      const caster = buildCaster();
      const liveCaster = buildCaster();
      JABS_AiManager.getBattlerByUuid = vi.fn(() => liveCaster);

      // Act
      const action = buildAction({ caster });
      const result = action.getCaster();

      // Assert
      expect(result).toBe(liveCaster);

      // cleanup
      JABS_AiManager.getBattlerByUuid = () => null;
    });
  });

  describe('isCastComplete / completeCast', () =>
  {
    it('flags the cast as complete', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsCastTime: 60 }) });

      // Act
      action.completeCast();

      // Assert
      expect(action.isCastComplete()).toBe(true);
    });
  });

  describe('isUnparryable', () =>
  {
    it('returns false when the skill is not tagged unparryable', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsUnparryable: false }) });

      // Act & Assert
      expect(action.isUnparryable()).toBe(false);
    });

    it('returns true when the skill is tagged unparryable', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsUnparryable: true }) });

      // Act & Assert
      expect(action.isUnparryable()).toBe(true);
    });
  });

  describe('isHealing', () =>
  {
    it('returns true for hp recovery damage type', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ damage: { type: 3 } }) });

      // Act & Assert
      expect(action.isHealing()).toBe(true);
    });

    it('returns true for mp recovery damage type', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ damage: { type: 4 } }) });

      // Act & Assert
      expect(action.isHealing()).toBe(true);
    });

    it('returns false for hp damage type', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ damage: { type: 1 } }) });

      // Act & Assert
      expect(action.isHealing()).toBe(false);
    });
  });

  describe('direction / setFacing / getDirectionForVisOffsetTags', () =>
  {
    it('returns the constructor-supplied facing when set', () =>
    {
      // Arrange
      const action = buildAction({ direction: 6 });

      // Act & Assert
      expect(action.direction()).toBe(6);
    });

    it('falls back to the action sprite direction when facing is falsy', () =>
    {
      // Arrange
      const action = buildAction({ direction: 0 });
      action.setActionSprite({ direction: () => 8 });

      // Act & Assert
      expect(action.direction()).toBe(8);
    });

    it('overrides the facing via setFacing', () =>
    {
      // Arrange
      const action = buildAction({ direction: 2 });

      // Act
      action.setFacing(4);

      // Assert
      expect(action.direction()).toBe(4);
    });

    it('mirrors direction() for getDirectionForVisOffsetTags', () =>
    {
      // Arrange
      const action = buildAction({ direction: 7 });

      // Act & Assert
      expect(action.getDirectionForVisOffsetTags()).toBe(7);
    });
  });

  describe('collectSyntheticVisualNoteFromActionEventPage (static)', () =>
  {
    it('returns the empty string when there is no event note and no page', () =>
    {
      // Arrange & Act
      const result = JABS_Action.collectSyntheticVisualNoteFromActionEventPage(null, null);

      // Assert
      expect(result).toBe(String.empty);
    });

    it('includes the trimmed event note when present', () =>
    {
      // Arrange & Act
      const result = JABS_Action.collectSyntheticVisualNoteFromActionEventPage({ note: '  <visOffset:1>  ' }, null);

      // Assert
      expect(result).toBe('<visOffset:1>');
    });

    it('appends comment command lines from the page', () =>
    {
      // Arrange
      globalThis.Game_Event.getValidCommentCommandsFromPage = vi.fn(() => [ { parameters: [ '<visOffsetU:2>' ] } ]);

      // Act
      const result = JABS_Action.collectSyntheticVisualNoteFromActionEventPage(null, { list: [ {} ] });

      // Assert
      expect(result).toBe('<visOffsetU:2>');
    });
  });

  describe('stampActionMapVisualNoteFromActionEvent / getActionMapVisualNoteHolder', () =>
  {
    it('leaves the holder null when nothing synthesizes', () =>
    {
      // Arrange
      const action = buildAction();

      // Act
      action.stampActionMapVisualNoteFromActionEvent(null, null);

      // Assert
      expect(action.getActionMapVisualNoteHolder()).toBeNull();
    });

    it('stamps the holder with the synthesized note when present', () =>
    {
      // Arrange
      const action = buildAction();

      // Act
      action.stampActionMapVisualNoteFromActionEvent({ note: '<visOffset:1>' }, null);

      // Assert
      expect(action.getActionMapVisualNoteHolder()).toEqual({ note: '<visOffset:1>' });
    });
  });

  describe('getDuration / getMaxDuration / countdownDuration / isActionExpired', () =>
  {
    it('starts with a duration of 0', () =>
    {
      // Arrange & Act
      const action = buildAction();

      // Assert
      expect(action.getDuration()).toBe(0);
    });

    it('scales the base skill duration by the caster\'s projectile duration modifier', () =>
    {
      // Arrange
      const gameBattler = buildGameBattler({ getProjectileDurationModifier: () => 2 });
      const caster = buildCaster({ getBattler: () => gameBattler });
      const action = buildAction({ caster, skill: buildSkill({ jabsDuration: 20 }) });

      // Act & Assert
      expect(action.getMaxDuration()).toBe(40);
    });

    it('enforces the minimum duration floor', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsDuration: 1 }) });

      // Act & Assert
      expect(action.getMaxDuration()).toBe(JABS_Action.getMinimumDuration());
    });

    it('flags the action for removal once duration reaches the max', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsDuration: 8 }) });

      // Act
      for (let i = 0; i < 8; i++)
      {
        action.countdownDuration();
      }

      // Assert
      expect(action.getNeedsRemoval()).toBe(true);
    });

    it('is not expired before the minimum duration has elapsed, even past max duration', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsDuration: 8 }) });

      // Act: max duration is the 8-frame floor; expiry additionally requires > minimum elapsed.
      for (let i = 0; i < 8; i++)
      {
        action.countdownDuration();
      }

      // Assert
      expect(action.isActionExpired()).toBe(false);
    });

    it('does not flag removal while the action is still well short of its max duration', () =>
    {
      // Arrange- the sibling case above only ever counted all the way to the max, so the
      // duration comparison could answer "spent" on every single frame unnoticed.
      const action = buildAction({ skill: buildSkill({ jabsDuration: 100 }) });

      // Act
      action.countdownDuration();

      // Assert
      expect(action.getNeedsRemoval()).toBe(false);
    });

    it('is not expired past the minimum duration while max duration still remains', () =>
    {
      // Arrange- the other non-expired case sits below the minimum-duration floor, which answers
      // "not expired" all by itself. Nine frames clears the floor, so only the max-duration
      // comparison can still be what keeps this alive.
      const action = buildAction({ skill: buildSkill({ jabsDuration: 100 }) });

      // Act
      for (let i = 0; i < 9; i++)
      {
        action.countdownDuration();
      }

      // Assert
      expect(action.isActionExpired()).toBe(false);
    });
  });

  describe('getNeedsRemoval / setNeedsRemoval', () =>
  {
    it('defaults to not needing removal', () =>
    {
      // Arrange & Act
      const action = buildAction();

      // Assert
      expect(action.getNeedsRemoval()).toBe(false);
    });

    it('can be explicitly cleared after being set', () =>
    {
      // Arrange
      const action = buildAction();
      action.setNeedsRemoval();

      // Act
      action.setNeedsRemoval(false);

      // Assert
      expect(action.getNeedsRemoval()).toBe(false);
    });
  });

  describe('getActionSprite / setActionSprite', () =>
  {
    it('binds and returns the action sprite', () =>
    {
      // Arrange
      const action = buildAction();
      const sprite = { id: 'sprite' };

      // Act
      action.setActionSprite(sprite);

      // Assert
      expect(action.getActionSprite()).toBe(sprite);
    });
  });

  describe('getActionOptions / setActionOptions', () =>
  {
    it('binds and returns the action options', () =>
    {
      // Arrange
      const action = buildAction();
      const options = { id: 'options' };

      // Act
      action.setActionOptions(options);

      // Assert
      expect(action.getActionOptions()).toBe(options);
    });
  });

  describe('delay: countdownDelay / isDelayCompleted / endDelay / isEndlessDelay / triggerOnTouch / getTriggerRadius', () =>
  {
    it('is not yet delay-completed at construction, even with no configured delay duration', () =>
    {
      // Arrange & Act: the underlying JABS_Timer only flips complete once it has actually ticked.
      const action = buildAction({ skill: buildSkill({ jabsDelayDuration: 0 }) });

      // Assert
      expect(action.isDelayCompleted()).toBe(false);
    });

    it('becomes delay-completed after a single tick when the skill has no delay duration', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsDelayDuration: 0 }) });

      // Act
      action.countdownDelay();

      // Assert
      expect(action.isDelayCompleted()).toBe(true);
    });

    it('is not delay-completed while the delay timer is still running', () =>
    {
      // Arrange & Act
      const action = buildAction({ skill: buildSkill({ jabsDelayDuration: 10 }) });

      // Assert
      expect(action.isDelayCompleted()).toBe(false);
    });

    it('counts down the delay timer to completion', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsDelayDuration: 2 }) });

      // Act
      action.countdownDelay();
      action.countdownDelay();

      // Assert
      expect(action.isDelayCompleted()).toBe(true);
    });

    it('is considered delay-completed once it has hit at least one target, regardless of the timer', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsDelayDuration: 100 }) });
      action.onFirstCollision();

      // Act & Assert
      expect(action.isDelayCompleted()).toBe(true);
    });

    it('force-completes the delay via endDelay', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsDelayDuration: 100 }) });

      // Act
      action.endDelay();

      // Assert
      expect(action.isDelayCompleted()).toBe(true);
    });

    it('never delay-completes an endless-delay action even after endDelay is not called', () =>
    {
      // Arrange & Act: a max time of -1 signals endless delay.
      const action = buildAction({ skill: buildSkill({ jabsDelayDuration: -1 }) });

      // Assert
      expect(action.isEndlessDelay()).toBe(true);
      expect(action.isDelayCompleted()).toBe(false);
    });

    it('is configured to trigger on touch when the skill is tagged for it', () =>
    {
      // Arrange & Act
      const action = buildAction({ skill: buildSkill({ jabsDelayTriggerByTouch: true }) });

      // Assert
      expect(action.triggerOnTouch()).toBe(true);
    });

    it('always triggers on touch when the delay is endless, regardless of the touch tag', () =>
    {
      // Arrange & Act
      const action = buildAction({ skill: buildSkill({ jabsDelayDuration: -1, jabsDelayTriggerByTouch: false }) });

      // Assert
      expect(action.triggerOnTouch()).toBe(true);
    });

    it('does not trigger on touch when neither the tag nor an endless delay applies', () =>
    {
      // Arrange- both operands of the touch decision were only ever exercised on their true side,
      // so either one could have been carrying the whole condition on its own.
      const action = buildAction({
        skill: buildSkill({ jabsDelayDuration: 10, jabsDelayTriggerByTouch: false }),
      });

      // Act & Assert
      expect(action.triggerOnTouch()).toBe(false);
    });

    it('returns null trigger radius when the skill has none configured', () =>
    {
      // Arrange & Act
      const action = buildAction({ skill: buildSkill({ jabsDelayTriggerRadius: null }) });

      // Assert
      expect(action.getTriggerRadius()).toBeNull();
    });

    it('returns the configured trigger radius', () =>
    {
      // Arrange & Act
      const action = buildAction({ skill: buildSkill({ jabsDelayTriggerRadius: 3 }) });

      // Assert
      expect(action.getTriggerRadius()).toBe(3);
    });
  });

  describe('piercing: getPiercingTimes / decrementPierceTimes / isPierceReady / countdownPierceDelay / resetPierceDelay', () =>
  {
    it('decrements the remaining pierce count', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsPierceCount: 3 }) });

      // Act
      action.decrementPierceTimes();

      // Assert
      expect(action.getPiercingTimes()).toBe(2);
    });

    it('starts lingering once the pierce count is exhausted', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsPierceCount: 1 }) });

      // Act
      action.decrementPierceTimes();

      // Assert- the old assertions here only proved the counter moved, never that exhausting it
      // actually transitioned the action into its linger phase.
      expect(action.isLingering()).toBe(true);
      expect(action.getNeedsRemoval()).toBe(false);
    });

    it('does not start lingering while pierce hits still remain', () =>
    {
      // Arrange- three hits authored, one spent, two left.
      const action = buildAction({ skill: buildSkill({ jabsPierceCount: 3 }) });

      // Act
      action.decrementPierceTimes();

      // Assert- an exhaustion check that always answers "spent" would linger this action on its
      // very first hit, ending a three-pierce skill two connections early.
      expect(action.isLingering()).toBe(false);
    });

    it('is pierce-ready once the pierce delay timer completes', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsPierceDelay: 2 }) });
      action.resetPierceDelay();

      // Act
      action.countdownPierceDelay();
      action.countdownPierceDelay();

      // Assert
      expect(action.isPierceReady()).toBe(true);
    });

    it('skips the pierce delay tick while the action sprite is hitstopped', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsPierceDelay: 2 }) });
      action.resetPierceDelay();
      action.setActionSprite({ isHitstopped: () => true });

      // Act
      action.countdownPierceDelay();
      action.countdownPierceDelay();

      // Assert
      expect(action.isPierceReady()).toBe(false);
    });
  });

  describe('self / on-cast animation hooks', () =>
  {
    it('reports no self animation id by default', () =>
    {
      // Arrange & Act
      const action = buildAction();

      // Assert
      expect(action.hasSelfAnimationId()).toBe(false);
    });

    it('reports a self animation id when tagged', () =>
    {
      // Arrange & Act
      const action = buildAction({ skill: buildSkill({ jabsSelfAnimationId: 5 }) });

      // Assert
      expect(action.hasSelfAnimationId()).toBe(true);
      expect(action.getSelfAnimationId()).toBe(5);
    });

    it('defaults self animation id to 0 when the skill has no tag at all (untagged, not just falsy)', () =>
    {
      // Arrange & Act
      const action = buildAction({ skill: buildSkill({ jabsSelfAnimationId: null }) });

      // Assert
      expect(action.getSelfAnimationId()).toBe(0);
    });

    it('requests the self animation on the action sprite when performed', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsSelfAnimationId: 5 }) });
      const sprite = { requestAnimation: vi.fn() };
      action.setActionSprite(sprite);

      // Act
      action.performSelfAnimation();

      // Assert
      expect(sprite.requestAnimation).toHaveBeenCalledWith(5);
    });

    it('does not request the self animation twice', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsSelfAnimationId: 5 }) });
      const sprite = { requestAnimation: vi.fn() };
      action.setActionSprite(sprite);

      // Act
      action.performSelfAnimation();
      action.performSelfAnimation();

      // Assert
      expect(sprite.requestAnimation).toHaveBeenCalledTimes(1);
    });

    it('does nothing when performing the self animation without an action sprite', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsSelfAnimationId: 5 }) });

      // Act & Assert: no throw means the missing-sprite guard was taken.
      expect(() => action.performSelfAnimation()).not.toThrow();
    });

    it('reports no on-cast animation id by default', () =>
    {
      // Arrange & Act
      const action = buildAction();

      // Assert
      expect(action.hasOnCastAnimationId()).toBe(false);
    });

    it('defaults on-cast animation id to 0 when the skill has no tag at all (untagged, not just falsy)', () =>
    {
      // Arrange & Act
      const action = buildAction({ skill: buildSkill({ jabsOnCastAnimationId: null }) });

      // Assert
      expect(action.hasOnCastAnimationId()).toBe(false);
    });

    it('performs the on-cast animation on the given caster override', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsOnCastAnimationId: 7 }) });
      const character = { requestAnimation: vi.fn() };
      const overrideCaster = buildCaster({ getCharacter: () => character });

      // Act
      action.performOnCastAnimation(overrideCaster);

      // Assert
      expect(character.requestAnimation).toHaveBeenCalledWith(7);
    });

    it('does nothing when there is no on-cast animation id, even with a valid caster', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsOnCastAnimationId: 0 }) });
      const character = { requestAnimation: vi.fn() };
      const overrideCaster = buildCaster({ getCharacter: () => character });

      // Act
      action.performOnCastAnimation(overrideCaster);

      // Assert
      expect(character.requestAnimation).not.toHaveBeenCalled();
    });

    it('does nothing when performing the on-cast animation without any caster', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsOnCastAnimationId: 7 }) });

      // Act & Assert: no throw means the missing-caster guard was taken.
      // note: getCaster() always resolves to the designated caster or a live AI registration,
      // so this exercises the "falsy override, but a real default caster" path instead.
      expect(() => action.performOnCastAnimation(null)).not.toThrow();
    });

    it('handles the self animation on defeat when tagged and an action sprite exists', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsSelfAnimationId: 9 }) });
      const sprite = { requestAnimation: vi.fn() };
      action.setActionSprite(sprite);

      // Act
      action.handleSelfAnimationOnDefeat();

      // Assert
      expect(sprite.requestAnimation).toHaveBeenCalledWith(9);
    });

    it('releases the sustained hitbox pulse and handles the defeat animation on preCleanupHook', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsSelfAnimationId: 9 }) });
      const sprite = { requestAnimation: vi.fn() };
      action.setActionSprite(sprite);

      // Act & Assert: no throw means both sub-hooks ran cleanly.
      expect(() => action.preCleanupHook()).not.toThrow();
      expect(sprite.requestAnimation).toHaveBeenCalledWith(9);
    });
  });

  describe('update lifecycle', () =>
  {
    it('does not run the main update while a touch-triggered action is still delaying', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsDelayDuration: 100, jabsDelayTriggerByTouch: false }) });

      // Act
      action.update();

      // Assert
      expect(action.getDuration()).toBe(0);
    });

    it('canMainUpdate is false for a non-touch action whose delay has not completed', () =>
    {
      // Arrange- the predicate itself, tested apart from its caller: nothing ever asserted it
      // answered false, so a version that always green-lit the update read identically.
      const action = buildAction({ skill: buildSkill({ jabsDelayDuration: 100, jabsDelayTriggerByTouch: false }) });

      // Act & Assert
      expect(action.canMainUpdate()).toBe(false);
    });

    it('never reaches collision while the main-update gate stays closed', () =>
    {
      // Arrange- duration staying at 0 was not enough to pin the gate: the un-completed delay
      // independently suppresses the countdown, so an ignored gate looked identical. Collision is
      // reachable on the second frame once the pierce delay ticks, which is what this catches.
      const action = buildAction({
        skill: buildSkill({ jabsDelayDuration: 100, jabsDelayTriggerByTouch: false, jabsPierceDelay: 0 }),
      });

      // Act
      action.update();
      action.update();

      // Assert
      expect(globalThis.$jabsEngine.getCollisionTargets).not.toHaveBeenCalled();
    });

    it('does not count down duration while a touch-triggered action is still delaying', () =>
    {
      // Arrange- touch-triggering opens the main-update gate, so the action genuinely runs its
      // update body. The only thing withholding the duration countdown is the delay check.
      const action = buildAction({
        skill: buildSkill({ jabsDelayDuration: 100, jabsDelayTriggerByTouch: true, jabsDuration: 100 }),
      });

      // Act
      action.update();

      // Assert
      expect(action.getDuration()).toBe(0);
    });

    it('counts down duration once the delay has completed', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsDelayDuration: 0, jabsDuration: 100 }) });

      // Act
      action.update();

      // Assert
      expect(action.getDuration()).toBe(1);
    });

    it('processes collision once past the pierce delay with collision enabled', () =>
    {
      // Arrange: both the delay and pierce-delay timers need one full tick each to flip
      // complete, so the first update() only advances them- the second is what actually collides.
      const action = buildAction({ skill: buildSkill({ jabsDelayDuration: 0, jabsDuration: 100, jabsPierceDelay: 0 }) });

      // Act
      action.update();
      action.update();

      // Assert
      expect(globalThis.$jabsEngine.getCollisionTargets).toHaveBeenCalledWith(action);
    });

    it('does not process collision while still counting down the pierce delay', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsDelayDuration: 0, jabsDuration: 100, jabsPierceDelay: 100 }) });

      // Act
      action.update();

      // Assert
      expect(globalThis.$jabsEngine.getCollisionTargets).not.toHaveBeenCalled();
    });

    it('updates the linger timer instead of colliding while lingering', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsDelayDuration: 0, jabsDuration: 100, jabsLinger: 5 }) });
      action.startLinger();

      // Act
      action.update();

      // Assert
      expect(globalThis.$jabsEngine.getCollisionTargets).not.toHaveBeenCalled();
    });

    it('cleans up and flags removal once the linger window elapses', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsDelayDuration: 0, jabsDuration: 100, jabsLinger: 1 }) });
      action.startLinger();

      // Act
      action.update();

      // Assert
      expect(action.getNeedsRemoval()).toBe(true);
      expect(globalThis.$jabsEngine.clearActionEvents).toHaveBeenCalled();
    });

    it('starts lingering automatically once the action expires past the minimum duration', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsDelayDuration: 0, jabsDuration: 8 }) });

      // Act: drive well past both the max duration and the minimum-duration floor.
      for (let i = 0; i < 20; i++)
      {
        action.update();
      }

      // Assert- removal alone is ambiguous: the duration countdown flags removal on its own at
      // the max, so only the linger phase actually proves the transition happened here.
      expect(action.isLingering()).toBe(true);
      expect(action.getNeedsRemoval()).toBe(true);
    });

    it('keeps the action sprite anchored to a frozen target location for a direct action', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsDirect: true, jabsDelayDuration: 0, jabsDuration: 100 }) });
      const sprite = { _realX: 99, _realY: 88, _x: 3, _y: 3, isHitstopped: () => false };
      action.setActionSprite(sprite);
      action.setActionOptions({
        getTargetLocation: () => ({ getX: () => 5, getY: () => 5 }),
      });

      // Act
      action.update();

      // Assert: frozen target location present, so the sprite should NOT be re-anchored to the caster.
      expect(sprite._realX).toBe(99);
      expect(sprite._realY).toBe(88);
    });

    it('re-anchors a direct action sprite to the caster when there is no frozen target location', () =>
    {
      // Arrange
      const character = { _realX: 41, _realY: 42, _x: 41, _y: 42, requestAnimation: vi.fn() };
      const caster = buildCaster({ getCharacter: () => character });
      const action = buildAction({
        caster,
        skill: buildSkill({ jabsDirect: true, jabsDelayDuration: 0, jabsDuration: 100 }),
      });
      const sprite = { _realX: 0, _realY: 0, _x: 0, _y: 0, isHitstopped: () => false };
      action.setActionSprite(sprite);

      // Act
      action.update();

      // Assert
      expect(sprite._realX).toBe(41);
      expect(sprite._realY).toBe(42);
    });

    it('re-anchors to the caster when the frozen location resolves an X but no Y', () =>
    {
      // Arrange- a half-resolved target tile. Both coordinate checks were only ever satisfied
      // together, so either one could have been carrying the whole "leave it in place" decision.
      const character = { _realX: 41, _realY: 42, _x: 41, _y: 42, requestAnimation: vi.fn() };
      const caster = buildCaster({ getCharacter: () => character });
      const action = buildAction({
        caster,
        skill: buildSkill({ jabsDirect: true, jabsDelayDuration: 0, jabsDuration: 100 }),
      });
      const sprite = { _realX: 0, _realY: 0, _x: 0, _y: 0, isHitstopped: () => false };
      action.setActionSprite(sprite);
      action.setActionOptions({
        getTargetLocation: () => ({
          getX: () => 5,
          getY: () => null,
        }),
      });

      // Act
      action.update();

      // Assert- an incomplete tile is not a tile; body-anchoring is the correct fallback.
      expect(sprite._realX).toBe(41);
      expect(sprite._realY).toBe(42);
    });

    it('re-anchors to the caster when the frozen location resolves a Y but no X', () =>
    {
      // Arrange- the mirror of the case above, isolating the other coordinate check.
      const character = { _realX: 41, _realY: 42, _x: 41, _y: 42, requestAnimation: vi.fn() };
      const caster = buildCaster({ getCharacter: () => character });
      const action = buildAction({
        caster,
        skill: buildSkill({ jabsDirect: true, jabsDelayDuration: 0, jabsDuration: 100 }),
      });
      const sprite = { _realX: 0, _realY: 0, _x: 0, _y: 0, isHitstopped: () => false };
      action.setActionSprite(sprite);
      action.setActionOptions({
        getTargetLocation: () => ({
          getX: () => null,
          getY: () => 5,
        }),
      });

      // Act
      action.update();

      // Assert
      expect(sprite._realX).toBe(41);
      expect(sprite._realY).toBe(42);
    });

    it('does not sync sprite position for a non-direct action', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsDirect: false, jabsDelayDuration: 0, jabsDuration: 100 }) });
      const sprite = { _realX: 7, _realY: 7, _x: 7, _y: 7, isHitstopped: () => false };
      action.setActionSprite(sprite);

      // Act & Assert: no throw means syncDirectActionSpriteToCaster's early return was taken.
      expect(() => action.update()).not.toThrow();
      expect(sprite._realX).toBe(7);
    });

    it('does nothing for touch-triggering delay checks when there is no action sprite yet', () =>
    {
      // Arrange
      const action = buildAction({
        skill: buildSkill({ jabsDelayDuration: 100, jabsDelayTriggerByTouch: true, jabsDelayTriggerRadius: 2 }),
      });

      // Act & Assert: no throw means the missing-action-sprite guard was taken.
      expect(() => action.checkTriggerTouchAndArm()).not.toThrow();
      expect(action.isDelayCompleted()).toBe(false);
    });

    it('arms a touch-triggered action early when a target enters the trigger radius', () =>
    {
      // Arrange- the fully-working baseline the two refusals below are measured against: delay
      // still running, touch-triggering on, a radius authored, a sprite to anchor the query, and
      // the engine reporting somebody inside the ring.
      const action = buildAction({
        skill: buildSkill({ jabsDelayDuration: 100, jabsDelayTriggerByTouch: true, jabsDelayTriggerRadius: 3 }),
      });
      action.setActionSprite({ id: 'sprite' });
      globalThis.$jabsEngine.getTriggerTouchTargets = vi.fn(() => [ { id: 'victim' } ]);

      // Act
      action.checkTriggerTouchAndArm();

      // Assert
      expect(action.isDelayCompleted()).toBe(true);
    });

    it('does not re-query trigger targets once the delay has already completed', () =>
    {
      // Arrange- identical to the baseline above but for the delay already being finished. The
      // engine query is the observable, because a completed delay cannot be "completed again"
      // and isDelayCompleted() would read true either way.
      const action = buildAction({
        skill: buildSkill({ jabsDelayDuration: 100, jabsDelayTriggerByTouch: true, jabsDelayTriggerRadius: 3 }),
      });
      action.setActionSprite({ id: 'sprite' });
      globalThis.$jabsEngine.getTriggerTouchTargets = vi.fn(() => [ { id: 'victim' } ]);
      action.endDelay();

      // Act
      action.checkTriggerTouchAndArm();

      // Assert
      expect(globalThis.$jabsEngine.getTriggerTouchTargets).not.toHaveBeenCalled();
    });

    it('does not query trigger targets for an action that is not touch-triggered', () =>
    {
      // Arrange- the baseline with exactly one flip: the touch tag is off and the delay is finite,
      // so nothing forces touch-triggering on. A radius is still authored, so only the
      // touch-trigger check can be what keeps the engine from being asked.
      const action = buildAction({
        skill: buildSkill({ jabsDelayDuration: 100, jabsDelayTriggerByTouch: false, jabsDelayTriggerRadius: 3 }),
      });
      action.setActionSprite({ id: 'sprite' });
      globalThis.$jabsEngine.getTriggerTouchTargets = vi.fn(() => [ { id: 'victim' } ]);

      // Act
      action.checkTriggerTouchAndArm();

      // Assert
      expect(globalThis.$jabsEngine.getTriggerTouchTargets).not.toHaveBeenCalled();
      expect(action.isDelayCompleted()).toBe(false);
    });

    it('does not sync sprite position for a direct action with no action sprite yet', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsDirect: true }) });

      // Act & Assert: no throw means syncDirectActionSpriteToCaster's missing-sprite guard was taken.
      expect(() => action.syncDirectActionSpriteToCaster()).not.toThrow();
    });

    it('arms the delay early when a touch-triggering action finds a candidate in its trigger radius', () =>
    {
      // Arrange
      const target = buildCaster();
      globalThis.$jabsEngine.getTriggerTouchTargets = vi.fn(() => [ target ]);
      const action = buildAction({
        skill: buildSkill({ jabsDelayDuration: 100, jabsDelayTriggerByTouch: true, jabsDelayTriggerRadius: 2 }),
      });
      action.setActionSprite({ _realX: 0, _realY: 0, isHitstopped: () => false });

      // Act
      action.update();

      // Assert
      expect(action.isDelayCompleted()).toBe(true);
    });

    it('does not arm the delay early when no candidates are found in the trigger radius', () =>
    {
      // Arrange
      globalThis.$jabsEngine.getTriggerTouchTargets = vi.fn(() => []);
      const action = buildAction({
        skill: buildSkill({ jabsDelayDuration: 100, jabsDelayTriggerByTouch: true, jabsDelayTriggerRadius: 2 }),
      });
      action.setActionSprite({ _realX: 0, _realY: 0, isHitstopped: () => false });

      // Act
      action.update();

      // Assert
      expect(action.isDelayCompleted()).toBe(false);
    });

    it('does not attempt to arm the delay when no trigger radius is configured', () =>
    {
      // Arrange
      const action = buildAction({
        skill: buildSkill({ jabsDelayDuration: 100, jabsDelayTriggerByTouch: true, jabsDelayTriggerRadius: null }),
      });
      action.setActionSprite({ _realX: 0, _realY: 0, isHitstopped: () => false });

      // Act & Assert: no throw means the null-radius guard was taken before touching $jabsEngine.
      expect(() => action.update()).not.toThrow();
      expect(globalThis.$jabsEngine.getTriggerTouchTargets).not.toHaveBeenCalled();
    });

    it('does not attempt to arm the delay when there is no action sprite yet', () =>
    {
      // Arrange
      const action = buildAction({
        skill: buildSkill({ jabsDelayDuration: 100, jabsDelayTriggerByTouch: true, jabsDelayTriggerRadius: 2 }),
      });

      // Act & Assert
      expect(() => action.update()).not.toThrow();
      expect(globalThis.$jabsEngine.getTriggerTouchTargets).not.toHaveBeenCalled();
    });
  });

  describe('processCollision / onCollision / onFirstCollision', () =>
  {
    it('does nothing when there are no collision targets', () =>
    {
      // Arrange
      globalThis.$jabsEngine.getCollisionTargets = vi.fn(() => []);
      const action = buildAction();

      // Act
      action.processCollision();

      // Assert
      expect(globalThis.$jabsEngine.applyPrimaryBattleEffects).not.toHaveBeenCalled();
    });

    it('applies battle effects once per target by default', () =>
    {
      // Arrange
      const target = { isDead: () => false, getBattler: () => ({ result: () => ({ parried: false }) }) };
      globalThis.$jabsEngine.getCollisionTargets = vi.fn(() => [ target ]);
      const action = buildAction();

      // Act
      action.processCollision();

      // Assert
      expect(globalThis.$jabsEngine.applyPrimaryBattleEffects).toHaveBeenCalledTimes(1);
      expect(globalThis.$jabsEngine.applyPrimaryBattleEffects).toHaveBeenCalledWith(action, target);
    });

    it('applies battle effects multiple times per target when bonus hits are configured', () =>
    {
      // Arrange
      const target = { isDead: () => false, getBattler: () => ({ result: () => ({ parried: false }) }) };
      globalThis.$jabsEngine.getCollisionTargets = vi.fn(() => [ target ]);
      const gameBattler = buildGameBattler({ getBonusHitsGlobal: () => 2 });
      const caster = buildCaster({ getBattler: () => gameBattler });
      const action = buildAction({ caster });

      // Act
      action.processCollision();

      // Assert: 1 base hit + 2 bonus hits = 3 applications.
      expect(globalThis.$jabsEngine.applyPrimaryBattleEffects).toHaveBeenCalledTimes(3);
    });

    it('stops applying further hits to a target once it dies mid-pierce', () =>
    {
      // Arrange
      let dead = false;
      const target = {
        isDead: () => dead,
        getBattler: () => ({ result: () => ({ parried: false }) }),
      };
      globalThis.$jabsEngine.getCollisionTargets = vi.fn(() => [ target ]);
      globalThis.$jabsEngine.applyPrimaryBattleEffects = vi.fn(() =>
      {
        dead = true;
      });
      const gameBattler = buildGameBattler({ getBonusHitsGlobal: () => 5 });
      const caster = buildCaster({ getBattler: () => gameBattler });
      const action = buildAction({ caster });

      // Act
      action.processCollision();

      // Assert: died after the first application, so no further hits landed.
      expect(globalThis.$jabsEngine.applyPrimaryBattleEffects).toHaveBeenCalledTimes(1);
    });

    it('stops applying further hits to a target once the first application is parried', () =>
    {
      // Arrange
      const target = { isDead: () => false, getBattler: () => ({ result: () => ({ parried: true }) }) };
      globalThis.$jabsEngine.getCollisionTargets = vi.fn(() => [ target ]);
      const gameBattler = buildGameBattler({ getBonusHitsGlobal: () => 5 });
      const caster = buildCaster({ getBattler: () => gameBattler });
      const action = buildAction({ caster });

      // Act
      action.processCollision();

      // Assert
      expect(globalThis.$jabsEngine.applyPrimaryBattleEffects).toHaveBeenCalledTimes(1);
    });

    it('ends the delay, resets the pierce delay, and decrements pierce count on collision', () =>
    {
      // Arrange
      const target = { isDead: () => false, getBattler: () => ({ result: () => ({ parried: false }) }) };
      globalThis.$jabsEngine.getCollisionTargets = vi.fn(() => [ target ]);
      const action = buildAction({ skill: buildSkill({ jabsPierceCount: 5, jabsDelayDuration: 100 }) });

      // Act
      action.processCollision();

      // Assert
      expect(action.isDelayCompleted()).toBe(true);
      expect(action.getPiercingTimes()).toBe(4);
    });

    it('flags the first-hit tracker only on the first collision', () =>
    {
      // Arrange
      const target = { isDead: () => false, getBattler: () => ({ result: () => ({ parried: false }) }) };
      globalThis.$jabsEngine.getCollisionTargets = vi.fn(() => [ target ]);
      const action = buildAction({ skill: buildSkill({ jabsPierceCount: 5 }) });

      // Act
      action.processCollision();

      // Assert
      expect(action.hasHitAtLeastOneTarget()).toBe(true);
    });

    it('does not re-fire first-collision logic on a second collision', () =>
    {
      // Arrange
      const target = { isDead: () => false, getBattler: () => ({ result: () => ({ parried: false }) }) };
      globalThis.$jabsEngine.getCollisionTargets = vi.fn(() => [ target ]);
      const action = buildAction({ skill: buildSkill({ jabsPierceCount: 5 }) });
      const onFirstCollisionSpy = vi.spyOn(action, 'onFirstCollision');

      // Act
      action.processCollision();
      onFirstCollisionSpy.mockClear();
      action.processCollision();

      // Assert
      expect(onFirstCollisionSpy).not.toHaveBeenCalled();
    });
  });

  describe('getThisRangeBuff / getThisRadiusBuff / getThisProximityBuff / getThisThicknessBuff', () =>
  {
    it.each([
      [ 'getThisRangeBuff', '<thisRangeBuff:2>' ],
      [ 'getThisRadiusBuff', '<thisRadiusBuff:3>' ],
      [ 'getThisProximityBuff', '<thisProximityBuff:1>' ],
      [ 'getThisThicknessBuff', '<thisThicknessBuff:4>' ],
    ])('%s sums the tagged buff from the skill\'s own note', (method, note) =>
    {
      const action = buildAction({ skill: buildSkill({ note }) });
      expect(action[method]()).toBeGreaterThan(0);
    });

    it.each([
      [ 'getThisRangeBuff' ], [ 'getThisRadiusBuff' ], [ 'getThisProximityBuff' ], [ 'getThisThicknessBuff' ],
    ])('%s defaults to 0 when untagged', (method) =>
    {
      const action = buildAction();
      expect(action[method]()).toBe(0);
    });
  });

  describe('getThisRangeRate / getThisRadiusRate / getThisProximityRate / getThisThicknessRate', () =>
  {
    it.each([
      [ 'getThisRangeRate', '<thisRangeRate:1.5>' ],
      [ 'getThisRadiusRate', '<thisRadiusRate:2>' ],
      [ 'getThisProximityRate', '<thisProximityRate:1.2>' ],
      [ 'getThisThicknessRate', '<thisThicknessRate:3>' ],
    ])('%s sums (rate - 1.0) deltas from the skill\'s own note', (method, note) =>
    {
      const action = buildAction({ skill: buildSkill({ note }) });
      expect(action[method]()).toBeGreaterThan(0);
    });

    it.each([
      [ 'getThisRangeRate' ], [ 'getThisRadiusRate' ], [ 'getThisProximityRate' ], [ 'getThisThicknessRate' ],
    ])('%s defaults to 0 when untagged', (method) =>
    {
      const action = buildAction();
      expect(action[method]()).toBe(0);
    });
  });

  describe('composeHitboxPulsePlainOptions', () =>
  {
    it('anchors on the melee visual origin when there is no action sprite', () =>
    {
      // Arrange
      vi.spyOn(JABS_Engine, 'getMeleeVisualOriginPixelsFromCharacter').mockReturnValue({ x: 10, y: 20 });
      const action = buildAction({ skill: buildSkill({ jabsShape: 'circle', jabsRadius: 2 }) });

      // Act
      const result = action.composeHitboxPulsePlainOptions();

      // Assert
      expect(result.x).toBe(10);
      expect(result.y).toBe(20);
      expect(result.degrees).toBe(180);
      expect(result.thickness).toBe(1);

      // cleanup
      vi.restoreAllMocks();
    });

    it('anchors on the action origin pixels when an action sprite exists', () =>
    {
      // Arrange
      vi.spyOn(JABS_Engine, 'getActionOriginPixels').mockReturnValue({ x: 55, y: 66 });
      globalThis.$jabsEngine.getActionDegrees = vi.fn(() => 90);
      globalThis.$jabsEngine.getActionThicknessTiles = vi.fn(() => 2);
      const action = buildAction();
      action.setActionSprite({ id: 'sprite' });

      // Act
      const result = action.composeHitboxPulsePlainOptions();

      // Assert
      expect(result.x).toBe(55);
      expect(result.y).toBe(66);
      expect(result.degrees).toBe(90);
      expect(result.thickness).toBe(2);

      // cleanup
      vi.restoreAllMocks();
    });

    it('falls back to 180 degrees and 1 tile thickness when the engine reports falsy values', () =>
    {
      // Arrange
      vi.spyOn(JABS_Engine, 'getActionOriginPixels').mockReturnValue({ x: 1, y: 2 });
      globalThis.$jabsEngine.getActionDegrees = vi.fn(() => 0);
      globalThis.$jabsEngine.getActionThicknessTiles = vi.fn(() => 0);
      const action = buildAction();
      action.setActionSprite({ id: 'sprite' });

      // Act
      const result = action.composeHitboxPulsePlainOptions();

      // Assert
      expect(result.degrees).toBe(180);
      expect(result.thickness).toBe(1);

      // cleanup
      vi.restoreAllMocks();
    });

    it('uses the fade-specific duration/endAlpha/scaleEnd when fade animation is enabled', () =>
    {
      // Arrange
      vi.spyOn(JABS_Engine, 'getMeleeVisualOriginPixelsFromCharacter').mockReturnValue({ x: 0, y: 0 });
      const savedMeta = J.ABS.Metadata.HitboxPulse;
      J.ABS.Metadata.HitboxPulse = {
        useFadeAnimation: true, duration: 30, endAlpha: 0, scaleEnd: 2, startAlpha: 1, scaleStart: 1,
      };
      const action = buildAction();

      // Act
      const result = action.composeHitboxPulsePlainOptions();

      // Assert
      expect(result.duration).toBe(30);
      expect(result.endAlpha).toBe(0);
      expect(result.scaleEnd).toBe(2);

      // cleanup
      J.ABS.Metadata.HitboxPulse = savedMeta;
      vi.restoreAllMocks();
    });

    it('holds the pulse open at its start values when fade animation is disabled', () =>
    {
      // Arrange- deliberately distinct start/end values on both axes. Only the fade-enabled arm
      // was ever asserted, so a fade check stuck on "enabled" would have quietly given every
      // sustained pulse a 30-frame life and faded it out, which is the opposite of sustained.
      vi.spyOn(JABS_Engine, 'getMeleeVisualOriginPixelsFromCharacter')
        .mockReturnValue({
          x: 0,
          y: 0,
        });
      const savedMeta = J.ABS.Metadata.HitboxPulse;
      J.ABS.Metadata.HitboxPulse = {
        useFadeAnimation: false, duration: 30, endAlpha: 0, scaleEnd: 2, startAlpha: 1, scaleStart: 1,
      };
      const action = buildAction();

      // Act
      const result = action.composeHitboxPulsePlainOptions();

      // Assert
      expect(result.duration).toBe(999999);
      expect(result.endAlpha).toBe(1);
      expect(result.scaleEnd).toBe(1);

      // cleanup
      J.ABS.Metadata.HitboxPulse = savedMeta;
      vi.restoreAllMocks();
    });
  });

  describe('postUpdate', () =>
  {
    it('fades the action sprite opacity down while lingering', () =>
    {
      // Arrange
      const action = buildAction({ skill: buildSkill({ jabsLinger: 10 }) });
      const sprite = { setOpacity: vi.fn() };
      action.setActionSprite(sprite);
      action.startLinger();
      action.updateLinger();

      // Act
      action.postUpdate();

      // Assert
      expect(sprite.setOpacity).toHaveBeenCalled();
    });

    it('does nothing to opacity when not lingering', () =>
    {
      // Arrange
      const action = buildAction();
      const sprite = { setOpacity: vi.fn() };
      action.setActionSprite(sprite);

      // Act
      action.postUpdate();

      // Assert
      expect(sprite.setOpacity).not.toHaveBeenCalled();
    });
  });

  describe('isLingering / canUpdateLinger / canProcessCollision / shouldBeginLingering', () =>
  {
    it('is not lingering, updatable-linger, or ready to begin lingering by default', () =>
    {
      const action = buildAction();

      expect(action.isLingering()).toBe(false);
      expect(action.canUpdateLinger()).toBe(false);
      expect(action.canProcessCollision()).toBe(true);
    });

    it('flips lingering/collision state once startLinger runs', () =>
    {
      const action = buildAction();

      action.startLinger();

      expect(action.isLingering()).toBe(true);
      expect(action.canUpdateLinger()).toBe(true);
      expect(action.canProcessCollision()).toBe(false);
    });

    it('is idempotent- calling startLinger again while already lingering changes nothing further', () =>
    {
      const action = buildAction();
      const performSelfAnimationSpy = vi.spyOn(action, 'performSelfAnimation');

      action.startLinger();
      performSelfAnimationSpy.mockClear();
      action.startLinger();

      expect(performSelfAnimationSpy).not.toHaveBeenCalled();
    });

    it('shouldBeginLingering is false before the minimum duration elapses', () =>
    {
      // Arrange- pierce is deliberately spent, which is on its own enough to justify lingering.
      // With the fixture's untouched pierce count, neither half of the "or" below was satisfied
      // and the age gate could be bypassed entirely without changing the answer.
      const action = buildAction({ skill: buildSkill({ jabsDuration: 100, jabsPierceCount: 1 }) });
      action.decrementPierceTimes(1);

      // Act & Assert- too young to linger, no matter what the pierce counter says.
      expect(action.shouldBeginLingering()).toBe(false);
    });

    it('shouldBeginLingering is false past the minimum duration while unexpired with pierce left', () =>
    {
      // Arrange- old enough to be considered, but neither justification applies.
      const action = buildAction({ skill: buildSkill({ jabsDuration: 100, jabsPierceCount: 3 }) });
      for (let i = 0; i < 9; i++)
      {
        action.countdownDuration();
      }

      // Act & Assert- every prior case answered true here, so a condition stuck on true would
      // have retired every action the instant it cleared the minimum-duration floor.
      expect(action.shouldBeginLingering()).toBe(false);
    });

    it('shouldBeginLingering is true once expired past the minimum duration', () =>
    {
      const action = buildAction({ skill: buildSkill({ jabsDuration: 8 }) });
      for (let i = 0; i < 9; i++)
      {
        action.countdownDuration();
      }

      expect(action.shouldBeginLingering()).toBe(true);
    });

    it('shouldBeginLingering is true once out of pierce, even if not otherwise expired', () =>
    {
      const action = buildAction({ skill: buildSkill({ jabsDuration: 100, jabsPierceCount: 1 }) });
      for (let i = 0; i < 8; i++)
      {
        action.countdownDuration();
      }
      action.decrementPierceTimes(1);

      expect(action.shouldBeginLingering()).toBe(true);
    });
  });

  describe('getCurrentLinger / getLingerMaxFrames', () =>
  {
    it('starts at 0 current linger, with the max sourced from the skill\'s linger tag', () =>
    {
      const action = buildAction({ skill: buildSkill({ jabsLinger: 15 }) });

      expect(action.getCurrentLinger()).toBe(0);
      expect(action.getLingerMaxFrames()).toBe(15);
    });

    it('increments current linger by one per updateLinger call', () =>
    {
      const action = buildAction({ skill: buildSkill({ jabsLinger: 15 }) });

      action.startLinger();
      action.updateLinger();
      action.updateLinger();

      expect(action.getCurrentLinger()).toBe(2);
      // the counter advancing says nothing about the window check- a linger that cleaned up on
      // frame one would still report 2 here, because cleanup does not stop the increment.
      expect(action.getNeedsRemoval()).toBe(false);
      expect(globalThis.$jabsEngine.clearActionEvents).not.toHaveBeenCalled();
    });
  });

  describe('scope / cooldown / range / shape getters', () =>
  {
    it('reports a direct action when tagged', () =>
    {
      expect(buildAction({ skill: buildSkill({ jabsDirect: true }) }).isDirectAction()).toBe(true);
    });

    it('reports a non-direct action by default', () =>
    {
      expect(buildAction({ skill: buildSkill({ jabsDirect: undefined }) }).isDirectAction()).toBe(false);
    });

    it('reports a support action when the game action is for a friend', () =>
    {
      const caster = buildCaster();
      const skill = buildSkill();
      const gameAction = buildGameAction(skill, caster, { isForFriend: () => true });
      const action = new JABS_Action(gameAction, caster, false, 2, 'basic', false);
      expect(action.isSupportAction()).toBe(true);
    });

    it('returns the tagged cooldown', () =>
    {
      expect(buildAction({ skill: buildSkill({ jabsCooldown: 30 }) }).getCooldown()).toBe(30);
    });

    it('defaults cooldown to 0 when the skill has no cooldown tag', () =>
    {
      expect(buildAction({ skill: buildSkill({ jabsCooldown: null }) }).getCooldown()).toBe(0);
    });

    it('returns null range when the skill has no radius tag', () =>
    {
      expect(buildAction({ skill: buildSkill({ jabsRadius: null }) }).getRange()).toBeNull();
    });

    it('applies range modifiers when the skill has a radius tag', () =>
    {
      const action = buildAction({ skill: buildSkill({ jabsRadius: 3 }) });
      expect(action.getRange()).toBe(3);
    });

    it('returns the tagged cast time', () =>
    {
      expect(buildAction({ skill: buildSkill({ jabsCastTime: 45 }) }).getCastTime()).toBe(45);
    });

    it('defaults cast time to 0 when the skill has no cast time tag', () =>
    {
      expect(buildAction({ skill: buildSkill({ jabsCastTime: null }) }).getCastTime()).toBe(0);
    });

    it('returns unlimited proximity for self-scoped skills', () =>
    {
      expect(buildAction({ skill: buildSkill({ scope: 11 }) }).getProximity()).toBe(9999);
    });

    it('returns 0 proximity when the skill has no proximity tag', () =>
    {
      // Arrange- a caster carrying a real range buff. With the fixture's all-zero buffs the
      // modifier math returns 0 for an untagged skill anyway, so the untagged check could be
      // skipped and an untagged skill would still report 0 by coincidence.
      const gameBattler = buildGameBattler({ getRangeBuff: () => 4 });
      const caster = buildCaster({ getBattler: () => gameBattler });
      const untagged = buildAction({ caster, skill: buildSkill({ scope: 1, jabsProximity: null }) });
      const tagged = buildAction({ caster, skill: buildSkill({ scope: 1, jabsProximity: 5 }) });

      // Act & Assert- the tagged case anchors that the buff really is reaching the math, so the
      // 0 below is a genuine "no requirement" rather than a do-nothing return.
      expect(tagged.getProximity()).toBe(9);
      expect(untagged.getProximity()).toBe(0);
    });

    it('applies proximity modifiers when the skill has a proximity tag', () =>
    {
      const action = buildAction({ skill: buildSkill({ scope: 1, jabsProximity: 5 }) });
      expect(action.getProximity()).toBe(5);
    });

    it('identifies self scope correctly', () =>
    {
      expect(buildAction({ skill: buildSkill({ scope: 11 }) }).isForSelf()).toBe(true);
      expect(buildAction({ skill: buildSkill({ scope: 1 }) }).isForSelf()).toBe(false);
    });

    it('returns the tagged shape', () =>
    {
      expect(buildAction({ skill: buildSkill({ jabsShape: 'line' }) }).getShape()).toBe('line');
    });

    it('defaults thickness to 1 when the skill has no explicit thickness tag', () =>
    {
      expect(buildAction({ skill: buildSkill({ note: String.empty }) }).getThicknessTiles()).toBe(1);
    });

    it('applies thickness modifiers when the skill has an explicit thickness tag', () =>
    {
      const action = buildAction({ skill: buildSkill({ note: '<thickness:2>' }) });
      expect(action.getThicknessTiles()).toBe(2);
    });
  });

  describe('degrees / knockback / inner radius / action id / aggro getters', () =>
  {
    it('defaults degrees to 180 when untagged', () =>
    {
      expect(buildAction({ skill: buildSkill({ note: String.empty }) }).getDegrees()).toBe(180);
    });

    it('reads a tagged degrees value', () =>
    {
      expect(buildAction({ skill: buildSkill({ note: '<degrees:90>' }) }).getDegrees()).toBe(90);
    });

    it('returns the tagged knockback', () =>
    {
      expect(buildAction({ skill: buildSkill({ jabsKnockback: 4 }) }).getKnockback()).toBe(4);
    });

    it('defaults the inner radius to 0 when untagged', () =>
    {
      expect(buildAction({ skill: buildSkill({ jabsInnerRadius: undefined }) }).getInnerRadius()).toBe(0);
    });

    it('defaults the action id to 1 when untagged', () =>
    {
      expect(buildAction({ skill: buildSkill({ jabsActionId: undefined }) }).getActionId()).toBe(1);
    });

    it('returns the tagged action id', () =>
    {
      expect(buildAction({ skill: buildSkill({ jabsActionId: 9 }) }).getActionId()).toBe(9);
    });

    it('defaults bonus aggro to 0 when untagged', () =>
    {
      expect(buildAction({ skill: buildSkill({ jabsBonusAggro: undefined }) }).bonusAggro()).toBe(0);
    });

    it('returns the tagged bonus aggro', () =>
    {
      expect(buildAction({ skill: buildSkill({ jabsBonusAggro: 15 }) }).bonusAggro()).toBe(15);
    });

    it('defaults aggro multiplier to 1.0 when untagged', () =>
    {
      expect(buildAction({ skill: buildSkill({ jabsAggroMultiplier: undefined }) }).aggroMultiplier()).toBe(1.0);
    });

    it('defaults aggro percent to 0 when untagged', () =>
    {
      expect(buildAction({ skill: buildSkill({ jabsAggroPercent: undefined }) }).aggroPercent()).toBe(0);
    });

    it('defaults not-my-aggro to 0 when untagged', () =>
    {
      expect(buildAction({ skill: buildSkill({ jabsNotMyAggro: undefined }) }).notMyAggro()).toBe(0);
    });

    it('defaults not-my-aggro percent to 0 when untagged', () =>
    {
      expect(buildAction({ skill: buildSkill({ jabsNotMyAggroPercent: undefined }) }).notMyAggroPercent()).toBe(0);
    });
  });

  describe('static Builder', () =>
  {
    it('produces a JABS_ActionBuilder instance', async () =>
    {
      // Arrange
      const { default: JABS_ActionBuilder } = await import('../../../../../src/plugins/abs/core/models/JABS_ActionBuilder.js');

      // Act
      const builder = JABS_Action.Builder();

      // Assert
      expect(builder).toBeInstanceOf(JABS_ActionBuilder);
    });
  });
});
//endregion plugins/abs/core/models/jabs-action.test.js
