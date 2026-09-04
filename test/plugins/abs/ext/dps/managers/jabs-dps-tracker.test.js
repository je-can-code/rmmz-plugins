//region plugins/abs/ext/dps/managers/jabs-dps-tracker.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildAction,
  buildResult,
  buildTarget,
  installCombatFlag,
  installJabsButtonStub,
} from '../_component/fixtures/install-abs-dps-host-globals.js';

describe('JabsDpsTracker (direct src import)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/dps/managers/JabsDpsTracker.js').default} */
  let JabsDpsTracker;

  /** @type {{setInCombat: Function}} */
  let combat;

  /** The rolling window every tracker in this file is built with: five seconds. */
  const WINDOW_FRAMES = 300;

  beforeAll(async () =>
  {
    vi.resetModules();

    String.empty = '';
    installJabsButtonStub();

    const module = await import(
      '../../../../../../src/plugins/abs/ext/dps/managers/JabsDpsTracker.js');
    JabsDpsTracker = module.default;
  });

  beforeEach(() =>
  {
    combat = installCombatFlag(false);
  });

  /**
   * Advances a tracker by a number of frames at the current combat flag.
   * @param {object} tracker The tracker to advance.
   * @param {number} frames How many frames to run.
   */
  function runFrames(tracker, frames)
  {
    for (let i = 0; i < frames; i++)
    {
      tracker.update();
    }
  }

  /**
   * The action and target pairing that passes every filter, so a test only has to change the one
   * thing it is actually about.
   * @param {number} hpDamage How much the hit dealt.
   * @param {string} [casterUuid] Who swung.
   * @returns {{action: object, target: object}} The landed hit.
   */
  function landedHit(hpDamage, casterUuid = 'jerald')
  {
    return {
      action: buildAction('Mainhand', casterUuid, true, 12),
      target: buildTarget(true, false, buildResult(hpDamage)),
    };
  }

  describe('construction', () =>
  {
    it('holds the rolling window it was built with', () =>
    {
      // Arrange & Act
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);

      // Assert
      expect(tracker.rollingWindowFrames()).toBe(300);
    });

    it('starts with a combat clock at zero', () =>
    {
      // Arrange & Act
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);

      // Assert
      expect(tracker.combatFrames()).toBe(0);
    });

    it('seeds the current encounter already spent', () =>
    {
      // Arrange & Act
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);

      // Assert- a fresh tracker must not look like a fight in progress.
      expect(tracker.currentEncounter().isClosed()).toBe(true);
    });

    it('seeds the previous encounter already spent', () =>
    {
      // Arrange & Act
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);

      // Assert
      expect(tracker.previousEncounter().isClosed()).toBe(true);
    });

    it('gives the two seeded encounters separate identities', () =>
    {
      // Arrange & Act
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);

      // Assert- one shared instance would make the shift register alias itself on the first fight.
      expect(tracker.currentEncounter()).not.toBe(tracker.previousEncounter());
    });
  });

  describe('the combat clock', () =>
  {
    it('advances while the party is in combat', () =>
    {
      // Arrange
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      combat.setInCombat(true);

      // Act
      runFrames(tracker, 45);

      // Assert
      expect(tracker.combatFrames()).toBe(45);
    });

    it('stands still while the party is out of combat', () =>
    {
      // Arrange
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      combat.setInCombat(true);
      runFrames(tracker, 45);

      // Act- the walk to the next fight, which must not be measured.
      combat.setInCombat(false);
      runFrames(tracker, 600);

      // Assert
      expect(tracker.combatFrames()).toBe(45);
    });

    it('walks an open encounter forward with it', () =>
    {
      // Arrange- open an encounter on frame 1, then let the fight run on without further hits.
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      combat.setInCombat(true);
      tracker.update();
      const { action, target } = landedHit(600);
      tracker.handleSkillEffect(action, target);

      // Act
      runFrames(tracker, 180);

      // Assert- 600 damage across the 180 frames since, rather than across the opening instant.
      expect(tracker.currentDpsBy('jerald')).toBe(200);
    });

    it('leaves a closed encounter where it stands', () =>
    {
      // Arrange- a fight that ended, then more combat time from a second fight starting later.
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      combat.setInCombat(true);
      tracker.update();
      const { action, target } = landedHit(600);
      tracker.handleSkillEffect(action, target);
      runFrames(tracker, 119);
      combat.setInCombat(false);
      tracker.update();
      const settled = tracker.currentDpsBy('jerald');

      // Act
      combat.setInCombat(true);
      runFrames(tracker, 600);

      // Assert- the finished fight's figure does not move because more combat happened afterward.
      expect(tracker.currentDpsBy('jerald')).toBe(settled);
    });
  });

  describe('closing an encounter', () =>
  {
    it('closes the open encounter when combat ends', () =>
    {
      // Arrange
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      combat.setInCombat(true);
      tracker.update();
      const { action, target } = landedHit(100);
      tracker.handleSkillEffect(action, target);

      // Act
      combat.setInCombat(false);
      tracker.update();

      // Assert
      expect(tracker.currentEncounter().isClosed()).toBe(true);
    });

    it('leaves the encounter open while combat continues', () =>
    {
      // Arrange
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      combat.setInCombat(true);
      tracker.update();
      const { action, target } = landedHit(100);
      tracker.handleSkillEffect(action, target);

      // Act
      runFrames(tracker, 300);

      // Assert
      expect(tracker.currentEncounter().isClosed()).toBe(false);
    });

    it('does nothing on a frame where combat was already over', () =>
    {
      // Arrange- a finished fight, whose previous slot must not be disturbed by idle frames.
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      combat.setInCombat(true);
      tracker.update();
      const { action, target } = landedHit(100);
      tracker.handleSkillEffect(action, target);
      combat.setInCombat(false);
      tracker.update();
      const closedEncounter = tracker.currentEncounter();

      // Act
      runFrames(tracker, 240);

      // Assert
      expect(tracker.currentEncounter()).toBe(closedEncounter);
    });

    it('measures the fight to its last hit rather than to the end of combat', () =>
    {
      // Arrange- 300 damage lands across the first 60 frames of an encounter.
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      combat.setInCombat(true);
      tracker.update();
      const opener = landedHit(150);
      tracker.handleSkillEffect(opener.action, opener.target);
      runFrames(tracker, 60);
      const finisher = landedHit(150);
      tracker.handleSkillEffect(finisher.action, finisher.target);

      // Act- JABS' in-combat tail keeps the flag up for another four seconds with nothing landing.
      runFrames(tracker, 240);
      combat.setInCombat(false);
      tracker.update();

      // Assert- 300 across 60 frames is 300 per second; the tail would have made it 60.
      expect(tracker.currentDpsBy('jerald')).toBe(300);
    });
  });

  describe('shouldRecordSkillEffect', () =>
  {
    it('rejects an action out of the tool slot', () =>
    {
      // Arrange
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      const action = buildAction('Tool', 'jerald', true, 12);
      const target = buildTarget(true, false, buildResult(400));

      // Act & Assert
      expect(tracker.shouldRecordSkillEffect(action, target)).toBe(false);
    });

    it('rejects an action out of the usable item slot', () =>
    {
      // Arrange
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      const action = buildAction('UsableItem', 'jerald', true, 12);
      const target = buildTarget(true, false, buildResult(400));

      // Act & Assert
      expect(tracker.shouldRecordSkillEffect(action, target)).toBe(false);
    });

    it('rejects a swing that did not come from an actor', () =>
    {
      // Arrange- an enemy striking another enemy, which the target alone cannot distinguish.
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      const action = buildAction('Mainhand', 'goblin', false, 12);
      const target = buildTarget(true, false, buildResult(400));

      // Act & Assert
      expect(tracker.shouldRecordSkillEffect(action, target)).toBe(false);
    });

    it('rejects a hit landing on something that is not an enemy', () =>
    {
      // Arrange
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      const action = buildAction('Mainhand', 'jerald', true, 12);
      const target = buildTarget(false, false, buildResult(400));

      // Act & Assert
      expect(tracker.shouldRecordSkillEffect(action, target)).toBe(false);
    });

    it('rejects a hit landing on scenery', () =>
    {
      // Arrange- a tree counts as an enemy, but chopping it never raises the in-combat flag.
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      const action = buildAction('Mainhand', 'jerald', true, 12);
      const target = buildTarget(true, true, buildResult(400));

      // Act & Assert
      expect(tracker.shouldRecordSkillEffect(action, target)).toBe(false);
    });

    it('rejects an attack that was evaded', () =>
    {
      // Arrange
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      const action = buildAction('Mainhand', 'jerald', true, 12);
      const target = buildTarget(true, false, buildResult(0, false, true));

      // Act & Assert
      expect(tracker.shouldRecordSkillEffect(action, target)).toBe(false);
    });

    it('rejects a hit that dealt no damage', () =>
    {
      // Arrange- a pure state application connects without moving anybody's hp.
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      const action = buildAction('Mainhand', 'jerald', true, 12);
      const target = buildTarget(true, false, buildResult(0));

      // Act & Assert
      expect(tracker.shouldRecordSkillEffect(action, target)).toBe(false);
    });

    it('rejects a heal, which arrives as negative damage', () =>
    {
      // Arrange
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      const action = buildAction('Mainhand', 'jerald', true, 12);
      const target = buildTarget(true, false, buildResult(-250));

      // Act & Assert
      expect(tracker.shouldRecordSkillEffect(action, target)).toBe(false);
    });

    it('accepts a landed weapon hit on a living enemy', () =>
    {
      // Arrange
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      const { action, target } = landedHit(400);

      // Act & Assert
      expect(tracker.shouldRecordSkillEffect(action, target)).toBe(true);
    });
  });

  describe('handleSkillEffect', () =>
  {
    it('records a hit that passes every filter', () =>
    {
      // Arrange
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      const { action, target } = landedHit(275);

      // Act
      tracker.handleSkillEffect(action, target);

      // Assert
      expect(tracker.currentDamageBy('jerald')).toBe(275);
    });

    it('records nothing for a hit that fails a filter', () =>
    {
      // Arrange- the thrown bomb, which the filters exclude.
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      const action = buildAction('Tool', 'jerald', true, 12);
      const target = buildTarget(true, false, buildResult(275));

      // Act
      tracker.handleSkillEffect(action, target);

      // Assert- and the encounter never opened, which the closed flag proves.
      expect(tracker.currentEncounter().isClosed()).toBe(true);
    });

    it('files the hit under the battler that dealt it', () =>
    {
      // Arrange
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      const jerald = landedHit(275, 'jerald');
      const rupert = landedHit(90, 'rupert');

      // Act
      tracker.handleSkillEffect(jerald.action, jerald.target);
      tracker.handleSkillEffect(rupert.action, rupert.target);

      // Assert
      expect(tracker.currentDamageBy('rupert')).toBe(90);
    });
  });

  describe('recordHit', () =>
  {
    it('opens a fresh encounter when the last one is spent', () =>
    {
      // Arrange
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      const seeded = tracker.currentEncounter();

      // Act
      tracker.recordHit('jerald', 12, 100, false);

      // Assert
      expect(tracker.currentEncounter()).not.toBe(seeded);
    });

    it('keeps recording into an encounter that is still open', () =>
    {
      // Arrange
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      tracker.recordHit('jerald', 12, 100, false);
      const opened = tracker.currentEncounter();

      // Act
      tracker.recordHit('jerald', 12, 40, false);

      // Assert
      expect(tracker.currentEncounter()).toBe(opened);
    });

    it('retires the finished encounter into the previous slot', () =>
    {
      // Arrange
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      tracker.recordHit('jerald', 12, 100, false);
      const firstFight = tracker.currentEncounter();
      combat.setInCombat(true);
      tracker.update();
      combat.setInCombat(false);
      tracker.update();

      // Act
      tracker.recordHit('jerald', 12, 40, false);

      // Assert
      expect(tracker.previousEncounter()).toBe(firstFight);
    });

    it('holds the finished encounter in the current slot until the next one opens', () =>
    {
      // Arrange
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      tracker.recordHit('jerald', 12, 100, false);
      const firstFight = tracker.currentEncounter();

      // Act- combat ends, and nothing new begins.
      combat.setInCombat(true);
      tracker.update();
      combat.setInCombat(false);
      tracker.update();

      // Assert- the fight that just ended is still the one being displayed.
      expect(tracker.currentEncounter()).toBe(firstFight);
    });
  });

  describe('rollingDenominatorFrames', () =>
  {
    it('floors a barely-opened encounter at one second', () =>
    {
      // Arrange- without the floor, the opening hit divides by a single frame.
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      combat.setInCombat(true);
      tracker.update();
      tracker.recordHit('jerald', 12, 100, false);

      // Act
      const result = tracker.rollingDenominatorFrames();

      // Assert
      expect(result).toBe(60);
    });

    it('uses the elapsed fight while the window is still filling', () =>
    {
      // Arrange
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      combat.setInCombat(true);
      tracker.update();
      tracker.recordHit('jerald', 12, 100, false);

      // Act- the encounter opened on frame one, so this leaves 150 frames elapsed since.
      runFrames(tracker, 150);

      // Assert- 150 frames of fight, which is less than the 300 frame window.
      expect(tracker.rollingDenominatorFrames()).toBe(150);
    });

    it('caps at the window once the fight outlasts it', () =>
    {
      // Arrange
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      combat.setInCombat(true);
      tracker.update();
      tracker.recordHit('jerald', 12, 100, false);

      // Act
      runFrames(tracker, 900);

      // Assert
      expect(tracker.rollingDenominatorFrames()).toBe(300);
    });
  });

  describe('rollingDpsBy', () =>
  {
    it('divides recent damage by the filled window', () =>
    {
      // Arrange- 1500 damage, then run the fight out past the full five second window.
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      combat.setInCombat(true);
      tracker.update();
      const { action, target } = landedHit(1500);
      tracker.handleSkillEffect(action, target);

      // Act- the encounter opened on frame one, so this fills the window exactly.
      runFrames(tracker, 300);

      // Assert- 1500 across five seconds.
      expect(tracker.rollingDpsBy('jerald')).toBe(300);
    });

    it('drops damage that has fallen out of the window', () =>
    {
      // Arrange- an opening hit, then a later one, with the window run past the first.
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      combat.setInCombat(true);
      tracker.update();
      const opener = landedHit(9000);
      tracker.handleSkillEffect(opener.action, opener.target);
      runFrames(tracker, 200);
      const recent = landedHit(600);
      tracker.handleSkillEffect(recent.action, recent.target);

      // Act- push the opener past the five second boundary.
      runFrames(tracker, 200);

      // Assert- only the recent 600 remains, across the now-full window.
      expect(tracker.rollingDpsBy('jerald')).toBe(120);
    });

    it('freezes rather than decaying once combat ends', () =>
    {
      // Arrange
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      combat.setInCombat(true);
      tracker.update();
      const { action, target } = landedHit(1500);
      tracker.handleSkillEffect(action, target);
      runFrames(tracker, 299);
      const settled = tracker.rollingDpsBy('jerald');

      // Act- a long walk to the next fight.
      combat.setInCombat(false);
      runFrames(tracker, 1800);

      // Assert
      expect(tracker.rollingDpsBy('jerald')).toBe(settled);
    });
  });

  describe('previousDpsBy', () =>
  {
    it('reports the fight before the current one', () =>
    {
      // Arrange- a first fight worth 600 across two seconds, then a second fight begins.
      const tracker = new JabsDpsTracker(WINDOW_FRAMES);
      combat.setInCombat(true);
      tracker.update();
      const first = landedHit(300);
      tracker.handleSkillEffect(first.action, first.target);
      runFrames(tracker, 120);
      const firstFinisher = landedHit(300);
      tracker.handleSkillEffect(firstFinisher.action, firstFinisher.target);
      combat.setInCombat(false);
      tracker.update();

      // Act
      combat.setInCombat(true);
      runFrames(tracker, 60);
      const second = landedHit(50);
      tracker.handleSkillEffect(second.action, second.target);

      // Assert- 600 across the first fight's 120 frame span.
      expect(tracker.previousDpsBy('jerald')).toBe(300);
    });
  });
});
//endregion plugins/abs/ext/dps/managers/jabs-dps-tracker.test.js