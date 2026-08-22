//region plugins/sdp/core/models/stat-distribution-panel.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * A panel is mostly a composition of the smaller models around it- identity, progression and
 * mastery each own a slice of the data, and the panel exposes them as one flat surface so the
 * windows and managers reading it never have to know which slice a field came from. These cover
 * that surface, the party-backed lock state, and the rarity chrome the panel draws with.
 */
describe('StatDistributionPanel (direct src import)', () =>
{
  let StatDistributionPanel;
  let PanelIdentity;
  let PanelProgression;
  let PanelMastery;
  let PanelRarity;

  beforeAll(async () =>
  {
    if (String.empty === undefined)
    {
      Object.defineProperty(String, 'empty', {
        value: '',
        configurable: true,
      });
    }

    ({ default: StatDistributionPanel } = await import('../../../../../src/plugins/sdp/core/models/StatDistributionPanel.js'));
    ({ default: PanelIdentity } = await import('../../../../../src/plugins/sdp/core/models/PanelIdentity.js'));
    ({ default: PanelProgression } = await import('../../../../../src/plugins/sdp/core/models/PanelProgression.js'));
    ({ default: PanelMastery } = await import('../../../../../src/plugins/sdp/core/models/PanelMastery.js'));
    ({ default: PanelRarity } = await import('../../../../../src/plugins/sdp/core/models/PanelRarity.js'));
  });

  /**
   * Builds a panel from real component models, so the delegating surface is exercised against the
   * same objects it composes in production rather than against hand-shaped stand-ins.
   * @param {object} [overrides] Optional identity/progression/mastery replacements.
   * @returns {StatDistributionPanel}
   */
  function makePanel(overrides = {})
  {
    const identity = overrides.identity ?? new PanelIdentity('Ironhide', 12, true, 'Tough as nails.', 'Resilience.');
    const progression = overrides.progression ?? new PanelProgression(5, PanelRarity.RARITY_EPIC, 40, 5, 1.5);
    const mastery = overrides.mastery ?? PanelMastery.fromFlat('resilience', 2, 480);

    return new StatDistributionPanel(
      overrides.key ?? 'ironhide',
      identity,
      progression,
      overrides.panelParameters ?? [],
      overrides.panelRewards ?? [],
      mastery);
  }

  //region identity surface
  describe('identity surface', () =>
  {
    it('exposes the panel name from its identity', () =>
    {
      // Arrange & Act
      const panel = makePanel();

      // Assert
      expect(panel.name).toBe('Ironhide');
    });

    it('exposes the icon index from its identity', () =>
    {
      // Arrange & Act
      const panel = makePanel();

      // Assert
      expect(panel.iconIndex).toBe(12);
    });

    it('exposes the default-unlock flag from its identity', () =>
    {
      // Arrange & Act
      const panel = makePanel();

      // Assert
      expect(panel.unlockedByDefault).toBe(true);
    });

    it('exposes the description from its identity', () =>
    {
      // Arrange & Act
      const panel = makePanel();

      // Assert
      expect(panel.description).toBe('Tough as nails.');
    });

    it('exposes the flavor line from its identity', () =>
    {
      // Arrange & Act
      const panel = makePanel();

      // Assert
      expect(panel.topFlavorText).toBe('Resilience.');
    });
  });
  //endregion identity surface

  //region mastery surface
  describe('participatesInMasteryProgram', () =>
  {
    it('participates when the panel grants a mastery skill', () =>
    {
      // Arrange
      const panel = makePanel();

      // Act
      const result = panel.participatesInMasteryProgram();

      // Assert
      expect(result).toBe(true);
    });

    it('does not participate when the panel sits outside the hierarchy', () =>
    {
      // Arrange
      const panel = makePanel({ mastery: PanelMastery.none() });

      // Act
      const result = panel.participatesInMasteryProgram();

      // Assert
      expect(result).toBe(false);
    });
  });
  //endregion mastery surface

  //region lock state
  describe('party-backed lock state', () =>
  {
    beforeEach(() =>
    {
      // the party owns unlock state for the whole save, so the panel only ever forwards to it.
      globalThis.$gameParty = {
        unlocked: new Set(),
        isSdpUnlocked(key)
        {
          return this.unlocked.has(key);
        },
        unlockSdp(key)
        {
          this.unlocked.add(key);
        },
        lockSdp(key)
        {
          this.unlocked.delete(key);
        },
      };
    });

    it('reports locked until the party says otherwise', () =>
    {
      // Arrange
      const panel = makePanel();

      // Act
      const result = panel.isUnlocked();

      // Assert
      expect(result).toBe(false);
    });

    it('reports unlocked once the panel has been unlocked', () =>
    {
      // Arrange
      const panel = makePanel();

      // Act
      panel.unlock();

      // Assert
      expect(panel.isUnlocked()).toBe(true);
    });

    it('reports locked again after being locked', () =>
    {
      // Arrange
      const panel = makePanel();
      panel.unlock();

      // Act
      panel.lock();

      // Assert
      expect(panel.isUnlocked()).toBe(false);
    });
  });
  //endregion lock state

  //region bonus calculation
  describe('calculateBonusByRank', () =>
  {
    it('contributes nothing for a parameter this panel does not touch', () =>
    {
      // Arrange: panels only affect the parameters they were authored with, so an unrelated
      // parameter has to short-circuit rather than fall through the accumulation loop.
      const panel = makePanel({ panelParameters: [] });

      // Act
      const result = panel.calculateBonusByRank('mhp', 3);

      // Assert
      expect(result).toBe(0);
    });

    it('accumulates only the parameters authored against the requested key', () =>
    {
      // Arrange: a panel commonly touches several parameters at once, so the sibling here has to
      // survive the filter untouched rather than fold into the total beside the one asked for.
      const panelParameters = [
        { parameterKey: 'mdf', perRank: 3, isFlat: true },
        { parameterKey: 'mhp', perRank: 5, isFlat: true },
      ];
      const panel = makePanel({ panelParameters });

      // Act
      const result = panel.calculateBonusByRank('mhp', 3);

      // Assert
      expect(result).toBe(15);
    });
  });
  //endregion bonus calculation

  //region rarity chrome
  describe('rarity chrome', () =>
  {
    it('draws with the chrome colour of its own rarity', () =>
    {
      // Arrange
      const panel = makePanel();

      // Act
      const result = panel.getPanelRarityColorIndex();

      // Assert
      expect(result).toBe(PanelRarity.WindowColorEpic);
    });

    it.each([
      [ 'RARITY_COMMON', 'Common' ],
      [ 'RARITY_MAGICAL', 'Magical' ],
      [ 'RARITY_RARE', 'Rare' ],
      [ 'RARITY_EPIC', 'Epic' ],
      [ 'RARITY_LEGENDARY', 'Legendary' ],
      [ 'RARITY_GODLIKE', 'Godlike' ],
    ])('labels %s with its rarity word', (indexKey, labelKey) =>
    {
      // Arrange
      const progression = new PanelProgression(5, PanelRarity[indexKey], 40, 5, 1.5);
      const panel = makePanel({ progression });

      // Act
      const result = panel.getPanelRarityText();

      // Assert
      expect(result).toBe(PanelRarity[labelKey]);
    });

    it('names the offending value when the rarity is outside the known range', () =>
    {
      // Arrange: a panel whose rarity failed to normalize should say so on screen rather than
      // silently drawing as Common, since that would hide the authoring mistake.
      const progression = new PanelProgression(5, 99, 40, 5, 1.5);
      const panel = makePanel({ progression });

      // Act
      const result = panel.getPanelRarityText();

      // Assert
      expect(result).toContain('99');
    });
  });
  //endregion rarity chrome
});
//endregion plugins/sdp/core/models/stat-distribution-panel.test.js