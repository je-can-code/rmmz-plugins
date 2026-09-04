//region plugins/abs/ext/dps/models/jabs-dps-encounter.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('JabsDpsEncounter (direct src import)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/dps/models/JabsDpsEncounter.js').default} */
  let JabsDpsEncounter;

  /** @type {typeof import('../../../../../../src/plugins/abs/ext/dps/models/JabsDpsHit.js').default} */
  let JabsDpsHit;

  beforeAll(async () =>
  {
    vi.resetModules();

    String.empty = '';

    const hitModule = await import('../../../../../../src/plugins/abs/ext/dps/models/JabsDpsHit.js');
    JabsDpsHit = hitModule.default;

    const encounterModule = await import(
      '../../../../../../src/plugins/abs/ext/dps/models/JabsDpsEncounter.js');
    JabsDpsEncounter = encounterModule.default;
  });

  /**
   * Builds a hit for the given battler at the given frame.
   * @param {number} combatFrame The frame it lands on.
   * @param {string} casterUuid Who dealt it.
   * @param {number} hpDamage How much it dealt.
   * @returns {object} The hit.
   */
  function hitAt(combatFrame, casterUuid, hpDamage)
  {
    return new JabsDpsHit(combatFrame, casterUuid, 1, hpDamage, false);
  }

  describe('opening state', () =>
  {
    it('reports the frame it was opened on', () =>
    {
      // Arrange & Act
      const encounter = new JabsDpsEncounter(400);

      // Assert
      expect(encounter.openedAtCombatFrame()).toBe(400);
    });

    it('is open until it is closed', () =>
    {
      // Arrange & Act
      const encounter = new JabsDpsEncounter(400);

      // Assert
      expect(encounter.isClosed()).toBe(false);
    });

    it('holds no hits before any land', () =>
    {
      // Arrange & Act
      const encounter = new JabsDpsEncounter(400);

      // Assert
      expect(encounter.hits()).toEqual([]);
    });
  });

  describe('addHit', () =>
  {
    it('keeps the hits it is given', () =>
    {
      // Arrange
      const encounter = new JabsDpsEncounter(0);
      const hit = hitAt(30, 'jerald', 90);

      // Act
      encounter.addHit(hit);

      // Assert
      expect(encounter.hits()).toEqual([ hit ]);
    });
  });

  describe('spanFrames', () =>
  {
    it('floors a barely-begun encounter at the minimum span', () =>
    {
      // Arrange- one frame in, which without a floor would divide damage by almost nothing.
      const encounter = new JabsDpsEncounter(100);
      encounter.extendTo(101);

      // Act
      const result = encounter.spanFrames();

      // Assert
      expect(result).toBe(60);
    });

    it('measures a longer encounter by its actual span', () =>
    {
      // Arrange
      const encounter = new JabsDpsEncounter(100);
      encounter.extendTo(340);

      // Act
      const result = encounter.spanFrames();

      // Assert
      expect(result).toBe(240);
    });

    it('snaps the span back to the last landed hit when closed', () =>
    {
      // Arrange- the working end ran on well past the last hit, the way JABS' combat tail does.
      const encounter = new JabsDpsEncounter(100);
      encounter.addHit(hitAt(280, 'jerald', 50));
      encounter.extendTo(700);

      // Act
      encounter.close();

      // Assert- 280 minus 100, not 700 minus 100.
      expect(encounter.spanFrames()).toBe(180);
    });

    it('reports being closed once closed', () =>
    {
      // Arrange
      const encounter = new JabsDpsEncounter(100);

      // Act
      encounter.close();

      // Assert
      expect(encounter.isClosed()).toBe(true);
    });
  });

  describe('damageBy', () =>
  {
    it('totals only the hits the named battler dealt', () =>
    {
      // Arrange- rupert is the near-miss sibling; a filter that matched everything would say 240.
      const encounter = new JabsDpsEncounter(0);
      encounter.addHit(hitAt(10, 'jerald', 90));
      encounter.addHit(hitAt(20, 'rupert', 100));
      encounter.addHit(hitAt(30, 'jerald', 50));

      // Act
      const result = encounter.damageBy('jerald');

      // Assert
      expect(result).toBe(140);
    });

    it('totals zero for a battler that landed nothing', () =>
    {
      // Arrange
      const encounter = new JabsDpsEncounter(0);
      encounter.addHit(hitAt(10, 'jerald', 90));

      // Act & Assert- paired with the positive case above, which proves the sum can be non-zero.
      expect(encounter.damageBy('rupert')).toBe(0);
    });
  });

  describe('damageBySince', () =>
  {
    it('counts a hit landing exactly on the cutoff frame', () =>
    {
      // Arrange
      const encounter = new JabsDpsEncounter(0);
      encounter.addHit(hitAt(200, 'jerald', 75));

      // Act
      const result = encounter.damageBySince('jerald', 200);

      // Assert
      expect(result).toBe(75);
    });

    it('drops a hit landing before the cutoff frame', () =>
    {
      // Arrange- the older hit has to be excluded while the newer one survives.
      const encounter = new JabsDpsEncounter(0);
      encounter.addHit(hitAt(199, 'jerald', 75));
      encounter.addHit(hitAt(260, 'jerald', 40));

      // Act
      const result = encounter.damageBySince('jerald', 200);

      // Assert
      expect(result).toBe(40);
    });

    it('drops another battler landing inside the same window', () =>
    {
      // Arrange
      const encounter = new JabsDpsEncounter(0);
      encounter.addHit(hitAt(260, 'jerald', 40));
      encounter.addHit(hitAt(270, 'rupert', 500));

      // Act
      const result = encounter.damageBySince('jerald', 200);

      // Assert
      expect(result).toBe(40);
    });
  });

  describe('dpsBy', () =>
  {
    it('divides a battler damage by the encounter span in seconds', () =>
    {
      // Arrange- 600 damage across 120 frames, which is two seconds.
      const encounter = new JabsDpsEncounter(0);
      encounter.addHit(hitAt(60, 'jerald', 600));
      encounter.extendTo(120);

      // Act
      const result = encounter.dpsBy('jerald');

      // Assert
      expect(result).toBe(300);
    });
  });

  describe('toDps', () =>
  {
    it('converts damage across frames into a per-second rate', () =>
    {
      // Arrange & Act- 450 across 90 frames is a second and a half.
      const result = JabsDpsEncounter.toDps(450, 90);

      // Assert
      expect(result).toBe(300);
    });
  });
});
//endregion plugins/abs/ext/dps/models/jabs-dps-encounter.test.js