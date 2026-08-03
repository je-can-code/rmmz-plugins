//region plugins/sks/_component/window-skill-equip-list.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import WindowCommandBuilder from '../../../../src/plugins/_base/core/models/WindowCommandBuilder.js';

import { installWindowCommandStub } from './fixtures/window-command-stub.js';

describe('Window_SkillEquipList (src/plugins/sks/core/windows/Window_SkillEquipList.js)', () =>
{
  /** @type {typeof import('../../../../src/plugins/sks/core/windows/Window_SkillEquipList.js').default} */
  let Window_SkillEquipList;

  beforeAll(async () =>
  {
    // Window_SkillEquipList `extends Window_Command` at class-definition time, and also invokes
    // `new WindowCommandBuilder(...)` from within buildCommand(), both referenced as bare
    // (undeclared) globals exactly like the concatenated RMMZ runtime would provide them. Install
    // a minimal Window_Command stand-in and the real WindowCommandBuilder before the dynamic
    // import evaluates the module, since a static import would be hoisted ahead of any setup.
    installWindowCommandStub();

    // WindowCommandBuilder is a real, pure, cleanly importable class, so use the genuine
    // implementation rather than a fake -- this gives real coverage attribution to buildCommand().
    globalThis.WindowCommandBuilder = WindowCommandBuilder;

    // no J.EXTEND registered, so the extension-skill exclusion branch in buildCommands() is inert.
    globalThis.J = {};

    ({ default: Window_SkillEquipList } =
      await import('../../../../src/plugins/sks/core/windows/Window_SkillEquipList.js'));
  });

  afterAll(() =>
  {
    delete globalThis.Window_Command;
    delete globalThis.WindowCommandBuilder;
    delete globalThis.J;
  });

  /**
   * Builds a fake actor exposing just the surface Window_SkillEquipList reads from a Game_Actor:
   * `skills()`, `skillSlotCost()`, `canEquipSkillToSlot()`, and `forcedUnslottedSkillIds()`.
   * @param {object[]} skills The learned skills to report from `skills()`.
   * @param {object} [overrides] Optional overrides for the cost/enable/forced-unslotted functions.
   * @returns {object}
   */
  function makeActor(skills, overrides = {})
  {
    return {
      skills: () => skills,
      skillSlotCost: overrides.skillSlotCost ?? (skill => skill),
      canEquipSkillToSlot: overrides.canEquipSkillToSlot ?? (() => true),
      forcedUnslottedSkillIds: overrides.forcedUnslottedSkillIds ?? (() => new Set()),
    };
  }

  beforeEach(() =>
  {
    // default to tandem mode (neither exclusive nor slots-only) unless a test overrides it.
    globalThis.J.SKS = { Metadata: { enableExclusiveMode: false, slotsOnly: false } };

    // a small roster of skills covering: normal, unslotted, and an extension-flagged skill.
    globalThis.$dataSkills = [
      null,
      { id: 1, name: 'Slash', iconIndex: 10, unslotted: false },
      { id: 2, name: 'Perpetual', iconIndex: 11, unslotted: true },
      { id: 3, name: 'ExtSkill', iconIndex: 12, unslotted: false, isExtension: true },
    ];
  });

  it('makeCommandList is a no-op with no actor assigned', () =>
  {
    const list = new Window_SkillEquipList({});

    expect(list.commandList()).toEqual([]);
  });

  it('buildCommands excludes unslotted skills', () =>
  {
    const list = new Window_SkillEquipList({});
    const actor = makeActor([ globalThis.$dataSkills[1], globalThis.$dataSkills[2] ]);

    list.setActor(actor);

    expect(list.commandList().map(cmd => cmd.ext.id)).toEqual([ 1 ]);
  });

  it('buildCommands excludes skills forced unslotted for the current actor', () =>
  {
    const list = new Window_SkillEquipList({});
    const actor = makeActor(
      [ globalThis.$dataSkills[1], globalThis.$dataSkills[3] ],
      { forcedUnslottedSkillIds: () => new Set([ 3 ]) },
    );

    list.setActor(actor);

    expect(list.commandList().map(cmd => cmd.ext.id)).toEqual([ 1 ]);
  });

  it('buildCommands excludes extension skills when J.EXTEND is present', () =>
  {
    globalThis.J.EXTEND = {};

    const list = new Window_SkillEquipList({});
    const actor = makeActor([ globalThis.$dataSkills[1], globalThis.$dataSkills[3] ]);

    list.setActor(actor);

    expect(list.commandList().map(cmd => cmd.ext.id)).toEqual([ 1 ]);

    delete globalThis.J.EXTEND;
  });

  it('buildCommands sorts ascending by slot cost, then by skill id on ties', () =>
  {
    const list = new Window_SkillEquipList({});
    const skillA = { id: 5, name: 'A', iconIndex: 1, unslotted: false };
    const skillB = { id: 2, name: 'B', iconIndex: 1, unslotted: false };
    const skillC = { id: 8, name: 'C', iconIndex: 1, unslotted: false };
    const costsById = { 5: 3, 2: 1, 8: 1 };
    const actor = makeActor(
      [ skillA, skillB, skillC ],
      { skillSlotCost: skillId => costsById[skillId] },
    );

    list.setActor(actor);

    // skillB and skillC tie at cost 1, so they sort by ascending id (2 before 8); skillA (cost 3) is last.
    expect(list.commandList().map(cmd => cmd.ext.id)).toEqual([ 2, 8, 5 ]);
  });

  it('buildCommand sets right text to the resolved slot cost and enabled from canEquipSkillToSlot', () =>
  {
    const list = new Window_SkillEquipList({});
    const actor = makeActor(
      [ globalThis.$dataSkills[1] ],
      {
        skillSlotCost: () => 4,
        canEquipSkillToSlot: () => false,
      },
    );

    list.setActor(actor);
    const [ command ] = list.commandList();

    expect(command.rightText).toBe('4');
    expect(command.enabled).toBe(false);
    expect(command.icon).toBe(10);
  });

  it('buildCommand blanks the right text entirely in slots-only exclusive mode', () =>
  {
    globalThis.J.SKS.Metadata = { enableExclusiveMode: true, slotsOnly: true };

    const list = new Window_SkillEquipList({});
    const actor = makeActor([ globalThis.$dataSkills[1] ], { skillSlotCost: () => 4 });

    list.setActor(actor);
    const [ command ] = list.commandList();

    expect(command.rightText).toBe(String.empty);
  });

  describe('item()', () =>
  {
    it('returns null when the command list is empty', () =>
    {
      const list = new Window_SkillEquipList({});

      expect(list.item()).toBeNull();
    });

    it('returns the skill at the current selection', () =>
    {
      const list = new Window_SkillEquipList({});
      const actor = makeActor([ globalThis.$dataSkills[1] ]);
      list.setActor(actor);

      list.select(0);

      expect(list.item()).toBe(globalThis.$dataSkills[1]);
    });
  });

  describe('slotContext()', () =>
  {
    it('defaults to 0 and updates via setSlotContext', () =>
    {
      const list = new Window_SkillEquipList({});

      expect(list.slotContext()).toBe(0);

      list.setSlotContext(3);

      expect(list.slotContext()).toBe(3);
    });
  });
});
//endregion plugins/sks/_component/window-skill-equip-list.test.js
