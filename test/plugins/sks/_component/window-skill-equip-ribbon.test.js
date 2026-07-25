//region plugins/sks/_component/window-skill-equip-ribbon.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Window_SkillEquipRibbon (src/plugins/sks/core/windows/Window_SkillEquipRibbon.js)', () =>
{
  /** @type {typeof import('../../../../src/plugins/sks/core/windows/Window_SkillEquipRibbon.js').default} */
  let Window_SkillEquipRibbon;

  beforeAll(async () =>
  {
    // Window_SkillEquipRibbon `extends Window_ActorRibbon` at class-definition time, referenced as a
    // bare (undeclared) global. capacitySummaryText() never instantiates or touches the base class's
    // rendering surface, so a minimal stand-in is enough to let the class declaration evaluate.
    globalThis.Window_ActorRibbon = class {};

    globalThis.J = { SKS: { Metadata: { enableExclusiveMode: false, slotsOnly: false } } };

    ({ default: Window_SkillEquipRibbon } =
      await import('../../../../src/plugins/sks/core/windows/Window_SkillEquipRibbon.js'));
  });

  afterAll(() =>
  {
    delete globalThis.Window_ActorRibbon;
    delete globalThis.J;
  });

  /**
   * Builds a fake actor exposing just the surface capacitySummaryText reads from a Game_Actor.
   * @param {object} overrides Values to report from the corresponding accessor methods.
   * @returns {object}
   */
  function makeActor(overrides)
  {
    return {
      spentSlotPoints: () => overrides.spentSlotPoints,
      maxSlotPoints: () => overrides.maxSlotPoints,
      slotMap: () => ({ size: overrides.slotCount }),
      maxSlots: () => overrides.maxSlots,
    };
  }

  it('shows points in tandem mode', () =>
  {
    // Arrange
    globalThis.J.SKS.Metadata.enableExclusiveMode = false;
    globalThis.J.SKS.Metadata.slotsOnly = false;
    const actor = makeActor({
      spentSlotPoints: 3, maxSlotPoints: 5, slotCount: 1, maxSlots: 4,
    });

    // Act
    const text = Window_SkillEquipRibbon.prototype.capacitySummaryText(actor);

    // Assert
    expect(text).toBe('3/5 pts');
  });

  it('shows points in exclusive points-only mode', () =>
  {
    // Arrange
    globalThis.J.SKS.Metadata.enableExclusiveMode = true;
    globalThis.J.SKS.Metadata.slotsOnly = false;
    const actor = makeActor({
      spentSlotPoints: 2, maxSlotPoints: 8, slotCount: 1, maxSlots: 4,
    });

    // Act
    const text = Window_SkillEquipRibbon.prototype.capacitySummaryText(actor);

    // Assert
    expect(text).toBe('2/8 pts');
  });

  it('shows slot count in exclusive slots-only mode', () =>
  {
    // Arrange
    globalThis.J.SKS.Metadata.enableExclusiveMode = true;
    globalThis.J.SKS.Metadata.slotsOnly = true;
    const actor = makeActor({
      spentSlotPoints: 2, maxSlotPoints: 8, slotCount: 3, maxSlots: 4,
    });

    // Act
    const text = Window_SkillEquipRibbon.prototype.capacitySummaryText(actor);

    // Assert
    expect(text).toBe('3/4 slots');
  });
});
//endregion plugins/sks/_component/window-skill-equip-ribbon.test.js
