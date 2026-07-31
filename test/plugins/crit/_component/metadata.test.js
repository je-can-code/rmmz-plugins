//region plugins/crit/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installJBaseHostGlobals } from '../../_base/_component/fixtures/install-j-base-host-globals.js';
import PluginMetadata from '../../../../src/plugins/_base/models/PluginMetadata.js';

describe('J-CriticalFactors metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installJBaseHostGlobals();
    globalThis.PluginMetadata = PluginMetadata;
    globalThis.PluginManager = { parameters: () => ({}) };

    globalThis.__PLUGIN_NAME__ = 'J-Base';
    globalThis.__PLUGIN_VERSION__ = '3.2.0';
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    globalThis.__PLUGIN_NAME__ = 'J-CriticalFactors';
    globalThis.__PLUGIN_VERSION__ = '1.0.0';
    await import('../../../../src/plugins/crit/core/_metadata/initialization.js');
  });

  describe('boolean crit notetags', () =>
  {
    it('matches the always-crit marker tag', () =>
    {
      // Arrange
      const { ThisCritsAlways } = globalThis.J.CRIT.RegExp;

      // Act
      const matches = [ ...'<thisCritsAlways>'.matchAll(ThisCritsAlways) ];

      // Assert
      expect(matches).toHaveLength(1);
    });

    it('matches the forced crit proc marker tag', () =>
    {
      // Arrange
      const { ForceCritProcs } = globalThis.J.CRIT.RegExp;

      // Act & Assert
      expect('<forceCritProcs>'.match(ForceCritProcs)).not.toBeNull();
    });
  });

  describe('conditional crit notetags', () =>
  {
    it('captures the state id and chance bonus from a state-gated crit chance tag', () =>
    {
      // Arrange
      const { ThisCritChanceIfState } = globalThis.J.CRIT.RegExp;

      // Act
      const [ first ] = [ ...'<thisCritChanceIfState:[19, 25]>'.matchAll(ThisCritChanceIfState) ];

      // Assert
      expect(first[1]).toBe('[19, 25]');
    });

    it('captures a hyphenated type classifier from a state-type-gated crit chance tag', () =>
    {
      // Arrange
      const { ThisCritChanceIfStateType } = globalThis.J.CRIT.RegExp;

      // Act
      const [ first ] = [ ...'<thisCritChanceIfStateType:[frost-bitten, 30]>'.matchAll(ThisCritChanceIfStateType) ];

      // Assert
      expect(first[1]).toBe('[frost-bitten, 30]');
    });

    it('refuses a type classifier that opens with a digit', () =>
    {
      // Arrange
      const { ThisCritChanceIfStateType } = globalThis.J.CRIT.RegExp;

      // Act
      const matches = [ ...'<thisCritChanceIfStateType:[2fast, 30]>'.matchAll(ThisCritChanceIfStateType) ];

      // Assert: classifiers are names, so a leading digit means the tag is simply invalid.
      expect(matches).toHaveLength(0);
    });

    it('captures a lone state id from a guaranteed-crit tag', () =>
    {
      // Arrange
      const { ThisCritsAlwaysIfState } = globalThis.J.CRIT.RegExp;

      // Act
      const [ first ] = [ ...'<thisCritsAlwaysIfState:[19]>'.matchAll(ThisCritsAlwaysIfState) ];

      // Assert
      expect(first[1]).toBe('[19]');
    });

    it('captures a full list of state ids from a guaranteed-crit tag', () =>
    {
      // Arrange
      const { ThisCritsAlwaysIfState } = globalThis.J.CRIT.RegExp;

      // Act
      const [ first ] = [ ...'<thisCritsAlwaysIfState:[19, 20, 21]>'.matchAll(ThisCritsAlwaysIfState) ];

      // Assert: any one of the listed states is enough, so they arrive together.
      expect(first[1]).toBe('[19, 20, 21]');
    });
  });

  describe('tag scoping', () =>
  {
    // the this-skill family and the attacker-wide family are deliberately near-identical in
    // spelling, so the only thing keeping them apart is the leading `this`. If either pattern
    // matched the other's text, a skill-only bonus would silently become an always-on one.
    it('does not let the attacker-wide chance tag match the skill-scoped spelling', () =>
    {
      // Arrange
      const { CritChanceIfState } = globalThis.J.CRIT.RegExp;

      // Act
      const matches = [ ...'<thisCritChanceIfState:[19, 25]>'.matchAll(CritChanceIfState) ];

      // Assert
      expect(matches).toHaveLength(0);
    });

    it('does not let the skill-scoped chance tag match the attacker-wide spelling', () =>
    {
      // Arrange
      const { ThisCritChanceIfState } = globalThis.J.CRIT.RegExp;

      // Act
      const matches = [ ...'<critChanceIfState:[19, 25]>'.matchAll(ThisCritChanceIfState) ];

      // Assert
      expect(matches).toHaveLength(0);
    });

    it('does not let the attacker-wide apply tag match the skill-scoped spelling', () =>
    {
      // Arrange
      const { OnCritApply } = globalThis.J.CRIT.RegExp;

      // Act
      const matches = [ ...'<thisCritApply:[19, 100]>'.matchAll(OnCritApply) ];

      // Assert
      expect(matches).toHaveLength(0);
    });
  });

  describe('on-crit state application notetags', () =>
  {
    it('captures the state and chance applied to the target on a crit', () =>
    {
      // Arrange
      const { ThisCritApply } = globalThis.J.CRIT.RegExp;

      // Act
      const [ first ] = [ ...'<thisCritApply:[19, 100]>'.matchAll(ThisCritApply) ];

      // Assert
      expect(first[1]).toBe('[19, 100]');
    });

    it('captures the state and chance applied to oneself on a crit', () =>
    {
      // Arrange
      const { ThisCritSelf } = globalThis.J.CRIT.RegExp;

      // Act
      const [ first ] = [ ...'<thisCritSelf:[42, 50]>'.matchAll(ThisCritSelf) ];

      // Assert
      expect(first[1]).toBe('[42, 50]');
    });

    it('captures every application when a note stacks several on-crit tags', () =>
    {
      // Arrange
      const { OnCritApply } = globalThis.J.CRIT.RegExp;
      const note = '<onCritApply:[19, 100]>\n<onCritApply:[20, 25]>';

      // Act
      const matches = [ ...note.matchAll(OnCritApply) ];

      // Assert
      expect(matches.map(match => match[1])).toEqual([ '[19, 100]', '[20, 25]' ]);
    });
  });

  describe('crit damage notetags', () =>
  {
    it('captures a base crit multiplier value', () =>
    {
      // Arrange
      const { CritDamageMultiplierBase } = globalThis.J.CRIT.RegExp;

      // Act
      const [ first ] = [ ...'<critMultiplierBase:150>'.matchAll(CritDamageMultiplierBase) ];

      // Assert
      expect(first[1]).toBe('150');
    });

    it('tolerates the single optional space the tag format allows after the colon', () =>
    {
      // Arrange
      const { CritDamageReduction } = globalThis.J.CRIT.RegExp;

      // Act
      const [ first ] = [ ...'<critReduction: 40>'.matchAll(CritDamageReduction) ];

      // Assert
      expect(first[1]).toBe('40');
    });

    it('captures a formula expression from a crit damage growth tag', () =>
    {
      // Arrange
      const { CritDamageMultiplierGrowthPlus } = globalThis.J.CRIT.RegExp;

      // Act
      const [ first ] = [ ...'<cdmGrowthPlus:[(a.level / 2) + 1]>'.matchAll(CritDamageMultiplierGrowthPlus) ];

      // Assert
      expect(first[1]).toBe('(a.level / 2) + 1');
    });

    it('captures a formula expression from a crit taken rate buff tag', () =>
    {
      // Arrange
      const { CritTakenRateBuffPlus } = globalThis.J.CRIT.RegExp;

      // Act
      const [ first ] = [ ...'<ctrBuffPlus:[a.level * 3]>'.matchAll(CritTakenRateBuffPlus) ];

      // Assert
      expect(first[1]).toBe('a.level * 3');
    });
  });
});
//endregion plugins/crit/_component/metadata.test.js
