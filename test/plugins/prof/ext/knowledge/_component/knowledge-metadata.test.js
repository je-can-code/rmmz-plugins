//region plugins/prof/ext/knowledge/_component/knowledge-metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { setPluginContextToJBase, setPluginContextToJProf } from '../../../_component/fixtures/install-prof-host-globals.js';
import { installKnowledgeHostGlobals, setPluginContextToJKnowledge } from './fixtures/install-knowledge-host-globals.js';

/**
 * The knowledge extension knows nothing about what any kind of knowledge means; every tag, every skill
 * type that produces one, and every thing one can be traded for is authored in configuration. These
 * tests pin the reading of that configuration, because a misread is silent by nature- knowledge simply
 * never accrues, or an exchange is never affordable, and neither says anything at the time.
 */
describe('J-Proficiency-Knowledge metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installKnowledgeHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    // registerFormulaContext() is a static method prof's own initialization.js calls at import time.
    await import('../../../../../../src/plugins/_base/core/objects/Game_Action.js');

    setPluginContextToJProf();

    // the extension gates on the version prof reports, and the shared fixture speaks for an older one.
    globalThis.__PLUGIN_VERSION__ = '2.3.0';
    await import('../../../../../../src/plugins/prof/core/_metadata/initialization.js');

    setPluginContextToJKnowledge();
    await import('../../../../../../src/plugins/prof/ext/knowledge/_metadata/initialization.js');
  });

  describe('reading configuration', () =>
  {
    it('builds every knowledge tag the configuration defines', () =>
    {
      // Arrange- the blocks were read when the namespace was set up.

      // Act
      const { tags } = globalThis.J.PROF.EXT.KNOWLEDGE.Metadata;

      // Assert
      expect(tags.length).toBe(2);
      expect(tags[0].key).toBe('vitest_offense');
      expect(tags[0].name).toBe('Vitest Offense');
      expect(tags[0].iconIndex).toBe(11);
      expect(tags[1].key).toBe('vitest_defense');
    });

    it('keys the skill type mapping by number so a skill can be looked up without stringifying it', () =>
    {
      // Arrange- JSON object keys arrive as strings; a skill's stypeId is a number.

      // Act
      const { skillTypeMapping } = globalThis.J.PROF.EXT.KNOWLEDGE.Metadata;

      // Assert
      expect(skillTypeMapping.has(7)).toBe(true);
      expect(skillTypeMapping.get(7)).toEqual([ 'vitest_offense' ]);
    });

    it('builds every exchange, carrying its output apart into type, id and count', () =>
    {
      // Arrange- the blocks were read when the namespace was set up.

      // Act
      const { exchanges } = globalThis.J.PROF.EXT.KNOWLEDGE.Metadata;

      // Assert
      expect(exchanges.length).toBe(2);
      expect(exchanges[0].key).toBe('vitest_blueprints');
      expect(exchanges[0].tagKey).toBe('vitest_offense');
      expect(exchanges[0].cost).toBe(100);
      expect(exchanges[0].outputType).toBe('i');
      expect(exchanges[0].outputId).toBe(501);
      expect(exchanges[0].outputCount).toBe(1);
    });
  });

  describe('tagKeysForSkillId', () =>
  {
    it('answers with the tags its skill type is mapped to', () =>
    {
      // Arrange- skill type 7 is mapped to offense alone.
      globalThis.$dataSkills = [ null ];
      globalThis.$dataSkills[10] = {
        id: 10,
        stypeId: 7,
      };

      // Act
      const tagKeys = globalThis.J.PROF.EXT.KNOWLEDGE.Metadata.tagKeysForSkillId(10);

      // Assert- defense is mapped too, and must not come along for the ride.
      expect(tagKeys).toEqual([ 'vitest_offense' ]);
    });

    it('answers with every tag when its skill type is mapped to several', () =>
    {
      // Arrange- skill type 9 is mapped to both.
      globalThis.$dataSkills = [ null ];
      globalThis.$dataSkills[11] = {
        id: 11,
        stypeId: 9,
      };

      // Act
      const tagKeys = globalThis.J.PROF.EXT.KNOWLEDGE.Metadata.tagKeysForSkillId(11);

      // Assert
      expect(tagKeys).toEqual([ 'vitest_offense', 'vitest_defense' ]);
    });

    it('answers with nothing when its skill type is not mapped at all', () =>
    {
      // Arrange- skill type 5 is deliberately absent from the mapping.
      globalThis.$dataSkills = [ null ];
      globalThis.$dataSkills[12] = {
        id: 12,
        stypeId: 5,
      };

      // Act
      const tagKeys = globalThis.J.PROF.EXT.KNOWLEDGE.Metadata.tagKeysForSkillId(12);

      // Assert
      expect(tagKeys.length).toBe(0);
    });
  });

  describe('exchangeByKey', () =>
  {
    it('answers with the exchange that was named', () =>
    {
      // Arrange- two exchanges exist, so naming one must not simply return the first.

      // Act
      const exchange = globalThis.J.PROF.EXT.KNOWLEDGE.Metadata.exchangeByKey('vitest_patterns');

      // Assert
      expect(exchange.key).toBe('vitest_patterns');
      expect(exchange.cost).toBe(50);
    });

    it('refuses a key no exchange answers to', () =>
    {
      // Arrange- silently doing nothing would look exactly like an empty wallet.

      // Act & Assert
      expect(() => globalThis.J.PROF.EXT.KNOWLEDGE.Metadata.exchangeByKey('vitest_nonexistent'))
        .toThrow(`there is no knowledge exchange with the key of 'vitest_nonexistent'.`);
    });
  });

  describe('validating configuration', () =>
  {
    it('refuses a skill type mapped to a tag nobody defined', () =>
    {
      // Arrange
      const { Metadata } = globalThis.J.PROF.EXT.KNOWLEDGE;
      const rawMapping = { 3: [ 'vitest_undefined_tag' ] };

      // Act & Assert
      expect(() => Metadata.parseSkillTypeMapping(rawMapping))
        .toThrow(`skill type 3 names the knowledge tag 'vitest_undefined_tag', which is not defined in knowledgeTags.`);
    });

    it('refuses an exchange spending a tag nobody defined', () =>
    {
      // Arrange
      const { Metadata } = globalThis.J.PROF.EXT.KNOWLEDGE;
      const rawExchanges = [
        {
          key: 'vitest_broken',
          tagKey: 'vitest_undefined_tag',
          cost: 1,
          output: {
            id: 1,
            type: 'i',
            count: 1,
          },
        },
      ];

      // Act & Assert
      expect(() => Metadata.parseExchanges(rawExchanges))
        .toThrow(`exchange 'vitest_broken' names the knowledge tag 'vitest_undefined_tag', which is not defined in knowledgeTags.`);
    });

    it('accepts a skill type mapped to a tag that is defined', () =>
    {
      // Arrange- the near-miss to the refusal above; the only difference is that the tag exists.
      const { Metadata } = globalThis.J.PROF.EXT.KNOWLEDGE;
      const rawMapping = { 3: [ 'vitest_defense' ] };

      // Act
      const mapping = Metadata.parseSkillTypeMapping(rawMapping);

      // Assert
      expect(mapping.get(3)).toEqual([ 'vitest_defense' ]);
    });
  });

  describe('configuration that has not been authored yet', () =>
  {
    it('grants nothing to nobody rather than refusing to boot', () =>
    {
      // Arrange- a game that installs this plugin before writing any of its blocks.
      const { Metadata } = globalThis.J.PROF.EXT.KNOWLEDGE;
      const authored = J.PROF.Metadata.ExternalConfig;
      J.PROF.Metadata.ExternalConfig = { conditionals: [] };

      // Act
      Metadata.initializeKnowledge();

      // Assert
      expect(Metadata.tags.length).toBe(0);
      expect(Metadata.skillTypeMapping.size).toBe(0);
      expect(Metadata.exchanges.length).toBe(0);

      // put the authored config back, since the rest of the suite reads it.
      J.PROF.Metadata.ExternalConfig = authored;
      Metadata.initializeKnowledge();
    });
  });
});
//endregion plugins/prof/ext/knowledge/_component/knowledge-metadata.test.js