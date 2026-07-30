//region plugins/abs/ext/loadout/_models/loadout-slot-catalog.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import InputLegendResolver from '../../../../../../src/plugins/_base/managers/InputLegendResolver.js';
import JABS_Button from '../../../../../../src/plugins/abs/ext/input/_models/JABS_Button.js';

describe('J-ABS-Loadout LoadoutSlotCatalog (unit, real JABS_Button + InputLegendResolver)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/loadout/_models/LoadoutSlotCatalog.js').default} */
  let LoadoutSlotCatalog;

  beforeAll(async () =>
  {
    vi.resetModules();

    // `Array.empty` and `String.empty` are J-Base runtime augmentations, and a direct-import test never
    // boots J-Base. `Array.empty` is the one that bites: JABS_Button.combatSkillComposition ends in
    // `composition ?? Array.empty`, so leaving it undefined makes every non-combat slot return
    // undefined, and describeInput's `composition.length > 0` then throws. That crash reads like a bug
    // in this catalog rather than a missing stub, so seed both before the import evaluates.
    Array.empty = [];
    String.empty = '';

    // both collaborators are real, pure, cleanly importable classes referenced as bare globals exactly
    // as the concatenated runtime would supply them. Using the genuine implementations rather than
    // fakes means the composition rules under test are the ones actually shipping.
    globalThis.JABS_Button = JABS_Button;
    globalThis.InputLegendResolver = InputLegendResolver;

    ({ default: LoadoutSlotCatalog } =
      await import('../../../../../../src/plugins/abs/ext/loadout/_models/LoadoutSlotCatalog.js'));
  });

  afterAll(() =>
  {
    // leave the realm as we found it for any other file sharing this worker.
    delete globalThis.JABS_Button;
    delete globalThis.InputLegendResolver;
    delete Array.empty;
    delete String.empty;
  });

  beforeEach(() =>
  {
    // the resolver is one static slot shared by the whole realm, so a registration made by one test
    // would otherwise still be answering during the next- and describeButton delegates straight to it.
    InputLegendResolver.clearResolver();
  });

  describe('slotKeys', () =>
  {
    it('reports every assignable slot in display order', () =>
    {
      // Act.
      const result = LoadoutSlotCatalog.slotKeys();

      // Assert: order is the contract- three windows count rows against this list, so a row means
      // "this slot" only while every column reads the same sequence.
      expect(result)
        .toEqual([
          'Offhand',
          'CombatSkill1',
          'CombatSkill2',
          'CombatSkill3',
          'CombatSkill4',
          'Dodge',
          'Tool',
          'UsableItem',
        ]);
    });

    it('omits mainhand, which the equipped weapon supplies', () =>
    {
      // Act.
      const result = LoadoutSlotCatalog.slotKeys();

      // Assert: offering a row the player cannot assign would imply a choice that does not exist.
      expect(result)
        .not
        .toContain(JABS_Button.Mainhand);
    });
  });

  describe('slotCount', () =>
  {
    it('counts the presented slots', () =>
    {
      // Act & Assert: the windows size their row counts from this rather than a literal.
      expect(LoadoutSlotCatalog.slotCount())
        .toBe(8);
    });
  });

  describe('slotKeyAt', () =>
  {
    it('reports the slot occupying a given row', () =>
    {
      // Act: row zero is the first assignable slot, offhand.
      const result = LoadoutSlotCatalog.slotKeyAt(0);

      // Assert.
      expect(result)
        .toBe(JABS_Button.Offhand);
    });
  });

  describe('describeInput', () =>
  {
    it('joins both halves of a combat skill', () =>
    {
      // Act: combat skills are not bound to one button- each is the trigger modifier held alongside a
      // primary button, so the description has to name both.
      const result = LoadoutSlotCatalog.describeInput(JABS_Button.CombatSkill1);

      // Assert: with no resolver registered each half falls back to its own logical name.
      expect(result)
        .toBe('SkillTrigger + Main');
    });

    it('describes a directly-bound slot as a single input', () =>
    {
      // Act: offhand is bound to one button, so it has no composition to decompose.
      const result = LoadoutSlotCatalog.describeInput(JABS_Button.Offhand);

      // Assert.
      expect(result)
        .toBe('Offhand');
    });

    it('re-resolves both halves of a composed slot through the registered resolver', () =>
    {
      // Arrange: stand in for the plugin that owns the live input mapping.
      const glyphs = {
        SkillTrigger: 'L2',
        Main: 'Square',
      };
      InputLegendResolver.registerResolver(button => glyphs[button] ?? String.empty);

      // Act.
      const result = LoadoutSlotCatalog.describeInput(JABS_Button.CombatSkill1);

      // Assert: remapping either half has to move the label, which is the whole reason this is
      // assembled at read time rather than written into a string.
      expect(result)
        .toBe('L2 + Square');
    });

    it('keeps the logical name for a half the resolver cannot describe', () =>
    {
      // Arrange: a resolver that knows the trigger but not the primary button.
      InputLegendResolver.registerResolver(button => (button === 'SkillTrigger'
        ? 'L2'
        : String.empty));

      // Act.
      const result = LoadoutSlotCatalog.describeInput(JABS_Button.CombatSkill1);

      // Assert: a half nobody can describe falls back rather than rendering blank, so the label stays
      // readable instead of collapsing to a dangling separator.
      expect(result)
        .toBe('L2 + Main');
    });
  });

  describe('describeButton', () =>
  {
    it('describes a button as whatever the resolver currently reports', () =>
    {
      // Arrange: a resolver that renames the button, so the assertion can only pass by actually
      // routing through it- asserting the fallback here would hold even if this method stopped
      // consulting the resolver entirely, which is the one thing it exists to do.
      InputLegendResolver.registerResolver(button => (button === JABS_Button.Dodge
        ? 'Circle'
        : String.empty));

      // Act.
      const result = LoadoutSlotCatalog.describeButton(JABS_Button.Dodge);

      // Assert.
      expect(result)
        .toBe('Circle');
    });
  });
});
//endregion plugins/abs/ext/loadout/_models/loadout-slot-catalog.test.js
