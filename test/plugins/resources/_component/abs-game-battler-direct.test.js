//region plugins/resources/_component/abs-game-battler-direct.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// HealEventManager's own cascade logic is already covered by heal-event-manager.test.js; this file
// only needs to verify that Game_Battler#onHeal dispatches to it after the original onHeal runs.
vi.mock('../../../../src/plugins/resources/ext/abs/managers/HealEventManager.js', () => ({
  default: { dispatch: vi.fn() },
}));

describe('Game_BattlerBase / Game_Battler lst/mst/tst + onHeal (resources ext/abs, direct src import)', () =>
{
  let HealEventManager;
  let baseOnHeal;

  beforeEach(async () =>
  {
    vi.resetModules();
    vi.clearAllMocks();

    function Game_BattlerBase()
    {
    }

    function Game_Battler()
    {
    }

    Game_Battler.prototype = Object.create(Game_BattlerBase.prototype);
    Game_Battler.prototype.constructor = Game_Battler;
    baseOnHeal = vi.fn();
    Game_Battler.prototype.onHeal = baseOnHeal;

    // J-Base's seam answers zero until J-NaturalGrowth fills it in.
    Game_Battler.prototype.naturalBonus = () => 0;

    globalThis.Game_BattlerBase = Game_BattlerBase;
    globalThis.Game_Battler = Game_Battler;
    globalThis.J = { RESOURCES: { EXT: { ABS: {
      Aliased: { Game_Battler: new Map() },
      RegExp: { Lifesteal: {}, Manasteal: {}, Techsteal: {} },
    } } } };
    globalThis.RPGManager = { getSumFromAllNotesByRegex: vi.fn(() => 0) };

    await import('../../../../src/plugins/resources/ext/abs/objects/Game_Battler.js');
    ({ default: HealEventManager } =
      await import('../../../../src/plugins/resources/ext/abs/managers/HealEventManager.js'));
  });

  afterEach(() =>
  {
    delete globalThis.Game_BattlerBase;
    delete globalThis.Game_Battler;
    delete globalThis.J;
    delete globalThis.RPGManager;
  });

  describe('base rates on Game_BattlerBase', () =>
  {
    it('default lst/mst/tst to 0 for a plain Game_BattlerBase', () =>
    {
      const battler = new globalThis.Game_BattlerBase();

      expect(battler.lst).toBe(0);
      expect(battler.mst).toBe(0);
      expect(battler.tst).toBe(0);
    });
  });

  describe('note-derived rates on Game_Battler', () =>
  {
    it('converts summed lifesteal notetags into a decimal rate', () =>
    {
      const battler = new globalThis.Game_Battler();
      battler.getAllNotes = () => [];
      globalThis.RPGManager.getSumFromAllNotesByRegex.mockImplementation((_notes, regexp) =>
        (regexp === globalThis.J.RESOURCES.EXT.ABS.RegExp.Lifesteal ? 15 : 0));

      // 15% summed from notes -> 0.15 decimal rate.
      expect(battler.lst).toBeCloseTo(0.15);
    });

    it('adds the SDP bonus for the parameter key when getSdpBonusForParameterKey exists', () =>
    {
      const battler = new globalThis.Game_Battler();
      battler.getAllNotes = () => [];
      globalThis.RPGManager.getSumFromAllNotesByRegex.mockImplementation((_notes, regexp) =>
        (regexp === globalThis.J.RESOURCES.EXT.ABS.RegExp.Manasteal ? 10 : 0));
      battler.getSdpBonusForParameterKey = vi.fn(() => 0.05);

      expect(battler.mst).toBeCloseTo(0.15);
      expect(battler.getSdpBonusForParameterKey).toHaveBeenCalledWith('mst', 1);
    });

    it('does not touch the SDP bonus when getSdpBonusForParameterKey is absent', () =>
    {
      const battler = new globalThis.Game_Battler();
      battler.getAllNotes = () => [];
      globalThis.RPGManager.getSumFromAllNotesByRegex.mockImplementation((_notes, regexp) =>
        (regexp === globalThis.J.RESOURCES.EXT.ABS.RegExp.Techsteal ? 20 : 0));

      expect(battler.tst).toBeCloseTo(0.2);
    });

    it('leaves magisteal at its note-derived rate when the SDP system is not installed', () =>
    {
      // Arrange- J-SDP is optional, and a battler without it has no bonus method at all rather than
      // a method answering zero.
      const battler = new globalThis.Game_Battler();
      battler.getAllNotes = () => [];
      globalThis.RPGManager.getSumFromAllNotesByRegex.mockImplementation((_notes, regexp) =>
        (regexp === globalThis.J.RESOURCES.EXT.ABS.RegExp.Manasteal ? 10 : 0));

      // Act & Assert
      expect(battler.mst).toBeCloseTo(0.1);
    });

    it('adds the SDP bonus to lifesteal under its own parameter key', () =>
    {
      // Arrange- the three drain rates are separate registry keys, and a copy-paste that left all
      // three asking for the same key would hand a lifesteal panel's bonus to magisteal too.
      const battler = new globalThis.Game_Battler();
      battler.getAllNotes = () => [];
      globalThis.RPGManager.getSumFromAllNotesByRegex.mockImplementation((_notes, regexp) =>
        (regexp === globalThis.J.RESOURCES.EXT.ABS.RegExp.Lifesteal ? 10 : 0));
      battler.getSdpBonusForParameterKey = vi.fn(() => 0.05);

      // Act & Assert
      expect(battler.lst).toBeCloseTo(0.15);
      expect(battler.getSdpBonusForParameterKey).toHaveBeenCalledWith('lst', 1);
    });

    it('adds the SDP bonus to techsteal under its own parameter key', () =>
    {
      // Arrange
      const battler = new globalThis.Game_Battler();
      battler.getAllNotes = () => [];
      globalThis.RPGManager.getSumFromAllNotesByRegex.mockImplementation((_notes, regexp) =>
        (regexp === globalThis.J.RESOURCES.EXT.ABS.RegExp.Techsteal ? 20 : 0));
      battler.getSdpBonusForParameterKey = vi.fn(() => 0.05);

      // Act & Assert
      expect(battler.tst).toBeCloseTo(0.25);
      expect(battler.getSdpBonusForParameterKey).toHaveBeenCalledWith('tst', 1);
    });

    it.each([
      [ 'lst', 'Lifesteal', 0.165 ],
      [ 'mst', 'Manasteal', 0.17 ],
      [ 'tst', 'Techsteal', 0.175 ],
    ])('layers %s\'s own natural bonus onto its rate, already in rate units', (key, tag, expected) =>
    {
      // Arrange- each drain stat has its own natural bonus, so borrowing a sibling's would show.
      const battler = new globalThis.Game_Battler();
      battler.getAllNotes = () => [];
      globalThis.RPGManager.getSumFromAllNotesByRegex.mockImplementation((_notes, regexp) =>
        (regexp === globalThis.J.RESOURCES.EXT.ABS.RegExp[tag] ? 15 : 0));
      const naturalBonuses = { lst: 0.015, mst: 0.02, tst: 0.025 };
      battler.naturalBonus = parameterKey => naturalBonuses[parameterKey];

      // Act
      const result = battler[key];

      // Assert
      expect(result).toBeCloseTo(expected, 10);
    });
  });

  describe('onHeal aliasing', () =>
  {
    it('calls the original onHeal and then dispatches the heal-event cascade', () =>
    {
      const battler = new globalThis.Game_Battler();

      battler.onHeal('hp', 50);

      expect(baseOnHeal).toHaveBeenCalledWith('hp', 50);
      expect(HealEventManager.dispatch).toHaveBeenCalledWith(battler, 'hp', 50);
    });
  });
});
//endregion plugins/resources/_component/abs-game-battler-direct.test.js
