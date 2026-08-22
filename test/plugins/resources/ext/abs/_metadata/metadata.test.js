//region plugins/resources/ext/abs/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installResourcesHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJResourcesAbs,
} from '../../../_component/fixtures/install-resources-host-globals.js';

describe('J-Resources-ABS metadata (direct src import)', () =>
{
  /** @type {object} the regexp table this plugin publishes for its notetags. */
  let RegExp;

  beforeAll(async () =>
  {
    vi.resetModules();

    installResourcesHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJResourcesAbs();
    await import('../../../../../../src/plugins/resources/ext/abs/_metadata/initialization.js');

    ({ RegExp } = globalThis.J.RESOURCES.EXT.ABS);
  });

  describe('alias surface', () =>
  {
    it('declares an aliased-method map for every class the plugin patches', () =>
    {
      // Arrange & Act
      const { Aliased } = globalThis.J.RESOURCES.EXT.ABS;

      // Assert- a missing map surfaces later as "cannot read set of undefined" at patch time.
      expect(Aliased.JABS_Engine).toBeInstanceOf(Map);
      expect(Aliased.Game_Battler).toBeInstanceOf(Map);
      expect(Aliased.Scene_Boot).toBeInstanceOf(Map);
    });

    it('completes the base plugin metadata initialization it extends', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.RESOURCES.EXT.ABS.Metadata.parsedPluginParameters).toBeDefined();
    });

    it('falls back to a cascade depth of five when the project names none', () =>
    {
      // Arrange & Act & Assert- this number is the only thing standing between a pair of mutually
      // triggering heal tags and an unbounded cascade, so it has to be a usable count rather than
      // whatever an unparsed parameter happens to coerce to.
      expect(globalThis.J.RESOURCES.EXT.ABS.Metadata.healChainDepth).toBe(5);
    });
  });

  describe('on-attack gain notetags', () =>
  {
    it('captures a flat gain amount', () =>
    {
      // Arrange & Act
      const [ first ] = [ ...'<on-attack-hp-gain:25>'.matchAll(RegExp.OnAttackHpGainFlat) ];

      // Assert
      expect(first[1]).toBe('25');
    });

    it('captures a negative flat gain, which drains rather than restores', () =>
    {
      // Arrange & Act
      const [ first ] = [ ...'<on-attack-mp-gain:-10>'.matchAll(RegExp.OnAttackMpGainFlat) ];

      // Assert
      expect(first[1]).toBe('-10');
    });

    it('captures a percent gain', () =>
    {
      // Arrange & Act
      const [ first ] = [ ...'<on-attack-tp-gain:15%>'.matchAll(RegExp.OnAttackTpGainPercent) ];

      // Assert
      expect(first[1]).toBe('15');
    });

    it('captures a formula gain', () =>
    {
      // Arrange & Act
      const [ first ] = [ ...'<on-attack-hp-gain:[(a.atk / 4) + 2]>'.matchAll(RegExp.OnAttackHpGainFormula) ];

      // Assert
      expect(first[1]).toBe('(a.atk / 4) + 2');
    });

    it('does not let the flat pattern claim a percent tag', () =>
    {
      // Arrange & Act
      const matches = [ ...'<on-attack-hp-gain:25%>'.matchAll(RegExp.OnAttackHpGainFlat) ];

      // Assert: flat and percent differ only by a trailing sign, so a flat match here would turn
      // "25% of max hp" into a flat 25.
      expect(matches).toHaveLength(0);
    });

    it('keeps each resource flavor of the tag distinct from the others', () =>
    {
      // Arrange & Act
      const matches = [ ...'<on-attack-hp-gain:25>'.matchAll(RegExp.OnAttackMpGainFlat) ];

      // Assert
      expect(matches).toHaveLength(0);
    });
  });

  describe('when-hit gain notetags', () =>
  {
    it('captures a flat gain amount', () =>
    {
      // Arrange & Act
      const [ first ] = [ ...'<when-hit-hp-gain:8>'.matchAll(RegExp.WhenHitHpGainFlat) ];

      // Assert
      expect(first[1]).toBe('8');
    });

    it('captures a percent gain', () =>
    {
      // Arrange & Act
      const [ first ] = [ ...'<when-hit-mp-gain:5%>'.matchAll(RegExp.WhenHitMpGainPercent) ];

      // Assert
      expect(first[1]).toBe('5');
    });

    it('captures a formula gain', () =>
    {
      // Arrange & Act
      const [ first ] = [ ...'<when-hit-tp-gain:[b.level * 2]>'.matchAll(RegExp.WhenHitTpGainFormula) ];

      // Assert
      expect(first[1]).toBe('b.level * 2');
    });

    it('refuses a negative amount, unlike its on-attack counterpart', () =>
    {
      // Arrange & Act
      const matches = [ ...'<when-hit-hp-gain:-8>'.matchAll(RegExp.WhenHitHpGainFlat) ];

      // Assert: being hit is allowed to restore a resource but never to drain one, so the sign is
      // deliberately absent from this half of the family.
      expect(matches).toHaveLength(0);
    });
  });

  describe('steal notetags', () =>
  {
    it('captures a lifesteal rate', () =>
    {
      // Arrange & Act
      const [ first ] = [ ...'<lst:20>'.matchAll(RegExp.Lifesteal) ];

      // Assert
      expect(first[1]).toBe('20');
    });

    it('captures a negative manasteal rate, which bleeds mana to the target instead', () =>
    {
      // Arrange & Act
      const [ first ] = [ ...'<mst:-5>'.matchAll(RegExp.Manasteal) ];

      // Assert
      expect(first[1]).toBe('-5');
    });

    it('captures a techsteal rate', () =>
    {
      // Arrange & Act
      const [ first ] = [ ...'<tst:12>'.matchAll(RegExp.Techsteal) ];

      // Assert
      expect(first[1]).toBe('12');
    });
  });

  describe('on-self-heal notetags', () =>
  {
    it('captures the two-argument form', () =>
    {
      // Arrange & Act
      const [ first ] = [ ...'<onSelfHpHealMp:[10, 50]>'.matchAll(RegExp.OnSelfHpHealMp) ];

      // Assert
      expect(first[1]).toBe('[10, 50]');
    });

    it('captures the optional third argument when present', () =>
    {
      // Arrange & Act
      const [ first ] = [ ...'<onSelfMpHealTp:[10, 50, 3]>'.matchAll(RegExp.OnSelfMpHealTp) ];

      // Assert
      expect(first[1]).toBe('[10, 50, 3]');
    });

    it('keeps each source-to-target heal pairing distinct', () =>
    {
      // Arrange & Act
      const matches = [ ...'<onSelfHpHealMp:[10, 50]>'.matchAll(RegExp.OnSelfTpHealMp) ];

      // Assert: the pairings are near-identically spelled, so a cross-match would reroute a heal
      // onto the wrong trigger entirely.
      expect(matches).toHaveLength(0);
    });
  });
});
//endregion plugins/resources/ext/abs/_metadata/metadata.test.js
