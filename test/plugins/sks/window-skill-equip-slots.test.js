//region plugins/sks/window-skill-equip-slots.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import WindowCommandBuilder from '../../../src/plugins/_base/models/WindowCommandBuilder.js';

import { installWindowCommandStub } from './fixtures/window-command-stub.js';

describe('Window_SkillEquipSlots (src/plugins/sks/core/windows/Window_SkillEquipSlots.js)', () =>
{
  /** @type {typeof import('../../../src/plugins/sks/core/windows/Window_SkillEquipSlots.js').default} */
  let Window_SkillEquipSlots;

  beforeAll(async () =>
  {
    // Window_SkillEquipSlots `extends Window_Command` at class-definition time, and also invokes
    // `new WindowCommandBuilder(...)` from within buildCommand(), both referenced as bare
    // (undeclared) globals exactly like the concatenated RMMZ runtime would provide them. Install
    // a minimal Window_Command stand-in and the real WindowCommandBuilder before the dynamic
    // import evaluates the module, since a static import would be hoisted ahead of any setup.
    installWindowCommandStub();

    // WindowCommandBuilder is a real, pure, cleanly importable class, so use the genuine
    // implementation rather than a fake -- this gives real coverage attribution to buildCommand().
    globalThis.WindowCommandBuilder = WindowCommandBuilder;

    ({ default: Window_SkillEquipSlots } =
      await import('../../../src/plugins/sks/core/windows/Window_SkillEquipSlots.js'));
  });

  afterAll(() =>
  {
    delete globalThis.Window_Command;
    delete globalThis.WindowCommandBuilder;
  });

  beforeEach(() =>
  {
    // a small roster covering both a normally-costed skill and a free one.
    globalThis.$dataSkills = [
      null,
      { id: 1, name: 'Slash', iconIndex: 10 },
      { id: 2, name: 'Guard', iconIndex: 20 },
    ];
  });

  /**
   * Builds a fake actor exposing just the surface Window_SkillEquipSlots reads from a Game_Actor:
   * `getSkillIdInSlot()`, `skillSlotCost()`, `maxSlotPoints()`, and `slotMap()`.
   * @param {object} shape The behavior to back this fake actor with.
   * @param {Map<number, number>} shape.slotMap The slot index -> skill id map.
   * @param {number} shape.maxSlotPoints The value returned by `maxSlotPoints()`.
   * @param {(skillId: number, slotIndex: number) => number} [shape.skillSlotCost] Cost resolver.
   * @returns {object}
   */
  function makeActor({ slotMap, maxSlotPoints, skillSlotCost = () => 1 })
  {
    return {
      getSkillIdInSlot: slotIndex => slotMap.get(slotIndex) ?? 0,
      skillSlotCost,
      maxSlotPoints: () => maxSlotPoints,
      slotMap: () => slotMap,
    };
  }

  it('makeCommandList is a no-op with no actor assigned', () =>
  {
    const slots = new Window_SkillEquipSlots({});

    expect(slots.commandList()).toEqual([]);
  });

  describe('computeRenderableSlotCount', () =>
  {
    it('renders at least 1 row even with 0 max points and no equipped slots', () =>
    {
      const slots = new Window_SkillEquipSlots({});
      const actor = makeActor({ slotMap: new Map(), maxSlotPoints: 0 });

      slots.setActor(actor);

      expect(slots.commandList().length).toBe(1);
    });

    it('renders maxSlotPoints rows when no slot index exceeds that baseline', () =>
    {
      const slots = new Window_SkillEquipSlots({});
      const actor = makeActor({ slotMap: new Map([ [ 0, 1 ] ]), maxSlotPoints: 4 });

      slots.setActor(actor);

      expect(slots.commandList().length).toBe(4);
    });

    it('renders through the highest occupied slot index when it exceeds maxSlotPoints', () =>
    {
      const slots = new Window_SkillEquipSlots({});
      const actor = makeActor({ slotMap: new Map([ [ 5, 1 ] ]), maxSlotPoints: 2 });

      slots.setActor(actor);

      // highest occupied index is 5, so rows 0..5 must render (6 rows), even though max points is only 2.
      expect(slots.commandList().length).toBe(6);
    });
  });

  describe('buildCommand', () =>
  {
    it('labels an empty slot with the placeholder name, a zero icon, and "0" cost', () =>
    {
      const slots = new Window_SkillEquipSlots({});
      const actor = makeActor({ slotMap: new Map(), maxSlotPoints: 1 });

      slots.setActor(actor);
      const [ command ] = slots.commandList();

      expect(command.name).toBe('- empty -');
      expect(command.icon).toBe(0);
      expect(command.rightText).toBe('0');
      expect(command.enabled).toBe(true);
    });

    it('labels an occupied slot with the skill name, icon, and resolved cost', () =>
    {
      const slots = new Window_SkillEquipSlots({});
      const actor = makeActor({
        slotMap: new Map([ [ 0, 2 ] ]),
        maxSlotPoints: 1,
        skillSlotCost: () => 3,
      });

      slots.setActor(actor);
      const [ command ] = slots.commandList();

      expect(command.name).toBe('Guard');
      expect(command.icon).toBe(20);
      expect(command.rightText).toBe('3');
    });
  });

  describe('item()', () =>
  {
    it('returns null when the command list is empty', () =>
    {
      const slots = new Window_SkillEquipSlots({});

      expect(slots.item()).toBeNull();
    });

    it('returns the { index, skillId } payload for the current selection', () =>
    {
      const slots = new Window_SkillEquipSlots({});
      const actor = makeActor({ slotMap: new Map([ [ 0, 2 ] ]), maxSlotPoints: 1 });
      slots.setActor(actor);

      slots.select(0);

      expect(slots.item()).toEqual({ index: 0, skillId: 2 });
    });
  });

  describe('visibleSlots / setVisibleSlots', () =>
  {
    it('defaults to 8 and updates via setVisibleSlots', () =>
    {
      const slots = new Window_SkillEquipSlots({});

      expect(slots.visibleSlots()).toBe(8);

      slots.setVisibleSlots(3);

      expect(slots.visibleSlots()).toBe(3);
    });
  });
});
//endregion plugins/sks/window-skill-equip-slots.test.js
