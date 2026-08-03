//region plugins/extend/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installExtendHostGlobals, setPluginContextToJBase, setPluginContextToJExtend } from './fixtures/install-extend-host-globals.js';

describe('J-Extend metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installExtendHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJExtend();
    await import('../../../../src/plugins/extend/core/_metadata/initialization.js');
  });

  describe('skill extension notetags', () =>
  {
    it('captures a lone extension id', () =>
    {
      // Arrange
      const { Extend } = globalThis.J.EXTEND.RegExp;

      // Act & Assert
      expect('<extend:[7]>'.match(Extend)[1]).toBe('[7]');
    });

    it('captures a comma-separated list of extension ids', () =>
    {
      // Arrange
      const { Extend } = globalThis.J.EXTEND.RegExp;

      // Act & Assert: one tag may extend several skills at once.
      expect('<extend:[7, 8, 9]>'.match(Extend)[1]).toBe('[7, 8, 9]');
    });

    it('refuses an extension list holding a non-numeric id', () =>
    {
      // Arrange
      const { Extend } = globalThis.J.EXTEND.RegExp;

      // Act & Assert
      expect('<extend:[7, poison]>'.match(Extend)).toBeNull();
    });

    it('captures a hyphenated classifier from a type-based extension tag', () =>
    {
      // Arrange
      const { ExtendType } = globalThis.J.EXTEND.RegExp;

      // Act & Assert
      expect('<extendType:low-effort>'.match(ExtendType)[1]).toBe('low-effort');
    });
  });

  describe('apply-state notetag arity', () =>
  {
    it('captures the two-argument form carrying only a state and a chance', () =>
    {
      // Arrange
      const { ApplyState } = globalThis.J.EXTEND.RegExp;

      // Act
      const [ first ] = [ ...'<applyState:[12, 100]>'.matchAll(ApplyState) ];

      // Assert
      expect(first[1]).toBe('[12, 100]');
    });

    it('captures the three-argument form that overrides duration', () =>
    {
      // Arrange
      const { ApplyState } = globalThis.J.EXTEND.RegExp;

      // Act
      const [ first ] = [ ...'<applyState:[12, 100, 600]>'.matchAll(ApplyState) ];

      // Assert
      expect(first[1]).toBe('[12, 100, 600]');
    });

    it('captures the four-argument form that also overrides stacks', () =>
    {
      // Arrange
      const { ApplyState } = globalThis.J.EXTEND.RegExp;

      // Act
      const [ first ] = [ ...'<applyState:[12, 100, 600, 3]>'.matchAll(ApplyState) ];

      // Assert
      expect(first[1]).toBe('[12, 100, 600, 3]');
    });

    it('captures a negative duration, which is what forces a state indefinite', () =>
    {
      // Arrange
      const { ApplyState } = globalThis.J.EXTEND.RegExp;

      // Act
      const [ first ] = [ ...'<applyState:[12, 100, -1]>'.matchAll(ApplyState) ];

      // Assert: losing the sign here would silently turn "indefinite" into a 1-frame state.
      expect(first[1]).toBe('[12, 100, -1]');
    });

    it('captures every apply-state tag when a note stacks more than one', () =>
    {
      // Arrange
      const { ApplyState } = globalThis.J.EXTEND.RegExp;
      const note = '<applyState:[12, 100]>\n<applyState:[13, 50, 300]>';

      // Act
      const matches = [ ...note.matchAll(ApplyState) ];

      // Assert
      expect(matches).toHaveLength(2);
      expect(matches[1][1]).toBe('[13, 50, 300]');
    });

    it('captures the skill-scoped variant independently of the caster-wide one', () =>
    {
      // Arrange
      const { ThisApplyState } = globalThis.J.EXTEND.RegExp;

      // Act
      const [ first ] = [ ...'<thisApplyState:[8, 25, 240]>'.matchAll(ThisApplyState) ];

      // Assert
      expect(first[1]).toBe('[8, 25, 240]');
    });
  });

  describe('state toggle notetags', () =>
  {
    it('captures a scalar state id from a toggle-on-execute tag', () =>
    {
      // Arrange
      const { ToggleOnExecute } = globalThis.J.EXTEND.RegExp;

      // Act
      const [ first ] = [ ...'<toggleOnExecute:12>'.matchAll(ToggleOnExecute) ];

      // Assert
      expect(first[1]).toBe('12');
    });

    it('captures each independently toggled state when a skill flips several', () =>
    {
      // Arrange
      const { ToggleOnExecute } = globalThis.J.EXTEND.RegExp;

      // Act
      const matches = [ ...'<toggleOnExecute:12>\n<toggleOnExecute:13>'.matchAll(ToggleOnExecute) ];

      // Assert
      expect(matches.map(match => match[1])).toEqual([ '12', '13' ]);
    });

    it('captures the whole id list from a cycle-group toggle tag', () =>
    {
      // Arrange
      const { ToggleGroupOnExecute } = globalThis.J.EXTEND.RegExp;

      // Act
      const [ first ] = [ ...'<toggleGroupOnExecute:[12, 13, 14]>'.matchAll(ToggleGroupOnExecute) ];

      // Assert: the group is coupled, so the ids have to arrive together rather than one per match.
      expect(first[1]).toBe('[12, 13, 14]');
    });
  });

  describe('conditional cast notetags', () =>
  {
    it('captures the payload, chance, and required state from a gated self-state tag', () =>
    {
      // Arrange
      const { OnCastSelfStateIfAfflicted } = globalThis.J.EXTEND.RegExp;

      // Act
      const [ first ] = [ ...'<onCastSelfStateIfAfflicted:[42, 100, 19]>'.matchAll(OnCastSelfStateIfAfflicted) ];

      // Assert
      expect(first[1]).toBe('[42, 100, 19]');
    });

    it('captures the payload, chance, and required state from a gated execute-skill tag', () =>
    {
      // Arrange
      const { OnCastExecuteSkillIfAfflicted } = globalThis.J.EXTEND.RegExp;

      // Act
      const [ first ] = [ ...'<onCastExecuteSkillIfAfflicted:[267, 100, 134]>'.matchAll(OnCastExecuteSkillIfAfflicted) ];

      // Assert
      expect(first[1]).toBe('[267, 100, 134]');
    });

    it('captures each chained follow-up skill from repeated execute-skill tags', () =>
    {
      // Arrange
      const { OnCastExecuteSkill } = globalThis.J.EXTEND.RegExp;
      const note = '<onCastExecuteSkill:[1026, 100]>\n<onCastExecuteSkill:[1027, 50]>';

      // Act
      const matches = [ ...note.matchAll(OnCastExecuteSkill) ];

      // Assert
      expect(matches.map(match => match[1])).toEqual([ '[1026, 100]', '[1027, 50]' ]);
    });

    it('captures the state and chance from an on-hit self-state tag', () =>
    {
      // Arrange
      const { OnHitSelfState } = globalThis.J.EXTEND.RegExp;

      // Act & Assert
      expect('<onHitSelfState:[19, 100]>'.match(OnHitSelfState)[1]).toBe('[19, 100]');
    });
  });
});
//endregion plugins/extend/_component/metadata.test.js
